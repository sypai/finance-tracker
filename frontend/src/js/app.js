// src/js/app.js
import { appState } from './utils/state.js';
import { createCharts } from './components/charts.js';
import { 
    initUI,
    elements, 
    setActiveTab, 
    updateDateTime, 
    updateGreeting, 
    renderAccountsPage,
    renderTransactionInsights,
    renderTransactionStructure,
    loadTransactionData,
    renderInvestmentCard,
    renderInvestmentsTab,
    updateDashboardMetrics,
    renderExpenseAnalysisCard,
    updateHeaderButtons,
    toggleModal,
    showTransactionModal,
    showPortfolioModal,
    createHoldingRow,
    initTagInput,
    setSelectedTags, 
    initCategorySelect, 
    setSelectedCategory, 
    updateBrokerageFormHeaders 
} from './utils/ui/index.js';

const App = {
    init() {
        initUI();
        initTagInput(); 
        initCategorySelect();
        
        this.bindEvents();
        this.bindPortfolioModalEvents(); 
        this.bindAccountModalEvents(); 
        this.bindSettingsModalEvents(); // <-- ADD THIS LINE

        // Set initial active tabs
        this.updateTimelineUI('expenseTimelineTabs', appState.activeExpensePeriod);
        this.updateTimelineUI('investment-timeline-tabs', appState.activeInvestmentPeriod);
        this.updateTimelineUI('balanceHistoryTabs', appState.activeBalancePeriod);

        this.render(); 
        this.handleTabSwitch('dashboard'); 

        const initialActiveItem = document.querySelector('.sidebar-item.active');
        this.moveSidebarIndicator(initialActiveItem);
        
        updateDateTime(); 
        setInterval(updateDateTime, 1000 * 60);
    },

    render() {
        const activeTab = document.querySelector('.sidebar-item.active')?.dataset.tab || 'dashboard';

        updateGreeting();
        updateHeaderButtons(activeTab);
    
        if (activeTab === 'dashboard') {
            updateDashboardMetrics(appState);
            renderInvestmentCard(appState); 
            renderExpenseAnalysisCard(appState);
        } else if (activeTab === 'accounts') {
            renderAccountsPage(appState);
        } else if (activeTab === 'investments') {
            renderInvestmentsTab(appState);
        } 
        
        createCharts(appState);
    },

    bindEvents() {
        // --- Category Create Logic ---
        const newCategoryBtn = document.getElementById('newCategoryBtn');
        const categorySelect = document.getElementById('transactionCategory');
        const newCategoryInputGroup = document.getElementById('newCategoryInputGroup');
        const newCategoryNameInput = document.getElementById('newCategoryNameInput');
        const saveNewCategoryBtn = document.getElementById('saveNewCategoryBtn');
        const cancelNewCategoryBtn = document.getElementById('cancelNewCategoryBtn');

        if (newCategoryBtn && categorySelect && newCategoryInputGroup && newCategoryNameInput && saveNewCategoryBtn && cancelNewCategoryBtn) {
            const showInput = () => {
                categorySelect.classList.add('hidden');
                newCategoryBtn.classList.add('hidden');
                newCategoryInputGroup.classList.remove('hidden');
                newCategoryNameInput.focus();
            };
            const hideInput = () => {
                newCategoryInputGroup.classList.add('hidden');
                categorySelect.classList.remove('hidden');
                newCategoryBtn.classList.remove('hidden');
                newCategoryNameInput.value = '';
            };
            newCategoryBtn.addEventListener('click', showInput);
            cancelNewCategoryBtn.addEventListener('click', hideInput);
            saveNewCategoryBtn.addEventListener('click', () => {
                const newName = newCategoryNameInput.value.trim();
                if (!newName) return; 
                if (appState.categories.some(cat => cat.name.toLowerCase() === newName.toLowerCase())) {
                    return; 
                }
                const newCategory = {
                    id: `cat-${Date.now()}`,
                    name: newName,
                    iconId: '#icon-default' 
                };
                appState.categories.push(newCategory);
                // We need to re-render the select list inside the component
                // This is a simplified version. Ideally, categorySelect.js would handle this.
                initCategorySelect(); // Re-init to repopulate
                setSelectedCategory(newCategory.id); // Select it
                hideInput();
            });
        }
        
        // --- Transaction Modal View Switcher ---
        const entryModeSwitcher = document.getElementById('entry-mode-switcher');
        const manualView = document.getElementById('manual-entry-view');
        const importView = document.getElementById('import-view');

        if (entryModeSwitcher && manualView && importView) {
            entryModeSwitcher.addEventListener('change', (event) => {
                if (event.target.value === 'manual') {
                    manualView.classList.add('active-view');
                    importView.classList.remove('active-view');
                } else if (event.target.value === 'import') {
                    importView.classList.add('active-view');
                    manualView.classList.remove('active-view');
                }
            });
        }
        
        // --- "INSET JOURNAL" ACCORDION CLICK (Transactions) ---
        elements.transactionList.addEventListener('click', (event) => {
            const header = event.target.closest('.transaction-group-header');
            if (header) {
                header.parentElement.classList.toggle('is-open');
                document.querySelectorAll('#transactionList .transaction-group.is-open').forEach(openGroup => {
                    if (openGroup !== header.parentElement) {
                        openGroup.classList.remove('is-open');
                    }
                });
            }
        });

        // --- "INSET JOURNAL" ACCORDION CLICK (Accounts) ---
        if (elements.accountList) { 
            elements.accountList.addEventListener('click', (event) => {
                const header = event.target.closest('.account-group-header');
                if (header) {
                    header.parentElement.classList.toggle('is-open');
                    document.querySelectorAll('#accountList .account-group.is-open').forEach(openGroup => {
                        if (openGroup !== header.parentElement) {
                            openGroup.classList.remove('is-open');
                        }
                    });
                }
            });
        }

        // --- "INSET JOURNAL" CARD CLICK (Transactions) ---
        elements.transactionList.addEventListener('click', (event) => {
            const row = event.target.closest('.transaction-card'); 
            if (row) {
                event.preventDefault(); 
                const transactionId = parseInt(row.dataset.transactionId);
                const transaction = appState.transactions.find(t => t.id === transactionId);
                if (transaction) {
                    showTransactionModal(appState, transaction);
                }
            }
        });

        // --- "INSET JOURNAL" LIVE SEARCH (Transactions) ---
        const transactionSearchInput = document.getElementById('transactionSearch');
        if (transactionSearchInput) {
             transactionSearchInput.addEventListener('input', (event) => {
                const searchTerm = event.target.value.toLowerCase();
                document.querySelectorAll('.transaction-group').forEach(group => {
                    let groupHasVisibleCards = false;
                    group.querySelectorAll('.day-column').forEach(column => {
                        let columnHasVisibleCards = false;
                        column.querySelectorAll('.transaction-card').forEach(card => {
                            const description = card.querySelector('.font-semibold').textContent.toLowerCase();
                            const account = card.querySelector('.account-name')?.textContent.toLowerCase() || card.querySelector('.text-sm').textContent.toLowerCase(); // Updated selector
                            const amount = card.querySelector('.mono').textContent.toLowerCase();
                            const isMatch = description.includes(searchTerm) || 
                                          account.includes(searchTerm) || 
                                          amount.includes(searchTerm);
                            card.classList.toggle('hidden', !isMatch);
                            if (isMatch) {
                                columnHasVisibleCards = true;
                                groupHasVisibleCards = true;
                            }
                        });
                        column.classList.toggle('hidden', !columnHasVisibleCards);
                    });
                    group.classList.toggle('hidden', !groupHasVisibleCards);
                });
            });
        }
        
        // --- "INSET JOURNAL" LIVE SEARCH (Accounts) ---
        const accountSearchInput = document.getElementById('accountSearch');
        if (accountSearchInput) {
            accountSearchInput.addEventListener('input', (event) => {
                const searchTerm = event.target.value.toLowerCase();
                document.querySelectorAll('#accountList .account-group').forEach(group => {
                    let groupHasVisibleCards = false;
                    group.querySelectorAll('.account-list-card').forEach(card => {
                        const accountName = card.querySelector('.account-name').textContent.toLowerCase();
                        const accountType = card.querySelector('.account-details').textContent.toLowerCase();
                        const isMatch = accountName.includes(searchTerm) || accountType.includes(searchTerm);
                        card.classList.toggle('hidden', !isMatch);
                        if (isMatch) {
                            groupHasVisibleCards = true;
                        }
                    });
                    group.classList.toggle('hidden', !groupHasVisibleCards);
                });
            });
        }
        
        // --- Main Navigation & Header Buttons ---
        elements.mobileMenuButton.addEventListener('click', () => document.querySelector('.sidebar').classList.toggle('active'));
        elements.addTransactionBtn.addEventListener('click', () => showTransactionModal(appState));
        elements.addAccountBtn.addEventListener('click', () => {
            this.switchAccountView('account-selection-view', true); // Reset to main view
            toggleModal('addAccountModal', true);
        });
        elements.addInvestmentBtn.addEventListener('click', () => showPortfolioModal());

        // --- Timeline Tabs ---
        elements.expenseTimelineTabs.addEventListener('click', (event) => this.handleTimelineClick(event));
        elements.balanceHistoryTabs.addEventListener('click', (event) => this.handleBalanceTimelineClick(event));
        const investmentTimelineTabs = document.getElementById('investment-timeline-tabs');
        if (investmentTimelineTabs) {
            investmentTimelineTabs.addEventListener('click', (event) => this.handleInvestmentTimelineClick(event));
        }

        // --- Account Filter Listener ---
        if (elements.accountFilter) {
            elements.accountFilter.addEventListener('change', () => {
                createCharts(appState);
            });
        }

        // --- Global Click Listener (for modals, etc.) ---
        document.body.addEventListener('click', (event) => {
            // Close any modal
            if (event.target.matches('.close-modal-btn')) {
                event.target.closest('.modal-backdrop').classList.remove('active');
            }

            // --- THIS IS THE FIX ---
            // Listen for the delete transaction button
            else if (event.target.id === 'deleteTransactionBtn' || event.target.closest('#deleteTransactionBtn')) {
                const button = event.target.id === 'deleteTransactionBtn' ? event.target : event.target.closest('#deleteTransactionBtn');
                const transactionId = parseInt(button.dataset.transactionId);
                if (transactionId) {
                    this.showDeleteConfirmation('transaction', { transactionId });
                }
            }
            // --- END OF FIX ---

            // Account Actions Modals (Delete, Edit)
            else if (event.target.closest('[data-account-actions-id]')) {
                const actionsButton = event.target.closest('[data-account-actions-id]');
                const accountId = parseInt(actionsButton.dataset.accountActionsId);
                this.showAccountActions(accountId);
            }
            else if (event.target.id === 'cancelAccountActionsBtn') {
                toggleModal('accountActionsModal', false);
            }
            else if (event.target.id === 'deleteAccountBtn') {
                // --- THIS IS THE FIX ---
                toggleModal('accountActionsModal', false); // <-- ADD THIS LINE
                // --- END OF FIX ---
                const accountId = parseInt(event.target.dataset.accountId);
                this.showDeleteConfirmation('account', { accountId });
            }
            else if (event.target.id === 'editAccountBtn') {
                console.log('Edit account:', event.target.dataset.accountId);
                toggleModal('accountActionsModal', false);
            }
            else if (event.target.id === 'cancelHoldingActionsBtn') {
                toggleModal('holdingActionsModal', false);
            }
            else if (event.target.id === 'editHoldingBtn') {
                // Get data stored on the button
                const portfolioId = parseInt(event.target.dataset.portfolioId);
                const holdingId = event.target.dataset.holdingId;
                
                // Find the objects and show the edit modal
                const portfolio = appState.investmentAccounts.find(p => p.id === portfolioId);
                const holding = portfolio?.holdings.find(h => h.name.replace(/\s+/g, '-').toLowerCase() === holdingId);
                
                if (portfolio && holding) {
                    this.showEditHoldingModal(portfolio, holding);
                    toggleModal('holdingActionsModal', false); // Close this modal
                }
            }
            else if (event.target.id === 'deleteHoldingBtn') {
                // Get data stored on the button
                const portfolioId = parseInt(event.target.dataset.portfolioId);
                const holdingId = event.target.dataset.holdingId;

                toggleModal('holdingActionsModal', false); // Close this modal
                this.showDeleteConfirmation('holding', { portfolioId, holdingId });
            }
            // --- END NEW ---
            else if (event.target.id === 'cancelDeleteBtn') {
                toggleModal('deleteConfirmationModal', false);
            }
            // --- THIS IS THE FIX ---
            else if (event.target.id === 'confirmDeleteBtn') {
                this.handleConfirmDelete(); 
            }
            // --- END OF FIX ---
            
            // Other modal/tab logic
            else if (event.target.id === 'modalAddAccountBtn') {
                toggleModal('transactionModal', false);
                this.switchAccountView('account-selection-view', true); // Reset
                toggleModal('addAccountModal', true);
            }
            else if (event.target.id === 'zeroStateAddPortfolioBtn') {
                showPortfolioModal(); 
            }
            else if (event.target.dataset.tabLink) {
                const tabLink = event.target.dataset.tabLink;
                setActiveTab(tabLink);
                if (tabLink === 'accounts') {
                    this.switchAccountView('account-selection-view', true); // Reset
                    toggleModal('addAccountModal', true);
                }
                if (tabLink === 'investments') toggleModal('addPortfolioModal', true);
                this.render();
            }
            
            // FAB Logic
            const fabContainer = document.getElementById('fab-container');
            const fabMainBtn = document.getElementById('fab-main-btn');
            if (fabContainer && fabContainer.classList.contains('active') && !event.target.closest('#fab-container') && !event.target.closest('#fab-main-btn')) {
                fabContainer.classList.remove('active');
            }

            // Metric Toggle Logic
            const metric = event.target.closest('.toggable-metric');
            if (metric) {
                const { full, abbreviated } = metric.dataset;
                if (metric.textContent === abbreviated) {
                    metric.textContent = full;
                } else {
                    metric.textContent = abbreviated;
                }
                metric.classList.toggle('is-expanded');
            }
        });

        // --- Investment View Selector ---
        const viewSelector = document.getElementById('investmentViewSelector');
        if (viewSelector) {
            const btn = document.getElementById('investmentViewBtn');
            const dropdown = document.getElementById('investmentViewDropdown');
            const chevron = btn.querySelector('.chevron-icon');
            btn.addEventListener('click', (event) => {
                event.stopPropagation();
                dropdown.classList.toggle('hidden');
                chevron.classList.toggle('rotate-180');
            });
            dropdown.addEventListener('click', (event) => {
                const option = event.target.closest('.investment-view-option');
                if (option) {
                    event.preventDefault();
                    this.updateInvestmentView(option.dataset.view);
                }
            });
        }
        window.addEventListener('click', () => {
            const dropdown = document.getElementById('investmentViewDropdown');
            if (dropdown && !dropdown.classList.contains('hidden')) {
                dropdown.classList.add('hidden');
                document.querySelector('#investmentViewBtn .chevron-icon').classList.remove('rotate-180');
            }
        });

        const investmentJournalContent = document.getElementById('investmentJournalContent');
        if (investmentJournalContent) {
            investmentJournalContent.addEventListener('click', (event) => {
                
                // 1. Handle Accordion Toggle
                const header = event.target.closest('.portfolio-accordion-header');
                if (header) {
                    const group = header.closest('.portfolio-accordion-group');
                    if (!group) return;
                    const parentCard = group.closest('.investment-journal-card');
                    if (!parentCard) return;
                    const currentlyOpen = group.classList.contains('is-open');
                    parentCard.querySelectorAll('.portfolio-accordion-group.is-open').forEach(openGroup => {
                        if (openGroup !== group) {
                            openGroup.classList.remove('is-open');
                        }
                    });
                    group.classList.toggle('is-open', !currentlyOpen);
                }
                
                // 2. Handle Holding Actions Button
                const holdingBtn = event.target.closest('.holding-card-actions');
                if (holdingBtn) {
                    const portfolioId = parseInt(holdingBtn.dataset.portfolioId);
                    const holdingId = holdingBtn.dataset.holdingId; // ID is string
                    
                    // Find the objects to pass
                    const portfolio = appState.investmentAccounts.find(p => p.id === portfolioId);
                    const holding = portfolio?.holdings.find(h => h.name.replace(/\s+/g, '-').toLowerCase() === holdingId);

                    if(portfolio && holding) {
                        this.showHoldingActions(portfolio, holding);
                    }
                }
            });
        }

        // --- Tab Switching Logic ---
        const handleTabClick = (tabName) => { this.handleTabSwitch(tabName); };
        elements.sidebarItems.forEach(item => item.addEventListener('click', () => handleTabClick(item.dataset.tab)));
        elements.bottomNavItems.forEach(item => item.addEventListener('click', () => handleTabClick(item.dataset.tab)));

        // --- REFACTORED: Settings Modal Logic ---
        const profileSettingsBtn = document.getElementById('profileSettingsBtn'); // FIX 4: Use new ID
        const settingsModal = document.getElementById('settingsModal'); 
        const settingsLink = document.getElementById('settingsLink'); // FIX 5: Get the new sidebar link

        if (profileMenuBtn && settingsModal) {
            // Open the modal when the button is clicked
            profileMenuBtn.addEventListener('click', () => {
                toggleModal('settingsModal', true); // <-- New ID
            });

            // Close the modal when clicking the backdrop
            settingsModal.addEventListener('click', (event) => {
                if (event.target === settingsModal) {
                    toggleModal('settingsModal', false); // <-- New ID
                }
            });
        }
        // --- END REFACTORED ---

        // --- FAB Logic ---
        const fabContainer = document.getElementById('fab-container');
        const fabMainBtn = document.getElementById('fab-main-btn');
        const actionSheetButtons = document.querySelectorAll('.action-sheet-btn');
        if (fabMainBtn) {
            fabMainBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                fabContainer.classList.toggle('active');
            });
        }
        actionSheetButtons.forEach(option => {
            option.addEventListener('click', () => {
                const modalId = option.dataset.modal;
                if (modalId === 'transactionModal') {
                    showTransactionModal(appState);
                } else if (modalId === 'addAccountModal') {
                     this.switchAccountView('account-selection-view', true);
                     toggleModal(modalId, true);
                } else if (modalId) {
                    toggleModal(modalId, true);
                }
                fabContainer.classList.remove('active'); 
            });
        });


        // --- Global Form Submission Listener ---
        document.body.addEventListener('submit', (event) => {
            if (event.target.id === 'transactionForm') this.handleTransactionSubmit(event);
            if (event.target.id === 'addPortfolioForm') this.handlePortfolioSubmit(event);
            if (event.target.id === 'addFixedIncomeForm') this.handleFixedIncomeSubmit(event);
            if (event.target.id === 'addRetirementForm') this.handleEmployeeBenefitSubmit(event);
            if (event.target.id === 'addStockGrantForm') this.handleEmployeeBenefitSubmit(event); 
            if (event.target.id === 'addAccountForm') this.handleAccountFormSubmit(event);
            if (event.target.id === 'addCreditCardForm') this.handleAccountFormSubmit(event);
            if (event.target.id === 'addLoanForm') this.handleAccountFormSubmit(event);
            if (event.target.id === 'addCashForm') this.handleAccountFormSubmit(event);
            // --- NEW: Listen for the Edit Holding Form ---
            if (event.target.id === 'editHoldingForm') this.handleEditHoldingSubmit(event);
        
        });
    },

    handleTabSwitch(tabName) {
        if (!tabName) return;
        elements.sidebarItems.forEach(item => item.classList.remove('active'));
        elements.bottomNavItems.forEach(item => item.classList.remove('active'));
        const activeSidebarItem = document.querySelector(`.sidebar-item[data-tab="${tabName}"]`);
        const activeBottomNavItem = document.querySelector(`.nav-item[data-tab="${tabName}"]`);
        activeSidebarItem?.classList.add('active');
        activeBottomNavItem?.classList.add('active');
        this.moveSidebarIndicator(activeSidebarItem);
        document.querySelector('.sidebar').classList.remove('active');
        document.querySelector('.overlay')?.classList.remove('active');
        setActiveTab(tabName);
        if (tabName === 'transactions') {
            renderTransactionStructure(appState.transactions);
            requestAnimationFrame(() => {
                loadTransactionData(appState.transactions, appState.accounts, appState.categories, appState.tags);
                renderTransactionInsights(appState);
                createCharts(appState);
            });
        } else {
            this.render();
        }
    },

    moveSidebarIndicator(activeItem) {
        if (!activeItem || !elements.sidebarIndicator) return;
        const top = activeItem.offsetTop;
        const height = activeItem.offsetHeight;
        elements.sidebarIndicator.style.transform = `translateY(${top}px)`;
        elements.sidebarIndicator.style.height = `${height}px`;
    },

    updateInvestmentView(viewName) {
        if (!viewName) return;
        const currentViewEl = document.getElementById('currentInvestmentView');
        const viewNameCapitalized = viewName.charAt(0).toUpperCase() + viewName.slice(1);
        if (currentViewEl) {
            currentViewEl.textContent = viewNameCapitalized;
        }
        appState.activePortfolioView = viewName; 
        renderHoldingsJournal(appState.investmentAccounts); // Re-render journal
    },
    
    showAccountActions(accountId) {
        const account = appState.accounts.find(acc => acc.id === accountId);
        if (!account) return;
        document.getElementById('accountActionsTitle').textContent = account.name;
        document.getElementById('accountActionsDetails').textContent = 
            `${account.type} • Balance: ₹${account.balance.toLocaleString('en-IN')}`;
        document.getElementById('editAccountBtn').dataset.accountId = accountId;
        document.getElementById('deleteAccountBtn').dataset.accountId = accountId;
        toggleModal('accountActionsModal', true);
    },

    // --- MODIFIED Delete Confirmation ---
    showDeleteConfirmation(type, ids) {
        const modal = document.getElementById('deleteConfirmationModal');
        const confirmBtn = document.getElementById('confirmDeleteBtn');
        const title = modal.querySelector('h3');
        const message = modal.querySelector('p');
        
        // Clear all previous data attributes
        confirmBtn.dataset.deleteType = '';
        confirmBtn.dataset.accountId = '';
        confirmBtn.dataset.transactionId = '';
        confirmBtn.dataset.portfolioId = '';
        confirmBtn.dataset.holdingId = '';

        if (type === 'account') {
            title.textContent = 'Delete Account?';
            message.textContent = 'This will permanently delete the account and all of its associated transactions. This action cannot be undone.';
            confirmBtn.dataset.deleteType = 'account';
            confirmBtn.dataset.accountId = ids.accountId;
        }
        else if (type === 'transaction') {
            title.textContent = 'Delete Transaction?';
            message.textContent = 'This will permanently delete this transaction. This action cannot be undone.';
            confirmBtn.dataset.deleteType = 'transaction';
            confirmBtn.dataset.transactionId = ids.transactionId;
        }
        // --- ADD THIS NEW BLOCK ---
        else if (type === 'holding') {
            title.textContent = 'Delete Holding?';
            message.textContent = 'This will permanently delete this holding from your portfolio. This action cannot be undone.';
            confirmBtn.dataset.deleteType = 'holding';
            confirmBtn.dataset.portfolioId = ids.portfolioId;
            confirmBtn.dataset.holdingId = ids.holdingId;
        }
        // --- ADD THIS NEW BLOCK ---
        else if (type === 'deleteAllData') {
            title.textContent = 'Delete All Data?';
            message.textContent = 'This will permanently delete all your accounts, transactions, and investment data. This action cannot be undone.';
            confirmBtn.dataset.deleteType = 'deleteAllData';
        }
        // --- END OF NEW BLOCK ---
        // --- END OF NEW BLOCK ---

        toggleModal('deleteConfirmationModal', true);
    },
    
    // --- ADD THIS NEW FUNCTION ---
    deleteAllData() {
        appState.accounts = [];
        appState.transactions = [];
        appState.investmentAccounts = [];
        appState.portfolioHistory = [];
        // We keep tags and categories
        
        console.log("All user data deleted.");
        toggleModal('settingsModal', false); // Close settings
    },
    // --- END OF NEW FUNCTION ---

    // --- MODIFIED Master Delete Handler ---
    handleConfirmDelete() {
        const confirmBtn = document.getElementById('confirmDeleteBtn');
        const type = confirmBtn.dataset.deleteType;
        let activeTab = document.querySelector('.sidebar-item.active')?.dataset.tab || 'dashboard';

        if (type === 'account') {
            const accountId = parseInt(confirmBtn.dataset.accountId);
            this.deleteAccount(accountId);
            if (activeTab === 'accounts') {
                renderAccountsPage(appState);
                createCharts(appState);
            } else { this.render(); }
        } 
        else if (type === 'transaction') {
            const transactionId = parseInt(confirmBtn.dataset.transactionId);
            this.deleteTransaction(transactionId);
            if (activeTab === 'transactions') {
                renderTransactionStructure(appState.transactions);
                requestAnimationFrame(() => {
                    loadTransactionData(appState.transactions, appState.accounts, appState.categories, appState.tags);
                    renderTransactionInsights(appState);
                    createCharts(appState);
                });
            } else { this.render(); }
        }
        // --- ADD THIS NEW BLOCK ---
        else if (type === 'holding') {
            const portfolioId = parseInt(confirmBtn.dataset.portfolioId);
            const holdingId = confirmBtn.dataset.holdingId;
            
            this.deleteHolding(portfolioId, holdingId);
            
            if (activeTab === 'investments') {
                renderInvestmentsTab(appState);
                createCharts(appState);
            } else { this.render(); }
        }
        // --- ADD THIS NEW BLOCK ---
        else if (type === 'deleteAllData') {
            this.deleteAllData();
            // this.render(); // Force a full re-render
            // FIX: Force a re-render of the current active tab
            this.handleTabSwitch(activeTab);
        }
        // --- END OF NEW BLOCK ---
        // --- END OF NEW BLOCK ---
        
        toggleModal('deleteConfirmationModal', false);
    },



    // --- THIS IS THE FIX ---
    deleteAccount(accountId) {
        appState.accounts = appState.accounts.filter(acc => acc.id !== accountId);
        appState.transactions = appState.transactions.filter(t => t.accountId !== accountId);
        // NO UI LOGIC HERE
    },
    // --- END OF FIX ---

    // ... (All ...Submit functions are unchanged) ...
    handlePortfolioSubmit(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const portfolioType = formData.get('portfolioType'); 
        const currentAssetType = document.getElementById('currentAssetType').value;
        const holdingNames = formData.getAll('holdingName');
        const holdingTickers = formData.getAll('holdingTicker');
        const holdingUnits = formData.getAll('holdingUnits');
        const holdingBuyPrices = formData.getAll('holdingBuyPrice');
        const newHoldings = holdingNames.map((name, index) => {
            const units = parseFloat(holdingUnits[index]);
            const buyPrice = parseFloat(holdingBuyPrices[index]);
            return {
                type: currentAssetType, 
                name: name,
                ticker: holdingTickers[index] || null,
                quantity: units,
                buyValue: units * buyPrice,
                currentValue: units * buyPrice 
            };
        });
        const newPortfolio = {
            id: Date.now(),
            name: formData.get('name'),
            type: portfolioType, 
            holdings: newHoldings
        };
        appState.investmentAccounts.push(newPortfolio);
        toggleModal('addPortfolioModal', false);
        this.render(); 
    },
    handleFixedIncomeSubmit(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const holding = {
            type: formData.get('type'), 
            name: formData.get('type') === 'fd' ? 'Fixed Deposit' : 
                  formData.get('type') === 'p2p' ? 'P2P Investment' : 'Bond',
            quantity: 1, 
            buyValue: parseFloat(formData.get('investedAmount')),
            currentValue: parseFloat(formData.get('investedAmount')), 
            meta: {
                rate: parseFloat(formData.get('interestRate')),
                investmentDate: formData.get('investmentDate'),
                maturityDate: formData.get('maturityDate')
            }
        };
        const newPortfolio = {
            id: Date.now(),
            name: formData.get('name'), 
            type: formData.get('portfolioType'), 
            holdings: [holding] 
        };
        appState.investmentAccounts.push(newPortfolio);
        toggleModal('addPortfolioModal', false);
        this.render();
    },
    handleEmployeeBenefitSubmit(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const assetType = formData.get('assetType'); 
        let holding;
        if (assetType === 'retirement_fund') {
            holding = {
                type: formData.get('type'), 
                name: formData.get('type').toUpperCase(), 
                quantity: 1,
                buyValue: parseFloat(formData.get('currentBalance')),
                currentValue: parseFloat(formData.get('currentBalance')),
                meta: {
                    monthlyContribution: parseFloat(formData.get('monthlyContribution')) || 0
                }
            };
        } else if (assetType === 'stock_grant') {
            const vestedUnits = parseFloat(formData.get('vestedUnits')) || 0;
            const grantPrice = parseFloat(formData.get('grantPrice')) || 0;
            const marketPrice = parseFloat(formData.get('marketPrice')) || 0;
            const unvestedUnits = parseFloat(formData.get('unvestedUnits')) || 0;
            holding = {
                type: formData.get('type'), 
                name: formData.get('name'), 
                ticker: formData.get('ticker') || null,
                quantity: vestedUnits + unvestedUnits, 
                buyValue: vestedUnits * grantPrice,
                currentValue: vestedUnits * marketPrice,
                meta: {
                    vestedUnits: vestedUnits,
                    unvestedUnits: unvestedUnits,
                    grantPrice: grantPrice,
                    marketPrice: marketPrice,
                    nextVestingDate: formData.get('nextVestingDate') || null
                }
            };
        }
        const newPortfolio = {
            id: Date.now(),
            name: formData.get('name'), 
            type: formData.get('portfolioType'), 
            holdings: [holding]
        };
        appState.investmentAccounts.push(newPortfolio);
        toggleModal('addPortfolioModal', false);
        this.render();
    },
    handleTransactionSubmit(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const accountIdOrCash = formData.get('accountId');
        let transactionAccountId;
        let account;

        if (accountIdOrCash === 'cash') {
            // Find the 'Cash' account by name
            const cashAccount = appState.accounts.find(acc => acc.type.toLowerCase() === 'cash');
            if (!cashAccount) {
                console.error("No 'Cash' account found!");
                return;
            }
            transactionAccountId = cashAccount.id; // Use the actual ID
        } else {
            transactionAccountId = parseInt(accountIdOrCash); 
            account = appState.accounts.find(acc => acc.id === transactionAccountId);
            if (!account) {
                 console.error("Selected account not found!");
                 return; 
            }
        }
        const amount = parseFloat(formData.get('amount'));
        const type = formData.get('type');
        const transactionId = formData.get('id') ? parseInt(formData.get('id')) : null; 
        const tagIds = formData.get('tagIds') 
            ? formData.get('tagIds').split(',').filter(id => id.length > 0) 
            : [];
        const categoryId = formData.get('categoryId');

        if (transactionId) {
            const transaction = appState.transactions.find(t => t.id === parseInt(transactionId));
            if (transaction) {
                const oldAmount = transaction.amount;
                const oldType = transaction.type;
                const oldAccountId = transaction.accountId;
                const oldAccount = appState.accounts.find(acc => acc.id === oldAccountId);
                if (oldAccount) {
                    oldAccount.balance += (oldType === 'income' ? -oldAmount : oldAmount);
                }
                const newAccount = appState.accounts.find(acc => acc.id === transactionAccountId);
                if (newAccount) {
                    newAccount.balance += (type === 'income' ? amount : -amount);
                }
                transaction.accountId = transactionAccountId;
                transaction.description = formData.get('description');
                transaction.amount = amount;
                transaction.type = type;
                transaction.tagIds = tagIds; 
                transaction.categoryId = categoryId;
            }
        } else {
            // This now correctly handles the 'Cash' account ID
            const account = appState.accounts.find(acc => acc.id === transactionAccountId);
            if (account) {
                account.balance += type === 'income' ? amount : -amount;
            }
            appState.transactions.unshift({
                id: Date.now(),
                accountId: transactionAccountId,
                date: new Date().toISOString(), 
                description: formData.get('description'),
                amount,
                type,
                categoryId: categoryId,
                tagIds: tagIds, 
            });
        }
        
        toggleModal('transactionModal', false);
        event.target.reset();
        setSelectedTags([]);
        setSelectedCategory('cat-uncategorized'); 
        this.render(); 
    },
    handleAccountFormSubmit(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const formType = formData.get('accountFormType'); 
        const name = formData.get('name');
        const number = formData.get('number') || ''; 
        let balance = parseFloat(formData.get('balance'));
        let type = formData.get('type'); 
        if (formType === 'card' || formType === 'loan') {
            balance = -Math.abs(balance);
        }
        if (formType === 'card') {
            type = 'Credit Card';
        }

        // Check for duplicates
        const accountExists = appState.accounts.some(acc => acc.name.toLowerCase() === name.toLowerCase());
        if (accountExists && formType.toLowerCase() === 'cash') {
             // Silently ignore if 'Cash' account already exists
        } else if (accountExists) {
            alert(`An account named "${name}" already exists.`);
            return;
        }

        const newAccount = {
            id: Date.now(),
            name: name,
            number: number,
            type: type,
            balance: balance,
            createdAt: new Date(),
            history: [{ date: new Date().toISOString().split('T')[0], balance: balance }]
        };
        appState.accounts.push(newAccount);
        toggleModal('addAccountModal', false);
        event.target.reset();
        this.render(); 
        this.switchAccountView('account-selection-view', true);
    },

    // --- THIS IS THE FIX ---
    deleteTransaction(transactionId) {
        const transactionIndex = appState.transactions.findIndex(t => t.id === transactionId);
        if (transactionIndex === -1) {
            console.error("Could not find transaction to delete");
            return;
        }

        const transaction = appState.transactions[transactionIndex];
        
        // 1. Revert balance change
        const account = appState.accounts.find(acc => acc.id === transaction.accountId);
        if (account) {
            account.balance += (transaction.type === 'income' ? -transaction.amount : transaction.amount);
        }
        
        // 2. Remove transaction from the state
        appState.transactions.splice(transactionIndex, 1);
        
        toggleModal('transactionModal', false); // Close the *edit* modal
        
        console.log(`Deleted transaction ${transactionId}`);
        // NO RENDER LOGIC HERE
    },
    // --- END OF FIX ---

    // --- NEW: Investment Delete Functions ---
    deletePortfolio(portfolioId) {
        appState.investmentAccounts = appState.investmentAccounts.filter(p => p.id !== portfolioId);
        console.log(`Deleted portfolio ${portfolioId}`);
    },

    deleteHolding(portfolioId, holdingId) {
        const portfolio = appState.investmentAccounts.find(p => p.id === portfolioId);
        if (portfolio) {
            portfolio.holdings = portfolio.holdings.filter(h => 
                (h.name.replace(/\s+/g, '-').toLowerCase()) !== holdingId
            );
            console.log(`Deleted holding ${holdingId} from portfolio ${portfolioId}`);
            
            // --- "Elite" UX: If last holding, delete parent portfolio ---
            if (portfolio.holdings.length === 0) {
                this.deletePortfolio(portfolioId);
            }
        }
    },
    // --- END NEW ---
    
    // --- (Timeline Handlers) ---
    updateTimelineUI(containerId, activePeriod) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.querySelectorAll('.timeline-selector-btn, .expense-tab').forEach(btn => {
            // Use .closest to find the parent wrapper for class logic
            const wrapper = btn.closest('.timeline-selector-wrapper');
            let baseBtnClass = 'timeline-selector-btn'; // Default
            
            // This is a check for the old .expense-tab class for safety
            if (!wrapper) {
                baseBtnClass = 'expense-tab';
            }

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
    },

    handleTimelineClick(event) {
        const clickedTab = event.target.closest('button[data-period]');
        if (!clickedTab || clickedTab.dataset.period === appState.activeExpensePeriod) return;
        
        appState.activeExpensePeriod = clickedTab.dataset.period;
        this.updateTimelineUI('expenseTimelineTabs', appState.activeExpensePeriod);
        this.render();
    },

    handleBalanceTimelineClick(event) {
        const clickedTab = event.target.closest('button[data-period]');
        if (!clickedTab || clickedTab.dataset.period === appState.activeBalancePeriod) return;
        
        appState.activeBalancePeriod = clickedTab.dataset.period;
        this.updateTimelineUI('balanceHistoryTabs', appState.activeBalancePeriod);
        createCharts(appState); 
    },

    handleInvestmentTimelineClick(event) {
        const clickedTab = event.target.closest('button[data-period]');
        if (!clickedTab || clickedTab.dataset.period === appState.activeInvestmentPeriod) return;

        appState.activeInvestmentPeriod = clickedTab.dataset.period;
        this.updateTimelineUI('investment-timeline-tabs', appState.activeInvestmentPeriod);
        createCharts(appState);
    },

    // --- ADD THIS NEW FUNCTION ---
    bindSettingsModalEvents() {
        const modal = document.getElementById('settingsModal');
        if (!modal) return;

        const nav = modal.querySelector('.settings-nav');
        const indicator = modal.querySelector('.settings-nav-indicator');
        const navButtons = modal.querySelectorAll('.settings-nav-btn');
        const contentPanes = modal.querySelectorAll('.settings-content');

        // 1. Handle sub-navigation clicks
        nav.addEventListener('click', (e) => {
            const button = e.target.closest('.settings-nav-btn');
            if (!button) return;

            // Get target content ID
            const contentId = button.dataset.content;
            const targetPane = document.getElementById(contentId);

            // Deactivate all
            navButtons.forEach(btn => btn.classList.remove('active'));
            contentPanes.forEach(pane => pane.classList.remove('active'));

            // Activate clicked
            button.classList.add('active');
            if (targetPane) {
                targetPane.classList.add('active');
            }

            // Move indicator
            if (indicator) {
                indicator.style.transform = `translateY(${button.offsetTop - nav.firstElementChild.offsetTop}px)`;
                indicator.style.height = `${button.offsetHeight}px`;
            }
        });

        // 2. Handle "Delete All Data" button
        const deleteDataBtn = modal.querySelector('#deleteAllDataBtn');
        if (deleteDataBtn) {
            deleteDataBtn.addEventListener('click', () => {
                this.showDeleteConfirmation('deleteAllData', {});
            });
        }
        
        // 3. Handle "Log Out" (Placeholder)
        const logoutBtn = modal.querySelector('#logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                console.log("Log Out Clicked");
                // In a real app, this would redirect to signin.html
            });
        }
    },

    // --- (Modal bind/switch functions are unchanged) ---
    bindPortfolioModalEvents() {
        const modal = document.getElementById('addPortfolioModal');
        if (!modal) return;
        const viewContainer = document.getElementById('portfolio-modal-view-container');
        const modalTitle = document.getElementById('portfolioModalTitle');
        const selectionView = document.getElementById('portfolio-selection-view');
        const assetSwitcher = document.getElementById('brokerage-asset-switcher');
        const hiddenAssetType = document.getElementById('currentAssetType');
        const holdingsContainer = document.getElementById('holdingsContainer');
        const addHoldingBtn = document.getElementById('addHoldingBtn');
        const investmentDateInput = document.getElementById('fi-investment-date');
        const maturityDateInput = document.getElementById('fi-maturity-date');
        const switchView = (viewId, title) => {
            viewContainer.querySelectorAll('.modal-view').forEach(view => {
                view.classList.remove('active-view');
            });
            const targetView = document.getElementById(viewId);
            if (targetView) {
                targetView.classList.add('active-view');
            }
            if (modalTitle) modalTitle.textContent = title;
            if (viewId === 'portfolio-fixed-income-view' && investmentDateInput && maturityDateInput) {
                const today = new Date().toISOString().split('T')[0];
                investmentDateInput.max = today;
                if (investmentDateInput.value) {
                    const minMaturity = new Date(investmentDateInput.value);
                    minMaturity.setDate(minMaturity.getDate() + 1);
                    maturityDateInput.min = minMaturity.toISOString().split('T')[0];
                } else {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    maturityDateInput.min = tomorrow.toISOString().split('T')[0];
                }
            }
        };
        modal.addEventListener('click', (e) => {
            const selectBtn = e.target.closest('.portfolio-select-card');
            if (selectBtn) {
                const viewName = selectBtn.dataset.view;
                if (viewName === 'brokerage') {
                    switchView('portfolio-brokerage-view', 'Add Brokerage Account');
                } else if (viewName === 'fixed-income') {
                    switchView('portfolio-fixed-income-view', 'Add Fixed Income');
                } else if (viewName === 'employee') {
                    switchView('portfolio-employee-view', 'Add Employee Benefits');
                } else if (viewName === 'other') {
                    switchView('portfolio-other-view', 'Add Other Assets');
                }
            }
        });
        modal.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-back-btn')) {
                switchView('portfolio-selection-view', 'Add Portfolio');
            }
        });
        if (assetSwitcher) {
            assetSwitcher.addEventListener('change', (e) => {
                const newAssetType = e.target.value; 
                hiddenAssetType.value = newAssetType;
                updateBrokerageFormHeaders(newAssetType);
                holdingsContainer.innerHTML = '';
                holdingsContainer.appendChild(createHoldingRow(newAssetType));
            });
        }
        if (addHoldingBtn) {
            addHoldingBtn.addEventListener('click', () => {
                const currentAssetType = hiddenAssetType.value;
                holdingsContainer.appendChild(createHoldingRow(currentAssetType));
            });
        }
        if (investmentDateInput && maturityDateInput) {
            investmentDateInput.addEventListener('change', () => {
                if (investmentDateInput.value) {
                    const minMaturity = new Date(investmentDateInput.value);
                    minMaturity.setDate(minMaturity.getDate() + 1);
                    maturityDateInput.min = minMaturity.toISOString().split('T')[0];
                    if (maturityDateInput.value && maturityDateInput.value < maturityDateInput.min) {
                        maturityDateInput.value = '';
                    }
                } else {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    maturityDateInput.min = tomorrow.toISOString().split('T')[0];
                }
            });
        }
        const employeeSwitcher = document.getElementById('employee-asset-switcher');
        const retirementForm = document.getElementById('addRetirementForm');
        const stockGrantForm = document.getElementById('addStockGrantForm');
        if (employeeSwitcher && retirementForm && stockGrantForm) {
            employeeSwitcher.addEventListener('change', (e) => {
                if (e.target.value === 'retirement') {
                    retirementForm.classList.remove('hidden');
                    stockGrantForm.classList.add('hidden');
                } else if (e.target.value === 'stock_grant') {
                    retirementForm.classList.add('hidden');
                    stockGrantForm.classList.remove('hidden');
                }
            });
        }
    },

    bindAccountModalEvents() {
        const modal = document.getElementById('addAccountModal');
        if (!modal) return;
        modal.addEventListener('click', (e) => {
            const selectBtn = e.target.closest('.portfolio-select-card');
            if (selectBtn) {
                const viewId = selectBtn.dataset.view; 
                this.switchAccountView(viewId);
            }
            const backBtn = e.target.closest('.modal-back-btn');
            if (backBtn) {
                this.switchAccountView('account-selection-view');
            }
        });
    },

    switchAccountView(viewId, isReset = false) {
        const viewContainer = document.getElementById('account-modal-view-container');
        const modalTitle = document.getElementById('accountModalTitle');
        if (!viewContainer || !modalTitle) return;
        let title = "Add an Account"; 
        if (viewId === 'account-form-bank') title = "Add Bank Account";
        else if (viewId === 'account-form-card') title = "Add Credit Card";
        else if (viewId === 'account-form-loan') title = "Add Loan Account";
        else if (viewId === 'account-form-cash') title = "Add Cash Account";
        modalTitle.textContent = title;
        if (isReset) {
            viewContainer.querySelectorAll('.modal-view').forEach(view => {
                view.classList.toggle('active-view', view.id === 'account-selection-view');
            });
            return;
        }
        viewContainer.querySelectorAll('.modal-view').forEach(view => {
            view.classList.remove('active-view');
        });
        const targetView = document.getElementById(viewId);
        if (targetView) {
            targetView.classList.add('active-view');
        }
    },

    // --- NEW: Holding Actions Modal Functions ---
    showHoldingActions(portfolio, holding) {
        if (!portfolio || !holding) return;

        const modal = document.getElementById('holdingActionsModal');
        if (!modal) return;
        
        const holdingId = holding.name.replace(/\s+/g, '-').toLowerCase();

        // Populate modal content
        modal.querySelector('#holdingActionsTitle').textContent = holding.name;
        modal.querySelector('#holdingActionsDetails').textContent = `${holding.type} • ${holding.quantity} Units`;

        // Store IDs on buttons
        modal.querySelector('#editHoldingBtn').dataset.portfolioId = portfolio.id;
        modal.querySelector('#editHoldingBtn').dataset.holdingId = holdingId;
        modal.querySelector('#deleteHoldingBtn').dataset.portfolioId = portfolio.id;
        modal.querySelector('#deleteHoldingBtn').dataset.holdingId = holdingId;

        toggleModal('holdingActionsModal', true);
    },

    showEditHoldingModal(portfolio, holding) {
        const modal = document.getElementById('editHoldingModal');
        const form = document.getElementById('editHoldingForm');
        if (!modal || !form) return;

        const holdingId = holding.name.replace(/\s+/g, '-').toLowerCase();
        
        // Calculate Avg. Buy Price from state
        const avgBuyPrice = holding.quantity > 0 ? (holding.buyValue / holding.quantity) : 0;

        // Populate hidden fields
        form.elements.portfolioId.value = portfolio.id;
        form.elements.holdingId.value = holdingId;

        // Populate visible fields
        form.elements.name.value = holding.name;
        form.elements.ticker.value = holding.ticker || '';
        form.elements.quantity.value = holding.quantity;
        form.elements.avgBuyPrice.value = avgBuyPrice.toFixed(2);

        toggleModal('editHoldingModal', true);
    }
    // --- END NEW ---
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

