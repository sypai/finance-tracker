// src/js/utils/state.js

// --- 1. PREDEFINED DATA (CATEGORIES, TAGS) ---
function getRandomTagColor() {
    const colors = ['#F0857D', '#5BB974', '#1D4ED8', '#A78BFA', '#FBBF24', '#FB7185'];
    return colors[Math.floor(Math.random() * colors.length)];
}
const PREDEFINED_TAGS = [
    { id: 'tag-1', name: 'Singapore Trip', color: getRandomTagColor() },
    { id: 'tag-2', name: 'Office Commute', color: getRandomTagColor() },
    { id: 'tag-3', name: 'Freelance Project', color: getRandomTagColor() },
    { id: 'tag-salary', name: 'Salary', color: getRandomTagColor() },
    { id: 'tag-emi', name: 'EMI', color: getRandomTagColor() },
    { id: 'tag-vacation', name: 'Vacation', color: getRandomTagColor() },
    { id: 'tag-foodie', name: 'Foodie', color: getRandomTagColor() },
    { id: 'tag-bonus', name: 'Bonus', color: getRandomTagColor() }
];
const PREDEFINED_CATEGORIES = [
    { id: 'cat-uncategorized', name: 'Uncategorized', iconId: '#icon-default' },
    { id: 'cat-income', name: 'Income', iconId: '#icon-income' },
    { id: 'cat-food', name: 'Food & Dining', iconId: '#icon-food' },
    { id: 'cat-shopping', name: 'Shopping', iconId: '#icon-shopping' },
    { id: 'cat-groceries', name: 'Groceries', iconId: '#icon-groceries' },
    { id: 'cat-transport', name: 'Transport', iconId: '#icon-transport' },
    { id: 'cat-bills', name: 'Bills & Utilities', iconId: '#icon-bills' },
    { id: 'cat-home', name: 'Home & Rent', iconId: '#icon-home' },
    { id: 'cat-fuel', name: 'Fuel', iconId: '#icon-fuel' },
    { id: 'cat-health', name: 'Health & Wellness', iconId: '#icon-health' },
    { id: 'cat-entertainment', name: 'Entertainment', iconId: '#icon-entertainment' },
    { id: 'cat-personal-care', name: 'Personal Care', iconId: '#icon-personal-care' },
    { id: 'cat-education', name: 'Education', iconId: '#icon-education' },
    { id: 'cat-gifts', name: 'Gifts', iconId: '#icon-gifts' },
    { id: 'cat-subscriptions', name: 'Subscriptions', iconId: '#icon-subscriptions' },
    { id: 'cat-investments', name: 'Investments', iconId: '#icon-investment' }
];

/**
 * CORE LOGIC: The Anchor Strategy
 * Adds a transaction and smartly updates balance based on the date.
 * * Logic:
 * 1. If Date >= Account Creation Date: Update Current Balance (Live Mode).
 * 2. If Date < Account Creation Date: Do NOT update Current Balance (History Mode).
 */
// src/js/utils/state.js
export function addTransactionToState(transaction) {
    // 1. Add to the main list
    appState.transactions.unshift(transaction);

    // 2. Handle Balance Impact
    const account = appState.accounts.find(acc => acc.id === transaction.accountId);
    
    if (!account) return; 

    // Parse Dates
    const txnDate = new Date(transaction.date);
    
    // SAFETY FIX: If createdAt is missing or invalid, default to 1970 (always update balance)
    let accountCreatedDate = new Date(0); 
    if (account.createdAt) {
        const parsed = new Date(account.createdAt);
        if (!isNaN(parsed.getTime())) {
            accountCreatedDate = parsed;
        }
    }
    
    // Normalize to Midnight to avoid time-of-day bugs
    txnDate.setHours(0,0,0,0);
    accountCreatedDate.setHours(0,0,0,0);

    // THE ANCHOR CHECK
    // Update balance if transaction is NEWER than account creation
    if (txnDate >= accountCreatedDate) {
        if (transaction.type === 'income') {
            account.balance += transaction.amount;
        } else {
            account.balance -= transaction.amount;
        }
    } else {
        console.log(`Back-dated transaction. Balance for ${account.name} remains unchanged.`);
    }
    
    // 3. PERSISTENCE (Auto-save immediately)
    try {
        localStorage.setItem('arthaAppState', JSON.stringify(appState));
    } catch (e) {
        console.error("Auto-save failed:", e);
    }
}

