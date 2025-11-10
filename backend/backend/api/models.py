from django.db import models

class AdaPot(models.Model):
    id = models.BigAutoField(primary_key=True)
    slot_no = models.BigIntegerField(blank=True, null=True)
    epoch_no = models.IntegerField(unique=True)
    treasury = models.DecimalField(max_digits=20, decimal_places=0)
    reserves = models.DecimalField(max_digits=20, decimal_places=0)
    rewards = models.DecimalField(max_digits=20, decimal_places=0)

    class Meta:
        managed = False
        db_table = 'ada_pots'
        app_label = 'api'

class Block(models.Model):
    id = models.BigAutoField(primary_key=True)
    hash = models.BinaryField(unique=True)
    epoch_no = models.IntegerField(blank=True, null=True)
    slot_no = models.BigIntegerField(blank=True, null=True)
    epoch_slot_no = models.IntegerField(blank=True, null=True)
    block_no = models.IntegerField(blank=True, null=True)
    previous_id = models.BigIntegerField(blank=True, null=True)
    slot_leader_id = models.BigIntegerField()
    size = models.IntegerField()
    time = models.DateTimeField()
    tx_count = models.BigIntegerField()
    proto_major = models.IntegerField()
    proto_minor = models.IntegerField()
    vrf_key = models.CharField(blank=True, null=True)
    op_cert = models.BinaryField(blank=True, null=True)
    op_cert_counter = models.BigIntegerField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'block'
        app_label = 'api'


class Delegation(models.Model):
    id = models.BigAutoField(primary_key=True)
    addr_id = models.BigIntegerField()
    cert_index = models.IntegerField()
    pool_hash_id = models.BigIntegerField()
    active_epoch_no = models.BigIntegerField()
    tx_id = models.BigIntegerField()
    slot_no = models.BigIntegerField()
    redeemer_id = models.BigIntegerField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'delegation'
        app_label = 'api'


class Epoch(models.Model):
    id = models.BigAutoField(primary_key=True)
    out_sum = models.DecimalField(max_digits=39, decimal_places=0)
    fees = models.DecimalField(max_digits=20, decimal_places=0)
    tx_count = models.IntegerField()
    blk_count = models.IntegerField()
    no = models.IntegerField(unique=True)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'epoch'
        app_label = 'api'


class EpochParam(models.Model):
    id = models.BigAutoField(primary_key=True)
    epoch_no = models.IntegerField()
    min_fee_a = models.IntegerField()
    min_fee_b = models.IntegerField()
    max_block_size = models.IntegerField()
    max_tx_size = models.IntegerField()
    max_bh_size = models.IntegerField()
    key_deposit = models.DecimalField(max_digits=20, decimal_places=0)
    pool_deposit = models.DecimalField(max_digits=20, decimal_places=0)
    max_epoch = models.IntegerField()
    optimal_pool_count = models.IntegerField()
    influence = models.FloatField()
    monetary_expand_rate = models.FloatField()
    treasury_growth_rate = models.FloatField()
    decentralisation = models.FloatField()
    protocol_major = models.IntegerField()
    protocol_minor = models.IntegerField()
    min_utxo_value = models.DecimalField(max_digits=20, decimal_places=0)
    min_pool_cost = models.DecimalField(max_digits=20, decimal_places=0)
    nonce = models.BinaryField(blank=True, null=True)
    cost_model_id = models.BigIntegerField(blank=True, null=True)
    price_mem = models.FloatField(blank=True, null=True)
    price_step = models.FloatField(blank=True, null=True)
    max_tx_ex_mem = models.DecimalField(max_digits=20, decimal_places=0, blank=True, null=True)
    max_tx_ex_steps = models.DecimalField(max_digits=20, decimal_places=0, blank=True, null=True)
    max_block_ex_mem = models.DecimalField(max_digits=20, decimal_places=0, blank=True, null=True)
    max_block_ex_steps = models.DecimalField(max_digits=20, decimal_places=0, blank=True, null=True)
    max_val_size = models.DecimalField(max_digits=20, decimal_places=0, blank=True, null=True)
    collateral_percent = models.IntegerField(blank=True, null=True)
    max_collateral_inputs = models.IntegerField(blank=True, null=True)
    block_id = models.BigIntegerField()
    extra_entropy = models.BinaryField(blank=True, null=True)
    coins_per_utxo_size = models.DecimalField(max_digits=20, decimal_places=0, blank=True, null=True)
    pvt_motion_no_confidence = models.FloatField(blank=True, null=True)
    pvt_committee_normal = models.FloatField(blank=True, null=True)
    pvt_committee_no_confidence = models.FloatField(blank=True, null=True)
    pvt_hard_fork_initiation = models.FloatField(blank=True, null=True)
    dvt_motion_no_confidence = models.FloatField(blank=True, null=True)
    dvt_committee_normal = models.FloatField(blank=True, null=True)
    dvt_committee_no_confidence = models.FloatField(blank=True, null=True)
    dvt_update_to_constitution = models.FloatField(blank=True, null=True)
    dvt_hard_fork_initiation = models.FloatField(blank=True, null=True)
    dvt_p_p_network_group = models.FloatField(blank=True, null=True)
    dvt_p_p_economic_group = models.FloatField(blank=True, null=True)
    dvt_p_p_technical_group = models.FloatField(blank=True, null=True)
    dvt_p_p_gov_group = models.FloatField(blank=True, null=True)
    dvt_treasury_withdrawal = models.FloatField(blank=True, null=True)
    committee_min_size = models.DecimalField(max_digits=20, decimal_places=0, blank=True, null=True)
    committee_max_term_length = models.DecimalField(max_digits=20, decimal_places=0, blank=True, null=True)
    gov_action_lifetime = models.DecimalField(max_digits=20, decimal_places=0, blank=True, null=True)
    gov_action_deposit = models.DecimalField(max_digits=20, decimal_places=0, blank=True, null=True)
    drep_deposit = models.DecimalField(max_digits=20, decimal_places=0, blank=True, null=True)
    drep_activity = models.DecimalField(max_digits=20, decimal_places=0, blank=True, null=True)
    pvtpp_security_group = models.FloatField(blank=True, null=True)
    min_fee_ref_script_cost_per_byte = models.FloatField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'epoch_param'
        app_label = 'api'


