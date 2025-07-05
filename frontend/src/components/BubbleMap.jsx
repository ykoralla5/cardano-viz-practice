import { Children, useCallback, useEffect, useRef, useState } from "react"
import CircularPacking from "./CirclePacking"

/* Direct container of the bubble map. Used to handle dimensions */
export default function BubbleMap({ poolData }) 
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
        //console.log(containerRef.current.clientWidth,containerRef.current.clientHeight)
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
        console.log(dimensions)

        return () => {
            window.removeEventListener('resize', debouncedResize)
        }
    }, [getContainerDimensions]) // run everytime container dimensions change
    return (
        <div ref={containerRef} className="w-full h-full flex items-center justify-center">
            <CircularPacking 
                poolData={poolData}
                width={dimensions.width}
                height={dimensions.height}/>
        </div>
        
    )
}