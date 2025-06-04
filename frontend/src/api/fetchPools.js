export async function fetchPools() {
    const response = await fetch("http://localhost:8000/api/pool-data")
    if (!response.ok) {
        throw new Error("Failed to fetch pool data")
    }

    return response.json()
}