from django.db import models

class StakePool(models.Model):
    pool_id = models.CharField(max_length=64, unique=True)
    name = models.CharField(max_length=100, default="Unnamed Pool")
    ticker = models.CharField(max_length=10)
    description = models.TextField(null=True, blank=True)
    url = models.URLField()
    homepage = models.URLField()
    #created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.pool_id

class StakePoolSnapshot(models.Model):
    pool_id = models.CharField(max_length=64)
    epoch = models.IntegerField()
    active_stake = models.BigIntegerField()
    live_stake = models.BigIntegerField()
    live_saturation = models.FloatField()
    blocks_minted = models.IntegerField()
    timestamp=models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.pool_id

    class Meta:
        unique_together = ('pool_id', 'epoch')

class Epoch(models.Model):
    number = models.IntegerField(unique=True)
    #start_time = models.DateTimeField()
    #end_time = models.DateTimeField()
    
    #url = models.URLField()
    #ticker = models.CharField(max_length=9)
    #pool_name = models.CharField()
    #description = models.TextField(max_length=255)
    
    def __str__(self):
        return self.number

    
