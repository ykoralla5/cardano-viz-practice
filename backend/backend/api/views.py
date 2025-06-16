from django.shortcuts import render
import requests
from django.http import JsonResponse
from django.conf import settings
from . import models
import datetime, time

def get_working(request):
    return JsonResponse("Django server is working", safe=False, status=200)

def get_latest_epoch():
    # Fetch data from API
    ## Get query params from internal request
    url = "https://cardano-mainnet.blockfrost.io/api/v0/epochs/latest"
    headers = {"project_id": settings.BLOCKFROST_API_KEY}

    try:
        response = requests.get(url, headers=headers, timeout=5)

        if response.status_code == 200:
            latest_epoch_data = response.json()
            return JsonResponse(response.json(), safe=False, status=200)

        elif response.status_code != 200:
            return JsonResponse({"error": "Error {response.status_code} encountered."})
    
    except requests.exception.Timeout:
        return JsonResponse({"error": "504 Request timed out."}, status=504)

    # Save to DB
    for epoch in latest_epoch_data:
        epoch_number = epoch.get("number")
        ## Update or create StakePool object
        Epoch.objects.update_or_create (
            number=epoch_number,
            defaults={
                "start_time": datetime.fromtimestamp(pool.get("start_time")),
                "end_time": datetime.fromtimestamp(pool.get("end_time")),
            }
        )

    return Epoch.objects.aggregate(Max('number'))

def previous_epochs_list(request):
    # Fetch data from API
    ## Get query params from internal request
    number = request.GET.get('number')
    count = request.GET.get('count')
    page = request.GET.get('page')

    ## Build external URL
    url = "https://cardano-mainnet.blockfrost.io/api/v0/epochs/{number}/previous?count={count}&page={page}"
    headers = {"project_id": settings.BLOCKFROST_API_KEY}

    try:
        response = requests.get(url, headers=headers, timeout=5)

        if response.status_code == 200:
            epochs_data = response.json()
            return JsonResponse(response.json(), safe=False, status=200)

        elif response.status_code != 200:
            return JsonResponse({"error": "Error {response.status_code} encountered."})
    
    except requests.exception.Timeout:
        return JsonResponse({"error": "504 Request timed out."}, status=504)

    # Save to DB
    for epoch in epochs_data:
        epoch_number = epoch.get("epoch")
        ## Update or create StakePool object
        Epoch.objects.update_or_create (
            number=epoch_number,
            defaults={
                "start_time": datetime.fromtimestamp(pool.get("start_time")),
                "end_time": datetime.fromtimestamp(pool.get("end_time")),
            }
        )

    return JsonResponse({"status":"Record added"})

# Get all pools overview at current time
def current_pools_snapshot(request):
    # Fetch data from API
    ## Get query params from internal request
    count = request.GET.get('count')
    page = request.GET.get('page')

    ## Build external URL
    url = "https://cardano-mainnet.blockfrost.io/api/v0/pools/extended?count={count}&page={page}"
    headers = {"project_id": settings.BLOCKFROST_API_KEY}

    try:
        response = requests.get(url, headers=headers, timeout=5)

        if response.status_code == 200:
            pool_list = response.json()
            return JsonResponse(response.json(), safe=False, status=200)
        
        elif response.status_code == 404:
            return JsonResponse({"error": "404 Resource doesn't exist."}, status=404)

        elif response.status_code == 500:
            return JsonResponse({"error": "500 External server error."}, status=500)

        elif response.status_code != 200 | 404 | 500:
            return JsonResponse({"error": "Error"})

    except requests.exception.Timeout:
        return JsonResponse({"error": "504 Request timed out."}, status=504)
    
    # Save to DB
    pool_snapshots = []
    pool_updates = []
    current_epoch = get_current_epoch()
    for pool in pool_list:
        pool_id = pool.get("pool_id")
        ## Update or create StakePool object
        StakePool.objects.update_or_create (
            pool_id=pool_id,
            defaults={
                "ticker": pool.get("metadata", {}).get("ticker"),
                "name": pool.get("metadata", {}).get("name"),
                "description": pool.get("metadata", {}).get("description"),
                "url": pool.get("metadata", {}).get("url"),
                "homepage": pool.get("metadata", {}).get("homepage"),
                #"created_at":pool.get("metadata", {}).get("created_at"),
            }
        )

        ## Add a StakePoolSnapshot
        pool_snapshots.append(StakePoolSnapshot(
            pool_id=pool_id,
            epoch=current_epoch,
            active_stake=pool.get("active_stake", 0),
            live_stake=pool.get("live_stake", 0),
            live_saturation=pool.get("live_saturation", 0),
            blocks_minted=pool.get("blocks_minted",0),
            timestamp=timezone.now(),
        ))

    StakePoolSnapshot.objects.bulk_create(pool_snapshots, ignore_conflicts=True)

    # Return
    return JsonResponse({"status":"Record added"})

