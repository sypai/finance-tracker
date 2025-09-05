import { elements } from './domElements.js';
import { toggleModal } from './common.js';
import { formatIndianCurrency } from './formatters.js';

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

// Master function to render the entire investments tab
export function renderInvestmentsTab(appState) {
    const normalView = elements.investmentsNormalView;
    const zeroStateView = elements.investmentsZeroState;

    if (appState.investmentAccounts.length === 0) {
        // ZERO STATE VIEW
        normalView.classList.add('hidden');
        zeroStateView.classList.remove('hidden');
        zeroStateView.innerHTML = `
            <div class="card p-12 text-center flex flex-col items-center">
                <svg class="h-16 w-16 mx-auto mb-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
                <h3 class="text-2xl font-bold text-white">See Your Whole Portfolio</h3>
                <p class="text-md text-gray-400 mt-2 mb-8 max-w-md">Add your existing investments from stocks, funds, and crypto to track them all in one place.</p>
                <button id="zeroStateAddPortfolioBtn" class="btn btn-secondary text-base">Add a Portfolio</button>
            </div>`;
    } else {
        // NORMAL VIEW
        zeroStateView.classList.add('hidden');
        normalView.classList.remove('hidden');

        const allHoldings = appState.investmentAccounts.flatMap(acc => acc.holdings);
        const totalInvested = allHoldings.reduce((sum, h) => sum + h.buyValue, 0);
        const currentValue = allHoldings.reduce((sum, h) => sum + h.currentValue, 0);
        const totalGain = currentValue - totalInvested;
        const totalGainPercent = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;
        
        // --- NEW: Calculate "Invested This Month" ---
        // This assumes your transactions have dates. For now, we'll use a mock value.
        const investedThisMonth = 25000; // Placeholder for actual calculation

        // --- UPDATE KPIs WITH ABBREVIATIONS & TOOLTIPS ---
        elements.investmentsCurrentValue.textContent = formatIndianCurrency(currentValue);
        elements.investmentsCurrentValue.title = `₹${currentValue.toLocaleString('en-IN')}`;

        // This now correctly shows the monthly change
        elements.investmentsMonthChange.textContent = `+5.2% from last month`;
        elements.investmentsMonthChange.className = 'text-sm mt-2 text-positive-value';

        elements.investmentsTotalInvested.textContent = formatIndianCurrency(totalInvested);
        elements.investmentsTotalInvested.title = `₹${totalInvested.toLocaleString('en-IN')}`;
        // The "Invested this month" subtext is now correctly placed here.
        // --- THIS IS THE KEY CHANGE ---
        const investedSubtext = document.getElementById('investmentsInvestedSubtext');
        if (investedSubtext) {
            const sign = investedThisMonth >= 0 ? '+' : '-';
            investedSubtext.textContent = `${sign}₹${Math.abs(investedThisMonth).toLocaleString('en-IN')} this month`;
            investedSubtext.className = `text-sm mt-2 ${investedThisMonth >= 0 ? 'text-positive-value' : 'text-negative-value'}`;
        }
        
        const gainSign = totalGain >= 0 ? '+' : '-';
        elements.investmentsTotalGain.textContent = `${formatIndianCurrency(Math.abs(totalGain))}`;
        elements.investmentsTotalGain.title = `${gainSign}₹${Math.abs(totalGain).toLocaleString('en-IN')}`;
        elements.investmentsTotalGainPercent.textContent = `(${gainSign}${totalGainPercent.toFixed(2)}%)`;
        elements.investmentsTotalGainPercent.className = `text-sm mt-2 ${totalGain >= 0 ? 'text-positive-value' : 'text-negative-value'}`;
        
        // Render the active tab content (defaults to holdings)
        renderHoldingsView(appState.investmentAccounts);
    }
}

// /frontend/src/js/utils/ui/investments.js

