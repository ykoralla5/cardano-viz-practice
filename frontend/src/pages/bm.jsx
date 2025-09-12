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
    const [epochParamData, setEpochParamData] = useState([])
    const [selectedElement, setSelectedElement] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)
    const [filters, setFilters] = useState({
        selectedRankMin: 0,
        selectedRankMax: 500,
        epoch: 560,
        retiredPoolsToggle: true,
        delegationChangedToggle: true
    })

    // Constants
    const [epochRange, setEpochRange] = useState(560)

    // Function to fetch data
    async function fetchData() {
        try {
            setIsLoading(true)
            // Make API call
            const response = await fetchPoolData(filters.epoch)
            setRawData(response)
            setMovementData(response[0]['delegator_movement_counts'])
            setEpochParamData(response[0]['epoch_params'])
            setPoolData(response[0]['pool_stats'])
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

    const rankedNodes = useMemo(() => {
        if (!poolData.length) return []

        return poolData
            .slice()
            .sort((a, b) => a.total_stake - b.total_stake) // highest stake first
            .map((pool, i) => ({
            ...pool,
            rank: i + 1 // rank starts at 1
            }))
        }, [poolData])


    // Derive min and max stake held by a pool in current epoch
    const minMaxRank = useMemo(() => {
        if (!poolData.length) return [0, 0]
        return [0, poolData.length - 1]
    }, [poolData])

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


    // Filter nodes on stake range chosen by user
    const filteredNodes = useMemo(() => {
        if (!poolData.length) return [0, 0]
        //const rankedNodes = poolData.sort((a, b) => a.total_stake - b.total_stake).map((d, i) => ({...d, rank: i + 1}))
        // If delegationChangedToggle is on, show only pools whose delegation changed
        if (filters.delegationChangedToggle) {
            const changedPools = new Set(movementData.flatMap(d => [d.source_pool_id, d.destination_pool_id]))
            const filtered = rankedNodes
                .filter(pool => changedPools.has(pool.pool_id))
                .filter(pool => pool.rank >= filters.selectedRankMin && pool.rank <= filters.selectedRankMax)
                .filter(pool => filters.retiredPoolsToggle || pool.is_active)
                // .filter(pool => pool.total_stake >= filters.selectedStakeMin && pool.total_stake <= filters.selectedStakeMax)
                // If retiredPoolsToggle is true, show all pools; if false, show only active pools
                
            return filtered
        }
        return rankedNodes
            .filter(pool => pool.rank >= filters.selectedRankMin && pool.rank <= filters.selectedRankMax)
            .filter(pool => filters.retiredPoolsToggle || pool.is_active)
            // .filter(pool => pool.total_stake >= filters.selectedStakeMin && pool.total_stake <= filters.selectedStakeMax)
            // If retiredPoolsToggle is true, show all pools; if false, show only active pools
            
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
        <main className="h-[90vh] font-display text-base flex-grow w-full bg-white border-gray-200 dark:bg-gray-900 flex items-center justify-center text-gray-800 text-xl overflow-hidden">
            <section id="d3-chart-container" className="w-full flex flex-col items-center">
                <LayoutWrapper 
                    nodes={filteredNodes} nodeLinks={filteredLinks}
                    radiusScale={radiusScale} saturationScale={saturationScale}
                    selectedElement={selectedElement}
                    setSelectedElement={setSelectedElement} />
                <FilterForm 
                    filters={filters} 
                    setFilters={setFilters} 
                    minMaxRank={minMaxRank} 
                    epochRange={epochRange}
                    nodesCount={filteredNodes.length}
                    />
                <InfoPanel selectedElement={selectedElement} />
            </section>
        </main>
    )
}