import poolMovementData from '../example-data/data-pool-movement-count.json'

export async function fetchPoolMovements(epoch_no) {
    // // Actual API call to backend
    // const response = await fetch(`http://localhost:8000/api/snapshot/pools/performance?epoch=${epoch_no}`)
    // if (!response.ok) {
    //     throw new Error(`${response.status} Failed to fetch pool performance data for epoch ${epoch_no}`)
    // }
    // const data = await response.json()

    // Example data
    const data = poolMovementData
    return data
}