\set ON_ERROR_STOP on

\timing on

-- Acquire advisory lock (only one instance runs at a time)
DO $$
BEGIN
    IF NOT pg_try_advisory_lock(1002) THEN
        RAISE NOTICE 'Another instance of epoch_summary is already running. Exiting.';
        PERFORM pg_sleep(1);
        RAISE NOTICE 'Skipping duplicate job run.';
        RETURN;
    END IF;
END $$;

-- Create table if not exists
CREATE TABLE IF NOT EXISTS public.epoch_summary
(
    epoch_no word31type NOT NULL,
    phase text COLLATE pg_catalog."default" NOT NULL,
    start_time timestamp with time zone,
    end_time timestamp with time zone,
    pledge_influence numeric(5,4),
    decentralisation numeric(5,4),
    optimal_pool_count integer,
    saturation_point numeric(20,5),
    total_active_stake numeric,
    pool_count integer,
    created_at timestamp with time zone DEFAULT now(),
    stake_address_count integer,
    circulating_supply numeric,
    CONSTRAINT epoch_summary_pkey PRIMARY KEY (epoch_no)
);

-- Main upsert logic

WITH last_epoch AS (
    SELECT COALESCE(MAX(epoch_no), -1) AS last_epoch_no
    FROM epoch_summary
),
circulating AS (
    SELECT
        epoch_no,
        (45000000000000000 - (reserves + treasury)) AS circulating_supply
    FROM ada_pots
),
epoch_data AS (
    SELECT
        ep.epoch_no,
        e.start_time,
        e.end_time,
        ep.decentralisation,
        ep.influence AS pledge_influence,
        ep.optimal_pool_count,
        SUM(es.amount::numeric) AS total_active_stake,
        COUNT(DISTINCT es.addr_id) AS stake_address_count,
        COUNT(DISTINCT es.pool_id) AS pool_count,
        CASE
            WHEN ep.epoch_no < 208 THEN 'Byron'
            WHEN ep.epoch_no BETWEEN 208 AND 250 THEN 'Shelley'
            WHEN ep.epoch_no BETWEEN 251 AND 343 THEN 'Goguen'
            ELSE 'Basho'
        END AS phase,
        c.circulating_supply
    FROM epoch_param ep
    JOIN epoch e ON e.no = ep.epoch_no
    JOIN epoch_stake es ON es.epoch_no = ep.epoch_no
    JOIN circulating c ON c.epoch_no = ep.epoch_no
    WHERE ep.epoch_no > (SELECT last_epoch_no FROM last_epoch)
    GROUP BY ep.epoch_no, ep.decentralisation, ep.influence, ep.optimal_pool_count, e.start_time, e.end_time, c.circulating_supply
)
INSERT INTO epoch_summary (
    epoch_no, start_time, end_time, decentralisation, pledge_influence, optimal_pool_count,
    total_active_stake, stake_address_count, pool_count, phase, saturation_point, circulating_supply, created_at
)
SELECT
    epoch_no,
    start_time,
    end_time,
    decentralisation,
    pledge_influence,
    optimal_pool_count,
    total_active_stake,
    stake_address_count,
    pool_count,
    phase,
    circulating_supply / NULLIF(optimal_pool_count, 0)::numeric AS saturation_point,
    circulating_supply,
    NOW()
FROM epoch_data
ON CONFLICT (epoch_no)
DO UPDATE
SET
    decentralisation = EXCLUDED.decentralisation,
    pledge_influence = EXCLUDED.pledge_influence,
    optimal_pool_count = EXCLUDED.optimal_pool_count,
    total_active_stake = EXCLUDED.total_active_stake,
    stake_address_count = EXCLUDED.stake_address_count,
    pool_count = EXCLUDED.pool_count,
    phase = EXCLUDED.phase,
    saturation_point = EXCLUDED.saturation_point,
    circulating_supply = EXCLUDED.circulating_supply,
    created_at = NOW()
WHERE epoch_summary.decentralisation IS DISTINCT FROM EXCLUDED.decentralisation
    OR epoch_summary.pledge_influence IS DISTINCT FROM EXCLUDED.pledge_influence
    OR epoch_summary.optimal_pool_count IS DISTINCT FROM EXCLUDED.optimal_pool_count
    OR epoch_summary.total_active_stake IS DISTINCT FROM EXCLUDED.total_active_stake
    OR epoch_summary.stake_address_count IS DISTINCT FROM EXCLUDED.stake_address_count
    OR epoch_summary.pool_count IS DISTINCT FROM EXCLUDED.pool_count
    OR epoch_summary.phase IS DISTINCT FROM EXCLUDED.phase
    OR epoch_summary.saturation_point IS DISTINCT FROM EXCLUDED.saturation_point
    OR epoch_summary.circulating_supply IS DISTINCT FROM EXCLUDED.circulating_supply;

-- Release lock at the end
SELECT pg_advisory_unlock(1002);


