import { Children, useCallback, useEffect, useRef, useState, useMemo } from "react"
import CircularPacking from "./CirclePacking"

/* Direct container of the bubble map */
export default function BubbleMap({ poolData, selectedEpoch }) 
{
    const containerRef = useRef(null)
    const [dimensions, setDimensions] = useState({width: 0, height: 0})

    const getContainerDimensions = useCallback(() => {
        if(containerRef.current) {
            setDimensions({
                width: containerRef.current.clientWidth,
                height: containerRef.current.clientHeight
            })
        }
    }, [])

    useEffect(() => {
        getContainerDimensions() // Set initial dimensions

        const handleResize = () => {

            // Add timeout for performance
            let timeoutId;
            return () => {
                clearTimeout(timeoutId)
                timeoutId = setTimeout(getContainerDimensions, 200)
            }
        }

        const debouncedResize = handleResize()
        window.addEventListener('resize', debouncedResize)
        
        return () => {
            window.removeEventListener('resize', debouncedResize)
        }
    }, [getContainerDimensions]) // run everytime container dimensions change
    return (
        <div ref={containerRef} className="w-full h-full flex-column items-center justify-center">
            <CircularPacking 
                poolData={poolData}
                selectedEpoch={selectedEpoch}
                //width={dimensions.width}
                // height={dimensions.height}
                width = {window.innerWidth}
                height={window.innerHeight}
                />
        </div>
    )
}