// src/js/utils/ui/transactions.js
import { elements } from './domElements.js';
// Correctly import the function that returns an ID
import { getIconIdForDescription } from '../categoryMapper.js';
import { toggleModal } from './common.js';
import { setSelectedTags } from './tags.js';
import { setSelectedCategory } from './categorySelect.js';

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

    const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
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
            <p class="insight-list-text">Earned <strong class="positive">₹${totalEarned.toLocaleString('en-IN')}</strong> | Spent <strong class="negative">₹${totalSpent.toLocaleString('en-IN')}</strong></p>
        </div>
    `;

    // Top Category
    if (thisMonthExpenses.length > 0) {
        // Use categoryId for accurate grouping
        const categoryTotals = thisMonthExpenses.reduce((acc, t) => {
            const categoryId = t.categoryId || 'cat-uncategorized';
            const categoryName = appState.categories.find(c => c.id === categoryId)?.name || 'Uncategorized';
            acc[categoryName] = (acc[categoryName] || 0) + t.amount;
            return acc;
        }, {});
        const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
        const topCategory = sortedCategories[0];
        html += `
            <div class="insight-list-item">
                <h4 class="insight-list-title">Top Category</h4>
                <p class="insight-list-text"><strong>${topCategory[0]}</strong> leads spending at <strong>₹${topCategory[1].toLocaleString('en-IN')}</strong>.</p>
            </div>
        `;
    }

    // Largest Purchase
    if (thisMonthExpenses.length > 0) {
        const largestExpense = [...thisMonthExpenses].sort((a, b) => b.amount - a.amount)[0];
        html += `
            <div class="insight-list-item">
                <h4 class="insight-list-title">Largest Purchase</h4>
                <p class="insight-list-text"><strong>₹${largestExpense.amount.toLocaleString('en-IN')}</strong> for <strong>${largestExpense.description}</strong>.</p>
            </div>
        `;
    }

    // Spending Pace
    if (lastMonthSpent > 0 && totalSpent >= 0) {
        const percentChange = lastMonthSpent === 0 ? 100 : Math.round(((totalSpent - lastMonthSpent) / lastMonthSpent) * 100);
        const isDown = percentChange <= 0;
        html += `
             <div class="insight-list-item">
                <h4 class="insight-list-title">Spending Pace</h4>
                <p class="insight-list-text">
                    Spending is <strong class="${isDown ? 'positive' : 'negative'}">${isDown ? 'down' : 'up'} ${Math.abs(percentChange)}%</strong> vs last month.
                </p>
            </div>
        `;
    }

    // Zero State for Insights
    if (thisMonthTransactions.length === 0) {
         html = `
            <div class="insight-list-item">
                <h4 class="insight-list-title">Monthly Briefing</h4>
                <p class="insight-list-text">No transactions yet this month. Add one to see insights.</p>
            </div>
        `;
    }
    container.innerHTML = html;
}

// --- Transaction Modal Functions ---
export function showTransactionModal(appState, transactionToEdit = null) {
    // --- 1. Handle Zero State ---
    if (appState.accounts.length === 0) {
        elements.transactionFormWrapper?.classList.add('hidden');
        elements.transactionZeroState?.classList.remove('hidden');
    } else {
        elements.transactionZeroState?.classList.add('hidden');
        elements.transactionFormWrapper?.classList.remove('hidden');
        // --- 2. Populate Account Dropdown (Including Cash) ---
        populateAccountDropdown(appState.accounts);
    }


    // --- 4. Get Form Elements ---
    const modalTitle = document.getElementById('transactionModalTitle');
    const form = document.getElementById('transactionForm');
    const submitBtn = document.getElementById('transactionSubmitBtn');

    // --- 5. Handle Edit vs. Add Mode ---
    if (transactionToEdit) {
        // --- EDIT MODE ---
        if(modalTitle) modalTitle.textContent = 'Edit Transaction';
        if(submitBtn) submitBtn.textContent = 'Save Changes';

        if(form) {
            form.elements.id.value = transactionToEdit.id;
            form.elements.accountId.value = transactionToEdit.accountId;
            form.elements.description.value = transactionToEdit.description;
            form.elements.amount.value = transactionToEdit.amount;
            const typeRadio = form.querySelector(`input[name="type"][value="${transactionToEdit.type}"]`);
            if (typeRadio) typeRadio.checked = true;

            setSelectedTags(transactionToEdit.tagIds || []);
            setSelectedCategory(transactionToEdit.categoryId || 'cat-uncategorized'); // <-- SET CATEGORY
        }
    } else {
        // --- ADD MODE ---
        if(modalTitle) modalTitle.textContent = 'Add Transaction';
        if(submitBtn) submitBtn.textContent = 'Add Transaction';
        if(form) {
            form.reset();
            form.elements.id.value = '';
            form.elements.categoryId.value = 'cat-uncategorized';
            const expenseRadio = form.querySelector('input[name="type"][value="expense"]');
            if (expenseRadio) expenseRadio.checked = true;
            setSelectedTags([]);
            setSelectedCategory('cat-uncategorized'); // Clear tags for new transaction
        }
    }

    // --- 6. Reset View Switcher to Manual ---
    const manualViewEl = document.getElementById('manual-entry-view');
    const importViewEl = document.getElementById('import-view');
    const manualRadio = document.getElementById('modeManual');
    if(manualRadio) manualRadio.checked = true;
    if(manualViewEl) manualViewEl.classList.add('active-view');
    if(importViewEl) importViewEl.classList.remove('active-view');

    // --- 7. Show Modal ---
    toggleModal('transactionModal', true);
}


// --- Modified populateAccountDropdown to include "Cash" ---
export function populateAccountDropdown(accounts) {
    const accountSelect = document.getElementById('transactionAccount');
    if (!accountSelect) return;

    const sortedAccounts = [...accounts].sort((a, b) => a.name.localeCompare(b.name));
    let optionsHtml = sortedAccounts.map(account =>
        `<option value="${account.id}">${account.name} (Current: ₹${account.balance.toLocaleString('en-IN')})</option>`
    ).join('');

    optionsHtml += `<option value="cash">Cash</option>`;
    accountSelect.innerHTML = optionsHtml;
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

    // Group by Month-Year for headers
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

    // Render Accordion Structure
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
                    Loading transactions... </div>
            </div>
        `;
        container.appendChild(groupEl);
    });
}

