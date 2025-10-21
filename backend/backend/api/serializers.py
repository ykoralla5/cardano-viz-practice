from rest_framework import serializers
from . import models

class EpochDelegatorsMovGranSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.DelegationSummary
        fields = '__all__'    

class EpochPoolStatsSerializer(serializers.ModelSerializer):
    # Parse as integer instead of decimal since decimal leads to string
    total_stake = serializers.IntegerField()
    pledge = serializers.IntegerField()

    class Meta:
        model = models.PoolStatsSummary
        fields = '__all__'

class EpochPoolPerfSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.PoolPerfSummary
        fields = '__all__'