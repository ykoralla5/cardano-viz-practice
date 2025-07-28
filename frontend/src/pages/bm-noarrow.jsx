// import Header from '../components/Header'
// import Main from '../components/Main'
// import CircularPacking from '../components/CirclePacking'

// /* Direct container of the bubble map */
// export default function BubbleMapArrow() 
// {
//     return (
//         <div>
//             <Header />
//             <Main>
//             <CircularPacking 
//                 poolData={poolData}
//                 selectedEpoch={selectedEpoch}
//                 //width={dimensions.width}
//                 // height={dimensions.height}
//                 width = {window.innerWidth}
//                 height={window.innerHeight}
//                 />
//                 </Main>
//         </div>
//     )
// }

// import Header from '../components/Header'
// import Main from "../components/Main"

// /* Direct container of the bubble map */
// export default function BubbleMapArrow() 
// {
//     return (
//         <div>
//             <Header />
//             <Main/>
//         </div>
//     )
// }

import * as d3 from 'd3'
import { Children, useEffect, useMemo, useRef, useState, useCallback } from "react"
import { clsx } from 'clsx'
import BubbleMap from '../components/BubbleMap'
import { fetchPools } from "../api/fetchPools"
import { getStructuredData, transformToD3Hierarchy, findEpochByKeyInMap } from '../utils/dataTransformers'

/* Fetching data from API and keeping addresses holding top 50% of stakes*/
export default function BubbleMapNoArrow() {
    // State values
    const [rawData, setRawData] = useState(null)
    const [selectedEpoch, setSelectedEpoch] = useState(560)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)
    const [stakeThreshold, setStakeThreshold] = useState(0.5)
    //const [stakeChanges, setStakeChanges] = useState({})

    // Static values
    
    // Derived values
    // Reconstruct and filter api call data - Keep stake holders holding top x% of pool stake
    const structuredData = useMemo(() => {
        if (!rawData) return [] // In case poolData is not fetched and stored yet
        const data = getStructuredData(rawData, stakeThreshold)
        return data
    }, [rawData, stakeThreshold, selectedEpoch])

    // console.log(structuredData)
    
    // Get index in array where data on selected epoch is present
    const epochIndex = findEpochByKeyInMap(structuredData, selectedEpoch)
    
    const d3DataForSelectedEpoch = useMemo(() => {
        if (!rawData) return [] // In case poolData is not fetched and stored yet
        if (!structuredData) console.error("No structured data")
        return transformToD3Hierarchy(structuredData[epochIndex])
    }, [rawData, stakeThreshold, selectedEpoch])


    async function fetchData() {
        try {
            setIsLoading(true)
            // Make API call
            const response = await fetchPools(selectedEpoch)
            //console.log(response)
            setRawData(response)
            }
        catch (err) {
            setError(err)
            }
        finally {
            setIsLoading(false)
        }
    }

    // Fetch data based on the changes in input
    useEffect(() => {
        fetchData()
    }, [selectedEpoch, stakeThreshold])

    // Form handler
    const handleSubmit = e => {
        e.preventDefault()
        fetchData()
    }

    if (isLoading) {
        return <div className="text-gray-500 dark:text-white">Loading pools...</div>
    }

    if (error) {
        return <div className="text-gray-500 dark:text-white">Error: {error.message}</div>
    }

    return(
        <main className="flex-grow w-full bg-white border-gray-200 dark:bg-gray-900 flex items-center justify-center text-gray-800 text-xl overflow-hidden">
            <section id="d3-chart-container" className="w-full flex flex-col items-center">
                <BubbleMap poolData={d3DataForSelectedEpoch} selectedEpoch={selectedEpoch} stakeThreshold={stakeThreshold} />
                <div className="w-5xs flex flex-col justify-center">
                    <form onSubmit={handleSubmit}>
                        <div className="flex flex-col justify-center">
                            <label htmlFor="epoch-slider" className="self-center dark:text-white">Epoch number:</label>
                            <h4 className="self-center dark:text-white">{selectedEpoch}</h4>
                            <input
                            id="epoch-slider"
                            type="range"
                            min="559" max="560" step="1"
                            value={selectedEpoch}
                            onChange={(e) => {
                                setSelectedEpoch(parseInt(e.target.value))
                                }}/>
                        </div>
                        <div className="flex flex-col justify-center">
                            <label htmlFor="stake-threshold-slider" className="self-center dark:text-white">Stake threshold:</label>
                            <h4 className="self-center dark:text-white">{stakeThreshold*100}</h4>
                            <input
                            id="stake-threshold-slider"
                            type="range"
                            min="25" max="100" step="25"
                            value={stakeThreshold*100} // show value of input as percentage instead of decimals
                            onChange={(e) => {
                                // Set stake threshold in decimals instead of percentage
                                setStakeThreshold(parseInt(e.target.value)/100)
                                }}/>
                        </div>
                        
                    </form>
                </div>
            </section>
        </main>
    )
}