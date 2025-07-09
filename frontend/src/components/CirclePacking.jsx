import * as d3 from 'd3'
import { Children, useEffect, useRef, useState, useMemo } from 'react'

/* Generate bubble map */
export default function CircularPacking ({ poolData, width, height, selectedEpoch })
 {
    
    const svgReference = useRef(null)
    //const currentTotalActiveStake = totalStake //22.09 billion ADA

    // Color scale
    const color = d3.scaleOrdinal(d3.schemeCategory10)

    useEffect(() => {
        if (poolData.size === 0) 
            
        console.log(poolData)

        const margin = 20

        const root = d3
            .hierarchy(poolData)
            .sum((d) => d.value)
            .sort((a, b) => b.value - a.value)

        // Make area of circle equal to value. This gives every pool coordinates (x,y) and a radius
        const pack = d3.pack()
            .size([width - margin * 2, height - margin * 2])
            .padding(4) // Padding between pool bubbles

        const nodes = pack(root).descendants().slice(1)
        //.leaves()

        // const depthCounts = d3.rollup(
        //     poolData,            // every node, incl. root
        //     v => v.length,                 // reducer → how many in this group?
        //     d => d.depth                   // key → depth level
        // );
        // console.log(depthCounts)
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
                .attr('r', (d) => d.r)
                .style('opacity', 0.8)
                .style('fill', (d) => d3.interpolateSpectral(d.value / nodes[0].value))
                .attr('stroke', (d) => d.depth === 1 ? 'white' : 'none') 
                .attr('stroke-width', d => d.depth === 1 ? 2 : 0)
                .transition().duration(800)
                //.attr('r', (d) => d.r)
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
            .text((d) => d.amount)
     }, [poolData])

        /* TODO:
            1. show delegation changes using arrows
            2. remove scrollbars
            3. tooltip to show data
        */ 

    return (
        <>
            <h4 className="self-center dark:text-white">{selectedEpoch}</h4>
            <svg ref={svgReference} width={width} height={height}></svg>
        </>
        
    )
 }