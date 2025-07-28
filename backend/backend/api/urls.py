# store all links of the project and functions to call
from django.urls import path
from . import views

urlpatterns = [
    path('snapshot/delegators', views.get_delegators, name="snapshot-delegators"),
    path('snapshot/pools/performance', views.get_pools_performance, name="snapshot-pools")
]