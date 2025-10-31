import { elements } from './domElements.js';
import { toggleModal } from './common.js';
import { formatIndianCurrency } from './formatters.js';

// (This function is unchanged)
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

// (This function is unchanged)
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

export function createHoldingRow(assetType = 'stock') {
    const row = document.createElement('div');
    // --- UPDATED: Responsive grid classes ---
    // Mobile: 6 cols with vertical gap. Desktop: 12 cols, no vertical gap.
    row.className = 'holding-input-row grid grid-cols-6 md:grid-cols-12 gap-x-3 gap-y-4 md:gap-y-0 md:gap-3 items-center';
    
    // Customize placeholders based on asset type
    let namePlaceholder = 'e.g., Reliance';
    let tickerPlaceholder = 'TICKER';
    let pricePlaceholder = 'Avg. Buy ₹';

    if (assetType === 'mutual_fund') {
        namePlaceholder = 'e.g., HDFC Mid Cap';
        tickerPlaceholder = 'Fund Ticker (Opt.)';
        pricePlaceholder = 'Avg. NAV';
    } else if (assetType === 'bond') {
        namePlaceholder = 'e.g., SGBSEP31II-GB';
        tickerPlaceholder = 'ISIN (Opt.)';
        pricePlaceholder = 'Avg. Price ₹';
    }

    // --- UPDATED HTML (with responsive col-span classes) ---
    // Mobile layout (6-col):
    // - Name: full width (6)
    // - Ticker: half width (3)
    // - Units: half width (3)
    // - Price: 5 cols
    // - Button: 1 col
    // Desktop layout (12-col): 4, 2, 3, 2, 1
    row.innerHTML = `
        <input type="text" name="holdingName" class="form-input-row col-span-6 md:col-span-4" placeholder="${namePlaceholder}" required>
        <input type="text" name="holdingTicker" class="form-input-row col-span-3 md:col-span-2" placeholder="${tickerPlaceholder}">
        <input type="number" step="any" name="holdingUnits" class="form-input-row col-span-3 md:col-span-3" placeholder="Units" required>
        <input type="number" step="0.01" name="holdingBuyPrice" class="form-input-row col-span-5 md:col-span-2" placeholder="${pricePlaceholder}" required>
        <button type="button" class="remove-holding-btn col-span-1 md:col-span-1 text-center">
            <svg class="h-4 w-4 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </button>
    `;
    
    row.querySelector('.remove-holding-btn').addEventListener('click', () => {
        row.remove();
    });

    return row;
}
/**
 * Opens and resets the Portfolio Modal to the selection screen.
 */
export function showPortfolioModal() {
    const holdingsContainer = document.getElementById('holdingsContainer');
    if (!holdingsContainer) return;

    // --- Reset modal to the initial selection view ---
    const modalTitle = document.getElementById('portfolioModalTitle');
    const viewContainer = document.getElementById('portfolio-modal-view-container');
    const selectionView = document.getElementById('portfolio-selection-view');
    
    if(modalTitle) modalTitle.textContent = 'Add Portfolio';

    // Hide all other views
    viewContainer.querySelectorAll('.modal-view').forEach(view => {
        view.classList.remove('active-view');
    });
    // Show the main selection view
    if(selectionView) selectionView.classList.add('active-view');
    // --- End Reset ---

    // --- Reset Brokerage Form ---
    // 1. Reset asset type switcher to 'stock'
    const stockRadio = document.getElementById('asset-stock');
    if (stockRadio) stockRadio.checked = true;
    document.getElementById('currentAssetType').value = 'stock';
    // 2. Clear old rows
    holdingsContainer.innerHTML = ''; 
    // 3. Add one new 'stock' row
    holdingsContainer.appendChild(createHoldingRow('stock'));
    // 4. Reset headers
    updateBrokerageFormHeaders('stock');
    // --- End Form Reset ---

    // --- NEW: Reset Employee Benefits Form ---
    const retirementRadio = document.getElementById('asset-retirement');
    if (retirementRadio) retirementRadio.checked = true;
    
    const retirementForm = document.getElementById('addRetirementForm');
    if (retirementForm) retirementForm.classList.remove('hidden');
    
    const stockGrantForm = document.getElementById('addStockGrantForm');
    if (stockGrantForm) stockGrantForm.classList.add('hidden');
    // --- End Reset ---

    toggleModal('addPortfolioModal', true);
}

