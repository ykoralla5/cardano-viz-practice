import * as d3 from 'd3'
import { Children, useEffect, useRef, useState, useMemo } from 'react'

/* Generate bubble map */
export default function CircularPacking ({ nodes, nodeLinks, dimensions, selectedBubble, setSelectedBubble })
 {
    const svgReference = useRef(null)

    // Color scale
    const color = d3.scaleOrdinal(d3.schemeCategory10)
    const colorInterpolator = d3.interpolateSpectral

    const colorScale = d3.scaleSequential(d3.interpolateReds)
        .domain([1, 100]) // min & max of your values

    useEffect(() => {

        if (!nodes || nodes.length === 0) return

        // Scaling
        // Color
        const saturationRatios = nodes.map(d => d.saturation_ratio)
        const saturationMin = d3.min(saturationRatios)
        const saturationMax = d3.max(saturationRatios)

        const saturationScale = d3.scaleLinear()
            .domain([saturationMin, saturationMax])
            .range([0, 1])

        // Width
        const poolStakes = nodes.map(d => parseInt(d.total_stake))
        const stakeMinValue = d3.min(poolStakes)
        const stakeMaxValue = d3.max(poolStakes)

        const radiusScale = d3.scaleSqrt()
            .domain([stakeMinValue, stakeMaxValue])
            .range([1, 30])

        const movementAmounts = nodeLinks.map(d => d.movement_amount)
        const movementAmountMin = d3.min(movementAmounts)
        const movementAmountMax = d3.max(movementAmounts)

        const linkWidthScale = d3.scaleSqrt()
            .domain([movementAmountMin, movementAmountMax])
            .range([1, 40])

        const chargeScale = d3.scaleSqrt()
            .domain([movementAmountMin, movementAmountMax])
            .range([-100, 100])

        const links = nodeLinks.map(p => ({
            source: p.pool1,
            target: p.pool2,
            value: p.movement_count,
            movement_amount: p.movement_amount
        }))

        // Clear SVG before render
        d3.select(svgReference.current).selectAll('*').remove() // Clear previous svg renders
        
        const svg = d3
            .select(svgReference.current)
            .attr("width", dimensions.width)
            .attr("height", dimensions.height)

        const container = svg.append("g").attr("class", "zoom-container")

        // Add links
        const link = svg
            .append("g")
            .attr("stroke-opacity", 0.6)
            .selectAll("line")
            .data(links)
            .join("line")
            .attr("stroke-width", d => linkWidthScale(d.movement_amount))
            .attr("stroke", "white")

        // Add nodes as bubbles
        const bubbles = svg
            .append("g")
            .selectAll("circle")
            .data(nodes)
            .join("circle")
                .attr("fill", d => {
                    if (d.is_active === 'false' && d.delegator_count === 0)
                        return "white"
                    else {
                        const saturation = d3.interpolateRdYlGn(saturationScale(d.saturation_ratio))
                        return saturation
                    }
                })
                .attr("stroke", d => {
                    if (d.is_active === 'false')
                        console.log("inactive pool")
                    return "white"
                        //? "red" : "white"
                })
                .attr("stroke-width", d => {
                    (d.is_active === 'false' && d.delegator_count === 0) ? "4" : "1"
                })
                .attr("r", d => radiusScale(d.total_stake))
                .on("mouseover", function() { d3.select(this).attr("stroke", "#000") })
                .on("mouseout", function() { d3.select(this).attr("stroke", null) })
                .on("click", function(event, d) {
                    console.log(d)
                    // Set full data of selected bubble to be able to show on info panel
                    setSelectedBubble(d) })

        const retiredPoolLabels = svg.selectAll("text")
            .data(nodes.filter(d => d.is_active === 'false' && d.delegator_count !== 0))
            .join("text")
            .text("⚠️")
            .attr("font-size", "32px")
            .attr("text-anchor", "middle")
            .attr("dy", ".35em")
            .attr("pointer-events", "none")

        const simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink(links).id(d => d.pool_id).distance(20)) // normalize
            .force("charge", d3.forceManyBody().strength(-50))
            //.force("collision", d3.forceCollide().radius(40))
            .force("center", d3.forceCenter(dimensions.width / 2, dimensions.height / 2))
            .force("x", d3.forceX().strength(0.05))
            .force("y", d3.forceY().strength(0.05));

        link.append("title").text(d => d.movement_amount)
        bubbles.append("title").text(d => d.pool_id)
        // bubbles.append("text").attr("x", d => d.x).attr("y", d => d.y).attr("fill", "black").attr("text-anchor", "middle").style("font-size", "100px").text(d => d.is_active ? '' : 'blah')

        simulation.on("tick", () => {
            link
                .attr("x1", d => {
                    return d.source.x
                })
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y)

            bubbles
                .attr("cx", d => d.x)
                .attr("cy", d => d.y)

            // labels
            //     .attr("x", d => d.x)
            //     .attr("y", d => d.y)

            retiredPoolLabels
                .attr("x", d => d.x)
                .attr("y", d => d.y)
        })

        simulation.on("end", () => {
            console.log("Simulation ended")
        })

        const zoom = d3.zoom()
            .scaleExtent([0.2, 4])
            .filter(event => {
                if (event.type === "wheel") return event.ctrlKey
                return event.type === "mousedown" || event.type === "touchstart" || event.type === "pointerdown"
            })
            .on("zoom", (event) => {
                container.attr("transform", event.transform)
            })

            svg.call(zoom)
                .attr("width", dimensions.width)
                .attr("height", dimensions.height)
                .style("cursor", "grab")
                .on("mousedown.zoom", null)

            return () => {
                simulation.stop()
                d3.select(svgReference.current).selectAll('*').remove()
                //svgReference.current = null
                //svg.on(".zoom", null)
                //d3.select(window).on("mouseup.zoom-cursor", null)
            }
     }, [nodes, nodeLinks])

    return (
        <div className='relative flex flex-column items-center justify-center'>
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
        </div> 
    )
 }