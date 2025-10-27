// src/js/utils/ui/transactions.js
import { elements } from './domElements.js';
import { toggleModal } from './common.js';

// --- Helper Functions ---
function getCategoryIcon(description) {
    const desc = description.toLowerCase();
    if (desc.includes('swiggy') || desc.includes('zomato') || desc.includes('restaurant') || desc.includes('dinner') || desc.includes('coffee')) return `<path stroke-linecap="round" stroke-linejoin="round" d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.07 0a5 5 0 010 7.07m-7.07 0l-1.414-1.414m0 0L5.636 5.636m1.414 1.414L5.636 8.464m11.314 0l-1.414 1.414m0 0L16.95 5.636m1.414 1.414L16.95 8.464M9 12a3 3 0 116 0 3 3 0 01-6 0z" />`; // Food/Dining Icon
    if (desc.includes('rent')) return `<path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6-4h.01M12 12h.01M15 12h.01M12 15h.01M15 15h.01M9 15h.01" />`; // Home/Rent Icon
    if (desc.includes('salary') || desc.includes('freelance') || desc.includes('bonus') || desc.includes('interest')) return `<path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.105 0 2.09.222 3 .618M12 8V7m0 1v8m0 0c-1.105 0-2.09-.222-3-.618m3 .618c-1.657 0-3-.895-3-2s1.343-2 3-2 3-.895 3-2-1.343-2-3-2m9 8a9 9 0 11-18 0 9 9 0 0118 0z" />`; // Income/Money Icon
    if (desc.includes('groceries')) return `<path stroke-linecap="round" stroke-linejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />`; // Shopping Cart Icon
    if (desc.includes('fuel') || desc.includes('petrol')) return `<path stroke-linecap="round" stroke-linejoin="round" d="M8 16V6a4 4 0 118 0v10M6 16h12M12 21v-5" />`; // Fuel Icon
    if (desc.includes('shopping') || desc.includes('amazon') || desc.includes('movies')) return `<path stroke-linecap="round" stroke-linejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />`; // Shopping Bag Icon
    if (desc.includes('uber') || desc.includes('travel')) return `<path stroke-linecap="round" stroke-linejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />`; // Transport/Travel Icon
    if (desc.includes('netflix') || desc.includes('utilities') || desc.includes('pharmacy')) return `<path stroke-linecap="round" stroke-linejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.24a2 2 0 00-1.806.547a2 2 0 00-.547 1.806l.477 2.387a6 6 0 00.517 3.86l.158.318a6 6 0 00.517 3.86l2.387.477a2 2 0 001.806.547a2 2 0 00.547-1.806l-.477-2.387a6 6 0 00-.517-3.86l-.158-.318a6 6 0 01-.517-3.86l.477-2.387a2 2 0 00.547-1.806z" />`; // Bills/Utilities Icon
    // Default Icon
    return `<path stroke-linecap="round" stroke-linejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 4.99h.01M19 10a9 9 0 11-18 0 9 9 0 0118 0z" />`; // Generic Circle Icon
}

