\set ON_ERROR_STOP on

\timing on

-- Acquire advisory lock (only one instance runs at a time)
DO $$
BEGIN
    IF NOT pg_try_advisory_lock(1004) THEN
        RAISE NOTICE 'Another instance of pool_stats_summary is already running. Exiting.';
        PERFORM pg_sleep(1);
        RAISE NOTICE 'Skipping duplicate job run.';
        RETURN;
    END IF;
END $$;

-- Main upsert logic

-- permanent table for pre-aggregated pool stake per epoch
CREATE TABLE IF NOT EXISTS epoch_pool_stake_summary (
    epoch_no int,
    pool_id int,
    total_stake numeric,
    delegator_count int,
    PRIMARY KEY (epoch_no, pool_id)
);

INSERT INTO epoch_pool_stake_summary (epoch_no, pool_id, total_stake, delegator_count)
SELECT epoch_no,
       pool_id,
       SUM(amount::numeric) AS total_stake,
       COUNT(DISTINCT addr_id) AS delegator_count
FROM epoch_stake
WHERE epoch_no > COALESCE((SELECT MAX(epoch_no) FROM epoch_pool_stake_summary), -1)
GROUP BY epoch_no, pool_id;

-- WITH last_epoch AS (
--     SELECT COALESCE(MAX(epoch_no), -1) AS last_epoch_no
--     FROM pool_stats_summary
-- ),
-- circulating AS (
--     SELECT
--         epoch_no,
--         (45000000000000000 - (reserves + treasury)) AS circulating_supply
--     FROM ada_pots
-- ),
-- pledge_at_snapshot AS (
--     SELECT DISTINCT ON (ph.id, e.no) ph.id AS pool_id,
--     e.no AS epoch_no,
--     pu.pledge
--     FROM pool_hash ph
--         JOIN pool_update pu ON pu.hash_id = ph.id
--         JOIN tx t ON t.id = pu.registered_tx_id
--         JOIN block b ON b.id = t.block_id
--         JOIN epoch e ON b."time" <= e.end_time
--     ORDER BY ph.id, e.no, b."time" DESC
-- ), 
-- total_active AS (
--     SELECT epoch_stake.epoch_no,
--     sum(epoch_stake.amount::numeric) AS total_active_stake
--     FROM epoch_stake
--     GROUP BY epoch_stake.epoch_no
-- ),
-- final AS (
--     SELECT es.epoch_no,
--            es.pool_id,
--            ph.view AS pool_view,
--            SUM(es.amount::numeric) AS total_stake,
--            COUNT(DISTINCT es.addr_id) AS delegator_count,
--            MAX(pledges.pledge) AS pledge,
--            BOOL_OR(NOT EXISTS (
--                SELECT 1 FROM pool_retire pr
--                WHERE pr.hash_id = es.pool_id
--                  AND pr.retiring_epoch::integer <= es.epoch_no::integer
--            )) AS is_active,
--            SUM(es.amount::numeric) / (c.circulating_supply / ep.optimal_pool_count::numeric) AS saturation_ratio
--     FROM epoch_pool_stake_summary epss
--     JOIN pool_hash ph ON ph.id = epss.pool_id
--     LEFT JOIN (
--         SELECT DISTINCT ON (ph.id, e.no) ph.id AS pool_id, e.no AS epoch_no, pu.pledge
--         FROM pool_hash ph
--         JOIN pool_update pu ON pu.hash_id = ph.id
--         JOIN tx t ON t.id = pu.registered_tx_id
--         JOIN block b ON b.id = t.block_id
--         JOIN epoch e ON b."time" <= e.end_time
--         WHERE e.no > COALESCE((SELECT MAX(epoch_no) FROM pool_stats_summary), -1)
--         ORDER BY ph.id, e.no, b."time" DESC
--     ) tp ON tp.pool_id = eps.pool_id AND tp.epoch_no = eps.epoch_no
--     JOIN epoch_param ep ON ep.epoch_no = eps.epoch_no
--     JOIN epoch_summary esum ON esum.epoch_no = eps.epoch_no
--     WHERE eps.epoch_no > COALESCE((SELECT MAX(epoch_no) FROM pool_stats_summary), -1)
--     GROUP BY es.epoch_no, es.pool_id, ph.view, ep.optimal_pool_count, ta.total_active_stake, c.circulating_supply
-- )

INSERT INTO pool_stats_summary (epoch_no, pool_id, pool_view, total_stake, delegator_count, pledge, is_active, saturation_ratio)
 SELECT epss.epoch_no,
        epss.pool_id,
        ph.view AS pool_view,
        epss.total_stake,
        epss.delegator_count,
        COALESCE(tp.pledge, 0) AS pledge,
           NOT EXISTS (
               SELECT 1 FROM pool_retire pr
               WHERE pr.hash_id = epss.pool_id
                 AND pr.retiring_epoch <= epss.epoch_no
           ) AS is_active,
           epss.total_stake / (esum.circulating_supply / ep.optimal_pool_count::numeric) AS saturation_ratio
    FROM epoch_pool_stake_summary epss
    JOIN pool_hash ph ON ph.id = epss.pool_id
    LEFT JOIN (
        SELECT DISTINCT ON (ph.id, e.no) ph.id AS pool_id, e.no AS epoch_no, pu.pledge
        FROM pool_hash ph
        JOIN pool_update pu ON pu.hash_id = ph.id
        JOIN tx t ON t.id = pu.registered_tx_id
        JOIN block b ON b.id = t.block_id
        JOIN epoch e ON b."time" <= e.end_time
        WHERE e.no > COALESCE((SELECT MAX(epoch_no) FROM pool_stats_summary), -1)
        ORDER BY ph.id, e.no, b."time" DESC
    ) tp ON tp.pool_id = epss.pool_id AND tp.epoch_no = epss.epoch_no
    JOIN epoch_param ep ON ep.epoch_no = epss.epoch_no
    JOIN epoch_summary esum ON esum.epoch_no = epss.epoch_no
    WHERE epss.epoch_no > COALESCE((SELECT MAX(epoch_no) FROM pool_stats_summary), -1)
        AND epss.epoch_no <= (SELECT MAX(epoch_no) FROM epoch_summary)
    GROUP BY epss.epoch_no, epss.pool_id, ph.view, COALESCE(tp.pledge, 0), ep.optimal_pool_count, epss.total_stake, esum.circulating_supply
  ON CONFLICT (epoch_no, pool_id)
  DO UPDATE SET
    total_stake = EXCLUDED.total_stake,
    delegator_count = EXCLUDED.delegator_count,
    pledge = EXCLUDED.pledge,
    is_active = EXCLUDED.is_active,
    saturation_ratio = EXCLUDED.saturation_ratio,
    created_at = NOW()
    WHERE pool_stats_summary.total_stake IS DISTINCT FROM EXCLUDED.total_stake
    OR pool_stats_summary.delegator_count IS DISTINCT FROM EXCLUDED.delegator_count
    OR pool_stats_summary.pledge IS DISTINCT FROM EXCLUDED.pledge
    OR pool_stats_summary.is_active IS DISTINCT FROM EXCLUDED.is_active
    OR pool_stats_summary.saturation_ratio IS DISTINCT FROM EXCLUDED.saturation_ratio;

-- Release lock at the end
SELECT pg_advisory_unlock(1004);