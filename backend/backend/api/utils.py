from django.http import JsonResponse
from django.db.models import Min, Max
from . import models
from . import views
import logging

# Logger instance
logger = logging.getLogger(__name__)

# Helper function
def get_min_max_slot():
    # MIN_SLOT = 271
    min_slot = models.DelegationSummary.objects.aggregate(min_slot=Min("slot_no"))["min_slot"]
    max_slot = models.DelegationSummary.objects.aggregate(max_slot=Max("slot_no"))["max_slot"]
    logger.info(f"Min and max slot numbers retrieved: {min_slot}, {max_slot}")
    return [min_slot, max_slot]

# Helper function
def get_min_max_epoch():
    MIN_EPOCH = 210
    max_epoch = models.EpochStake.objects.aggregate(max_epoch=Max("epoch_no"))["max_epoch"]
    logger.info(f"Min and max epoch numbers retrieved: {MIN_EPOCH}, {max_epoch}")
    return [MIN_EPOCH, max_epoch]

def validate_epoch(epoch_param):
    # Validate if number is provided
    min_max_epoch = get_min_max_epoch()
    MIN_EPOCH = min_max_epoch[0] # 210
    MAX_EPOCH = min_max_epoch[1]

    try:
        epoch_number = int(epoch_param)
    except (ValueError, TypeError):
        return JsonResponse({'Error': 'Invalid epoch number'}, status=400)
    
    # Validate if epoch number from request exists
    if not models.EpochStake.objects.filter(epoch_no=epoch_number).exists():
        return JsonResponse({'Error': f'Epoch {epoch_number} not found'}, status=404)
    # Validate if epoch number is below 209, so before the Shelley era
    elif epoch_number < MIN_EPOCH:
        return JsonResponse({'Error': f'Epoch provided is before Shelley era and has no decentralisation mechanisms. Provide an epoch number less than {MIN_EPOCH}'}, status=400)
    elif epoch_number > MAX_EPOCH:
        return JsonResponse({'Error': f'Epoch provided is greater than current epoch and must be {MAX_EPOCH}'}, status=400)
    
    return epoch_number

# def validate_slot(slot_param):
#     # Validate if number is provided
#     min_max_slot = get_min_max_slot()
#     MIN_SLOT = min_max_slot[0]
#     MAX_SLOT = min_max_slot[1]
#     try:
#         slot_number = int(slot_param)
#     except (ValueError, TypeError):
#         return JsonResponse({'Error': 'Invalid slot number'}, status=400)
    
#     # Validate if epoch number from request exists
#     if not models.Block.objects.filter(slot_no=slot_number).exists():
#         return JsonResponse({'Error': f'Slot {slot_number} not found'}, status=404)
#     # Validate if epoch number is below 209, so before the Shelley era
#     elif slot_number < MIN_SLOT:
#         return JsonResponse({'Error': f'Slot provided is before Shelley era and has no decentralisation mechanisms. Provide an slot number less than {MIN_SLOT}'}, status=400)
#     elif slot_number > MAX_SLOT:
#         return JsonResponse({'Error': f'Slot provided is greater than current slot and must be {MAX_SLOT}'}, status=400)
    
#     return slot_number

def safe_divide(a, b):
    try:
        return a / b if b != 0 else 0
    except TypeError:
        return 0