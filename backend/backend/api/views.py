from django.shortcuts import render
from django.http import JsonResponse
from rest_framework.response import Response
from rest_framework.decorators import api_view
from django.db.models import Max, Window, Sum, OuterRef, Subquery, DecimalField, F, Count, Q
from django.db.models.functions import Least, Greatest
from decimal import Decimal
from collections import defaultdict
from . import models
from . import serializers
from . import utils
import logging
import time

# Logger instance
logger = logging.getLogger(__name__)

# Helper function
def get_delegator_movement_counts_granular(epoch_number):
    """
    Get delegator movements and amounts and compute stake change
    """
    start_time = time.time()
    delegations = models.MvEpochDelegationMovementsGran.objects \
            .filter(epoch_no=epoch_number) \
            .values('epoch_no', 'tx_id', 'slot_no', 'addr_id', 'source_pool_id', 'destination_pool_id', 'movement_type', 'amount').order_by('slot_no')
    logger.info(f"Delegator movement counts and amounts by stake change percents for epoch {epoch_number} retrieved.")

    pool_ids = set()
    for d in delegations:
        if d['source_pool_id']:
            pool_ids.add(d['source_pool_id'])
        if d['destination_pool_id']:
            pool_ids.add(d['destination_pool_id'])

    pool_stakes = models.MvEpochPoolStats.objects \
            .filter(epoch_no__lte=epoch_number, pool_id__in=pool_ids) \
            .values('epoch_no', 'pool_id', 'total_stake')
    
    # To dict for fast lookup
    pool_stake_map = { p['pool_id']: p['total_stake'] for p in pool_stakes }

    pool_stake_ids = [p['pool_id'] for p in pool_stakes]

    # Find pools whose stake wasn't present yet. This means they are only active since this epoch and have never had delegations before. So their stake needs to be taken from + 2 epoch (due to epoch_stake)
    missing_ids = []
    [missing_ids.append(i) for i in pool_ids if i not in pool_stake_ids]

    missing_id_stakes = models.MvEpochPoolStats.objects \
        .filter(epoch_no=epoch_number+2, pool_id__in=missing_ids) \
        .values('epoch_no', 'pool_id', 'total_stake')
    
    missing_id_stakes_map = { p['pool_id']: p['total_stake'] for p in missing_id_stakes }
    
    pool_stake_map.update(missing_id_stakes_map)
    # Percentage change in stake calculation
    results = []
    for d in delegations:
        source_stake = pool_stake_map.get(d['source_pool_id'], 0) if d['source_pool_id'] else None
        dest_stake = pool_stake_map.get(d['destination_pool_id'], 0) if d['destination_pool_id'] else None

        delegation_amount = d['amount'] if d['amount'] is not None else 0

        pct_change_source, pct_change_dest = 0, 0

        # Percentage change calculations
        if d['movement_type'] in ('REDELEGATION', 'UNDELEGATED'):
            if source_stake and source_stake > 0:
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
            'amount': delegation_amount,
            'source_pool_id': d['source_pool_id'],
            'source_stake_change_percent': pct_change_source,
            'destination_pool_id': d['destination_pool_id'],
            'dest_stake_change_percent': pct_change_dest,
            'movement_type': d['movement_type']
        })
    
    logger.info("Took " + str(time.time() - start_time) + " seconds to run get_delegator_movement_counts_granular helper function.")
    print("Took " + str(time.time() - start_time) + " seconds to run get_delegator_movement_counts_granular helper function.")

    return results, pool_ids, pool_stake_map

# Helper function
def get_delegator_movement_counts_percents(epoch_number):
    """
    Get effective delegator movement counts and amounts by stake change percents
    """
    delegator_movement_percents = models.MvEpochDelegationMovAmtCountsPercent.objects \
            .filter(epoch_no=epoch_number) \
            .values('epoch_no', 'source_pool_id', 'source_stake_change_percent', 'destination_pool_id', 'dest_stake_change_percent', 'movement_count', 'movement_amount')    
    logger.info(f"Delegator movement counts and amounts by stake change percents for epoch {epoch_number} retrieved.")
    print(f"Delegator movement counts and amounts by stake change percents for epoch {epoch_number} retrieved.")
    return delegator_movement_percents

# Helper function
def get_pool_stats(epoch_number):
    pool_stats = models.MvEpochPoolStats.objects \
            .filter(epoch_no=epoch_number) \
            .values('epoch_no', 'pool_id', 'pool_view', 'total_stake', 'delegator_count', 'pledge', 'is_active', 'saturation_ratio')
    logger.info(f"Pool stats for epoch {epoch_number} retrieved.")
    print(f"Pool stats for epoch {epoch_number} retrieved.")
    return pool_stats

