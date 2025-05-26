import CircularPacking from "./CirclePacking"

export default function BubbleMap({ totalStake }) 
{
    // if (props.width === 0) {
    //     return null;
    // }
    return (
        <CircularPacking totalStake={totalStake}/>
    )
}