import * as d3 from 'd3'
import { Children, useEffect, useMemo, useRef, useState, useCallback } from "react"
import { clsx } from 'clsx'
import BubbleMap from "./BubbleMap"
import { fetchPools } from "../api/fetchPools"
import { getStructuredData, transformToD3Hierarchy, findEpochByKeyInMap } from '../utils/dataTransformers'

/* Fetching data from API and keeping addresses holding top 50% of stakes*/
export default function Main() {
    // State values
    const [rawData, setRawData] = useState(null)
    const [selectedEpoch, setSelectedEpoch] = useState(560)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)
    const [stakeChanges, setStakeChanges] = useState({})

    // Static values
    const stakeThreshold = 0.5 // Stake addresses owning 50% of total stake of pool

    // Derived values
    // Reconstruct and filter api call data - Keep stake holders holding top x% of pool stake
        const structuredData = useMemo(() => {
            if (!rawData) return [] // In case poolData is not fetched and stored yet
            return getStructuredData(rawData, stakeThreshold)
        }, [rawData])
        
        // Get index in array where data on selected epoch is present
        const epochIndex = findEpochByKeyInMap(structuredData, selectedEpoch)
        
        const d3DataForSelectedEpoch = useMemo(() => {
            if (!rawData) return [] // In case poolData is not fetched and stored yet
            return transformToD3Hierarchy(structuredData[epochIndex])
        }, [rawData])

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true)
                // Make API call
                const response = await fetchPools()
                setRawData(response)
            }
            catch (err) {
                setError(err)
            }
            finally {
                setIsLoading(false)
            }
        }
        fetchData()
    }, [])

    if (isLoading) {
        return <div className="text-gray-500 dark:text-white">Loading pools...</div>
    }

    if (error) {
        return <div className="text-gray-500 dark:text-white">Error: {error.message}</div>
    }

    return(
        <main className="flex-grow w-full bg-white border-gray-200 dark:bg-gray-900 flex items-center justify-center text-gray-800 text-xl overflow-hidden">
            <section id="d3-chart-container" className="w-full">
                <BubbleMap poolData={d3DataForSelectedEpoch} selectedEpoch={selectedEpoch} stakeThreshold={stakeThreshold} />
                <div className="max-w-screen-xl flex gap-10 justify-center">
                    <input
                    id="epoch-slider"
                    type="range"
                    min="559" max="560" step="1"
                    value={selectedEpoch}
                    onChange={(e) => {setSelectedEpoch(+e.target.value)}}/>
                    <h4 className="self-center dark:text-white">{selectedEpoch}</h4>
                </div>
            </section>
        </main>
    )
}