/**
 * Helper function to update form labels based on asset type.
 * @param {string} assetType - 'stock', 'mutual_fund', or 'bond'
 */
export function updateBrokerageFormHeaders(assetType) {
    const title = document.getElementById('holdingsListTitle');
    const nameCol = document.getElementById('col-header-name');
    const priceCol = document.getElementById('col-header-price');
    const unitsCol = document.getElementById('col-header-units');

    if (assetType === 'stock') {
        if(title) title.textContent = 'Add Your Stocks';
        if(nameCol) nameCol.textContent = 'Name';
        if(priceCol) priceCol.textContent = 'Avg. Buy Price';
        if(unitsCol) unitsCol.textContent = 'Units / Qty';
    } else if (assetType === 'mutual_fund') {
        if(title) title.textContent = 'Add Your Mutual Funds';
        if(nameCol) nameCol.textContent = 'Fund Name';
        if(priceCol) priceCol.textContent = 'Avg. NAV';
        if(unitsCol) unitsCol.textContent = 'Units';
    } else if (assetType === 'bond') {
        if(title) title.textContent = 'Add Your Bonds / Other';
        if(nameCol) nameCol.textContent = 'Bond Name';
        if(priceCol) priceCol.textContent = 'Avg. Buy Price';
        if(unitsCol) unitsCol.textContent = 'Units / Qty';
    }
}

// (This function is unchanged)
// Master function to render the entire investments tab
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
        
        const investedThisMonth = 25000; // Placeholder

        elements.investmentsCurrentValue.textContent = formatIndianCurrency(currentValue);
        elements.investmentsCurrentValue.title = `₹${currentValue.toLocaleString('en-IN')}`;

        elements.investmentsMonthChange.textContent = `+5.2% from last month`;
        elements.investmentsMonthChange.className = 'text-sm mt-2 text-positive-value';

        elements.investmentsTotalInvested.textContent = formatIndianCurrency(totalInvested);
        elements.investmentsTotalInvested.title = `₹${totalInvested.toLocaleString('en-IN')}`;
        
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
        
        // --- THIS IS THE KEY CHANGE ---
        // Render the active tab content based on appState
        if (appState.activePortfolioView === 'holdings') {
            renderSmartStackView(appState.investmentAccounts);
        } else if (appState.activePortfolioView === 'allocation') {
            document.getElementById('investmentTabContent').innerHTML = `<div class="p-6"><div class="chart-container-large"><canvas id="allocationChart"></canvas></div></div>`;
            // createCharts(appState) will be called by the main render() function
        } else if (appState.activePortfolioView === 'performance') {
            document.getElementById('investmentTabContent').innerHTML = `<div class="p-6 text-center text-text-secondary">Performance Chart Coming Soon!</div>`;
        }
    }
}


// --- TASK 1: REFACTORED AND NEW FUNCTIONS ---

/**
 * [NEW HELPER]
 * This function renders the *content* of an individual account card.
 * It's the logic extracted from the old renderHoldingsView.
 */
