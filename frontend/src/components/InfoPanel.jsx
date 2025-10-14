import { useMemo, useState } from 'react'
import * as utils from '../utils/dataTransformers'

export default function InfoPanel({ selectedElement, setSelectedElement, selectedElementData, setSelectedElementData }) {
    const [isModalOpen, setIsModalOpen] = useState(false)

    const handleInfoCloseClick = () => {
        setSelectedElement(null)
        setSelectedElementData(null)
    }

    const handleDelegationCloseClick = () => {
        setIsModalOpen(!isModalOpen)
    }

    if (!selectedElement) {
        return <div className="">No element selected.</div>
    }

    if (!selectedElementData || !selectedElementData.data) {
        return (
            <div className="">Loading element data...</div>
        )
    }

    const data = selectedElementData.data
    const delegationData = selectedElementData.delegationData
    const type = selectedElement.type

    return (
        <>
            {selectedElement && selectedElementData && (
                <div className="w-[30vw] absolute left-5 top-15 bg-white p-5 opacity-95 shadow-lg outline outline-black/5 dark:bg-slate-800 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10 text-sm rounded-md wrap-anywhere text-gray-400 dark:text-gray-400">
                    <div className="flex justify-end">
                        <button className="absolute px-2 py-1 rounded-lg text-gray-900 dark:text-gray-200 bg-gray-200 dark:bg-gray-800 hover:bg-teal-300 hover:text-black" onClick={handleInfoCloseClick}>Close</button>
                    </div>
                    {type === "pool" && (
                        <>
                            <p className="text-lg font-bold text-gray-900 dark:text-white">Selected Pool</p>
                            <p className="text-tiny">Information shown here is for this epoch</p>
                            <p>Name <span className="text-gray-900 dark:text-white">{data.name} [{data.ticker}]</span></p>
                            <p>Homepage <a className="font-medium text-blue-600 dark:text-blue-500 hover:underline" href={data.homepage} target="_blank">{data.homepage}</a></p>
                            <p>Description <span className="text-gray-900 dark:text-white">{data.description}</span></p>
                            <p>ID <span className="text-gray-900 dark:text-white">({data.pool_id}) <span className="font-mono">{data.pool_view}</span></span></p>
                            <p>Stake <span className="text-gray-900 dark:text-white">₳ {!data.is_active && data.delegator_count === 0 ? utils.formatAda(data.total_stake) + ' !Stake from previous epoch!' : utils.formatAda(data.total_stake)} (#{data.rank})</span></p>
                            <p># Delegators <span className="text-gray-900 dark:text-white">{data.delegator_count}</span></p>
                            <p>Operator pledge <span className="text-gray-900 dark:text-white">₳ {utils.formatAda(data.pledge)}</span></p>
                            <p>Saturation ratio <span className="text-gray-900 dark:text-white">{Math.round(data.saturation_ratio * 100) / 100}</span></p>
                            <p>Actual / Expected # of blocks minted <span className="text-gray-900 dark:text-white">{data.actual_blocks} / {Math.round(data.expected_blocks * 100) / 100}</span></p>
                            <p>Performance <span className={data.performance_ratio < 1 ? "text-red-500 font-bold" : "text-green-500 font-bold"}>{Math.round(data.performance_ratio * 100) / 100}</span></p>
                            <p>Pool active? <span className="text-gray-900 dark:text-white">{data.is_active.toString()}</span></p>
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
                    {isModalOpen && type === "pool" && (
                        <div className="fixed inset-0 flex items-center justify-center z-20" onClick={handleDelegationCloseClick}>
                            <div className="bg-gray-100 dark:bg-gray-700 p-6 rounded-lg flex flex-col space-y-4 justify-center z-20 text-gray-600 dark:text-white max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                                <div className="flex justify-end">
                                    <button type="button" className="absolute px-2 py-1 rounded-lg text-gray-900 dark:text-gray-200 bg-gray-200 dark:bg-gray-800 hover:bg-teal-300 hover:text-black" onClick={handleDelegationCloseClick}>Close</button>
                                </div>
                                <p className="text-lg font-bold text-gray-900 dark:text-white">Delegations for pool {data.name} [{data.ticker}]</p>
                                {delegationData.length === 0 ? (
                                    <p>No delegations found for this pool in the current dataset.</p>
                                ) : (
                                    <table className="min-w-full border border-gray-300 dark:border-gray-600">
                                        <thead>
                                            <tr>
                                                <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-left">Date</th>
                                                <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-left">From Pool</th>
                                                <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-left">To Pool</th>
                                                <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-left">Amount (₳)</th>
                                                <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-left">Type</th>
                                                <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-left">Source Stake Change (%)</th>
                                                <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-left">Dest Stake Change (%)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {delegationData.sort(d => d.slot_no).map((d, index) => (
                                                <tr key={index} className={index % 2 === 0 ? "bg-gray-50 dark:bg-gray-800" : "bg-white dark:bg-gray-700"}>
                                                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-1">{utils.translateSlot(d.slot_no)}</td>
                                                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-1"><span className={d.source.pool_id === data.pool_id ? "font-bold text-teal-200": ""}>{d.source.pool_view} ({d.source.pool_id})</span></td>
                                                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-1"><span className={d.target.pool_id === data.pool_id ? "font-bold text-teal-200": ""}>{d.target.pool_view} ({d.target.pool_id})</span></td>
                                                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-1">₳ {utils.formatAda(d.movement_amount)}</td>
                                                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-1">{d.movement_type}</td>
                                                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-red-500 font-bold">- {d.source_stake_change_percent} %</td>
                                                    <td className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-green-500 font-bold">{d.dest_stake_change_percent} %</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </>
    )
}