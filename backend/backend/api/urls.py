# store all links of the project and functions to call
from django.urls import path
from . import views

urlpatterns = [
    path('snapshot/epoch/delegation', views.get_epoch_snapshot, name="snapshot-epoch"),
    path('snapshot/epochs', views.get_epochs, name="epochs"),
    path('snapshot/epochs/<int:epoch_no>', views.get_epoch_detail, name="epoch-detail")
]