// src/js/utils/ui/transactions.js
import { elements } from './domElements.js';
import { toggleModal } from './common.js';

export function showTransactionModal(appState) {
    if (appState.accounts.length === 0) {
        // Show the zero-state message and hide the form
        elements.transactionFormWrapper.classList.add('hidden');
        elements.transactionZeroState.classList.remove('hidden');
    } else {
        // Show the form and hide the zero-state message
        elements.transactionZeroState.classList.add('hidden');
        elements.transactionFormWrapper.classList.remove('hidden');
        
        // Populate the dropdown with the latest accounts
        populateAccountDropdown(appState.accounts);
    }
    
    toggleModal('transactionModal', true);
}

export function populateAccountDropdown(accounts) {
    if (!elements.transactionAccountSelect) return;
    elements.transactionAccountSelect.innerHTML = accounts.map(account => 
        `<option value="${account.id}">${account.name} (₹${account.balance.toLocaleString('en-IN')})</option>`
    ).join('');
}

export function renderTransactions(transactions, accounts) {
    const transactionsContainer = elements.transactionList;
    if (transactions.length === 0) {
        transactionsContainer.innerHTML = `<div class="empty-state p-8 text-center text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
            <p class="text-lg">No transactions yet.</p>
        </div>`;
        return;
    }

    const transactionListHtml = transactions.map(transaction => {
        const account = accounts.find(acc => acc.id === transaction.accountId);
        const amountColor = transaction.type === 'income' ? 'text-positive-value' : 'text-negative-value';
        const amountSign = transaction.type === 'income' ? '+' : '-';
        const date = new Date(transaction.date).toLocaleDateString('en-IN');
        return `
        <div class="flex justify-between items-center py-2 border-b border-white/5 last:border-b-0">
            <div>
                <p class="font-semibold text-white">${transaction.description}</p>
                <p class="text-sm text-gray-400">${account ? account.name : 'Unknown'} | ${date}</p>
            </div>
            <p class="text-lg font-bold mono ${amountColor}">${amountSign}₹${transaction.amount.toLocaleString('en-IN')}</p>
        </div>
        `;
    }).join('');
    transactionsContainer.innerHTML = transactionListHtml;
}