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

        this.handleTabSwitch('dashboard'); 

        // Initial positioning of the sidebar indicator
        const initialActiveItem = document.querySelector('.sidebar-item.active');
        this.moveSidebarIndicator(initialActiveItem);
        
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

        // elements.portfolioView.addEventListener('click', (event) => this.handlePortfolioViewClick(event));

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

        // --- NEW: LOGIC FOR THE LENS SELECTOR DROPDOWN ---
        const viewSelector = document.getElementById('investmentViewSelector');
        if (viewSelector) {
            const btn = document.getElementById('investmentViewBtn');
            const dropdown = document.getElementById('investmentViewDropdown');
            const chevron = btn.querySelector('.chevron-icon');

            // Open/close the dropdown
            btn.addEventListener('click', (event) => {
                event.stopPropagation();
                dropdown.classList.toggle('hidden');
                chevron.classList.toggle('rotate-180');
            });

            // Handle selecting an option
            dropdown.addEventListener('click', (event) => {
                const option = event.target.closest('.investment-view-option');
                if (option) {
                    event.preventDefault();
                    const viewName = option.dataset.tab;
                    this.updateInvestmentView(viewName);
                    // No need to manually hide here, the window listener below handles it
                }
            });
        }
        
        // --- Add this global listener to close the dropdown when clicking anywhere else ---
        window.addEventListener('click', () => {
            const dropdown = document.getElementById('investmentViewDropdown');
            if (dropdown && !dropdown.classList.contains('hidden')) {
                dropdown.classList.add('hidden');
                document.querySelector('#investmentViewBtn .chevron-icon').classList.remove('rotate-180');
            }
        });

        // --- UPGRADED EVENT LISTENER FOR ACCORDION BEHAVIOR ---
        const investmentTabContent = document.getElementById('investmentTabContent');
        if (investmentTabContent) {
            investmentTabContent.addEventListener('click', (event) => {
                const card = event.target.closest('.holdings-account-card');
                if (card) {
                    const currentlyOpen = card.classList.contains('open');

                    // Close all other open cards
                    investmentTabContent.querySelectorAll('.holdings-account-card.open').forEach(openCard => {
                        if (openCard !== card) {
                            openCard.classList.remove('open');
                        }
                    });

                    // Toggle the clicked card
                    card.classList.toggle('open');
                }
            });
        }

        // --- (Keep the mobileMenuButton listener as is) ---
        elements.mobileMenuButton.addEventListener('click', () => {
            document.querySelector('.sidebar').classList.toggle('active')
        });

        const handleTabClick = (tabName) => {
            // Deactivate all navigation items
            elements.sidebarItems.forEach(item => item.classList.remove('active'));
            elements.bottomNavItems.forEach(item => item.classList.remove('active'));

            // Activate the correct items in both navs
            document.querySelector(`.sidebar-item[data-tab="${tabName}"]`)?.classList.add('active');
            document.querySelector(`.nav-item[data-tab="${tabName}"]`)?.classList.add('active');

            // Close sidebar on mobile after selection
            document.querySelector('.sidebar').classList.remove('active');
            
            setActiveTab(tabName);
            this.render();
        };

        elements.sidebarItems.forEach(item => {
            item.addEventListener('click', () => this.handleTabSwitch(item.dataset.tab));
        });

        elements.bottomNavItems.forEach(item => {
            item.addEventListener('click', () => this.handleTabSwitch(item.dataset.tab));
        });

        // --- CORRECTED logic for the profile modal ---
        const profileMenuBtn = document.getElementById('profileMenuBtn'); // Target the button specifically
        const profileModal = document.getElementById('profileModal');

        if (profileMenuBtn && profileModal) {
            // Open the modal when the button is clicked
            profileMenuBtn.addEventListener('click', () => {
                toggleModal('profileModal', true);
            });

            // Close the modal when clicking the backdrop
            profileModal.addEventListener('click', (event) => {
                if (event.target === profileModal) {
                    toggleModal('profileModal', false);
                }
            });
        }

        // Listen for clicks on sidebar items
        elements.sidebarItems.forEach(item => {
            item.addEventListener('click', () => handleTabClick(item.dataset.tab));
        });

        // Listen for clicks on bottom nav items
        elements.bottomNavItems.forEach(item => {
            item.addEventListener('click', () => handleTabClick(item.dataset.tab));
        });

        elements.mobileMenuButton.addEventListener('click', () => {
            document.querySelector('.sidebar').classList.toggle('active');
        });
    
        const updateActiveTab = (tabName) => {
            // Deactivate all items in both nav systems
            elements.sidebarItems.forEach(item => item.classList.remove('active'));
            elements.bottomNavItems.forEach(item => item.classList.remove('active'));
    
            // Activate the correct item in both the sidebar and bottom bar
            document.querySelector(`.sidebar-item[data-tab="${tabName}"]`)?.classList.add('active');
            document.querySelector(`.nav-item[data-tab="${tabName}"]`)?.classList.add('active');
            
            // Hide the mobile sidebar after a selection is made
            document.querySelector('.sidebar').classList.remove('active');
            
            setActiveTab(tabName);
            this.render();
        };
    
        // Listen for clicks on sidebar items
        elements.sidebarItems.forEach(item => {
            item.addEventListener('click', () => updateActiveTab(item.dataset.tab));
        });
    
        // Listen for clicks on bottom nav items
        elements.bottomNavItems.forEach(item => {
            item.addEventListener('click', () => updateActiveTab(item.dataset.tab));
        });

        // --- UPDATED logic for the Floating Action Button ---
        const fabContainer = document.getElementById('fab-container');
        const fabMainBtn = document.getElementById('fab-main-btn');
        const actionSheetButtons = document.querySelectorAll('.action-sheet-btn');

        if (fabMainBtn) {
            fabMainBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                fabContainer.classList.toggle('active');
            });
        }

        // This part opens the correct modal when an option is clicked
        actionSheetButtons.forEach(option => {
            option.addEventListener('click', () => {
                const modalId = option.dataset.modal;
                if (modalId === 'transactionModal') {
                    showTransactionModal(appState);
                } else if (modalId) {
                    toggleModal(modalId, true);
                }
                fabContainer.classList.remove('active'); // Close the FAB menu
            });
        });

        // Close FAB when clicking anywhere else on the page
        document.querySelector('.content').addEventListener('click', () => {
            if (fabContainer && fabContainer.classList.contains('active')) {
                fabContainer.classList.remove('active');
            }
        });

        document.querySelector('.content').addEventListener('click', (event) => {
            const metric = event.target.closest('.toggable-metric');
            if (!metric) return;
        
            const { full, abbreviated } = metric.dataset;
            
            if (metric.textContent === abbreviated) {
                metric.textContent = full;
            } else {
                metric.textContent = abbreviated;
            }
        
            // Add this line to toggle the class
            metric.classList.toggle('is-expanded');
        });
    },

    // NEW: The single source of truth for changing tabs
    handleTabSwitch(tabName) {
        if (!tabName) return;

        // Deactivate all items in both nav systems
        elements.sidebarItems.forEach(item => item.classList.remove('active'));
        elements.bottomNavItems.forEach(item => item.classList.remove('active'));

        // Activate the correct items in both the sidebar and bottom bar
        const activeSidebarItem = document.querySelector(`.sidebar-item[data-tab="${tabName}"]`);
        const activeBottomNavItem = document.querySelector(`.nav-item[data-tab="${tabName}"]`);
        
        activeSidebarItem?.classList.add('active');
        activeBottomNavItem?.classList.add('active');
        
        // Move the floating pill indicator
        this.moveSidebarIndicator(activeSidebarItem);
        
        // Hide the mobile sidebar after a selection is made
        document.querySelector('.sidebar').classList.remove('active');
        document.querySelector('.overlay')?.classList.remove('active');
        
        setActiveTab(tabName);
        this.render();
    },

    // NEW: Helper function to move the indicator
    moveSidebarIndicator(activeItem) {
        if (!activeItem || !elements.sidebarIndicator) return;
        
        const top = activeItem.offsetTop;
        const height = activeItem.offsetHeight;

        elements.sidebarIndicator.style.transform = `translateY(${top}px)`;
        elements.sidebarIndicator.style.height = `${height}px`;
    },


    // NEW helper function to move the indicator
    moveSidebarIndicator(activeItem) {
        if (!activeItem || !elements.sidebarIndicator) return;
        
        const top = activeItem.offsetTop;
        const height = activeItem.offsetHeight;

        elements.sidebarIndicator.style.transform = `translateY(${top}px)`;
        elements.sidebarIndicator.style.height = `${height}px`;
    },

    // --- NEW FUNCTION to replace updateInvestmentTab ---
    updateInvestmentView(viewName) {
        if (!viewName) return;

        const currentViewEl = document.getElementById('currentInvestmentView');
        const viewNameCapitalized = viewName.charAt(0).toUpperCase() + viewName.slice(1);
        
        if (currentViewEl) {
            currentViewEl.textContent = viewNameCapitalized;
        }

        // --- Render content based on the selected view ---
        if (viewName === 'holdings') {
            renderHoldingsView(appState.investmentAccounts);
        } else if (viewName === 'allocation') {
            document.getElementById('investmentTabContent').innerHTML = `<div class="p-6"><div class="chart-container h-80"><canvas id="allocationChart"></canvas></div></div>`;
            createCharts(appState);
        } else if (viewName === 'performance') {
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

    // handlePortfolioViewClick(event){
    //     const clickedTab = event.target.closest('button');
    //     if (!clickedTab || clickedTab.dataset.tab === appState.activePortfolioView) return;
        
    //     appState.activePortfolioView = clickedTab.dataset.tab;
    //     this.render();
    // }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});