class EpochStake(models.Model):
    id = models.BigAutoField(primary_key=True)
    addr_id = models.BigIntegerField()
    pool_id = models.BigIntegerField()
    amount = models.DecimalField(max_digits=20, decimal_places=0)
    epoch_no = models.IntegerField()

    class Meta:
        managed = False
        db_table = 'epoch_stake'
        unique_together = (('epoch_no', 'addr_id', 'pool_id'),)
        app_label = 'api'


class OffChainPoolData(models.Model):
    id = models.BigAutoField(primary_key=True)
    pool_id = models.BigIntegerField()
    ticker_name = models.CharField()
    hash = models.BinaryField()
    json = models.JSONField()
    bytes = models.BinaryField()
    pmr_id = models.BigIntegerField()

    class Meta:
        managed = False
        db_table = 'off_chain_pool_data'
        unique_together = (('pool_id', 'pmr_id'),)
        app_label = 'api'


class PoolHash(models.Model):
    id = models.BigAutoField(primary_key=True)
    hash_raw = models.BinaryField(unique=True)
    view = models.CharField()

    class Meta:
        managed = False
        db_table = 'pool_hash'
        app_label = 'api'


class PoolRetire(models.Model):
    id = models.BigAutoField(primary_key=True)
    hash_id = models.BigIntegerField()
    cert_index = models.IntegerField()
    announced_tx_id = models.BigIntegerField()
    retiring_epoch = models.IntegerField()

    class Meta:
        managed = False
        db_table = 'pool_retire'
        app_label = 'api'


