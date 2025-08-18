from rest_framework import serializers
from . import models

class EpochDelegatorsStkSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.MvEpochDelegatorStake
        fields = '__all__'

class EpochDelegatorsMovSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.MvEpochDelegationMovements
        fields = '__all__'

class EpochPoolStatsSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.MvEpochPoolStats
        fields = '__all__'

class EpochParamsSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.MvEpochParams
        fields = '__all__'