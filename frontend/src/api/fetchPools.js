export async function fetchPools() {
    const response = await fetch("http://localhost:8000/api/snapshot/delegators?epoch=560")
    if (!response.ok) {
        throw new Error(`${response.status} Failed to fetch pool data`)
    }
    const data = await response.json()
    return data
}