class PoolUpdate(models.Model):
    id = models.BigAutoField(primary_key=True)
    hash_id = models.BigIntegerField()
    cert_index = models.IntegerField()
    vrf_key_hash = models.BinaryField()
    pledge = models.DecimalField(max_digits=20, decimal_places=0)
    active_epoch_no = models.BigIntegerField()
    meta_id = models.BigIntegerField(blank=True, null=True)
    margin = models.FloatField()
    fixed_cost = models.DecimalField(max_digits=20, decimal_places=0)
    registered_tx_id = models.BigIntegerField()
    reward_addr_id = models.BigIntegerField()
    deposit = models.DecimalField(max_digits=20, decimal_places=0, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'pool_update'
        app_label = 'api'


class Reserve(models.Model):
    id = models.BigAutoField(primary_key=True)
    addr_id = models.BigIntegerField()
    cert_index = models.IntegerField()
    amount = models.DecimalField(max_digits=20, decimal_places=0)
    tx_id = models.BigIntegerField()

    class Meta:
        managed = False
        db_table = 'reserve'
        app_label = 'api'


class Reward(models.Model):
    addr_id = models.BigIntegerField()
    type = models.TextField()  # This field type is a guess.
    amount = models.DecimalField(max_digits=20, decimal_places=0)
    spendable_epoch = models.BigIntegerField()
    pool_id = models.BigIntegerField()
    earned_epoch = models.BigIntegerField()

    class Meta:
        managed = False
        db_table = 'reward'
        unique_together = (('addr_id', 'type', 'earned_epoch', 'pool_id'),)
        app_label = 'api'


class SlotLeader(models.Model):
    id = models.BigAutoField(primary_key=True)
    hash = models.BinaryField(unique=True)
    pool_hash_id = models.BigIntegerField(blank=True, null=True)
    description = models.CharField()

    class Meta:
        managed = False
        db_table = 'slot_leader'
        app_label = 'api'


class StakeAddress(models.Model):
    id = models.BigAutoField(primary_key=True)
    hash_raw = models.BinaryField(unique=True)
    view = models.CharField()
    script_hash = models.BinaryField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'stake_address'
        app_label = 'api'


class Treasury(models.Model):
    id = models.BigAutoField(primary_key=True)
    addr_id = models.BigIntegerField()
    cert_index = models.IntegerField()
    amount = models.DecimalField(max_digits=20, decimal_places=0)
    tx_id = models.BigIntegerField()

    class Meta:
        managed = False
        db_table = 'treasury'
        app_label = 'api'


class Tx(models.Model):
    id = models.BigAutoField(primary_key=True)
    hash = models.BinaryField(unique=True)
    block_id = models.BigIntegerField()
    block_index = models.IntegerField()
    out_sum = models.DecimalField(max_digits=20, decimal_places=0)
    fee = models.DecimalField(max_digits=20, decimal_places=0)
    deposit = models.BigIntegerField(blank=True, null=True)
    size = models.IntegerField()
    invalid_before = models.DecimalField(max_digits=20, decimal_places=0, blank=True, null=True)
    invalid_hereafter = models.DecimalField(max_digits=20, decimal_places=0, blank=True, null=True)
    valid_contract = models.BooleanField()
    script_size = models.IntegerField()
    treasury_donation = models.DecimalField(max_digits=20, decimal_places=0)

    class Meta:
        managed = False
        db_table = 'tx'
        app_label = 'api'

class DelegationSummary(models.Model):
    MOVEMENT_CHOICES = [
        ('NEW_STAKE', 'New Stake'),
        ('UNDELEGATED', 'Undelegated'),
        ('REDELEGATION', 'Redelegation'),
        ('AWAITING_ACTIVATION', 'Awaiting activation'),
        ('NO_CHANGE', 'No Change'),
    ]
    delegation_id = models.BigIntegerField()
    epoch_no = models.IntegerField()
    slot_no = models.BigIntegerField()
    tx_id = models.BigIntegerField()
    addr_id = models.BigIntegerField()
    source_pool_id = models.BigIntegerField()
    destination_pool_id = models.BigIntegerField()
    movement_type = models.CharField(max_length=20, choices=MOVEMENT_CHOICES)
    amount = models.DecimalField(max_digits=20, decimal_places=0)
    computed_at=models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'delegation_summary'
        app_label = 'api'
        unique_together = ['epoch_no', 'tx_id', 'addr_id', 'delegation_id']

class PoolStatsSummary(models.Model):
    epoch_no = models.IntegerField()
    pool_id = models.BigIntegerField()
    pool_view = models.CharField()
    total_stake = models.DecimalField(max_digits=20, decimal_places=0)
    delegator_count = models.IntegerField()
    pledge = models.DecimalField(max_digits=20, decimal_places=0)
    is_active = models.BooleanField()
    saturation_ratio = models.FloatField()
    created_at = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'pool_stats_summary'
        app_label = 'api'
        unique_together = ['epoch_no', 'pool_id']

class PoolPerfSummary(models.Model):
    epoch_no = models.IntegerField()
    pool_id = models.BigIntegerField()
    actual_blocks = models.IntegerField()
    expected_blocks = models.FloatField()
    created_at = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'pool_perf_summary'
        app_label = 'api'
        unique_together = ['epoch_no', 'pool_id']

class EpochSummary(models.Model):
    epoch_no = models.IntegerField(primary_key=True)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    decentralisation = models.DecimalField(max_digits=5, decimal_places=4)
    pledge_influence = models.DecimalField(max_digits=5, decimal_places=4)
    optimal_pool_count = models.IntegerField()
    total_active_stake = models.DecimalField(max_digits=40, decimal_places=0)
    circulating_supply = models.DecimalField(max_digits=40, decimal_places=0)
    stake_address_count = models.IntegerField()
    pool_count = models.IntegerField()
    phase = models.CharField(max_length=20)
    saturation_point = models.DecimalField(max_digits=20, decimal_places=5)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "epoch_summary"
        ordering = ["epoch_no"]