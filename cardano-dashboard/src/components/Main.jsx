import React from "react"
import { clsx } from 'clsx'
import BubbleMap from "./BubbleMap"
import { dummyPools } from "../data"

export default function Main() {
    // State values
    
    // Static values
    

    // Derived values
    

    return(
        <main>
            
            <section>
                <BubbleMap width={640} height={400} data={dummyPools}></BubbleMap>
            </section>
        </main>
    )
}