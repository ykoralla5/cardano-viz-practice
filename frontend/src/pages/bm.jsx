import * as d3 from 'd3'
import { Children, useEffect, useMemo, useRef, useState, useCallback, use } from 'react'
import { clsx } from 'clsx'
import LayoutWrapper from '../components/LayoutWrapper'
import FilterForm from '../components/FilterForm'
import InfoPanel from '../components/InfoPanel'
import TopX from '../components/TopX'
import { fetchPoolData } from '../api/fetchPoolData'
import { ClipLoader } from 'react-spinners'

/* Fetching data from API and keeping addresses holding top 50% of stakes */
export default function BubbleMap() {
    // State values
    const [rawData, setRawData] = useState(null)
    const [poolData, setPoolData] = useState([])
    const [movementData, setMovementData] = useState([])
    const [epochParamData, setEpochParamData] = useState([])
    const [selectedElement, setSelectedElement] = useState(null) // {type: 'pool' or 'link', id: pool_id or link_id}
    const [selectedElementData, setSelectedElementData] = useState(null) // {data: {}, delegationData: []}
    const [searchQuery, setSearchQuery] = useState("")
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)
    const [filters, setFilters] = useState({
        selectedRankMin: null,
        selectedRankMax: null,
        selectedSlotMin: null,
        selectedSlotMax: null,
        epoch: 560,
        retiredPoolsToggle: true,
        delegationChangedToggle: true
    })

    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
    const [isTopXModalOpen, setIsTopXModalOpen] = useState(false)

    const toggleFilterModal = () => setIsFilterModalOpen(prev => !prev);
    const toggleTopXModal = () => setIsTopXModalOpen(prev => !prev);

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
            .range([5, 75])
    }, [poolData])

    const saturationPercentScale = useMemo(() => {
        if (!poolData.length) return () => 0.5
        return d3.scaleLinear()
            .domain([d3.min(poolData, d => d.saturation_ratio), d3.max(poolData, d => d.saturation_ratio)])
            .range([0, 100])
    }, [poolData])

    const saturationScale = useMemo(() => {
        if (!poolData.length) return () => "#ccc"
        return d3.scaleLinear()
            .domain([d3.max(poolData, d => d.saturation_ratio), d3.min(poolData, d => d.saturation_ratio)]) // inverted so that higher saturation ratio = less saturated color
            .range([0, 1])
    }, [poolData])

    const linkTransparencyScale = useMemo(() => {
        if (!movementData.length) return () => 1
        return d3.scaleSqrt()
            .domain([d3.min(movementData, d => d.amount), d3.max(movementData, d => d.amount)])
            .range([0.25, 1])
    }, [movementData])

    const linkWidthScale = useMemo(() => {
        if (!movementData.length) return () => 1
        return d3.scaleSqrt()
            .domain([d3.min(movementData, d => d.amount), d3.max(movementData, d => d.amount)])
            .range([1, 5])
    }, [movementData])

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

    // Filter nodes on filters chosen by user
    const filteredNodes = useMemo(() => {
        if (!poolData.length) return [0, 0]

        // If delegationChangedToggle is on, show only pools whose delegation changed
        if (filters.delegationChangedToggle) {
            const changedPools = new Set(movementData.flatMap(d => [d.source_pool_id, d.destination_pool_id]))
            return rankedNodes
                .filter(pool => changedPools.has(pool.pool_id))
                // Filter out pools outside selected rank
                .filter(pool => pool.rank >= filters.selectedRankMin && pool.rank <= filters.selectedRankMax)
                // If retiredPoolsToggle is true, show all pools; if false, show only active pools
                .filter(pool => filters.retiredPoolsToggle || pool.is_active)
            // return filtered
        }
        return rankedNodes
            // Filter out pools outside selected rank
            .filter(pool => pool.rank >= filters.selectedRankMin && pool.rank <= filters.selectedRankMax)
            // If retiredPoolsToggle is true, show all pools; if false, show only active pools
            .filter(pool => filters.retiredPoolsToggle || pool.is_active)
    }, [poolData, filters.selectedRankMin, filters.selectedRankMax, filters.retiredPoolsToggle, filters.delegationChangedToggle])

    // Filter node links on filters chosen by user
    const filteredLinks = useMemo(() => {
        if (!movementData.length) return [0, 0]
        return movementData
            .filter(link => link.slot_no >= filters.selectedSlotMin && link.slot_no <= filters.selectedSlotMax)
    }, [movementData, filteredNodes, filters.selectedSlotMin, filters.selectedSlotMax])

    // Final nodes and links to be used in the visualization
    // This allows filtering by both nodes and links
    const { finalNodes, finalLinks } = useMemo(() => {
        const nodeIds = new Set(filteredNodes.map(p => p.pool_id))
        const links = filteredLinks
            .filter(link => nodeIds.has(link.source_pool_id) && nodeIds.has(link.destination_pool_id)) 
            .filter(link => link.movement_type === 'REDELEGATION') // Show only redelegations on visualization
            .map(link => ({
                tx_id: link.tx_id,
                slot_no: link.slot_no,
                source: link.source_pool_id,
                target: link.destination_pool_id,
                value: link.movement_count,
                movement_amount: link.amount,
                movement_type: link.movement_type,
                source_stake_change_percent: link.source_stake_change_percent,
                dest_stake_change_percent: link.dest_stake_change_percent
                })
            )

        const nodes = filteredNodes
            .filter(n => links.some(l => l.source === n.pool_id || l.target === n.pool_id))
        // If delegationChangedToggle is off, return all filtered nodes; if on, return only nodes that have links
        return { finalNodes: filters.delegationChangedToggle ? nodes : filteredNodes, finalLinks: links }
    }, [filteredNodes, filteredLinks])

    // Derive min and max slot from epoch data
    const minMaxSlot = useMemo(() => {
        if (!movementData.length) return [0, 0]
        const minSlot = d3.min(movementData, d => d.slot_no)
        const maxSlot = d3.max(movementData, d => d.slot_no)
        return [minSlot, maxSlot]
    }, [movementData])

    // Update selectedSlotMin and selectedSlotMax when minMaxSlot changes
    useEffect(() => {
        setFilters(prevFilters => ({
            ...prevFilters,
            selectedSlotMin: minMaxSlot[0],
            selectedSlotMax: minMaxSlot[1]
        }))
    }, [minMaxSlot])

    // Update selectedSlotMin and selectedSlotMax when minMaxSlot changes
    useEffect(() => {
        setFilters(prevFilters => ({
            ...prevFilters,
            selectedRankMin: minMaxRank[0],
            selectedRankMax: minMaxRank[1]
        }))
    }, [minMaxRank])

    // set selectedElementData when selectedElement changes
    useEffect(() => {

        // setSelectedElementData(null) // reset selectedElementData to avoid showing old data while new data is being fetched
        const fetchElementData = async () => {
            try {
                if (selectedElement) {
            const {type, id} = selectedElement
            if (id) {
                let data = null
                let delegationData = null
                if (type === 'pool') {
                    data = finalNodes.find(pool => pool.pool_id === id)
                    delegationData = finalLinks.filter(l => l.source.pool_id === id || l.target.pool_id === id)
                }
                else if (type === 'link') {
                    data = finalLinks.find(link => link.tx_id === id)
                    delegationData = null
                }
                setSelectedElementData({"data": data || null, "delegationData": delegationData || null})
            }
        } else {
            setSelectedElementData(null)
        }
            }
            catch (err) {
                console.error("Error fetching selected element data: ", err)
            }
        }
        fetchElementData()
        
    }, [selectedElement, finalNodes, finalLinks])

    const onSearch = useCallback((value) => {
        const found = filteredNodes.find(node => node.pool_id === value)
        if (found) {
            setSelectedElement(found)
        } else {
            alert("Pool not found in the current selection. Please adjust the filters or check the Pool ID.")
        }
    })

    const nodesCount = useMemo(() => finalNodes.length, [finalNodes])

    // if (isLoading) return <ClipLoader color="white" loading={isLoading} size={100} aria-label="Loading Spinner" data-testid="loader" />
    if (error) return <div className="text-gray-500 dark:text-white">Error: {error.message}</div>
    if (!rawData) return

    return (
        <main className="font-display text-base flex-grow relative w-full bg-white border-gray-200 dark:bg-gray-900 flex items-center justify-center text-gray-800 text-xl overflow-hidden">
            <div className="absolute w-full top-4 z-10 px-4 flex justify-between space-x-2">
                <button className="bg-white dark:bg-gray-600 text-base p-2 rounded-sm text-gray-600 dark:text-white hover:bg-teal-400 hover:text-black cursor-pointer" onClick={toggleFilterModal}>Filters</button>
                {/* <div>    
                    <div>
                    <label for="success" class="block mb-2 text-sm font-medium text-green-700 dark:text-green-500">Your name</label>
                    <input
                        type="text"
                        id="success"
                        // value={searchQuery}
                        // onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleEnter}
                        placeholder="Search Pool id"
                        className="bg-green-50 border border-green-500 text-green-900 dark:text-green-400 placeholder-green-700 dark:placeholder-green-500 text-sm rounded-lg focus:ring-green-500 focus:border-green-500 block w-full p-2 dark:bg-gray-700 dark:border-green-500"/>
                    <p class="mt-2 text-sm text-green-600 dark:text-green-500"><span class="font-medium">Well done!</span> Some success message.</p>
                    </div>
                </div> */}
                <button className="bg-white dark:bg-gray-600 text-base p-2 rounded-sm text-gray-600 dark:text-white hover:bg-teal-400 hover:text-black cursor-pointer" onClick={toggleTopXModal}>Top 10</button>
            </div>
            {/* Keep showing bubble map of old data if data already exists. If getting initial data, show div */}
            {(finalNodes.length !== 0 && finalLinks.length !== 0) && (
                <>
                    <FilterForm
                        isOpen={isFilterModalOpen} 
                        onClose={toggleFilterModal}
                        filters={filters}
                        setFilters={setFilters}
                        minMaxRank={minMaxRank}
                        minMaxSlot={minMaxSlot}
                        epochRange={epochRange}
                        nodesCount={nodesCount}
                        totalNodes={poolData.length}
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                    />
                    <section id="d3-chart-container" className="w-full flex flex-col items-center relative m-0">
                        <LayoutWrapper
                            nodes={finalNodes} links={finalLinks}
                            scales={{ 'radiusScale': radiusScale, 'saturationScale': saturationScale, 'linkTransparencyScale': linkTransparencyScale, 'linkWidthScale': linkWidthScale, 'saturationPercentScale': saturationPercentScale }}
                            selectedElement={selectedElement}
                            setSelectedElement={setSelectedElement} 
                            selectedElementData={selectedElementData}
                            setSelectedElementData={setSelectedElementData} />
                    </section>
                    <InfoPanel 
                        selectedElement={selectedElement} setSelectedElement={setSelectedElement}
                        selectedElementData={selectedElementData} setSelectedElementData={setSelectedElementData} />
                    <TopX 
                        isOpen={isTopXModalOpen}
                        onClose={toggleTopXModal}
                        selectedElement={selectedElement}
                        setSelectedElement={setSelectedElement}
                        nodes={finalNodes} />
                </>
            )}
            {isLoading && (
                <div className="absolute inset-0 flex justify-center items-center bg-white/20 background-blur-sm z-50">
                    <ClipLoader color="white" loading={isLoading} size={100} aria-label="Loading Spinner" data-testid="loader" />
                </div>
            )}
        </main>
    )
}