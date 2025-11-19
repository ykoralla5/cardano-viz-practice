import * as utils from '../utils/dataTransformers'
import AddrToolTip from './AddrToolTip'
import InfoToolTip from './InfoToolTip'
import { useMemo, useState } from 'react'

export default function DelegationList({ isOpen, onClose, delegationData, poolData, type }) {

    if (!delegationData) {
        return (
            <div className=""></div>
        )
    }

    // Handle delegation filtering
    const delegationTypes = ["NEW_STAKE", "NEW_STAKE_PENDING", "NON_FINALIZED_REDELEGATION", "NON_FINALIZED_REDELEGATION_PENDING", "FINALIZED_REDELEGATION", "UNDELEGATED"]
    const delegationTexts = {
        "NEW_STAKE": "Delegation by a new stake address",
        "NEW_STAKE_PENDING": "Delegation by a new stake address",
        "NON_FINALIZED_REDELEGATION": "Intermediate redelegation which does not count towards pool stats and rewards",
        "NON_FINALIZED_REDELEGATION_PENDING": "Intermediate redelegation by a new pool which does not count towards pool stats and rewards",
        "FINALIZED_REDELEGATION": "Finalized redelegation which counts towards pool stats and rewards",
        "UNDELEGATED": "Undelegation which removes stake from the pool"}

    const [selectedDelTypes, setSelectedDelTypes] = useState(delegationTypes)
    const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" })

    const handleFilterChange = (type) => (event) => {
        const isChecked = event.target.checked

        setSelectedDelTypes(prevTypes => {
            if (isChecked) {
                // If checked, add the category
                return [...prevTypes, type]
            } else {
                // If unchecked, remove the category
                return prevTypes.filter(t => t !== type)
            }
        })
    }

    const filteredData = useMemo(() => {
        if (selectedDelTypes.length === 0) {
            return []
        }
        if (selectedDelTypes.length === delegationTypes.length) {
            return delegationData.filter(l => l.movement_type !== "NO_CHANGE")
        }

        // Keep items whose movementType is in the selectedDelTypes array
        return delegationData.filter(l => selectedDelTypes.includes(l.movement_type) && l.movement_type !== "NO_CHANGE"
        )
    }, [selectedDelTypes])

    const sortedData = useMemo(() => {
        if (!sortConfig.key) return filteredData

        const sorted = [...filteredData].sort((a, b) => {
            const valA = a[sortConfig.key]
            const valB = b[sortConfig.key]

            // if the field is an object with a 'value', sort by that
            const sortA = typeof valA === "object" && "value" in valA ? valA.value : valA
            const sortB = typeof valB === "object" && "value" in valB ? valB.value : valB

            // if (typeof sortA === "string" && typeof sortB === "string") {
            //     return sortA.localeCompare(sortB)
            // }
            return sortA - sortB
        })

        return sortConfig.direction === "asc" ? sorted : sorted.reverse()
    }, [filteredData, sortConfig])

    const requestSort = (key) => {
        setSortConfig((prev) => {
            if (prev.key === key) {
                // Toggle direction
                return { key, direction: prev.direction === "asc" ? "desc" : "asc" }
            }
            return { key, direction: "asc" }
        })
    }

    const SortIcon = ({ columnKey }) => {
        if (sortConfig.key !== columnKey) return (
            <svg className="w-3 h-4 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 1">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 5.326 5.7a.909.909 0 0 0 1.348 0L13 1" />
            </svg>)
        return sortConfig.direction === "asc" ? (
            <svg className="w-3 h-4 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 1">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7 7.674 1.3a.91.91 0 0 0-1.348 0L1 7" />
            </svg>
        ) : (
            <svg className="w-3 h-4 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 1">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 5.326 5.7a.909.909 0 0 0 1.348 0L13 1" />
            </svg>
        )
    }

    return (
        <div className="fixed inset-0 flex items-center justify-center z-20" onClick={onClose}>
            <div className="bg-gray-100 dark:bg-gray-700 p-6 rounded-lg flex flex-col space-y-4 justify-center z-1000 text-gray-600 dark:text-white w-[60vw] max-h-[60vh]" onClick={e => e.stopPropagation()}>
                <div className="p-1 flex-shrink-0 flex justify-between items-center">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {type === "pool" ? 
                            `Delegations for pool ${poolData.name} [${poolData.ticker}]` : 
                            `Delegations between pools ${poolData.map(p => `${p.name} [${p.ticker}]`).join(" and ")}`}
                        {/* Delegations for pool {poolData.name} [{poolData.ticker}]</p> */}</p>
                    <button type="button" className="px-2 py-1 rounded-lg text-gray-900 dark:text-gray-200 bg-gray-200 dark:bg-gray-800 hover:bg-teal-300 hover:text-black" onClick={onClose}>Close</button>
                </div>
                {/* Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {delegationTypes.map((type) => (
                        <label
                            key={type}
                            className="flex flex-col sm:flex-row items-start sm:items-center cursor-pointer w-full">
                            <input
                                type="checkbox"
                                value={type}
                                className="sr-only peer"
                                checked={selectedDelTypes.includes(type)}
                                onChange={handleFilterChange(type)} />
                            <div className="relative w-11 h-6 mt-1 sm:mt-0 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 dark:peer-focus:ring-teal-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-teal-600 dark:peer-checked:bg-teal-600"></div>
                            <span className="mt-2 sm:mt-0 sm:ms-3 text-sm font-medium text-gray-900 dark:text-gray-300 break-all">
                                Show {type}
                            </span><InfoToolTip text={delegationTexts[type]} />
                        </label>
                    ))}
                </div>
                {/* Table */}
                <div className="flex-grow overflow-x-hidden overflow-y-auto">
                    {filteredData.length === 0 ? (
                        <p>No delegations found for this pool with the applied filters.</p>
                    ) : (
                        <table className="min-w-full border border-gray-300 dark:border-gray-600">
                            <thead>
                                <tr>
                                    <th onClick={() => requestSort("slot_no")} className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-left w-25"><span className="flex gap-2">Date <SortIcon columnKey="slot_no" /></span></th>
                                    <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-left w-45">From Pool</th>
                                    <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-left w-45">To Pool</th>
                                    <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-left w-45">Delegation by</th>
                                    <th onClick={() => requestSort("movement_amount")} className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-left whitespace-nowrap"><span className="flex gap-2">Amount (₳) <SortIcon columnKey="movement_amount" /></span></th>
                                    <th onClick={() => requestSort("movement_type")} className="border border-gray-300 dark:border-gray-600 px-2 py-1 text-left"><span className="flex gap-2">Type <SortIcon columnKey="movement_type" /></span></th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedData.sort(d => d.slot_no).map((d, index) => (
                                    <tr key={index} className={index % 2 === 0 ? "bg-gray-50 dark:bg-gray-800" : "bg-white dark:bg-gray-700"}>
                                        <td className="border border-gray-300 dark:border-gray-600 px-2 py-1">{utils.translateSlot(d.slot_no)}</td>
                                        <td className="border border-gray-300 dark:border-gray-600 px-2 py-2">
                                            <p className="font-semibold">{d.source.name} [{d.source.ticker}]</p>
                                            <AddrToolTip id={d.source.pool_view} />
                                            {['NON_FINALIZED_REDELEGATION', 'FINALIZED_REDELEGATION', 'UNDELEGATED'].includes(d.movement_type) && <div className="flex items-center">
                                                    <p className="text-sm dark:text-gray-300">Stake change:
                                                        <span className="px-2 py-1 text-red-500 font-bold">- {d.source_stake_change_percent} %</span></p>
                                                    <InfoToolTip text="Percent change in pool stake due to this delegation"/></div>
                                            }
                                        </td>
                                        <td className="border border-gray-300 dark:border-gray-600 px-2 py-1">
                                            <p className="font-semibold">{d.target.name} [{d.target.ticker}]</p>
                                            <AddrToolTip id={d.target.pool_view} />
                                            {['NON_FINALIZED_REDELEGATION', 'NON_FINALIZED_REDELEGATION_PENDING', 'FINALIZED_REDELEGATION', 'NEW_STAKE', 'NEW_STAKE_PENDING'].includes(d.movement_type) && 
                                                <div className="flex items-center">
                                                    <p className="text-sm dark:text-gray-300">Stake change:
                                                        <span className="px-2 py-1 text-green-500 font-bold">+ {d.dest_stake_change_percent} %</span></p>
                                                    <InfoToolTip text="Percent change in pool stake due to this delegation"/></div>
                                                    }
                                        </td>
                                        <td className="border border-gray-300 dark:border-gray-600 px-2 py-1">
                                            <AddrToolTip id={d.addr_view} />
                                        </td>
                                        <td className="border border-gray-300 dark:border-gray-600 px-2 py-1" value={parseInt(d.movement_amount)}>₳ {utils.formatAda(d.movement_amount)}</td>
                                        <td className="border border-gray-300 dark:border-gray-600 px-2 py-1">{d.movement_type}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    )
}