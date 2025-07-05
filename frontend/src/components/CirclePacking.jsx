import * as d3 from "d3"
import { Children, useEffect, useRef, useState } from "react"

/* Generate bubble map */
export default function CircularPacking ({ poolData, width, height })
 {
    
    const svgReference = useRef(null)
    //const currentTotalActiveStake = totalStake //22.09 billion ADA

    // Color scale
    const color = d3.scaleOrdinal(d3.schemeCategory10)

    useEffect(() => {
        if (poolData.length === 0) return

        // const width = window.innerWidth // screen.width
        // const height = window.innerHeight // screen.height

        //console.log(width, height)

        const root = d3
            .hierarchy({children: poolData})
            .sum((d) => d.amount)
            .sort((a, b) => b.value - a.value)

        const pack = d3.pack().size([width, height]).padding(4)

        const nodes = pack(root).leaves()

        const svg = d3.select(svgReference.current)

        const g = svg
            .append('g')
            .attr('transform', 'translate(0,0)')

        const bubbles = g
            .selectAll('circle')
            .data(nodes, (d) => d.data.pool_id)
            .join((enter) =>
            enter
                .append('circle')
                .attr('cx', (d) => d.x)
                .attr('cy', (d) => d.y)
                .attr('r', 0)
                .style('opacity', 0.8)
                .style('fill', (d) => d3.interpolateSpectral(d.value / nodes[0].value))
                .transition().duration(800)
                .attr('r', (d) => d.r)
            )

        const labels = g
            .selectAll('text')
            .data(nodes)
            .join('text')
            .attr('x', (d) => d.x)
            .attr('y', (d) => d.y)
            .attr('font-size', '15px')
            .attr('text-anchor', 'middle')
            .attr('alignment-baseline', 'before-edge')
            .attr('fill', '#fff')
            .style('pointer-events', 'none')
            .text((d) => d.data.pool_id)
     }, [poolData])

        /* TODO:
            1. Nearing 1 saturation as red and above 1 as another color?
            2. Show linear grid for x and y
            3. Break text on new line
            4. Header, spacing of map (remove horizontal and vertical scroll bars), responsiveness
            5. Try with example JSON from actual node (check how to extract json from psql)
        */ 

    return (
        <svg ref={svgReference} width={width} height={height}></svg>
    )
 }