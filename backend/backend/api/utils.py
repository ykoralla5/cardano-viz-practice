from django.http import JsonResponse
from . import models

def validate_epoch(epoch_param):
    try:
        epoch_number = int(epoch_param)
    except (ValueError, TypeError):
        return JsonResponse({'Error': 'Invalid epoch number'}, status=400)
    
    # Check if epoch number from request exists
    if not models.Epoch.objects.filter(no=epoch_number).exists():
        return JsonResponse({'Error': f'Epoch {epoch_number} not found'}, status=404)
    
    return epoch_number

def validate_stake_threshold(threshold):
    MIN_STAKE_THRESHOLD = 0 # or 0 %
    MAX_STAKE_THRESHOLD = 100 # or 100 %
    try:
        threshold = int(threshold)
    except (ValueError, TypeError):
        return JsonResponse({'Error': 'Invalid stake threshold'}, status=400)
    
    if not (MIN_STAKE_THRESHOLD <= threshold <= MAX_STAKE_THRESHOLD):
        return JsonResponse({'Error': f'Stake threshold must be between {MIN_STAKE_THRESHOLD} and {MAX_STAKE_THRESHOLD}'}, status=400)
    
    return threshold