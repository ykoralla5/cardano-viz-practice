import { useMemo, useState } from 'react'
import { formatAda } from '../utils/dataTransformers'

export default function InfoPanel({ selectedElement, setSelectedElement }) {

    const handleCloseClick = () => {
        setSelectedElement(null)
    }

    if (!selectedElement || selectedElement.length === 0) {
        return (
            <div className=""></div>
        )
    }

    const elements = useMemo(() => {
        const data = selectedElement.data
        const type = selectedElement.type
        if (type === "link")
            return <>
                        <p><strong>Link Information</strong></p>
                        <p>From Pool: {data.source.pool_id} ({data.source.pool_view})</p>
                        <p>To Pool: {data.target.pool_id} ({data.target.pool_view})</p>
                        <p>Movement Amount: {formatAda(data.movement_amount)}</p>
                        <p>Movement Count: {data.movement_count}</p>
                        <p>Stake change in source pool: <span className="text-red-500 font-medium">{data.source_stake_change_percent} %</span></p>
                        <p>Stake change in destination: <span className="text-green-500 font-medium">{data.dest_stake_change_percent} %</span></p>
                    </>
        else if (type === "pool")
            return <>
                    <p><strong>Pool Information</strong></p>
                    <p>Pool id: {data.pool_id}</p>
                    <p>Pool view: {data.pool_view}</p>
                    <p>Pool Stake: {formatAda(data.total_stake)}</p>
                    <p># of delegators: {data.delegator_count}</p>
                    <p>Operator pledge: {formatAda(data.pledge)}</p>
                    <p>Saturation ratio: {Math.round(data.saturation_ratio * 100) / 100}</p>
                    <p>Actual / Expected # of blocks minted: {data.actual_block_count}  {data.expected_block_count}</p>
                    <p>Performance: {data.performance_ratio}</p>
                    <p>Is active: {data.is_active.toString()}</p>
                </>
    }, [selectedElement])

    return (
        <div className="w-[25vw] absolute left-10 bg-white text-sm p-5 rounded-md wrap-anywhere">
        <button className="absolute right-10 text-white dark:text-black hover:text-green-300" onClick={handleCloseClick}>&#10006;</button>
            { elements }
        </div>
    )
}