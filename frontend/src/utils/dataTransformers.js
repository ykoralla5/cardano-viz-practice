import * as d3 from 'd3'

// Reconstruct and filter api call data - Keep stake holders holding top x% of pool stake
export function getStructuredData(apiData, stakeThreshold)
    {
        if (!apiData) return {} // In case poolData is not fetched and stored yet

        // Group by epoch and pool
        const groupByEpochPool = d3.group( // returns type InternMap
            apiData,
            d => d.epoch_no,
            d => d.pool_id)
    
        //console.log(groupByEpochPool)

        // Keep data according to stake threshold (type object)
        var filteredGroupByEpochPool = Array.from(groupByEpochPool, ([epoch, poolMap]) => [
                epoch,
                new Map(
                    Array.from(poolMap, ([pool, rows]) => {
                    //console.log(Object.values(rows))
                    const sorted = rows.slice().sort((a,b) => b.amount - a.amount)
                    //console.log(sorted)
                    const total = d3.sum(sorted, d => d.amount)
                    const cum = d3.cumsum(sorted, d => d.amount)
                
                    // Find index where stake threshold is met and then keep part till the index
                    const cut = cum.findIndex(v => v >= stakeThreshold * total)
                    return [pool, sorted.slice(0, cut + 1)]
                    })
                )
            ]
        )
        //console.log(filteredGroupByEpochPool)
    return filteredGroupByEpochPool
    }

export function findEpochByKeyInMap(map, epochNumber) {
    for (const [epochKey, epochValue] of map.entries()) {
        if (epochValue[0] === epochNumber) { // Since index 0 contains epoch_no
            return epochKey // Return the epoch number if it matches the targetValue
        }
    }
    return undefined // Or null, or -1, if not found
}

export function transformToD3Hierarchy(structuredData) {
    const index = 1 // since index 0 contains just epoch_no and index contains pool and address data
    if (!structuredData[index]) return null

    // Reconstruct into name children structure for usability in d3
    const d3DataForSelectedEpoch = {
            children: Array.from(structuredData[index],([pool, rows]) => ({ // root
                name: pool, //`pool_${pool}`, // depth 1
                children: rows.map(delegator => ({
                    name: delegator.addr_id, //`addr_${r.addr_id}`, // depth 2
                    value: delegator.amount,
                    //amount: r.amount
                }))
            }))
    }
    //console.log(d3DataForSelectedEpoch)
    return d3DataForSelectedEpoch
}

export function createDelegatorPoolMap(epochData) {
    const delegatorToPoolMap = new Map() // Map<delegatorName, poolName>
    if (!epochData || !epochData.children) {
        //console.error("No data")
        return delegatorToPoolMap
    }

    epochData.children.forEach(pool => {
        if (pool.children) {
            pool.children.forEach(delegator => {
                delegatorToPoolMap.set(delegator.name, pool.name)
            });
        }
    })
    return delegatorToPoolMap
}

export function getStructuredPoolPerfData(apiData, epochNumber) {
    if (!apiData) return {} // In case poolData is not fetched and stored yet

    // Get pool performance data for selected epoch
    const selectedEpochData = apiData[0][epochNumber] || [];

    // Reconstruct into name children structure for usability in d3
    const d3DataForSelectedEpoch = {
            name: 'all-pools',
            children: selectedEpochData.map(d => ({ // root
                name: d.pool_id, // depth 2
                value: d.pool_stake,
                saturation_percent: d.saturation_percent,
                actual_block_count: d.actual_block_count,
                expected_block_count: d.expected_block_count
            }))
        }

    console.log(d3DataForSelectedEpoch)
    return d3DataForSelectedEpoch
}

