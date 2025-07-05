import React from "react"
import { Children, useEffect, useRef, useState } from "react"
import { clsx } from 'clsx'
import BubbleMap from "./BubbleMap"
import { fetchPools } from "../api/fetchPools"

/* Fetching data from API */
export default function Main() {
    // State values
    const [poolData, setPoolData] = useState([])
    const [loading, setLoading] = useState(true)
    // Static values

    // Derived values

    useEffect(() => {

        fetchPools()
            .then((result) => {
                setPoolData(result)
                setLoading(false)
            })
            .catch((err) => {
                console.error(err)
                setLoading(false)
            })
        }, []);

    if (!poolData.length) {
        return <div>Loading pools...</div>
    }

    return(
        <main className="flex-grow w-full bg-gray-100 flex items-center justify-center text-gray-800 text-xl overflow-hidden">
            <section id="d3-chart-container" className="w-full h-full">
                <BubbleMap poolData={poolData}/>
            </section>
        </main>
    )
}