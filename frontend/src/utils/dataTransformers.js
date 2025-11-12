/**
 * Format amount in lovelaces to ADA with thousands separator
 * @param {number} lovelace - Amount in lovelaces 
 * @returns {string} Formatted amount in ADA with thousands separator
 */
export function formatAda(lovelace) {
    var ada = lovelace / 1000000
    var parts = ada.toFixed(0).toString().split(".")
    var formattedAda = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ")
    
    return formattedAda
}

/**
 * Format amount in lovelaces to ADA with thousands separator
 * @param {number} lovelace - Amount in lovelaces 
 * @returns {string} Formatted amount in ADA with thousands separator
 */
export function formatNumber(number) {
    var parts = number.toFixed(0).toString().split(".")
    var formattedNum = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ")
    
    return formattedNum
}

/**
 * Format date in readable form
 * @param {number} isoString - Date timestamp 
 * @returns {string} Formatted date
 */
export function formatDate(isoString) {
    const date = new Date(isoString)

    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()

    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')

    return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`
}

/**
     * Convert Cardano slot number to a Date object
     * @param {number} slot - The slot number from block
     * @param {number} daysPerEpoch - Number of days per epoch (default: 5 for mainnet)
     * @param {number} slotDuration - Duration of each slot in seconds (default: 1 for Shelley era, 20 in Byron)
     * @param {Date|string|number} startTimestamp - UNIX timestamp of start of Shelley era (default: 1506203091 for mainnet)
     * @param {number} startSlot - Slot number of start of Shelley era (default: 4493600 for mainnet)
     * @returns {Date} Timestamp of the slot
*/
export function translateSlot(slot, daysPerEpoch = 5, slotDuration = 1, startTimestamp = 1596491091, startSlot = 4493600) {
    const epochDelay = 2 // Since we are showing active stake from 2 epochs ago
    const slotsPerEpoch = daysPerEpoch * 24 * 60 * 60 / slotDuration // 432000
    
    // Adjust startTimestamp to account for epoch delay
    startTimestamp += epochDelay * slotsPerEpoch * slotDuration

    // Validate input slot to ensure it's not before Shelley era
     if (slot < startSlot) {
        console.error(`Error: Slot ${slot} is before the Shelley era start slot (${startSlot}).`)
        console.log(slot, startSlot)
        // return null
    }

    const timestamp = startTimestamp + (slot - startSlot)
    const date = new Intl.DateTimeFormat('en-GB', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        // dateStyle: 'full',
        // timeStyle: 'long',
        // timeZone: 'UTC'
    }).format(new Date(timestamp * 1000)) // Convert to milliseconds

    return date
}