export function formatIndianCurrency(num) {
    const value = Math.abs(num);
    if (value >= 10000000) return `₹${(num / 10000000).toFixed(2)}Cr`;
    if (value >= 100000) return `₹${(num / 100000).toFixed(2)}L`;
    return `₹${num.toLocaleString('en-IN', {minimumFractionDigits: 0, maximumFractionDigits: 0})}`;
}