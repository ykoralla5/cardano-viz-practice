import Slider from 'rc-slider'
import 'rc-slider/assets/index.css'
import { useState } from 'react'

export default function FilterForm({ filters, setFilters, minMaxRank, epochRange, nodesCount, totalNodes }) {
    const { selectedRankMin, selectedRankMax, epoch, retiredPoolsToggle, delegationChangedToggle } = filters
    const [isModalOpen, setIsModalOpen] = useState(false)

    const handleRankChange = ([min, max]) => {
        setFilters(prev => ({ ...prev, selectedRankMin: min, selectedRankMax: max }))
    }

    const handleEpochChange = (e) => {
        setFilters(prev => ({ ...prev, epoch: Number(e.target.value) }))
    }

    const handleRetiredChange = (e) => {
        setFilters(prev => ({ ...prev, retiredPoolsToggle: !prev.retiredPoolsToggle }))
    }

    const handleDelegationOnlyChange = (e) => {
        setFilters(prev => ({ ...prev, delegationChangedToggle: !prev.delegationChangedToggle }))
    }

    const handleCloseClick = () => {
        setIsModalOpen(!isModalOpen)
    }

    return (
        <div className="w-full h-[10vh] p-4">
            <button className="bg-white dark:bg-gray-600 text-base p-2 rounded-sm text-gray-600 dark:text-white hover:text-green-300" 
                onClick={handleCloseClick}>
                    Filters
            </button>
            <form className="text-white dark:text-white">
                {/* Epoch selector */}
                <div className="z-1 absolute left-[1.5vw] right-[1.5vw] bottom-[5vh] bg-white dark:bg-gray-600 px-2 py-1 rounded-lg flex flex-col justify-center">
                    <input
                        id="epoch-slider"
                        type="range"
                        min={epochRange[0]} max={epochRange[1]} step="1"
                        value={filters.epoch}
                        onChange={handleEpochChange}/>
                    <p className="self-center">{filters.epoch}</p>
                </div>
                {/* Stake threshold selector*/}
                {isModalOpen && 
                    <div className="z-1 bg-white dark:bg-gray-700 p-6 rounded-lg absolute left-[30vw] top-[40vh]">
                        <div>
                            <button type="button" className="absolute right-10 text-gray-200 hover:text-green-300" onClick={handleCloseClick}>&#10006;</button>
                        </div>
                        <div className="flex flex-col justify-center">
                            <label htmlFor="stake-threshold-slider" className="self-center">Filter by rank: Showing {nodesCount} nodes out of {totalNodes} nodes</label>
                            <Slider
                                range
                                className='t-slider'
                                min={minMaxRank[0]}
                                max={minMaxRank[1]}
                                value={[filters.selectedRankMin, filters.selectedRankMax]}
                                onChange={handleRankChange}/>
                        </div>
                        {/* Show only pools whose delegation changed */}
                        <div className="flex flex-row justify-center">
                            <input
                                className=""
                                type="checkbox"
                                checked={filters.delegationChangedToggle}
                                onChange={handleDelegationOnlyChange}
                                id="delegationOnly" />
                            <label htmlFor="delegationOnly" className="pl-2 self-center">Show only pools whose delegation changed</label>
                        </div>
                        {/* Retired pools toggle */}
                        <div className="flex flex-row justify-center">
                            <input
                                className=""
                                type="checkbox"
                                checked={filters.retiredPoolsToggle}
                                onChange={handleRetiredChange}
                                id="retiredOnly" />
                            <label htmlFor="retiredOnly" className="pl-2 self-center">Show retired pools</label>
                        </div>
                    </div>
                }
            </form>
        </div>
    )
}