// --- 2. TRANSACTION DATA GENERATOR ---
function generateDenseData(masterTags) {
    const today = new Date(2025, 10, 2); // Nov 2, 2025
    const startDate = new Date(2023, 10, 2); // 2 years ago
    
    const accounts = [
        { id: 1, name: 'HDFC Bank', type: 'Savings', number: '1234', startingBalance: 300000, createdAt: new Date(2023, 0, 1) },
        { id: 2, name: 'Kotak Bank', type: 'Salary', number: '0987', startingBalance: 50000, createdAt: new Date(2023, 0, 1) },
        { id: 3, name: 'ICICI Credit Card', type: 'Credit Card', number: '4444', startingBalance: 0, createdAt: new Date(2023, 6, 1) },
        { id: 4, name: 'Cash', type: 'Cash', number: null, startingBalance: 10000, createdAt: new Date(2023, 0, 1) },
        { id: 5, name: 'Personal Loan', type: 'Loan', number: 'L0001234', startingBalance: -200000, createdAt: new Date(2024, 0, 1) },
    ];

    const transactions = [];
     const expenseDescriptions = [
        { desc: 'Swiggy', cat: 'cat-food' },
        { desc: 'Zomato', cat: 'cat-food' },
        { desc: 'Restaurant Dinner', cat: 'cat-food' },
        { desc: 'Starbucks Coffee', cat: 'cat-food' },
        { desc: 'Amazon Shopping', cat: 'cat-shopping' },
        { desc: 'Myntra Clothes', cat: 'cat-shopping' },
        { desc: 'BigBasket Groceries', cat: 'cat-groceries' },
        { desc: 'Uber Ride', cat: 'cat-transport' },
        { desc: 'Electricity Bill', cat: 'cat-bills' },
        { desc: 'Netflix Subscription', cat: 'cat-subscriptions' },
        { desc: 'Phone Bill', cat: 'cat-bills' },
        { desc: 'Apollo Pharmacy', cat: 'cat-health' },
        { desc: 'PVR Movies', cat: 'cat-entertainment' }
    ];

    const salaryAccountId = 2; // Kotak
    const savingsAccountId = 1; // HDFC
    const ccAccountId = 3; // ICICI CC
    const cashAccountId = 4; // Cash
    const loanAccountId = 5; // Personal Loan
    
    const days = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    for (let i = 0; i <= days; i++) {
        const date = new Date(startDate.getTime() + (i * 24 * 60 * 60 * 1000));
        const dayOfMonth = date.getDate();
        const month = date.getMonth(); // 0-11
        
        // --- Regular Monthly Transactions ---
        if (dayOfMonth === 1) {
            transactions.push({ id: Date.now() + i + 10000, accountId: salaryAccountId, description: 'Monthly Salary', type: 'income', amount: 120000, date, categoryId: 'cat-income', tagIds: ['tag-salary'] });
        }
        if (dayOfMonth === 3) {
             transactions.push({ id: Date.now() + i + 30000, accountId: salaryAccountId, description: 'Monthly Rent', type: 'expense', amount: 25000, date, categoryId: 'cat-home', tagIds: [] });
        }
        if (dayOfMonth === 5 && date >= new Date(2024, 0, 1)) {
            transactions.push({ id: Date.now() + i + 20000, accountId: salaryAccountId, description: 'Personal Loan EMI', type: 'expense', amount: 10000, date, categoryId: 'cat-bills', tagIds: ['tag-emi'] });
            transactions.push({ id: Date.now() + i + 20001, accountId: loanAccountId, description: 'Loan Principal Payment', type: 'income', amount: 8000, date, categoryId: 'cat-bills', tagIds: ['tag-emi'] });
        }
        if (dayOfMonth === 10) {
            transactions.push({ id: Date.now() + i + 50000, accountId: savingsAccountId, description: 'Mutual Fund SIP', type: 'expense', amount: 15000, date, categoryId: 'cat-investments', tagIds: [] });
        }
        if (dayOfMonth === 15 && date > new Date(2023, 6, 1)) {
            let ccBalance = 0;
            transactions.filter(t => t.accountId === ccAccountId && new Date(t.date) < date)
                        .forEach(t => { ccBalance += (t.type === 'income' ? -t.amount : t.amount) });
            
            if (ccBalance > 100) { 
                const payment = Math.min(ccBalance, 30000) + Math.random() * 5000; 
                transactions.push({ id: Date.now() + i + 40000, accountId: savingsAccountId, description: 'Credit Card Bill', type: 'expense', amount: payment, date, categoryId: 'cat-bills', tagIds: [] });
                transactions.push({ id: Date.now() + i + 40001, accountId: ccAccountId, description: 'Credit Card Payment', type: 'income', amount: payment, date, categoryId: 'cat-bills', tagIds: [] });
            }
        }

        // --- Irregular "Fluctuation" Events ---
        if (dayOfMonth === 1 && month === 2) { // March 1st
             transactions.push({ id: Date.now() + i + 60000, accountId: savingsAccountId, description: 'Annual Bonus', type: 'income', amount: 250000, date, categoryId: 'cat-income', tagIds: ['tag-bonus'] });
        }
        if (dayOfMonth === 20 && (month === 4 || month === 7 || month === 10)) { // Apr, Aug, Nov
             transactions.push({ id: Date.now() + i + 70000, accountId: savingsAccountId, description: 'Freelance Project Payment', type: 'income', amount: 45000, date, categoryId: 'cat-income', tagIds: ['tag-3'] });
        }
        if (dayOfMonth === 1 && month === 10) { // Nov 1st
            transactions.push({ id: Date.now() + i + 80000, accountId: ccAccountId, description: 'Goa Vacation Booking', type: 'expense', amount: 75000, date, categoryId: 'cat-transport', tagIds: ['tag-vacation', 'tag-goa-24'] });
        }
         if (dayOfMonth === 15 && month === 8) { // Sep 15th
            transactions.push({ id: Date.now() + i + 90000, accountId: ccAccountId, description: 'New iPhone Purchase', type: 'expense', amount: 110000, date, categoryId: 'cat-shopping', tagIds: ['tag-personal'] });
        }

        // --- Random Daily Transactions ---
        const numTransactions = Math.floor(Math.random() * 2); // 0-1 per day
        for (let j = 0; j < numTransactions; j++) {
            const item = expenseDescriptions[Math.floor(Math.random() * expenseDescriptions.length)];
            const amount = Math.floor(Math.random() * 2500) + 50; 

            let accountId = [savingsAccountId, salaryAccountId, ccAccountId][Math.floor(Math.random() * 3)];
            if (item.cat === 'cat-food' && amount < 300) {
                accountId = cashAccountId;
            }
            if (item.cat === 'cat-shopping') {
                accountId = ccAccountId;
            }

            transactions.push({ 
                id: Date.now() + i + j, 
                accountId, 
                date: date.toISOString(), // Ensure date is stringified right away
                description: item.desc, 
                type: 'expense', 
                amount, 
                categoryId: item.cat,
                tagIds: []
            });
        }
    }
    
    // --- Calculate Final Balances ---
    accounts.forEach(account => {
        let runningBalance = account.startingBalance;
        transactions
            .filter(t => t.accountId === account.id)
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .forEach(t => {
                runningBalance += (t.type === 'income' ? t.amount : -t.amount);
            });
        account.balance = runningBalance;
    });

    return { accounts, transactions };
}


