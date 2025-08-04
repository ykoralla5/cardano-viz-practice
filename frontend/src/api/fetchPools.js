import exampleData from '../example-data/data.json'

export async function fetchPools(epoch_no, stake_threshold) {
    // Actual API call to backend
    /*const response = await fetch(`http://localhost:8000/api/snapshot/delegators?epoch=${epoch_no}&stake_threshold=${stake_threshold}`)
    if (!response.ok) {
        throw new Error(`${response.status} Failed to fetch pool data`)
    }
    const data = await response.json()*/

    // Example data
    const data = exampleData
    return data
}