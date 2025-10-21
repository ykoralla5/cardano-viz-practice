\set ON_ERROR_STOP on

\timing on

WITH last_epoch AS (
    SELECT COALESCE(MAX(epoch_no), -1) AS last_epoch_no
    FROM pool_stats_summary
),
pledge_at_snapshot AS (
    SELECT DISTINCT ON (ph.id, e.no) ph.id AS pool_id,
    e.no AS epoch_no,
    pu.pledge
    FROM pool_hash ph
        JOIN pool_update pu ON pu.hash_id = ph.id
        JOIN tx t ON t.id = pu.registered_tx_id
        JOIN block b ON b.id = t.block_id
        JOIN epoch e ON b."time" <= e.end_time
    ORDER BY ph.id, e.no, b."time" DESC
), 
total_active AS (
    SELECT epoch_stake.epoch_no,
    sum(epoch_stake.amount::numeric) AS total_active_stake
    FROM epoch_stake
    GROUP BY epoch_stake.epoch_no
),
final AS (
    SELECT es.epoch_no,
           es.pool_id,
           ph.view AS pool_view,
           SUM(es.amount::numeric) AS total_stake,
           COUNT(DISTINCT es.addr_id) AS delegator_count,
           MAX(pledges.pledge) AS pledge,
           BOOL_OR(NOT EXISTS (
               SELECT 1 FROM pool_retire pr
               WHERE pr.hash_id = es.pool_id
                 AND pr.retiring_epoch::integer <= es.epoch_no::integer
           )) AS is_active,
           SUM(es.amount::numeric) / (ta.total_active_stake / ep.optimal_pool_count::numeric) AS saturation_ratio
    FROM epoch_stake es
    JOIN pool_hash ph ON ph.id = es.pool_id
    JOIN epoch_param ep ON ep.epoch_no = es.epoch_no
    JOIN total_active ta ON ta.epoch_no = es.epoch_no
    LEFT JOIN pledge_at_snapshot pledges ON pledges.pool_id = es.pool_id AND pledges.epoch_no = es.epoch_no
    CROSS JOIN last_epoch le
    WHERE es.epoch_no > le.last_epoch_no
    GROUP BY es.epoch_no, es.pool_id, ph.view, ep.optimal_pool_count, ta.total_active_stake
)
INSERT INTO pool_stats_summary (epoch_no, pool_id, pool_view, total_stake, delegator_count, pledge, is_active, saturation_ratio)
 SELECT epoch_no, pool_id, pool_view, total_stake, delegator_count, pledge, is_active, saturation_ratio
   FROM final
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
