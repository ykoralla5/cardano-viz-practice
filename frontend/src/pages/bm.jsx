import * as d3 from 'd3'
import { Children, useEffect, useMemo, useRef, useState, useCallback, use } from 'react'
import { clsx } from 'clsx'
import LayoutWrapper from '../components/LayoutWrapper'
import FilterForm from '../components/FilterForm'
import InfoPanel from '../components/InfoPanel'
import { fetchPoolData } from '../api/fetchPoolData'
import { ClipLoader } from 'react-spinners'

/* Fetching data from API and keeping addresses holding top 50% of stakes */
export default function BubbleMap() {
    // State values
    const [rawData, setRawData] = useState(null)
    const [poolData, setPoolData] = useState([])
    const [movementData, setMovementData] = useState([])
    const [performanceData, setPerformanceData] = useState([])
    const [epochParamData, setEpochParamData] = useState([])
    const [selectedElement, setSelectedElement] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)
    const [filters, setFilters] = useState({
        selectedRankMin: 0,
        selectedRankMax: 2700,
        epoch: 560,
        retiredPoolsToggle: true,
        delegationChangedToggle: true
    })

    // Constants
    const [epochRange, setEpochRange] = useState([210, 560])

    // Function to fetch data
    async function fetchData() {
        try {
            setIsLoading(true)
            // Make API call
            const response = await fetchPoolData(filters.epoch)
            setRawData(response)
            setMovementData(response[0]['delegation_movements'])
            setPoolData(response[0]['pool_stats'])
            setPerformanceData(response[0]['pool_performance'])
            setEpochParamData(response[0]['epoch_params'])
            setEpochRange(response[0]['min_max_epoch'])
            }
        catch (err) {
            setError(err)
            }
        finally {
            setIsLoading(false)
        }
    }

    // Fetch data on the change in epoch input
    useEffect(() => {
        fetchData()
    }, [filters.epoch])

    const radiusScale = useMemo(() => {
        if (!poolData.length) return () => 5 // fallback
        return d3.scaleSqrt()
                .domain([0, d3.max(poolData, d => d.total_stake)])
                .range([1, 40])
        }, [poolData])

    const saturationScale = useMemo(() => {
        if (!poolData.length) return () => "#ccc"
        return d3.scaleLinear()
                .domain([d3.max(poolData, d => d.saturation_ratio), d3.min(poolData, d => d.saturation_ratio)])
                .range([0, 1])
        }, [poolData])

    const rankedNodes = useMemo(() => {
        if (!poolData.length) return []

        return poolData
            .slice()
            .sort((a, b) => a.total_stake - b.total_stake) // highest stake first
            .map((pool, i) => ({
            ...pool,
            rank: i + 1,
            radius: radiusScale(pool.total_stake)
            }))
        }, [poolData])

    // Derive min and max stake held by a pool in current epoch
    const minMaxRank = useMemo(() => {
        if (!poolData.length) return [0, 0]
        return [0, poolData.length - 1]
    }, [poolData])

    // Filter nodes on stake range chosen by user
    const filteredNodes = useMemo(() => {
        if (!poolData.length) return [0, 0]

        // If delegationChangedToggle is on, show only pools whose delegation changed
        if (filters.delegationChangedToggle) {
            const changedPools = new Set(movementData.flatMap(d => [d.source_pool_id, d.destination_pool_id]))
            const filtered = rankedNodes
                .filter(pool => changedPools.has(pool.pool_id))
                // Filter out pools outside selected rank
                .filter(pool => pool.rank >= filters.selectedRankMin && pool.rank <= filters.selectedRankMax)
                // If retiredPoolsToggle is true, show all pools; if false, show only active pools
                .filter(pool => filters.retiredPoolsToggle || pool.is_active)
            return filtered
        }
        return rankedNodes
            // Filter out pools outside selected rank
            .filter(pool => pool.rank >= filters.selectedRankMin && pool.rank <= filters.selectedRankMax)
            // If retiredPoolsToggle is true, show all pools; if false, show only active pools
            .filter(pool => filters.retiredPoolsToggle || pool.is_active)
    }, [poolData, filters.selectedRankMin, filters.selectedRankMax, filters.retiredPoolsToggle, filters.delegationChangedToggle])
    
    // Filter node links on filtered nodes as a result of stake range chosen by user
    const filteredLinks = useMemo(() => {
        if (!movementData.length) return [0, 0]
        const nodeIds = new Set(filteredNodes.map(p => p.pool_id))
        return movementData.filter(
            link => nodeIds.has(link.source_pool_id) && nodeIds.has(link.destination_pool_id)
        )
    }, [movementData, filteredNodes])

    if (isLoading) return <ClipLoader color="white" loading={isLoading} size={100} aria-label="Loading Spinner" data-testid="loader" />
    // if (isLoading) return <div className="text-gray-500 dark:text-white">Loading pools...</div>
    if (error) return <div className="text-gray-500 dark:text-white">Error: {error.message}</div>
    if (!rawData) return

    return(
        <main className="font-display text-base flex-grow w-full bg-white border-gray-200 dark:bg-gray-900 flex items-center justify-center text-gray-800 text-xl overflow-hidden">
            <FilterForm 
                    filters={filters} 
                    setFilters={setFilters} 
                    minMaxRank={minMaxRank} 
                    epochRange={epochRange}
                    nodesCount={filteredNodes.length}
                    totalNodes={poolData.length}
            />
            <section id="d3-chart-container" className="w-full flex flex-col items-center relative m-0">
                <LayoutWrapper 
                    nodes={filteredNodes} nodeLinks={filteredLinks}
                    radiusScale={radiusScale} saturationScale={saturationScale}
                    selectedElement={selectedElement}
                    setSelectedElement={setSelectedElement} />
                <InfoPanel selectedElement={selectedElement} setSelectedElement={setSelectedElement} />
            </section>
        </main>
    )
}