import { formatAda } from '../utils/dataTransformers';

export default function InfoPanel({ selectedBubble, nodes }) {

    if (!selectedBubble) {
        return (
        <div className=""></div>
    )
    }
    return (
        <div className='absolute top-10-vh right-20 bg-white text-sm p-5 rounded-md'>
            <p>Pool id: {selectedBubble.pool_id}</p>
            <p>Pool view: {selectedBubble.pool_view}</p>
            <p>Pool Stake: {formatAda(selectedBubble.total_stake)}</p>
            <p># of delegators: {selectedBubble.delegator_count}</p>
            <p>Operator pledge: {formatAda(selectedBubble.pledge)}</p>
            <p>Saturation ratio: {Math.round(selectedBubble.saturation_ratio * 100) / 100}</p>
            <p>Actual / Expected number of blocks minted: {selectedBubble.actual_block_count} / {selectedBubble.expected_block_count}</p>
            <p>Performance: {selectedBubble.performance_ratio}</p>
            <p>Is active: {selectedBubble.is_active.toString()}</p>
        </div>
    )
}