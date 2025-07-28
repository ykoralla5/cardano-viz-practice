from django.shortcuts import render
from django.http import JsonResponse
from rest_framework.response import Response
from rest_framework.decorators import api_view
from django.db.models import Max, Window, Sum, OuterRef, Subquery, DecimalField, F, Count
from decimal import Decimal
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
    start_time = time.time()

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
    
    # Get epoch data
    active_slots = models.Block.objects.filter(epoch_no=epoch_number).count()
    total_ada = models.EpochStake.objects.filter(epoch_no=epoch_number).aggregate(total=Sum('amount'))
    total_ada = total_ada['total'] or 0 # Use 0 if no total exists
    
    # Get epoch params
    epoch_params = models.EpochParam.objects \
        .filter(epoch_no=epoch_number) \
        .values_list('decentralisation', 'optimal_pool_count') \
        .first()
    
    if epoch_params:
        decentralisation, optimal_pool_count = epoch_params
    else:
        decentralisation, optimal_pool_count = None, None
    
    saturation_point = total_ada / optimal_pool_count
    
    # Annotate each pool with its total stake
    pool_totals = models.EpochStake.objects \
        .filter(epoch_no=epoch_number) \
        .values('pool_id').annotate(total_stake=Sum('amount')) \
        .distinct()
    
    ## Actual block production
    # Convert key name from slot_leader_id to pool_id to make retrieval easier later
    no_blocks_minted = models.Block.objects \
        .filter(epoch_no=epoch_number) \
        .values('slot_leader_id') \
        .annotate(blocks_minted=Count('block_no')) \
        .distinct()
    
    # Get slot_leader_id and its corresponding pool_id
    slot_leaders = models.SlotLeader.objects.values('id', 'pool_hash_id')
    slot_leaders_dict = {sl['id']: sl['pool_hash_id'] for sl in slot_leaders}

    # Merge pool_id to dict with blocks_minted. List of dicts
    pool_blocks_minted = []
    for p in no_blocks_minted:
        slot_leader_id = p['slot_leader_id']
        pool_id = slot_leaders_dict.get(slot_leader_id, 'Unknown')
        pool_blocks_minted.append({
            'pool_id': pool_id,
            #'slot_leader_id': slot_leader_id,
            'blocks_minted': p['blocks_minted']
        })

    pools_performance = []
    
    # Calculate performance metrics
    for pool in pool_totals:
        pool_id = pool['pool_id']
        pool_stake = pool['total_stake']

        ## Expected block production = active slots * (1-centralization factor)*pool_size/ total staked ada across all pools
        expected_block_count = Decimal(str(active_slots)) * (1 - Decimal(str(decentralisation))) * pool_stake / Decimal(str(total_ada))
        actual_block_count = next((item['blocks_minted'] for item in pool_blocks_minted if item['pool_id'] == pool_id), 0)
        ## Saturation = total staked ada/k (optimal pool count)
        saturation_percent = (pool_stake / saturation_point) * 100 # in percent

        pool_performance = {
            'pool_id' : pool_id,
            'pool_stake': pool_stake,
            'expected_block_count' : expected_block_count,
            'actual_block_count': actual_block_count,
            'saturation_percent': saturation_percent
        }

        pools_performance.append(pool_performance)

    return JsonResponse({'pools_performance': pools_performance}, safe=False)