function renderAccountCardContent(account) {
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
                    <td class="p-4 group-divider text-base">${holding.name}</td>
                    <td class="p-4 text-right mono text-base">${unit.toLocaleString('en-IN')}</td>
                    <td class="p-4 text-right mono text-base">${avgCost.toLocaleString('en-IN', {maximumFractionDigits: 2})}</td>
                    <td class="p-4 text-right mono text-base group-divider">${ltp.toLocaleString('en-IN', {maximumFractionDigits: 2})}</td>
                    <td class="p-4 text-right mono text-base group-divider">${holding.buyValue.toLocaleString('en-IN')}</td>
                    <td class="p-4 text-right mono text-base ${pAndLColor}">
                        <div>${pAndL >= 0 ? '+' : ''}${pAndL.toLocaleString('en-IN')}</div>
                        <div class="text-xs">(${pAndLPercent.toFixed(2)}%)</div>
                    </td>
                </tr>
            `,
            mobile: `
                <div class="holding-mobile-card">
                    <p class="font-medium text-white mb-3">${holding.name}</p>
                    <div class="grid grid-cols-2 gap-x-6 gap-y-3 text-base">
                        <span class="text-gray-400">Qty.</span><span class="mono text-right">${unit.toLocaleString('en-IN')}</span>
                        <span class="text-gray-400">Avg. Cost</span><span class="mono text-right">${avgCost.toLocaleString('en-IN', {maximumFractionDigits: 2})}</span>
                        <span class="text-gray-400">LTP</span><span class="mono text-right">${ltp.toLocaleString('en-IN', {maximumFractionDigits: 2})}</span>
                        <span class="text-gray-400">Invested</span><span class="mono text-right">${holding.buyValue.toLocaleString('en-IN')}</span>
                        <span class="text-gray-400">Total P&L</span>
                        <span class="mono text-right ${pAndLColor}">
                            ${pAndL >= 0 ? '+' : ''}${pAndL.toLocaleString('en-IN')}
                            <span class="text-xs ml-1">(${pAndLPercent.toFixed(1)}%)</span>
                        </span>
                    </div>
                </div>
            `
        };
    });

    return `
        <div class="holdings-list">
            <div class="desktop-table">
                <table class="w-full">
                    <thead class="text-xs text-gray-500"><tr class="border-t border-b border-white/10">
                        <th class="p-4 text-left font-normal group-divider">Instrument</th>
                        <th class="p-4 text-right font-normal">Qty.</th>
                        <th class="p-4 text-right font-normal">Avg. (₹)</th>
                        <th class="p-4 text-right font-normal group-divider">LTP (₹)</th>
                        <th class="p-4 text-right font-normal group-divider">Invested (₹)</th>
                        <th class="p-4 text-right font-normal">Total P&L (₹)</th>
                    </tr></thead>
                    <tbody class="divide-y divide-white/10">
                        ${holdingsHtml.map(h => h.desktop).join('')}
                    </tbody>
                </table>
            </div>
            <div class="mobile-cards">
                ${holdingsHtml.map(h => h.mobile).join('')}
            </div>
        </div>
    `;
}


/**
 * Maps a fine-grained holding type (e.g., 'rsu', 'fd') to a high-level asset class.
 * @param {string} type - The holding.type from appState
 * @returns {string} The asset class (e.g., "Equity", "Fixed Income")
 */
function getAssetClass(type) {
    switch (type) {
        case 'equity':
        case 'rsu':
        case 'esop':
            return 'Equity';
        case 'mutual_fund':
            return 'Mutual Funds';
        case 'fd':
        case 'p2p':
        case 'bond':
        case 'epf':
        case 'nps':
            return 'Fixed Income';
        case 'gold':
            return 'Gold';
        default:
            return 'Other Assets';
    }
}

/**
 * Calculates the total value and buy value for a portfolio.
 * @param {object} portfolio - A portfolio object from appState.investmentAccounts
 * @returns {object} { currentValue, buyValue }
 */
function getPortfolioTotals(portfolio) {
    return portfolio.holdings.reduce((acc, h) => {
        acc.currentValue += h.currentValue || 0;
        acc.buyValue += h.buyValue || 0;
        return acc;
    }, { currentValue: 0, buyValue: 0 });
}

/**
 * Renders the new "Smart Stack" view for the Investments tab.
 * Groups all portfolios by their primary asset class.
 * @param {Array} accounts - appState.investmentAccounts
 */
export function renderSmartStackView(accounts) {
    const container = document.getElementById('investmentTabContent');
    if (!container) return;

    // --- 1. Group Portfolios by Asset Class ---
    const portfoliosByClass = accounts.reduce((acc, portfolio) => {
        // Determine the portfolio's dominant asset class (or 'Mixed')
        const types = portfolio.holdings.map(h => getAssetClass(h.type));
        const primaryType = types.every(t => t === types[0]) ? types[0] : 'Mixed Assets';
        
        if (!acc[primaryType]) {
            acc[primaryType] = [];
        }
        acc[primaryType].push(portfolio);
        return acc;
    }, {});

    // --- 2. Build the HTML ---
    let html = '<div class="space-y-8">'; // Main container for all classes

    // Sort asset classes for consistent order
    const sortedClasses = Object.keys(portfoliosByClass).sort();

    for (const assetClass of sortedClasses) {
        const portfolios = portfoliosByClass[assetClass];

        // Calculate totals for this asset class
        const classTotals = portfolios.reduce((acc, p) => {
            const { currentValue, buyValue } = getPortfolioTotals(p);
            acc.currentValue += currentValue;
            acc.buyValue += buyValue;
            return acc;
        }, { currentValue: 0, buyValue: 0 });
        
        const classPandL = classTotals.currentValue - classTotals.buyValue;
        const classPandLColor = classPandL >= 0 ? 'text-positive-value' : 'text-negative-value';
        const classPandLSign = classPandL >= 0 ? '+' : '';

        // --- Render the Asset Class Header (Level 1) ---
        html += `
            <section class="asset-class-group">
                <div class="asset-class-header">
                    <h3 class="text-xl font-heading font-semibold">${assetClass}</h3>
                    <div class="text-right">
                        <p class="text-xl font-mono font-semibold text-text-primary">₹${classTotals.currentValue.toLocaleString('en-IN')}</p>
                        <p class="text-sm font-mono ${classPandLColor}">${classPandLSign}₹${classPandL.toLocaleString('en-IN')}</p>
                    </div>
                </div>
                
                <div class="space-y-4 mt-4">
        `;

        // --- Render Portfolio Cards for this class (Level 2) ---
        portfolios.forEach(portfolio => {
            const portfolioTotals = getPortfolioTotals(portfolio);
            const portfolioPandL = portfolioTotals.currentValue - portfolioTotals.buyValue;
            const pAndLColor = portfolioPandL >= 0 ? 'text-positive-value' : 'text-negative-value';
            const pAndLSign = portfolioPandL >= 0 ? '+' : '';

            // We are re-using the .holdings-account-card styles
            html += `
                <div class="holdings-account-card rounded-lg overflow-hidden accent-primary" data-account-id="${portfolio.id}">
                    <div class="holdings-account-header p-5">
                        <div class="flex flex-col md:flex-row md:justify-between">
                            <div class="mb-3 md:mb-0">
                                <p class="font-medium text-white text-lg">${portfolio.name}</p>
                                <p class="text-sm text-text-secondary mt-1">${portfolio.type} • ${portfolio.holdings.length} Holding(s)</p>
                            </div>
                            <div class="flex items-center justify-between md:justify-end md:gap-4">
                                <div>
                                    <p class="mono text-lg text-white text-right">₹${portfolioTotals.currentValue.toLocaleString('en-IN')}</p>
                                    <p class="mono text-sm ${pAndLColor} mt-0.5 md:text-right">${pAndLSign}₹${portfolioPandL.toLocaleString('en-IN')}</p>
                                </div>
                                <svg class="chevron-icon h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
                            </div>
                        </div>
                    </div>
                    
                    <div class="holdings-list">
                        ${renderHoldingsList(portfolio)}
                    </div>
                </div>
            `;
        });

        html += `</div></section>`; // Close .space-y-4 and .asset-class-group
    }

    html += `</div>`; // Close .space-y-8
    container.innerHTML = html;
}

/**
 * Renders the *content* inside an expanded portfolio card.
 * This is where we show different UIs for stocks, FDs, etc.
 * @param {object} portfolio - The portfolio object
 * @returns {string} HTML string of the holdings
 */
function renderHoldingsList(portfolio) {
    // For now, we only have detailed renderers for brokerage holdings
    // We can add "else if (holding.type === 'fd')" etc. later
    
    // Filter for holdings we know how to render in a table
    const brokerageHoldings = portfolio.holdings.filter(h => ['equity', 'mutual_fund', 'bond'].includes(h.type));
    // Filter for simple "pot of money" holdings
    const retirementHoldings = portfolio.holdings.filter(h => ['epf', 'nps'].includes(h.type));

    let listHtml = '';

    // --- Renderer for Stocks, MFs, Bonds ---
    if (brokerageHoldings.length > 0) {
        listHtml += `
            <div class="desktop-table">
                <table class="w-full">
                    <thead class="text-xs text-gray-500"><tr class="border-t border-b border-white/10">
                        <th class="p-4 text-left font-normal group-divider">Instrument</th>
                        <th class="p-4 text-right font-normal">Units/Qty</th>
                        <th class="p-4 text-right font-normal">Avg. (₹)</th>
                        <th class="p-4 text-right font-normal group-divider">LTP (₹)</th>
                        <th class="p-4 text-right font-normal group-divider">Invested (₹)</th>
                        <th class="p-4 text-right font-normal">Total P&L (₹)</th>
                    </tr></thead>
                    <tbody class="divide-y divide-white/10">
                        ${brokerageHoldings.map(holding => {
                            const pAndL = holding.currentValue - holding.buyValue;
                            const pAndLPercent = holding.buyValue > 0 ? (pAndL / holding.buyValue) * 100 : 0;
                            const pAndLColor = pAndL >= 0 ? 'text-positive-value' : 'text-negative-value';
                            const unit = holding.quantity || 0;
                            const avgCost = unit > 0 ? holding.buyValue / unit : 0;
                            const ltp = unit > 0 ? holding.currentValue / unit : 0;
                            return `
                                <tr class="hover:bg-white/5">
                                    <td class="p-4 group-divider text-base">${holding.name}</td>
                                    <td class="p-4 text-right mono text-base">${unit.toLocaleString('en-IN')}</td>
                                    <td class="p-4 text-right mono text-base">${avgCost.toLocaleString('en-IN', {maximumFractionDigits: 2})}</td>
                                    <td class="p-4 text-right mono text-base group-divider">${ltp.toLocaleString('en-IN', {maximumFractionDigits: 2})}</td>
                                    <td class="p-4 text-right mono text-base group-divider">${holding.buyValue.toLocaleString('en-IN')}</td>
                                    <td class="p-4 text-right mono text-base ${pAndLColor}">
                                        <div>${pAndL >= 0 ? '+' : ''}${pAndL.toLocaleString('en-IN')}</div>
                                        <div class="text-xs">(${pAndLPercent.toFixed(2)}%)</div>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
            <div class="mobile-cards">
                ${brokerageHoldings.map(holding => {
                     const pAndL = holding.currentValue - holding.buyValue;
                     const pAndLPercent = holding.buyValue > 0 ? (pAndL / holding.buyValue) * 100 : 0;
                     const pAndLColor = pAndL >= 0 ? 'text-positive-value' : 'text-negative-value';
                     const unit = holding.quantity || 0;
                     const avgCost = unit > 0 ? holding.buyValue / unit : 0;
                     const ltp = unit > 0 ? holding.currentValue / unit : 0;
                    return `
                        <div class="holding-mobile-card">
                            <p class="font-medium text-white mb-3">${holding.name}</p>
                            <div class="grid grid-cols-2 gap-x-6 gap-y-3 text-base">
                                <span class="text-gray-400">Qty.</span><span class="mono text-right">${unit.toLocaleString('en-IN')}</span>
                                <span class="text-gray-400">Avg. Cost</span><span class="mono text-right">${avgCost.toLocaleString('en-IN', {maximumFractionDigits: 2})}</span>
                                <span class="text-gray-400">LTP</span><span class="mono text-right">${ltp.toLocaleString('en-IN', {maximumFractionDigits: 2})}</span>
                                <span class="text-gray-400">Invested</span><span class="mono text-right">${holding.buyValue.toLocaleString('en-IN')}</span>
                                <span class="text-gray-400">Total P&L</span>
                                <span class="mono text-right ${pAndLColor}">
                                    ${pAndL >= 0 ? '+' : ''}${pAndL.toLocaleString('en-IN')}
                                    <span class="text-xs ml-1">(${pAndLPercent.toFixed(1)}%)</span>
                                </span>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }
    
    // --- Renderer for EPF, NPS ---
    if (retirementHoldings.length > 0) {
        listHtml += retirementHoldings.map(holding => `
            <div class="p-4">
                <div class="grid grid-cols-2 gap-4">
                    <div class="bg-card-hover-bg p-4 rounded-md">
                        <p class="text-sm text-text-secondary mb-1">Current Balance</p>
                        <p class="text-xl font-mono font-semibold text-text-primary">₹${holding.currentValue.toLocaleString('en-IN')}</p>
                    </div>
                    <div class="bg-card-hover-bg p-4 rounded-md">
                        <p class="text-sm text-text-secondary mb-1">Est. Monthly Contribution</p>
                        <p class="text-xl font-mono font-semibold text-text-primary">₹${holding.meta.monthlyContribution.toLocaleString('en-IN')}</p>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // TODO: Add renderers for 'fd', 'esop', etc.

    return listHtml;
}