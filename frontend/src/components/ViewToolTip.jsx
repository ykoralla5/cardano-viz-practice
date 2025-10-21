import { useState } from 'react'
import { Tooltip } from 'flowbite-react'
// import { styled } from '@mui/material/styles'

export default function ViewToolTip({ id }) {
  const [copied, setCopied] = useState(false)

  // Truncate: showing first 6 and last 3 chars with ellipsis
  const truncate = (id) => `${id.slice(0, 6)}...${id.slice(-3)}`

  const copyIcon = (
    <svg className="w-6 h-6 text-gray-800 dark:stroke-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
      <path stroke="stroke-white" strokeLinejoin="round" strokeWidth="2" d="M9 8v3a1 1 0 0 1-1 1H5m11 4h2a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1h-7a1 1 0 0 0-1 1v1m4 3v10a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-7.13a1 1 0 0 1 .24-.65L7.7 8.35A1 1 0 0 1 8.46 8H13a1 1 0 0 1 1 1Z" />
    </svg>

  )

  const handleCopy = () => {
    navigator.clipboard.writeText(id).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000) // reset copy message
    })
    console.log(copied)
  }

  return (
    <Tooltip trigger="hover"
      content={
        <>
        {/* <span>blah</span> */}
           {//copied ? 
           //( 
            // <span className="flex items-center space-x-1"><span>Copied!</span>{/* {copyIcon} */}</span>
          // ) : (
            // <span className="flex items-center space-x-1"><span>{id}</span>{/* {copyIcon} */}</span>
          //)
          }
        </>
      }
      placement="top"
      style="dark"
    >
      <span
        className="cursor-pointer select-none truncate max-w-[150px] block"
        onClick={handleCopy}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleCopy()
        }}
        role="button"
        aria-label="Copy pool ID"
      >
        {truncate(id)}
      </span>
    </Tooltip>
  )
}