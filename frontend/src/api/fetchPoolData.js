export async function fetchPoolData(epoch_no) {
    // Actual API call to backend
    const response = await fetch(`http://localhost:8000/api/snapshot/epoch?epoch=${epoch_no}`)
    if (!response.ok) {
        throw new Error(`${response.status} Failed to fetch pool performance data for epoch ${epoch_no}`)
    }
    const data = await response.json()

    return data
}