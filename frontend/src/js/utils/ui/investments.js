// src/js/utils/ui/investments.js
import { elements } from './domElements.js';
import { toggleModal } from './common.js';
import { formatIndianCurrency } from './formatters.js';

// --- Dashboard Card ---
// This function now *only* handles the Show/Hide logic for the card.
// The chart itself is rendered by createCharts() in charts.js.
export function renderInvestmentCard(appState) {
    const normalView = elements.investmentPortfolioNormalView;
    const zeroStateView = elements.investmentPortfolioZeroState;

    // --- THIS IS THE FIX ---
    if (appState.investmentAccounts.length === 0) { // <-- CORRECTED VARIABLE
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
        // The old, buggy renderDashboardInvestmentList() call is now gone.
        // createCharts() in app.js will handle rendering the chart.
    }
}
// --- End Dashboard Card Logic ---


// --- Add/Edit Portfolio Modal (Unchanged) ---
export function createHoldingRow(assetType = 'stock') {
    const row = document.createElement('div');
    row.className = 'holding-input-row grid grid-cols-6 md:grid-cols-12 gap-x-3 gap-y-4 md:gap-y-0 items-center';
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

export function showPortfolioModal() {
    const holdingsContainer = document.getElementById('holdingsContainer');
    if (!holdingsContainer) return;
    const modalTitle = document.getElementById('portfolioModalTitle');
    const viewContainer = document.getElementById('portfolio-modal-view-container');
    const selectionView = document.getElementById('portfolio-selection-view');
    if(modalTitle) modalTitle.textContent = 'Add Portfolio';
    viewContainer.querySelectorAll('.modal-view').forEach(view => {
        view.classList.remove('active-view');
    });
    if(selectionView) selectionView.classList.add('active-view');
    const stockRadio = document.getElementById('asset-stock');
    if (stockRadio) stockRadio.checked = true;
    document.getElementById('currentAssetType').value = 'stock';
    holdingsContainer.innerHTML = ''; 
    holdingsContainer.appendChild(createHoldingRow('stock'));
    updateBrokerageFormHeaders('stock');
    const retirementRadio = document.getElementById('asset-retirement');
    if (retirementRadio) retirementRadio.checked = true;
    const retirementForm = document.getElementById('addRetirementForm');
    if (retirementForm) retirementForm.classList.remove('hidden');
    const stockGrantForm = document.getElementById('addStockGrantForm');
    if (stockGrantForm) stockGrantForm.classList.add('hidden');
    toggleModal('addPortfolioModal', true);
}

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
// --- End Add/Edit Portfolio Modal ---


// ---
// --- "INVESTMENT JOURNAL" IMPLEMENTATION (v2) ---
// ---
// ... (The rest of this file is unchanged) ...
// ... (renderInvestmentsTab, renderInvestmentKPIs, renderHoldingsJournal, etc. are all correct) ...

/**
 * Main function to render the entire Investments tab.
 */
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

        // --- Layer 1: KPIs ---
        renderInvestmentKPIs(appState);
        
        // --- Layer 2: Insights & Charts ---
        // (Charts are handled by createCharts in app.js)
        renderPerformanceInsights(appState); 

        // --- Layer 3: The Investment Journal ---
        renderHoldingsJournal(appState.investmentAccounts);
    }
}

/**
 * Renders the new "Performance Insights" card (Placeholder)
 */
function renderPerformanceInsights(appState) {
    const container = document.getElementById('performanceInsightsList');
    if (!container) return;
    
    // Placeholder content
    container.innerHTML = `
        <div class="insight-list-item">
            <h4 class="insight-list-title">Best Performer (Month)</h4>
            <p class="insight-list-text">
                Your <strong>Reliance Industries</strong> holding is up <strong class="positive">12.5%</strong> this month.
            </p>
        </div>
        <div class="insight-list-item">
            <h4 class="insight-list-title">Asset Allocation</h4>
            <p class="insight-list-text">
                Your portfolio is <strong>65% Equity</strong> and <strong>35% Fixed Income</strong>. Consider rebalancing to match your risk profile.
            </p>
        </div>
        <div class="insight-list-item">
            <h4 class="insight-list-title">Upcoming Event</h4>
            <p class="insight-list-text">
                Your <strong>HDFC Bank FD</strong> (₹1,00,000) matures on <strong>31 Oct 2025</strong>.
            </p>
        </div>
    `;
}

