// js/state.js

export const appState = {
    accounts: [
        { id: 1, name: 'State Bank of India', type: 'Savings Account', balance: 45320.00, history: [{date: '2025-01-01', balance: 42000}, {date: '2025-02-01', balance: 44500}, {date: '2025-03-01', balance: 45320}] },
        { id: 2, name: 'HDFC Bank', type: 'Savings Account', balance: 28150.00, history: [{date: '2025-01-01', balance: 25000}, {date: '2025-02-01', balance: 26000}, {date: '2025-03-01', balance: 28150}] },
        { id: 3, name: 'Axis Bank', type: 'Credit Card', balance: -9880.00, history: [{date: '2025-01-01', balance: -5000}, {date: '2025-02-01', balance: -8500}, {date: '2025-03-01', balance: -9880}] },
    ],
    investments: [
        { id: 1, name: 'Zerodha', type: 'Equity & Mutual Funds', value: 185240.00, change: 18.5, isPositive: true },
        { id: 2, name: 'Morgan Stanley', type: 'Managed Portfolio', value: 45680.00, change: 12.3, isPositive: true },
    ],
    transactions: [
        { id: 1, accountId: 1, description: 'Salary Deposit', type: 'income', amount: 75000, date: new Date(2025, 2, 25) },
        { id: 2, accountId: 2, description: 'Online Shopping', type: 'expense', amount: 2500, date: new Date(2025, 2, 24) },
        { id: 3, accountId: 3, description: 'Electricity Bill', type: 'expense', amount: 3120, date: new Date(2025, 2, 23) },
        { id: 4, accountId: 1, description: 'Groceries', type: 'expense', amount: 5000, date: new Date(2025, 2, 22) },
        { id: 5, accountId: 2, description: 'Freelance Payment', type: 'income', amount: 15000, date: new Date(2025, 1, 28) },
        { id: 6, accountId: 3, description: 'Dinner with friends', type: 'expense', amount: 1200, date: new Date(2025, 1, 20) },
    ],
    investmentGrowth: [
        { month: 'Jan', value: 200000 },
        { month: 'Feb', value: 210000 },
        { month: 'Mar', value: 215000 },
        { month: 'Apr', value: 225000 },
        { month: 'May', value: 230000 },
        { month: 'Jun', value: 240000 },
        { month: 'Jul', value: 145000 },
    ],
    expenseCategories: [
        { category: 'Food & Dining', amount: 8240, insight: 'You spent 15% more this month.' },
        { category: 'Transportation', amount: 4680, insight: 'This is your highest category for the week.' },
        { category: 'Utilities', amount: 3120, insight: 'No change from last month. Great job!' },
    ]
};