// --- 3. PREDEFINED INVESTMENT DATA ---
const PREDEFINED_INVESTMENTS = [
    {
        id: 101, name: 'Zerodha', type: 'brokerage',
        holdings: [
            { type: 'equity', name: 'Reliance Industries', ticker: 'RELIANCE', quantity: 50, buyValue: 125000, currentValue: 185000 },
            { type: 'equity', name: 'Tata Motors', ticker: 'TATAMOTORS', quantity: 100, buyValue: 45000, currentValue: 92000 },
            { type: 'mutual_fund', name: 'Parag Parikh Flexi Cap', ticker: 'PARAGFLEXI', quantity: 250, buyValue: 150000, currentValue: 210000 },
            { type: 'bond', name: 'SGBSEP31II-GB', ticker: null, quantity: 20, buyValue: 100000, currentValue: 135000 }
        ]
    },
    {
        id: 102, name: 'Groww', type: 'brokerage',
        holdings: [
            { type: 'mutual_fund', name: 'Quant Small Cap Fund', ticker: 'QUANTSC', quantity: 1000, buyValue: 180000, currentValue: 265000 },
            { type: 'mutual_fund', name: 'Mirae Asset ELSS Tax Saver', ticker: 'MIRAEELSS', quantity: 500, buyValue: 75000, currentValue: 105000 }
        ]
    },
    { id: 201, name: 'EPFO', type: 'employee_benefit',
        holdings: [
            { type: 'epf', name: 'EPF', quantity: 1, buyValue: 400000, currentValue: 520000, meta: { monthlyContribution: 5000 } }
        ]
    },
    {
        id: 202, name: 'Morgan Stanley (RSU)', type: 'employee_benefit',
        holdings: [
            { type: 'rsu', name: 'Alphabet Inc. (GOOGL)', ticker: 'GOOGL', quantity: 488, buyValue: 88 * 140, currentValue: 88 * 210, meta: { vestedUnits: 88, unvestedUnits: 400, grantPrice: 140, marketPrice: 210, nextVestingDate: '2026-03-15' } }
        ]
    },
    {
        id: 301, name: 'HDFC Bank FD', type: 'fixed_income',
        holdings: [
            { type: 'fd', name: 'Fixed Deposit', quantity: 1, buyValue: 200000, currentValue: 214500, meta: { rate: 7.2, investmentDate: '2024-10-31', maturityDate: '2025-10-31' } }
        ]
    },
    {
        id: 302, name: 'Cred Mint', type: 'fixed_income',
        holdings: [
            { type: 'p2p', name: 'P2P Investment', quantity: 1, buyValue: 50000, currentValue: 54500, meta: { rate: 9.0, investmentDate: '2024-01-01', maturityDate: '2025-01-01' } }
        ]
    },
    {
        id: 401, name: 'WazirX', type: 'other_asset',
        holdings: [
            { type: 'crypto', name: 'Bitcoin', ticker: 'BTC', quantity: 0.05, buyValue: 150000, currentValue: 350000 },
            { type: 'crypto', name: 'Ethereum', ticker: 'ETH', quantity: 1, buyValue: 200000, currentValue: 310000 }
        ]
    },
    {
        id: 402, name: 'Digital Gold', type: 'other_asset',
        holdings: [
            { type: 'gold', name: 'Digital Gold', ticker: null, quantity: 10, buyValue: 50000, currentValue: 72000 } // quantity is in grams
        ]
    }
];


