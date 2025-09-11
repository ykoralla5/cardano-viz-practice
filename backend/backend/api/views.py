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
## Get delegator movement counts and amounts by stake change percents
def get_delegator_movement_counts_percents(epoch_number):
    delegator_movement_percents = models.MvEpochDelegationMovAmtCountsPercent.objects \
            .filter(epoch_no=epoch_number) \
            .values('epoch_no', 'source_pool_id', 'source_stake_change_percent', 'destination_pool_id', 'dest_stake_change_percent', 'movement_count', 'movement_amount')    
    logger.info(f"Delegator movement counts and amounts by stake change percents for epoch {epoch_number} retrieved")
    return delegator_movement_percents

# Helper function
def get_pool_stats(epoch_number):
    pool_stats = models.MvEpochPoolStats.objects \
            .filter(epoch_no=epoch_number) \
            .values('epoch_no', 'pool_id', 'pool_view', 'total_stake', 'delegator_count', 'pledge', 'is_active', 'saturation_ratio')
    logger.info(f"Pool stats for epoch {epoch_number} retrieved")
    return pool_stats

# Helper function
def get_epoch_params(epoch_number):
    epoch_params = models.MvEpochParams.objects \
            .filter(epoch_no=epoch_number) \
            .values('epoch_no', 'pledge_influence', 'decentralisation', 'saturation_point')
    logger.info(f"Epoch params for epoch {epoch_number} retrieved")
    return epoch_params

# Helper function
def get_min_max_epoch():
    MIN_EPOCH = 271
    max_epoch = models.EpochStake.objects.aggregate(max_epoch=Max("epoch_no"))["max_epoch"]
    logger.info(f"Min and max epoch numbers retrieved: {MIN_EPOCH}, {max_epoch}")
    return [MIN_EPOCH, max_epoch]

@api_view(['GET'])
def get_epoch_snapshot(request):
    start_time = time.time()

    epoch_qparam = request.GET.get('epoch')
    
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

    # Min and max epoch numbers available
    min_max_epoch = get_min_max_epoch()
    if epoch_number < min_max_epoch[0] or epoch_number > min_max_epoch[1]:
        return JsonResponse({'Error': 'Epoch number must be between ' + str(min_max_epoch[0]) + ' and ' + str(min_max_epoch[1])}, status=400)
    
    delegator_movement_stake_percents = get_delegator_movement_counts_percents(epoch_number)
    delegator_movement_stake_percents_ser = serializers.EpochDelegatorsMovCntPercentSerializer(delegator_movement_stake_percents, many=True)
    delegator_movement_stake_percents_data = delegator_movement_stake_percents_ser.data
    
    # Pool statistics in epoch
    pool_stats = get_pool_stats(epoch_number)
    pool_stats_ser = serializers.EpochPoolStatsSerializer(pool_stats, many=True)
    pool_stats_data = pool_stats_ser.data

    # Epoch parameters
    epoch_params = get_epoch_params(epoch_number)
    epoch_params_ser = serializers.EpochParamsSerializer(epoch_params, many=True)
    epoch_params_data = epoch_params_ser.data
    
    # Get pool data for all pools in delegator movements
    ## Get pool ids for comparison    
    pool_stats_ids = [i['pool_id'] for i in pool_stats_data]
    delegator_movement_counts_ids = set([val for i in delegator_movement_stake_percents_data for val in (i['source_pool_id'], i['destination_pool_id'])])

    pool_data_final = []

    # For pool ids in current epoch (not retired yet), get pool data from pool stats
    [pool_data_final.append(i) for i in pool_stats_data]

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
        "delegator_movement_counts": delegator_movement_stake_percents_data,
        "pool_stats": pool_data_final,
        "epoch_params": epoch_params_data,
        "min_max_epoch": min_max_epoch
    })

    logger.info("Took " + str(time.time() - start_time) + " seconds to run get_epoch_snapshot view")

    return Response(combined)