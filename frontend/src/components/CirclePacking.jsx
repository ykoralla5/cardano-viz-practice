import * as d3 from 'd3'
import { Children, useEffect, useRef, useState, useMemo } from 'react'

/* Generate bubble map */
export default function CircularPacking ({ poolData, dimensions, selectedEpoch, flowLinks, selectedBubbleId, setSelectedBubbleId })
 {
    const svgReference = useRef(null)
    //const currentTotalActiveStake = totalStake //22.09 billion ADA

    // Color scale
    const color = d3.scaleOrdinal(d3.schemeCategory10)
    const colorInterpolator = d3.interpolateSpectral

    const colorScale = d3.scaleSequential(d3.interpolateReds)
        .domain([1, 100]); // min & max of your values

    useEffect(() => {
        if (poolData.size === 0) return
    
        // Get all pool ids
        const pools = Array.from(new Set(poolData.flatMap(p => [p.pool1, p.pool2])))

        const nodes = pools.map(p => ({id: p}))

        const links = poolData.map(p => ({
            source: p.pool1,
            target: p.pool2,
            value: p.movement_count
        }))

        // Clear SVG before render
        d3.select(svgReference.current).selectAll('*').remove() // Clear previous svg renders
        
        const svg = d3
            .select(svgReference.current)
            .attr('width', dimensions.width)
            .attr('height', dimensions.height)

        // Add links
        const link = svg
            .append('g')
            .attr("stroke-opacity", 0.6)
            .selectAll("line")
            .data(links)
            .join("line")
            .attr("stroke-width", d => d.value)
            .attr("stroke", d => colorScale(d.value))

        // Add nodes as bubbles
        const bubbles = svg
            .append('g')
            .selectAll('circle')
            .data(nodes)
            .join('circle')
                .attr('fill', 'red')
                .attr('stroke', 'yellow')
                .attr('stroke-width', d => d.value)
                .attr('r', 10)
            // .call(
            //     d3.drag()
            //         .on('start', (event, d) => {
            //             setSelectedBubbleId(d.data.name) // set bubble id as pool id
            //             console.log(selectedBubbleId)
            //             //d3.attr('stroke', (d) => d.data.name === selectedBubbleId ? 'white' : '')
            //             d3.select('#info-panel')
            //                 .style('opacity', 1)
            //                 .html('Pool: '+ d.data.name + '<br>' + 
            //                     'Actual / Expected block count: ' + d.data.actual_block_count + ' / ' + d.data.expected_block_count + '<br>' +
            //                     'Performance ratio: ' + Math.round(d.data.performance_ratio * 100) / 100 + '<br>' +
            //                     'Saturation percent: ' + d.data.saturation_percent
            //                             )
            //                     })
            //         .on('drag', (event, d) => {
            //             tooltip
            //                 .style('opacity', 1)
            //                 .html('Pool: '+ d.data.name + '<br>' + 
            //                     'Actual / Expected block count: ' + d.data.actual_block_count + ' / ' + d.data.expected_block_count + '<br>' + 
            //                     'Performance ratio: ' + Math.round(d.data.performance_ratio * 100) / 100 + '<br>' +
            //                     'Saturation percent: ' + d.data.saturation_percent)
            //                 .style('left', d.x + 10 + 'px')
            //                 .style('top', d.y + 10 + 'px')
            //         })
            //         .on('end', function(d) {
            //             tooltip.style('opacity', 0)
            //         })
            //     )

        const simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink(links).id(d => d.id).strength(d => d.value / 100)) // normalize
            .force("charge", d3.forceManyBody().strength(-50))
            .force("center", d3.forceCenter(dimensions.width / 2, dimensions.height / 2))
            .force("x", d3.forceX())
            .force("y", d3.forceY())

        bubbles.append("title").text(d => d.id)

        simulation.on("tick", () => {
            console.log("Tick")
            link
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y)

            bubbles
                .attr("cx", d => d.x)
                .attr("cy", d => d.y)
        })

        simulation.on("end", () => {
            console.log("Simulation ended")
        })
     }, [poolData, selectedEpoch])

    return (
        <>
            <svg ref={svgReference} width={dimensions.width} height={dimensions.height}>
                <defs>
                <marker id="arrowhead"
                        viewBox="0 -5 10 10" refX="8" refY="0"
                        markerWidth="6" markerHeight="6"
                        orient="auto">
                    <path d="M0,-5L10,0L0,5" fill="#555" />
                </marker>
            </defs>
            <g className="chart-content" transform={`translate(${dimensions.width / 2},${dimensions.height / 2})`}></g>
            </svg>
        </> 
    )
 }