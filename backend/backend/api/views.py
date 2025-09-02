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
def get_delegator_stakes(epoch_number): 
    delegator_stakes = models.MvEpochDelegatorStake2.objects \
            .filter(epoch_no=epoch_number) \
            .values('epoch_no', 'pool_id', 'pool_view', 'stake_addr_id', 'stake_addr_view', 'amount', 'pool_total', 'running_total')
    return delegator_stakes

# Helper function
def get_delegator_movements(epoch_number):
    delegator_movements = models.MvEpochDelegationMovements.objects \
            .filter(epoch_no=epoch_number) \
            .values('epoch_no', 'addr_id', 'stake_addr_view', 'source_pool_id', 'source_pool_view', 'destination_pool_id', 'destination_pool_view', 'amount')
    return delegator_movements

# Helper function
## MV contains A => B and B => A as different transactions. Group them as A <=> B while annotating sum of movement counts and sum of amounts.  
def get_delegator_movement_counts(epoch_number):
    delegator_movement_counts = models.MvEpochDelegationMovAmountCounts.objects \
            .filter(epoch_no=epoch_number) \
            .annotate(pool1=Least('source_pool_id', 'destination_pool_id'),
                      pool2=Greatest('source_pool_id', 'destination_pool_id')) \
            .values('epoch_no', 'pool1', 'pool2') \
            .annotate(movement_count=Sum('movement_count'), movement_amount=Sum('movement_amount')) \
            .order_by('-movement_amount')
    return delegator_movement_counts

# Helper function
def get_pool_stats(epoch_number):
    pool_stats = models.MvEpochPoolStats.objects \
            .filter(epoch_no=epoch_number) \
            .values('epoch_no', 'pool_id', 'pool_view', 'total_stake', 'delegator_count', 'pledge', 'is_active', 'saturation_ratio')
    return pool_stats

# Helper function
def get_epoch_params(epoch_number):
    epoch_params = models.MvEpochParams.objects \
            .filter(epoch_no=epoch_number) \
            .values('epoch_no', 'pledge_influence', 'decentralisation', 'saturation_point')
    return epoch_params

@api_view(['GET'])
def get_epoch_snapshot(request):
    start_time = time.time()

    epoch_qparam = request.GET.get('epoch')
    stake_threshold_qparam = request.GET.get('stake_threshold')
    
    ## Validation
    # If request includes epoch number, use it otherwise get most recent epoch
    if epoch_qparam:
        epoch_number = utils.validate_epoch(epoch_qparam)
        if isinstance(epoch_number, JsonResponse):
            return epoch_number
    else:
        epoch_number = models.EpochStake.objects.aggregate(max_epoch=Max("epoch_no"))["max_epoch"]
        if epoch_number is None:
            return JsonResponse({'Error': 'No epoch stake data found'}, status=404)
        
    # If request includes stake threshold, use it otherwise use default 50%
    if stake_threshold_qparam:
        stake_threshold = utils.validate_stake_threshold(stake_threshold_qparam)
        if isinstance(stake_threshold, JsonResponse):
            return stake_threshold
    else:
        stake_threshold = 50

    ## Get data helper functions and serialize
    # Stakes delegated to pools by addresses
    delegator_stakes = get_delegator_stakes(epoch_number)
    delegator_stakes_ser = serializers.EpochDelegatorsStkSerializer2(delegator_stakes, many=True)
    delegator_stakes_data = delegator_stakes_ser.data

    # Delegation movements from end of previous epoch
    delegator_movements = get_delegator_movements(epoch_number)
    delegator_movements_ser = serializers.EpochDelegatorsMovSerializer(delegator_movements, many=True)
    delegator_movements_data = delegator_movements_ser.data

    # Delegation movements counts between pools from end of previous epoch
    delegator_movement_counts = get_delegator_movement_counts(epoch_number)
    delegator_movement_counts_ser = serializers.EpochDelegatorsMovCountSerializer(delegator_movement_counts, many=True)
    delegator_movement_counts_data = delegator_movement_counts_ser.data
    
    # Pool statistics in epoch
    pool_stats = get_pool_stats(epoch_number)
    pool_stats_ser = serializers.EpochPoolStatsSerializer(pool_stats, many=True)
    pool_stats_data = pool_stats_ser.data

    # Epoch parameters
    epoch_params = get_epoch_params(epoch_number)
    epoch_params_ser = serializers.EpochParamsSerializer(epoch_params, many=True)
    epoch_params_data = epoch_params_ser.data
    
    ## Get pool data for all pools in delegator movements
    # Get pool ids for comparison    
    pool_stats_ids = [i['pool_id'] for i in pool_stats_data]
    delegator_movement_counts_ids = set([val for i in delegator_movement_counts_data for val in (i['pool1'], i['pool2'])])

    pool_data_final = []

    # For pool ids in current epoch (not retired yet), get pool data from pool stats
    #common_pools = set(delegator_movement_counts_ids) & set(pool_stats_ids)
    [pool_data_final.append(i) for i in pool_stats_data]
     # if i['pool_id'] in common_pools]
    #pool_data_final.append(pool_stats_data)
    # For pool ids not in current epoch, i.e., retired pools and stake not fully redelegated, get pool data from previous epoch
    missing_ids = []
    [missing_ids.append(i) for i in delegator_movement_counts_ids if i not in pool_stats_ids]
    
    if missing_ids:
        missing_data = list(models.EpochStake.objects \
            .filter(epoch_no=epoch_number-1, pool_id__in=missing_ids) \
            .values('epoch_no', 'pool_id') \
            .annotate(total_stake=Sum('amount')))
        
        for i in range(len(missing_data)):
            ## TODO Get pool owner pledge if required
            # Add pool view
            pool_view = models.PoolHash.objects.filter(id=missing_data[i]['pool_id']).values('view').order_by('-id').first()
            missing_data[i]['pool_view'], missing_data[i]['delegator_count'], missing_data[i]['pledge'], missing_data[i]['is_active'], missing_data[i]['saturation_ratio'] = pool_view['view'], 0, 0, False, 0

        pool_data_final.append(missing_data[0])

    # Merge data
    combined = []
    combined.append({
        # "delegator_stakes": delegator_stakes_data,
        # "delegator_movements": delegator_movements_data,
        "delegator_movement_counts": delegator_movement_counts_data,
        "pool_stats": pool_data_final,
        "epoch_params": epoch_params_data
    })

    # logger.info("Took " + time.time() - start_time + " seconds to run get_epoch_snapshot view")

    return Response(combined)

