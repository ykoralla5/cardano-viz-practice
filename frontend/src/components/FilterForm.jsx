import Slider from 'rc-slider'
import 'rc-slider/assets/index.css'
import * as utils from '../utils/dataTransformers'
import InfoToolTip from './InfoToolTip'
// import { debounce } from 'lodash'

export default function FilterForm({ isOpen, onClose, filters, setFilters, minMaxRank, minMaxSlot, epochRange, nodesCount, totalNodes, searchQuery, setSearchQuery, eligibleList, rankWindow }) {
    const { selectedRankMin, selectedRankMax, selectedSlotMin, selectedSlotMax, epoch, retiredPoolsToggle, delegationChangedToggle } = filters

    // Handling rank slider changes while maintaining rank window
    const onLeftHandleChange = (newMin) => {
        const newMax = filters.selectedRankMax
        // Ensure rank window is maintained
        if (newMax - newMin > rankWindow) {
            setFilters(prev => ({
                ...prev,
                selectedRankMax: newMax - rankWindow
            }))
        } else {
            setFilters(prev => ({
                ...prev,
                selectedRankMin: newMin,
            }))
        }
    }

    const onRightHandleChange = (newMax) => {
        const newMin = filters.selectedRankMin
        // Ensure rank window is maintained
        if (newMax - newMin > rankWindow) {
            setFilters(prev => ({
                ...prev,
                selectedRankMax: newMin + rankWindow
            }))
        } else {
            setFilters(prev => ({
                ...prev,
                selectedRankMax: newMax,
            }))
        }
    }

    const handleSlotChange = ([start, end]) => {
        setFilters(prev => ({ ...prev, selectedSlotMin: start, selectedSlotMax: end }))
    }

    const handleRetiredChange = (e) => { setFilters(prev => ({ ...prev, retiredPoolsToggle: !prev.retiredPoolsToggle })) }

    const handleDelegationOnlyChange = (e) => { setFilters(prev => ({ ...prev, delegationChangedToggle: !prev.delegationChangedToggle })) }

    return (
        <div className="w-full h-full absolute inset-0 text-gray-600 dark:text-white text-base">
            <div className="z-1 absolute left-10 right-10 bottom-2.5 bg-white dark:bg-gray-600 px-5 py-1 rounded-lg flex flex-col justify-center">
                {/* Slot selector */}
                <div className="flex flex-col justify-center pb-5">
                    <label htmlFor="slot-slider" className="self-center">Filter by slot: Showing
                        <span className="font-bold"> {utils.translateSlot(filters.selectedSlotMin)} </span>to
                        <span className="font-bold"> {utils.translateSlot(filters.selectedSlotMax)}</span>
                        <InfoToolTip text="Different from "/>
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
                        onChange={handleSlotChange} />
                </div>
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
                            <p>Min max rank: 0, {eligibleList.length - 1}, min max selected value: {filters.selectedRankMin}, {filters.selectedRankMax}</p>
                            {eligibleList.length > 0 && (
                                <Slider
                                range
                                className='t-slider'
                                min={0}
                                max={eligibleList.length - 1}
                                step={1}
                                allowCross={false} // dont allow handles to cross each other
                                pushable={1} // allow handles to push each other
                                value={[filters.selectedRankMin, filters.selectedRankMax]}
                                onChange={([newMin, newMax]) => {
                                    if (newMin !== filters.selectedRankMin) onLeftHandleChange(newMin)
                                    else onRightHandleChange(newMax)
                                }}
                            />)}
                        </div>
                        {/* Show only pools whose delegation changed */}
                        <div className="flex flex-row justify-center">
                            <label className="inline-flex items-center cursor-pointer" htmlFor="delegationOnly">
                                <input type="checkbox" value="" className="sr-only peer"
                                    checked={filters.delegationChangedToggle} onChange={handleDelegationOnlyChange} id="delegationOnly" />
                                <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 dark:peer-focus:ring-teal-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-teal-600 dark:peer-checked:bg-teal-600"></div>
                                <span className="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">Show only pools whose delegation changed</span>
                            </label>
                        </div>
                        {/* Retired pools toggle */}
                        <div className="flex flex-row justify-center">
                            <label className="inline-flex items-center cursor-pointer" htmlFor="retiredOnly">
                                <input type="checkbox" value="" className="sr-only peer"
                                    checked={filters.retiredPoolsToggle} onChange={handleRetiredChange} id="retiredOnly" />
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