from django.shortcuts import render
from django.http import JsonResponse
from rest_framework.response import Response
from rest_framework.decorators import api_view
from django.db.models import Max
from . import models
from . import serializers
import logging

# Logger instance
logger = logging.getLogger(__name__)

@api_view(['GET'])
def get_delegators(request):
    
    
    epoch_param = request.GET.get('epoch')
    
    # If request includes epoch number, use it otherwise get most recent epoch
    if epoch_param:
        try:
            epoch_number = int(epoch_param)
        except ValueError:
            return JsonResponse({'Error': 'Epoch number must be an integer'}, status=404)
    else:
        epoch_number = models.EpochStake.objects.aggregate(max_epoch=Max("epoch_no"))["max_epoch"]
        if epoch_number is None:
            return JsonResponse({'Error': 'No epoch stake data found'}, status=404)
        
    # Get 10 distinct pools
    pools = models.EpochStake.objects.filter(epoch_no=epoch_number).order_by('pool_id').values_list('pool_id', flat=True).distinct()[:10]
    #print(f'Pools are {pools}')

    # Get all delegators from the 10 distinct pools in epoch_no
    delegators = models.EpochStake.objects.filter(epoch_no=epoch_number, pool_id__in=pools).values('addr_id','pool_id','amount','epoch_no')
    #print(f'There are {len(delegators)} delegators to {len(pools)} pools. Pools is of type {type(pools)} and delegators is of type {type(delegators)}.')
    
    
    #counts = 
    if not delegators:
        return JsonResponse({'Error': f'No data found for epoch {epoch_number}'}, status=404)
    

    
    # for delegator in delegators:
    #     print(delegator)
    #     pool = delegator['pool_id']
    #     addr = delegator['addr_id']
    #     delegator.setdefault(pool, []).append(addr)

    serializer = serializers.EpochStakeSerializer(delegators, many=True)
    delegators_list = list(serializer.data)
    print(delegators_list[0]['amount'])
    logger.info(type(serializer.data))
    return Response(serializer.data)

