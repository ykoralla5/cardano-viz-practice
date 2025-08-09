import * as d3 from 'd3'
import { Children, useEffect, useRef, useState, useMemo } from 'react'

/* Generate bubble map */
export default function CircularPackingPoolPerf ({ poolData, width, height, selectedEpoch })
 {
    const svgReference = useRef(null)
    //const currentTotalActiveStake = totalStake //22.09 billion ADA

    // Color scale
    // const color = d3.scaleOrdinal(d3.schemeCategory10)
    // const colorInterpolator = d3.interpolateSpectral
    // var color = d3.scale.linear()
    //                 .domain([100,0])
    //                 .range(colorbrewer.Reds[3])

    /*
        TODO:
            1. Stroke scale for saturation percent
            2. Color scale for saturation percent
            3. Tooltip position on smaller screen is better than bigger screen
    */

    useEffect(() => {
        if (poolData.size === 0) return

        const padding = 20

        const root = d3
            .hierarchy(poolData) // generates data, parent, children, depth
            .sum((d) => d.value)
            .sort((a, b) => b.value - a.value)
    
        // Make area of circle equal to value. This gives every pool coordinates (x,y) and a radius
        const pack = d3.pack()
            .size([width,height])
            .padding(padding) // Padding between pool bubbles

        const nodes = pack(root)
            .descendants()
            .slice(1) // to remove outer most bubble

        // Filtering
        // Choose nodes only with expected blocks greater than 1
        const nodesToConsider = nodes.filter(d => d.data.name !== undefined && d.depth == 1 && d.data.expected_block_count > 1)

        // Creating color scale for performance ratios
        const performanceRatios = nodesToConsider.filter(d => d.data.name !== undefined && d.depth == 1).map(d => d.data.performance_ratio)
        const perfRatioMinVal = d3.min(performanceRatios)
        const perfRatioMaxVal = d3.max(performanceRatios)
        const perfRatioColorScale = d3.scaleOrdinal() //decide whether to use d3.scaleLinear vs d3.scaleOrdinal vs d3.scaleLog
            .domain([perfRatioMinVal, perfRatioMaxVal])
            .range([0, 1])

        const numbers = performanceRatios.map(d => perfRatioColorScale(d))

        const numbersAboveHalf = numbers.filter(d => d >= 0.5)
        const numbersBelowHalf = numbers.filter(d => d < 0.5)

        console.log(numbersBelowHalf.length, numbersAboveHalf.length)

        const svg = d3.select(svgReference.current)

        svg.selectAll('*').remove() // Clear previous svg renders

        const g = svg
            .append('g')
            .attr('transform', 'translate(0,0)')

        const tooltip = d3.select('body')
                .append('div')
                .attr('class', 'tooltip')
                .style('opacity', 0)
                .style('font-size', '12px')
                .style('color', 'black')
                .style('position', 'absolute')
                .style('padding', '6px 10px')
                .style('background', 'white')
                .style('border-radius', '4px')
                .style('stroke', 'black')
                // .style('visibility', 'hidden')
                // .style('box-shadow', '0px 0px 8px rgba(0,0,0,0.1)')
                // .style('pointer-events', 'none')
                // .style('z-index', 10)

        const bubbles = g.selectAll('circle')
            .data(nodesToConsider, (d) => d.data.name)
            .join((enter) =>
            enter
                .append('circle')
                .attr('cx', (d) => d.x)
                .attr('cy', (d) => d.y)
                .attr('r', (d) => d.r)
                .style('opacity', 0.8)
                // different color schemes for pools (Depth 1) and delegators (Depth 2)
                .style('fill', (d) => d3.interpolateRdYlGn(perfRatioColorScale(d.data.performance_ratio)))
                .attr('stroke', (d) => {
                    if(d.data.saturation_percent >= 100)
                        return 'red'
                    return 'white'
                })
                .attr('stroke-width', (d) => d.data.saturation_percent / 75)
                .transition().duration(800)
            )
            .on('mouseover', (event, d) => {
                tooltip
                    .style('opacity', 1)
                    .html('Pool: '+ d.data.name + '<br>' + 
                        'Actual block count: ' + d.data.actual_block_count + '<br>' + 
                        'Expected block count: ' + d.data.expected_block_count + '<br>' + 
                        'Saturation percent: ' + d.data.saturation_percent + '<br' +
                        'Performance ratio' + d.data.performance_ratio
                    )
                    .style('left', d.x + 10 + 'px')
                    .style('top', d.y + 10 + 'px')
            })
            .on('mouseout', function(d) {
                tooltip.style('opacity', 0)
            })
     }, [poolData, width, height])
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
            <div id="tooltip" style={{ position: 'absolute', visibility: 'hidden' }}></div>
        </svg>
    )
 }