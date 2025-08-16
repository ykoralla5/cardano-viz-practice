import * as d3 from 'd3'
import { Children, useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { clsx } from 'clsx'
import BubbleMap from '../components/BubbleMap'
import InfoPanel from '../components/InfoPanel'
import { fetchPoolPerformanceData } from '../api/fetchPoolData'
import { getStructuredPoolPerfData } from '../utils/dataTransformers'

/* Fetching data from API and keeping addresses holding top 50% of stakes*/
export default function PoolPerformance() {
    // State values
    const [rawData, setRawData] = useState(null)
    const [selectedEpoch, setSelectedEpoch] = useState(560)
    const [selectedBubble, setSelectedBubble] = useState(null) // for highlighting and showing pool data on info panel
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)

    // Static values
    
    // Derived values

    // Group by epoch
    const d3DataForSelectedEpoch = useMemo(() => {
            if (!rawData) return [] // In case poolData is not fetched and stored yet
            const data = getStructuredPoolPerfData(rawData, selectedEpoch)
            return data
        }, [rawData, selectedEpoch])

    // Prepare data for d3 functions
    

    async function fetchData() {
        try {
            setIsLoading(true)
            // Make API call
            const response = await fetchPoolPerformanceData(selectedEpoch)
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
    }, [selectedEpoch])

    // Form handler
    const handleSubmit = e => {
        e.preventDefault()
        fetchData()
    }

    if (isLoading) {
        return <div className='text-gray-500 dark:text-white'>Loading pools...</div>
    }

    if (error) {
        return <div className='text-gray-500 dark:text-white'>Error: {error.message}, {error.type}</div>
    }

    return(
        // <main className="flex-grow w-full bg-white border-gray-200 dark:bg-gray-900 flex items-center justify-center text-gray-800 text-xl overflow-hidden static">
        <main className='h-[calc(100vh-10vh)] bg-white border-gray-200 dark:bg-gray-900 text-gray-800 text-xl overflow-hidden static'>
            <section id='d3-chart-container' className='w-full flex flex-col items-center mt-0 mb-0'>
                <BubbleMap 
                    poolData={d3DataForSelectedEpoch} 
                    selectedEpoch={selectedEpoch} 
                    poolPerf={true}
                    selectedBubble={selectedBubble}
                    setSelectedBubble={setSelectedBubble}/>
                <div className='absolute bottom-10 left-20 flex flex-col justify-center'>
                    <form onSubmit={handleSubmit}>
                        <div className='flex flex-col justify-center'>
                            <label htmlFor='epoch-slider' className='self-center dark:text-white'>Epoch number:</label>
                            <h4 className='self-center dark:text-white'>{selectedEpoch}</h4>
                            <input
                            id='epoch-slider'
                            type='range'
                            min='559' max='560' step='1'
                            value={selectedEpoch}
                            onChange={(e) => {
                                setSelectedEpoch(parseInt(e.target.value))
                                }}/>
                        </div>
                    </form>
                </div>
                {selectedBubble && <InfoPanel selectedEpoch={selectedEpoch} selectedBubble={selectedBubble} poolData={d3DataForSelectedEpoch} />}
            </section>
        </main>
    )
}