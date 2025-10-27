// src/js/utils/state.js

// This helper function generates a large, realistic dataset.
function generateDenseData() {
    const accounts = [
        { id: 1, name: 'State Bank of India', type: 'Savings', startingBalance: 50000, createdAt: new Date(new Date().setFullYear(new Date().getFullYear() - 2, new Date().getMonth(), 1)) },
        { id: 2, name: 'HDFC Bank', type: 'Savings', startingBalance: 25000, createdAt: new Date(new Date().setFullYear(new Date().getFullYear() - 2, new Date().getMonth(), 1)) },
        { id: 3, name: 'ICICI Credit Card', type: 'Credit Card', startingBalance: 0, createdAt: new Date(new Date().setFullYear(new Date().getFullYear() - 2, new Date().getMonth(), 1)) },
        { id: 4, name: 'Axis Bank', type: 'Salary', startingBalance: 100000, createdAt: new Date(new Date().setFullYear(new Date().getFullYear() - 2, new Date().getMonth(), 1)) },
        { id: 5, name: 'Kotak Bank', type: 'Savings', startingBalance: 75000, createdAt: new Date(new Date().setFullYear(new Date().getFullYear() - 2, new Date().getMonth(), 1)) },
    ];

    const transactions = [];
    const expenseDescriptions = ['Groceries', 'Shopping', 'Swiggy', 'Uber', 'Rent', 'Utilities', 'Amazon', 'Netflix', 'Fuel', 'Dinner', 'Movies', 'Coffee', 'Pharmacy', 'Travel'];
    const incomeDescriptions = ['Freelance', 'Bonus', 'Interest'];
    const salaryAccountId = 4; // Axis Bank designated for Salary

    // Generate transactions for the last 730 days (2 years)
    for (let i = 0; i < 730; i++) {
        const date = new Date(new Date().setDate(new Date().getDate() - i));
        if (date < accounts[0].createdAt) continue;

        const dayOfMonth = date.getDate();
        // *** CHANGE: Increase number of transactions per day ***
        const numTransactions = Math.floor(Math.random() * 5) + 4; // Now 4 to 8 transactions per day

        // --- Realistic Income ---
        if (dayOfMonth === 1) {
            transactions.push({ id: Date.now() + i + 10000, accountId: salaryAccountId, description: 'Salary', type: 'income', amount: Math.floor(Math.random() * 20000) + 50000, date });
        }
        if (Math.random() < 0.05) {
             const incomeDesc = incomeDescriptions[Math.floor(Math.random() * incomeDescriptions.length)];
             const incomeAccId = accounts[Math.floor(Math.random() * accounts.length)].id;
             transactions.push({ id: Date.now() + i + 20000, accountId: incomeAccId, description: incomeDesc, type: 'income', amount: Math.floor(Math.random() * 15000) + 1000, date });
        }

        // --- Regular Expenses ---
        for (let j = 0; j < numTransactions; j++) {
            const accountIndex = Math.floor(Math.random() * accounts.length);
            const accountId = accounts[accountIndex].id;
            const description = expenseDescriptions[Math.floor(Math.random() * expenseDescriptions.length)];
            const amount = Math.floor(Math.random() * (description === 'Rent' ? 15000 : 4000)) + 50;

            transactions.push({ id: Date.now() + i + j, accountId, description, type: 'expense', amount, date });
        }
    }
    
    // Calculate final balances (same logic)
    accounts.forEach(account => {
        const accountTransactions = transactions.filter(t => t.accountId === account.id);
        const firstTransactionDate = accountTransactions.length > 0 ? Math.min(...accountTransactions.map(t => new Date(t.date).getTime())) : new Date(account.createdAt).getTime();
        let runningBalance = account.startingBalance;
        transactions
            .filter(t => t.accountId === account.id && new Date(t.date).getTime() >= firstTransactionDate)
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .forEach(t => { runningBalance += (t.type === 'income' ? t.amount : -t.amount); });
        account.balance = runningBalance;
    });

    return { accounts, transactions };
}

// Generate the extensive data
const { accounts, transactions } = generateDenseData();

// Export the final state object (rest is unchanged)
export const appState = {
    accounts,
    transactions,
    investments: [],
    investmentAccounts: [
        { id: 1, name: 'Zerodha - Suyash Bajpai', type: 'Brokerage', provider: 'zerodha', holdings: [ { type: 'equity', name: 'Reliance Industries', ticker: 'RELIANCE', quantity: 50, buyValue: 125000, currentValue: 142500 }, { type: 'equity', name: 'Tata Consultancy Services', ticker: 'TCS', quantity: 100, buyValue: 330000, currentValue: 385000 }, { type: 'mutual_fund', name: 'Parag Parikh Flexi Cap', quantity: 250, buyValue: 150000, currentValue: 185000 }, { type: 'gold', name: 'Sovereign Gold Bond', grams: 20, buyValue: 100000, currentValue: 124000 } ] },
        { id: 2, name: 'EPFO', type: 'Retirement', holdings: [ { type: 'epf', name: 'Employee Provident Fund', quantity: 1, buyValue: 400000, currentValue: 485000 } ] },
        { id: 3, name: 'Morgan Stanley @ Work', type: 'ESOP', holdings: [ { type: 'equity', name: 'IBM', ticker: 'IBM', quantity: 88, buyValue: 1700000, currentValue: 2500000 } ] }
    ],
    investmentGrowth: [],
    activeExpensePeriod: 'month',
    activeBalancePeriod: 'max',
    activePortfolioView: 'holdings',
    activeYear: new Date().getFullYear().toString(),
    activeMonth: (new Date().getMonth() + 1).toString().padStart(2, '0'),
};