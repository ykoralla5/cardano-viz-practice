import exampleData from '../data.json'

export async function fetchPools() {
    // Actual API call to backend
    /*const response = await fetch("http://localhost:8000/api/snapshot/delegators?epoch=559")
    if (!response.ok) {
        throw new Error(`${response.status} Failed to fetch pool data`)
    }
    const data = await response.json()*/

    // Example data
    const data = exampleData
    return data
}