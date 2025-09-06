// // This helper function generates a large, realistic dataset.
// function generateDenseData() {
//     const accounts = [
//         { id: 1, name: 'State Bank of India', type: 'Savings', startingBalance: 50000, createdAt: new Date(new Date().setFullYear(new Date().getFullYear() - 1)) },
//         // { id: 2, name: 'HDFC Bank', type: 'Savings', startingBalance: 25000, createdAt: new Date(new Date().setFullYear(new Date().getFullYear() - 1)) },
//         // { id: 3, name: 'ICICI Credit Card', type: 'Credit Card', startingBalance: 0, createdAt: new Date(new Date().setFullYear(new Date().getFullYear() - 1)) },
//         // { id: 4, name: 'Axis Bank', type: 'Salary', startingBalance: 100000, createdAt: new Date(new Date().setFullYear(new Date().getFullYear() - 1)) },
//         { id: 5, name: 'Kotak Bank', type: 'Savings', startingBalance: 75000, createdAt: new Date(new Date().setFullYear(new Date().getFullYear() - 1)) },
//     ];

//     const transactions = [];
//     const expenseDescriptions = ['Groceries', 'Shopping', 'Swiggy', 'Uber', 'Rent', 'Utilities', 'Amazon', 'Netflix', 'Fuel', 'Dinner'];
//     const incomeDescriptions = ['Salary', 'Freelance', 'Bonus'];
    
//     // Generate transactions for the last 365 days
//     for (let i = 0; i < 30; i++) {
//         const date = new Date(new Date().setDate(new Date().getDate() - i));
//         const numTransactions = Math.floor(Math.random() * 2) + 2; // 2 or 3 transactions per day

//         for (let j = 0; j < numTransactions; j++) {
//             const accountIndex = Math.floor(Math.random() * accounts.length);
//             const accountId = accounts[accountIndex].id;
//             let type, description, amount;
            
//             // Occasionally generate an income transaction
//             if (Math.random() > 0.95 || (date.getDate() >= 1 && date.getDate() <= 5 && Math.random() > 0.5)) {
//                 type = 'income';
//                 description = incomeDescriptions[Math.floor(Math.random() * incomeDescriptions.length)];
//                 amount = Math.floor(Math.random() * 40000) + 10000;
//             } else {
//                 type = 'expense';
//                 description = expenseDescriptions[Math.floor(Math.random() * expenseDescriptions.length)];
//                 amount = Math.floor(Math.random() * 3000) + 50;
//             }

//             transactions.push({ id: Date.now() + i + j, accountId, description, type, amount, date });
//         }
//     }
    
//     // Calculate final, accurate balances for each account
//     accounts.forEach(account => {
//         const totalChange = transactions
//             .filter(t => t.accountId === account.id)
//             .reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0);
//         // Add a 'balance' property for the current balance
//         account.balance = account.startingBalance + totalChange;
//     });

//     return { accounts, transactions };
// }

// // Generate the data
// const { accounts, transactions } = generateDenseData();

// // Export the final state object
// export const appState = {
//     accounts,
//     transactions,
//     investments: [],
//     investmentAccounts: [
//     {
//         id: 1,
//         name: 'Zerodha - Suyash Bajpai',
//         type: 'Brokerage',
//         provider: 'zerodha',
//         holdings: [
//             {
//                 type: 'equity',
//                 name: 'Reliance Industries',
//                 ticker: 'RELIANCE',
//                 quantity: 50,
//                 buyValue: 125000,
//                 currentValue: 142500
//             },
//             {
//                 type: 'equity',
//                 name: 'Tata Consultancy Services',
//                 ticker: 'TCS',
//                 quantity: 100,
//                 buyValue: 330000,
//                 currentValue: 385000
//             },
//             {
//                 type: 'mutual_fund',
//                 name: 'Parag Parikh Flexi Cap',
//                 quantity: 250,
//                 buyValue: 150000,
//                 currentValue: 185000
//             },
//             {
//                 type: 'gold',
//                 name: 'Sovereign Gold Bond',
//                 grams: 20,
//                 buyValue: 100000,
//                 currentValue: 124000
//             }
//         ]
//     },
//     {
//         id: 2,
//         name: 'EPFO',
//         type: 'Retirement',
//         holdings: [
//             {
//                 type: 'epf',
//                 name: 'Employee Provident Fund',
//                 quantity: 1,
//                 buyValue: 400000,
//                 currentValue: 485000
//             }
//         ]
//     },
//     {
//         id: 1,
//         name: 'Morgan Stanley @ Work',
//         type: 'ESOP',
//         holdings: [
//             {
//                 type: 'equity',
//                 name: 'IBM',
//                 ticker: 'IBM',
//                 quantity: 88,
//                 buyValue: 1700000,
//                 currentValue: 2500000
//             }
//         ]
//     }
//     ],
//     // investmentAccounts: [],
//     investmentGrowth: [],
    