/**
 * Renders the top 3 KPI cards
 */
function renderInvestmentKPIs(appState) {
    const allHoldings = appState.investmentAccounts.flatMap(acc => acc.holdings);
    const totalInvested = allHoldings.reduce((sum, h) => sum + h.buyValue, 0);
    const currentValue = allHoldings.reduce((sum, h) => sum + h.currentValue, 0);
    const totalGain = currentValue - totalInvested;
    const totalGainPercent = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;
    const investedThisMonth = 25000; // Placeholder

    elements.investmentsCurrentValue.textContent = formatIndianCurrency(currentValue);
    elements.investmentsCurrentValue.title = `₹${currentValue.toLocaleString('en-IN')}`;
    elements.investmentsMonthChange.textContent = `+5.2% from last month`; // Placeholder
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
}

/**
 * Maps a holding type to a high-level asset class.
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
        case 'superannuation':
            return 'Fixed Income';
        case 'gold':
            return 'Gold';
        case 'crypto':
            return 'Crypto';
        default:
            return 'Other Assets';
    }
}

/**
 * Calculates totals for a list of holdings.
 */
function getHoldingsTotals(holdings) {
    return holdings.reduce((acc, h) => {
        acc.currentValue += h.currentValue || 0;
        acc.buyValue += h.buyValue || 0;
        return acc;
    }, { currentValue: 0, buyValue: 0 });
}

/**
 * Renders the "Investment Journal" (Row 3+).
 */
/**
 * Renders the "Investment Journal" (Row 3+).
 * Creates a full-width card for each Asset Class, with portfolio accordions inside.
 */
function renderHoldingsJournal(accounts) {
    const container = document.getElementById('investmentJournalContent');
    if (!container) return;

    // 1. Get all holdings and enhance them with portfolio info
    const allHoldingsWithPortfolio = accounts.flatMap(portfolio => 
        portfolio.holdings.map(holding => ({
            ...holding, // Spread the holding data (type, name, value, etc.)
            portfolioName: portfolio.name,
            portfolioTypeDisplay: {
                'brokerage': 'Brokerage',
                'fixed_income': 'Fixed Income',
                'employee_benefit': 'Employee Benefit',
                'other_asset': 'Other Asset'
            }[portfolio.type] || 'Portfolio',
            portfolioId: portfolio.id
        }))
    );

    // 2. Group these enhanced holdings by their Asset Class
    const holdingsByClass = allHoldingsWithPortfolio.reduce((acc, holding) => {
        const assetClass = getAssetClass(holding.type);
        if (!acc[assetClass]) {
            acc[assetClass] = [];
        }
        acc[assetClass].push(holding);
        return acc;
    }, {});

    let html = '';
    const sortedClasses = Object.keys(holdingsByClass).sort();

    // 3. Create an "Asset Class Card" for each class
    for (const assetClass of sortedClasses) {
        const holdingsInClass = holdingsByClass[assetClass];
        
        // 4. Group these holdings by their parent portfolio to create the accordions
        const portfoliosInClass = holdingsInClass.reduce((acc, holding) => {
            const pid = holding.portfolioId;
            if (!acc[pid]) {
                acc[pid] = {
                    id: pid,
                    name: holding.portfolioName,
                    typeDisplay: holding.portfolioTypeDisplay,
                    holdings: []
                };
            }
            acc[pid].holdings.push(holding);
            return acc;
        }, {});

        // 5. Create Portfolio Accordion Headers HTML
        const portfolioHeadersHtml = Object.values(portfoliosInClass).map((portfolio, index) => {
            const totals = getHoldingsTotals(portfolio.holdings); // <-- Use new helper
            const pAndL = totals.currentValue - totals.buyValue;
            const pAndLColor = pAndL >= 0 ? 'text-positive-value' : 'text-negative-value';
            const pAndLSign = pAndL >= 0 ? '+' : '';
            const isOpenClass = index === 0 ? 'is-open' : ''; // Open the first portfolio by default

            // Render all the holding cards for this portfolio
            const holdingCardsHtml = portfolio.holdings
                .map(holding => renderHoldingCard(holding, portfolio.id)) // Pass portfolio.id
                .join('');
            
            // Map portfolio type to a user-friendly name
            const portfolioTypeDisplay = portfolio.typeDisplay; // <-- Use prepared display name

            // --- THIS IS THE MODIFIED (CLEANED) BLOCK ---
            return `
                <div class="portfolio-accordion-group ${isOpenClass}" data-portfolio-id="${portfolio.id}">
                    <div class="portfolio-accordion-header">
                        <div class="flex-1 min-w-0">
                            <p class="font-semibold text-white text-base truncate">${portfolio.name}</p>
                            <p class="text-sm text-text-secondary">${portfolioTypeDisplay}</p>
                        </div>
                        <div class="text-right flex-shrink-0 ml-4">
                            <p class="mono font-semibold text-white text-base">${formatIndianCurrency(totals.currentValue)}</p>
                            <p class="mono text-sm ${pAndLColor}">${pAndLSign}${formatIndianCurrency(pAndL)}</p>
                        </div>
                        
                        <!-- THE UGLY 3-DOT BUTTON IS GONE -->

                        <svg class="chevron-icon h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                    
                    <div class="portfolio-holdings-list">
                        <div class="portfolio-horizontal-stream">
                            ${holdingCardsHtml}
                        </div>
                    </div>
                </div>
            `;
            // --- END OF MODIFIED BLOCK ---
        }).join('');

        // Assemble the main Asset Class Card
        html += `
            <div class="card investment-journal-card">
                <div class="investment-journal-header">
                    <h3 class="text-xl font-semibold">${assetClass}</h3>
                    <div class="investment-search-wrapper">
                        <input type="text" 
                               class="form-input investment-search-input !min-h-[44px] !text-sm" 
                               placeholder="Search in ${assetClass}...">
                        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>

                <div class="portfolio-accordions-container flex flex-col p-2 md:p-4">
                    ${portfolioHeadersHtml}
                </div>
            </div>
        `;
    }

    container.innerHTML = html;
}

