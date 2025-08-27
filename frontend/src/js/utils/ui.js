// js/ui.js

// This object will be populated by the initUI function once the DOM is ready.
export const elements = {};

// This function finds all DOM elements and stores them in the `elements` object.
// It should be called once the DOM is fully loaded.
export function initUI() {
    elements.sidebarItems = document.querySelectorAll('.sidebar-item');
    elements.tabContents = document.querySelectorAll('.tab-content');
    elements.mobileMenuButton = document.getElementById('mobileMenuButton');
    elements.addTransactionBtn = document.getElementById('addTransactionBtn');
    elements.addAccountBtn = document.getElementById('addAccountBtn');
    elements.transactionModal = document.getElementById('transactionModal');
    elements.addAccountModal = document.getElementById('addAccountModal');
    elements.closeTransactionModalBtn = document.getElementById('closeTransactionModalBtn');
    elements.closeAddAccountModalBtn = document.getElementById('closeAddAccountModalBtn');
    elements.transactionForm = document.getElementById('transactionForm');
    elements.addAccountForm = document.getElementById('addAccountForm');
    elements.accountList = document.getElementById('accountList');
    elements.transactionAccountSelect = document.getElementById('transactionAccount');
    elements.greetingTitle = document.getElementById('greeting-title');
    elements.greetingSubtitle = document.getElementById('greeting-subtitle');
    elements.currentTime = document.getElementById('currentTime');
    elements.currentDate = document.getElementById('currentDate');
    elements.investmentAccountsList = document.getElementById('investmentAccountsList');
    elements.investmentsLastUpdated = document.getElementById('investments-last-updated');
    elements.expenseInsightsList = document.getElementById('expenseInsightsList');
    elements.addInvestmentAccountBtn = document.getElementById('addInvestmentAccountBtn');
    elements.addInvestmentAccountModal = document.getElementById('addInvestmentAccountModal');
    elements.closeAddInvestmentAccountModalBtn = document.getElementById('closeAddInvestmentAccountModalBtn');
    elements.addInvestmentAccountForm = document.getElementById('addInvestmentAccountForm');
    elements.investmentAccountList = document.getElementById('investmentAccountList');
    elements.transactionList = document.getElementById('transactionList');
    elements.netWorthValue = document.getElementById('netWorthValue');
    elements.netWorthChange = document.getElementById('netWorthChange');
    elements.monthlyExpensesValue = document.getElementById('monthlyExpensesValue');
    elements.monthlyExpensesChange = document.getElementById('monthlyExpensesChange');
    elements.investmentsValue = document.getElementById('investmentsValue');
    elements.investmentsChange = document.getElementById('investmentsChange');
}

// --- All other functions (renderAccounts, updateDashboardMetrics, etc.) remain exactly the same ---
// (No need to copy them again, they are unchanged)

// js/utils/ui.js

export function formatIndianCurrency(num) {
    const value = Math.abs(num);
    if (value >= 10000000) { // Crores
        return `₹${(num / 10000000).toFixed(2)}Cr`;
    }
    if (value >= 100000) { // Lakhs
        return `₹${(num / 100000).toFixed(2)}L`;
    }
    // For values less than 1 lakh, show the full number
    return `₹${num.toLocaleString('en-IN')}`;
}

