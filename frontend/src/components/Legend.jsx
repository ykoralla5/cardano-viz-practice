import * as utils from '../utils/dataTransformers'

export default function Legend({ isOpen, onClose }) {

    const gradientId = "saturation-gradient"

    return (
        <>
            {isOpen && (
                <div className="w-[17.5vw] absolute right-5 top-15 bg-white p-5 opacity-95 shadow-lg outline outline-black/5 dark:bg-slate-800 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10 text-base rounded-md wrap-anywhere text-gray-400 dark:text-gray-400">
                    <div className="pr-2 flex-shrink-0 flex justify-between items-center">
                        <div className="pb-3">
                            <p className="text-lg font-bold text-gray-900 dark:text-white">Legend</p>
                        </div>
                        <button className="px-2 py-1 rounded-lg text-gray-900 dark:text-gray-200 bg-gray-200 dark:bg-gray-800 hover:bg-teal-300 hover:text-black" onClick={onClose}>Close</button>
                    </div>
                    {/* Legend content */}
                    {/* Saturation legend */}
                    <div className="flex flex-col gap-2 p-2 border rounded bg-white dark:bg-gray-800 mb-2">
                        <div className="font-semibold text-gray-800 dark:text-gray-200 mb-1">Saturation Legend</div>

                        {/* Green */}
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-[#0c824dff] rounded"></div>
                            <span className="text-sm text-gray-700 dark:text-gray-300">Saturation ratio &lt; 1</span>
                        </div>

                        {/* Orange */}
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-orange-500 rounded"></div>
                            <span className="text-sm text-gray-700 dark:text-gray-300">1 ≤ Saturation ratio ≤ 1.5</span>
                        </div>

                        {/* Red gradient */}
                        <div className="flex items-center gap-2">
                            <svg width="100" height="20">
                                <defs>
                                    <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#dd2b25" />
                                        <stop offset="100%" stopColor="#67000d" />
                                    </linearGradient>
                                </defs>
                                <rect width="100" height="20" fill={`url(#${gradientId})`} rx="4" />
                            </svg>
                            <span className="text-sm text-gray-700 dark:text-gray-300">Saturation ratio &gt; 1.5</span>
                        </div>
                    </div>
                    {/* Delegation amount legend */}
                    <div className="flex flex-col gap-2 p-2 border rounded bg-white dark:bg-gray-800">
                        <div className="font-semibold text-gray-800 dark:text-gray-200 mb-1">Delegation amount</div>
                    </div>
                </div>
            )}
        </>
    )
}