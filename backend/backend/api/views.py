from django.shortcuts import get_object_or_404
from django.http import JsonResponse
from rest_framework.response import Response
from rest_framework.decorators import api_view
from django.db.models import Max, Window, Sum, OuterRef, Subquery, DecimalField, F, Count, Q
from django.db.models.functions import Least, Greatest
from decimal import Decimal
from datetime import timedelta
import math
from collections import defaultdict
from . import models
from . import serializers
from . import utils
import logging
import time

# Logger instance
logger = logging.getLogger(__name__)

# Helper function
def get_delegation_summary(epoch_number):
    """
    Get delegator movements and amounts and compute stake change from MV.
    """
    start_time = time.time()

    start_time_2 = time.time()
    delegations = models.DelegationSummary.objects \
            .filter(epoch_no=epoch_number) \
            .values('epoch_no', 'tx_id', 'slot_no', 'addr_id', 'source_pool_id', 'destination_pool_id', 'movement_type', 'amount') \
            .order_by('slot_no')
    
    print("Took " + str(time.time() - start_time_2) + " seconds to get delegations.")
    logger.info(f"Delegator movement counts and amounts by stake change percents for epoch {epoch_number} retrieved.")

    start_time_3 = time.time()
    # Flatten pool ids into a set
    pool_ids = set()
    for d in delegations:
        if d['source_pool_id']:
            pool_ids.add(d['source_pool_id'])
        if d['destination_pool_id']:
            pool_ids.add(d['destination_pool_id'])

    print("Took " + str(time.time() - start_time_3) + " seconds to flatten to set.")

    # 
    nearest_lower_stake_qs = models.PoolStatsSummary.objects \
            .filter(epoch_no__lte=epoch_number-2, pool_id__in=pool_ids) \
            .order_by('pool_id', '-epoch_no') \
            .distinct('pool_id') \
            .values('pool_id', 'total_stake')
    
    start_time_4 = time.time()
    
    # To dict for fast lookup
    nearest_lower_stake_map = { p['pool_id']: p['total_stake'] for p in nearest_lower_stake_qs }

    # Find pools whose stake wasn't present yet. This means they are only active since this epoch and have never had delegations before. So their stake needs to be taken from + 2 epoch (due to epoch_stake)
    missing_ids = set(pool_ids) - set(nearest_lower_stake_map.keys())

    print("Took " + str(time.time() - start_time_4) + " seconds to compute missing ids.")

    missing_id_stakes_qs = models.PoolStatsSummary.objects \
        .filter(epoch_no=epoch_number+2, pool_id__in=missing_ids) \
        .values('epoch_no', 'pool_id', 'total_stake')
    
    start_time_5 = time.time()
    
    missing_id_stakes_map = { p['pool_id']: p['total_stake'] for p in missing_id_stakes_qs }
    
    final_stakes = {**nearest_lower_stake_map, **missing_id_stakes_map}

    # Flatten addr ids into a set
    addr_ids = set(delegations.values_list('addr_id', flat=True))

    print("Took " + str(time.time() - start_time_5) + " seconds to convert to missing ids to dict.")

    addr_ids_views_qs = models.StakeAddress.objects \
            .filter(id__in=addr_ids) \
            .distinct('id') \
            .values('id', 'view')
    
    # To dict for fast lookup
    addr_ids_views_map = { d['id']: d['view'] for d in addr_ids_views_qs }
    
    # Percentage change in stake calculation
    results = []
    count = 0
    
    for d in delegations:
        source_stake = final_stakes.get(d['source_pool_id'], 0) if d['source_pool_id'] else None
        dest_stake = final_stakes.get(d['destination_pool_id'], 0) if d['destination_pool_id'] else None

        delegation_amount = d['amount'] if d['amount'] is not None else 0

        pct_change_source, pct_change_dest = 0, 0

        # Percentage change calculations
        if d['movement_type'] in ('REDELEGATION', 'UNDELEGATED'):
            if source_stake and source_stake > 0:
                if delegation_amount > source_stake:
                    
                    print(delegation_amount, source_stake, d['movement_type'], d['source_pool_id'])
                    count = count + 1
                pct_change_source = ((delegation_amount / source_stake) * 100).quantize(Decimal('0.01'))
        if d['movement_type'] in ('REDELEGATION', 'NEW_STAKE'):
            if dest_stake and dest_stake > 0:
                pct_change_dest = ((delegation_amount / dest_stake) * 100).quantize(Decimal('0.01'))
        if d['movement_type'] == 'AWAITING_ACTIVATION':
            pct_change_source = None
            pct_change_dest = None

        results.append({
            'tx_id': d['tx_id'],
            'slot_no': d['slot_no'],
            'addr_id': d['addr_id'],
            'addr_view': addr_ids_views_map.get(d['addr_id']),
            'amount': delegation_amount,
            'source_pool_id': d['source_pool_id'],
            'source_stake_change_percent': pct_change_source,
            'destination_pool_id': d['destination_pool_id'],
            'dest_stake_change_percent': pct_change_dest,
            'movement_type': d['movement_type']
        })
    
    print(missing_ids)
    print("Count is " + str(count))

    logger.info("Took " + str(time.time() - start_time) + " seconds to run get_delegation_summary helper function.")
    print("Took " + str(time.time() - start_time) + " seconds to run get_delegation_summary helper function.")

    return results, pool_ids, final_stakes

