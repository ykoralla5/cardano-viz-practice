import * as d3 from 'd3'
import { Children, useEffect, useRef, useState, useMemo } from 'react'

/* Generate bubble map */
export default function CircularPacking ({ poolData, width, height, selectedEpoch, flowLinks })
 {
    const svgReference = useRef(null)
    //const currentTotalActiveStake = totalStake //22.09 billion ADA

    // Color scale
    const color = d3.scaleOrdinal(d3.schemeCategory10)
    const colorInterpolator = d3.interpolateSpectral

    useEffect(() => {
        if (poolData.size === 0) return

        const margin = 20

        //console.log(poolData.children)

        const root = d3
            .hierarchy(poolData) // generates data, parent, children, depth
            .sum((d) => {
                //console.log(d.name, typeof(d.name), d.name.split('_')[1])
                return d.name
            })
            //parseInt(d.data.name.split('_')[1])) 
            //parseInt(d.value))
            //.sort((a, b) => (b.value - a.value) || d3.ascending(a.data.name, b.data.name));
            .sort((a, b) => {
                //const valueDiff = b.value - a.value
                //if (valueDiff !== 0) return valueDiff
                //return b.height - a.height || b.value - a.value
                //const addr_regex = /addr_(\d+)/
                //const pool_regex = /pool_(\d+)/
                //console.log(a.data.name.match(regex)[1])
                //console.log(a.parent.data.name)
                // console.log(a.data.name)
                if (a.depth === 1) { // These are pool nodes
                    return d3.ascending(a.data.name, b.data.name)
                 }
                 else if (a.depth === 2) {
                    return 0
                 }
                //console.log(a.data.name, b.data.name)
                //order.push(a.data.name, b.data.name)
                return 0
                //return d3.ascending(parseInt(a.data.name.split('_')[1]), parseInt(b.data.name.split('_')[1]))
            })

        const size = Math.min(width, height)
    
        // Make area of circle equal to value. This gives every pool coordinates (x,y) and a radius
        const pack = d3.pack()
            .size([400,400])
            .padding(4) // Padding between pool bubbles

        const nodes = pack(root)
            .descendants()
            .slice(1) // to remove outer most bubble

        //const node15 = nodes.filter(d => d.depth == 1 && d.data.name == 74)
        //console.log(selectedEpoch, node15)


        const poolValuesToColor = nodes.filter(d => d.data.name !== undefined && d.depth == 1).map(d => d.data.name)
        const delValuesToColor = nodes.filter(d => d.data.name !== undefined && d.depth == 2).map(d => d.data.name)
        // const nodesToConsider = nodes.map(d => parseInt(d.data.amount))


        const poolMinValue = d3.min(poolValuesToColor)
        const poolMaxValue = d3.max(poolValuesToColor)
        const delMinValue = d3.min(delValuesToColor)
        const delMaxValue = d3.max(delValuesToColor)
        // const radiusMinValue = d3.min(nodesToConsider)
        // const radiusMaxValue = d3.max(nodesToConsider)

        const poolColorScale = d3.scaleLinear()
            .domain([poolMinValue, poolMaxValue])
            .range([0, 1])

        const delsColorScale = d3.scaleLinear()
            .domain([delMinValue, delMaxValue])
            .range([0, 1])

        // const xScale = d3.scaleLinear()
        //     .domain([0, poolMaxValue])
        //     .range([100, width - 100])

        // const yScale = d3.scaleLinear()
        //     .domain([0, poolMaxValue])
        //     .range([100, height - 100])

        // const radiusScale = d3.scaleSqrt()
        //     .domain([0, radiusMaxValue])
        //     .range([5, 500])

        //console.log(poolColorScale(poolMinValue), poolColorScale(poolMaxValue), delsColorScale(delMinValue), delsColorScale(delMaxValue))
        //.leaves()

        // const depthCounts = d3.rollup(
        //     poolData,            // every node, incl. root
        //     v => v.length,                 // reducer → how many in this group?
        //     d => d.depth                   // key → depth level
        // );
        // console.log(depthCounts)
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
                // .attr('cx', d => xScale(parseInt(d.data.name.split('_')[1])))
                // .attr('cy', d => yScale(parseInt(d.data.name.split('_')[1])))
                .attr('r', (d) => d.r)
                .style('opacity', 0.8)
                // different color schemes for pools (Depth 1) and delegators (Depth 2)
                // .style('fill', (d) => d.depth === 2 ? d3.interpolateSpectral(d.value / nodes[0].value) : color(d)) color(parseInt(d.data.name.split('_')[1]))
                .style('fill', (d) => d.depth === 1 ? d3.interpolateGreens(poolColorScale(d.data.name)) : d3.interpolateOranges(delsColorScale(parseInt(d.data.name))))
                //.style('fill', (d) => d.depth === 2 ? color(parseInt(d.data.name.split('_')[1])): d3.interpolateBlues(colorScale(parseInt(d.data.name.split('_')[1]))))
                .attr('stroke', (d) => d.depth === 1 ? 'white' : 'none') 
                .attr('stroke-width', (d) => d.depth === 1 ? 2 : 0)
                .transition().duration(800)
                //.attr('r', (d) => d.r)
            )
            .on('mouseover', mouseover)
            .on('mousemove', mousemove)
            .on('mouseleave', mouseleave)

        const tooltip = g
            .selectAll('text')
            //.data(nodes)
            //.join('text')
            //.attr('x', (d) => d.x)
            //.attr('y', (d) => d.y)
            //.attr('font-size', '15px')
            .attr('text-anchor', 'middle')
            .attr('alignment-baseline', 'before-edge')
            .attr('fill', '#fff')
            .style('pointer-events', 'none')
            //.text((d) => d.amount)

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
        <div>
            <h4 className="justify-center dark:text-white">{selectedEpoch}</h4>
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
        </div>
        
    )
 }