# Helper function
def get_epoch_pool_perf(epoch_number):
    epoch_params = models.MvEpochPoolPerf.objects \
            .filter(epoch_no=epoch_number) \
            .values('epoch_no', 'pool_id', 'actual_blocks', 'expected_blocks')
    logger.info(f"Pool performance values for epoch {epoch_number} retrieved.")
    print(f"Pool performance values for epoch {epoch_number} retrieved.")
    return epoch_params

# Helper function
def get_epoch_params(epoch_number):
    epoch_params = models.MvEpochParams.objects \
            .filter(epoch_no=epoch_number) \
            .values('epoch_no', 'pledge_influence', 'decentralisation', 'saturation_point')
    logger.info(f"Epoch params for epoch {epoch_number} retrieved.")
    print(f"Epoch params for epoch {epoch_number} retrieved.")
    return epoch_params

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
            return epoch_number
    else:
        epoch_number = MAX_EPOCH
        if epoch_number is None:
            return JsonResponse({'Error': 'No stake data found for epoch.'}, status=404)

    # delegator_movement_stake_percents = get_delegator_movement_counts_percents(epoch_number)
    # delegator_movement_stake_percents_ser = serializers.EpochDelegatorsMovCntPercentSerializer(delegator_movement_stake_percents, many=True)
    # delegator_movement_stake_percents_data = delegator_movement_stake_percents_ser.data

    # Delegation movements
    delegations_data, delegations_ids, pool_stakes = get_delegator_movement_counts_granular(epoch_number)
    
    # Pool statistics in epoch
    pool_stats = get_pool_stats(epoch_number)
    pool_stats_ser = serializers.EpochPoolStatsSerializer(pool_stats, many=True)
    pool_stats_data = pool_stats_ser.data

    # Pool performances
    pool_perf = get_epoch_pool_perf(epoch_number)
    pool_perf_ser = serializers.EpochPoolPerfSerializer(pool_perf, many=True)
    pool_perf_data = list(pool_perf_ser.data)

    # Epoch parameters
    epoch_params = get_epoch_params(epoch_number)
    epoch_params_ser = serializers.EpochParamsSerializer(epoch_params, many=True)
    epoch_params_data = epoch_params_ser.data
    
    # Get pool data for all pools in delegator movements
    ## Get pool ids for comparison
    pool_stats_ids = [i['pool_id'] for i in pool_stats_data]
    #delegations_ids = set([val for i in delegations_data for val in (i['source_pool_id'], i['destination_pool_id'])])

    pool_data_final = []

    # For pool ids in current epoch (not retired yet), get pool data from pool stats
    [pool_data_final.append(i) for i in pool_stats_data]

    # For pool ids whose data is not found in current epoch, ex, pool with no delegation change in recent epochs (since epoch_stake only records any changes in stake but not all pools)retired pools, stake not fully redelegated, get pool data from recent epochs below current epoch
    missing_ids = []
    [missing_ids.append(i) for i in delegations_ids if i not in pool_stats_ids]
    
    if missing_ids:

        # Get missing data by keeping missing ids and convert dict to list of dicts
        missing_data = [ {"pool_id": k, "stake": v} for k, v in pool_stakes.items() if k in missing_ids ]
        
        pool_views = models.PoolHash.objects.filter(id__in=missing_ids).values('view').order_by('-id')
        for i in range(len(missing_data)):
            ## TODO Get pool owner pledge if required
            missing_data[i]['pool_view'], missing_data[i]['delegator_count'], missing_data[i]['pledge'], missing_data[i]['is_active'], missing_data[i]['saturation_ratio'] = pool_views.get(i['pool_id'], None), 0, 0, False, 0

        pool_data_final.append(missing_data[0])
        print("Final pool data computed.")

    # Append performance data to pools
    # Dict for easy lookup
    actual_blocks = {item['pool_id']: item['actual_blocks'] for item in pool_perf_data}
    expected_blocks = {item['pool_id']: item['expected_blocks'] for item in pool_perf_data}

    for i in pool_data_final:
        i['actual_blocks'] = actual_blocks.get(i['pool_id'], 0)
        i['expected_blocks'] = expected_blocks.get(i['pool_id'], 0.00)
        i['performance_ratio'] = utils.safe_divide(i['actual_blocks'], i['expected_blocks'])

    # Merge data
    combined = []
    combined.append({
        "delegation_movements": delegations_data,
        "pool_stats": pool_data_final,
        "epoch_params": epoch_params_data,
        "min_max_epoch": min_max_epoch
    })

    logger.info("Took " + str(time.time() - start_time) + " seconds to run get_epoch_snapshot view")
    print("Took " + str(time.time() - start_time) + " seconds to run get_epoch_snapshot view")

    return Response(combined)