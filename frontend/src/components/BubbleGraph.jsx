import * as d3 from 'd3'
import { Children, useEffect, useRef, useState, useMemo } from 'react'
import { CircleLoader } from 'react-spinners'

/* Generate bubble map */
export default function BubbleGraph ({ nodes, links, scales, dimensions, selectedElement, setSelectedElement, selectedElementData, setSelectedElementData })
 {
    // Scales
    const radiusScale = scales.radiusScale
    const saturationScale = scales.saturationScale
    const linkTransparencyScale = scales.linkTransparencyScale
    const linkWidthScale = scales.linkWidthScale
    const saturationPercentScale = scales.saturationPercentScale

    // Refs
    const svgReference = useRef(null)
    const bubblesRef = useRef(null)
    const linksRef = useRef(null)

    useEffect(() => {

        if (!nodes?.length || !links?.length) return

        // const movementAmounts = links.map(d => d.movement_amount)
        // const movementAmountMin = d3.min(movementAmounts)
        // const movementAmountMax = d3.max(movementAmounts)

        // const chargeScale = d3.scaleSqrt()
        //     .domain([movementAmountMin, movementAmountMax])
        //     .range([-100, 100])

        // Clear SVG before render
        d3.select(svgReference.current).selectAll('*').remove() // Clear previous svg renders
        
        const svg = d3.select(svgReference.current)

        const g = svg.append("g").attr("class", "chart-content").style("pointer", "move")

        svg.call(
            d3.zoom()
                .scaleExtent([0.25, 5]) // min/max zoom
                .on("zoom", (event) => {
                    g.attr("transform", event.transform)
                })
            )

        const linksLayer = g.append("g")
        
        // Add links
        linksRef.current = linksLayer
            .selectAll("line")
            .data(links)
            .enter().append("line")
            .attr("marker-end", "url(#arrowhead)")
            .attr("stroke-opacity", d => linkTransparencyScale(d.movement_amount)) 
            .on("mouseover", function(d) { d3.select(this).style("cursor", "pointer") })
            .on("click", (event, d) => {
                setSelectedElement({"type": "link", "id": d.tx_id})
                setSelectedElementData({"data": null, "delegationData": null})
            })

        var defs = svg.append("defs")

        defs.append("svg:marker")
            .attr("id", "arrowhead") // Give it a unique ID to reference it later
            .attr("viewBox", "0 0 10 10") // Set the viewBox for the marker shape
            .attr("refX", 10) // Adjust this value (bubble radius + offset)
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
        bubblesRef.current = bubblesLayer
            .selectAll("circle")
            .data(nodes)
            .join("circle")
            .attr("fill", d => !d.is_active && d.delegator_count === 0 ? "red" : d3.interpolateRdYlGn(saturationScale(d.saturation_ratio))) // if pool's last delegators moved in previous epoch, fill red, other use saturationScale
            .attr("r", d => radiusScale(d.total_stake))
            .on("click", (event, d) => {
                setSelectedElement({"type": "pool", "id": d.pool_id})
                setSelectedElementData({"data": null, "delegationData": null})
            })
            .on("mouseover", function(d) { d3.select(this).style("cursor", "pointer")})
            // .call(drag(simulation))
        //     .attr("stroke", d => 
        //         // d.is_active === 'false' ? "red" : "white"
        //         {
        //             if (selectedElement)
        //                 return d.pool_id === selectedElement?.data?.pool_id
        //                     ? "yellow"
        //                     : d.is_active === 'false'
        //                         ? "red"
        //                         : "white"
        //             else
        //                 return d.is_active === 'false' ? "red" : "white"
        //             //selectedElement && console.log(selectedElement.data)
        //         // else
        //         //     d.is_active === 'false' ? "red" : "white"
        //     }
        // )
        //     .attr("stroke-width", d => {
        //         if (selectedElement)
        //                 return d.pool_id === selectedElement?.data?.pool_id
        //                     ? "2"
        //                     : (d.is_active === 'false' && d.delegator_count === 0)
        //                         ? "4"
        //                         : "1"
        //             else
        //                 return d.is_active === 'false' ? "red" : "white"
        //         // (d.is_active === 'false' && d.delegator_count === 0) ? "4" : "1"
        //     })
            // .attr("r", d => radiusScale(d.total_stake))
            // .on("mouseover", function(event, d) {
            //     d3.select(this).style("cursor", "pointer")
            //     })
            // .on("click", function(event, d) {
            //     // remove class on existing bubbles with style
            //     connections.classed('selected', false)
            //     //bubbles.classed('selected', false)

            //     // add the selected class to the element that was clicked
            //     setSelectedElement({"type": "pool", "data": d})
            //     selectedElement && console.log(selectedElement.data)
            //     //d3.select(this).classed('selected', true)
            // })

        const retiredPoolLabels = svg.selectAll("text")
            .data(nodes.filter(d => d.is_active === 'false' && d.delegator_count !== 0))
            .join("text")
            .text("RETIRED")
            .attr("font-size", "100px")
            .attr("text-anchor", "middle")
            .attr("dy", ".35em")
            .attr("pointer-events", "none")

        const simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink(links).id(d => d.pool_id).distance(0)) // normalize
            .force("charge", d3.forceManyBody().strength(-50))
            .force("collision", d3.forceCollide().radius(d => radiusScale(d.total_stake) + 20).iterations(2)) // to prevent bubbles from overlapping
            .force("center", d3.forceCenter(dimensions.width / 2, dimensions.height / 2))
            .force("x", d3.forceX().strength(0.05))
            .force("y", d3.forceY().strength(0.05))
            .alphaDecay(0.1) // increase to reduce simulation time (keep between 0 and 1)

        bubblesRef.current.append("title").text(d => saturationPercentScale(d.saturation_ratio))

        simulation.on("tick", () => {

            bubblesRef.current
                .attr("cx", d => d.x)
                .attr("cy", d => d.y)
                
            // Shorten links to not overlap with bubbles
            linksRef.current
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => {
                    const dx = d.target.x - d.source.x
                    const dy = d.target.y - d.source.y
                    const dist = Math.hypot(dx, dy) || 1
                    return d.target.x - (dx / dist) * d.target.radius
                    })
                .attr("y2", d => {
                    const dx = d.target.x - d.source.x
                    const dy = d.target.y - d.source.y
                    const dist = Math.hypot(dx, dy) || 1
                    return d.target.y - (dy / dist) * d.target.radius
                })

            retiredPoolLabels
                .attr("x", d => d.x)
                .attr("y", d => d.y)
        })

        simulation.on("end", () => {
            console.log("Simulation ended")
        })

        return () => simulation.stop()
     }, [nodes, links])

    // Handling selected element styling
    useEffect(() => {
       
        if (bubblesRef.current) {
            bubblesRef.current
                .attr("stroke", p => selectedElement?.type === "pool" && selectedElement?.id === p.pool_id ? "cyan" : !p.is_active ? "red" : d3.interpolateRdYlGn(saturationScale(p.saturation_ratio)))
                .attr("stroke-opacity", 0.3)
                .attr("stroke-width", p => selectedElement?.type === "pool" && selectedElement?.id === p.pool_id ? 5 : 2.5)
                .attr("fill-opacity", p => {
                    if (!selectedElement || selectedElement.type == "link") return 0.95
                    // If a pool is selected, highlight it and its connections, fade out others
                    if (selectedElement.type === "pool" && selectedElementData?.delegationData !== null) {
                        return p.pool_id === selectedElement?.id || selectedElementData?.delegationData?.some(l => (l.source.pool_id === selectedElement?.id && l.target.pool_id === p.pool_id) || (l.target.pool_id === selectedElement?.id && l.source.pool_id === p.pool_id)) ? 0.95 : 0.15
                    }
                    return 1})
        }
        
        if (linksRef.current) {
            linksRef.current
                .style("stroke", d => selectedElement?.type === "link" && (selectedElementData?.data?.source?.pool_id === d.source.pool_id && selectedElementData?.data?.target?.pool_id === d.target.pool_id) ? "yellow" : "white")
                .attr("stroke-width", d => selectedElement?.type === "link" && (selectedElementData?.data?.source?.pool_id === d.source.pool_id && selectedElementData?.data?.target?.pool_id === d.target.pool_id) ? linkWidthScale(d.movement_amount) + 1 : linkWidthScale(d.movement_amount))
                .attr("display", l => {
                    if (!selectedElement) return "block"
                    if (selectedElement?.type === "pool" && selectedElementData?.delegationData !== null) {
                        // Show only links connected to selected pool
                        return l.source.pool_id === selectedElement?.id || l.target.pool_id === selectedElement?.id ? "block" : "none"
                    }
                    if (selectedElement?.type === "link" && selectedElementData?.data !== null) {
                        // Show only the selected link
                        return (selectedElementData?.data.source.pool_id === l.source.pool_id && selectedElementData?.data.target.pool_id === l.target.pool_id) ? "block" : "none"
                    }
                    return "block"
                })
        }

    }, [selectedElementData, nodes, links]) // nodes and links needed for intial render. selectedElementData instead of selectedElement so that it runs only when data is set

    // Update selected element on epoch change. Get id of selected element, look again for data and set selected element
    useEffect(() => {
        if (!selectedElement) return

        if (selectedElement.type === "pool") {
            const newNode = nodes.find(p => p.pool_id === selectedElement?.id)
            if (newNode) {
                setSelectedElement({ "type": "pool", "id": newNode.pool_id
                    // , "delegatonData": linksRef.current.data().filter(l => l.source.pool_id === newNode.pool_id || l.target.pool_id === newNode.pool_id)
                    })
            } else {
                setSelectedElement(null)
            }
        }

        if (selectedElement.type === "link") {
            const newLink = links.find(
            l =>
                l.source_pool_id === selectedElementData?.data?.source_pool_id &&
                l.destination_pool_id === selectedElementData?.data?.destination_pool_id
            )
            if (newLink) {
                setSelectedElement({ type: "link", id: newLink.tx_id })
            } else {
                setSelectedElement(null)
            }
        }
    }, [nodes, links])

    return (
        <div className="relative flex flex-column items-center justify-center">
            <svg className="h-[90vh]" ref={svgReference} width={dimensions.width} height={dimensions.height}>
                <g className="chart-content"></g>
            </svg>
        </div> 
    )
 }