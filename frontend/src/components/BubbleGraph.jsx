import * as d3 from 'd3'
import { Children, useEffect, useRef, useState, useMemo } from 'react'

/* Generate bubble map */
export default function BubbleGraph ({ nodes, nodeLinks, radiusScale, saturationScale, dimensions, selectedElement, setSelectedElement })
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
        // const saturationRatios = nodes.map(d => d.saturation_ratio)
        // const saturationMin = d3.min(saturationRatios)
        // const saturationMax = d3.max(saturationRatios)

        // const saturationScale = d3.scaleLinear()
        //     .domain([saturationMin, saturationMax])
        //     .range([0, 1])

        // Width
        // const poolStakes = nodes.map(d => parseInt(d.total_stake))
        // const stakeMinValue = d3.min(poolStakes)
        // const stakeMaxValue = d3.max(poolStakes)

        // const radiusScale = d3.scaleSqrt()
        //     .domain([stakeMinValue, stakeMaxValue])
        //     .range([1, 40])

        const movementAmounts = nodeLinks.map(d => d.movement_amount)
        const movementAmountMin = d3.min(movementAmounts)
        const movementAmountMax = d3.max(movementAmounts)

        // const linkWidthScale = d3.scaleSqrt()
        //     .domain([movementAmountMin, movementAmountMax])
        //     .range([1, 5])

        const chargeScale = d3.scaleSqrt()
            .domain([movementAmountMin, movementAmountMax])
            .range([-100, 100])

        const links = nodeLinks.map(p => ({
            source: p.source_pool_id,
            target: p.destination_pool_id,
            value: p.movement_count,
            movement_amount: p.movement_amount,
            source_stake_change_percent: p.source_stake_change_percent,
            dest_stake_change_percent: p.dest_stake_change_percent
            })
        )

        // Clear SVG before render
        d3.select(svgReference.current).selectAll('*').remove() // Clear previous svg renders
        
        const svg = d3.select(svgReference.current)

        const g = svg.append("g").attr("class", "chart-content")

        svg.call(
            d3.zoom()
                .scaleExtent([0.5, 3]) // min/max zoom
                .on("zoom", (event) => {
                    g.attr("transform", event.transform)
                })
            )

        const linksLayer = g.append("g")
        
        // Add links
        const link = linksLayer
            .selectAll("line")
            .data(links)
            .attr("stroke-opacity", d => d.value / movementAmountMax)
            .join("line")
            .attr("stroke-width", 1)
            // .attr("stroke-width", d => linkWidthScale(d.movement_amount))
            .attr("stroke", "white")
            .attr("marker-end", "url(#arrowhead)")
            // .attr("d", d3.link(d3.curveBumpY)
            //     .x((d) => d.x)
            //     .y((d) => d.y))
            .on("mouseover", function(event, d) {
                d3.select(this).style("cursor", "pointer")
                //setSelectedElement([{"type": "link", "data": d}])
                d3.select(this).attr("stroke", "yellow")
            })
            .on("mouseout", function() { 
                d3.select(this).style("cursor", "default");
                // setSelectedElement(null)
                d3.select(this).attr("stroke", "white") 
            })
            .on("click", function(event, d) {
                // If the clicked link is already selected, deselect it
                setSelectedElement([{"type": "link", "data": d}])
            })

        var defs = svg.append("defs")

        defs.append("svg:marker")
            .attr("id", "arrowhead") // Give it a unique ID to reference it later
            .attr("viewBox", "0 0 10 10") // Set the viewBox for the marker shape
            .attr("refX", 50) // Adjust this value (bubble radius + offset)
            .attr("refY", 5) // Center the marker vertically
            .attr("markerUnits", "strokeWidth")
            .attr("markerWidth", 9)
            .attr("markerHeight", 5)
            .attr("orient", "auto") // Ensure the arrowhead rotates to face the link's direction
            .append("svg:path")
            .attr("d", "M 0 0 L 10 5 L 0 10 z") // A simple triangle shape
            .attr("fill", "#BBBBBB") // Set the color of the arrowhead


        const bubblesLayer = g.append("g")

        // Add nodes as bubbles
        const bubbles = bubblesLayer
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
            // .call(drag(simulation))
            .attr("fill-opacity", 1)
            .attr("stroke", d => d.is_active === 'false' ? "red" : "white" )
            .attr("stroke-opacity", 1)
            .attr("stroke-width", d => (d.is_active === 'false' && d.delegator_count === 0) ? "4" : "1")
            .attr("r", d => radiusScale(d.total_stake))
            .on("mouseover", function(event, d) {
                d3.select(this).style("cursor", "pointer")
                //setSelectedElement([{"type": "pool", "data": d}])
                })
            .on("mouseout", function() {
                //setSelectedElement(null)
                //d3.select(this).attr("stroke", d => d.is_active === 'false' ? "red" : "white" ) 
            })
            .on("click", function(event, d) {
                // If the clicked link is already selected, deselect it
                setSelectedElement([{"type": "pool", "data": d}])
                d3.select(this).attr("stroke", "yellow" )
            })

        const retiredPoolLabels = svg.selectAll("text")
            .data(nodes.filter(d => d.is_active === 'false' && d.delegator_count !== 0))
            .join("text")
            .text("RETIRED")
            .attr("font-size", "100px")
            .attr("text-anchor", "middle")
            .attr("dy", ".35em")
            .attr("pointer-events", "none")

        const simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink(links).id(d => d.pool_id).distance(20)) // normalize
            .force("charge", d3.forceManyBody().strength(-50))
            .force("collision", d3.forceCollide().radius(d => radiusScale(d.total_stake) + 10).iterations(2)) // to prevent bubbles from overlapping
            .force("center", d3.forceCenter(dimensions.width / 2, dimensions.height / 2))
            .force("x", d3.forceX().strength(0.05))
            .force("y", d3.forceY().strength(0.05))
            .alphaDecay(0.1) // increase to reduce simulation time (keep between 0 and 1)

        bubbles.append("title").text(d => d.pool_id)
        // bubbles.append("text").attr("x", d => d.x).attr("y", d => d.y).attr("fill", "black").attr("text-anchor", "middle").style("font-size", "100px").text(d => d.is_active ? '' : 'blah')

        simulation.on("tick", () => {
            
            link
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y)
                
                // Shorten links to not overlap with bubbles
                // .attr("x2", d => {
                //     const dx = d.target.x - d.source.x;
                //     const dy = d.target.y - d.source.y;
                //     const dist = Math.sqrt(dx * dx + dy * dy);
                //     const offsetX = (dx * d.target.r) / dist; // shorten by target radius
                //     return d.target.x - offsetX;
                //     })
                // .attr("y2", d => {
                // const dx = d.target.x - d.source.x;
                // const dy = d.target.y - d.source.y;
                // const dist = Math.sqrt(dx * dx + dy * dy);
                // const offsetY = (dy * d.target.r) / dist;
                // return d.target.y - offsetY;
                // })

            bubbles
                .attr("cx", d => d.x)
                .attr("cy", d => d.y)

            retiredPoolLabels
                .attr("x", d => d.x)
                .attr("y", d => d.y)
        })

        simulation.on("end", () => {
            console.log("Simulation ended")
        })

        // drag = simulation => {
  
        // function dragstarted(event, d) {
        //     if (!event.active) simulation.alphaTarget(0.3).restart();
        //     d.fx = d.x;
        //     d.fy = d.y;
        // }
        
        // function dragged(event, d) {
        //     d.fx = event.x;
        //     d.fy = event.y;
        // }
        
        // function dragended(event, d) {
        //     if (!event.active) simulation.alphaTarget(0);
        //     d.fx = null;
        //     d.fy = null;
        // }
        
        // return d3.drag()
        //     .on("start", dragstarted)
        //     .on("drag", dragged)
        //     .on("end", dragended);
        // }

        // const zoom = d3.zoom()
        //     .scaleExtent([0.2, 4])
        //     .filter(event => {
        //         if (event.type === "wheel") return event.ctrlKey
        //         return event.type === "mousedown" || event.type === "touchstart" || event.type === "pointerdown"
        //     })
        //     .on("zoom", (event) => {
        //         container.attr("transform", event.transform)
        //     })

        //     svg.call(zoom)
        //         .attr("width", dimensions.width)
        //         .attr("height", dimensions.height)
        //         .style("cursor", "grab")
        //         .on("mousedown.zoom", null)

            // return () => {
            //     simulation.stop()
            //     d3.select(svgReference.current).selectAll('*').remove()
            //     //svgReference.current = null
            //     //svg.on(".zoom", null)
            //     //d3.select(window).on("mouseup.zoom-cursor", null)
            // }
     }, [nodes, nodeLinks])

    return (
        <div className="relative flex flex-column items-center justify-center">
            <svg ref={svgReference} width={dimensions.width} height={dimensions.height}>
                <g className="chart-content"></g>
            </svg>
        </div> 
    )
 }