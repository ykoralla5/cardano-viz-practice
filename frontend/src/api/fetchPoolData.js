import poolPerfData from '../example-data/data-pool-performance.json'

export async function fetchPoolPerformanceData(epoch_no) {
    // // Actual API call to backend
    // const response = await fetch(`http://localhost:8000/api/snapshot/pools/performance?epoch=${epoch_no}`)
    // if (!response.ok) {
    //     throw new Error(`${response.status} Failed to fetch pool performance data for epoch ${epoch_no}`)
    // }
    // const data = await response.json()

    // Example data
    const data = poolPerfData
    return data
}