# Helper function
def get_pool_stats(epoch_number, delegation_ids, pool_stakes):
    """
    Get pool data such as stake, active or not, number of delegators, saturation ratio for epoch from MV.
    """
    start_time = time.time()
    # Get all pool data and not only delegation_ids so that user on the frontend can also see data for non-delegating pools 
    pool_stats_qs = models.PoolStatsSummary.objects \
            .filter(epoch_no=epoch_number) \
            .values('epoch_no', 'pool_id', 'pool_view', 'total_stake', 'delegator_count', 'pledge', 'is_active', 'saturation_ratio')

    # Get pool data for all pools in delegator movements
    ## Get pool ids for comparison
    pool_stats_dict = {p['pool_id']: p for p in pool_stats_qs}

    # For pool ids whose data is not found in current epoch, ex, pool with no delegation change in recent epochs (since epoch_stake only records any changes in stake but not all pools)retired pools, stake not fully redelegated, get pool data from recent epochs below current epoch
    missing_ids = set(delegation_ids) - set(pool_stats_dict.keys())
    
    if missing_ids:

        # Get missing data by keeping missing ids and convert dict to list of dicts
        missing_data = [ {"pool_id": k, "total_stake": v} for k, v in pool_stakes.items() if k in missing_ids ]
        
        pool_views = {
            pool_id: {"pool_view": pool_view, "pledge": pledge}
            for pool_id, pool_view, pledge in models.PoolStatsSummary.objects.filter(pool_id__in=missing_ids).order_by('pool_id', '-epoch_no').values_list('pool_id', 'pool_view', 'pledge') }

        for i in missing_data:
            i['pool_view'] = pool_views.get(i["pool_id"], None).get('pool_view')
            i['delegator_count'] = 0
            i['pledge'] = pool_views.get(i["pool_id"], None).get('pledge')
            i['is_active'] = False
            i['saturation_ratio'] = 0

        pool_stats = list(pool_stats_dict.values()) + missing_data

        # Merge Pool performances
        pool_perf_qs = get_epoch_pool_perf(epoch_number)
        pool_perf_dict = {p['pool_id']: p for p in pool_perf_qs}

        # Merge pool name, ticker, homepage and description
        pool_offchain_data_qs = models.OffChainPoolData.objects.filter(pool_id__in=pool_stats_dict.keys()).values('pool_id','json')
        pool_offchain_data_dict = {p['pool_id']: p['json'] for p in pool_offchain_data_qs}

        # Append performance data to pools
        for i in pool_stats:
            i['name'] = pool_offchain_data_dict.get(i['pool_id'], {}).get('name', 0)
            i['ticker'] = pool_offchain_data_dict.get(i['pool_id'], {}).get('ticker', 0)
            i['homepage'] = pool_offchain_data_dict.get(i['pool_id'], {}).get('homepage', 0)
            i['description'] = pool_offchain_data_dict.get(i['pool_id'], {}).get('description', 0)
            i['actual_blocks'] = pool_perf_dict.get(i['pool_id'], {}).get('actual_blocks', 0)
            i['expected_blocks'] = pool_perf_dict.get(i['pool_id'], {}).get('expected_blocks', 0)
            i['performance_ratio'] = utils.safe_divide(i['actual_blocks'], i['expected_blocks'])

    logger.info("Took " + str(time.time() - start_time) + " seconds to run get_pool_stats helper function.")
    print("Took " + str(time.time() - start_time) + " seconds to run get_pool_stats helper function.")

    return pool_stats

# Helper function
def get_epoch_pool_perf(epoch_number):
    """
    Get number of blocks minted and expected number of blocks minted from MV.
    """
    start_time = time.time()
    epoch_params_qs = models.PoolPerfSummary.objects \
            .filter(epoch_no=epoch_number) \
            .values('epoch_no', 'pool_id', 'actual_blocks', 'expected_blocks')
    
    logger.info("Took " + str(time.time() - start_time) + " seconds to run get_epoch_pool_perf helper function.")
    print("Took " + str(time.time() - start_time) + " seconds to run get_epoch_pool_perf helper function.")
    return epoch_params_qs

