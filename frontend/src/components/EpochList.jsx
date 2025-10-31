import { useMemo, useState, useRef, useEffect } from 'react'
import * as utils from '../utils/dataTransformers'

export default function EpochList({ isOpen, onClose, filters, setFilters, epochsList }) {

    if (!epochsList) return

    const rowRef = useRef(null)

    useEffect(() => {
    // Scroll into view when the modal opens
    if (rowRef.current) {
      rowRef.current.scrollIntoView({
        behavior: "auto",
        block: "center",
      })
    }
  }, [isOpen, filters.epoch])

    return (
        <>
            {isOpen && (
                <div className="w-[26vw] absolute right-5 top-15 bg-white p-5 opacity-95 shadow-lg outline outline-black/5 dark:bg-slate-800 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10 text-base rounded-md wrap-anywhere text-gray-400 dark:text-gray-400">
                    <div className="px-2 flex-shrink-0 flex justify-between items-center pb-3">
                        <p className="text-lg font-bold text-gray-900 dark:text-white">Epochs</p>
                        <button className="px-2 py-1 rounded-lg text-gray-900 dark:text-gray-200 bg-gray-200 dark:bg-gray-800 hover:bg-teal-300 hover:text-black" onClick={onClose}>Close</button>
                    </div>
                    <div className="flex-grow overflow-y-auto max-h-[50vh]">
                    {epochsList.length === 0 ? (
                        <p>No epochs found.</p>
                    ) : (
                        <table className="min-w-full border border-gray-300 dark:border-gray-600">
                            <thead className="sticky top-0 bg-gray-600 z-10">
                                <tr className="text-left text-gray-700 dark:text-gray-100">
                                    <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 w-7">Epoch</th>
                                    <th className="border border-gray-300 dark:border-gray-600 px-2 py-1 w-35">Start time to End time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {epochsList.map(([e, data], index) => (
                                    <tr onClick={() => setFilters(prev => ({ ...prev, epoch: e }))} 
                                        key={e} 
                                        ref={e === filters.epoch ? rowRef : null}
                                        className={`text-gray-700 dark:text-white cursor-pointer ${index % 2 === 0 ? "bg-gray-50 dark:bg-gray-800" : "bg-white dark:bg-gray-700"} ${filters.epoch === e ? "outline outline-2 outline-teal-400" : ""} hover:bg-teal-500 hover:text-black`}>
                                            <td className="border border-gray-300 dark:border-gray-600 px-2 py-1">{e}</td>
                                            <td className="border border-gray-300 dark:border-gray-600 px-2 py-1 font-bold text-sm">{utils.formatDate(data.start_time)} to {utils.formatDate(data.end_time)}</td>
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