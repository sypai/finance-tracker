// src/js/utils/ui/dashboard.js
import { elements } from './domElements.js';
import { formatIndianCurrency } from './formatters.js';

/**
 * Updates the main dashboard metrics using data from the app state.
 * @param {object} appState The central state object of the application.
 */
export function updateDashboardMetrics(appState) {

    const hasData = appState.accounts.length > 0 || appState.investments.length > 0;

    if (!hasData) {
        elements.netWorthValue.textContent = '₹0';
        elements.monthlyExpensesValue.textContent = '₹0';
        elements.investmentsValue.textContent = '₹0';
        elements.netWorthChange.innerHTML = `<span>Add an account to begin.</span>`;
        elements.monthlyExpensesChange.innerHTML = `<span>No transactions yet.</span>`;
        elements.investmentsChange.innerHTML = `<span>No investments added.</span>`;
        return;
    }
    // Calculate the primary values from the state
    const totalNetWorth = appState.accounts.reduce((sum, acc) => sum + acc.balance, 0) + appState.investments.reduce((sum, inv) => sum + inv.value, 0);
    const monthlyExpenses = appState.transactions
        .filter(t => t.type === 'expense' && new Date(t.date).getMonth() === new Date().getMonth())
        .reduce((sum, t) => sum + t.amount, 0);
    const totalInvestments = appState.investments.reduce((sum, inv) => sum + inv.value, 0);

    // --- FIX APPLIED HERE ---
    // Update dashboard values using the abbreviation function for display
    // and the `title` attribute to show the full value on hover.

    elements.netWorthValue.textContent = formatIndianCurrency(totalNetWorth);
    elements.netWorthValue.title = `₹${totalNetWorth.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;

    elements.monthlyExpensesValue.textContent = formatIndianCurrency(monthlyExpenses);
    elements.monthlyExpensesValue.title = `₹${monthlyExpenses.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
    
    elements.investmentsValue.textContent = formatIndianCurrency(totalInvestments);
    elements.investmentsValue.title = `₹${totalInvestments.toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
    
    // This part for percentage change remains the same
    const changeData = {
        netWorth: { value: 8.2, isPositive: true },
        expenses: { value: 12.1, isPositive: false },
        investments: { value: 18.5, isPositive: true }
    };

    const updateChangeElement = (element, data) => {
        element.className = `mt-4 text-sm font-medium flex items-center ${data.isPositive ? 'text-positive-value' : 'text-negative-value'}`;
        element.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1">
                ${data.isPositive 
                    ? '<polyline points="23,6 13.5,15.5 8.5,10.5 1,18"/><polyline points="17,6 23,6 23,12"/>' 
                    : '<polyline points="23,18 13.5,8.5 8.5,13.5 1,6"/><polyline points="17,18 23,18 23,12"/>'}
            </svg>
            +${data.value}% from last month
        `;
    };

    updateChangeElement(elements.netWorthChange, changeData.netWorth);
    updateChangeElement(elements.monthlyExpensesChange, changeData.expenses);
    updateChangeElement(elements.investmentsChange, changeData.investments);
}