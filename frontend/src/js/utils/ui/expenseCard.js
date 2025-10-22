// src/js/utils/ui/expenseCard.js
import { elements } from './domElements.js';

export function updateActiveTimelineTab(period) {
    elements.expenseTimelineTabs.querySelectorAll('button').forEach(btn => {
        const isActive = btn.dataset.period === period;
        btn.classList.toggle('active', isActive);
        if (isActive) {
            btn.classList.add('bg-white/10', 'text-white');
            btn.classList.remove('text-gray-400');
        } else {
            btn.classList.remove('bg-white/10', 'text-white');
            btn.classList.add('text-gray-400');
        }
    });

    if (period === 'week') elements.expenseAnalysisTitle.textContent = "This Week's Expenses";
    else if (period === 'month') elements.expenseAnalysisTitle.textContent = "This Month's Expenses";
    else elements.expenseAnalysisTitle.textContent = "This Year's Expenses";
}

function getTransactionsForPeriod(transactions, period = 'month') {
    const now = new Date();
    const currentYear = now.getFullYear();
    
    if (period === 'year') {
        return transactions.filter(t => new Date(t.date).getFullYear() === currentYear);
    }
    if (period === 'week') {
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return transactions.filter(t => new Date(t.date) >= oneWeekAgo);
    }
    // Default to month
    return transactions.filter(t => new Date(t.date).getMonth() === now.getMonth() && new Date(t.date).getFullYear() === currentYear);
}

export function renderExpenseAnalysisCard(appState) {
    const normalView = elements.expenseAnalysisNormalView;
    const zeroStateView = elements.expenseAnalysisZeroState;

    if (appState.accounts.length === 0 && appState.transactions.length === 0) {
        // ZERO STATE VIEW
        normalView.classList.add('hidden');
        zeroStateView.classList.remove('hidden');
        
        zeroStateView.innerHTML = `
            <div class="text-center">
                <svg class="h-12 w-12 mx-auto mb-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H4a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
                <h3 class="text-xl font-semibold text-white">See Where Your Money Goes</h3>
                <p class="text-sm text-gray-400 mt-2 mb-6">Add your existing bank accounts to automatically track your income and spending in one place.</p>
                <button data-tab-link="accounts" class="btn btn-secondary">Start Tracking</button>
            </div>
        `;
    } else {
        // NORMAL VIEW
        zeroStateView.classList.add('hidden');
        normalView.classList.remove('hidden');
        
        updateActiveTimelineTab(appState.activeExpensePeriod);
        renderExpenseList(appState.transactions, appState.activeExpensePeriod);
    }
}

export function renderExpenseList(transactions, period) {
    const container = elements.expenseInsightsList;
    const filteredExpenses = getTransactionsForPeriod(transactions, period).filter(t => t.type === 'expense');
    const chartContainer = elements.expenseChartContainer;
    
    if (filteredExpenses.length === 0) {
        chartContainer.classList.add('hidden');
        // Clear the list container and add the message
        container.innerHTML = `<p class="text-center text-text-secondary pt-8">No expenses recorded for this ${period}.</p>`;
        return;
    }
   
    const totalExpensesInPeriod = filteredExpenses.reduce((sum, t) => sum + t.amount, 0);

    const categoryTotals = filteredExpenses.reduce((acc, t) => {
        const category = t.description.split(' ')[0];
        acc[category] = (acc[category] || 0) + t.amount;
        return acc;
    }, {});

    const sortedExpenses = Object.entries(categoryTotals)
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount);

    const topN = 3;
    let finalExpenses = [];
    if (sortedExpenses.length > topN) {
        finalExpenses = sortedExpenses.slice(0, topN);
        const otherAmount = sortedExpenses.slice(topN).reduce((sum, item) => sum + item.amount, 0);
        if (otherAmount > 0) {
            finalExpenses.push({ category: 'Other', amount: otherAmount });
        }
    } else {
        finalExpenses = sortedExpenses;
    }
    
    chartContainer.classList.remove('hidden');
    
    // --- START: MODIFIED CODE ---

    // 1. Build the list of expenses with subdued colors and smaller fonts
    const listHTML = finalExpenses.map(item => {
        const percentage = totalExpensesInPeriod > 0 ? ((item.amount / totalExpensesInPeriod) * 100).toFixed(0) : 0;
        return `
            <div class="flex justify-between items-center">
                <p class="text-sm text-text-primary">${item.category}</p>
                <div class="text-right">
                    <span class="font-semibold text-text-metric mono text-sm">₹${item.amount.toLocaleString('en-IN')}</span>
                    <span class="text-xs text-text-secondary ml-2 w-10 inline-block text-right">(${percentage}%)</span>
                </div>
            </div>`;
    }).join('');

    // 2. Build the styled summary insight block (with icon)
    let summaryHTML = '';
    if (finalExpenses.length > 0) {
        const topCategory = finalExpenses[0];
        const topPercentage = totalExpensesInPeriod > 0 ? ((topCategory.amount / totalExpensesInPeriod) * 100).toFixed(0) : 0;
        
        summaryHTML = `
            <div class="mt-4 pt-4 border-t border-white/5">
                <div class="flex items-start gap-3">
                    <svg class="w-5 h-5 text-primary-accent flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m12.728 0l.707-.707M6.343 17.657l-.707.707m12.728 0l.707.707M12 21v-1m0-8a3 3 0 00-3 3h6a3 3 0 00-3-3z"></path>
                    </svg>
                    <div>
                        <p class="text-sm text-text-secondary">
                            Your top expense category this ${period} was <span class="font-semibold text-text-primary">${topCategory.category}</span>, making up ${topPercentage}% of the total.
                        </p>
                    </div>
                </div>
            </div>`;
    }

    // 3. Render list first, THEN summary
    container.innerHTML = listHTML + summaryHTML;

    // --- END: MODIFIED CODE ---
}