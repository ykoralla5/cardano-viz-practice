import Slider from 'rc-slider'
import 'rc-slider/assets/index.css'

export default function FilterForm({ filters, setFilters, minMaxStake, epochRange, nodesCount}) {
    const { selectedStakeMin, selectedStakeMax, epoch, retiredPoolsToggle, delegationChangedToggle } = filters

    const handleStakeChange = ([min, max]) => {
        setFilters(prev => ({ ...prev, selectedStakeMin: min, selectedStakeMax: max }))
    }

    const handleEpochChange = (e) => {
        setFilters(prev => ({ ...prev, epoch: Number(e.target.value) }))
    }

    const handleRetiredChange = (e) => {
        setFilters(prev => ({ ...prev, retiredPoolsToggle: !prev.retiredPoolsToggle }))
    }

    const handleDelegatationOnlyChange = (e) => {
        setFilters(prev => ({ ...prev, retiredPoolsToggle: !prev.retiredPoolsToggle }))
    }

    return (
        <div className="absolute bottom-10 left-10 flex flex-col justify-center bg-gray-800 bg-opacity-80 dark:bg-white dark:bg-opacity-80 p-4 rounded-lg shadow-lg space-y-4 z-10">
            <form className="text-white dark:text-gray-800">
                {/* Epoch selector */}
                <div className="flex flex-col justify-center">
                    <div className='flex flex-row justify-center space-x-2'>
                        <label htmlFor="epoch-slider" className="self-center">Epoch number:</label>
                        <p className="self-center">{filters.epoch}</p>
                    </div>
                    <input
                        id="epoch-slider"
                        type="range"
                        min={epochRange[0]} max={epochRange[1]} step="1"
                        value={filters.epoch}
                        onChange={handleEpochChange}/>
                </div>
                {/* Stake threshold selector*/}
                <div className="flex flex-col justify-center">
                    <label htmlFor="stake-threshold-slider" className="self-center">Filter by stake: Showing {nodesCount} nodes</label>
                    <Slider 
                        range
                        className='t-slider'
                        min={minMaxStake[0]} 
                        max={minMaxStake[1]} 
                        value={[filters.selectedStakeMin, filters.selectedStakeMax]} 
                        onChange={handleStakeChange}/>
                </div>
                {/* Show only pools whose delegation changed */}
                <div className="flex flex-row justify-center">
                    <input 
                        className=""
                        type="checkbox" 
                        checked={delegationChangedToggle} 
                        onChange={handleDelegatationOnlyChange}
                        id="delegationOnly" />
                    <label htmlFor="delegationOnly" className="self-center">Show only pools whose delegation changed</label>
                </div>
                {/* Retired pools toggle */}
                <div className="flex flex-row justify-center">
                    <input 
                        className=""
                        type="checkbox" 
                        checked={retiredPoolsToggle} 
                        onChange={handleRetiredChange}
                        id="retiredOnly" />
                    <label htmlFor="retiredOnly" className="self-center">Show retired pools</label>
                </div>
            </form>
        </div>
    )
}