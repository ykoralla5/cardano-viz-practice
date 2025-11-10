import * as utils from '../utils/dataTransformers'

export default function Legend({ isOpen, onClose, radiusScale }) {

    const gradientId = "saturation-gradient"
    const legendValues = [1_000_000, 10_000_000_000, 1_000_000_000_000, 50_000_000_000_000]
    let xOffset = 0
    const circles = legendValues.map((v, i) => {
        const r = radiusScale(v)
        console.log('legend radius for', v, 'is', r)
        // xOffset += 2 * r + 30
        const g = (
            <g key={v} transform={`translate(${xOffset}, 80)`}>
                <circle r={r} className="dark:stroke-white stroke-gray-800 fill-none" />
                <text x={0} y={r + 15} fontSize={12} fill="white" className="dark:text-gray-300 text-gray-700">
                    {v >= 1_000_000_000_000 ? `${(v / (1_000_000 * 1_000_000)).toLocaleString()}M ADA` : v >= 10_000_000_000 ? `${(v / (1_000 * 1_000_000)).toLocaleString()}K ADA` : `${(v / 1_000_000).toLocaleString()} ADA`}
                </text>
            </g>
        )
        xOffset += 2 * r + 50
        return g 
    })

        return (
            <>
                {isOpen && (
                    <div className="w-[25vw] absolute right-5 top-15 bg-white p-5 opacity-95 shadow-lg outline outline-black/5 dark:bg-slate-800 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10 text-base rounded-md wrap-anywhere text-gray-400 dark:text-gray-400">
                        <div className="pr-2 flex-shrink-0 flex justify-between items-center">
                            <div className="pb-3">
                                <p className="text-lg font-bold text-gray-900 dark:text-white">Legend</p>
                            </div>
                            <button className="px-2 py-1 rounded-lg text-gray-900 dark:text-gray-200 bg-gray-200 dark:bg-gray-800 hover:bg-teal-300 hover:text-black" onClick={onClose}>Close</button>
                        </div>
                        {/* Legend content */}
                        <div className="overflow-y-auto max-h-[45vh] pt-3">
                            {/* Saturation legend */}
                            <div className="flex flex-col gap-2 p-2 border rounded bg-white dark:bg-gray-800 mb-2">
                                <div className="font-semibold text-gray-800 dark:text-gray-200 mb-1">Saturation as color of node</div>
                                {/* Gray */}
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 bg-[#808080] rounded"></div>
                                    <span className="text-sm text-gray-700 dark:text-gray-300">Retired pools</span>
                                </div>
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
                            {/* Node width legend */}
                            <div className="flex flex-col gap-2 p-2 border rounded bg-white dark:bg-gray-800 mb-2">
                                <div className="font-semibold text-gray-800 dark:text-gray-200 mb-1 z-10">Stake as size of nodes</div>
                                <div className="flex flex-row justify-center">
                                    <svg height={250}>
                                        {circles
                                        // legendValues.map((v, i) => {
                                        //     const r = radiusScale(v)
                                        //     console.log('legend radius for', v, 'is', r)
                                        //     // xOffset += 2 * r + 30
                                        //     return (
                                        //         <g key={v} transform={`translate(${xOffset}, 80)`}>
                                        //             <circle r={r} className="dark:stroke-white stroke-gray-800 fill-none" />
                                        //             <text x={0} y={r + 20} fontSize={12} fill="white" className="dark:text-gray-300 text-gray-700">
                                        //                 {v >= 1_000_000_000_000 ? `${(v / (1_000_000 * 1_000_000)).toLocaleString()}M ADA` : v >= 10_000_000_000 ? `${(v / (1_000 * 1_000_000)).toLocaleString()}K ADA` : `${(v / 1_000_000).toLocaleString()} ADA`}
                                        //             </text>
                                        //         </g>
                                        //     )
                                        //     xOffset += 2 * r + 30
                                        // })
                                        }
                                    </svg>
                                </div>
                            </div>
                            {/* Thickness of links */}
                            <div className="flex flex-col gap-2 p-2 border rounded bg-white dark:bg-gray-800 mb-2">
                                <div className="font-semibold text-gray-800 dark:text-gray-200 mb-1">Delegated amount as thickness of links</div>
                                <svg height={100}>
                                    <line x1="10" y1="10" x2="200" y2="10" className="stroke-gray-100" strokeWidth="1" />
                                    <text x="210" y="15" fontSize={12} fill="white" className="dark:text-gray-300 text-gray-700">₳ 1000 delegation</text>
                                    <line x1="10" y1="40" x2="200" y2="40" className="stroke-gray-100" strokeWidth="3" />
                                    <text x="210" y="45" fontSize={12} fill="white" className="dark:text-gray-300 text-gray-700">₳ 5M delegation</text>
                                    <line x1="10" y1="70" x2="200" y2="70" className="stroke-gray-100" strokeWidth="4.5" />
                                    <text x="210" y="75" fontSize={12} fill="white" className="dark:text-gray-300 text-gray-700">₳ 20M delegation</text>
                                </svg>
                            </div>
                        </div>
                    </div>
                )}
            </>
        )
    }