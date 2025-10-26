import { useState } from 'react'
import * as utils from '../utils/dataTransformers'
import DelegationList from './DelegationList'

export default function InfoPanel({ selectedElement, setSelectedElement, selectedElementData, setSelectedElementData }) {

    if (!selectedElementData || !selectedElementData.data) {
        return (
            <div className=""></div>
        )
    }

    const [isDelegationModalOpen, setIsDelegationModalOpen] = useState(false)

    const handleInfoCloseClick = () => {
        setSelectedElement(null)
        setSelectedElementData(null)
    }

    const handleDelegationCloseClick = () => {
        setIsDelegationModalOpen(!isDelegationModalOpen)
    }

    const data = selectedElementData.data
    const delegationData = selectedElementData.delegationData
    const type = selectedElement.type

    return (
        <>
            {selectedElement && selectedElementData && (
                <div className="w-[25vw] absolute left-5 top-15 bg-white p-5 opacity-95 shadow-lg outline outline-black/5 dark:bg-slate-800 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10 text-base rounded-md wrap-anywhere text-gray-400 dark:text-gray-400">
                    <div className="flex-shrink-0 flex justify-between items-center">
                        <div className="pb-2">
                            <p className="text-lg font-bold text-gray-900 dark:text-white">Selected Pool</p>
                            <p className="text-tiny">Information shown here is for this epoch</p>
                        </div>
                        <button className="px-2 py-1 rounded-lg text-gray-900 dark:text-gray-200 bg-gray-200 dark:bg-gray-800 hover:bg-teal-300 hover:text-black" onClick={handleInfoCloseClick}>Close</button>
                    </div>
                    <div className="overflow-y-auto max-h-[60vh]">
                    {type === "pool" && (
                        <>
                            
                            <p>Name <span className="text-gray-900 dark:text-white">{data.name} [{data.ticker}]</span></p>
                            <p>Homepage <a className="font-medium text-blue-600 dark:text-blue-500 hover:underline" href={data.homepage} target="_blank">{data.homepage}</a></p>
                            <p>Description <span className="text-gray-900 dark:text-white">{data.description}</span></p>
                            <p>ID <span className="text-gray-900 dark:text-white">({data.pool_id}) <span className="font-mono">{data.pool_view}</span></span></p>
                            <p>Active Stake <span className="text-gray-900 dark:text-white">₳ {!data.is_active && data.delegator_count === 0 ? utils.formatAda(data.total_stake) + ' !Stake from previous epoch!' : utils.formatAda(data.total_stake)} (#{data.rank})</span></p>
                            <p># Delegators <span className="text-gray-900 dark:text-white">{data.delegator_count}</span></p>
                            <p>Operator pledge <span className="text-gray-900 dark:text-white">₳ {utils.formatAda(data.pledge)}</span></p>
                            <p>Saturation percent <span className="text-gray-900 dark:text-white">{Math.round(data.saturation_percent * 100) / 100} %</span></p>
                            <p>Saturation ratio <span className="text-gray-900 dark:text-white">{Math.round(data.saturation_ratio * 100) / 100}</span></p>
                            <p>Actual / Expected # of blocks minted <span className="text-gray-900 dark:text-white">{data.actual_blocks} / {Math.round(data.expected_blocks * 100) / 100}</span></p>
                            <p>Performance <span className={data.performance_ratio < 1 ? "text-red-500 font-bold" : "text-green-500 font-bold"}>{Math.round(data.performance_ratio * 100) / 100}</span></p>
                            <p className='flex'>Pool active?  { data?.is_active ? (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6 stroke-green-500"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6 stroke-red-500"><path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                            )}</p>
                            <button className="px-2 py-1 rounded-lg text-gray-900 dark:text-gray-200 bg-gray-200 dark:bg-gray-700 hover:bg-teal-300 hover:text-black" onClick={handleDelegationCloseClick}>See delegations</button>
                        </>
                    )}
                    {type === "link" && (
                        <>
                            <p className="text-lg font-bold text-gray-900 dark:text-white">Selected delegation</p>
                            <p>From Pool <span className="text-gray-900 dark:text-white">({data.source?.pool_id}) {data.source?.pool_view}</span> </p>
                            <p>To Pool <span className="text-gray-900 dark:text-white">({data.target?.pool_id}) {data.target?.pool_view}</span></p>
                            <p>Delegated Amount <span className="text-gray-900 dark:text-white">₳ {utils.formatAda(data.movement_amount)}</span></p>
                            <p>Delegation Type <span className="text-gray-900 dark:text-white">{data.movement_type}</span></p>
                            <p>Stake change in source pool <span className="text-red-500 font-bold">-{data.source_stake_change_percent} %</span></p>
                            <p>Stake change in destination <span className="text-green-500 font-bold">{data.dest_stake_change_percent} %</span></p>
                        </>
                    )}
                    </div>
                    {isDelegationModalOpen && type === "pool" && (
                        <DelegationList
                            isOpen={isDelegationModalOpen} 
                            onClose={handleDelegationCloseClick}
                            delegationData={delegationData}
                            poolData={data} />
                    )}
                </div>
            )}
        </>
    )
}