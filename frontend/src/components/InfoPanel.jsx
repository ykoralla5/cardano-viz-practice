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
                    <p className="text-lg font-bold text-gray-900 dark:text-white">Selected delegation</p>
                    <p>From Pool <span className="text-gray-900 dark:text-white">({data.source.pool_id}) {data.source.pool_view}</span> </p>
                    <p>To Pool <span className="text-gray-900 dark:text-white">({data.target.pool_id}) {data.target.pool_view}</span></p>
                    <p>Delegated Amount <span className="text-gray-900 dark:text-white">₳ {formatAda(data.movement_amount)}</span></p>
                    <p>Delegation Type <span className="text-gray-900 dark:text-white">{data.movement_type}</span></p>
                    <p>Stake change in source pool <span className="text-red-500 font-bold">-{data.source_stake_change_percent} %</span></p>
                    <p>Stake change in destination <span className="text-green-500 font-bold">{data.dest_stake_change_percent} %</span></p>
                </>
        else if (type === "pool")
            return <>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">Selected Pool</p>
                    <p className="text-tiny">Information shown here is for this epoch</p>
                    <p>Name <span className="text-gray-900 dark:text-white">{data.name} [{data.ticker}]</span></p>
                    <p>Homepage <a className="font-medium text-blue-600 dark:text-blue-500 hover:underline" href={data.homepage} target="_blank">{data.homepage}</a></p>
                    <p>Description <span className="text-gray-900 dark:text-white">{data.description}</span></p>
                    <p>ID <span className="text-gray-900 dark:text-white">({data.pool_id}) <span className="font-mono">{data.pool_view}</span></span></p>
                    <p>Stake <span className="text-gray-900 dark:text-white">₳ {!data.is_active && data.delegator_count === 0 ? formatAda(data.total_stake) + ' !Stake from previous epoch!' : formatAda(data.total_stake) } (#{data.rank})</span></p>
                    <p># Delegators <span className="text-gray-900 dark:text-white">{data.delegator_count}</span></p>
                    <p>Operator pledge <span className="text-gray-900 dark:text-white">₳ {formatAda(data.pledge)}</span></p>
                    <p>Saturation ratio <span className="text-gray-900 dark:text-white">{Math.round(data.saturation_ratio * 100) / 100}</span></p>
                    <p>Actual / Expected # of blocks minted <span className="text-gray-900 dark:text-white">{data.actual_blocks} / {Math.round(data.expected_blocks * 100) / 100}</span></p>
                    <p>Performance <span className={data.performance_ratio < 1 ? "text-red-500 font-bold" : "text-green-500 font-bold"}>{Math.round(data.performance_ratio * 100) / 100}</span></p>
                    <p>Pool active? <span className="text-gray-900 dark:text-white">{data.is_active.toString()}</span></p>
                </>
    }, [selectedElement])

    return (
        <div className="w-[30vw] absolute left-5 top-15 bg-white p-5 opacity-95 shadow-lg outline outline-black/5 dark:bg-slate-800 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10 text-sm rounded-md wrap-anywhere text-gray-400 dark:text-gray-400">
            <div className="flex justify-end">
                <button className="px-2 py-1 rounded-lg text-gray-900 dark:text-gray-200 bg-gray-200 dark: bg-gray-800 hover:bg-green-200 hover:text-black" onClick={handleCloseClick}>Close</button>
            </div>
            { elements }
        </div>
    )
}