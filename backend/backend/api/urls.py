# store all links of the project and functions to call
from django.urls import path
from . import views

urlpatterns = [
    path('snapshot/epoch', views.get_epoch_snapshot, name="snapshot-epoch")
]