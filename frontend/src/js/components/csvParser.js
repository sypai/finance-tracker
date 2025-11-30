// src/js/utils/csvParser.js

export function parseCSV(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim() !== '');
    const transactions = [];

    // Skip header if detected
    let startIndex = 0;
    if (lines[0].toLowerCase().includes('date') || lines[0].toLowerCase().includes('amount')) {
        startIndex = 1;
    }

    for (let i = startIndex; i < lines.length; i++) {
        // Basic split (Note: use | for tags to avoid comma conflicts in simple CSVs)
        const cols = lines[i].split(',').map(c => c.trim());
        
        // Minimum 3 cols required (Date, Desc, Amount). 
        // Extended: Col 3=Type, Col 4=Category, Col 5=Tags
        if (cols.length >= 3) {
            const rawDate = cols[0];
            const description = cols[1];
            const amountStr = cols[2];
            const typeStr = cols[3] ? cols[3].toLowerCase() : null;
            const categoryStr = cols[4] ? cols[4].trim() : null;
            const tagsStr = cols[5] ? cols[5].trim() : null;

            // 1. Parse Amount
            let amount = parseFloat(amountStr);
            if (isNaN(amount)) continue;

            // 2. Parse Type
            let type = 'expense';
            if (typeStr) {
                if (typeStr.includes('income') || typeStr.includes('credit')) type = 'income';
            } else {
                if (amount > 0) type = 'income';
                else {
                    type = 'expense';
                    amount = Math.abs(amount);
                }
            }

            // 3. Parse Date
            const date = new Date(rawDate);
            const dateISO = isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();

            transactions.push({
                date: dateISO,
                description: description.replace(/"/g, ''),
                amount: Math.abs(amount),
                type: type,
                rawCategory: categoryStr, // Pass raw strings to app.js for ID lookup
                rawTags: tagsStr
            });
        }
    }
    return transactions;
}