@api_view(['GET'])
def get_epoch_snapshot(request):
    start_time = time.time()
    
    epoch_qparam = request.GET.get('epoch')

    # Min and max epoch numbers available
    min_max_epoch = utils.get_min_max_epoch()
    MIN_EPOCH = min_max_epoch[0]
    MAX_EPOCH = min_max_epoch[1]
    
    ## Validation
    # If request includes epoch number, use it otherwise get most recent epoch
    if epoch_qparam:
        epoch_number = utils.validate_epoch(epoch_qparam)
        if isinstance(epoch_number, JsonResponse):
            logger.info("Running get_epoch_snapshot for epoch " + str(epoch_number))
            return epoch_number
    else:
        epoch_number = MAX_EPOCH
        if epoch_number is None:
            return JsonResponse({'Error': 'No stake data found for epoch.'}, status=404)

    # Delegation movements
    delegations_data, delegations_ids, pool_stakes = get_delegation_summary(epoch_number)
    
    # Pool statistics in epoch
    pool_stats = get_pool_stats(epoch_number, delegations_ids, pool_stakes)
    
    # Merge data
    combined = []
    combined.append({
        "delegation_movements": delegations_data,
        "pool_stats": pool_stats,
        "min_max_epoch": min_max_epoch
    })

    logger.info("Took " + str(time.time() - start_time) + " seconds to run get_epoch_snapshot view.")
    print("Took " + str(time.time() - start_time) + " seconds to run get_epoch_snapshot view.")

    return Response(combined)

# Helper function
def get_nearest_epoch(missing_epoch, existing_epochs_map):
    """
    Finds the nearest existing epoch
    """
    if not existing_epochs_map:
        return None

    min_diff = math.inf
    nearest_epoch = None
    
    # Iterate through all existing epochs to find the minimum absolute difference
    for epoch, value in existing_epochs_map.items():
        diff = abs(epoch - missing_epoch)
        
        if diff < min_diff:
            min_diff = diff
            nearest_epoch = value
        elif diff == min_diff:
            # Optional: handle ties (e.g., prefer the smaller number or the one first encountered)
            # For simplicity, we just stick with the first one found that minimizes the diff.
            pass
            
    return nearest_epoch

@api_view(['GET'])
def get_epochs(request):

    start_time = time.time()
    
    # full_qparam = request.GET.get('full')

    # Min and max epoch numbers available
    min_max_epoch = utils.get_min_max_epoch()
    MIN_EPOCH = min_max_epoch[0]
    MAX_EPOCH = min_max_epoch[1]

    epochs_qs = models.EpochSummary.objects \
            .values('epoch_no', 'start_time', 'end_time').distinct('epoch_no')
        
    existing_epochs_map = { e['epoch_no']: {'start_time': e['start_time'],'end_time': e['end_time']} for e in epochs_qs }

    # Generate set of all epochs
    full_range_epochs = set(range(MIN_EPOCH, MAX_EPOCH + 1))
    
    # Identify existing epochs and calculate the missing set
    existing_epochs = set(existing_epochs_map.keys())
    missing_epochs = sorted(list(full_range_epochs - existing_epochs))
    
    # 2. Interpolation Logic
    for missing_epoch in missing_epochs:
        nearest_epoch = get_nearest_epoch(missing_epoch, existing_epochs_map)
        
        if nearest_epoch:
            # Calculate the new times by adding 5 days (timedelta) to the nearest entry's times
            epoch_start_time = nearest_epoch['start_time'] + timedelta(days=5)
            epoch_end_time = nearest_epoch['end_time'] + timedelta(days=5)
            
            existing_epochs_map[missing_epoch] = {
                'start_time': epoch_start_time, 
                'end_time': epoch_end_time
            }

    # Sort by epoch numbers
    final_epochs = reversed(sorted(existing_epochs_map.items()))
    return Response(final_epochs)

@api_view(['GET'])
def get_epoch_detail(request, epoch_no):

    epoch_detail = get_object_or_404(models.EpochSummary, epoch_no=epoch_no)
    serializer = serializers.EpochSummarySerializer(epoch_detail)

    # current = models.EpochSummary.objects.filter(epoch_no=epoch_qparam)
    
    # current_serialized = serializers.EpochSummarySerializer(current).data if current else None

    return Response(serializer.data)