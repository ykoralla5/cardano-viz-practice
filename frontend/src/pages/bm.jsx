import * as d3 from 'd3'
import React, { useEffect, useMemo, useState, useCallback, use } from 'react'
import LayoutWrapper from '../components/LayoutWrapper'
import FilterForm from '../components/FilterForm'
import InfoPanel from '../components/InfoPanel'
import TopX from '../components/TopX'
import EpochList from '../components/EpochList'
import EpochData from '../components/EpochData'
import { fetchPoolData } from '../api/fetchPoolData'
import { fetchEpochs, fetchCurrentEpoch } from '../api/fetchEpochMetadata'
import { ClipLoader } from 'react-spinners'
import Legend from '../components/Legend'

/* Fetching data from API and keeping addresses holding top 50% of stakes */
export default function BubbleMap() {
    // State values
    const [rawData, setRawData] = useState(null)
    const [poolData, setPoolData] = useState([])
    const [movementData, setMovementData] = useState([])
    const [epochsList, setEpochsList] = useState([])
    const [currentEpochData, setCurrentEpochData] = useState({})
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

    const RANK_WINDOW = filters.epoch < 450 ? 250 : 500 // Since recent epochs have less activity

    // Modal states
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
    const [isTopXModalOpen, setIsTopXModalOpen] = useState(false)
    const [isEpochListOpen, setEpochListOpen] = useState(false)
    const [isEpochDataOpen, setEpochDataOpen] = useState(false)
    const [isLegendOpen, setLegendOpen] = useState(false)

    // Modal toggle functions
    const toggleFilterModal = () => setIsFilterModalOpen(prev => !prev)
    const toggleTopXModal = () => setIsTopXModalOpen(prev => !prev)
    const toggleEpochList = () => setEpochListOpen(prev => !prev)
    const toggleEpochData = () => setEpochDataOpen(prev => !prev)
    const toggleLegend = () => setLegendOpen(prev => !prev)

    // Constants
    const [epochRange, setEpochRange] = useState([210, 560])
    const [slotRange, setSlotRange] = useState([0, 1])

    // Function to fetch data
    const fetchDelegationData = useCallback(async () => {
        setIsLoading(true)
        try {
            const response = await fetchPoolData(filters.epoch)
            setRawData(response)
            setMovementData(response[0]['delegation_movements'])
            setPoolData(response[0]['pool_stats'])
            setCurrentEpochData(response[0]['epoch_detail'])

            const initialMaxRank = response[0]['pool_stats'].length - 1
            const initialMinRank = Math.max(0, initialMaxRank - RANK_WINDOW)
            const initialMinSlot = d3.min(response[0]['delegation_movements'], d => d.slot_no)
            const initialMaxSlot = d3.max(response[0]['delegation_movements'], d => d.slot_no)

            setFilters(prev => ({
                ...prev,
                selectedRankMin: initialMinRank,
                selectedRankMax: initialMaxRank,
                selectedSlotMin: initialMinSlot,
                selectedSlotMax: initialMaxSlot
            }))
        }
        catch (err) {
            setError(err)
        }
        finally {
            setIsLoading(false)
        }
    }, [filters.epoch])

    console.time('Total front-end load')

    const fetchEpochsList = useCallback(async () => {
        const response = await fetchEpochs()
        setEpochsList(response[0]['epochs_list'])
        setEpochRange(response[0]['min_max_epoch'])
        setSlotRange(response[0]['min_max_slot'])
    }, [])

    // Fetch data on the change in epoch input
    useEffect(() => {
        fetchEpochsList()
        // console.log('Fetched epochs list')
    }, [fetchEpochsList])

    // Fetch data on the change in epoch input
    useEffect(() => {
        if (!filters.epoch) return

        // console.time('fetch data')
        fetchDelegationData()
        // console.timeEnd('fetch data')

    }, [fetchDelegationData])

    // Compute scales
    const radiusScale = useMemo(() => {
        if (!poolData.length) return () => 5 // fallback

        // console.time('compute radius scale')

        const scale = d3.scaleSqrt()
            .domain([1, d3.max(poolData, d => d.total_stake)])
            .range([2.5, 100])

        // console.timeEnd('compute radius scale')
        return scale
    }, [poolData])

    const linkTransparencyScale = useMemo(() => {
        if (!movementData.length) return () => 1

        // console.time('compute link transparency scale')
        const scale = d3.scaleSqrt()
            .domain([d3.min(movementData, d => d.amount), d3.max(movementData, d => d.amount)])
            .range([0.5, 1])
        // console.timeEnd('compute link transparency scale')

        return scale
    }, [movementData])

    const linkWidthScale = useMemo(() => {
        if (!movementData.length) return () => 1

        // console.time('compute link width scale')
        const scale = d3.scaleSqrt()
            .domain([d3.min(movementData, d => d.amount), d3.max(movementData, d => d.amount)])
            .range([1, 5])
        // console.timeEnd('compute link width scale')

        return scale
    }, [movementData])

    const saturationScale = useMemo(() => {
        if (!poolData.length) return () => "#ccc"

        // console.time('compute saturation scale')
        const maxSat = d3.max(poolData, p => p.saturation_ratio)

        const redScale = d3.scaleLinear()
            .domain([1, maxSat])
            .range(["#dd2b25", "#67000d"])

        // console.timeEnd('compute saturation scale')

        return (saturation) => {
            if (saturation < 1) return "#0c824dff"
            else if (saturation <= 1.5) return "#ff6900"
            else if (saturation > 1.5) return redScale(saturation)
        }
    }, [poolData])

    const overSaturatedPoolCount = useMemo(() => {
        if (!poolData.length) return 0
        return poolData.filter(p => p.saturation_ratio > 1).length
    }, [poolData])

    // Rank nodes by stake and compute additional attributes
    const rankedNodes = useMemo(() => {
        if (!poolData.length) {
            console.log('No pool data for ranking')
            return []
        }

        // console.time('compute ranked nodes')

        const nodes = poolData
            .slice()
            .sort((a, b) => a.total_stake - b.total_stake) // highest stake first
            .map((pool, i) => ({
                ...pool,
                rank: i + 1,
                radius: radiusScale(pool.total_stake)
            }))

        // console.timeEnd('compute ranked nodes')

        return nodes
    }, [poolData])

    const poolIdsWithMovement = useMemo(() => {
        // console.time('compute pool ids with movement')
        const poolIdsFlat = new Set(movementData.flatMap(d => [d.source_pool_id, d.destination_pool_id]))
        // console.timeEnd('compute pool ids with movement')
        return poolIdsFlat
    }, [movementData])

    // Apply filters
    const eligibleList = useMemo(() => {
        if (!rankedNodes.length) return []

        const nodes = rankedNodes.filter(pool => {
            // Retired toggle
            if (!filters.retiredPoolsToggle && !pool.is_active) return false

            // Delegation changed toggle: check if pool appears in movementData
            if (filters.delegationChangedToggle && poolIdsWithMovement && !poolIdsWithMovement.has(pool.pool_id)) return false

            return true
        })
        // console.timeEnd('compute eligible list')

        return nodes
    }, [rankedNodes, filters.retiredPoolsToggle, filters.delegationChangedToggle, poolIdsWithMovement])

    // Filter nodes on filters chosen by user
    const filteredNodes = useMemo(() => {
        if (!eligibleList.length || filters.selectedRankMin === null || filters.selectedRankMax === null) {
            // console.log('No eligible nodes or rank filter not set')
            return []
        }

        console.time('compute filtered nodes')
        const min = filters.selectedRankMin ?? 0
        const max = filters.selectedRankMax ?? eligibleList.length - 1
        const nodes = eligibleList.slice(min, max + 1)
        // console.timeEnd('compute filtered nodes')

        return nodes
    }, [eligibleList, filters.selectedRankMin, filters.selectedRankMax])

    // Filter node links on filters chosen by user
    const filteredLinks = useMemo(() => {
        if (!movementData.length) {
            console.log('No movement data for filtering links')
            return [0, 0]
        }
        // console.time('compute filtered links')
        const links = movementData
            .filter(link => link.slot_no >= filters.selectedSlotMin && link.slot_no <= filters.selectedSlotMax)
        // console.timeEnd('compute filtered links')

        return links
    }, [movementData, filters.selectedSlotMin, filters.selectedSlotMax])

    // Final nodes and links to be used in the visualization
    // This allows filtering by both nodes and links
    const { finalNodes, finalLinks } = useMemo(() => {
        if (!filteredNodes.length || !filteredLinks.length) return { finalNodes: [], finalLinks: [] }

        console.time('compute final links')
        const nodeIds = new Set(filteredNodes.map(p => p.pool_id))
        const links = filteredLinks
            .filter(link => nodeIds.has(link.source_pool_id) && nodeIds.has(link.destination_pool_id))
            .map(link => ({
                tx_id: link.tx_id,
                slot_no: link.slot_no,
                addr_id: link.addr_id,
                addr_view: link.addr_view,
                source: link.source_pool_id,
                target: link.destination_pool_id,
                value: link.movement_count,
                movement_amount: link.amount,
                movement_type: link.movement_type,
                source_stake_change_percent: link.source_stake_change_percent,
                dest_stake_change_percent: link.dest_stake_change_percent
            })
            )

        console.timeEnd('compute final links')
        console.time('compute final nodes')

        let nodes = filteredNodes
            .filter(n => links.some(l => l.source === n.pool_id || l.target === n.pool_id))

        // Include selected element so that it always shows when moving from epoch to epoch
        if (selectedElement && !nodes.some(n => n.pool_id === selectedElement.id)) {
            const selectedNode = rankedNodes.find(pool => pool.pool_id === selectedElement?.id)
            nodes = [...nodes, selectedNode]
        }
        console.timeEnd('compute final nodes')

        // If delegationChangedToggle is off, return all filtered nodes; if on, return only nodes that have links
        return { finalNodes: nodes, finalLinks: links }
    }, [filteredNodes, filteredLinks])

    // Merge delegations between same pools and sum their movement_amount for allowed movement types
    const nodeById = useMemo(() => {
        if (!finalNodes.length) return new Map()
        return new Map(finalNodes.filter(p => p && p.pool_id).map(p => [p.pool_id, p]))
    }, [finalNodes])
    
    const ALLOWED_MOVEMENT_TYPES = ["NON_FINALIZED_REDELEGATION", "NON_FINALIZED_REDELEGATION_PENDING", "FINALIZED_REDELEGATION"]
    
    const redelegationLinks = useMemo(() => {
        if (!finalLinks.length) return []
        return finalLinks.filter(l => ALLOWED_MOVEMENT_TYPES.includes(l.movement_type))
    }, [finalLinks])

    console.time('collapse links')

    const collapsedLinks = Array.from(
        d3.group(redelegationLinks, l => {
            const key = [l.source, l.target].sort().join('-')
            return key
        }),
        ([key, group]) => {
            const hasAtoB = group.some(l => l.source === group[0].source)
            const hasBtoA = group.some(l => l.source === group[0].target)
            const isBidirectional = hasAtoB && hasBtoA
            return {
            source: nodeById.get(group[0].source),
            target: nodeById.get(group[0].target),
            count: group.length,
            movement_amount: d3.sum(group, g => g.movement_amount || 0),
            bidirectional: isBidirectional,
            originalLinks: group
        }}
    )

    // Derive min and max slot from epoch data
    const minMaxSlot = useMemo(() => {
        if (!movementData.length) return [0, 0]

        // console.time('compute min max slot')
        const minSlot = d3.min(movementData, d => d.slot_no)
        const maxSlot = d3.max(movementData, d => d.slot_no)
        // console.timeEnd('compute min max slot')

        return [minSlot, maxSlot]
    }, [movementData])

    // useMemo(() => {
    //     console.log("Computed final nodes and links", {
    //         finalNodes: finalNodes.length,
    //         finalLinks: finalLinks.length,
    //         filters: filters,
    //         minMaxSlot: [minMaxSlot[0], minMaxSlot[1]]
    //     })
    // }, [finalNodes, finalLinks, filters])

    // Update selectedSlotMin and selectedSlotMax when minMaxSlot changes
    useEffect(() => {
        if (!minMaxSlot[0] && !minMaxSlot[1]) return
        setFilters(prevFilters => ({
            ...prevFilters,
            selectedSlotMin: minMaxSlot[0],
            selectedSlotMax: minMaxSlot[1]
        }))
    }, [minMaxSlot])

    // // Update selectedRankMin and selectedRankMax when eligibleList changes
    useEffect(() => {
        if (!eligibleList.length) return

        const maxIndex = eligibleList.length - 1
        const minIndex = Math.max(0, maxIndex - RANK_WINDOW)

        setFilters(prevFilters => ({
            ...prevFilters,
            selectedRankMin: minIndex,
            selectedRankMax: maxIndex
        }))
    }, [eligibleList])

    // set selectedElementData when selectedElement changes
    useEffect(() => {
        if (!finalNodes.length || !finalLinks.length) return

        // setSelectedElementData(null) // reset selectedElementData to avoid showing old data while new data is being fetched
        const fetchElementData = async () => {
            try {
                if (selectedElement) {
                    const { type, id } = selectedElement
                    if (id) {
                        let data = null
                        let delegationData = null
                        if (type === 'pool') {
                            data = finalNodes.find(p => p.pool_id === id)
                            delegationData = finalLinks.filter(l => l.source === id || l.target === id)
                                .map(l => ({
                                    ...l,
                                    source: finalNodes.find(n => n.pool_id === l.source),
                                    target: finalNodes.find(n => n.pool_id === l.target)
                                }))
                        }
                        else if (type === 'link') {
                            const linkMap = new Map(collapsedLinks.map(l => [`${l.source.pool_id}-${l.target.pool_id}`, l]))
                            const key = `${id.source}-${id.target}`
                            const currentLink = linkMap.get(key)
                            if (currentLink) {
                                const { source, target, originalLinks } = currentLink
                                data = [source, target]
                                delegationData = originalLinks.map(l => ({
                                    ...l,
                                    source: finalNodes.find(n => n.pool_id === l.source),
                                    target: finalNodes.find(n => n.pool_id === l.target)
                                })
                                )
                            }
                        }
                        setSelectedElementData({ "data": data || null, "delegationData": delegationData || null })
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

    console.log('Selected element:', selectedElement)
    console.log('Selected element data:', selectedElementData)

    const handleSearch = useCallback((e) => {
        e.preventDefault()
        const searchTerm = searchQuery.trim().toLowerCase()

        const found = filteredNodes.find(
            node => {
                const name = typeof node.name === "string" ? node.name.toLowerCase() : ""
                const ticker = typeof node.ticker === "string" ? node.ticker.toLowerCase() : ""
                const view = typeof node.pool_view === "string" ? node.pool_view.toLowerCase() : ""
                const homepage = typeof node.homepage === "string" ? node.homepage.toLowerCase() : ""

                return (
                    name.includes(searchTerm) || ticker.includes(searchTerm) || view.includes(searchTerm) || homepage.includes(searchTerm)
                )
            }

        )
        if (found) {
            setSelectedElement({ type: 'pool', id: found.pool_id })
        } else {
            alert("No pool found with that name, ticker or id.")
        }
    })

    const sortedSlots = finalLinks.map(n => n.slot_no).sort((a, b) => a - b)

    // useEffect(() => {
    //     if (!finalNodes.length || !finalLinks.length) return
    //     console.timeEnd('Total front-end load')
    // }, [finalNodes, finalLinks])

    // Count nodes and links in final data
    const nodesCount = useMemo(() => finalNodes.length, [finalNodes])
    const linksCount = useMemo(() => finalLinks.length, [finalLinks])

    if (error) return <div className="text-gray-500 dark:text-white">Error: {error.message}</div>
    if (!rawData) return

    return (
        <main className="font-display text-base flex-grow relative w-full bg-white border-gray-200 bg-gray-300 dark:bg-gray-900 flex items-center justify-center text-gray-800 text-xl overflow-hidden">
            {/* Sub menu */}
            <div className="absolute w-full top-2 z-10 px-4 flex justify-between space-x-2">
                {/* Left */}
                <div className="flex gap-5">
                    <button className={`text-base p-2 rounded-sm font-semibold hover:bg-teal-400 hover:text-black cursor-pointer border border-gray-300 dark:border-gray-500 ${isFilterModalOpen ? "bg-teal-400 text-black" : "bg-white dark:bg-gray-600 text-gray-600 dark:text-white"}`} onClick={toggleFilterModal}>Filters</button>
                    <div className="relative w-100">
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <input type="search" id="search" className="block p-2.5 w-full z-1 h-10 text-base text-gray-900 bg-gray-50 rounded-lg rounded-s-gray-100 rounded-s-2 border border-gray-300 dark:border-gray-500 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:border-blue-500" value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by pool name, ticker, id or homepage..." />
                            <button type="submit" className="absolute top-0 end-0 p-2.5 z-10 h-10 text-sm font-medium text-white bg-teal-500 rounded-e-lg border border-teal-700 hover:bg-teal-800 focus:ring-4 focus:outline-none focus:ring-teal-300 dark:bg-teal-600 dark:hover:bg-teal-700 dark:focus:ring-teal-800"><svg className="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z" />
                            </svg></button>
                        </form>
                    </div>
                </div>
                {/* Right */}
                <div className="flex gap-5">
                    <button className={`text-base p-2 rounded-sm font-semibold  hover:bg-teal-400 hover:text-black cursor-pointer border border-gray-300 dark:border-gray-500 ${isEpochDataOpen ? "bg-teal-400 text-black" : "bg-white dark:bg-gray-600 text-gray-600 dark:text-white"}`} onClick={toggleEpochData}>Epoch statistics</button>
                    <button className={`text-base p-2 rounded-sm font-semibold  hover:bg-teal-400 hover:text-black cursor-pointer border border-gray-300 dark:border-gray-500 ${isEpochListOpen ? "bg-teal-400 text-black" : "bg-white dark:bg-gray-600 text-gray-600 dark:text-white"}`} onClick={toggleEpochList}>Epoch: {filters.epoch}</button>
                    <button className={`text-base p-2 rounded-sm font-semibold  hover:bg-teal-400 hover:text-black cursor-pointer border border-gray-300 dark:border-gray-500 ${isTopXModalOpen ? "bg-teal-400 text-black" : "bg-white dark:bg-gray-600 text-gray-600 dark:text-white"}`} onClick={toggleTopXModal}>Pools list</button>
                    <button className={`text-base p-2 rounded-sm font-semibold  hover:bg-teal-400 hover:text-black cursor-pointer border border-gray-300 dark:border-gray-500 ${isLegendOpen ? "bg-teal-400 text-black" : "bg-white dark:bg-gray-600 text-gray-600 dark:text-white"}`} onClick={toggleLegend}>Legend</button>
                </div>
            </div>
            {/* Keep showing bubble map of old data if data already exists. If getting initial data, show div */}
            {(finalNodes.length !== 0 && finalLinks.length !== 0) && (
                <>
                    <FilterForm
                        isOpen={isFilterModalOpen}
                        onClose={toggleFilterModal}
                        filters={filters}
                        setFilters={setFilters}
                        minMaxSlot={minMaxSlot}
                        epochRange={epochRange}
                        nodesCount={nodesCount}
                        totalNodes={poolData.length}
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        sortedSlots={sortedSlots}
                        eligibleList={eligibleList}
                        rankWindow={RANK_WINDOW}
                    />
                    <section id="d3-chart-container" className="w-full flex flex-col items-center relative m-0 bg-gray-300 dark:bg-gray-900">
                        {finalNodes.length !== 0 && finalLinks.length !== 0 &&
                            <LayoutWrapper
                                nodes={finalNodes} links={finalLinks} collapsedLinks={collapsedLinks}
                                scales={{ 'radiusScale': radiusScale, 'saturationScale': saturationScale, 'linkTransparencyScale': linkTransparencyScale, 'linkWidthScale': linkWidthScale }}
                                selectedElement={selectedElement}
                                setSelectedElement={setSelectedElement}
                                selectedElementData={selectedElementData}
                                setSelectedElementData={setSelectedElementData} />}

                    </section>
                    <InfoPanel
                        selectedElement={selectedElement} setSelectedElement={setSelectedElement}
                        selectedElementData={selectedElementData} setSelectedElementData={setSelectedElementData} 
                        saturationScale={saturationScale}
                    />
                    <EpochData
                        isOpen={isEpochDataOpen}
                        onClose={toggleEpochData}
                        currentEpochData={currentEpochData}
                        nodesCount={nodesCount}
                        linksCount={linksCount}
                        overSaturatedPoolCount={overSaturatedPoolCount}
                    />
                    <EpochList
                        isOpen={isEpochListOpen}
                        onClose={toggleEpochList}
                        filters={filters}
                        setFilters={setFilters}
                        epochsList={epochsList}
                    />
                    <TopX
                        isOpen={isTopXModalOpen}
                        onClose={toggleTopXModal}
                        selectedElement={selectedElement}
                        setSelectedElement={setSelectedElement}
                        nodes={finalNodes} />
                    <Legend
                        isOpen={isLegendOpen}
                        onClose={toggleLegend}
                        radiusScale={radiusScale}
                    />
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