// --- Populates the transaction data asynchronously ---
// *** This is the function that had the first error ***
export function loadTransactionData(transactions, accounts, categories = [], tags = []) {
    const allGroupElements = document.querySelectorAll('#transactionList .transaction-group');
    if (allGroupElements.length === 0 || transactions.length === 0) return;

    // Group all transactions by Month AND Day
    const groupedByDay = transactions.reduce((acc, t) => {
        const date = new Date(t.date);
        const monthYearKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const dayKey = date.toISOString().split('T')[0];

        if (!acc[monthYearKey]) acc[monthYearKey] = {};
        if (!acc[monthYearKey][dayKey]) {
             acc[monthYearKey][dayKey] = {
                dayHeader: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' }),
                dayNetTotal: 0,
                transactions: []
             };
        }
        acc[monthYearKey][dayKey].dayNetTotal += (t.type === 'income' ? t.amount : -t.amount);
        acc[monthYearKey][dayKey].transactions.push(t);
        return acc;
    }, {});

    // Iterate through rendered month groups and populate content
    allGroupElements.forEach(groupEl => {
        const monthKey = groupEl.dataset.monthKey;
        const listContainer = groupEl.querySelector('.transaction-group-list .horizontal-stream-container');
        if (!listContainer || !groupedByDay[monthKey]) {
            if (listContainer) listContainer.innerHTML = '<p class="p-4 text-center text-text-secondary">No transactions found for this month.</p>';
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

            // Build transaction cards HTML for this day
            const transactionCardsHtml = dayGroup.transactions
                .sort((a, b) => new Date(b.date) - new Date(a.date)) // Sort transactions within the day
                .map(t => {
                    // Find account (handle 'cash' properly)
                    const account = t.accountId === 'cash' ? { name: 'Cash', type: 'Cash' } : accounts.find(a => a.id === t.accountId);
                    
                    // Find category (use Uncategorized as fallback)
                    const category = categories.find(c => c.id === t.categoryId) || categories.find(c => c.id === 'cat-uncategorized');
                    const categoryName = category?.name || 'Uncategorized';
                    const iconId = category?.iconId || '#icon-default'; // Use category's iconId or default

                    const isPositive = t.type === 'income';
                    const amountFormatted = `${isPositive ? '+' : '-'}₹${t.amount.toLocaleString('en-IN')}`;
                    const amountColor = isPositive ? 'text-positive-value' : 'text-negative-value';

                    // Generate tag color dots
                    const tagColorsHtml = (t.tagIds || [])
                        .map(tagId => tags.find(tag => tag.id === tagId)?.color)
                        .filter(Boolean) // Ensure color exists
                        // Use smaller dots for a cleaner look
                        .map(color => `<span class="inline-block w-1.5 h-1.5 rounded-full" style="background-color: ${color}"></span>`) 
                        .join('');

                    // --- NEW CARD HTML STRUCTURE ---
                    return `
                        <a href="#" class="transaction-card group" data-transaction-id="${t.id}">
                         
                            <div class="transaction-icon-wrapper flex-shrink-0">
                                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                                    <use href="${iconId}"></use>
                                </svg>
                            </div>
                            
                            <div class="flex-1 min-w-0">
                                <p class="font-semibold text-text-primary text-sm truncate">${t.description}</p>
                                <div class="flex items-center gap-1.5 mt-1 text-xs text-text-secondary">
                                    <span>${categoryName}</span>
                                   
                                    ${tagColorsHtml ? `
                                        <div class="flex gap-1 items-center ml-1">
                                            ${tagColorsHtml}
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                            
                            <div class="text-right flex-shrink-0">
                                <p class="font-semibold mono text-sm ${amountColor}">
                                    ${amountFormatted}
                                </p>
                                
                                <p class="text-xs text-text-secondary mt-1 truncate group-hover:text-text-primary transition-colors"> 
                                    ${account ? account.name : 'Unknown'}
                                </p>
                            </div>
                        </a>`;
                }).join('');

             // Assemble the Day Column HTML
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

        // Inject the generated day columns HTML into the list container
        if(listContainer) listContainer.innerHTML = dayColumnsHtml;
    });
}