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
    # class Meta:
    #     model = models.MvEpochDelegationMovCounts
    #     fields = '__all__'

class EpochPoolStatsSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.MvEpochPoolStats
        fields = '__all__'

class EpochParamsSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.MvEpochParams
        fields = '__all__'