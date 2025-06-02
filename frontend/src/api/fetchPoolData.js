export const fetchPoolData = async (address) => {
    const response = await fetch(`https://cardano-mainnet.blockfrost.io/api/v0/pools/${address}`, {
        headers: {project_id:import.meta.env.VITE_BLOCKFROST_PROJECT_ID}
    })
    if (!response.ok) {
        throw new Error("Failed to fetch pool data")
    }

    return response.json()
}