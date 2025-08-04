from django.shortcuts import render
from django.http import JsonResponse
from rest_framework.response import Response
from rest_framework.decorators import api_view
from django.db.models import Max, Window, Sum, OuterRef, Subquery, DecimalField, F, Count, Q
from decimal import Decimal
from collections import defaultdict
from . import models
from . import serializers
from . import utils
import logging
import time

# Logger instance
logger = logging.getLogger(__name__)

@api_view(['GET'])
def get_delegators(request):
    start_time = time.time()

    epoch_param = request.GET.get('epoch')
    stake_threshold_param = request.GET.get('stake_threshold')
    
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
        
    # If request includes stake threshold, use it otherwise use default 50%
    if stake_threshold_param:
        stake_threshold = utils.validate_stake_threshold(stake_threshold_param)
        if isinstance(stake_threshold, JsonResponse):
            return stake_threshold
    else:
        stake_threshold = 50
        
    # Get distinct pools
    # pools = models.EpochStake.objects \
    #     .filter(epoch_no=epoch_number) \
    #     .order_by('pool_id') \
    #     .values_list('pool_id', flat=True) \
    #     .distinct() # [:100]
    # print(f'Pools are {pools}')

    # Get all delegators from the distinct pools in epoch_no
    # Filter out rows where amount is 0 to remove addresses which are not part of the pool anymore
    # delegators = models.EpochStake.objects \
    #     .filter(epoch_no=epoch_number, amount__gt=Decimal('0')) \
    #     .order_by('amount') \
    #     .values('addr_id','pool_id','amount','epoch_no') \
    #     .aggregate(total_amount=Sum('amount')) \
    #     .annotate(cumsum=Window(expression=Sum('amount'), order_by='addr_id')) \
    #     .values('addr_id','pool_id', 'epoch_no', 'amount', 'cumsum') \
    #     .order_by('cumsum')
    
    # print(delegators.total_amount)

    # Annotate each pool with its total stake
    pool_totals = models.EpochStake.objects \
        .filter(pool_id=OuterRef('pool_id'), epoch_no=OuterRef('epoch_no')) \
        .annotate(total=Sum('amount')) \
        .values('total')[:1] # Get only total value for each pool
    
    delegations_annotated = models.EpochStake.objects \
        .filter(epoch_no=epoch_number) \
        .annotate(total_pool_amount=Subquery(pool_totals, output_field=DecimalField()),pool_cumulative_amount=Window(expression=Sum('amount'), partition_by=[F('pool_id')], order_by='addr_id'))
    
    print(delegations_annotated)
    print(time.time() - start_time)
    
    # Filtering

    
    # total = delegators.aggregate(Sum('amount'))
    # total = total['amount__sum']
    #print(f'There are {len(delegators)} delegators to {len(pools)} pools. Pools is of type {type(pools)} and delegators is of type {type(delegators)}.')

    # Get delegators above the cumulative stake threshold
    # sort by amount
    
    
    # filter till that index

    # if not delegators:
    #     return JsonResponse({'Error': f'No data found for epoch {epoch_number}'}, status=404)
    # calculate cumulative
    # delegators = delegators \
    #     .annotate(cumsum=Window(expression=Sum('amount'), order_by='addr_id')) \
    #     .values('addr_id','pool_id', 'epoch_no', 'amount', 'cumsum') \
    #     .order_by('cumsum')
    

    
    # calculate index at which threshold is reached
    # index = delegators.filter(cumsum__lt = Decimal(total * stake_threshold)).count()
    # print(total, index)
    
    
    #print(delegators)

    serializer = serializers.EpochStakeSerializer(delegations_annotated, many=True)
    #delegators_list = list(serializer.data)
    #print(delegators_list[0]['amount'])
    logger.info(type(serializer.data))
    return Response(serializer.data)

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
        .values('epoch_no', 'decentralisation', 'optimal_pool_count')

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
        ada = next((x['total'] for x in total_ada if x['epoch_no'] == epoch), 0)
        slots = next((x['block_count'] for x in active_slots if x['epoch_no'] == epoch), 0)

        ## Expected block production = active slots * (1-centralization factor)*pool_size/ total staked ada across all pools
        expected_block_count = round(Decimal(str(slots)) * (1 - Decimal(str(decentralisation))) * pool_stake / Decimal(str(ada)), 2)
        actual_block_count = next((x['blocks_minted'] for x in pool_blocks_minted if x['pool_id'] == pool_id and x['epoch_no'] == epoch), 0)
        ## Saturation = total staked ada/k (optimal pool count)
        saturation_point = next((x['saturation_point'] for x in saturation_points if x['epoch_no'] == epoch), 0)
        saturation_percent = round((pool_stake / saturation_point) * 100, 2) # in percent

        result[str(epoch)].append({
            'pool_id' : pool_id,
            'pool_stake': pool_stake,
            'expected_block_count' : expected_block_count,
            'actual_block_count': actual_block_count,
            'saturation_percent': saturation_percent
        })

    logger.debug("Finished calculating pool performance metrics per epoch.")

    return JsonResponse(result, safe=False)