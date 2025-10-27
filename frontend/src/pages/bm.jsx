import * as d3 from 'd3'
import React, { useEffect, useMemo, useState, useCallback } from 'react'
import LayoutWrapper from '../components/LayoutWrapper'
import FilterForm from '../components/FilterForm'
import InfoPanel from '../components/InfoPanel'
import TopX from '../components/TopX'
import EpochList from '../components/EpochList'
import EpochData from '../components/EpochData'
import { fetchPoolData } from '../api/fetchPoolData'
import { fetchEpochs, fetchCurrentEpoch } from '../api/fetchEpochMetadata'
import { ClipLoader } from 'react-spinners'

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

    // Modal states
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
    const [isTopXModalOpen, setIsTopXModalOpen] = useState(false)
    const [isEpochListOpen, setEpochListOpen] = useState(false)
    const [isEpochDataOpen, setEpochDataOpen] = useState(false)

    // Modal toggle functions
    const toggleFilterModal = () => setIsFilterModalOpen(prev => !prev)
    const toggleTopXModal = () => setIsTopXModalOpen(prev => !prev)
    const toggleEpochList = () => setEpochListOpen(prev => !prev)
    const toggleEpochData = () => setEpochDataOpen(prev => !prev)

    // Constants
    const [epochRange, setEpochRange] = useState([210, 560])

    // Function to fetch data
    async function fetchDelegationData() {
        try {
            setIsLoading(true)
            // Make API call
            const response = await fetchPoolData(filters.epoch)
            setRawData(response)
            setMovementData(response[0]['delegation_movements'])
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

    async function fetchEpochsList() {
        const response = await fetchEpochs()
        setEpochsList(response)
        }

    async function fetchCurrentEpochData() {
        if (!filters.epoch) return

        const response = await fetchCurrentEpoch(filters.epoch)
        setCurrentEpochData(response)
        }

    // Fetch data on the change in epoch input
    useEffect(() => {
        fetchEpochsList()
    }, [])

    // Fetch data on the change in epoch input
    useEffect(() => {
        fetchDelegationData()
        fetchCurrentEpochData()
    }, [filters.epoch])

    const radiusScale = useMemo(() => {
        if (!poolData.length) return () => 5 // fallback
        return d3.scaleSqrt()
            .domain([1, d3.max(poolData, d => d.total_stake)])
            .range([5, 100])
    }, [poolData])

    const saturationPercentScale = useMemo(() => {
        if (!poolData.length) return () => 0.5
        return d3.scaleLinear()
            .domain([d3.min(poolData, d => d.saturation_ratio), d3.max(poolData, d => d.saturation_ratio)])
            .range([0, 100])
    }, [poolData])

    

    const linkTransparencyScale = useMemo(() => {
        if (!movementData.length) return () => 1
        return d3.scaleSqrt()
            .domain([d3.min(movementData, d => d.amount), d3.max(movementData, d => d.amount)])
            .range([0.5, 1])
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
                radius: radiusScale(pool.total_stake),
                saturation_percent: (pool.total_stake/(currentEpochData.saturation_point ))*100
            }))
    }, [poolData, currentEpochData])

    const saturationScale = useMemo(() => {
        if (!rankedNodes.length) return () => "#ccc"
        // return d3.scaleLinear()
        //     .domain([d3.max(rankedNodes, d => d.saturation_percent), 50, 25, d3.min(rankedNodes, d => d.saturation_percent)]) // inverted so that higher saturation ratio = less saturated color
        //     .range([0, 1])

        const minSat = d3.min(rankedNodes, d => d.saturation_percent)
    const maxSat = d3.max(rankedNodes, d => d.saturation_percent)

        return (saturation) => {
        if (saturation <= 100) {
            // 0-100%: green -> yellow -> red
            // normalize 0-100% to 0-1 for RdYlGn
            const t = 1 - saturation / 100
            return d3.interpolateYlGn(t)
        } else {
            // above 100%: red -> dark red
            // normalize 100-maxSat to 0-1
            const t = Math.min((saturation - 100) / (maxSat - 100), 1)
            // const t = 1 - saturation / 100
            return d3.interpolateReds(t)
            // ("#ff9900", "#8b0000")(t) // bright red -> dark red
            // ["#fff5f0","#fff4ef","#fff4ee","#fff3ed","#fff2ec","#fff2eb","#fff1ea","#fff0e9","#fff0e8","#ffefe7","#ffeee6","#ffeee6","#ffede5","#ffece4","#ffece3","#ffebe2","#feeae1","#fee9e0","#fee9de","#fee8dd","#fee7dc","#fee6db","#fee6da","#fee5d9","#fee4d8","#fee3d7","#fee2d6","#fee2d5","#fee1d4","#fee0d2","#fedfd1","#feded0","#feddcf","#fedccd","#fedbcc","#fedacb","#fed9ca","#fed8c8","#fed7c7","#fdd6c6","#fdd5c4","#fdd4c3","#fdd3c1","#fdd2c0","#fdd1bf","#fdd0bd","#fdcfbc","#fdceba","#fdcdb9","#fdccb7","#fdcbb6","#fdc9b4","#fdc8b3","#fdc7b2","#fdc6b0","#fdc5af","#fdc4ad","#fdc2ac","#fdc1aa","#fdc0a8","#fcbfa7","#fcbea5","#fcbca4","#fcbba2","#fcbaa1","#fcb99f","#fcb89e","#fcb69c","#fcb59b","#fcb499","#fcb398","#fcb196","#fcb095","#fcaf94","#fcae92","#fcac91","#fcab8f","#fcaa8e","#fca98c","#fca78b","#fca689","#fca588","#fca486","#fca285","#fca183","#fca082","#fc9e81","#fc9d7f","#fc9c7e","#fc9b7c","#fc997b","#fc987a","#fc9778","#fc9677","#fc9475","#fc9374","#fc9273","#fc9071","#fc8f70","#fc8e6f","#fc8d6d","#fc8b6c","#fc8a6b","#fc8969","#fc8868","#fc8667","#fc8565","#fc8464","#fb8263","#fb8162","#fb8060","#fb7f5f","#fb7d5e","#fb7c5d","#fb7b5b","#fb795a","#fb7859","#fb7758","#fb7657","#fb7455","#fa7354","#fa7253","#fa7052","#fa6f51","#fa6e50","#fa6c4e","#f96b4d","#f96a4c","#f9684b","#f9674a","#f96549","#f86448","#f86347","#f86146","#f86045","#f75e44","#f75d43","#f75c42","#f65a41","#f65940","#f6573f","#f5563e","#f5553d","#f4533c","#f4523b","#f4503a","#f34f39","#f34e38","#f24c37","#f24b37","#f14936","#f14835","#f04734","#ef4533","#ef4433","#ee4332","#ed4131","#ed4030","#ec3f2f","#eb3d2f","#eb3c2e","#ea3b2d","#e93a2d","#e8382c","#e7372b","#e6362b","#e6352a","#e5342a","#e43229","#e33128","#e23028","#e12f27","#e02e27","#df2d26","#de2c26","#dd2b25","#dc2a25","#db2924","#da2824","#d92723","#d72623","#d62522","#d52422","#d42321","#d32221","#d22121","#d12020","#d01f20","#ce1f1f","#cd1e1f","#cc1d1f","#cb1d1e","#ca1c1e","#c91b1e","#c71b1d","#c61a1d","#c5191d","#c4191c","#c3181c","#c2181c","#c0171b","#bf171b","#be161b","#bd161a","#bb151a","#ba151a","#b91419","#b81419","#b61419","#b51319","#b41318","#b21218","#b11218","#b01218","#ae1117","#ad1117","#ac1117","#aa1017","#a91016","#a71016","#a60f16","#a40f16","#a30e15","#a10e15","#a00e15","#9e0d15","#9c0d14","#9b0c14","#990c14","#970c14","#960b13","#940b13","#920a13","#900a13","#8f0a12","#8d0912","#8b0912","#890812","#870811","#860711","#840711","#820711","#800610","#7e0610","#7c0510","#7a0510","#78040f","#76040f","#75030f","#73030f","#71020e","#6f020e","#6d010e","#6b010e","#69000d","#67000d"]
        }
    }
    }, [rankedNodes])

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

        let nodes = filteredNodes
            .filter(n => links.some(l => l.source === n.pool_id || l.target === n.pool_id))

        // Include selected element so that it always shows when moving from epoch to epoch
        if (selectedElement && !nodes.some(n => n.pool_id === selectedElement.id)) {
            const selectedNode = rankedNodes.find(pool => pool.pool_id === selectedElement?.id)
            nodes = [...nodes, selectedNode]  
        }

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
                    const { type, id } = selectedElement
                    if (id) {
                        let data = null
                        let delegationData = null
                        if (type === 'pool') {
                            data = finalNodes.find(p => p.pool_id === id)
                            delegationData = finalLinks.filter(l => l.source === id || l.target === id)
                            .map(l => ({
                                ...l,
                                sourceData: finalNodes.find(n => n.pool_id === l.source),
                                targetData: finalNodes.find(n => n.pool_id === l.target)
                            }))
                        }
                        else if (type === 'link') {
                            data = finalLinks.find(l => l.tx_id === id)
                            delegationData = null
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

    const handleSearch = useCallback((e) => {
        e.preventDefault()
        const searchTerm = searchQuery.trim().toLowerCase()

        const found = filteredNodes.find(
            node =>
            {
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
            setSelectedElement({type: 'pool', id: found.pool_id})
        } else {
            alert("No pool found with that name, ticker or id.")
        }
    })

    const nodesCount = useMemo(() => finalNodes.length, [finalNodes])
    const linksCount = useMemo(() => finalLinks.length, [finalLinks])


    // if (isLoading) return <ClipLoader color="white" loading={isLoading} size={100} aria-label="Loading Spinner" data-testid="loader" />
    if (error) return <div className="text-gray-500 dark:text-white">Error: {error.message}</div>
    if (!rawData) return

    return (
        <main className="font-display text-base flex-grow relative w-full bg-white border-gray-200 dark:bg-gray-900 flex items-center justify-center text-gray-800 text-xl overflow-hidden">
            <div className="absolute w-full top-4 z-10 px-4 flex justify-between space-x-2">
                <div className="flex gap-5">
                    <button className={`text-base p-2 rounded-sm font-semibold  hover:bg-teal-400 hover:text-black cursor-pointer ${isFilterModalOpen ? "bg-teal-400 text-black" : "bg-white dark:bg-gray-600 text-gray-600 dark:text-white"}`} onClick={toggleFilterModal}>Filters</button>
                <div className="relative w-100">
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <input type="search" id="search" className="block p-2.5 w-full z-1 text-base text-gray-900 bg-gray-50 rounded-lg rounded-s-gray-100 rounded-s-2 border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:border-blue-500" value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by pool name, ticker, id or homepage..." />
                        <button type="submit" className="absolute top-0 end-0 p-2.5 z-10 h-full text-sm font-medium text-white bg-teal-500 rounded-e-lg border border-teal-700 hover:bg-teal-800 focus:ring-4 focus:outline-none focus:ring-teal-300 dark:bg-teal-600 dark:hover:bg-teal-700 dark:focus:ring-teal-800"><svg className="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z" />
                        </svg></button>
                    </form>
                </div>
                </div>
                <div className="flex gap-5">
                    <button className={`text-base p-2 rounded-sm font-semibold  hover:bg-teal-400 hover:text-black cursor-pointer ${isEpochDataOpen ? "bg-teal-400 text-black" : "bg-white dark:bg-gray-600 text-gray-600 dark:text-white"}`} onClick={toggleEpochData}>Epoch statistics</button>
                    <button className={`text-base p-2 rounded-sm font-semibold  hover:bg-teal-400 hover:text-black cursor-pointer ${isEpochListOpen ? "bg-teal-400 text-black" : "bg-white dark:bg-gray-600 text-gray-600 dark:text-white"}`} onClick={toggleEpochList}>Epoch: {filters.epoch}</button>
                    <button className={`text-base p-2 rounded-sm font-semibold  hover:bg-teal-400 hover:text-black cursor-pointer ${isTopXModalOpen ? "bg-teal-400 text-black" : "bg-white dark:bg-gray-600 text-gray-600 dark:text-white"}`} onClick={toggleTopXModal}>Pools list</button>
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
                    <EpochData
                        isOpen={isEpochDataOpen}
                        onClose={toggleEpochData}
                        currentEpochData={currentEpochData}
                        nodesCount={nodesCount}
                        linksCount={linksCount}
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