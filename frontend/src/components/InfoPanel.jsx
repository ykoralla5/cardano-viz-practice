import { formatAda } from '../utils/dataTransformers';

export default function InfoPanel({ selectedElement }) {

    if (!selectedElement || selectedElement.length === 0) {
        return (
            <div className=""></div>
        )
    }

    if (selectedElement[0].type === "link") {
        const linkData = selectedElement[0].data
        return (
            <div className='w-[25vw] absolute top-[10vh] right-10 bg-white text-sm p-5 rounded-md wrap-anywhere'>
                <p><strong>Link Information</strong></p>
                <p>From Pool: {linkData.source.pool_id} ({linkData.source.pool_view})</p>
                <p>To Pool: {linkData.target.pool_id} ({linkData.target.pool_view})</p>
                <p>Movement Amount: {formatAda(linkData.movement_amount)}</p>
                <p>Movement Count: {linkData.movement_count}</p>
                <p>Stake change in source pool: <span className="text-red-500 font-medium">{linkData.source_stake_change_percent} %</span></p>
                <p>Stake change in destination: <span className="text-green-500 font-medium">{linkData.dest_stake_change_percent} %</span></p>
            </div>
        )  
    }
    else if (selectedElement[0].type === "pool") {
        const selectedBubble = selectedElement[0].data
        return (
            <div className='w-[25vw] absolute top-[10vh] right-10 bg-white text-sm p-5 rounded-md wrap-anywhere'>
                <p><strong>Pool Information</strong></p>
                <p>Pool id: {selectedBubble.pool_id}</p>
                <p>Pool view: {selectedBubble.pool_view}</p>
                <p>Pool Stake: {formatAda(selectedBubble.total_stake)}</p>
                <p># of delegators: {selectedBubble.delegator_count}</p>
                <p>Operator pledge: {formatAda(selectedBubble.pledge)}</p>
                <p>Saturation ratio: {Math.round(selectedBubble.saturation_ratio * 100) / 100}</p>
                <p>Actual / Expected # of blocks minted: {selectedBubble.actual_block_count} / {selectedBubble.expected_block_count}</p>
                <p>Performance: {selectedBubble.performance_ratio}</p>
                <p>Is active: {selectedBubble.is_active.toString()}</p>
            </div>
        )
    }
}