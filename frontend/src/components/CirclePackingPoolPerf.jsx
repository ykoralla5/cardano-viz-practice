import * as d3 from 'd3'
import { Children, useEffect, useRef, useState, useMemo } from 'react'

/* Generate bubble map */
export default function CircularPackingPoolPerf ({ poolData, width, height, selectedEpoch })
 {
    const svgReference = useRef(null)
    //const currentTotalActiveStake = totalStake //22.09 billion ADA

    // Color scale
    const color = d3.scaleOrdinal(d3.schemeCategory10)
    const colorInterpolator = d3.interpolateSpectral

    useEffect(() => {
        if (poolData.size === 0) return

        const margin = 20

        const root = d3
            .hierarchy(poolData) // generates data, parent, children, depth
            .sum((d) => d.value)
            .sort((a, b) => b.value - a.value)
    
        // Make area of circle equal to value. This gives every pool coordinates (x,y) and a radius
        const pack = d3.pack()
            .size([width,height])
            .padding(4) // Padding between pool bubbles

        const nodes = pack(root)
            .descendants()
            .slice(1) // to remove outer most bubble

        const poolValuesToColor = nodes.filter(d => d.data.name !== undefined && d.depth == 1).map(d => d.data.name)
        // const nodesToConsider = nodes.map(d => parseInt(d.data.amount))

        const poolMinValue = d3.min(poolValuesToColor)
        const poolMaxValue = d3.max(poolValuesToColor)

        // const radiusMinValue = d3.min(nodesToConsider)
        // const radiusMaxValue = d3.max(nodesToConsider)

        const svg = d3.select(svgReference.current)

        svg.selectAll('*').remove() // Clear previous svg renders

        const g = svg
            .append('g')
            .attr('transform', 'translate(0,0)')

        const bubbles = g
            .selectAll('circle')
            .data(nodes, (d) => d.data.name)
            .join((enter) =>
            enter
                .append('circle')
                .attr('cx', (d) => d.x)
                .attr('cy', (d) => d.y)
                .attr('r', (d) => Math.sqrt(d.r))
                .style('opacity', 0.8)
                // different color schemes for pools (Depth 1) and delegators (Depth 2)
                .style('fill', (d) => d3.interpolateSpectral(d.value / nodes[0].value))
                .attr('stroke', (d) => 'white') 
                .attr('stroke-width', (d) => d.saturation_percent)
                .transition().duration(800)
            )
            .on('mouseover', mouseover)
            .on('mousemove', mousemove)
            .on('mouseleave', mouseleave)

        const tooltip = g
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
            .text((d) => {
                return d.pool_stake
            })

        var mouseover = function(d) {
            tooltip.style("opacity", 1)
        }
        var mousemove = function(d) {
            tooltip
                .html(d.name + "<br>" + "long: " + d.long + "<br>" + "lat: " + d.lat)
                .style("left", (d3.mouse(this)[0]+10) + "px")
                .style("top", (d3.mouse(this)[1]) + "px")
        }
        var mouseleave = function(d) {
            tooltip.style("opacity", 0)
        }
     }, [poolData, width, height])

        /* TODO:
            1. show delegation changes using arrows
            2. remove scrollbars
            3. tooltip to show data
        */ 

    return (
        <svg ref={svgReference} width={width} height={height}>
            <defs>
                <marker id="arrowhead"
                        viewBox="0 -5 10 10" refX="8" refY="0"
                        markerWidth="6" markerHeight="6"
                        orient="auto">
                    <path d="M0,-5L10,0L0,5" fill="#555" />
                </marker>
            </defs>
            <g className="chart-content" transform={`translate(${width / 2},${height / 2})`}></g>
        </svg>
    )
 }