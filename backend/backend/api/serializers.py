from rest_framework import serializers
from . import models

class EpochDelegatorsStkSerializer2(serializers.ModelSerializer):
    class Meta:
        model = models.MvEpochDelegatorStake2
        fields = '__all__'

class EpochDelegatorsMovSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.MvEpochDelegationMovements
        fields = '__all__'

class EpochDelegatorsMovCountSerializer(serializers.Serializer):
    epoch_no = serializers.IntegerField()
    pool1 = serializers.IntegerField()
    pool2 = serializers.IntegerField()
    movement_count = serializers.IntegerField()
    movement_amount = serializers.IntegerField()

class EpochPoolStatsSerializer(serializers.ModelSerializer):
    # Parse as integer instead of decimal since decimal leads to string
    total_stake = serializers.IntegerField()
    pledge = serializers.IntegerField()

    class Meta:
        model = models.MvEpochPoolStats
        fields = '__all__'

class EpochParamsSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.MvEpochParams
        fields = '__all__'