import { useState } from 'react'

export default function ViewToolTip({ id, key }) {
  const [copied, setCopied] = useState(false)
  const [hover, setHover] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(id).then(() => {
      setCopied(true)
      // reset copy message
      setTimeout(() => { setCopied(false)}, 2000) 
    })
    }
    catch (err) {
      console.error("Copy failed:", err)
    }
  }

  // Showing first 9 and last 3 chars
  const truncate = (id) => `${id.slice(0, 9)}...${id.slice(-3)}`

  const copyIcon = (
    <svg className="w-6 h-6 text-gray-800 dark:stroke-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
      <path stroke="stroke-white" strokeLinejoin="round" strokeWidth="2" d="M9 8v3a1 1 0 0 1-1 1H5m11 4h2a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1h-7a1 1 0 0 0-1 1v1m4 3v10a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-7.13a1 1 0 0 1 .24-.65L7.7 8.35A1 1 0 0 1 8.46 8H13a1 1 0 0 1 1 1Z" />
    </svg>

  )

  return (
    <div
      className="relative flex items-center gap-2 font-mono cursor-default"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* truncated id */}
      <span>{truncate(id)}</span>

      {/* copy icon */}
      <button
        onClick={handleCopy}
        className="text-gray-500 hover:text-blue-600 transition-colors cursor-pointer"
      >
        {copyIcon}
      </button>

      {/* tooltip */}
      {hover && (
        <div className="absolute left-1/2 -translate-x-1/2 -top-6 bg-gray-500 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-10">
          {copied ? "Copied!" : id}
        </div>
      )}
    </div>
  )
}