// --- Renders the "Briefing List" ---
export function renderTransactionInsights(appState) {
    const container = document.getElementById('transaction-insights-list');
    if (!container) return;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const thisMonthTransactions = appState.transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    const thisMonthExpenses = thisMonthTransactions.filter(t => t.type === 'expense');
    const totalSpent = thisMonthExpenses.reduce((sum, t) => sum + t.amount, 0);
    const totalEarned = thisMonthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);

    const lastMonthDate = new Date(currentYear, currentMonth - 1, 1); // First day of last month
    const lastMonthYear = lastMonthDate.getFullYear();
    const lastMonth = lastMonthDate.getMonth();

    const lastMonthTransactions = appState.transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
    });
    const lastMonthSpent = lastMonthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    let html = '';

    // Monthly Net Flow
    html += `
        <div class="insight-list-item">
            <h4 class="insight-list-title">Monthly Net Flow</h4>
            <p class="insight-list-text">You've earned <strong class="positive">₹${totalEarned.toLocaleString('en-IN')}</strong> and spent <strong class="negative">₹${totalSpent.toLocaleString('en-IN')}</strong> so far this month.</p>
        </div>
    `;

    // Top Category
    if (thisMonthExpenses.length > 0) {
        const categoryTotals = thisMonthExpenses.reduce((acc, t) => {
            // Simple category extraction (first word) - can be improved
            const category = t.description.split(' ')[0] || 'Uncategorized';
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

    // Largest Purchase
    if (thisMonthExpenses.length > 0) {
        const largestExpense = [...thisMonthExpenses].sort((a, b) => b.amount - a.amount)[0]; // Use spread to avoid mutating original
        html += `
            <div class="insight-list-item">
                <h4 class="insight-list-title">Largest Purchase</h4>
                <p class="insight-list-text">Your single largest expense was <strong>₹${largestExpense.amount.toLocaleString('en-IN')}</strong> for <strong>${largestExpense.description}</strong>.</p>
            </div>
        `;
    }

    // Spending Pace
    if (lastMonthSpent > 0 && totalSpent > 0) {
        const percentChange = Math.round(((totalSpent - lastMonthSpent) / lastMonthSpent) * 100);
        const isDown = percentChange < 0;
        html += `
             <div class="insight-list-item">
                <h4 class="insight-list-title">Spending Pace</h4>
                <p class="insight-list-text">
                    Your spending is <strong class="${isDown ? 'positive' : 'negative'}">${isDown ? 'down' : 'up'} ${Math.abs(percentChange)}%</strong> compared to last month.
                </p>
            </div>
        `;
    }

    // Zero State for Insights
    if (thisMonthTransactions.length === 0) {
         html = `
            <div class="insight-list-item">
                <h4 class="insight-list-title">Monthly Briefing</h4>
                <p class="insight-list-text">No transactions logged yet this month. Add one to see your insights.</p>
            </div>
        `;
    }
    container.innerHTML = html;
}

// --- Transaction Modal Functions ---
export function showTransactionModal(appState, transactionToEdit = null) {
    if (appState.accounts.length === 0) {
        elements.transactionFormWrapper.classList.add('hidden');
        elements.transactionZeroState.classList.remove('hidden');
    } else {
        elements.transactionZeroState.classList.add('hidden');
        elements.transactionFormWrapper.classList.remove('hidden');
        populateAccountDropdown(appState.accounts);
    }

    const modalTitle = document.querySelector('#transactionModal h3');
    const form = document.getElementById('transactionForm');
    const submitBtn = document.getElementById('transactionSubmitBtn');

    if (transactionToEdit) {
        modalTitle.textContent = 'Edit Transaction';
        submitBtn.textContent = 'Save Changes';
        form.elements.id.value = transactionToEdit.id;
        form.elements.accountId.value = transactionToEdit.accountId;
        form.elements.description.value = transactionToEdit.description;
        form.elements.amount.value = transactionToEdit.amount;
        form.elements.type.value = transactionToEdit.type;
    } else {
        modalTitle.textContent = 'Add Transaction';
        submitBtn.textContent = 'Add Transaction';
        form.reset();
        form.elements.id.value = '';
    }
    toggleModal('transactionModal', true);
}

export function populateAccountDropdown(accounts) {
    if (!elements.transactionAccountSelect) return;
    // Sort accounts alphabetically for easier selection
    const sortedAccounts = [...accounts].sort((a, b) => a.name.localeCompare(b.name));
    elements.transactionAccountSelect.innerHTML = sortedAccounts.map(account =>
        `<option value="${account.id}">${account.name} (Current: ₹${account.balance.toLocaleString('en-IN')})</option>`
    ).join('');
}

// --- Renders ONLY the month accordion structure ---
export function renderTransactionStructure(transactions) {
    const container = elements.transactionList;
    if (!container) return;
    container.innerHTML = '';

    if (transactions.length === 0) {
        container.innerHTML = `<div class="p-8 text-center text-gray-400"><svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg><p class="text-lg font-semibold mt-2">No transactions yet.</p><p class="text-sm text-text-secondary">Add your first expense or income to get started.</p></div>`;
        return;
    }

    const groupedByMonth = transactions.reduce((acc, t) => {
        const date = new Date(t.date);
        const monthYearKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!acc[monthYearKey]) {
            acc[monthYearKey] = { monthName: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }), netTotal: 0 };
        }
        acc[monthYearKey].netTotal += (t.type === 'income' ? t.amount : -t.amount);
        return acc;
    }, {});

    const sortedMonthKeys = Object.keys(groupedByMonth).sort((a, b) => b.localeCompare(a));

    sortedMonthKeys.forEach((monthKey, index) => {
        const monthGroup = groupedByMonth[monthKey];
        const isOpenClass = index === 0 ? 'is-open' : '';
        const isNetPositive = monthGroup.netTotal >= 0;
        const netTotalFormatted = `${isNetPositive ? '+' : '-'}₹${Math.abs(monthGroup.netTotal).toLocaleString('en-IN')}`;
        const netTotalColor = isNetPositive ? 'text-positive-value' : 'text-negative-value';

        const groupEl = document.createElement('div');
        groupEl.className = `transaction-group ${isOpenClass}`;
        groupEl.dataset.monthKey = monthKey;

        groupEl.innerHTML = `
            <h3 class="transaction-group-header" data-group-key="${monthKey}">
                <span>${monthGroup.monthName}</span>
                <span class="month-total ${netTotalColor}">${netTotalFormatted}</span>
                <svg class="chevron-icon h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </h3>
            <div class="transaction-group-list">
                <div class="horizontal-stream-container p-4 text-center text-text-secondary">
                    Loading transactions...
                </div>
            </div>
        `;
        container.appendChild(groupEl);
    });
}

