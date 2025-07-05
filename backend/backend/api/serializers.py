from rest_framework import serializers
from .models import EpochStake

class EpochStakeSerializer(serializers.ModelSerializer):
    class Meta:
        model = EpochStake
        fields = ['id', 'addr_id', 'pool_id', 'amount', 'epoch_no']