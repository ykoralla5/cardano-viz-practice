import * as utils from '../utils/dataTransformers'

export default function EpochData({ isOpen, onClose, currentEpochData, nodesCount, linksCount, overSaturatedPoolCount }) {

    if (!currentEpochData) return

    return (
        <>
            {isOpen && (
                <div className="w-[25vw] absolute right-5 top-15 bg-white p-5 opacity-95 shadow-lg outline outline-black/5 dark:bg-slate-800 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10 text-base rounded-md wrap-anywhere text-gray-400 dark:text-gray-400">
                    <div className="pr-2 flex-shrink-0 flex justify-between items-center">
                        <div className="pb-3">
                            <p className="text-lg font-bold text-gray-900 dark:text-white">Epoch {currentEpochData.epoch_no}</p>
                        </div>
                        <button className="px-2 py-1 rounded-lg text-gray-900 dark:text-gray-200 bg-gray-200 dark:bg-gray-800 hover:bg-teal-300 hover:text-black" onClick={onClose}>Close</button>
                    </div>
                    <div className="overflow-y-auto max-h-[60vh]">
                        <p>Start date <span className="text-gray-900 dark:text-white">{utils.formatDate(currentEpochData.start_time)}</span></p>
                        <p>End date <span className="text-gray-900 dark:text-white">{utils.formatDate(currentEpochData.end_time)}</span></p>
                        <p>Phase <span className="text-gray-900 dark:text-white">{currentEpochData.phase} Era</span></p>
                        <p>Pool count <span className="text-gray-900 dark:text-white">{utils.formatNumber(currentEpochData.pool_count)}</span></p>
                        <p>Oversaturated pool count <span className="text-gray-900 dark:text-white">{overSaturatedPoolCount}</span></p>
                        <p>Total Active Stake <span className="text-gray-900 dark:text-white">₳ {utils.formatAda(currentEpochData.total_active_stake)}</span></p>
                        <p># Delegators <span className="text-gray-900 dark:text-white">{utils.formatNumber(currentEpochData.stake_address_count)}</span></p>
                        <p>Saturation point <span className="text-gray-900 dark:text-white">₳ {utils.formatAda(Math.round(currentEpochData.saturation_point * 100) / 100)}</span></p>
                        <p>Optimal pool count <span className="text-gray-900 dark:text-white">{currentEpochData.optimal_pool_count}</span></p>
                        <p>Decentralisation <span className="text-gray-900 dark:text-white">{currentEpochData.decentralisation}</span></p>
                        <p>Showing <span className="text-gray-900 dark:text-white">{nodesCount}</span> nodes and <span className="text-gray-900 dark:text-white">{linksCount}</span> delegations.</p>
                    </div>
                </div>
            )}
        </>
    )
}