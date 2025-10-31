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
        
        // Render the active tab content (defaults to holdings)
        renderHoldingsView(appState.investmentAccounts);
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
 * [REFACTORED]
 * Renders the "Holdings" view, now grouped by Asset Type,
 * using the "Inset Journal" pattern.
 */
export function renderHoldingsView(accounts) {
    const container = document.getElementById('investmentTabContent');
    if (!container) return;

    // 1. Data Transformation: Group accounts by asset type
    const assetGroups = accounts.reduce((acc, account) => {
        account.holdings.forEach(holding => {
            const type = holding.type || 'other';
            
            // Standardize type names
            let groupName = 'Other';
            if (type === 'equity') groupName = 'Equity';
            if (type === 'mutual_fund') groupName = 'Mutual Funds';
            if (type ==='epf') groupName = 'Retirement';
            if (type === 'gold') groupName = 'Gold';

            if (!acc[groupName]) {
                acc[groupName] = {
                    name: groupName,
                    accounts: new Map(), // Use a Map to store accounts uniquely
                    totalValue: 0,
                    totalPandL: 0
                };
            }

            // Add or update the account in the Map
            let accountData = acc[groupName].accounts.get(account.id);
            if (!accountData) {
                accountData = {
                    ...account, // Spread account info (name, type, etc.)
                    holdings: [] // Reset holdings to only store relevant ones
                };
                acc[groupName].accounts.set(account.id, accountData);
            }
            
            // Add the specific holding to this group
            accountData.holdings.push(holding);
            
            // Update totals for the asset group
            acc[groupName].totalValue += holding.currentValue;
            acc[groupName].totalPandL += (holding.currentValue - holding.buyValue);
        });
        return acc;
    }, {});

    // Sort asset groups by total value (descending)
    const sortedAssetGroups = Object.values(assetGroups).sort((a, b) => b.totalValue - a.totalValue);

    // 2. Render the "Inset Journal" Structure
    container.innerHTML = sortedAssetGroups.map((group, index) => {
        const isOpenClass = index === 0 ? 'is-open' : ''; // Open the first group by default
        const pAndLColor = group.totalPandL >= 0 ? 'text-positive-value' : 'text-negative-value';
        const pAndLSign = group.totalPandL >= 0 ? '+' : '';

        // Convert Map values to array for rendering
        const accountsInGroup = Array.from(group.accounts.values());

        return `
            <div class="investment-asset-group ${isOpenClass}" data-asset-group="${group.name}">
                
                <h3 class="investment-group-header">
                    <div class="flex-1">
                        <span class="text-lg">${group.name}</span>
                        <span class="text-sm text-text-secondary ml-2">(${accountsInGroup.length} ${accountsInGroup.length === 1 ? 'Account' : 'Accounts'})</span>
                    </div>
                    <div class="text-right">
                        <span class="group-total-value">${formatIndianCurrency(group.totalValue)}</span>
                        <span class="group-total-pnl ${pAndLColor}">${pAndLSign}${formatIndianCurrency(Math.abs(group.totalPandL))}</span>
                    </div>
                    <svg class="chevron-icon h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                </h3>

                <div class="investment-group-list">
                    <div class="horizontal-stream-container">
                        
                        ${accountsInGroup.map((account, accIndex) => {
                            // Calculate totals for *this specific account* within *this specific group*
                            const accountGroupTotalValue = account.holdings.reduce((sum, h) => sum + h.currentValue, 0);
                            const accountGroupBuyValue = account.holdings.reduce((sum, h) => sum + h.buyValue, 0);
                            const accountGroupPandL = accountGroupTotalValue - accountGroupBuyValue;
                            const accountPandLColor = accountGroupPandL >= 0 ? 'text-positive-value' : 'text-negative-value';
                            const accountPandLSign = accountGroupPandL >= 0 ? '+' : '';

                            return `
                                <div class="investment-account-column" style="animation-delay: ${accIndex * 50}ms">
                                    <div class="holdings-account-card open">
                                        <div class="holdings-account-header p-4">
                                            <div class="flex flex-col">
                                                <div>
                                                    <p class="font-medium text-white text-base">${account.name}</p>
                                                    <p class="text-sm text-gray-400 mt-0.5">${account.type}</p>
                                                </div>
                                                <div class="mt-3">
                                                    <p class="mono text-base text-white text-left">₹${accountGroupTotalValue.toLocaleString('en-IN')}</p>
                                                    <p class="mono text-sm ${accountPandLColor} mt-0.5 text-left">
                                                        ${accountPandLSign}₹${accountGroupPandL.toLocaleString('en-IN')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        ${renderAccountCardContent(account)}
                                    </div>
                                </div>
                            `;
                        }).join('')}

                    </div>
                </div>
            </div>
        `;
    }).join('');
}