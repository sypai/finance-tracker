// src/js/utils/ui/accounts.js
import { elements } from './domElements.js';
import { formatIndianCurrency } from './formatters.js';

export function renderAccountsPage(appState) {
    const accountListContainer = elements.accountList;

    if (appState.accounts.length === 0) {
        // --- ZERO STATE ---
        elements.accountsNormalView.classList.add('hidden');
        elements.accountsZeroState.classList.remove('hidden');

        elements.accountsZeroState.innerHTML = `
            <div class="empty-state card p-8 text-center text-gray-400 col-span-full">
                <svg class="h-12 w-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H4a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
                <p class="text-lg font-semibold">No bank accounts added</p>
                <p class="text-sm mt-1 mb-6">Add an account to start tracking your balances and see your history.</p>
            </div>
        `;
    } else {
        // --- NORMAL VIEW ---
        elements.accountsNormalView.classList.remove('hidden');
        elements.accountsZeroState.classList.add('hidden');

        // --- 1. RENDER KPIs (v7 Logic - The Correct One) ---
        const allAccounts = appState.accounts;

        const totalAssets = allAccounts
            .filter(acc => acc.balance >= 0)
            .reduce((sum, acc) => sum + acc.balance, 0);

        const totalDebts = allAccounts
            .filter(acc => acc.balance < 0)
            .reduce((sum, acc) => sum + acc.balance, 0); // This is a negative number or 0

        const netWorth = totalAssets + totalDebts;

        // Update KPI Card Elements
        const assetsEl = document.getElementById('accountsTotalAssets');
        const assetsSubtextEl = document.getElementById('accountsAssetsSubtext');
        const netWorthEl = document.getElementById('accountsNetWorth');
        const netWorthSubtextEl = document.getElementById('accountsNetWorthSubtext');
        const debtsEl = document.getElementById('accountsTotalDebts');
        const debtsSubtextEl = document.getElementById('accountsDebtsSubtext');

        // --- NEW COLOR LOGIC (Main Values) ---
        if (assetsEl) {
            assetsEl.textContent = formatIndianCurrency(totalAssets);
            assetsEl.className = 'text-3xl font-semibold mono text-positive-value'; // Always green
        }
        if (debtsEl) {
            debtsEl.textContent = formatIndianCurrency(totalDebts);
            debtsEl.className = 'text-3xl font-semibold mono text-negative-value'; // Always red
        }
        if (netWorthEl) {
            netWorthEl.textContent = formatIndianCurrency(netWorth);
            netWorthEl.className = 'text-3xl font-semibold mono'; // Reset
            netWorthEl.classList.add(netWorth >= 0 ? 'text-positive-value' : 'text-negative-value'); // Dynamic color
        }
        
        // --- NEW COLOR LOGIC (Subtexts) ---
        // All subtexts are now neutral gray
        if (assetsSubtextEl) {
            assetsSubtextEl.className = 'text-sm mt-2 text-gray-500';
            assetsSubtextEl.textContent = 'All positive balances';
        }
        if (debtsSubtextEl) {
            debtsSubtextEl.className = 'text-sm mt-2 text-gray-500';
            if (totalDebts < 0) {
                debtsSubtextEl.textContent = 'From credit cards & loans';
            } else {
                debtsSubtextEl.textContent = 'No outstanding debt';
            }
        }
        if (netWorthSubtextEl) {
            netWorthSubtextEl.className = 'text-sm mt-2 text-gray-500'; // Always gray
            if (netWorth >= 0) {
                netWorthSubtextEl.textContent = 'You are in a positive position.';
            } else {
                netWorthSubtextEl.textContent = 'Your debts outweigh your assets.';
            }
        }


        // --- 2. RENDER CHART & FILTERS ---
        const bankAccountsForFilter = appState.accounts.filter(acc => acc.type.toLowerCase() !== 'cash');
        populateAccountFilter(bankAccountsForFilter); 
        updateBalanceHistoryTabs(appState.activeBalancePeriod);

        // --- 3. RENDER "ACCOUNTS JOURNAL" ---
        accountListContainer.innerHTML = ''; 

        const groupedAccounts = appState.accounts.reduce((acc, account) => {
            const type = account.type || 'Other';
            if (!acc[type]) {
                acc[type] = { accounts: [], totalBalance: 0 };
            }
            acc[type].accounts.push(account);
            acc[type].totalBalance += account.balance;
            return acc;
        }, {});

        Object.keys(groupedAccounts).sort().forEach((type, index) => {
            const group = groupedAccounts[type];
            const isOpenClass = index === 0 ? 'is-open' : ''; 
            const totalColor = group.totalBalance >= 0 ? 'text-positive-value' : 'text-negative-value';

            // --- THIS IS THE MODIFIED BLOCK ---
            const accountCardsHtml = group.accounts
                .sort((a, b) => b.balance - a.balance) 
                .map(account => {
                    // This variable is the same
                    const maskedNumber = account.number ? `•••• ${account.number.slice(-4)}` : '';
                    const balanceColor = account.balance >= 0 ? 'text-positive-value' : 'text-negative-value';
                    
                    return `
                    <div class="account-list-card" data-account-id="${account.id}">
                        <div class="icon-wrapper">
                            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H4a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
                        </div>
                        
                        <div class="flex-1 min-w-0">
                            <p class="account-name">${account.name}</p>
                            <p class="account-details">${account.type}</p>
                        </div>
                        
                        <div class="text-right">
                            <p class="account-balance ${balanceColor}">
                                ₹${account.balance.toLocaleString('en-IN')}
                            </p>
                            <p class="account-number-subtext">${maskedNumber}</p>
                        </div>

                        <button data-account-actions-id="${account.id}" class="actions-btn">
                            <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg>
                        </button>
                    </div>
                    `;
                }).join('');
            // --- END OF MODIFIED BLOCK ---

            const groupEl = document.createElement('div');
            groupEl.className = `account-group ${isOpenClass}`;
            groupEl.innerHTML = `
                <h3 class="account-group-header">
                    <span>${type}</span>
                    <span class="group-total ${totalColor}">
                        ₹${group.totalBalance.toLocaleString('en-IN')}
                    </span>
                    <svg class="chevron-icon h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                </h3>
                <div class="account-group-list">
                    <div class="horizontal-stream-container">
                        ${accountCardsHtml}
                    </div>
                </div>
            `;
            accountListContainer.appendChild(groupEl);
        });
    }
}


function populateAccountFilter(accounts) { // `accounts` here is pre-filtered (no cash)
    if (!elements.accountFilter) return;
    
    let optionsHtml = `<option value="all">All Accounts</option>`;
    optionsHtml += accounts.map(account => 
        `<option value="${account.id}">${account.name}</option>`
    ).join('');
    
    elements.accountFilter.innerHTML = optionsHtml;
}

export function updateBalanceHistoryTabs(activePeriod) {
    if (!elements.balanceHistoryTabs) return;

    elements.balanceHistoryTabs.querySelectorAll('button').forEach(btn => {
        const isActive = btn.dataset.period === activePeriod;
        btn.classList.toggle('active', isActive);
        if (isActive) {
            btn.classList.add('bg-white/10', 'text-white');
            btn.classList.remove('text-gray-400');
        } else {
            btn.classList.remove('bg-white/10', 'text-white');
            btn.classList.add('text-gray-400');
        }
    });
}