import { useRef, useEffect } from 'react'
import * as utils from '../utils/dataTransformers'

export default function TopX({ isOpen, onClose, selectedElement, setSelectedElement, nodes }) {

    if (!nodes || nodes.length === 0) return

    const topX = 10
    const rowRef = useRef(null)
    
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
                <div className="w-[30vw] absolute right-5 top-15 bg-white p-5 opacity-95 shadow-lg outline outline-black/5 dark:bg-slate-800 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10 text-base rounded-md wrap-anywhere text-gray-400 dark:text-gray-400">
                    <div className="px-2 flex-shrink-0 flex justify-between items-center">
                        <p className="text-lg font-bold text-gray-900 dark:text-white">Pool list</p>
                        <button className="px-2 py-1 rounded-lg text-gray-900 dark:text-gray-200 bg-gray-200 dark:bg-gray-800 hover:bg-teal-300 hover:text-black" onClick={onClose}>Close</button>
                    </div>
                    <div className="flex-grow overflow-y-auto p-2 max-h-[50vh]">
                    {nodes.length === 0 ? (
                        <p>No pools found.</p>
                    ) : (
                        <table className="min-w-full border border-gray-300 dark:border-gray-600">
                            <thead>
                                <tr className="text-left text-gray-700 dark:text-gray-300">
                                    <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 w-13">Rank</th>
                                    <th className="border border-gray-300 dark:border-gray-600 px-2 py-1">Name [Ticker]</th>
                                    <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 w-25">Active Stake</th>
                                </tr>
                            </thead>
                            <tbody>
                                {nodes.filter(p => p.total_stake > 0).reverse(p => p.total_stake).map((p, index) => (
                                    <tr onClick={() => setSelectedElement({"type": "pool", "id": p.pool_id})} 
                                        ref={selectedElement && p.pool_id === selectedElement.id ? rowRef : null}
                                        key={index} 
                                        className={`text-gray-700 dark:text-white cursor-pointer ${index % 2 === 0 ? "bg-gray-50 dark:bg-gray-800" : "bg-white dark:bg-gray-700"} ${selectedElement && selectedElement.id === p.pool_id ? "outline outline-2 outline-teal-400" : ""} hover:bg-teal-500 hover:text-black`}>
                                        <td className="border border-gray-300 dark:border-gray-600 px-2 py-1">#{index + 1}</td>
                                        <td className="border border-gray-300 dark:border-gray-600 px-2 py-1 font-bold">{p.name} [{p.ticker}]</td>
                                        <td className="border border-gray-300 dark:border-gray-600 px-2 py-1">₳ {utils.formatAda(p.total_stake)}</td>
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