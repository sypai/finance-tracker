// src/js/utils/ui/transactions.js
import { elements } from './domElements.js';
import { toggleModal } from './common.js';

// --- Helper Functions ---
function getCategoryIcon(description) {
    const desc = description.toLowerCase();
    if (desc.includes('swiggy') || desc.includes('zomato') || desc.includes('restaurant')) return `<path stroke-linecap="round" stroke-linejoin="round" d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.07 0a5 5 0 010 7.07m-7.07 0l-1.414-1.414m0 0L5.636 5.636m1.414 1.414L5.636 8.464m11.314 0l-1.414 1.414m0 0L16.95 5.636m1.414 1.414L16.95 8.464M9 12a3 3 0 116 0 3 3 0 01-6 0z" />`;
    if (desc.includes('rent')) return `<path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6-4h.01M12 12h.01M15 12h.01M12 15h.01M15 15h.01M9 15h.01" />`;
    if (desc.includes('salary') || desc.includes('freelance')) return `<path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.105 0 2.09.222 3 .618M12 8V7m0 1v8m0 0c-1.105 0-2.09-.222-3-.618m3 .618c-1.657 0-3-.895-3-2s1.343-2 3-2 3-.895 3-2-1.343-2-3-2m9 8a9 9 0 11-18 0 9 9 0 0118 0z" />`;
    if (desc.includes('groceries')) return `<path stroke-linecap="round" stroke-linejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />`;
    if (desc.includes('fuel') || desc.includes('petrol')) return `<path stroke-linecap="round" stroke-linejoin="round" d="M8 16V6a4 4 0 118 0v10M6 16h12M12 21v-5" />`;
    // Default
    return `<path stroke-linecap="round" stroke-linejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 4.99h.01M19 10a9 9 0 11-18 0 9 9 0 0118 0z" />`;
}

// --- Renders the "Briefing List" (Unchanged) ---
export function renderTransactionInsights(appState) {
    const container = document.getElementById('transaction-insights-list');
    if (!container) return;
    const now = new Date();
    const thisMonthTransactions = appState.transactions.filter(t => new Date(t.date).getMonth() === now.getMonth());
    const thisMonthExpenses = thisMonthTransactions.filter(t => t.type === 'expense');

    const totalSpent = thisMonthExpenses.reduce((sum, t) => sum + t.amount, 0);
    const totalEarned = thisMonthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    let html = '';

    html += `
        <div class="insight-list-item">
            <h4 class="insight-list-title">Monthly Net Flow</h4>
            <p class="insight-list-text">You've earned <strong class="positive">₹${totalEarned.toLocaleString('en-IN')}</strong> and spent <strong class="negative">₹${totalSpent.toLocaleString('en-IN')}</strong> so far this month.</p>
        </div>
    `;
    if (thisMonthExpenses.length > 0) {
        const categoryTotals = thisMonthExpenses.reduce((acc, t) => {
            const category = t.description.split(' ')[0];
            acc[category] = (acc[category] || 0) + t.amount;
            return acc;
        }, {});
        const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
        const topCategory = sortedCategories[0];
        html += `
            <div class="insight-list-item">
                <h4 class="insight-list-title">Top Category</h4>
                <p class="insight-list-text">Your top spending category is <strong>${topCategory[0]}</strong>, with a total of <strong>₹${topCategory[1].toLocaleString('en-IN')}</strong>.</p>
            </div>
        `;
    }
    if (thisMonthExpenses.length > 0) {
        const largestExpense = thisMonthExpenses.sort((a, b) => b.amount - a.amount)[0];
        html += `
            <div class="insight-list-item">
                <h4 class="insight-list-title">Largest Purchase</h4>
                <p class="insight-list-text">Your single largest expense was <strong>₹${largestExpense.amount.toLocaleString('en-IN')}</strong> for <strong>${largestExpense.description}</strong>.</p>
            </div>
        `;
    }
    const lastMonthSpent = 45000;
    if (lastMonthSpent > 0 && totalSpent > 0) {
        const percentChange = Math.round(((totalSpent - lastMonthSpent) / lastMonthSpent) * 100);
        const isDown = percentChange < 0;
        html += `
             <div class="insight-list-item">
                <h4 class="insight-list-title">Spending Pace</h4>
                <p class="insight-list-text">
                    Your spending is <strong class="${isDown ? 'positive' : 'negative'}">${isDown ? 'down' : 'up'} ${Math.abs(percentChange)}%</strong> compared to this time last month.
                </p>
            </div>
        `;
    }
    if (thisMonthTransactions.length === 0) {
         html = `
            <div class="insight-list-item">
                <h4 class="insight-list-title">Monthly Briefing</h4>
                <p class="insight-list-text">No transactions logged yet this month. Start by adding an expense or income.</p>
            </div>
        `;
    }
    container.innerHTML = html;
}

