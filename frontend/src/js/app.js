import { appState } from './utils/state.js';
import { createCharts } from './components/charts.js';
import { 
    initUI,
    elements, 
    setActiveTab, 
    updateDateTime, 
    updateGreeting, 
    renderAccountsPage, 
    renderTransactions,
    // populateAccountDropdown,
    renderInvestmentCard,
    renderInvestmentsTab,
    updateDashboardMetrics,
    // updateActiveTimelineTab,
    renderExpenseAnalysisCard,
    updateHeaderButtons,
    toggleModal,
    showTransactionModal,
    showPortfolioModal,
    createHoldingRow,
    renderHoldingsView
} from './utils/ui/index.js';

const App = {
    init() {
        initUI();
        this.bindEvents();
        this.render(); // Initial render
        
        // The clock update only needs to be set up once.
        updateDateTime(); 
        setInterval(updateDateTime, 1000 * 60);
    },

    render() {
        const activeTab = document.querySelector('.sidebar-item.active')?.dataset.tab || 'dashboard';

        updateGreeting();
        updateHeaderButtons(activeTab);

        // console.log(activeTab)
    
        // Render content based on the active tab
        if (activeTab === 'dashboard') {
            updateDashboardMetrics(appState);
            renderInvestmentCard(appState);
            renderExpenseAnalysisCard(appState);
        } else if (activeTab === 'accounts') {
            renderAccountsPage(appState);
        } else if (activeTab === 'investments') {
            renderInvestmentsTab(appState);
        } else if (activeTab === 'transactions') {
            renderTransactions(appState.transactions, appState.accounts);
        }
        
        createCharts(appState);
    },

    bindEvents() {
        // Static elements that always exist on the page
        elements.mobileMenuButton.addEventListener('click', () => document.querySelector('.sidebar').classList.toggle('active'));
        
        elements.addTransactionBtn.addEventListener('click', () => showTransactionModal(appState));
        
        elements.addAccountBtn.addEventListener('click', () => toggleModal('addAccountModal', true));
        
        elements.addInvestmentBtn.addEventListener('click', () => showPortfolioModal());
        document.getElementById('addHoldingBtn')?.addEventListener('click', () => {
            document.getElementById('holdingsContainer').appendChild(createHoldingRow());
        });
        document.getElementById('addPortfolioForm')?.addEventListener('submit', (e) => this.handlePortfolioSubmit(e));

        elements.sidebarItems.forEach(item => {
            item.addEventListener('click', () => {
                setActiveTab(item.dataset.tab);
                this.render();
            });
        });
        
       
        elements.expenseTimelineTabs.addEventListener('click', (event) => this.handleTimelineClick(event));

        elements.balanceHistoryTabs.addEventListener('click', (event) => this.handleBalanceTimelineClick(event));

        elements.portfolioView.addEventListener('click', (event) => this.handlePortfolioViewClick(event));

        // Using a single, powerful event delegation listener for all dynamic content
        document.body.addEventListener('click', (event) => {
            if (event.target.matches('.close-modal-btn')) {
                event.target.closest('.modal-backdrop').classList.remove('active');
            }
            if (event.target.id === 'modalAddAccountBtn') {
                toggleModal('transactionModal', false);
                toggleModal('addAccountModal', true);
            }
            if (event.target.id === 'zeroStateAddPortfolioBtn') {
                showPortfolioModal(); 
            }
            const tabLink = event.target.dataset.tabLink;
            if (tabLink) {
                setActiveTab(tabLink);
                if (tabLink === 'accounts') toggleModal('addAccountModal', true);
                if (tabLink === 'investments') toggleModal('addPortfolioModal', true);
                this.render();
            }
        });

        document.body.addEventListener('submit', (event) => {
            if (event.target.id === 'transactionForm') this.handleTransactionSubmit(event);
            if (event.target.id === 'addAccountForm') this.handleAccountSubmit(event);
            if (event.target.id === 'addInvestmentAccountForm') this.handleInvestmentAccountSubmit(event);
            if (event.target.id === 'addPortfolioForm') this.handlePortfolioSubmit(event);
        });

        // --- THIS IS THE KEY CHANGE ---
        // A single, powerful event listener for the entire page
        document.body.addEventListener('click', (event) => {
            const actionsButton = event.target.closest('[data-account-actions-id]');
            
            // --- NEW LOGIC FOR THE ACTIONS MODAL ---
            if (actionsButton) {
                const accountId = parseInt(actionsButton.dataset.accountActionsId);
                this.showAccountActions(accountId);
            }
            if (event.target.id === 'cancelAccountActionsBtn') {
                toggleModal('accountActionsModal', false);
            }
            if (event.target.id === 'deleteAccountBtn') {
                const accountId = parseInt(event.target.dataset.accountId);
                toggleModal('accountActionsModal', false); // Close this modal first
                this.showDeleteConfirmation(accountId);
            }
            if (event.target.id === 'editAccountBtn') {
                // You would build an "Edit Account" modal flow here
                console.log('Edit account:', event.target.dataset.accountId);
                toggleModal('accountActionsModal', false);
            }
            // --- End of new logic ---

            // Logic for the delete confirmation modal buttons
            if (event.target.id === 'cancelDeleteBtn') {
                toggleModal('deleteConfirmationModal', false);
            }
            if (event.target.id === 'confirmDeleteBtn') {
                const accountId = parseInt(event.target.dataset.accountIdToDelete);
                this.deleteAccount(accountId);
            }
        });

        // --- UPGRADED EVENT LISTENER FOR ACCORDION BEHAVIOR ---
        const investmentTabContent = document.getElementById('investmentTabContent');
        if (investmentTabContent) {
            investmentTabContent.addEventListener('click', (event) => {
                const header = event.target.closest('.holdings-account-header');
                if (header) {
                    const list = header.nextElementSibling;
                    const currentlyOpen = header.classList.contains('open');

                    // Close all other open items
                    investmentTabContent.querySelectorAll('.holdings-account-header.open').forEach(openHeader => {
                        if (openHeader !== header) {
                            openHeader.classList.remove('open');
                            openHeader.nextElementSibling.classList.remove('open');
                        }
                    });

                    // Toggle the clicked item
                    if (!currentlyOpen) {
                        header.classList.add('open');
                        list.classList.add('open');
                    } else {
                        header.classList.remove('open');
                        list.classList.remove('open');
                    }
                }
            });
        }
    },

    // --- RE-ARCHITECTED FUNCTION TO DRIVE THE SLIDING PILL ---
    updateInvestmentTab(clickedTab) {
        const tabContainer = document.getElementById('investmentTabsContainer');
        const indicator = document.getElementById('investmentTabIndicator');
        if (!tabContainer || !indicator || !clickedTab) return;

        // --- 1. Update Tab Active State (for text color) ---
        tabContainer.querySelectorAll('.investment-tab').forEach(tab => tab.classList.remove('active'));
        clickedTab.classList.add('active');

        // --- 2. Animate the Sliding Pill Indicator ---
        requestAnimationFrame(() => {
            // Use offsetLeft for precise position within the container
            indicator.style.width = `${clickedTab.offsetWidth}px`;
            indicator.style.transform = `translateX(${clickedTab.offsetLeft}px)`;
        });

        // --- 3. Switch the Content View ---
        const tabName = clickedTab.dataset.tab;
        if (tabName === 'holdings') {
            renderHoldingsView(appState.investmentAccounts);
        } else if (tabName === 'allocation') {
            document.getElementById('investmentTabContent').innerHTML = `<div class="p-6"><div class="chart-container h-80"><canvas id="allocationChart"></canvas></div></div>`;
            createCharts(appState);
        } else if (tabName === 'performance') {
            document.getElementById('investmentTabContent').innerHTML = `<div class="p-6 text-center text-gray-400">Performance Chart Coming Soon!</div>`;
        }
    },

    showAccountActions(accountId) {
        const account = appState.accounts.find(acc => acc.id === accountId);
        if (!account) return;

        // Update modal content
        document.getElementById('accountActionsTitle').textContent = account.name;
        document.getElementById('accountActionsDetails').textContent = 
            `${account.type} • Balance: ₹${account.balance.toLocaleString('en-IN')}`;

        // Store accountId on buttons for event listeners
        document.getElementById('editAccountBtn').dataset.accountId = accountId;
        document.getElementById('deleteAccountBtn').dataset.accountId = accountId;

        toggleModal('accountActionsModal', true);
    },

    showDeleteConfirmation(accountId) {
        // Store the ID on the button so we know which account to delete
        const confirmBtn = document.getElementById('confirmDeleteBtn');
        if(confirmBtn) {
            confirmBtn.dataset.accountIdToDelete = accountId;
            toggleModal('deleteConfirmationModal', true);
        }
    },

    deleteAccount(accountId) {
        // Filter out the account to be deleted
        appState.accounts = appState.accounts.filter(acc => acc.id !== accountId);
        // Also filter out all transactions associated with that account
        appState.transactions = appState.transactions.filter(t => t.accountId !== accountId);

        toggleModal('deleteConfirmationModal', false);
        this.render(); // Re-render the UI to reflect the changes
    },

    // --- ADD THIS NEW HANDLER FUNCTION ---
    handlePortfolioSubmit(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const holdingNames = formData.getAll('holdingName');
        const holdingValues = formData.getAll('holdingValue');

        const newAccount = {
            id: Date.now(),
            name: formData.get('name'),
            type: formData.get('type'),
            totalValue: holdingValues.reduce((sum, val) => sum + parseFloat(val), 0),
            holdings: holdingNames.map((name, index) => ({
                name: name,
                value: parseFloat(holdingValues[index])
            }))
        };
        
        // This is where you would add the newAccount to your appState.investmentAccounts
        console.log("New Portfolio Account:", newAccount);
        appState.investmentAccounts.push(newAccount);

        toggleModal('addPortfolioModal', false);
        this.render(); // Re-render the app to show the new data
    },

    handleTransactionSubmit(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const accountId = parseInt(formData.get('accountId'));
        const account = appState.accounts.find(acc => acc.id === accountId);
        if (account) {
            const amount = parseFloat(formData.get('amount'));
            const type = formData.get('type');
            account.balance += type === 'income' ? amount : -amount;
            appState.transactions.unshift({
                id: Date.now(), accountId, date: new Date(),
                description: formData.get('description'), amount, type,
            });
        }
        toggleModal('transactionModal', false);
        event.target.reset();
        this.render();
    },

    handleAccountSubmit(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const name = formData.get('name');
        const number = formData.get('number');
    
        // Check for duplicates
        const accountExists = appState.accounts.some(acc => acc.name === name && acc.number === number);
        if (accountExists) {
            alert('This account already exists.');
            return;
        }
    
        appState.accounts.push({
            id: Date.now(),
            name: name,
            number: number,
            type: formData.get('type'),
            balance: parseFloat(formData.get('balance')),
            createdAt: new Date(), // Add the creation timestamp
            history: [{ date: new Date().toISOString().split('T')[0], balance: parseFloat(formData.get('balance')) }]
        });
        
        toggleModal('addAccountModal', false);
        event.target.reset();
        this.render();
    },

    handleInvestmentAccountSubmit(event) {
        event.preventDefault();
        appState.investments.push({
            id: Date.now(),
            name: event.target.name.value,
            type: event.target.type.value,
            value: parseFloat(event.target.value.value),
            change: 0, isPositive: true
        });
        toggleModal('addInvestmentAccountModal', false);
        event.target.reset();
        this.render();
    },

    handleTimelineClick(event) {
        const clickedTab = event.target.closest('button');
        // FIX: Correctly reference the state via appState.ui
        if (!clickedTab || clickedTab.dataset.period === appState.activeExpensePeriod) return;
        
        appState.activeExpensePeriod = clickedTab.dataset.period;
        this.render();
    },

    // NEW handler for the balance history timeline
    handleBalanceTimelineClick(event) {
        const clickedTab = event.target.closest('button');
        if (!clickedTab || clickedTab.dataset.period === appState.activeBalancePeriod) return;
        
        appState.activeBalancePeriod = clickedTab.dataset.period;
        this.render();
    },

    handlePortfolioViewClick(event){
        const clickedTab = event.target.closest('button');
        if (!clickedTab || clickedTab.dataset.tab === appState.activePortfolioView) return;
        
        appState.activePortfolioView = clickedTab.dataset.tab;
        this.render();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});