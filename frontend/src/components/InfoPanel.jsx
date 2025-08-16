export default function InfoPanel({ selectedEpoch, selectedBubble, poolData }) {
    if (!selectedBubble) {
        return (
        <div className=""></div>
    )
    }
    return (
        <div className='absolute top-10-vh right-20 bg-white text-sm p-5 rounded-md'>
            <p>Pool {selectedBubble.name}</p>
            <p>Pool Stake: {selectedBubble.value}</p>
            <p>Saturation percent: {selectedBubble.saturation_percent}</p>
            <p>Actual / Expected number of blocks minted: {selectedBubble.actual_block_count} / {selectedBubble.expected_block_count}</p>
            <p>Performance: {selectedBubble.performance_ratio}</p>
        </div>
    )
}