// --- Populates the transaction data asynchronously ---
export function loadTransactionData(transactions, accounts) {
    const allGroupElements = document.querySelectorAll('#transactionList .transaction-group');
    if (allGroupElements.length === 0 || transactions.length === 0) return;

    const groupedByDay = transactions.reduce((acc, t) => {
        const date = new Date(t.date);
        const monthYearKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const dayKey = date.toISOString().split('T')[0];

        if (!acc[monthYearKey]) acc[monthYearKey] = {};
        if (!acc[monthYearKey][dayKey]) {
             acc[monthYearKey][dayKey] = {
                // Corrected Date Format - No UPPERCASE
                dayHeader: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' }),
                dayNetTotal: 0,
                transactions: []
             };
        }
        acc[monthYearKey][dayKey].dayNetTotal += (t.type === 'income' ? t.amount : -t.amount);
        acc[monthYearKey][dayKey].transactions.push(t);
        return acc;
    }, {});

    allGroupElements.forEach(groupEl => {
        const monthKey = groupEl.dataset.monthKey;
        const listContainer = groupEl.querySelector('.transaction-group-list .horizontal-stream-container'); // Target correct container
        if (!listContainer || !groupedByDay[monthKey]) {
            listContainer.innerHTML = '<p class="p-4 text-center text-text-secondary">No transactions found for this month.</p>';
            return;
        }

        const daysInMonth = groupedByDay[monthKey];
        const sortedDayKeys = Object.keys(daysInMonth).sort((a, b) => b.localeCompare(a));

        let dayColumnsHtml = '';
        sortedDayKeys.forEach((dayKey, dayIndex) => {
            const dayGroup = daysInMonth[dayKey];
            const dayNetPositive = dayGroup.dayNetTotal >= 0;
            const dayNetTotalFormatted = `${dayNetPositive ? '+' : '-'}₹${Math.abs(dayGroup.dayNetTotal).toLocaleString('en-IN')}`;
            const dayNetTotalColor = dayNetPositive ? 'text-positive-value' : 'text-negative-value';

            const transactionCardsHtml = dayGroup.transactions
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .map(t => {
                    const account = accounts.find(a => a.id === t.accountId);
                    const isPositive = t.type === 'income';
                    const amountFormatted = `${isPositive ? '+' : '-'}₹${t.amount.toLocaleString('en-IN')}`;
                    const iconSvg = getCategoryIcon(t.description);
                    // Date removed from here in the previous step - CORRECT

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
                        </a>`;
                }).join('');

             dayColumnsHtml += `
                <div class="day-column" style="animation-delay: ${dayIndex * 50}ms">
                    <div class="day-header">
                        <h4 class="font-heading">${dayGroup.dayHeader}</h4> 
                        <span class="mono ${dayNetTotalColor}">${dayNetTotalFormatted}</span> 
                    </div>
                    <div class="day-stream">
                        ${transactionCardsHtml}
                    </div>
                </div>`;
        });

        // Set the final HTML for the horizontal container
        listContainer.innerHTML = dayColumnsHtml;
    });
}