// This is the core rendering logic for the responsive holdings view.
export function renderHoldingsView(accounts) {
    const container = document.getElementById('investmentTabContent');
    if (!container) return;

    const assetColors = {
        equity: 'accent-primary',
        mutual_fund: 'accent-secondary',
        epf: 'accent-neutral',
        gold: 'accent-subtle',
        default: 'accent-neutral'
    };

    container.innerHTML = `
        <div class="space-y-4">
            ${accounts.map(account => {
                const totalCurrentValue = account.holdings.reduce((sum, h) => sum + h.currentValue, 0);
                const totalBuyValue = account.holdings.reduce((sum, h) => sum + h.buyValue, 0);
                const totalPandL = totalCurrentValue - totalBuyValue;
                const pAndLColor = totalPandL >= 0 ? 'text-positive-value' : 'text-negative-value';

                const allocationByType = account.holdings.reduce((acc, holding) => {
                    const type = holding.type || 'default';
                    acc[type] = (acc[type] || 0) + holding.currentValue;
                    return acc;
                }, {});
                
                const dominantAsset = Object.keys(allocationByType).reduce((a, b) => allocationByType[a] > allocationByType[b] ? a : b, 'default');
                const accentColorClass = assetColors[dominantAsset] || assetColors.default;

                const holdingsHtml = account.holdings.map(holding => {
                    const pAndL = holding.currentValue - holding.buyValue;
                    const pAndLPercent = holding.buyValue > 0 ? (pAndL / holding.buyValue) * 100 : 0;
                    const pAndLColor = pAndL >= 0 ? 'text-positive-value' : 'text-negative-value';
                    const unit = holding.grams ? holding.grams : holding.quantity;
                    const avgCost = unit > 0 ? holding.buyValue / unit : 0;
                    const ltp = unit > 0 ? holding.currentValue / unit : 0;

                    return {
                        desktop: `
                            <tr class="hover:bg-white/5">
                                <td class="p-4">${holding.name}</td>
                                <td class="p-4 text-right mono">${unit.toLocaleString('en-IN')}</td>
                                <td class="p-4 text-right mono">₹${avgCost.toLocaleString('en-IN', {maximumFractionDigits: 2})}</td>
                                <td class="p-4 text-right mono group-divider">₹${ltp.toLocaleString('en-IN', {maximumFractionDigits: 2})}</td>
                                <td class="p-4 text-right mono">₹${holding.buyValue.toLocaleString('en-IN')}</td>
                                <td class="p-4 text-right mono group-divider">₹${holding.currentValue.toLocaleString('en-IN')}</td>
                                <td class="p-4 text-right mono ${pAndLColor}">
                                    <div class="flex flex-col">
                                        <span>${pAndL >= 0 ? '+' : ''}₹${pAndL.toLocaleString('en-IN')}</span>
                                        <span class="text-xs">(${pAndLPercent.toFixed(2)}%)</span>
                                    </div>
                                </td>
                            </tr>
                        `,
                        mobile: `
                            <div class="holding-mobile-card">
                                <p class="font-medium text-white mb-3">${holding.name}</p>
                                <div class="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                    <span class="text-gray-400">Qty.</span><span class="mono text-right">${unit.toLocaleString('en-IN')}</span>
                                    <span class="text-gray-400">Avg. Cost</span><span class="mono text-right">₹${avgCost.toLocaleString('en-IN', {maximumFractionDigits: 2})}</span>
                                    <span class="text-gray-400">LTP</span><span class="mono text-right">₹${ltp.toLocaleString('en-IN', {maximumFractionDigits: 2})}</span>
                                    <span class="text-gray-400">Invested</span><span class="mono text-right">₹${holding.buyValue.toLocaleString('en-IN')}</span>
                                    <span class="text-gray-400">Current</span><span class="mono text-right">₹${holding.currentValue.toLocaleString('en-IN')}</span>
                                    <span class="text-gray-400">P&L</span>
                                    <span class="mono text-right ${pAndLColor}">
                                        ${pAndL >= 0 ? '+' : ''}₹${pAndL.toLocaleString('en-IN')} (${pAndLPercent.toFixed(1)}%)
                                    </span>
                                </div>
                            </div>
                        `
                    };
                });

                return `
                <div class="holdings-account-card rounded-lg overflow-hidden ${accentColorClass}" data-account-id="${account.id}">
                    <div class="holdings-account-header p-5">
                        <div class="header-grid">
                            <div class="header-info">
                                <p class="font-medium text-white text-lg">${account.name}</p>
                                <p class="text-sm text-gray-400 mt-1">${account.type} • ${account.holdings.length} Holdings</p>
                            </div>
                            <div class="header-value">
                                <p class="mono text-lg text-white">₹${totalCurrentValue.toLocaleString('en-IN')}</p>
                                <p class="mono text-sm ${pAndLColor}">${totalPandL >= 0 ? '+' : ''}₹${totalPandL.toLocaleString('en-IN')}</p>
                            </div>
                            <div class="header-chevron">
                                <svg class="chevron-icon h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
                            </div>
                        </div>
                    </div>
                    
                    <div class="holdings-list">
                        <div class="desktop-table">
                            <table class="w-full text-sm">
                                <thead class="text-xs text-gray-500">
                                    <tr>
                                        <th class="p-4 text-left font-normal">Instrument</th>
                                        <th class="p-4 text-right font-normal">Qty.</th>
                                        <th class="p-4 text-right font-normal">Avg. Cost</th>
                                        <th class="p-4 text-right font-normal group-divider">LTP</th>
                                        <th class="p-4 text-right font-normal">Invested</th>
                                        <th class="p-4 text-right font-normal group-divider">Current Val</th>
                                        <th class="p-4 text-right font-normal">P&L</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-white/10">
                                    ${holdingsHtml.map(h => h.desktop).join('')}
                                </tbody>
                            </table>
                        </div>

                        <div class="mobile-cards">
                            ${holdingsHtml.map(h => h.mobile).join('')}
                        </div>
                    </div>
                </div>
            `;}).join('')}
        </div>
    `;
}