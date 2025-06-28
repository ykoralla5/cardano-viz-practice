from django.shortcuts import render
from django.http import JsonResponse
from django.db.models import Max, Count
from . import models

def get_delegators(request):
    epoch_qs = models.EpochStake.objects
    epoch_param = request.GET.get('epoch')
    # Get most recent epoch
    if epoch_param:
        try:
            epoch_no = int(epoch_param)
        except ValueError:
            return JsonResponse({"error": "Epoch number must be an integer"}, status=404)
    else:
        epoch_no = models.EpochStake.objects.aggregate(max_epoch=Max("epoch_no"))["max_epoch"]
        if epoch_no is None:
            return JsonResponse({"error": "No epoch stake data found"}, status=404)
        
    delegators = (
        epoch_qs.filter(epoch_no=epoch_no)
                .values("addr_id","pool_id","amount")
    )


