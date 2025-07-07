import * as d3 from 'd3'
import { Children, useEffect, useMemo, useRef, useState } from "react"
import { clsx } from 'clsx'
import BubbleMap from "./BubbleMap"
import { fetchPools } from "../api/fetchPools"

/* Fetching data from API and keeping addresses holding top 50% of stakes*/
export default function Main() {
    // State values
    const [poolData, setPoolData] = useState(new Map())
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
        }, [])

    //console.log(poolData, typeof(poolData))
    const poolTop50Data = useMemo(() => {
        if (!poolData) return new Map() // In case poolData is not fetched and stored yet
        
        const groupByEpochPool = d3.group(
            poolData,
            d => d.epoch_no,
            d => d.pool_id)

        //console.log(groupByEpochPool)

        return new Map(
            Array.from(groupByEpochPool, ([epoch, poolMap]) => [
                epoch,
                new Map(
                    Array.from(poolMap, ([pool, rows]) => {
                    //console.log(Object.values(rows))
                    const sorted = rows.slice().sort((a,b) => b.amount - a.amount)
                    //console.log(sorted)
                    const total = d3.sum(sorted, d => d.amount)
                    const cum = d3.cumsum(sorted, d => d.amount)
                
                    const cut = cum.findIndex(v => v >= 0.5 * total)
                
                    return [pool, sorted.slice(0, cut + 1)]
                    })
                )
            ]
        ))
    }, [poolData]) // recompute everytime poolData changes

    if (loading) {
        return <div className="text-gray-500 dark:text-white">Loading pools...</div>
    }

    return(
        <main className="flex-grow w-full bg-white border-gray-200 dark:bg-gray-900 flex items-center justify-center text-gray-800 text-xl overflow-hidden">
            <section id="d3-chart-container" className="w-full">
                <BubbleMap poolData={poolTop50Data}/>
            </section>
        </main>
    )
}