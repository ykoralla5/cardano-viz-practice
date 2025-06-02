from django.db import models

class StakePool(models.Model):
    pool_id = models.CharField(max_length=100)
    active_stake = models.BigIntegerField()
    live_stake = models.BigIntegerField()
    live_saturation = models.FloatField()
    blocks_minted = models.IntegerField()
    epoch = models.IntegerField()
    url = models.URLField()
    ticker = models.CharField(max_length=9)
    pool_name = models.CharField()
    description = models.TextField(max_length=255)
    homepage = models.URLField()

def __str__(self):
    return self.pool_name
