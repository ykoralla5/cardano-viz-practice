import { BlockfrostAPI } from '@blockfrost/blockfrost-js'

const blockfrost = new BlockfrostAPI({
    projectId: import.meta.env.VITE_BLOCKFROST_PROJECT_ID,
})

export default blockfrost;