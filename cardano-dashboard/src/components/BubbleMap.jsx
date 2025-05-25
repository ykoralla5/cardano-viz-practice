import CircularPacking from "./CirclePacking"

export default function BubbleMap(props) 
{
    if (props.width === 0) {
        return null;
    }
    return (
        <CircularPacking />
    )
}