from django.shortcuts import render
from django.http import JsonResponse
from django.db.models import Max
from . import models

def get_delegators(request):
    epoch_qs = models.EpochStake.objects
    epoch_param = request.GET.get('epoch')
    # Get most recent epoch
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
            .values('addr_id','pool_id','amount')
            .order_by('amount')
    )

    if not delegators:
        return JsonResponse({'Error': f'No data found for epoch {epoch_no}'}, status=404)
    
    for delegator in delegators:
        pool = delegator['pool_id']
        addr = delegator['addr_id']
        delegator.setdefault(pool, []).append(addr)

    return JsonResponse({'epoch': epoch_no, 'delegators': delegators})


