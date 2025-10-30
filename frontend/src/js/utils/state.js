// src/js/utils/state.js

// --- 1. DEFINE PREDEFINED DATA FIRST ---

function getRandomTagColor() {
    const colors = [
        '#F0857D', // --negative-color
        '#5BB974', // --positive-color
        '#1D4ED8', // --primary-accent
        '#A78BFA', // A purple
        '#FBBF24', // A yellow
        '#FB7185'  // A pink
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

// Master list of tags available to the generator
const PREDEFINED_TAGS = [
    { id: 'tag-1', name: 'Singapore Trip', color: getRandomTagColor() },
    { id: 'tag-2', name: 'Office', color: getRandomTagColor() },
    { id: 'tag-3', name: 'Freelance', color: getRandomTagColor() },
    { id: 'tag-salary', name: 'Salary', color: getRandomTagColor() },
    { id: 'tag-travel', name: 'Travel', color: getRandomTagColor() },
    { id: 'tag-foodie', name: 'Foodie', color: getRandomTagColor() }
];

// Master list of categories
const PREDEFINED_CATEGORIES = [
    { id: 'cat-uncategorized', name: 'Uncategorized', iconId: '#icon-default' },
    { id: 'cat-income', name: 'Income', iconId: '#icon-income' },
    { id: 'cat-food', name: 'Food & Dining', iconId: '#icon-food' },
    { id: 'cat-shopping', name: 'Shopping', iconId: '#icon-shopping' },
    { id: 'cat-groceries', name: 'Groceries', iconId: '#icon-groceries' },
    { id: 'cat-transport', name: 'Transport', iconId: '#icon-transport' },
    { id: 'cat-bills', name: 'Bills & Utilities', iconId: '#icon-bills' },
    { id: 'cat-home', name: 'Home & Rent', iconId: '#icon-home' },
    { id: 'cat-fuel', name: 'Fuel', iconId: '#icon-fuel' }
    // Add other categories from icons.js if you want them pre-defined
];


// --- 2. DATA GENERATOR ---

/**
 * Generates a large, realistic dataset.
 * @param {Array} masterTags - The predefined tags to randomly assign.
 */
function generateDenseData(masterTags) {
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
        const numTransactions = Math.floor(Math.random() * 5) + 4; // 4 to 8 transactions per day

        // --- Realistic Income ---
        if (dayOfMonth === 1) {
            transactions.push({ id: Date.now() + i + 10000, accountId: salaryAccountId, description: 'Salary', type: 'income', amount: Math.floor(Math.random() * 20000) + 50000, date, categoryId: 'cat-income', tagIds: ['tag-salary'] });
        }
        if (Math.random() < 0.05) {
             const incomeDesc = incomeDescriptions[Math.floor(Math.random() * incomeDescriptions.length)];
             const incomeAccId = accounts[Math.floor(Math.random() * accounts.length)].id;
             const tagIds = (incomeDesc === 'Freelance' && Math.random() < 0.5) ? ['tag-3'] : []; // Randomly tag 'Freelance'
             transactions.push({ id: Date.now() + i + 20000, accountId: incomeAccId, description: incomeDesc, type: 'income', amount: Math.floor(Math.random() * 15000) + 1000, date, categoryId: 'cat-income', tagIds: tagIds });
        }

        // --- Regular Expenses (Updated Descriptions) ---
        for (let j = 0; j < numTransactions; j++) {
            // ... (keep all existing description generation logic) ...
            const accountIndex = Math.floor(Math.random() * accounts.length);
            const accountId = accounts[accountIndex].id;
            const categoryKeyword = expenseDescriptions[Math.floor(Math.random() * expenseDescriptions.length)];
            let description = categoryKeyword;
            
            if (categoryKeyword === 'Groceries') description = `Grocery shopping at ${['Big Bazaar', 'Reliance Fresh', 'Local Market'][Math.floor(Math.random() * 3)]}`;
            else if (categoryKeyword === 'Shopping') description = `${['Clothes', 'Electronics', 'Books'][Math.floor(Math.random()*3)]} from ${['Myntra', 'Amazon', 'Flipkart'][Math.floor(Math.random()*3)]}`;
            else if (categoryKeyword === 'Swiggy' || categoryKeyword === 'Dinner' || categoryKeyword === 'Coffee') description = `${categoryKeyword} from ${['Cafe Coffee Day', 'Starbucks', 'Local Restaurant', 'Pizza Hut'][Math.floor(Math.random()*4)]}`;
            else if (categoryKeyword === 'Uber') description = `Uber ride to ${['Office', 'Home', 'Airport'][Math.floor(Math.random()*3)]}`;
            else if (categoryKeyword === 'Rent') description = 'Monthly Rent Payment';
            else if (categoryKeyword === 'Utilities') description = `${['Electricity Bill', 'Water Bill', 'Internet Bill'][Math.floor(Math.random()*3)]}`;
            else if (categoryKeyword === 'Netflix') description = 'Netflix Subscription';
            else if (categoryKeyword === 'Fuel') description = `Fuel at ${['Indian Oil', 'HP Petrol Pump', 'Shell'][Math.floor(Math.random()*3)]}`;
            else if (categoryKeyword === 'Movies') description = `Movie tickets at ${['PVR', 'Inox'][Math.floor(Math.random()*2)]}`;
            else if (categoryKeyword === 'Pharmacy') description = `Purchase from ${['Apollo Pharmacy', 'Local Chemist'][Math.floor(Math.random()*2)]}`;
            else if (categoryKeyword === 'Travel') description = `${['Flight', 'Train', 'Bus'][Math.floor(Math.random()*3)]} ticket booking`;


            const amount = Math.floor(Math.random() * (categoryKeyword === 'Rent' ? 15000 : 4000)) + 50;

            // ... (keep existing categoryId logic) ...
            let categoryId = 'cat-uncategorized';
            if (categoryKeyword.match(/swiggy|dinner|coffee/i)) categoryId = 'cat-food';
            else if (categoryKeyword.match(/shopping|amazon|movies/i)) categoryId = 'cat-shopping';
            else if (categoryKeyword.match(/groceries/i)) categoryId = 'cat-groceries';
            else if (categoryKeyword.match(/uber|travel/i)) categoryId = 'cat-transport';
            else if (categoryKeyword.match(/utilities|netflix|pharmacy/i)) categoryId = 'cat-bills';
            else if (categoryKeyword.match(/rent/i)) categoryId = 'cat-home';
            else if (categoryKeyword.match(/fuel|petrol/i)) categoryId = 'cat-fuel';

            // --- *** THIS IS THE FIX *** ---
            // Randomly assign some tags
            let assignedTagIds = [];
            // 25% chance of getting a tag
            if (Math.random() < 0.25) {
                // Pick a random tag from the master list (that isn't 'Salary')
                const randomTag = masterTags[Math.floor(Math.random() * masterTags.length)];
                if (randomTag.id !== 'tag-salary') {
                    assignedTagIds.push(randomTag.id);
                }
            }
            // Add specific tags based on category
            if (categoryKeyword === 'Travel' && !assignedTagIds.includes('tag-travel')) {
                assignedTagIds.push('tag-travel');
            }
            if (categoryKeyword === 'Uber' && description.includes('Office') && !assignedTagIds.includes('tag-2')) {
                assignedTagIds.push('tag-2'); // 'tag-2' is 'Office'
            }
            if ((categoryKeyword === 'Swiggy' || categoryKeyword === 'Dinner') && Math.random() < 0.3 && !assignedTagIds.includes('tag-foodie')) {
                assignedTagIds.push('tag-foodie');
            }
            // --- *** END FIX *** ---

            transactions.push({ 
                id: Date.now() + i + j, 
                accountId, 
                description, 
                type: 'expense', 
                amount, 
                date, 
                categoryId,
                tagIds: assignedTagIds // <-- Pass the assigned tag IDs
            });
        }
    }
    
    // Calculate final balances
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


// --- 3. GENERATE DATA & EXPORT appState ---

// Generate data *using* the predefined lists
const { accounts, transactions } = generateDenseData(PREDEFINED_TAGS);

// Export the final state object
export const appState = {
    accounts,
    transactions,
    tags: PREDEFINED_TAGS, // Use the master list
    categories: PREDEFINED_CATEGORIES, // Use the master list
    
    // --- Keep the rest of the state as is ---
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