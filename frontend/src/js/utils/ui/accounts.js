// src/js/utils/ui/accounts.js
import { elements } from './domElements.js';

export function renderAccountsPage(appState) {
    if (appState.accounts.length === 0) {
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
        // NORMAL STATE: Show the normal view and hide the zero state
        elements.accountsZeroState.classList.add('hidden');
        elements.accountsNormalView.classList.remove('hidden');
        renderAccountList(appState.accounts);
    }
}

function renderAccountList(accounts) {
    // This function now *only* renders the list of account cards
    elements.accountList.innerHTML = accounts.map(account => {
        const balanceColor = account.balance >= 0 ? 'text-positive-value' : 'text-negative-value';
        return `
            <div class="card p-6 flex justify-between items-center">
                <div>
                    <p class="font-bold text-white">${account.name}</p>
                    <p class="text-sm text-gray-400">${account.type}</p>
                </div>
                <p class="text-2xl font-semibold mono ${balanceColor}">₹${account.balance.toLocaleString('en-IN')}</p>
            </div>
        `;
    }).join('');
}