// --- 4. PORTFOLIO HISTORY GENERATOR ---
function generatePortfolioHistory() {
    const history = [];
    const today = new Date(2025, 10, 2); // Nov 2, 2025
    const startDate = new Date(2023, 10, 2); // 2 years ago
    const days = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    // Get the total "buyValue" from all holdings
    const totalBuyValue = PREDEFINED_INVESTMENTS.flatMap(acc => acc.holdings).reduce((sum, h) => sum + h.buyValue, 0);
    // Get the total "currentValue"
    const totalCurrentValue = PREDEFINED_INVESTMENTS.flatMap(acc => acc.holdings).reduce((sum, h) => sum + h.currentValue, 0);
    
    // This is the total market gain we need to simulate
    const totalGain = totalCurrentValue - totalBuyValue;
    
    // We'll simulate a starting value 2 years ago
    let runningCurrentValue = totalBuyValue * 0.7; // Start at 70% of buyValue
    let runningInvested = totalBuyValue * 0.7; 
    
    // Daily gains and monthly SIPs
    const dailyGain = totalGain / days;
    const sipAmount = 15000;
    const sipDay = 10;
    
    for (let i = 0; i <= days; i++) {
        const currentDate = new Date(startDate.getTime() + (i * 24 * 60 * 60 * 1000));
        
        // Add SIP on the 10th
        if (currentDate.getDate() === sipDay) {
            runningInvested += sipAmount;
            runningCurrentValue += sipAmount; // Value jumps by SIP amount
        }
        
        // Add simulated market gain
        // This creates the "Zerodha-style" fluctuations
        const fluctuation = (Math.random() - 0.48) * runningCurrentValue * 0.015;
        runningCurrentValue += dailyGain + fluctuation;
        
        history.push({
            date: currentDate.toISOString(),
            totalInvested: runningInvested,
            currentValue: runningCurrentValue
        });
    }

    // Finally, ensure the very last data point matches our *actual* app state
    history[history.length - 1] = {
        date: today.toISOString(),
        totalInvested: totalBuyValue,
        currentValue: totalCurrentValue
    };
    
    return history;
}