// --- *** MODIFIED: `showTransactionModal` *** ---
// Now accepts an optional transaction object to pre-fill the form for editing.
export function showTransactionModal(appState, transactionToEdit = null) {
    if (appState.accounts.length === 0) {
        elements.transactionFormWrapper.classList.add('hidden');
        elements.transactionZeroState.classList.remove('hidden');
    } else {
        elements.transactionZeroState.classList.add('hidden');
        elements.transactionFormWrapper.classList.remove('hidden');
        populateAccountDropdown(appState.accounts);
    }

    // Get form elements
    const modalTitle = document.querySelector('#transactionModal h3');
    const form = document.getElementById('transactionForm');
    const submitBtn = document.getElementById('transactionSubmitBtn');
    
    if (transactionToEdit) {
        // --- EDIT MODE ---
        modalTitle.textContent = 'Edit Transaction';
        submitBtn.textContent = 'Save Changes';

        // Populate the form fields
        form.elements.id.value = transactionToEdit.id;
        form.elements.accountId.value = transactionToEdit.accountId;
        form.elements.description.value = transactionToEdit.description;
        form.elements.amount.value = transactionToEdit.amount;
        form.elements.type.value = transactionToEdit.type;

    } else {
        // --- ADD MODE ---
        modalTitle.textContent = 'Add Transaction';
        submitBtn.textContent = 'Add Transaction';
        
        // Reset the form to ensure it's clean
        form.reset();
        // Explicitly clear the hidden ID field
        form.elements.id.value = '';
    }

    toggleModal('transactionModal', true);
}

export function populateAccountDropdown(accounts) {
    if (!elements.transactionAccountSelect) return;
    elements.transactionAccountSelect.innerHTML = accounts.map(account => 
        `<option value="${account.id}">${account.name} (₹${account.balance.toLocaleString('en-IN')})</option>`
    ).join('');
}

