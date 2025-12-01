import { useRef, useEffect, useState, useMemo } from 'react'
import * as utils from '../utils/dataTransformers'

export default function TopX({ isOpen, onClose, selectedElement, setSelectedElement, nodes }) {

    if (!nodes || nodes.length === 0) return

    const topX = 10
    const rowRef = useRef(null)
    const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" })

    const sortedData = useMemo(() => {
            if (!sortConfig.key) return nodes
    
            const sorted = [...nodes].sort((a, b) => {
                const valA = a[sortConfig.key]
                const valB = b[sortConfig.key]
    
                // if the field is an object with a 'value', sort by that
                const sortA = valA && typeof valA === "object" && "value" in valA ? valA.value : valA ?? 0
                const sortB = valB && typeof valB === "object" && "value" in valB ? valB.value : valB ?? 0
    
                if (typeof sortA === "string" && typeof sortB === "string") {
                    return sortA.localeCompare(sortB)
                }
                return sortA - sortB
            })
    
            return sortConfig.direction === "asc" ? sorted : sorted.reverse()
        }, [nodes, sortConfig])
    
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
    
        useEffect(() => {

        if (!selectedElement) return

        // Scroll into view when the modal opens
        if (rowRef.current) {
            console.log(rowRef.current)
          rowRef.current.scrollIntoView({
            behavior: "auto",
            block: "center",
          })
        }
      }, [isOpen, selectedElement])

    return (
        <>
            {isOpen && (
                <div className="w-[40vw] absolute right-5 top-15 bg-white p-5 opacity-95 shadow-lg outline outline-black/5 dark:bg-slate-800 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10 text-base rounded-md wrap-anywhere text-gray-400 dark:text-gray-400">
                    <div className="px-2 flex-shrink-0 flex justify-between items-center pb-3">
                        <p className="text-lg font-bold text-gray-900 dark:text-white">Pool list</p>
                        <button className="px-2 py-1 rounded-lg text-gray-900 dark:text-gray-200 bg-gray-200 dark:bg-gray-800 hover:bg-teal-300 hover:text-black" onClick={onClose}>Close</button>
                    </div>
                    <div className="flex-grow overflow-y-auto max-h-[62.5vh]">
                    {nodes.length === 0 ? (
                        <p>No pools found.</p>
                    ) : (
                        <table className="min-w-full border border-gray-300 dark:border-gray-600">
                            <thead className="sticky top-0 z-10">
                                <tr className="text-left text-gray-700 bg-white dark:bg-slate-800 dark:text-gray-300">
                                    <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 w-18">Rank</th>
                                    <th className="border border-gray-300 dark:border-gray-600 px-2 py-1">Name [Ticker]</th>
                                    <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 w-25" onClick={() => requestSort("total_stake")}><span className="flex gap-2">Active Stake <SortIcon columnKey="total_stake"/></span></th>
                                    <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 w-25" onClick={() => requestSort("input_stake")}><span className="flex gap-2">Input Stake <SortIcon columnKey="input_stake"/></span></th>
                                    <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 w-25" onClick={() => requestSort("output_stake")}><span className="flex gap-2">Output Stake <SortIcon columnKey="output_stake"/></span></th>
                                    {/* <th className="border border-gray-300 dark:border-gray-600 px-2 py-1">Input stake</th> */}
                                    {/* <th className="border border-gray-300 dark:border-gray-600 px-2 py-1">Output stake</th> */}
                                </tr>
                            </thead>
                            <tbody>
                                {sortedData.filter(p => p.total_stake > 0).map((p, index) => (
                                    <tr onClick={() => setSelectedElement({"type": "pool", "id": p.pool_id})} 
                                        ref={selectedElement && p.pool_id === selectedElement.id ? rowRef : null}
                                        key={p.id} 
                                        className={`text-gray-700 dark:text-white cursor-pointer ${index % 2 === 0 ? "bg-gray-50 dark:bg-gray-800" : "bg-white dark:bg-gray-700"} ${selectedElement && selectedElement.id === p.pool_id ? "outline outline-2 outline-teal-400" : ""} hover:bg-teal-500 hover:text-black`}>
                                        <td className="border border-gray-300 dark:border-gray-600 px-2 py-1">#{p.rank}</td>
                                        <td className="border border-gray-300 dark:border-gray-600 px-2 py-1 font-bold">{p.name} [{p.ticker}]</td>
                                        <td className="border border-gray-300 dark:border-gray-600 px-2 py-1">₳ {utils.formatAda(p.total_stake)}</td>
                                        <td className="border border-gray-300 dark:border-gray-600 px-2 py-1" value={parseInt(p.input_stake)}>₳ {utils.formatAda(p.input_stake)}</td>
                                        <td className="border border-gray-300 dark:border-gray-600 px-2 py-1" value={parseInt(p.output_stake)}>₳ {utils.formatAda(p.output_stake)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                    </div>
                </div>
            )}
        </>
    )
}