// --- 5. LOCAL STORAGE & STATE EXPORT LOGIC ---
const STORAGE_KEY = 'arthaAppState'; 
const defaultData = generateDenseData(PREDEFINED_TAGS);

// Define the initial state structure using default data/config
let initialState = {
    // Data (will be overwritten by localStorage if available)
    accounts: defaultData.accounts,
    transactions: defaultData.transactions,
    portfolioHistory: generatePortfolioHistory(),
    investmentAccounts: PREDEFINED_INVESTMENTS,
    
    // Config/Lookups (always use predefined to ensure latest structure)
    tags: PREDEFINED_TAGS,
    categories: PREDEFINED_CATEGORIES,
    
    // UI State
    activeExpensePeriod: 'month',
    activeBalancePeriod: 'max',
    activeInvestmentPeriod: '1Y', 
    activeYear: new Date().getFullYear().toString(),
    activeMonth: (new Date().getMonth() + 1).toString().padStart(2, '0'),
    hasDashboardLoaded: false,
};

// 1. Try to load state from Local Storage
const savedState = localStorage.getItem(STORAGE_KEY);

if (savedState) {
    try {
        const loadedState = JSON.parse(savedState);
        
        // Overwrite mutable data arrays and settings with saved state
        if (loadedState.accounts) initialState.accounts = loadedState.accounts;
        if (loadedState.transactions) initialState.transactions = loadedState.transactions;
        if (loadedState.investmentAccounts) initialState.investmentAccounts = loadedState.investmentAccounts;
        if (loadedState.portfolioHistory) initialState.portfolioHistory = loadedState.portfolioHistory;

        // Restore UI settings
        if (loadedState.activeExpensePeriod) initialState.activeExpensePeriod = loadedState.activeExpensePeriod;
        if (loadedState.activeBalancePeriod) initialState.activeBalancePeriod = loadedState.activeBalancePeriod;
        if (loadedState.activeInvestmentPeriod) initialState.activeInvestmentPeriod = loadedState.activeInvestmentPeriod;

        // Ensure accounts and transactions are parsed correctly if LocalStorage returns an object
        // NOTE: dates need to be kept as strings here, JS functions handle parsing them.

        if (initialState.accounts.length === 0) {
             console.log("Starting with clean slate from saved state.");
        } else {
             console.log("Loaded state from Local Storage.");
        }
        
    } catch (e) {
        console.error("Error parsing saved state. Starting with default demo data.");
    }
} else {
    console.log("No saved state found. Starting with demo data.");
}

// Export the final mutable state object
export const appState = initialState;