@api_view(['GET'])
def get_pools_performance(request):
    epoch_param = request.GET.get('epoch')
    
    ## Validation
    # If request includes epoch number, use it otherwise get most recent epoch
    if epoch_param:
        epoch_number = utils.validate_epoch(epoch_param)
        if isinstance(epoch_number, JsonResponse):
            return epoch_number
    else:
        epoch_number = models.EpochStake.objects.aggregate(max_epoch=Max("epoch_no"))["max_epoch"]
        if epoch_number is None:
            return JsonResponse({'Error': 'No epoch stake data found'}, status=404)
        
    prev_epoch_number = epoch_number - 1
    
    # Get epoch data. 
    # Filter by epoch, group by epoch, count rows
    active_slots = models.Block.objects \
        .filter(Q(epoch_no=prev_epoch_number) | Q(epoch_no=epoch_number)) \
        .values('epoch_no') \
        .annotate(block_count=Count('block_no')) \
        
    logger.debug("Finished retrieving active slots per epoch.")
    
    total_ada = models.EpochStake.objects \
        .filter(Q(epoch_no=prev_epoch_number) | Q(epoch_no=epoch_number)) \
        .values('epoch_no') \
        .annotate(total=Sum('amount'))
    
    logger.debug("Finished retrieving total ada in pools per epoch.")
    
    # Get epoch params
    epoch_params = models.EpochParam.objects \
        .filter(Q(epoch_no=prev_epoch_number) | Q(epoch_no=epoch_number)) \
        .values('epoch_no', 'decentralisation', 'optimal_pool_count', 'influence')

    saturation_points = []
    for epoch_param in epoch_params:
        ada = next((x['total'] for x in total_ada if x['epoch_no'] == epoch_param['epoch_no']), 0)
        saturation_point = ada / epoch_param['optimal_pool_count']
        saturation_points.append({'epoch_no': epoch_param['epoch_no'], 'saturation_point': saturation_point})

    logger.debug("Finished retrieving epoch parameters and calculating saturation point.")
    
    # Annotate each pool with its total stake
    pool_totals = models.EpochStake.objects \
        .filter(Q(epoch_no=prev_epoch_number) | Q(epoch_no=epoch_number)) \
        .values('epoch_no', 'pool_id') \
        .annotate(total_stake=Sum('amount')) \
        .distinct()
    
    logger.debug("Finished calculating total ada per pool per epoch.")
    
    ## Actual block production
    # Get number of blocks minted by each slot leader / pool in each epoch
    no_blocks_minted = models.Block.objects \
        .filter(Q(epoch_no=prev_epoch_number) | Q(epoch_no=epoch_number)) \
        .values('epoch_no', 'slot_leader_id') \
        .annotate(blocks_minted=Count('slot_leader_id')) \
        .distinct()
    
    logger.debug("Finished retrieving number of times pools became slot leader per epoch.")

    delegator_counts = models.EpochStake.objects \
        .filter(Q(epoch_no=prev_epoch_number) | Q(epoch_no=epoch_number)) \
        .values('epoch_no', 'pool_id') \
        .annotate(no_delegators=Count('addr_id')) \
        .distinct()
    
    # No need to filter by epoch since we are first ordering by epoch in desc order
    ## TODO: Get pledge value for nearest lower epoch number
    pledges = models.PoolUpdate.objects \
        .order_by('-active_epoch_no') \
        .values('hash_id', 'pledge') \
        .distinct()
    
    # Convert key name from slot_leader_id to pool_id to make retrieval easier later
    # Get slot_leader_id and its corresponding pool_id
    slot_leaders = models.SlotLeader.objects.values('id', 'pool_hash_id')
    slot_leaders_dict = {sl['id']: sl['pool_hash_id'] for sl in slot_leaders}

    # Merge pool_id to dict with blocks_minted. List of dicts
    pool_blocks_minted = []
    for entry in no_blocks_minted:
        #ada = next(p['slot_leader_id'] for epoch in total_ada if epoch['epoch_no'] == epoch_param['epoch_no']), None
        epoch = entry['epoch_no']
        slot_leader_id = entry['slot_leader_id']
        blocks_minted = entry['blocks_minted']
        pool_id = slot_leaders_dict.get(slot_leader_id, 'Unknown')
        pool_blocks_minted.append({
            'epoch_no': epoch,
            'pool_id': pool_id,
            'blocks_minted': blocks_minted
        })

    logger.debug("Finished mapping slot leader ids to pool ids.")

    # Empty final dict
    result = defaultdict(list)
    
    # Calculate performance metrics
    for pool in pool_totals:
        epoch = pool['epoch_no']
        pool_id = pool['pool_id']
        pool_stake = pool['total_stake']
        decentralisation = next((x['decentralisation'] for x in epoch_params if x['epoch_no'] == epoch), 0)
        pledge_influence = next((x['influence'] for x in epoch_params if x['epoch_no'] == epoch), 0)
        ada = next((x['total'] for x in total_ada if x['epoch_no'] == epoch), 0)
        slots = next((x['block_count'] for x in active_slots if x['epoch_no'] == epoch), 0)
        delegators_count = next((x['no_delegators'] for x in delegator_counts if x['epoch_no'] == epoch and x['pool_id'] == pool_id), 0)

        ## Expected block production = active slots * (1-centralization factor)*pool_size/ total staked ada across all pools
        expected_block_count = round(Decimal(str(slots)) * (1 - Decimal(str(decentralisation))) * pool_stake / Decimal(str(ada)), 2)
        actual_block_count = next((x['blocks_minted'] for x in pool_blocks_minted if x['pool_id'] == pool_id and x['epoch_no'] == epoch), 0)
        ## Saturation = total staked ada/k (optimal pool count)
        saturation_point = next((x['saturation_point'] for x in saturation_points if x['epoch_no'] == epoch), 0)
        saturation_percent = round((pool_stake / saturation_point) * 100, 2) # in percent

        result[str(epoch)].append({
            'pool_id' : pool_id,
            'pool_stake': pool_stake,
            'delegators_count': delegators_count,
            'expected_block_count' : expected_block_count,
            'actual_block_count': actual_block_count,
            'saturation_percent': saturation_percent,
            'decentralisation': decentralisation,
            'pledge_influence': pledge_influence
            #'pledge': pledge,
            #'ros': ros
        })

    logger.debug("Finished calculating pool performance metrics per epoch.")

    return JsonResponse(result, safe=False)