export function updateDashboardMetrics(appState) {
    // Calculate the primary values from the state
    const totalNetWorth = appState.accounts.reduce((sum, acc) => sum + acc.balance, 0) + appState.investments.reduce((sum, inv) => sum + inv.value, 0);
    const monthlyExpenses = appState.transactions
        .filter(t => t.type === 'expense' && t.date.getMonth() === new Date().getMonth())
        .reduce((sum, t) => sum + t.amount, 0);
    const totalInvestments = appState.investments.reduce((sum, inv) => sum + inv.value, 0);

    // Update the element text content with proper formatting
    elements.netWorthValue.textContent = `₹${totalNetWorth.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
    elements.monthlyExpensesValue.textContent = `₹${monthlyExpenses.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
    elements.investmentsValue.textContent = `₹${totalInvestments.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
    
    // This data object makes the code much cleaner and easier to update
    const changeData = {
        netWorth: { value: 8.2, isPositive: true },
        expenses: { value: 12.1, isPositive: false }, // An increase in expenses is considered negative
        investments: { value: 18.5, isPositive: true }
    };

    // This reusable helper function builds the HTML for the change indicator
    const updateChangeElement = (element, data) => {
        // Dynamically set the color class based on whether the change is positive or negative
        element.className = `mt-4 text-sm font-medium flex items-center ${data.isPositive ? 'text-positive-value' : 'text-negative-value'}`;
        
        // Dynamically build the SVG and text
        element.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1">
                ${data.isPositive 
                    ? '<polyline points="23,6 13.5,15.5 8.5,10.5 1,18"/><polyline points="17,6 23,6 23,12"/>' 
                    : '<polyline points="23,18 13.5,8.5 8.5,13.5 1,6"/><polyline points="17,18 23,18 23,12"/>'}
            </svg>
            +${data.value}% from last month
        `;
    };

    // Call the helper function for each metric
    updateChangeElement(elements.netWorthChange, changeData.netWorth);
    updateChangeElement(elements.monthlyExpensesChange, changeData.expenses);
    updateChangeElement(elements.investmentsChange, changeData.investments);
}

export function renderAccounts(accounts) {
    const accountsContainer = elements.accountList;
    if (accounts.length === 0) {
        accountsContainer.innerHTML = `<div class="empty-state card p-8 text-center text-gray-400 col-span-full">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H4a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
            <p class="text-lg">No bank accounts added.</p>
            <p class="text-sm">Click the "Add Account" button to track your finances.</p>
        </div>`;
        return;
    }
    const accountListHtml = accounts.map(account => {
        const balanceColor = account.balance >= 0 ? 'text-positive-value' : 'text-negative-value';
        return `
        <div class="card p-6 flex justify-between items-center">
            <div>
                <p class="font-bold text-white">${account.name}</p>
                <p class="text-sm text-gray-400">${account.type}</p>
            </div>
            <p class="text-2xl font-semibold mono ${balanceColor}">₹${account.balance.toLocaleString('en-IN', {minimumFractionDigits: 2})}</p>
        </div>
        `;
    }).join('');
    elements.accountList.innerHTML = accountListHtml;
}

export function renderDashboardInvestmentAccounts(investments) {
    const holdingsHtml = investments.map(holding => {
        const changeColor = holding.isPositive ? 'text-positive-value' : 'text-negative-value';
        const changeSign = holding.isPositive ? '+' : '';
        return `
        <div class="flex justify-between items-center py-2 border-b border-white/5 last:border-b-0">
            <div>
                <h4 class="font-semibold text-white">${holding.name}</h4>
                <p class="text-sm text-gray-400">${holding.type}</p>
            </div>
            <div class="text-right">
                <div class="text-white font-semibold">₹${holding.value.toLocaleString('en-IN')}</div>
                <div class="text-sm ${changeColor}">${changeSign}${holding.change}%</div>
            </div>
        </div>
        `;
    }).join('');
    elements.investmentAccountsList.innerHTML = holdingsHtml;
    elements.investmentsLastUpdated.textContent = 'Last updated: 5 mins ago';
}

export function renderInvestmentsTab(investments) {
    const investmentsContainer = elements.investmentAccountList;
    if (investments.length === 0) {
        investmentsContainer.innerHTML = `<div class="empty-state card p-8 text-center text-gray-400 col-span-full">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6M3 4h18a2 2 0 012 2v12a2 2 0 01-2 2H3a2 2 0 01-2-2V6a2 2 0 012-2z" /></svg>
            <p class="text-lg">No investment accounts added.</p>
            <p class="text-sm">Click the button above to add your first investment account.</p>
        </div>`;
        return;
    }
    const investmentListHtml = investments.map(investment => {
        const valueColor = investment.isPositive ? 'text-positive-value' : 'text-negative-value';
        const changeSign = investment.isPositive ? '+' : '';
        return `
        <div class="card p-6 flex justify-between items-center">
            <div>
                <p class="font-bold text-white">${investment.name}</p>
                <p class="text-sm text-gray-400">${investment.type}</p>
            </div>
            <div class="text-right">
                <p class="text-2xl font-semibold mono ${valueColor}">₹${investment.value.toLocaleString('en-IN')}</p>
                <p class="text-xs ${valueColor}">${changeSign}${investment.change}%</p>
            </div>
        </div>
        `;
    }).join('');
    elements.investmentAccountList.innerHTML = investmentListHtml;
}

