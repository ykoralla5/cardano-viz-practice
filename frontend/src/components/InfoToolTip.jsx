import { useState } from 'react'

export default function AddrToolTip({ text }) {
    const [hover, setHover] = useState(false)

    const infoIcon = (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" className="size-4 stroke-gray-700 dark:stroke-gray-300">
            <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
        </svg>
    )

    return (
        <div
            className="relative flex items-center gap-2 font-mono cursor-default ml-1"
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
        >
            {/* Info icon */}
      <button
        className="text-gray-500 hover:text-blue-600 transition-colors cursor-pointer"
      >
        {infoIcon}
      </button>

            {/* tooltip */}
            {hover && (
                <div className="w-[18vw] absolute left-1/2 -translate-x-1/2 bottom-6 bg-gray-500 text-white text-xs px-2 py-1 rounded shadow-lg z-10">
                    {text}
                </div>
            )}
        </div>
    )
}