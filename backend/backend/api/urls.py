# store all links of the project and functions to call
from django.urls import path
from api.views import get_working, get_pool_data, get_specific_pool_history

urlpatterns = [
    path('working/', get_working),
    path('pool-data/', get_pool_data),
    path('specific-pool-history/', get_specific_pool_history)
]