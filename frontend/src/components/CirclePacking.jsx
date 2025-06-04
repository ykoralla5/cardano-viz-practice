import * as d3 from "d3"
import { useEffect, useRef, useState } from "react"
//import blockfrost from "../api/blockfrost"
import { fetchPools } from "../api/fetchPools"
import { fetchPoolData } from "../api/fetchPoolData"

export default function CircularPacking ({ totalStake })
 {
    const [poolData, setPoolData] = useState([])
    const svgReference = useRef()
    const currentTotalActiveStake = totalStake //22.09 billion ADA

    useEffect(() => {
        const fetchData = async () => {
            const basePools = await fetchPools()
            // For each pool, extract more pool information
            // const detailedData = await Promise.all(
            //     basePools.map(async (pool) => {
            //         const history = await fetchPoolData(pool.pool_id)
            //         return {
            //             ...pool,
            //             live_delegators: history?.live_delegators || 0,
            //             expected_blocks_minted: ((21600 * (1-0) * parseInt(history.active_stake))/(currentTotalActiveStake*1000000)) || 0 //active stake to be from previous epoch
            //         }
            //     })
            // )
            console.log(basePools)
            //setPoolData(detailedData)
            setPoolData(basePools)
        }
        fetchData()
    }, []);

    //console.log(poolData)

    useEffect(() => {

        if (poolData.length === 0) return

        console.log(poolData)

        const width = window.innerWidth //screen.width
        const height = window.innerHeight//screen.height

        const stakeData = poolData.map((obj) => parseInt(obj.active_stake))
        //console.log(typeof(parseFloat(d3.min(stakeData))), d3.max(stakeData))
        const stakeBlocksMinted = poolData.map((obj) => parseInt(obj.blocks_minted))
        //console.log(stakeBlocksMinted)
        const stakeActiveDelegators = poolData.map((obj) => parseInt(obj.live_delegators))
        //console.log(stakeActiveDelegators)
        const stakeSaturation = poolData.map((obj) => parseFloat(obj.live_saturation))
        //console.log(stakeSaturation)

        const svg = d3.select(svgReference.current)
            .attr('width', width)
            .attr('height', height)

        svg.selectAll('*').remove() // Remove any existing content

        const radiusScale = d3.scaleSqrt()
            .domain([d3.min(stakeData), d3.max(stakeData)])
            .range([5, 100])

        const xScale = d3.scaleLinear()
            .domain([0, d3.max(stakeBlocksMinted)]) // or blocks minted / expected?
            .range([100, width - 100])

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(stakeActiveDelegators)])
            .range([100, height - 100])

        const fillColor = d3.scaleLinear()
            .domain([0, d3.max(stakeSaturation)])
            .range(['yellow', 'red'])
            .unknown('#ccc')

        //strokecolor and stroke width scale?

        // Add bubbles
        svg.selectAll('circle')
            .data(poolData)
            .enter()
            .append('circle')
            .attr('cx', d => xScale(d.blocks_minted))
            .attr('cy', d => yScale(d.live_delegators))
            .attr('r', d => radiusScale(d.active_stake))
            .attr('fill', d => fillColor(d.live_saturation))
            .attr('stroke', 'white')
            .attr('stroke-width', 2)

        // Text for each bubble
        svg.selectAll('text')
            .data(poolData)
            .enter()
            .append('text')
            .text(d => `Name: ${d.metadata.name}, Stake: ${d.active_stake}, Blocks minted: ${d.blocks_minted}, \n
                Active delegators: ${d.live_delegators}, Saturation: ${d.live_saturation}`)
            .attr('x', d => xScale(d.blocks_minted))
            .attr('y', d =>  yScale(d.live_delegators) + radiusScale(d.active_stake)) // add radius and stroke width to display text below circle
            .attr('font-size', '15px')
            .attr('text-anchor', 'middle')
            .attr('alignment-baseline', 'before-edge')
            .attr('fill', '#fff')
            .style('pointer-events', 'none')
    }, [poolData])
        
        

        /* TODO:
            1. Nearing 1 saturation as red and above 1 as another color?
            2. Show linear grid for x and y
            3. Break text on new line
            4. Header, spacing of map (remove horizontal and vertical scroll bars), responsiveness
            5. Try with example JSON from actual node (check how to extract json from psql)
        */ 

        //const nodes = 
        

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

    return (
        <div className="bubble-map">
            {/* <p>{JSON.stringify(poolData)}</p> */}
            <svg ref={svgReference}></svg>
        </div>
    )
 }