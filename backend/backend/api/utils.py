from django.http import JsonResponse
from . import models

def validate_epoch(epoch_param):
    # Validate if number is provided
    MIN_EPOCH = 210
    try:
        epoch_number = int(epoch_param)
    except (ValueError, TypeError):
        return JsonResponse({'Error': 'Invalid epoch number'}, status=400)
    
    # Validate if epoch number from request exists
    if not models.Epoch.objects.filter(no=epoch_number).exists():
        return JsonResponse({'Error': f'Epoch {epoch_number} not found'}, status=404)
    # Validate if epoch number is below 209, so before the Shelley era
    elif epoch_number < MIN_EPOCH:
        return JsonResponse({'Error': f'Epoch provided is before Shelley era and has no decentralisation mechanisms. Provide an epoch number less than {MIN_EPOCH}'}, status=400)
    
    return epoch_number