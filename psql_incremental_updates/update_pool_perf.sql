\set ON_ERROR_STOP on

\timing on

-- Acquire advisory lock (only one instance runs at a time)
DO $$
BEGIN
    IF NOT pg_try_advisory_lock(1003) THEN
        RAISE NOTICE 'Another instance of pool_perf_summary is already running. Exiting.';
        PERFORM pg_sleep(1);
        RAISE NOTICE 'Skipping duplicate job run.';
        RETURN;
    END IF;
END $$;

-- Create table if not exists
CREATE TABLE IF NOT EXISTS public.pool_perf_summary
(
    epoch_no word31type NOT NULL,
    pool_id bigint NOT NULL,
    actual_blocks bigint,
    expected_blocks numeric(20,5),
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT pool_perf_summary_pkey PRIMARY KEY (epoch_no, pool_id)
)

-- Main upsert logic

WITH last_epoch AS (
    SELECT COALESCE(MAX(epoch_no), -1) AS last_epoch_no
    FROM pool_perf_summary
),
pool_stats AS (
    SELECT epoch_no,
        pool_id,
        SUM(amount::numeric) AS pool_stake,
        SUM(SUM(amount::numeric)) OVER (PARTITION BY epoch_no) AS total_stake
        FROM epoch_stake WHERE epoch_no > (SELECT last_epoch_no FROM last_epoch)
        GROUP BY epoch_no, pool_id
),
total_epoch_slots AS (
    SELECT epoch_no,
    COUNT(block_no) AS total_active_slots
    FROM block WHERE epoch_no > (SELECT last_epoch_no FROM last_epoch)
    GROUP BY epoch_no
),
block_stats AS (
    SELECT b.epoch_no,
    sl.pool_hash_id AS pool_id,
    COUNT(b.id) AS actual_blocks
    FROM block b
        JOIN slot_leader sl ON sl.id = b.slot_leader_id
    WHERE sl.pool_hash_id IS NOT NULL AND b.epoch_no > (SELECT last_epoch_no FROM last_epoch)
    GROUP BY b.epoch_no, sl.pool_hash_id
),
final AS (
    SELECT
        ps.epoch_no,
        ps.pool_id,
        COALESCE(bs.actual_blocks, 0::bigint) AS actual_blocks,
        ROUND(tes.total_active_slots::numeric * (1::numeric - ep.decentralisation::numeric) * ps.pool_stake / NULLIF(ps.total_stake, 0::numeric), 5) AS expected_blocks
    FROM pool_stats ps
    JOIN epoch_param ep ON ep.epoch_no = ps.epoch_no
    JOIN total_epoch_slots tes ON tes.epoch_no = ps.epoch_no
    LEFT JOIN block_stats bs ON bs.epoch_no = ps.epoch_no AND bs.pool_id = ps.pool_id
    GROUP BY ps.epoch_no, ps.pool_id, bs.actual_blocks, ps.pool_stake, ps.total_stake, tes.total_active_slots, ep.decentralisation
)
INSERT INTO pool_perf_summary (epoch_no, pool_id, actual_blocks, expected_blocks)
 SELECT epoch_no,
    pool_id,
    actual_blocks,
    expected_blocks
   FROM final
    ON CONFLICT (epoch_no, pool_id)
    DO UPDATE SET
        actual_blocks = EXCLUDED.actual_blocks,
        expected_blocks = EXCLUDED.expected_blocks,
        created_at = NOW()
    WHERE pool_perf_summary.actual_blocks IS DISTINCT FROM EXCLUDED.actual_blocks
    OR pool_perf_summary.expected_blocks IS DISTINCT FROM EXCLUDED.expected_blocks;

-- Release lock at the end
SELECT pg_advisory_unlock(1003);