import * as d3 from 'd3'
import { Children, useEffect, useRef, useState, useMemo } from 'react'
import { CircleLoader } from 'react-spinners'

/* Generate bubble map */
export default function BubbleGraph ({ nodes, links, collapsedLinks, scales, dimensions, selectedElement, setSelectedElement, selectedElementData, setSelectedElementData })
 {
    // Scales
    // const radiusScale = scales.radiusScale
    const saturationScale = scales.saturationScale
    const linkTransparencyScale = scales.linkTransparencyScale
    const linkWidthScale = scales.linkWidthScale
    // const saturationPercentScale = scales.saturationPercentScale

    // Refs
    const svgReference = useRef(null)
    const bubblesRef = useRef(null)
    const linksRef = useRef(null)
    // const textRef = useRef(null)

    

    console.timeEnd('collapse links')

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
                .scaleExtent([0.1, 5]) // min/max zoom
                .on("zoom", (event) => {
                    g.attr("transform", event.transform)
                })
            )

        const linksLayer = g.append("g")

        console.time('add links')
        
        // Add links
        linksRef.current = linksLayer
            .selectAll("line")
            .data(collapsedLinks)
            .enter().append("line")
            .attr("marker-start", l => l.bidirectional ? "url(#arrowhead)": null) // only add arrowhead at start if bidirectional
            .attr("marker-end", "url(#arrowtail)")
            .attr("stroke-opacity", l => linkTransparencyScale(l.movement_amount)) 
            .on("mouseover", function(l) { d3.select(this).style("cursor", "pointer") })
            .on("click", (event, l) => {
                setSelectedElement({"type": "link", "id": {"source": l.source.pool_id, "target": l.target.pool_id}})
                setSelectedElementData({"data": null, "delegationData": null})
            })

        console.timeEnd('add links')

        console.time('add arrowheads')

        var defs = svg.append("defs")

        defs.append("svg:marker")
            .attr("id", "arrowhead") // Give it a unique ID to reference it later
            .attr("viewBox", "0 0 10 10") // Set the viewBox for the marker shape
            .attr("refX", 10) // Adjust this value (bubble radius + offset)
            .attr("refY", 5) // Center the marker vertically
            .attr("markerUnits", "strokeWidth")
            .attr("markerWidth", 5)
            .attr("markerHeight", 9)
            .attr("orient", "auto-start-reverse") // Ensure the arrowhead rotates to face the link's direction
            .append("svg:path")
            .attr("d", "M 0 0 L 10 5 L 0 10 z") // A simple triangle shape
            .attr("fill", "#BBBBBB") // Set the color of the arrowhead

        defs.append("svg:marker")
            .attr("id", "arrowtail") // Give it a unique ID to reference it later
            .attr("viewBox", "0 0 10 10") // Set the viewBox for the marker shape
            .attr("refX", 10) // Adjust this value (bubble radius + offset)
            .attr("refY", 5) // Center the marker vertically
            .attr("markerUnits", "strokeWidth")
            .attr("markerWidth", 5)
            .attr("markerHeight", 9)
            .attr("orient", "auto") // Ensure the arrowhead rotates to face the link's direction
            .append("svg:path")
            .attr("d", "M 0 0 L 10 5 L 0 10 z") // A simple triangle shape
            .attr("fill", "#BBBBBB") // Set the color of the arrowhead

        console.timeEnd('add arrowheads')

        console.time('add bubbles')

        const bubblesLayer = g.append("g")

        // Add nodes as bubbles
        const nodeGroups = bubblesLayer
            .selectAll(".bubbles-group")
            .data(nodes)
            .join("g")
            .attr("class", "bubbles-group")
            .on("click", (event, p) => {
                setSelectedElement({"type": "pool", "id": p.pool_id})
                setSelectedElementData({"data": null, "delegationData": null})
            })
            .on("mouseover", function(p) { d3.select(this).style("cursor", "pointer")})

        bubblesRef.current = nodeGroups
            
        nodeGroups.append("circle")
            .attr("fill", p => !p?.is_active && p?.delegator_count === 0 ? "gray" : saturationScale(p?.saturation_ratio))
                // d3.interpolateRdYlGn(saturationScale(p.saturation_percent))) // if pool's last delegators moved in previous epoch, fill red, other use saturationScale
            .attr("r", p => p?.radius)

        nodeGroups.append("text")
            .text(p => p?.ticker)
            .attr("text-anchor", "middle")
            .attr("dy", "0.3em")
            .attr("fill", "white")
            .style("font-size", "20px")
            .style("pointer-events", "none")

        console.timeEnd('add bubbles')
            
        // const textLayer = g.append("text")

        // textRef.current = textLayer
        //     .selectAll("text")
        //     .data(nodes)
        //     .jo

            // 3. Append the text label to the same group
        // bubblesRef.current.append("text")
        //     .attr("dy", "0.3em") // Vertically center the text
        //     .attr("text-anchor", "middle") // Horizontally center the text
        //     .text(d => d.ticker); // Use the text data for the label
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

        // const retiredPoolLabels = svg.selectAll("text")
        //     .data(nodes.filter(d => d.is_active === 'false'))
        //     .join("text")
        //     .text("RETIRED")
        //     .attr("font-size", "100px")
        //     .attr("text-anchor", "middle")
        //     .attr("dy", ".35em")
        //     .attr("pointer-events", "none")

        const simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink(collapsedLinks).id(p => p?.pool_id).distance(10)) // normalize
            .force("charge", d3.forceManyBody().strength(-10))
            .force("collision", d3.forceCollide().radius(p => p?.radius + 40).iterations(2)) // to prevent bubbles from overlapping
            .force("center", d3.forceCenter(dimensions.width / 2, dimensions.height / 2))
            .force("x", d3.forceX().strength(0.5).x(p => p?.pool_id === selectedElement?.id ? dimensions.width / 2 : p.x))
            .force("y", d3.forceY().strength(0.5).y(p => p?.pool_id === selectedElement?.id ? dimensions.height / 2 : p.y))
            .alphaDecay(0.1) // increase to reduce simulation time (keep between 0 and 1)

        let lastTick = 0
        let ticking = false

        console.time('simulation')
        simulation.on("tick", () => {

            // reduce update frequency to improve performance
            const now = performance.now()
            if (now - lastTick < 30) return // update ~33ms = 30fps
            lastTick = now

            const linksData = linksRef.current.data()
            linksData.forEach((d) => {
                const dx = d.target.x - d.source.x
                const dy = d.target.y - d.source.y
                const dist = Math.hypot(dx, dy) || 1
                const arrowLength = 0
                d.x1 = d.source.x + (dx / dist) * (d.source.radius + arrowLength)
                d.y1 = d.source.y + (dy / dist) * (d.source.radius + arrowLength)
                d.x2 = d.target.x - (dx / dist) * (d.target.radius + arrowLength)
                d.y2 = d.target.y - (dy / dist) * (d.target.radius + arrowLength)
            })

            if (!ticking) {
                ticking = true
                requestAnimationFrame(() => {
                    bubblesRef.current.attr("transform", d => `translate(${d.x}, ${d.y})`)

                    // Shorten links to not overlap with bubbles
                    linksRef.current
                        .attr("x1", d => d.x1)
                        .attr("y1", d => d.y1)
                        .attr("x2", d => d.x2)
                        .attr("y2", d => d.y2)
                    ticking = false
                })
            }

            
                    // {
                    // const dx = d.target.x - d.source.x
                    // const dy = d.target.y - d.source.y
                    // const dist = Math.hypot(dx, dy) || 1
                    // return d.target.x - (dx / dist) * d.target.radius
                    // })
                // .attr("y2", d => {
                //     const dx = d.target.x - d.source.x
                //     const dy = d.target.y - d.source.y
                //     const dist = Math.hypot(dx, dy) || 1
                //     return d.target.y - (dy / dist) * d.target.radius
                // })

            // retiredPoolLabels
            //     .attr("x", d => d.x)
            //     .attr("y", d => d.y)
        })

        simulation.on("end", () => {
            console.timeEnd('simulation')
        })

        return () => simulation.stop()
     }, [nodes, links])

    // Handling selected element styling
    useEffect(() => {
       console.time('update selection styles')
        if (bubblesRef.current) {
            bubblesRef.current
                .attr("stroke", p => selectedElement?.type === "pool" && selectedElement?.id === p.pool_id ? d3.color("#00ffcc") : !p.is_active ? "gray" : saturationScale(p.saturation_ratio))
                .attr("stroke-opacity", 0.3)
                .attr("stroke-width", p => selectedElement?.type === "pool" && selectedElement?.id === p.pool_id ? 5 : 2.5)
                .attr("fill-opacity", p => {
                    if (!selectedElement) return 0.95
                    // If a link is selected, highlight source and target pools, fade out others
                    if (selectedElement.type === "link" && selectedElementData?.data !== null) {
                        const { source, target } = selectedElement.id
                        return p.pool_id === source || p.pool_id === target ? 0.95 : 0.15
                    }
                    // If a pool is selected, highlight it and its connections, fade out others
                    else if (selectedElement.type === "pool" && selectedElementData?.delegationData !== null) {
                        return p.pool_id === selectedElement?.id || selectedElementData?.delegationData?.some(l => (l.source.pool_id === selectedElement?.id && l.target.pool_id === p.pool_id) || (l.target.pool_id === selectedElement?.id && l.source.pool_id === p.pool_id)) ? 0.95 : 0.15
                     }
                    return 1})
        }
        
        if (linksRef.current) {
            linksRef.current
                .style("stroke", d => "white")
                .attr("stroke-width", d => linkWidthScale(d.movement_amount))
                .attr("display", l => {
                    if (!selectedElement) return "block"
                    if (selectedElement?.type === "pool" && selectedElementData?.delegationData !== null) {
                        // Show only links connected to selected pool
                        return l.source.pool_id === selectedElement?.id || l.target.pool_id === selectedElement?.id ? "block" : "none"
                    }
                    if (selectedElement?.type === "link" && selectedElementData?.data !== null) {
                        const { source, target } = selectedElement.id
                        // Show only the selected link
                        return (source === l.source.pool_id && target === l.target.pool_id) ? "block" : "none"
                    }
                    return "block"
                })
        }
        console.timeEnd('update selection styles')

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
            const { source, target } = selectedElement.id
            const key = [source, target].sort().join('-')
            const linkMap = new Map(collapsedLinks.map(l => {
                const k = [l.source.pool_id, l.target.pool_id].sort().join('-')
                return [k, l]
            }))
            
            // const newLink = links.find(
            // l =>
            //     l.source_pool_id === selectedElementData?.data?.source_pool_id &&
            //     l.destination_pool_id === selectedElementData?.data?.destination_pool_id
            // )
            if (!linkMap.has(key)) {
                setSelectedElement(null)
            }
        }
    }, [nodes, links])

    return (
        <div className="relative flex flex-column items-center justify-center">
            <svg className="h-[91.5vh]" ref={svgReference} width={dimensions.width} height={dimensions.height}>
                <g className="chart-content"></g>
            </svg>
        </div> 
    )
 }