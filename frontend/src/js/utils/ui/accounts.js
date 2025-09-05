// src/js/utils/ui/accounts.js
import { elements } from './domElements.js';

export function renderAccountsPage(appState){
    const accountListContainer = elements.accountList;
    const balanceHistoryCard = document.getElementById('balanceHistoryCard');
    // console.log(appState.accounts)
    if (appState.accounts.length === 0) {
        // Zero state logic remains the same
        // ZERO STATE: Show the single message and hide the normal view
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
        elements.accountsNormalView.classList.remove('hidden');
        elements.accountsZeroState.classList.add('hidden');

        populateAccountFilter(appState.accounts);
        updateBalanceHistoryTabs(appState.activeBalancePeriod);

        elements.accountList.innerHTML = appState.accounts.map(account => {
            const maskedNumber = account.number ? `•••• ${account.number.slice(-4)}` : '';
            const balanceColor = account.balance >= 0 ? 'text-positive-value' : 'text-negative-value';
            
            return `
                <div class="p-4 flex items-center gap-4 group">
                <div class="flex-grow flex items-center gap-4">
                    <div class="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg class="h-5 w-5 text-primary-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H4a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
                    </div>
                    <div>
                        <p class="font-bold text-white">${account.name}</p>
                        <p class="text-sm text-gray-400">${account.type} ${maskedNumber}</p>
                    </div>
                </div>
                <p class="text-lg font-semibold mono ${balanceColor}">₹${account.balance.toLocaleString('en-IN')}</p>
                <button data-account-actions-id="${account.id}" class="p-2 rounded-full hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg>
                </button>
            </div>
            `;
        }).join('');
    }
}


function populateAccountFilter(accounts) {
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
        // Add the same styling logic here
        if (isActive) {
            btn.classList.add('bg-white/10', 'text-white');
            btn.classList.remove('text-gray-400');
        } else {
            btn.classList.remove('bg-white/10', 'text-white');
            btn.classList.add('text-gray-400');
        }
    });
}