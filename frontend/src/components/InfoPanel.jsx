import { useState } from 'react'
import * as utils from '../utils/dataTransformers'
import DelegationList from './DelegationList'
import InfoToolTip from './InfoToolTip'
import * as d3 from 'd3'

export default function InfoPanel({ selectedElement, setSelectedElement, selectedElementData, setSelectedElementData, saturationScale }) {

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

    let inputStake, outputStake;

    if (type === "pool") {
        inputStake = d3.sum(delegationData.filter(l => l.target.pool_id === data.pool_id).map(d => d.movement_amount))
        outputStake = d3.sum(delegationData.filter(l => l.source.pool_id === data.pool_id).map(d => d.movement_amount))
    }

    let source, target, totalAtoB, totalBtoA;

    if (type === "link" && Array.isArray(data)) {
        source = data[0]
        target = data[1]
        totalAtoB = d3.sum(delegationData.filter(l => l.source.pool_id === source.pool_id), d => d.movement_amount)
        totalBtoA = d3.sum(delegationData.filter(l => l.source.pool_id === target.pool_id), d => d.movement_amount)
    }

        return (
            <>
                {selectedElement && selectedElementData && (
                    <div className="w-[25vw] absolute left-5 top-15 bg-white p-5 opacity-95 shadow-lg outline outline-black/5 dark:bg-slate-800 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10 text-base rounded-md wrap-anywhere text-gray-400 dark:text-gray-400">
                        <div className="flex-shrink-0 flex justify-between items-center">
                            <div className="pb-2">
                                <p className="text-lg font-bold text-gray-900 dark:text-white">{type === "pool" ? `Selected Pool` : "Selected delegation"}</p>
                                {type === "pool" && <p className="text-tiny">Information shown here is for this epoch</p>}
                            </div>
                            <button className="px-2 py-1 rounded-lg text-gray-900 dark:text-gray-200 bg-gray-200 dark:bg-gray-800 hover:bg-teal-300 hover:text-black" onClick={handleInfoCloseClick}>Close</button>
                        </div>
                        <div className="overflow-y-auto max-h-[45vh] py-3">
                            {type === "pool" && (
                                <>
                                    <p>Name <span className="text-gray-900 dark:text-white">{data.name !== 0 ? data.name : "NULL"} [{data.ticker !== 0 ? data.ticker : "NULL"}]</span></p>
                                    <p>Homepage <a className="font-medium text-blue-600 dark:text-blue-500 hover:underline" href={data.homepage !== 0 ? data.homepage : "#"} target="_blank">{data.homepage !== 0 ? data.homepage : "NULL"}</a></p>
                                    <p>Description <span className="text-gray-900 dark:text-white">{data.description !== 0 ? data.description : "NULL"}</span></p>
                                    <p>ID <span className="text-gray-900 dark:text-white">({data.pool_id}) <span className="font-mono">{data.pool_view}</span></span></p>
                                    <p className="flex gap-1">Active Stake <span className="text-gray-900 dark:text-white flex gap-1">₳ {utils.formatAda(data.total_stake)} {!data.is_active && data.delegator_count === 0 && <InfoToolTip text="Stake from previous epoch"/>} (#{data.rank})</span></p>
                                    <p># Delegators <span className="text-gray-900 dark:text-white">{data.delegator_count}</span></p>
                                    <p>Total input delegation <span className="text-gray-900 dark:text-white">₳ {utils.formatAda(inputStake)}</span></p>
                                    <p>Total output delegation <span className="text-gray-900 dark:text-white">₳ {utils.formatAda(outputStake)}</span></p>
                                    <p>Operator pledge <span className="text-gray-900 dark:text-white">₳ {utils.formatAda(data.pledge)}</span></p>
                                    <p className="flex gap-1">Saturation ratio <span className={`font-bold ${data.saturation_ratio < 1 ? "text-green-500 dark:text-green-500 font-bold" : data.saturation_ratio > 1.5 ? "text-red-500 dark:text-red-500 font-bold" : "text-orange-500 dark:text-orange-500 font-bold"}`}>
                                    {Math.round(data.saturation_ratio * 100) / 100}</span><InfoToolTip text="Pools with saturation ratio above 1 are a sign of centralisation and are coloured either green (<1), orange (>1<1.5) or red(>1.5)"/></p>
                                    <p>Actual / Expected # of blocks minted <span className="text-gray-900 dark:text-white">{data.actual_blocks} / {Math.round(data.expected_blocks * 100) / 100}</span></p>
                                    <p className="flex gap-1">Performance <span className={data.performance_ratio < 1 ? "text-red-500" : "text-green-500"}>{Math.round(data.performance_ratio * 100) / 100}</span><InfoToolTip text="Ratio of actual and expected blocks minted in this epoch"/></p>
                                    <p className="flex gap-1">Pool active?  {data?.is_active ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6 stroke-green-500"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6 stroke-red-500"><path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                                    )}</p>
                                    <button className="px-2 py-1 rounded-lg text-gray-900 dark:text-gray-200 bg-gray-200 dark:bg-gray-700 hover:bg-teal-300 hover:text-black" onClick={handleDelegationCloseClick}>See delegations</button>
                                </>
                            )}
                            {type === "link" && (
                                <>
                                    {/* <p className="text-lg font-bold text-gray-900 dark:text-white">Selected delegation</p> */}
                                    <p className="flex flex-col mb-5">Between Pool <span className="text-gray-900 dark:text-white">{source.name !== 0 ? source.name : "NULL"} [{source.ticker !== 0 ? source.ticker : "NULL"}]</span> and <span className="text-gray-900 dark:text-white">{target.name} [{target.ticker}]</span></p>
                                    {/* <p>To Pool <span className="text-gray-900 dark:text-white">({target?.name}) {data.target?.pool_view}</span></p> */}
                                    {/* <p>Delegated Amount <span className="text-gray-900 dark:text-white">₳ {utils.formatAda(data.totalMovement)}</span></p> */}
                                    <p># of delegations <span className="text-gray-900 dark:text-white">{delegationData.length}</span></p>
                                    <p className="text-gray-900 dark:text-white">{source.ticker} → {target.ticker}: ₳ {utils.formatAda(totalAtoB)}</p>
                                    <p className="text-gray-900 dark:text-white">{target.ticker} → {source.ticker}: ₳ {utils.formatAda(totalBtoA)}</p>
                                    <button className="px-2 py-1 rounded-lg text-gray-900 dark:text-gray-200 bg-gray-200 dark:bg-gray-700 hover:bg-teal-300 hover:text-black" onClick={handleDelegationCloseClick}>See delegations</button>
                                </>
                            )}
                        </div>
                        {isDelegationModalOpen && (
                            <DelegationList
                                isOpen={isDelegationModalOpen}
                                onClose={handleDelegationCloseClick}
                                delegationData={delegationData}
                                poolData={data}
                                type={type} />
                        )}
                    </div>
                )}
            </>
        )
    }