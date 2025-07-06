import * as d3 from 'd3'
import { Children, useEffect, useRef, useState } from 'react'

/* Generate bubble map */
export default function CircularPacking ({ poolData, width, height })
 {
    
    const svgReference = useRef(null)
    //const currentTotalActiveStake = totalStake //22.09 billion ADA

    // Color scale
    const color = d3.scaleOrdinal(d3.schemeCategory10)

    useEffect(() => {
        if (poolData.length === 0) return

        const margin = 20

        const root = d3
            .hierarchy({children: poolData})
            .sum((d) => d.amount)
            .sort((a, b) => b.value - a.value)

        const pack = d3.pack().size([width - margin * 2, height - margin * 2])
            .padding(4) // Padding between pool bubbles

        const nodes = pack(root).leaves()

        const poolIds = Array.from(new Set(poolData.map(d => d.pool_id))) // unique pool_ids
        console.log(poolIds)

        const svg = d3.select(svgReference.current)

        svg.selectAll('*').remove // Clear previous svg renders

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
            .attr('font-size', '10px')
            .attr('text-anchor', 'middle')
            .attr('alignment-baseline', 'before-edge')
            .attr('fill', '#fff')
            .style('pointer-events', 'none')
            .text((d) => d.data.amount)
     }, [poolData])

        /* TODO:
            1. Why is svg showing as bubble?
            2. show 2 levels of bubbles: 1. pools and 2. delegators
            3. choose delegators owning top 50% of stake of pool. Filter this on frontend or backend? 
            4. Get such data from 2 epochs and show delegation changes using arrows
            5. remove scrollbars
            6. tooltip to show data
        */ 

    return (
        <svg ref={svgReference} width={width} height={height}></svg>
    )
 }