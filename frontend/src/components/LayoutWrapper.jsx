import { Children, useCallback, useEffect, useRef, useState, useMemo } from "react"
import BubbleGraph from "./BubbleGraph"

/* Direct container of the bubble map */
export default function LayoutWrapper({ nodes, nodeLinks, selectedElement, setSelectedElement }) 
{
    const containerRef = useRef(null)
    const [dimensions, setDimensions] = useState({width: innerWidth, height: innerHeight})

    const virtualWidth = 3000
    const virtualHeight = 2000

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
            <BubbleGraph 
                nodes={nodes}
                nodeLinks={nodeLinks}
                // dimensions={{'width': dimensions.width, 'height': dimensions.height}}
                dimensions={{'width': virtualWidth, 'height': virtualHeight}}
                selectedElement={selectedElement}
                setSelectedElement={setSelectedElement}
                />
        </div>
    )
}
