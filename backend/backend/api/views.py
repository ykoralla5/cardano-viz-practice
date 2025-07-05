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
    epoch_qs = models.EpochStake.objects
    epoch_param = request.GET.get('epoch')
    
    # If request includes epoch number, use it otherwise get most recent epoch
    if epoch_param:
        try:
            epoch_no = int(epoch_param)
        except ValueError:
            return JsonResponse({'Error': 'Epoch number must be an integer'}, status=404)
    else:
        epoch_no = models.EpochStake.objects.aggregate(max_epoch=Max("epoch_no"))["max_epoch"]
        if epoch_no is None:
            return JsonResponse({'Error': 'No epoch stake data found'}, status=404)
        
    # Get delegators and the amount delegated by pool
    delegators = (
        epoch_qs
            .filter(epoch_no=epoch_no)
            .order_by('-amount')
            #.values('addr_id','pool_id','amount')
            
    )

    # Limit to 100 rows
    logger.info(delegators.count)
    delegators = delegators[:100]

    if not delegators:
        return JsonResponse({'Error': f'No data found for epoch {epoch_no}'}, status=404)
    
    # for delegator in delegators:
    #     print(delegator)
    #     pool = delegator['pool_id']
    #     addr = delegator['addr_id']
    #     delegator.setdefault(pool, []).append(addr)

    serializer = serializers.EpochStakeSerializer(delegators, many=True)
    logger.info(type(serializer.data))
    return Response(serializer.data)

