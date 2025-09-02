import { Children, useCallback, useEffect, useRef, useState, useMemo } from "react"
import CircularPacking from "./CirclePacking"
import CircularPackingPoolPerf from "./CirclePackingPoolPerf"

/* Direct container of the bubble map */
export default function BubbleMap({ nodes, nodeLinks, selectedBubble, setSelectedBubble }) 
{
    const containerRef = useRef(null)
    const [dimensions, setDimensions] = useState({width: innerWidth, height: innerHeight})

    useEffect(() => {
        if (!containerRef.current) return

        const resizeOberver = new ResizeObserver((entries) => {
            const entry = entries[0]
            const { width, height } = entry.contentRect
            setDimensions({ width, height })
        })

        resizeOberver.observe(containerRef.current)
        return () => resizeOberver.disconnect()
    }, [])
    return (
        <div ref={containerRef} className='w-full'>
            <CircularPacking 
                nodes={nodes}
                nodeLinks={nodeLinks}
                dimensions={{'width': dimensions.width, 'height': dimensions.height}}
                selectedBubble={selectedBubble}
                setSelectedBubble={setSelectedBubble}
                />
        </div>
    )
}
