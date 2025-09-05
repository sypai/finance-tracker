// This helper function generates a large, realistic dataset.
function generateDenseData() {
    const accounts = [
        { id: 1, name: 'State Bank of India', type: 'Savings', startingBalance: 50000, createdAt: new Date(new Date().setFullYear(new Date().getFullYear() - 1)) },
        // { id: 2, name: 'HDFC Bank', type: 'Savings', startingBalance: 25000, createdAt: new Date(new Date().setFullYear(new Date().getFullYear() - 1)) },
        // { id: 3, name: 'ICICI Credit Card', type: 'Credit Card', startingBalance: 0, createdAt: new Date(new Date().setFullYear(new Date().getFullYear() - 1)) },
        // { id: 4, name: 'Axis Bank', type: 'Salary', startingBalance: 100000, createdAt: new Date(new Date().setFullYear(new Date().getFullYear() - 1)) },
        { id: 5, name: 'Kotak Bank', type: 'Savings', startingBalance: 75000, createdAt: new Date(new Date().setFullYear(new Date().getFullYear() - 1)) },
    ];

    const transactions = [];
    const expenseDescriptions = ['Groceries', 'Shopping', 'Swiggy', 'Uber', 'Rent', 'Utilities', 'Amazon', 'Netflix', 'Fuel', 'Dinner'];
    const incomeDescriptions = ['Salary', 'Freelance', 'Bonus'];
    
    // Generate transactions for the last 365 days
    for (let i = 0; i < 30; i++) {
        const date = new Date(new Date().setDate(new Date().getDate() - i));
        const numTransactions = Math.floor(Math.random() * 2) + 2; // 2 or 3 transactions per day

        for (let j = 0; j < numTransactions; j++) {
            const accountIndex = Math.floor(Math.random() * accounts.length);
            const accountId = accounts[accountIndex].id;
            let type, description, amount;
            
            // Occasionally generate an income transaction
            if (Math.random() > 0.95 || (date.getDate() >= 1 && date.getDate() <= 5 && Math.random() > 0.5)) {
                type = 'income';
                description = incomeDescriptions[Math.floor(Math.random() * incomeDescriptions.length)];
                amount = Math.floor(Math.random() * 40000) + 10000;
            } else {
                type = 'expense';
                description = expenseDescriptions[Math.floor(Math.random() * expenseDescriptions.length)];
                amount = Math.floor(Math.random() * 3000) + 50;
            }

            transactions.push({ id: Date.now() + i + j, accountId, description, type, amount, date });
        }
    }
    
    // Calculate final, accurate balances for each account
    accounts.forEach(account => {
        const totalChange = transactions
            .filter(t => t.accountId === account.id)
            .reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0);
        // Add a 'balance' property for the current balance
        account.balance = account.startingBalance + totalChange;
    });

    return { accounts, transactions };
}

// Generate the data
const { accounts, transactions } = generateDenseData();

// Export the final state object
export const appState = {
    accounts,
    transactions,
    investments: [],
    investmentAccounts: [
    {
        id: 1,
        name: 'Zerodha - Suyash Bajpai',
        type: 'Brokerage',
        holdings: [
            {
                type: 'equity',
                name: 'Reliance Industries',
                ticker: 'RELIANCE',
                quantity: 50,
                buyValue: 125000,
                currentValue: 142500
            },
            {
                type: 'equity',
                name: 'Tata Consultancy Services',
                ticker: 'TCS',
                quantity: 100,
                buyValue: 330000,
                currentValue: 385000
            },
            {
                type: 'mutual_fund',
                name: 'Parag Parikh Flexi Cap',
                quantity: 250,
                buyValue: 150000,
                currentValue: 185000
            },
            {
                type: 'gold',
                name: 'Sovereign Gold Bond',
                grams: 20,
                buyValue: 100000,
                currentValue: 124000
            }
        ]
    },
    {
        id: 2,
        name: 'EPFO',
        type: 'Retirement',
        holdings: [
            {
                type: 'epf',
                name: 'Employee Provident Fund',
                quantity: 1,
                buyValue: 400000,
                currentValue: 485000
            }
        ]
    },
    {
        id: 1,
        name: 'Morgan Stanley @ Work',
        type: 'ESOP',
        holdings: [
            {
                type: 'equity',
                name: 'IBM',
                ticker: 'IBM',
                quantity: 88,
                buyValue: 1700000,
                currentValue: 2500000
            }
        ]
    }
    ],
    // investmentAccounts: [],
    investmentGrowth: [],
    
    activeExpensePeriod: 'month',
    activeBalancePeriod: 'max',
    activePortfolioView: 'holdings',
};