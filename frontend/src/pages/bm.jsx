import * as d3 from 'd3'
import { Children, useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { clsx } from 'clsx'
import BubbleMap from '../components/LayoutWrapper'
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
        selectedStakeMin: 1000000000,
        selectedStakeMax: 50813805220556,
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

    //     useEffect(() => {
//         async function fetchMaxEpoch() {
//             const response = await fetch('/api/epoch-max')
//             const data = await response.json()
//             setMaxEpoch(data.maxEpoch)
//         }
//         fetchMaxEpoch()
// }, [])
    
    // Derive min and max stake held by a pool in current epoch
    const minMaxStake = useMemo(() => {
        if (!poolData.length) return [0, 0]
        return [d3.min(poolData, d => d.total_stake), d3.max(poolData, d => d.total_stake)]
    }, [poolData])

    // Filter nodes on stake range chosen by user
    const filteredNodes = useMemo(() => {
        if (!poolData.length) return [0, 0]
        return poolData
            //.filter(pool => !pool.is_active)
            .filter(pool => pool.total_stake >= filters.selectedStakeMin && pool.total_stake <= filters.selectedStakeMax)
            // If retiredPoolsToggle is true, show all pools; if false, show only active pools
            .filter(pool => filters.retiredPoolsToggle || pool.is_active)
    }, [poolData, filters.selectedStakeMin, filters.selectedStakeMax, filters.retiredPoolsToggle])
    
    // Filter node links on filtered nodes as a result of stake range chosen by user
    const filteredLinks = useMemo(() => {
        if (!movementData.length) return [0, 0]
        const nodeIds = new Set(filteredNodes.map(p => p.pool_id))
        return movementData.filter(
            link => nodeIds.has(link.source_pool_id) && nodeIds.has(link.destination_pool_id)
        )
    }, [movementData, filteredNodes])

    // if (isLoading) return <ClipLoader color="white" loading={isLoading} size={150} aria-label="Loading Spinner" data-testid="loader" />
    if (isLoading) return <div className="text-gray-500 dark:text-white">Loading pools...</div>
    if (error) return <div className="text-gray-500 dark:text-white">Error: {error.message}</div>
    if (!rawData) return

    return(
        <main className="h-[90vh] font-display text-base flex-grow w-full bg-white border-gray-200 dark:bg-gray-900 flex items-center justify-center text-gray-800 text-xl overflow-hidden">
            <section id="d3-chart-container" className="w-full flex flex-col items-center">
                <LayoutWrapper 
                    nodes={filteredNodes} nodeLinks={filteredLinks}
                    // selectedEpoch={selectedEpoch}
                    // stakeThreshold={stakeThreshold}
                    selectedElement={selectedElement}
                    setSelectedElement={setSelectedElement}/>
                <FilterForm 
                    filters={filters} 
                    setFilters={setFilters} 
                    minMaxStake={minMaxStake} 
                    epochRange={epochRange}
                    nodesCount={filteredNodes.length}
                    />
                {selectedElement && <InfoPanel selectedElement={selectedElement} />}
            </section>
        </main>
    )
}