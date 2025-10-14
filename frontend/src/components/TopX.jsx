import { useMemo, useState } from 'react'
import * as utils from '../utils/dataTransformers'

export default function TopX({ isOpen, onClose, selectedElement, setSelectedElement, nodes }) {

    if (!nodes || nodes.length === 0) return

    const topX = 10

    return (
        <>
            {isOpen && (
                <div className="w-[30vw] absolute right-5 top-15 bg-white p-5 opacity-95 shadow-lg outline outline-black/5 dark:bg-slate-800 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10 text-sm rounded-md wrap-anywhere text-gray-400 dark:text-gray-400">
                    <div className="flex justify-end">
                        <button className="absolute px-2 py-1 rounded-lg text-gray-900 dark:text-gray-200 bg-gray-200 dark:bg-gray-800 hover:bg-teal-300 hover:text-black" onClick={onClose}>Close</button>
                    </div>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">Pool list</p>
                    {nodes.length === 0 ? (
                        <p>No pools found.</p>
                    ) : (
                        <table className="min-w-full border border-gray-300 dark:border-gray-600">
                            <thead>
                                <tr className="text-left text-gray-700 dark:text-gray-300">
                                    <th className="border border-gray-300 dark:border-gray-600 px-2 py-1">Rank</th>
                                    <th className="border border-gray-300 dark:border-gray-600 px-2 py-1">Ticker</th>
                                    <th className="border border-gray-300 dark:border-gray-600 px-2 py-1">Stake</th>
                                </tr>
                            </thead>
                            <tbody>
                                {nodes.filter(p => p.total_stake > 0).reverse(p => p.total_stake).slice(0, topX).map((p, index) => (
                                    <tr onClick={() => setSelectedElement({"type": "pool", "id": p.pool_id})} key={index} className={`text-gray-700 dark:text-white cursor-pointer ${index % 2 === 0 ? "bg-gray-50 dark:bg-gray-800" : "bg-white dark:bg-gray-700"} ${selectedElement && selectedElement.id === p.pool_id ? "outline outline-2 outline-teal-400" : ""} hover:bg-teal-500 hover:text-black`}>
                                        <td className="border border-gray-300 dark:border-gray-600 px-2 py-1">#{index + 1}</td>
                                        <td className="border border-gray-300 dark:border-gray-600 px-2 py-1 font-bold">{p.ticker}</td>
                                        <td className="border border-gray-300 dark:border-gray-600 px-2 py-1">₳ {utils.formatAda(p.total_stake)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </>
    )
}