# store all links of the project and functions to call
from django.urls import path
# from api.views import get_working, get_pool_data, get_specific_pool_history
from . import views

urlpatterns = [
    path('working/', views.get_working),
    path('stake-pools/current/', views.current_pools_snapshot),
    path('stake-pools/<pool_id>/history/', views.pool_history),
    path('stake-pools/epoch/<epoch_number>/', views.epoch_snapshot)
]