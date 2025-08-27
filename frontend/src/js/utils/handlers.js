// js/handlers.js
import { appState } from './state.js';
import { elements, toggleModal } from './ui.js';

function handleAccountSubmit(e, renderCallback) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newAccount = {
        id: Date.now(),
        name: formData.get('name'),
        type: formData.get('type'),
        balance: parseFloat(formData.get('balance')),
        history: []
    };
    appState.accounts.push(newAccount);
    toggleModal('addAccountModal', false);
    e.target.reset();
    renderCallback();
}

function handleInvestmentAccountSubmit(e, renderCallback) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newInvestment = {
        id: Date.now(),
        name: formData.get('name'),
        type: formData.get('type'),
        value: parseFloat(formData.get('value')),
        change: 0,
        isPositive: true
    };
    appState.investments.push(newInvestment);
    toggleModal('addInvestmentAccountModal', false);
    e.target.reset();
    renderCallback();
}

function handleTransactionSubmit(e, renderCallback) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const accountId = parseInt(formData.get('accountId'));
    const type = formData.get('type');
    const amount = parseFloat(formData.get('amount'));
    const description = formData.get('description');
    
    const account = appState.accounts.find(acc => acc.id === accountId);
    if (!account) return;

    if (type === 'expense') {
        account.balance -= amount;
    } else if (type === 'income') {
        account.balance += amount;
    }
    
    appState.transactions.unshift({
        id: Date.now(),
        accountId: accountId,
        description: description,
        type: type,
        amount: amount,
        date: new Date()
    });
    
    toggleModal('transactionModal', false);
    e.target.reset();
    renderCallback();
}

export function setupEventHandlers(renderCallback) {
    elements.transactionForm.addEventListener('submit', (e) => handleTransactionSubmit(e, renderCallback));
    elements.addAccountForm.addEventListener('submit', (e) => handleAccountSubmit(e, renderCallback));
    elements.addInvestmentAccountForm.addEventListener('submit', (e) => handleInvestmentAccountSubmit(e, renderCallback));

    elements.addTransactionBtn.addEventListener('click', () => toggleModal('transactionModal', true));
    elements.closeTransactionModalBtn.addEventListener('click', () => toggleModal('transactionModal', false));
    
    elements.addAccountBtn.addEventListener('click', () => toggleModal('addAccountModal', true));
    elements.closeAddAccountModalBtn.addEventListener('click', () => toggleModal('addAccountModal', false));
    
    elements.addInvestmentAccountBtn.addEventListener('click', () => toggleModal('addInvestmentAccountModal', true));
    elements.closeAddInvestmentAccountModalBtn.addEventListener('click', () => toggleModal('addInvestmentAccountModal', false));
}