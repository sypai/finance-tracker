import { elements } from './domElements.js';
import { toggleModal } from './common.js';

function renderDashboardInvestmentList(investments) {
    // This function now *only* handles rendering the list of holdings
    if (!elements.investmentAccountsList || !elements.investmentsLastUpdated) return;

    const holdingsHtml = investments.map(holding => {
        const changeColor = holding.isPositive ? 'text-positive-value' : 'text-negative-value';
        const changeSign = holding.isPositive ? '+' : '';
        return `
        <div class="flex justify-between items-center py-2">
            <div>
                <h4 class="font-semibold text-white">${holding.name}</h4>
                <p class="text-sm text-gray-400">${holding.type}</p>
            </div>
            <div class="text-right">
                <div class="font-semibold text-white">₹${holding.value.toLocaleString('en-IN')}</div>
                <div class="text-sm ${changeColor}">${changeSign}${holding.change}%</div>
            </div>
        </div>`;
    }).join('');

    elements.investmentAccountsList.innerHTML = `<div class="space-y-3 pt-6 mt-6 border-t border-white/5">${holdingsHtml}</div>`;
    elements.investmentsLastUpdated.textContent = 'Last updated: 5 mins ago';
}

// This is the new master function that controls the entire card's view
export function renderInvestmentCard(appState) {
    const normalView = elements.investmentPortfolioNormalView;
    const zeroStateView = elements.investmentPortfolioZeroState;

    if (appState.investments.length === 0) {
        // ZERO STATE VIEW
        normalView.classList.add('hidden');
        zeroStateView.classList.remove('hidden');
        
        zeroStateView.innerHTML = `
            <div class="text-center">
                <svg class="h-12 w-12 mx-auto mb-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
                <h3 class="text-xl font-semibold text-white">See Your Whole Portfolio</h3>
                <p class="text-sm text-gray-400 mt-2 mb-6">Add your existing investments from stocks, funds, and crypto to track them all in one place.</p>
                <button data-tab-link="investments" class="btn btn-secondary">See your growth</button>    
            </div>
        `;
    } else {
        // NORMAL VIEW
        zeroStateView.classList.add('hidden');
        normalView.classList.remove('hidden');
        
        renderDashboardInvestmentList(appState.investments);
    }
}

export function renderInvestmentsTab(investments) {
    const investmentsContainer = elements.investmentAccountList;
    if (investments.length === 0) {
        investmentsContainer.innerHTML = `
        <div class="empty-state card p-8 text-center text-gray-400 col-span-full">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6M3 4h18a2 2 0 012 2v12a2 2 0 01-2 2H3a2 2 0 01-2-2V6a2 2 0 012-2z" /></svg>
        <p class="text-lg font-semibold">No Investment Portfolios added</p>
        <p class="text-sm mt-1 mb-6">Add a portfolio to start tracking your investments across all accounts.</p>
        </div>
        `;
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
                <p class="text-2xl font-semibold ${valueColor}">₹${investment.value.toLocaleString('en-IN')}</p>
                <p class="text-xs ${valueColor}">${changeSign}${investment.change}%</p>
            </div>
        </div>
        `;
    }).join('');
    elements.investmentAccountList.innerHTML = investmentListHtml;
}

// FIX: Export this function so it can be used in app.js
export function createHoldingRow() {
    const row = document.createElement('div');
    row.className = 'grid grid-cols-5 gap-3 items-center'; // Updated grid for remove button
    row.innerHTML = `
        <input type="text" name="holdingName" class="form-input col-span-2" placeholder="e.g., Reliance Stock" required>
        <input type="number" step="0.01" name="holdingValue" class="form-input col-span-2" placeholder="Value (₹)" required>
        <button type="button" class="remove-holding-btn text-red-400 hover:text-red-600 text-xs">Remove</button>
    `;
    return row;
}

// This function shows and sets up the portfolio modal
export function showPortfolioModal() {
    const holdingsContainer = document.getElementById('holdingsContainer');
    if (!holdingsContainer) return;

    // Add the first row automatically when the modal opens
    holdingsContainer.innerHTML = ''; // Clear previous rows
    holdingsContainer.appendChild(createHoldingRow());

    toggleModal('addPortfolioModal', true);
}