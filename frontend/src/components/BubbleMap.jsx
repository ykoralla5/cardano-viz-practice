import { Children, useCallback, useEffect, useRef, useState, useMemo } from "react"
import CircularPacking from "./CirclePacking"
import CircularPackingPoolPerf from "./CirclePackingPoolPerf"

/* Direct container of the bubble map */
export default function BubbleMap({ poolData, selectedEpoch, flowLinks, poolPerf }) 
{
    const containerRef = useRef(null)
    const [dimensions, setDimensions] = useState({width: 800, height: 600})

    // const getContainerDimensions = useCallback(() => {
    //     if(containerRef.current) {
    //         setDimensions({
    //             width: containerRef.current.clientWidth,
    //             height: containerRef.current.clientHeight
    //         })
    //     }
    // }, [])

    useEffect(() => {
        if (!containerRef.current) return

        const resizeOberver = new ResizeObserver((entries) => {
            const entry = entries[0]
            const { width, height } = entry.contentRect
            setDimensions( {width, height })
        })

        resizeOberver.observe(containerRef.current)
        return () => resizeOberver.disconnect()
        // getContainerDimensions() // Set initial dimensions


        // const handleResize = () => {

        //     // Add timeout for performance
        //     let timeoutId;
        //     return () => {
        //         clearTimeout(timeoutId)
        //         timeoutId = setTimeout(getContainerDimensions, 200)
        //     }
        // }

        // const debouncedResize = handleResize()
        // window.addEventListener('resize', debouncedResize)
        
        // return () => {
        //     window.removeEventListener('resize', debouncedResize)
        // }
    //}, [getContainerDimensions]) // run everytime container dimensions change
    }, [])
    return (
        <div ref={containerRef} className="flex-column items-center justify-center">
            {!poolPerf && <CircularPacking 
                poolData={poolData}
                selectedEpoch={selectedEpoch}
                //width={dimensions.width}
                // height={dimensions.height}
                width = {dimensions.width}
                height={dimensions.height}
                flowLinks = {flowLinks}
                />}
            {poolPerf && <CircularPackingPoolPerf poolData={poolData}
                selectedEpoch={selectedEpoch}
                width = {dimensions.width}
                height={dimensions.height}/>}
        </div>
    )
}
