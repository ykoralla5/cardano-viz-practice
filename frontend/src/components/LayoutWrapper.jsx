import { Children, useCallback, useEffect, useRef, useState, useMemo } from "react"
import BubbleGraph from "./BubbleGraph"
import InfoPanel from '../components/InfoPanel'

/* Direct container of the bubble map */
export default function LayoutWrapper({ nodes, nodeLinks, radiusScale, saturationScale, selectedElement, setSelectedElement }) 
{
    const containerRef = useRef(null)
    const [dimensions, setDimensions] = useState({width: innerWidth, height: innerHeight})
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
        <>
        {/* Toggle button: When on, show data as table. Default is graph view. */}
        {/* <div className="absolute top-[10vh] right-20 flex flex-col justify-center bg-gray-800 bg-opacity-80 dark:bg-white dark:bg-opacity-80 p-4 rounded-lg shadow-lg space-y-4 z-10">
            <form>
                <label className="inline-flex items-center cursor-pointer">
                <input
                    id="viewModeToggle"
                    type="checkbox" 
                    value="" 
                    className="sr-only peer" 
                    onChange={(e) => setViewMode(e.target.checked ? 'table' : 'graph')} 
                />
                <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 dark:peer-checked:bg-blue-600"></div>
                <span className="ms-3 text-sm font-medium text-white dark:text-gray-700">Show as table</span>
        </label>
            </form>
        </div> */}
        <div ref={containerRef} className='w-full'>
            <BubbleGraph 
                nodes={nodes}
                nodeLinks={nodeLinks}
                radiusScale={radiusScale} saturationScale={saturationScale}
                dimensions={{'width': dimensions.width, 'height': dimensions.height}}
                selectedElement={selectedElement}
                setSelectedElement={setSelectedElement}
                />
        </div>
        {/* { viewMode === 'graph' ? (
            // If there is a selected element, show info panel
            selectedElement ? <InfoPanel selectedElement={selectedElement} /> : null,
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
        ): (
            <DataTable nodes={nodes} nodeLinks={nodeLinks} />
        )} */}
            
        </>
    )
}
