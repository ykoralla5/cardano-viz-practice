\set ON_ERROR_STOP on

\timing on

INSERT INTO delegation_summary (
    delegation_id,
    epoch_no,
    slot_no,
    tx_id,
    addr_id,
    source_pool_id,
    destination_pool_id,
    amount,
    last_epoch,
    movement_type
)
WITH delegation_with_prev AS (
    SELECT
        d.id AS delegation_id,
        d.addr_id,
        d.pool_hash_id AS dest_pool_id,
        tx.id AS tx_id,
        d.active_epoch_no AS epoch_no,
        b.slot_no,
        tx.hash AS tx_hash,
        LAG(d.pool_hash_id) OVER (
            PARTITION BY d.addr_id
            ORDER BY d.active_epoch_no, b.slot_no, tx.id
        ) AS prev_pool_id
    FROM delegation d
    JOIN tx ON tx.id = d.tx_id
    JOIN block b ON b.id = tx.block_id
    WHERE d.id > (SELECT COALESCE(MAX(delegation_id), 0) FROM delegation_summary)
)
SELECT
    dw.delegation_id,
    dw.epoch_no,
    dw.slot_no,
    dw.tx_id,
    dw.addr_id,
    dw.prev_pool_id AS source_pool_id,
    dw.dest_pool_id AS destination_pool_id,
    es_prev.amount,
    es_prev.epoch_no AS last_epoch,
    CASE
        WHEN dw.prev_pool_id IS NULL AND dw.dest_pool_id IS NOT NULL THEN 'NEW_STAKE'
        WHEN dw.prev_pool_id IS NOT NULL AND dw.dest_pool_id IS NULL THEN 'UNDELEGATED'
        WHEN dw.prev_pool_id IS NOT NULL AND dw.dest_pool_id IS NOT NULL AND dw.prev_pool_id <> dw.dest_pool_id AND es_prev.amount IS NULL THEN 'AWAITING_ACTIVATION'
        WHEN dw.prev_pool_id IS NOT NULL AND dw.dest_pool_id IS NOT NULL AND dw.prev_pool_id <> dw.dest_pool_id THEN 'REDELEGATION'
        ELSE 'NO_CHANGE'
    END AS movement_type
FROM delegation_with_prev dw
LEFT JOIN LATERAL (
    SELECT es.epoch_no, es.amount
    FROM epoch_stake es
    WHERE es.addr_id = dw.addr_id
      AND es.epoch_no <= dw.epoch_no - 2
    ORDER BY es.epoch_no DESC
    LIMIT 1
) es_prev ON TRUE
ORDER BY dw.epoch_no, dw.slot_no
ON CONFLICT (epoch_no, tx_id, addr_id, delegation_id)
DO NOTHING;