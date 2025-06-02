import React from "react"
import { clsx } from 'clsx'
import BubbleMap from "./BubbleMap"

export default function Main() {
    // State values
    
    // Static values
    

    // Derived values
    

    return(
        <main>
            
            <section style={{height: '90vh', width: '100vw', display: 'flex', flexDirection: 'column'}}>
                <BubbleMap totalStake={22090000000}/>
            </section>
        </main>
    )
}