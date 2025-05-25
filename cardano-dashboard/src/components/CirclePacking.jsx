import * as d3 from "d3"
import { useEffect, useRef, useState } from "react"
//import blockfrost from "../api/blockfrost"
import { fetchPools } from "../api/fetchPools"
import { fetchPoolData } from "../api/fetchPoolData"

export default function CircularPacking ({})
 {
    //const [allPools, setAllPools] = useState(null)
    const [poolData, setPoolData] = useState([])
    const svgReference = useRef()

    useEffect(() => {

        const fetchData = async () => {
            const basePools = await fetchPools()
            //console.log(basePools)
            const detailedData = await Promise.all(
                basePools.map(async (pool) => {
                    const history = await fetchPoolData(pool.pool_id)
                    const latestEpoch = history[history.length - 1]
                    console.log(history.live_delegators)
                    return {
                        ...pool,
                        live_delegators: latestEpoch?.live_delegators || 0
                    }
                })
            )
            //console.log(detailedData)
            setPoolData(detailedData)
        }
        fetchData()
    }, []);

    //console.log(poolData)

    useEffect(() => {

        if (poolData.length === 0) return;

        const width = screen.width
        const height = screen.height

        const stakeData = poolData.map((obj) => obj.active_stake)
        //console.log(stakeData)
        const stakeBlocksMinted = poolData.map((obj) => obj.blocks_minted)
        //console.log(stakeBlocksMinted)
        const stakeActiveDelegators = poolData.map((obj) => obj.live_delegators)
        //console.log(stakeActiveDelegators)
        const stakeSaturation = poolData.map((obj) => obj.live_saturation)
        //console.log(stakeSaturation)

        const svg = d3.select(svgReference.current)
            .attr('width', width)
            .attr('height', height);

        svg.selectAll('*').remove() // Remove any existing content

        const radiusScale = d3.scaleSqrt()
            .domain([d3.min(stakeData), d3.max(stakeData)])
            .range([5, 50])

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

        svg.selectAll('circle')
            .data(poolData)
            .enter()
            .append('circle')
            .attr('cx', d => xScale(d.blocks_minted))
            .attr('cy', d => yScale(d.delegators_count))
            .attr('r', d => radiusScale(d.active_stake))
            .attr('fill', d => color(d.saturation))

        //const labels = 
        svg.selectAll('text')
            .data(poolData)
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