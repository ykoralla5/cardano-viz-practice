\set ON_ERROR_STOP on

\timing on

-- Acquire advisory lock (only one instance runs at a time)
DO $$
BEGIN
    IF NOT pg_try_advisory_lock(1001) THEN
        RAISE NOTICE 'Another instance of delegation_summary is already running. Exiting.';
        PERFORM pg_sleep(1);
        RAISE NOTICE 'Skipping duplicate job run.';
        RETURN;
    END IF;
END $$;

-- Main upsert logic

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
),

--  when possible, get data from before current epoch
stake_lookup AS (
    SELECT
        dw.delegation_id,
        es.epoch_no AS last_epoch,
        es.amount
    FROM delegation_with_prev dw
    LEFT JOIN LATERAL (
        SELECT es.epoch_no, es.amount
        FROM epoch_stake es
        WHERE es.addr_id = dw.addr_id
          AND es.epoch_no <= dw.epoch_no - 2
        ORDER BY es.epoch_no DESC
        LIMIT 1
    ) es ON TRUE
),

-- if not, try to get data from next available epoch stake
future_stake AS (
    SELECT
        dw.delegation_id,
        es_future.epoch_no AS future_epoch,
        es_future.amount AS predicted_amount
    FROM delegation_with_prev dw
    LEFT JOIN LATERAL (
        SELECT es.epoch_no, es.amount
        FROM epoch_stake es
        WHERE es.addr_id = dw.addr_id
          AND es.epoch_no >= dw.epoch_no
        ORDER BY es.epoch_no ASC
        LIMIT 1
    ) es_future ON TRUE
)

SELECT
    dw.delegation_id,
    dw.epoch_no,
    dw.slot_no,
    dw.tx_id,
    dw.addr_id,
    dw.prev_pool_id AS source_pool_id,
    dw.dest_pool_id AS destination_pool_id,
    COALESCE(sl.amount, fs.predicted_amount) AS amount,
    COALESCE(sl.last_epoch, fs.future_epoch) AS last_epoch,
    CASE
        WHEN dw.prev_pool_id IS NULL AND dw.dest_pool_id IS NOT NULL
             AND sl.amount IS NOT NULL THEN 'NEW_STAKE'
        WHEN dw.prev_pool_id IS NULL AND dw.dest_pool_id IS NOT NULL
             AND sl.amount IS NULL THEN 'NEW_STAKE_PENDING'
        WHEN dw.prev_pool_id IS NOT NULL AND dw.dest_pool_id IS NOT NULL
             AND dw.prev_pool_id <> dw.dest_pool_id
             AND sl.amount IS NOT NULL THEN 'FINALIZED_REDELEGATION'
        WHEN dw.prev_pool_id IS NOT NULL AND dw.dest_pool_id IS NOT NULL
             AND dw.prev_pool_id <> dw.dest_pool_id
             AND sl.amount IS NULL THEN 'NON_FINALIZED_REDELEGATION_PENDING'
        WHEN dw.prev_pool_id IS NOT NULL AND dw.dest_pool_id IS NULL THEN 'UNDELEGATED'
        WHEN dw.prev_pool_id = dw.dest_pool_id THEN 'NO_CHANGE'
        ELSE 'UNKNOWN'
    END AS movement_type
FROM delegation_with_prev dw
LEFT JOIN stake_lookup sl ON sl.delegation_id = dw.delegation_id
LEFT JOIN future_stake fs ON fs.delegation_id = dw.delegation_id
ORDER BY dw.epoch_no, dw.slot_no
ON CONFLICT (epoch_no, tx_id, addr_id, delegation_id)
DO NOTHING;

-- Update entries where amount could not be determined before

WITH new_amounts AS (
    SELECT
        ds.delegation_id,
        es.amount,
        COALESCE(es.epoch_no, ds.last_epoch) AS finalized_epoch
    FROM delegation_summary ds
    JOIN LATERAL (
        SELECT es.amount, es.epoch_no
        FROM epoch_stake es
        WHERE es.addr_id = ds.addr_id
          AND es.epoch_no >= ds.epoch_no
          AND es.amount IS NOT NULL
        ORDER BY es.epoch_no ASC
        LIMIT 1
    ) es ON TRUE
    WHERE ds.movement_type = 'NEW_STAKE_PENDING'
)
UPDATE delegation_summary ds
SET
    amount = na.amount,
    last_epoch = na.finalized_epoch,
    movement_type = 'NEW_STAKE'
FROM new_amounts na
WHERE ds.delegation_id = na.delegation_id;

-- Show updation message
DO $$
DECLARE
    updated_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO updated_count
    FROM delegation_summary
    WHERE movement_type = 'NEW_STAKE';
    RAISE NOTICE '✅ Delegation summary updated. % NEW_STAKE entries finalized.', updated_count;
END $$;

-- Release lock at the end
SELECT pg_advisory_unlock(1001);