// --- *** "PERFECTIFIED" `renderTransactions` *** ---
export function renderTransactions(transactions, accounts) {
    const container = elements.transactionList; // This is the .flex-col container
    if (!container) return;

    container.innerHTML = ''; // Clear old content

    if (transactions.length === 0) {
        container.innerHTML = `<div class="p-8 text-center text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
            <p class="text-lg">No transactions yet.</p>
        </div>`;
        return;
    }

    // 1. Group by Month-Year
    const groupedByMonth = transactions.reduce((acc, t) => {
        const date = new Date(t.date);
        const monthYearKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!acc[monthYearKey]) {
            acc[monthYearKey] = { monthName: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }), netTotal: 0, transactions: [] };
        }
        const amount = t.type === 'income' ? t.amount : -t.amount;
        acc[monthYearKey].netTotal += amount;
        acc[monthYearKey].transactions.push(t);
        return acc;
    }, {});

    const sortedMonthKeys = Object.keys(groupedByMonth).sort((a, b) => b.localeCompare(a));
    
    // 2. Render the Accordion Groups (Months)
    sortedMonthKeys.forEach((monthKey, index) => {
        const monthGroup = groupedByMonth[monthKey];
        const isOpenClass = index === 0 ? 'is-open' : ''; // Open first month
        
        const isNetPositive = monthGroup.netTotal >= 0;
        const netTotalSign = isNetPositive ? '+' : '-';
        const netTotalColor = isNetPositive ? 'text-positive-value' : 'text-negative-value';
        const netTotalFormatted = `${netTotalSign}₹${Math.abs(monthGroup.netTotal).toLocaleString('en-IN')}`;

        const groupEl = document.createElement('div');
        groupEl.className = `transaction-group ${isOpenClass}`;

        // 3. Group this month's transactions by DAY
        const groupedByDay = monthGroup.transactions.reduce((acc, t) => {
            const date = new Date(t.date);
            const dayKey = date.toISOString().split('T')[0]; // "2025-10-22"
            if (!acc[dayKey]) {
                acc[dayKey] = {
                    dayHeader: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    dayNetTotal: 0,
                    transactions: []
                };
            }
            acc[dayKey].dayNetTotal += (t.type === 'income' ? t.amount : -t.amount);
            acc[dayKey].transactions.push(t);
            return acc;
        }, {});
        
        const sortedDayKeys = Object.keys(groupedByDay).sort((a, b) => b.localeCompare(a));

        // 4. Build the HTML for the Day Columns
        let dayColumnsHtml = '';
        sortedDayKeys.forEach((dayKey, dayIndex) => {
            const dayGroup = groupedByDay[dayKey];
            const dayNetPositive = dayGroup.dayNetTotal >= 0;
            const dayNetTotalFormatted = `${dayNetPositive ? '+' : '-'}₹${Math.abs(dayGroup.dayNetTotal).toLocaleString('en-IN')}`;

            // Build the cards for this day
            const transactionCardsHtml = dayGroup.transactions
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .map(t => {
                    const account = accounts.find(a => a.id === t.accountId);
                    const isPositive = t.type === 'income';
                    const amountFormatted = `${isPositive ? '+' : '-'}₹${t.amount.toLocaleString('en-IN')}`;
                    const iconSvg = getCategoryIcon(t.description);
                    
                    return `
                        <a href="#" class="transaction-card" data-transaction-id="${t.id}">
                            <div class="transaction-icon-wrapper">
                                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">${iconSvg}</svg>
                            </div>
                            <div class="flex-1 min-w-0">
                                <p class="font-semibold text-text-primary truncate">${t.description}</p>
                                <p class="text-sm text-text-secondary">${account ? account.name : 'Unknown'}</p>
                            </div>
                            <p class="font-semibold mono ${isPositive ? 'text-positive-value' : 'text-negative-value'}">
                                ${amountFormatted}
                            </p>
                        </a>
                    `;
                }).join('');

            // Assemble the Day Column
            dayColumnsHtml += `
                <div class="day-column" style="animation-delay: ${dayIndex * 50}ms">
                    <div class="day-header">
                        <h4 class="font-heading">${dayGroup.dayHeader}</h4>
                        <span class="mono ${dayNetPositive ? 'text-positive-value' : 'text-negative-value'}">
                            ${dayNetTotalFormatted}
                        </span>
                    </div>
                    <div class="day-stream">
                        ${transactionCardsHtml}
                    </div>
                </div>
            `;
        });

        // 5. Assemble the final Month Group
        groupEl.innerHTML = `
            <h3 class="transaction-group-header" data-group-key="${monthKey}">
                <span>${monthGroup.monthName}</span>
                <span class="month-total ${netTotalColor}">${netTotalFormatted}</span>
                <svg class="chevron-icon h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </h3>
            <div class="transaction-group-list">
                <div class="horizontal-stream-container">
                    ${dayColumnsHtml}
                </div>
            </div>
        `;
        container.appendChild(groupEl);
    });
}