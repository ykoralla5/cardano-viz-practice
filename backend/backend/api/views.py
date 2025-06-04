from django.shortcuts import render
import requests
from django.http import JsonResponse
from django.conf import settings
import datetime

def get_working(request):
    return JsonResponse("Django server is working", safe=False)

def get_pool_data(request):
    url = "https://cardano-mainnet.blockfrost.io/api/v0/pools/extended?count=10&page=1"
    headers = {
        "project_id": settings.BLOCKFROST_API_KEY
    }
    response = requests.get(url, headers=headers)
    return JsonResponse(response.json(), safe=False)

def get_specific_pool_history(request, pool_address):
    pool_address = request.GET.get('pool_address')
    url = "https://cardano-mainnet.blockfrost.io/api/v0/pools/{pool_address}"
    headers = {
        "project_id": settings.BLOCKFROST_API_KEY
    }
    response = requests.get(url, headers=headers)
    return JsonResponse(response.json(), safe=False)



