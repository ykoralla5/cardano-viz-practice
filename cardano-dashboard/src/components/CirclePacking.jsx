import * as d3 from "d3"
import { useEffect, useRef } from "react"

export default function CircularPacking ({ width, height, data})
 {
    const svgReference = useRef()

    useEffect(() => {
        const width = screen.width
        const height = screen.height

        const stakeData = data.map((obj) => obj.stake)
        const stakeBlocksMinted = data.map((obj) => obj.blocksMinted)
        const stakeActiveDelegators = data.map((obj) => obj.activeDelegators)
        const stakeSaturation = data.map((obj) => obj.saturation)

        const svg = d3.select(svgReference.current)
            .attr('width', width)
            .attr('height', height);

        svg.selectAll('*').remove() // Remove any existing content

        const radiusScale = d3.scaleSqrt()
            .domain([d3.min(stakeData), d3.max(stakeData)])
            .range([10, 50])

        const xScale = d3.scaleLinear()
            .domain([0, d3.max(stakeBlocksMinted)])
            .range([100, width - 100])

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(stakeActiveDelegators)])
            .range([100, height - 100])

        const color = d3.scaleLinear()
            .domain([0, d3.max(stakeSaturation)])
            .range(["yellow", "red"])
            .unknown("#ccc")

        /* TODO:
            1. Nearing 1 saturation as red and above 1 as another color?
            2. Show linear grid for x and y
            3. Break text on new line
            4. Header, spacing of map (remove horizontal and vertical scroll bars), responsiveness
            5. Try with example JSON from actual node (check how to extract json from psql)
        */ 

        //const nodes = 
        svg.selectAll('circle')
            .data(data)
            .enter()
            .append('circle')
            .attr('cx', d => xScale(d.blocksMinted))
            .attr('cy', d => yScale(d.activeDelegators))
            .attr('r', d => radiusScale(d.stake))
            .attr('fill', d => color(d.saturation))

        //const labels = 
        svg.selectAll('text')
            .data(data)
            .enter()
            .append('text')
            .text(d => `Name: ${d.name}, Stake: ${d.stake}, Blocks minted: ${d.blocksMinted}, \n
                Active delegators: ${d.activeDelegators}, Saturation: ${d.saturation}`)
            .attr('x', d => xScale(d.blocksMinted))
            .attr('y', d => radiusScale(d.stake) + yScale(d.activeDelegators)) // add radius to display text below circle
            .attr('font-size', '15px')
            .attr('text-anchor', 'middle')
            .attr('alignment-baseline', 'before-edge')
            .attr('fill', '#fff')
            .style('pointer-events', 'none')

        // d3.forceSimulation(data)
        //     .force('center', d3.forceCenter(width / 2, height / 2))
        //     .force('charge', d3.forceManyBody().strength(10))
        //     .force('collision', d3.forceCollide().radius(d => radiusScale(d.active_stake) + 4))
        //     .on('tick', () => {
        //         nodes
        //             .attr('cx', d => d.x)
        //             .attr('cy', d => d.y);

        //         labels
        //             .attr('x', d => d.x)
        //             .attr('y', d => d.y + 4); // vertically center text in circle
        //     });
        }, []);

    return (
        <div className="bubble-map">
            <svg ref={svgReference}></svg>
        </div>
    )
 }