//     activeExpensePeriod: 'month',
//     activeBalancePeriod: 'max',
//     activePortfolioView: 'holdings',
// };

// /frontend/src/js/utils/state.js

// --- HELPER FUNCTION TO GENERATE REALISTIC LARGE-SCALE DATA ---
function generateLargeDataset() {
    const investmentAccounts = [
        { id: 1, name: 'Zerodha', provider: 'zerodha', type: 'Brokerage', holdings: [] },
        { id: 2, name: 'My EPF', provider: 'epf', type: 'Retirement', holdings: [
            { type: 'epf', name: 'Employee Provident Fund', quantity: 1, buyValue: 850000, currentValue: 985000, dayChange: 1200, dayChangePercent: 0.12 }
        ]},
        { id: 3, name: 'Morgan Stanley @ Work', provider: 'morgan_stanley', type: 'ESOP', holdings: [
            { type: 'equity', name: 'Company Stock (ESOP)', quantity: 500, buyValue: 2500000, currentValue: 3300000, dayChange: -15000, dayChangePercent: -0.45 }
        ]},
        { id: 4, name: 'Coinbase', provider: 'coinbase', type: 'Crypto', holdings: [] },
        { id: 5, name: 'Upstox', provider: 'upstox', type: 'Brokerage', holdings: [] }
    ];

    const stockData = [
        { name: 'Reliance Industries', type: 'equity' }, { name: 'Tata Consultancy Services', type: 'equity' },
        { name: 'HDFC Bank', type: 'equity' }, { name: 'Infosys', type: 'equity' },
        { name: 'ICICI Bank', type: 'equity' }, { name: 'Hindustan Unilever', type: 'equity' },
        { name: 'State Bank of India', type: 'equity' }, { name: 'Bajaj Finance', type: 'equity' },
        { name: 'Parag Parikh Flexi Cap', type: 'mutual_fund' }, { name: 'Quant Small Cap Fund', type: 'mutual_fund' },
        { name: 'Mirae Asset Large Cap', type: 'mutual_fund' }, { name: 'Sovereign Gold Bond', type: 'gold', unit: 'grams' },
        { name: 'Nippon India Gold ETF', type: 'gold', unit: 'units' },
    ];
    
    const cryptoData = [
        { name: 'Bitcoin', type: 'crypto' }, { name: 'Ethereum', type: 'crypto' }, { name: 'Solana', type: 'crypto' }
    ];

    // Populate Zerodha with lots of holdings
    stockData.forEach(stock => {
        const quantity = Math.floor(Math.random() * 200) + 10;
        const buyPrice = Math.floor(Math.random() * 3000) + 500;
        const priceChange = (Math.random() - 0.4) * 200; // Skewed towards positive
        const ltp = buyPrice + priceChange;
        
        investmentAccounts[0].holdings.push({
            type: stock.type, name: stock.name, quantity: quantity,
            buyValue: quantity * buyPrice,
            currentValue: quantity * ltp,
            dayChange: (Math.random() - 0.5) * (quantity * ltp) * 0.05,
            dayChangePercent: (Math.random() - 0.5) * 5
        });
    });

    // Populate Coinbase
    cryptoData.forEach(crypto => {
         const quantity = Math.random() * 5;
         const buyPrice = Math.floor(Math.random() * 50000) + 1000;
         const ltp = buyPrice * (1 + (Math.random() - 0.4));
         investmentAccounts[3].holdings.push({
             type: crypto.type, name: crypto.name, quantity: quantity,
             buyValue: quantity * buyPrice,
             currentValue: quantity * ltp,
             dayChange: (Math.random() - 0.5) * (quantity * ltp) * 0.1,
             dayChangePercent: (Math.random() - 0.5) * 10
         });
    });
    
    return investmentAccounts;
}

// The main state object for our application
export const appState = {
    accounts: [
        { id: 1, name: 'State Bank of India', type: 'Savings', balance: 50000, createdAt: new Date() },
        { id: 5, name: 'Kotak Bank', type: 'Savings', balance: 75000, createdAt: new Date() },
    ],
    transactions: [],
    investments: [],
    investmentAccounts: generateLargeDataset(),
    activeExpensePeriod: 'month',
    activeBalancePeriod: 'max',
};