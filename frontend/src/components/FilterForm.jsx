import { max } from 'd3'
import Slider from 'rc-slider'
import 'rc-slider/assets/index.css'
import { useState } from 'react'
import * as utils from '../utils/dataTransformers'

export default function FilterForm({ filters, setFilters, minMaxRank, minMaxSlot, epochRange, nodesCount, totalNodes, searchQuery, setSearchQuery }) {
    const { selectedRankMin, selectedRankMax, selectedSlotMin, selectedSlotMax, epoch, retiredPoolsToggle, delegationChangedToggle } = filters
    const [isModalOpen, setIsModalOpen] = useState(false)

    const handleRankChange = ([start, end]) => {
        
        setFilters(prev => ({ ...prev, selectedRankMin: start, selectedRankMax: end }))
    }

    const handleEpochChange = (e) => {
        setFilters(prev => ({ ...prev, epoch: Number(e.target.value) }))
    }

    const handleSlotChange = ([start, end]) => {
        setFilters(prev => ({ ...prev, selectedSlotMin: start, selectedSlotMax: end }))
    }

    const goPrevEpoch = () => {
        if (epoch > epochRange[0]) {
            setFilters(prev => ({ ...prev, epoch: epoch - 1 }))
        }
    }

    const goNextEpoch = () => {
        if (epoch < epochRange[1]) {
            setFilters(prev => ({ ...prev, epoch: epoch + 1 }))
        }
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

    const handleEnter = (e) => {
        if (e.key === "Enter") {
            setSearchQuery(e.target.value)
        }
    }

    return (
        <div className="w-full h-full absolute inset-0 text-gray-600 dark:text-white text-base">
            {/* Top buttons */}
            <div className="absolute w-full top-4 z-10 px-4 flex justify-between space-x-2">
                <button className="bg-white dark:bg-gray-600 text-base p-2 rounded-sm text-gray-600 dark:text-white hover:text-green-300 cursor-pointer" onClick={handleCloseClick}>Filters</button>
                <div>    
                    <div>
                    {/* <label for="success" class="block mb-2 text-sm font-medium text-green-700 dark:text-green-500">Your name</label> */}
                    {/* <input
                        type="text"
                        id="success"
                        // value={searchQuery}
                        // onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleEnter}
                        placeholder="Search Pool id"
                        className="bg-green-50 border border-green-500 text-green-900 dark:text-green-400 placeholder-green-700 dark:placeholder-green-500 text-sm rounded-lg focus:ring-green-500 focus:border-green-500 block w-full p-2 dark:bg-gray-700 dark:border-green-500"/> */}
                    {/* <p class="mt-2 text-sm text-green-600 dark:text-green-500"><span class="font-medium">Well done!</span> Some success message.</p> */}
                    </div>
                </div>
                <button className="bg-white dark:bg-gray-600 text-base p-2 rounded-sm text-gray-600 dark:text-white hover:text-green-300 cursor-pointer">Top 10</button>
            </div>
            <div className="z-1 absolute left-10 right-10 bottom-2.5 bg-white dark:bg-gray-600 px-5 py-1 rounded-lg flex flex-col justify-center">
                {/* Slot selector */}
                <div className="flex flex-col justify-center pb-5">
                    <label htmlFor="slot-slider" className="self-center">Filter by slot: Showing 
                        <span className="font-bold"> {utils.translateSlot(filters.selectedSlotMin)} </span>to
                        <span className="font-bold"> {utils.translateSlot(filters.selectedSlotMax)}</span>
                    </label>
                    <Slider
                        range
                        className='t-slider'
                        min={minMaxSlot[0]}
                        max={minMaxSlot[1]}
                        step={1}
                        allowCross={false} // dont allow handles to cross each other
                        pushable={1} // allow handles to push each other
                        value={[filters.selectedSlotMin, filters.selectedSlotMax]}
                        // onChangeComplete={([start, end]) => {
                        //     if (end - start > 1000) {
                        //         if (start !== minMaxSlot[0]) {
                        //             console.log(start, end)
                        //             end = start + 1000
                        //         }
                        //         else start = end - 1000
                        //     }
                        //     setFilters(prev => ({ ...prev, selectedSlotMin: start, selectedSlotMax: end }))
                        // }}
                        onChange={handleSlotChange} />
                        </div>
                {/* Epoch selector */}
                <Slider 
                    className='t-slider' 
                    value={filters.epoch} 
                    min={epochRange[0]} max={epochRange[1]} 
                    onChange={handleEpochChange} />
                {/* <input
                    id="epoch-slider"
                    className='custom-range-input'
                    type="range"
                    min={epochRange[0]} max={epochRange[1]} step="1"
                    value={filters.epoch}
                    onChange={handleEpochChange} /> */}
                    {/* -1 / +1 Epoch navigation buttons */}
                <div className="flex items-center justify-center space-x-4 mt-2">
                    <button type="button" onClick={goPrevEpoch} className="bg-blue-700 hover:bg-blue-800 text-base p-1 rounded-full inline-flex items-center cursor-pointer" disabled={epoch <= epochRange[0]}>
                        <svg className="w-5 h-5 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m15 19-7-7 7-7"/>
                        </svg>
                    </button>
                    <p className="text-lg bold">{filters.epoch}</p>
                    <button type="button" onClick={goNextEpoch} className="bg-blue-700 hover:bg-blue-800 text-base p-1 rounded-full inline-flex items-center cursor-pointer" disabled={epoch >= epochRange[1]}>
                        <svg className="w-5 h-5 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m9 5 7 7-7 7"/>
                        </svg>
                    </button>
                </div>
            </div>
            {/* Stake threshold selector*/}
            {isModalOpen &&
                <div className="fixed inset-0 flex items-center justify-center z-20" onClick={handleCloseClick}>
                    <div className="bg-gray-100 dark:bg-gray-700 p-6 rounded-lg flex flex-col space-y-4 justify-center z-20 text-gray-600 dark:text-white" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-end">
                            <button type="button" className="px-2 py-1 rounded-lg text-gray-900 dark:text-gray-200 bg-gray-200 dark:bg-gray-800 hover:bg-green-300 hover:text-black" onClick={handleCloseClick}>Close</button>
                        </div>
                        <div className="flex flex-col justify-center">
                            <label htmlFor="stake-threshold-slider" className="self-center">Filter by rank: Showing {nodesCount} nodes out of {totalNodes} nodes</label>
                            <Slider
                                range
                                className='t-slider'
                                min={minMaxRank[0]}
                                max={minMaxRank[1]}
                                step={1}
                                allowCross={false} // dont allow handles to cross each other
                                pushable={1} // allow handles to push each other
                                value={[filters.selectedRankMin, filters.selectedRankMax]}
                                onChange={handleRankChange}
                                // onChangeComplete={([start, end]) => {
                                //     if (end - start > 100) {
                                //         if (start !== minMaxSlot[0]) {
                                //             console.log(start, end)
                                //             end = start + 100
                                //         }
                                //         else start = end - 100
                                //     }
                                // setFilters(prev => ({ ...prev, selectedRankMin: start, selectedRankMax: end }))
                                // }}
                            />
                        </div>
                        {/* Show only pools whose delegation changed */}
                        <div className="flex flex-row justify-center">
                            <label className="inline-flex items-center cursor-pointer" htmlFor="delegationOnly">
                                <input type="checkbox" value="" className="sr-only peer"
                        checked={filters.delegationChangedToggle} onChange={handleDelegationOnlyChange} id="delegationOnly"/>
                                <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 dark:peer-checked:bg-blue-600"></div>
                                <span className="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">Show only pools whose delegation changed</span>
                            </label>
                        </div>
                        {/* Retired pools toggle */}
                        <div className="flex flex-row justify-center">
                            <label className="inline-flex items-center cursor-pointer" htmlFor="retiredOnly">
                                <input type="checkbox" value="" className="sr-only peer"
                        checked={filters.retiredPoolsToggle} onChange={handleRetiredChange} id="retiredOnly"/>
                                <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 dark:peer-checked:bg-blue-600"></div>
                                <span className="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">Show retired pools</span>
                            </label>
                        </div>
                    </div>
                </div>
            }
        </div>
    )
}