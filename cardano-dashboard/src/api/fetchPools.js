export async function fetchPools() {
    const response = await fetch("https://cardano-mainnet.blockfrost.io/api/v0/pools/extended?count=10&page=1", {
        headers: {project_id:import.meta.env.VITE_BLOCKFROST_PROJECT_ID}
    })
    if (!response.ok) {
        throw new Error("Failed to fetch pool data")
    }

    return response.json()
}