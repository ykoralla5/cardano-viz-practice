import Slider from 'rc-slider'
import 'rc-slider/assets/index.css'
import * as utils from '../utils/dataTransformers'
import { useDebounce } from 'use-debounce'
import { every } from 'd3'
// import { debounce } from 'lodash'

export default function FilterForm({ isOpen, onClose, filters, setFilters, minMaxRank, minMaxSlot, epochRange, nodesCount, totalNodes, searchQuery, setSearchQuery }) {
    const { selectedRankMin, selectedRankMax, selectedSlotMin, selectedSlotMax, epoch, retiredPoolsToggle, delegationChangedToggle } = filters
    // rapid
    // const [tempEpochChange, setTempEpochChange] = useState(551)
    // const [tempEpochInput, setTempEpochInput] = useState(560)

    // const handleInputChange = (event) => {
    //     setTempEpochInput(event.target.value)
    // }

    // const handleInputKeyDown = (event) => {
    //     if (event.key === 'Enter') {
    //         const number = parseInt(tempEpochInput)
    //         if (!isNaN(number)) { setFilters(prev => ({...prev, epoch: number}))}
    //     }
    // }

    // const handleInputBlur = () => {
    //     const number = parseInt(tempEpochInput)
    //     // Only set the state if the input is a valid number
    //     if (!isNaN(number)) {
    //         setFilters(prev => ({ ...prev, epoch: number }))
    //     }
    // }

    // const handleEpochSliderChange = (event) => {
    //     const number = parseInt(event.target.value)
    //     setFilters(prev => ({ ...prev, epoch: number }))
    //     setTempEpochInput(event.target.value)
    // }

    const handleRankChange = ([start, end]) => { setFilters(prev => ({ ...prev, selectedRankMin: start, selectedRankMax: end })) }

    // const handleEpochChange = (value) => { 
    //     setFilters(prev => ({ ...prev, epoch: value }))
    //     // setTempEpochChange(value)
    // }

    // Set epoch filter value 300ms after user stops changing the slider (to prevent excessive re-renders)
    // useEffect(() => {
    //     const timeoutId = setTimeout(() => {
    //         setFilters(prev => ({ ...prev, epoch: tempEpochChange }))
    //     }, 300)
    //     return () => clearTimeout(timeoutId)
    // }, [tempEpochChange, 300])

    const handleSlotChange = ([start, end]) => { setFilters(prev => ({ ...prev, selectedSlotMin: start, selectedSlotMax: end }))}

    // const goPrevEpoch = () => {
    //     if (epoch > epochRange[0]) {
    //         setFilters(prev => ({ ...prev, epoch: epoch - 1 }))
    //         setTempEpochInput(epoch - 1)
    //     }
    // }

    // const goNextEpoch = () => {
    //     if (epoch < epochRange[1]) {
    //         setFilters(prev => ({ ...prev, epoch: epoch + 1 }))
    //         setTempEpochInput(epoch + 1)
    //     }
    // }

    // useEffect(() => {
    //     setTempEpochInput(filters.epoch)
    // }, [filters.epoch])

    const handleRetiredChange = (e) => { setFilters(prev => ({ ...prev, retiredPoolsToggle: !prev.retiredPoolsToggle }))}

    const handleDelegationOnlyChange = (e) => { setFilters(prev => ({ ...prev, delegationChangedToggle: !prev.delegationChangedToggle }))}

    const handleEnter = (e) => {
        if (e.key === "Enter") {
            setSearchQuery(e.target.value)
        }
    }

    return (
        <div className="w-full h-full absolute inset-0 text-gray-600 dark:text-white text-base">
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
                {/* <Slider 
                    step={1}
                    className='t-slider' 
                    value={filters.epoch} 
                    min={epochRange[0]} max={epochRange[1]}
                    onChange={handleEpochSliderChange} /> */}
                {/* <div className="flex items-center justify-center space-x-4 mt-2">
                    <button type="button" onClick={goPrevEpoch} className="bg-teal-600 hover:bg-gray-500 text-base p-1 rounded-full inline-flex items-center cursor-pointer" disabled={epoch <= epochRange[0]}>
                        <svg className="w-5 h-5 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m15 19-7-7 7-7"/>
                        </svg>
                    </button>
                    <p className="text-lg bold">{filters.epoch}</p>
                    <input 
                        type="number"
                        className="bg-slate-800 text-center font-bold rounded-md" 
                        min={epochRange[0]} max={epochRange[1]} 
                        value={tempEpochInput} 
                        onKeyDown={handleInputKeyDown}
                        onChange={handleInputChange}
                        onBlur={handleInputBlur}/>
                    <button type="button" onClick={goNextEpoch} className="bg-teal-600 hover:bg-gray-500 text-base p-1 rounded-full inline-flex items-center cursor-pointer" disabled={epoch >= epochRange[1]}>
                        <svg className="w-5 h-5 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m9 5 7 7-7 7"/>
                        </svg>
                    </button>
                </div> */}
            </div>
            {/* Filters modal*/}
            {isOpen &&
                <div className="fixed inset-0 flex items-center justify-center z-20" onClick={onClose}>
                    <div className="bg-gray-100 dark:bg-gray-700 p-6 rounded-lg flex flex-col space-y-4 justify-center z-20 text-gray-600 dark:text-white" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-end">
                            <button type="button" className="px-2 py-1 rounded-lg text-gray-900 dark:text-gray-200 bg-gray-200 dark:bg-gray-800 hover:bg-teal-300 hover:text-black" onClick={onClose}>Close</button>
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
                                <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 dark:peer-focus:ring-teal-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-teal-600 dark:peer-checked:bg-teal-600"></div>
                                <span className="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">Show only pools whose delegation changed</span>
                            </label>
                        </div>
                        {/* Retired pools toggle */}
                        <div className="flex flex-row justify-center">
                            <label className="inline-flex items-center cursor-pointer" htmlFor="retiredOnly">
                                <input type="checkbox" value="" className="sr-only peer"
                        checked={filters.retiredPoolsToggle} onChange={handleRetiredChange} id="retiredOnly"/>
                                <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 dark:peer-focus:ring-teal-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-teal-600 dark:peer-checked:bg-teal-600"></div>
                                <span className="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">Show retired pools</span>
                            </label>
                        </div>
                    </div>
                </div>
            }
        </div>
    )
}