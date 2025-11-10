import { Children, useCallback, useEffect, useRef, useState, useMemo } from "react"
import BubbleGraph from "./BubbleGraph"

/* Direct container of the bubble map */
export default function LayoutWrapper({ nodes, links, collapsedLinks, scales, selectedElement, setSelectedElement, selectedElementData, setSelectedElementData }) {
    const containerRef = useRef(null)
    const [dimensions, setDimensions] = useState({ width: innerWidth, height: innerHeight })
    const [viewMode, setViewMode] = useState('graph') // 'graph' or 'table'

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
                links={links}
                collapsedLinks={collapsedLinks}
                scales={scales}
                dimensions={{ 'width': dimensions.width, 'height': dimensions.height }}
                selectedElement={selectedElement}
                setSelectedElement={setSelectedElement}
                selectedElementData={selectedElementData}
                setSelectedElementData={setSelectedElementData}
            />
        </div>
    )
}