# Get a specific pool's full history
def pool_history(request):
    # Fetch data from API
    ## Get query params from internal request
    pool_id = request.GET.get('pool_id')

    ## Build external URL
    url = "https://cardano-mainnet.blockfrost.io/api/v0/pools/{pool_id}"
    headers = {"project_id": settings.BLOCKFROST_API_KEY}

    try:
        response = requests.get(url, headers=headers, timeout=5)

        if response.status_code == 200:
            return JsonResponse(response.json(), safe=False, status=200)

        elif response.status_code == 404:
            return JsonResponse({"error": "404 Resource doesn't exist."}, status=404)

        elif response.status_code == 500:
            return JsonResponse({"error": "500 External server error."}, status=500)

    except requests.exception.Timeout:
        return JsonResponse({"error": "504 Request timed out."}, status=504)

    # Save to DB
    pool_snapshots = []
    current_epoch = get_current_epoch()
    for pool in pool_list:
        pool_snapshots.append(StakePoolSnapshot(
            pool_id=pool_id,
            epoch=current_epoch,
            active_stake=pool.get("active_stake", 0),
            live_stake=pool.get("live_stake", 0),
            live_saturation=pool.get("live_saturation", 0),
            blocks_minted=pool.get("blocks_minted",0),
            timestamp=timezone.now(),
        ))

    StakePoolSnapshot.objects.bulk_create(pool_snapshots, ignore_conflicts=True)

    # Return
    return JsonResponse({"status":"Record added"})

# Get all pools data in a certain epoch
def epoch_snapshot(request):
    # Get query params from internal request
    epoch = request.GET.get('epoch')
    count = request.GET.get('count')
    page = request.GET.get('page')

    # Build external URL
    url = "https://cardano-mainnet.blockfrost.io/api/v0/epochs/{epoch}/stakes?count={count}&page={page}"
    headers = {"project_id": settings.BLOCKFROST_API_KEY}

    try:
        response = requests.get(url, headers=headers, timeout=5)

        if response.status_code == 200:
            return JsonResponse(response.json(), safe=False, status=200)
        
        elif response.status_code == 404:
            return JsonResponse({"error": "404 Resource doesn't exist."}, status=404)

        elif response.status_code == 500:
            return JsonResponse({"error": "500 External server error."}, status=500)

    except requests.exception.Timeout:
        return JsonResponse({"error": "504 Request timed out."}, status=504)
    
    # Save to DB
    pool_snapshots = []
    for pool in pool_data:
        pool_snapshots.append(StakePoolSnapshot(
            pool_id=pool_id,
            epoch=epoch,
            active_stake=pool.get("active_stake", 0),
            live_stake=pool.get("live_stake", 0),
            live_saturation=pool.get("live_saturation", 0),
            blocks_minted=pool.get("blocks_minted",0),
            timestamp=timezone.now(),
        ))

    StakePoolSnapshot.objects.bulk_create(pool_snapshots, ignore_conflicts=True)

    # Return
    return JsonResponse({"status":"Record added"})
    


