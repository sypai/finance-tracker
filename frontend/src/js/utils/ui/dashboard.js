// src/js/utils/ui/dashboard.js
import { elements } from './domElements.js';
import { formatIndianCurrency } from './formatters.js';

/**
 * A helper function to set a metric value that can be toggled on mobile.
 * It sets the text to the abbreviated version and stores both versions in data attributes.
 * @param {HTMLElement} element The DOM element to update.
 * @param {number} value The numerical value to display.
 */
function setToggableMetric(element, value) {
    if (!element) return;

    const fullValue = `₹${value.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    const abbreviatedValue = formatIndianCurrency(value);

    // Set the initial text content
    element.textContent = abbreviatedValue;
    
    // Store both versions in data attributes for the toggle functionality
    element.dataset.full = fullValue;
    element.dataset.abbreviated = abbreviatedValue;
    
    // Add the class that our app.js click listener targets
    element.classList.add('toggable-metric');
    
    // Also set the title attribute for the desktop hover tooltip
    element.title = fullValue;
}

// /**
//  * NEW: Animates a number from start to end with formatting.
//  * @param {HTMLElement} element - The DOM element to update.
//  * @param {number} start - The starting number.
//  * @param {number} end - The final number.
//  * @param {number} duration - Animation duration in ms.
//  * @param {function} formatter - The function to format the value (e.g., formatIndianCurrency).
//  */
// function animateValue(element, start, end, duration, formatter) {
//     if (!element) return;
//     let startTime = null;

//     // Helper to format the final display text
//     const formatFinalText = (val) => formatter ? formatter(val) : `₹${val.toLocaleString('en-IN')}`;

//     const step = (timestamp) => {
//         if (!startTime) startTime = timestamp;
//         const progress = Math.min((timestamp - startTime) / duration, 1);
//         const currentNum = Math.floor(progress * (end - start) + start);
        
//         // Update text content on each frame
//         element.textContent = formatFinalText(currentNum);

//         if (progress < 1) {
//             window.requestAnimationFrame(step);
//         } else {
//             // Animation finished. Set the final, precise values.
//             setToggableMetric(element, end); // Use your existing function to set final state
//         }
//     };
//     window.requestAnimationFrame(step);
// }

/**
 * Updates the main dashboard metrics using data from the app state.
 * @param {object} appState The central state object of the application.
 */
export function updateDashboardMetrics(appState) {
    const hasData = appState.accounts.length > 0 || appState.investments.length > 0;

    if (!hasData) {
        // ... (zero state logic is unchanged)
        return;
    }

    // Calculate the primary values from the state
    const totalNetWorth = appState.accounts.reduce((sum, acc) => sum + acc.balance, 0) + appState.investments.reduce((sum, inv) => sum + inv.value, 0);
    const monthlyExpenses = appState.transactions
        .filter(t => t.type === 'expense' && new Date(t.date).getMonth() === new Date().getMonth())
        .reduce((sum, t) => sum + t.amount, 0);
    const totalInvestments = appState.investments.reduce((sum, inv) => sum + inv.value, 0);

    // Update dashboard values using our new helper function
    setToggableMetric(elements.netWorthValue, totalNetWorth);
    setToggableMetric(elements.monthlyExpensesValue, monthlyExpenses);
    setToggableMetric(elements.investmentsValue, totalInvestments);
    
    // --- (The percentage change logic remains the same) ---
    // (This part would ideally fetch real data)
    const changeData = {
        netWorth: { value: 8.2, isPositive: true },
        expenses: { value: 12.1, isPositive: false },
        investments: { value: 18.5, isPositive: true }
    };

    const updateChangeElement = (element, data) => {
        element.className = `mt-2 text-sm font-medium flex items-center ${data.isPositive ? 'text-positive-value' : 'text-negative-value'}`;
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