export function renderExpenseInsights(expenseCategories) {
    const insightsContainer = elements.expenseInsightsList;
    if (expenseCategories.length === 0) {
         insightsContainer.innerHTML = `<p class="text-gray-400 text-center">No expense data available for insights.</p>`;
         return;
    }
    const insightsHtml = expenseCategories.map(item => `
        <div class="flex flex-col py-2">
            <div class="flex justify-between items-center">
                <h4 class="font-semibold text-white">${item.category}</h4>
                <p class="font-semibold text-white">₹${item.amount.toLocaleString('en-IN')}</p>
            </div>
            <p class="text-sm text-gray-400">${item.insight}</p>
        </div>
    `).join('');
    insightsContainer.innerHTML = insightsHtml;
}

export function populateAccountDropdown(accounts) {
    const selectHtml = accounts.map(account => 
        `<option value="${account.id}">${account.name} (₹${account.balance.toLocaleString('en-IN', {minimumFractionDigits: 2})})</option>`
    ).join('');
    elements.transactionAccountSelect.innerHTML = selectHtml;
}

export function renderTransactions(transactions, accounts) {
    const transactionsContainer = elements.transactionList;
    if (transactions.length === 0) {
        transactionsContainer.innerHTML = `<div class="empty-state p-8 text-center text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
            <p class="text-lg">No transactions yet.</p>
            <p class="text-sm">Start by adding your first transaction to see a list here.</p>
        </div>`;
        return;
    }
    const transactionListHtml = transactions.map(transaction => {
        const account = accounts.find(acc => acc.id === transaction.accountId);
        const amountColor = transaction.type === 'income' ? 'text-positive-value' : 'text-negative-value';
        const amountSign = transaction.type === 'income' ? '+' : '-';
        const date = transaction.date.toLocaleDateString('en-IN');
        return `
        <div class="flex justify-between items-center py-2 border-b border-white/5 last:border-b-0">
            <div>
                <p class="font-semibold text-white">${transaction.description}</p>
                <p class="text-sm text-gray-400">${account ? account.name : 'Unknown'} | ${date}</p>
            </div>
            <p class="text-lg font-bold mono ${amountColor}">${amountSign}₹${transaction.amount.toLocaleString('en-IN')}</p>
        </div>
        `;
    }).join('');
    transactionsContainer.innerHTML = transactionListHtml;
}

export function setActiveTab(tabId, createChartsCallback, appState) {
    elements.sidebarItems.forEach(item => item.classList.toggle('active', item.dataset.tab === tabId));
    elements.tabContents.forEach(content => content.classList.toggle('active', content.id === tabId));
    if (window.innerWidth <= 1024) { document.querySelector('.sidebar').classList.remove('active'); }
    createChartsCallback(appState);
}

export function toggleModal(modalId, show) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.toggle('active', show);
    }
}

export function updateGreeting() {
    const hour = new Date().getHours();
    const name = "Suyash";
    let greetingText = "";
    
    const netWorthChange = 8.2;
    const isSpendingUp = true;

    if (hour < 12) {
        greetingText = `Good morning, ${name}.`;
    } else if (hour < 18) {
        greetingText = `Good afternoon, ${name}.`;
    } else {
        greetingText = `Good evening, ${name}.`;
    }

    let insightText = "";
    if (netWorthChange > 0) {
        insightText = "Your financial trajectory is looking strong. Here's a quick summary.";
    } else if (isSpendingUp) {
        insightText = "Let's review your spending. Here's this month's financial summary.";
    } else {
        insightText = "Here's your financial summary. Stay on top of your goals.";
    }

    elements.greetingTitle.textContent = greetingText;
    elements.greetingSubtitle.textContent = insightText;
}

export function updateDateTime() {
    const now = new Date();
    const timeOptions = { hour: '2-digit', minute: '2-digit' };
    const timeString = now.toLocaleTimeString('en-IN', timeOptions);
    const dateOptions = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
    const dateString = now.toLocaleDateString('en-IN', dateOptions);

    if(elements.currentTime) {
        elements.currentTime.textContent = timeString;
    }
    if(elements.currentDate) {
        elements.currentDate.textContent = dateString;
    }
}