export async function fetchEpochs() {
    // Actual API call to backend
    const response = await fetch(`http://localhost:8000/api/snapshot/epochs`)
    if (!response.ok) {
        throw new Error(`${response.status} Failed to fetch all epochs`)
    }
    const data = await response.json()

    return data
}

export async function fetchCurrentEpoch(epoch_no) {
    // Actual API call to backend
    const response = await fetch(`http://localhost:8000/api/snapshot/epochs/${epoch_no}`)
    if (!response.ok) {
        throw new Error(`${response.status} Failed to fetch epoch data for epoch ${epoch_no}`)
    }
    const data = await response.json()

    return data
}