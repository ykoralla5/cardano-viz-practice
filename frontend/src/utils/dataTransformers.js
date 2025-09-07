// Format amount in lovelaces to ADA with specified decimal places
export function formatAda(amount, decimals) {
    return (amount / 1000000).toLocaleString('de-CH', { maximumFractionDigits: decimals }) + ' ADA'
}