/**
 * Renders a single "Holding Card" (the "Baseball Card").
 */
function renderHoldingCard(holding, portfolioId) {
    // We'll use the holding name as a unique ID, this is a safe fallback
    const holdingId = holding.name.replace(/\s+/g, '-').toLowerCase();

    let headerHtml = `<span class="holding-name">${holding.name}</span>`;
    if (holding.ticker) {
        headerHtml += `<span class="holding-ticker">${holding.ticker}</span>`;
    }

    // ... (rest of the metric logic is unchanged) ...
    let primaryMetricHtml = '';
    let detailsGridHtml = '';
    let bodyHtml = '';
    const type = holding.type;

    primaryMetricHtml = `
        <div class="holding-metric holding-metric-main">
            <span class="label">Current Value</span>
            <div class="value-stack">
                <span class="value">₹${holding.currentValue.toLocaleString('en-IN')}</span>
            </div>
        </div>
    `;

    if (['equity', 'mutual_fund', 'bond', 'crypto', 'gold'].includes(type)) {
        const pAndL = holding.currentValue - holding.buyValue;
        const pAndLPercent = holding.buyValue > 0 ? (pAndL / holding.buyValue) * 100 : 0;
        const pAndLColor = pAndL >= 0 ? 'text-positive-value' : 'text-negative-value';
        const pAndLSign = pAndL >= 0 ? '+' : '';
        const unit = holding.quantity || 0;
        const avgCost = unit > 0 ? holding.buyValue / unit : 0;
        const ltp = unit > 0 ? holding.currentValue / unit : 0;

        primaryMetricHtml = `
            <div class="holding-metric holding-metric-main">
                <span class="label">Current Value</span>
                <div class="value-stack">
                    <span class="value">₹${holding.currentValue.toLocaleString('en-IN')}</span>
                    <div class="sub-value ${pAndLColor}">
                        ${pAndLSign}${formatIndianCurrency(pAndL)} (${pAndLSign}${pAndLPercent.toFixed(1)}%)
                    </div>
                </div>
            </div>
        `;
        
        detailsGridHtml = `
            <div class="holding-metric-small">
                <span class="label">Invested</span>
                <span class="value">${formatIndianCurrency(holding.buyValue)}</span>
            </div>
            <div class="holding-metric-small">
                <span class="label">LTP</span>
                <span class="value">₹${ltp.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
            </div>
            <div class="holding-metric-small">
                <span class="label">Units</span>
                <span class="value">${unit.toLocaleString('en-IN')}</span>
            </div>
            <div class="holding-metric-small">
                <span class="label">Avg. Cost</span>
                <span class="value">₹${avgCost.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
            </div>
        `;
    }
    else if (['fd', 'p2p'].includes(type)) {
        detailsGridHtml = `
            <div class="holding-metric-small">
                <span class="label">Invested</span>
                <span class="value">₹${holding.buyValue.toLocaleString('en-IN')}</span>
            </div>
            <div class="holding-metric-small">
                <span class="label">Interest Rate</span>
                <span class="value">${holding.meta.rate.toFixed(2)}% p.a.</span>
            </div>
            <div class="holding-metric-small">
                <span class="label">Start Date</span>
                <span class="value">${new Date(holding.meta.investmentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
            </div>
            <div class="holding-metric-small">
                <span class="label">Maturity Date</span>
                <span class="value">${new Date(holding.meta.maturityDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
        `;
    }
    else if (['epf', 'nps', 'superannuation'].includes(type)) {
        detailsGridHtml = `
            <div class="holding-metric-small">
                <span class="label">Invested</span>
                <span class="value">₹${holding.buyValue.toLocaleString('en-IN')}</span>
            </div>
            <div class="holding-metric-small">
                <span class="label">Est. Monthly</span>
                <span class="value">₹${(holding.meta.monthlyContribution || 0).toLocaleString('en-IN')}</span>
            </div>
        `;
    }
    else if (['rsu', 'esop'].includes(type)) {
        const vestedValue = (holding.meta.vestedUnits || 0) * (holding.meta.marketPrice || 0);
        const pAndL = vestedValue - holding.buyValue;
        const pAndLColor = pAndL >= 0 ? 'text-positive-value' : 'text-negative-value';
        const pAndLSign = pAndL >= 0 ? '+' : '';

        primaryMetricHtml = `
            <div class="holding-metric holding-metric-main">
                <span class="label">Vested Value</span>
                <div class="value-stack">
                    <span class="value">₹${vestedValue.toLocaleString('en-IN')}</span>
                    <div class="sub-value ${pAndLColor}">
                        P&L: ${pAndLSign}${formatIndianCurrency(pAndL)}
                    </div>
                </div>
            </div>
        `;

        detailsGridHtml = `
            <div class="holding-metric-small">
                <span class="label">Vested Units</span>
                <span class="value">${(holding.meta.vestedUnits || 0)}</span>
            </div>
            <div class="holding-metric-small">
                <span class="label">Unvested Units</span>
                <span class="value">${(holding.meta.unvestedUnits || 0)}</span>
            </div>
            <div class="holding-metric-small">
                <span class="label">Market Price</span>
                <span class="value">₹${(holding.meta.marketPrice || 0).toLocaleString('en-IN')}</span>
            </div>
            <div class="holding-metric-small">
                <span class="label">Next Vesting</span>
                <span class="value">${holding.meta.nextVestingDate ? new Date(holding.meta.nextVestingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'N/A'}</span>
            </div>
        `;
    }
    else {
        detailsGridHtml = `
            <div class="holding-metric-small">
                <span class="label">Invested</span>
                <span class="value">₹${holding.buyValue.toLocaleString('en-IN')}</span>
            </div>
        `;
    }
    // --- End of metric logic ---

    bodyHtml = `
        ${primaryMetricHtml}
        <div class="holding-details-grid">
            ${detailsGridHtml}
        </div>
    `;

    // --- THIS IS THE MODIFIED BLOCK ---
    return `
        <div class="holding-card" data-holding-id="${holdingId}">
            <div class="holding-card-header">
                ${headerHtml}
                <!-- RE-ADDING THIS BUTTON (we had it before but lost it) -->
                <button type="button" class="holding-card-actions" data-portfolio-id="${portfolioId}" data-holding-id="${holdingId}">
                    <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                </button>
            </div>
            <div class="holding-card-body">
                ${bodyHtml}
            </div>
        </div>
    `;
    // --- END OF MODIFIED BLOCK ---
}