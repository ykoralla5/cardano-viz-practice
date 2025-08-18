import * as d3 from 'd3'
import { Children, useEffect, useRef, useState, useMemo } from 'react'

/* Generate bubble map */
export default function CircularPackingPoolPerf ({ poolData, dimensions, selectedEpoch, selectedBubble, setSelectedBubble })
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
            1. Update infopanel on epoch change with selected bubble data from the new epoch selected
    */

    useEffect(() => {
        if (poolData.size === 0) return

        const padding = 20 // set padding between bubbles

        const root = d3
            .hierarchy(poolData) // generates data, parent, children, depth
            .sum((d) => d.value)
            //.sort((a, b) => b.value - a.value)
    
        // Make area of circle equal to value. This gives every pool coordinates (x,y) and a radius
        const pack = d3.pack()
            .size([dimensions.width, dimensions.height])
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
        const perfRatioColorScale = d3.scaleSqrt() //decide whether to use d3.scaleLinear vs d3.scaleOrdinal vs d3.scaleLog
            .domain([perfRatioMinVal, perfRatioMaxVal])
            .range([0, 1])

        const numbers = performanceRatios.map(d => perfRatioColorScale(d))
        // To check distribution of performance ratios
        const numbersAboveHalf = numbers.filter(d => d >= 0.5)
        const numbersBelowHalf = numbers.filter(d => d < 0.5)

        const svg = d3.select(svgReference.current)

        svg.selectAll('*').remove() // Clear previous svg renders

        const g = svg
            .append('g')
            .attr('transform', 'translate(0,0)')

        const tooltip = d3.select('#tooltip')
                .style('opacity', 0)
                .style('font-size', '12px')
                .style('color', 'black')
                .style('position', 'absolute')
                .style('padding', '6px 10px')
                .style('background', 'pink')
                .style('border-radius', '4px')
                .style('stroke', 'black')

        const bubbles = g.selectAll('circle')
            .data(nodesToConsider, (d) => d.data.name)
            .join((enter) =>
            enter
                .append('circle')
                .attr('cx', (d) => d.x)
                .attr('cy', (d) => d.y)
                .attr('r', (d) => d.r)
                .style('opacity', 0.8)
                // different color schemes based on performance ratio
                .style('fill', (d) => {
                    if(d.data.performance_ratio > 0 && d.data.performance_ratio <= 0.8)
                        return 'red'
                    else if (d.data.performance_ratio > 0.8 && d.data.performance_ratio <= 1.2)
                        return 'yellow'
                    else if (d.data.performance_ratio > 1.2)
                        return 'green'
                }
                )
                .attr('stroke', (d) => {
                    // if a bubble is selected, highlight it
                    if (selectedBubble && (d.data.name === selectedBubble.name)) return 'white'
                    else d.data.saturation_percent >= 100? 'red' : 'grey'
                })
                .attr('stroke-width', (d) => d.data.saturation_percent / 50)
                .transition().duration(800)
            ).on('click', (_, d) => {
                setSelectedBubble(d.data) // set bubble id as pool id
            })
            .on('mouseover', (_, d) => {
                tooltip
                    .style('opacity', 1)
                    .html('Pool: '+ d.data.name + '<br>' + 
                        'Actual / Expected block count: ' + d.data.actual_block_count + ' / ' + d.data.expected_block_count + '<br>' + 
                        'Performance ratio: ' + Math.round(d.data.performance_ratio * 100) / 100 + '<br>' +
                        'Saturation percent: ' + d.data.saturation_percent)
                    .style('left', d.x + 10 + 'px')
                    .style('top', d.y + 10 + 'px')
            })
     }, [poolData, selectedEpoch, selectedBubble])
    //  useEffect(() => {
    //     if (!selectedBubble) return

    //     const updated = poolData.flatMap(epoch => epoch.children).flatMap(pool => pool.children).find(d => d.name === selectedBubble.name)

    //     if (updated) setSelectedBubble(updated)
    //     else setSelectedBubble(null)
    //  }, [poolData])
    return (
        // <div class="flex gap-6">
        <div className='relative flex flex-column items-center justify-center'>
        <svg ref={svgReference} width={dimensions.width} height={dimensions.height}>
            <defs>
                <marker id='arrowhead'
                        viewBox='0 -5 10 10' refX='8' refY='0'
                        markerWidth='6' markerHeight='6'
                        orient='auto'>
                    <path d='M0,-5L10,0L0,5' fill='#555' />
                </marker>
            </defs>
            <g className='chart-content' transform={`translate(${dimensions.width / 2},${dimensions.height / 2})`}></g>
            <div className='tooltip absolute hidden top-0 right-0'></div>
        </svg>
        </div>
    )
 }