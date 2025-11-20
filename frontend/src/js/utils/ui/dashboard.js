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
// export function updateDashboardMetrics(appState) {
    
//     // --- THIS IS THE FIX (Line 1) ---
//     const hasData = appState.accounts.length > 0 || appState.investmentAccounts.length > 0;

//     if (hasData) {
//         // --- THIS IS THE FIX (Line 2) ---
//         // Calculate the primary values from the state
//         const totalNetWorth = appState.accounts.reduce((sum, acc) => sum + acc.balance, 0) + 
//                               appState.investmentAccounts.flatMap(inv => inv.holdings).reduce((sum, h) => sum + h.currentValue, 0); // Use correct state
        
//         const monthlyExpenses = appState.transactions
//             .filter(t => t.type === 'expense' && new Date(t.date).getMonth() === new Date().getMonth())
//             .reduce((sum, t) => sum + t.amount, 0);
        
//         // --- THIS IS THE FIX (Line 3) ---
//         const totalInvestments = appState.investmentAccounts.flatMap(inv => inv.holdings)
//             .reduce((sum, h) => sum + h.currentValue, 0); // Use correct state

//         // Update dashboard values using our new helper function
//         setToggableMetric(elements.netWorthValue, totalNetWorth);
//         setToggableMetric(elements.monthlyExpensesValue, monthlyExpenses);
//         setToggableMetric(elements.investmentsValue, totalInvestments);
        
//         // ... (percentage change logic remains the same) ...
//         // (This part would ideally fetch real data)
//         const changeData = {
//             netWorth: { value: 8.2, isPositive: true },
//             expenses: { value: 12.1, isPositive: false },
//             investments: { value: 18.5, isPositive: true }
//         };

//         const updateChangeElement = (element, data) => {
//             if (!element) return; // Add safety check
//             element.className = `mt-2 text-sm font-medium flex items-center ${data.isPositive ? 'text-positive-value' : 'text-negative-value'}`;
//             // ... (innerHTML remains the same)
//         };

//         updateChangeElement(elements.netWorthChange, changeData.netWorth);
//         updateChangeElement(elements.monthlyExpensesChange, changeData.expenses);
//         updateChangeElement(elements.investmentsChange, changeData.investments);

//     } else {
//         // --- THIS IS THE FIX (Line 4) - ADD THIS ENTIRE ELSE BLOCK ---
        
//         // Set all KPIs to a "zero" state
//         if(elements.netWorthValue) elements.netWorthValue.textContent = "₹0";
//         if(elements.monthlyExpensesValue) elements.monthlyExpensesValue.textContent = "₹0";
//         if(elements.investmentsValue) elements.investmentsValue.textContent = "₹0";

//         // Clear the percentage change text
//         if(elements.netWorthChange) elements.netWorthChange.innerHTML = "";
//         if(elements.monthlyExpensesChange) elements.monthlyExpensesChange.innerHTML = "";
//         if(elements.investmentsChange) elements.investmentsChange.innerHTML = "";
//     }
// }

/**
 * Updates the main dashboard metrics using data from the app state.
 * @param {object} appState The central state object of the application.
 */
export function updateDashboardMetrics(appState) {
    
    // FIX: Use investmentAccounts and check if any holdings exist
    const hasData = appState.accounts.length > 0 || appState.investmentAccounts.flatMap(i => i.holdings).length > 0;

    // --- Subtext/Change Data (Placeholder logic is fine) ---
    const changeData = {
        netWorth: { value: 8.2, isPositive: true, text: 'from last month' },
        expenses: { value: 12.1, isPositive: false, text: 'from last month' },
        investments: { value: 18.5, isPositive: true, text: 'from last month' }
    };

    // --- Helper to render the subtext/change element ---
    const updateChangeElement = (element, data) => {
        if (!element) return;
        
        // This is where we ensure the subtext is rendered when data exists.
        element.className = `mt-2 text-sm font-medium flex items-center ${data.isPositive ? 'text-positive-value' : 'text-negative-value'}`;
        element.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-1">
                ${data.isPositive 
                    ? '<polyline points="23,6 13.5,15.5 8.5,10.5 1,18"/><polyline points="17,6 23,6 23,12"/>' 
                    : '<polyline points="23,18 13.5,8.5 8.5,13.5 1,6"/><polyline points="17,18 23,18 23,12"/>'}
            </svg>
            ${data.isPositive ? '+' : ''}${data.value}% ${data.text}
        `;
    };
    
    if (hasData) {
        
        const allHoldings = appState.investmentAccounts.flatMap(inv => inv.holdings);
        const totalInvestments = allHoldings.reduce((sum, h) => sum + h.currentValue, 0);
        
        // FIX: Use totalInvestments in Net Worth calculation
        const totalNetWorth = appState.accounts.reduce((sum, acc) => sum + acc.balance, 0) + totalInvestments;
        
        const currentMonth = new Date().getMonth();
        const monthlyExpenses = appState.transactions
            .filter(t => t.type === 'expense' && new Date(t.date).getMonth() === currentMonth)
            .reduce((sum, t) => sum + t.amount, 0);

        // 1. Set the Metric Values (Initializes toggle behavior)
        setToggableMetric(elements.netWorthValue, totalNetWorth);
        setToggableMetric(elements.monthlyExpensesValue, monthlyExpenses);
        setToggableMetric(elements.investmentsValue, totalInvestments);
        
        // 2. Set the Subtexts
        updateChangeElement(elements.netWorthChange, changeData.netWorth);
        updateChangeElement(elements.monthlyExpensesChange, changeData.expenses);
        updateChangeElement(elements.investmentsChange, changeData.investments);

    } else {
        // --- ZERO STATE LOGIC (Fixed text, remove toggle behavior) ---
        
        // Set all KPIs to a "zero" state and explicitly remove the toggable class
        if(elements.netWorthValue) {
            elements.netWorthValue.textContent = "₹0";
            elements.netWorthValue.classList.remove('toggable-metric', 'is-expanded');
        }
        if(elements.monthlyExpensesValue) {
            elements.monthlyExpensesValue.textContent = "₹0";
            elements.monthlyExpensesValue.classList.remove('toggable-metric', 'is-expanded');
        }
        if(elements.investmentsValue) {
            elements.investmentsValue.textContent = "₹0";
            elements.investmentsValue.classList.remove('toggable-metric', 'is-expanded');
        }

        // Set static subtext
        if(elements.netWorthChange) elements.netWorthChange.innerHTML = `<span class="text-sm text-gray-500">Add your first account.</span>`;
        if(elements.monthlyExpensesChange) elements.monthlyExpensesChange.innerHTML = `<span class="text-sm text-gray-500">Track your spending.</span>`;
        if(elements.investmentsChange) elements.investmentsChange.innerHTML = `<span class="text-sm text-gray-500">See your portfolio growth.</span>`;
    }
}