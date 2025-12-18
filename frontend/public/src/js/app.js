// src/js/app.js
import { appState, addTransactionToState } from './utils/state.js';
import { checkBackendHealth } from './utils/api.js';

import { createCharts } from './components/charts.js';
import { parseCSV } from './components/csvParser.js';
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

// --- PERSISTENCE UTILITY ---
const STORAGE_KEY = 'arthaAppState';

function saveAppState() {
    try {
        const stateToSave = JSON.stringify(appState);
        localStorage.setItem(STORAGE_KEY, stateToSave);
    } catch (e) {
        console.error("Failed to save state:", e);
    }
}

// --- END PERSISTENCE UTILITY ---

const App = {
    async init() {
        console.log("App.init started...");
        
        // 1. --- MAGIC LINK HANDSHAKE ---
        // Check if the URL has a token (e.g., dashboard.html?token=...)
        const urlParams = new URLSearchParams(window.location.search);
        const urlToken = urlParams.get('token');
    
        if (urlToken) {
            // Save the new session token
            localStorage.setItem('artha_jwt', urlToken);
            // Clean the URL so the token doesn't stay in the address bar
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    
        // 2. --- SESSION CHECK ---
        const jwt = localStorage.getItem('artha_jwt');
        if (!jwt) {
            // If no token exists, redirect to sign-in page
            window.location.href = 'signin.html';
            return;
        }
    
        // 3. --- ONBOARDING BRIDGE ---
        try {
            // We call the backend to get the current user details
            const user = await api.getMe(); 
    
            // If first_name is missing, the user hasn't finished onboarding
            if (!user.first_name || user.first_name.trim() === "") {
                window.location.href = 'welcome.html';
                return;
            }
        } catch (err) {
            console.error("Auth verification failed:", err);
            // If the token is invalid or expired, clear it and go to signin
            localStorage.removeItem('artha_jwt');
            window.location.href = 'signin.html';
            return;
        }
    
        // 4. --- APP INITIALIZATION (Existing Logic) ---
        initUI();
    
        const isBackendLive = await checkBackendHealth();
        this.updateConnectionStatus(isBackendLive);
    
        initTagInput(); 
        initCategorySelect();
        
        console.log("Binding events...");
        this.bindEvents();
        this.bindPortfolioModalEvents(); 
        this.bindAccountModalEvents(); 
        this.bindSettingsModalEvents();
    
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

    updateConnectionStatus(isLive) {
        // You can add a small dot or text in your header to show status
        const statusEl = document.getElementById('connection-status');
        if (statusEl) {
            statusEl.textContent = isLive ? '● Connected' : '○ Offline';
            statusEl.style.color = isLive ? '#10b981' : '#ef4444'; // Green vs Red
        }
        console.log(isLive ? "Backend is reachable" : "Backend is unreachable");
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
        console.log("App.bindEvents is running...");

        // --- 1. CRITICAL: Global Form Submission Listener (MOVED TO TOP) ---
        // We attach this first to ensure forms always work, even if UI bells & whistles fail later.
        document.body.addEventListener('submit', (event) => {
            console.log("Global submit caught for:", event.target.id); 

            // Transaction Form
            if (event.target.id === 'transactionForm') {
                event.preventDefault(); // STOP RELOAD IMMEDIATELY
                console.log("Processing transaction submit...");
                this.handleTransactionSubmit(event);
            }
            // Portfolio Form
            else if (event.target.id === 'addPortfolioForm') {
                event.preventDefault();
                this.handlePortfolioSubmit(event);
            }
            // Fixed Income Form
            else if (event.target.id === 'addFixedIncomeForm') {
                event.preventDefault();
                this.handleFixedIncomeSubmit(event);
            }
            // Employee Benefits
            else if (['addRetirementForm', 'addStockGrantForm'].includes(event.target.id)) {
                event.preventDefault();
                this.handleEmployeeBenefitSubmit(event);
            }
            // Accounts
            else if (['addAccountForm', 'addCreditCardForm', 'addLoanForm', 'addCashForm'].includes(event.target.id)) {
                event.preventDefault();
                this.handleAccountFormSubmit(event);
            }
            // Edit Holding
            else if (event.target.id === 'editHoldingForm') {
                event.preventDefault();
                this.handleEditHoldingSubmit(event);
            }
        });

        // --- TRANSFER TYPE TOGGLER ---
        const transactionForm = document.getElementById('transactionForm');
        if (transactionForm) {
            const typeInputs = transactionForm.querySelectorAll('input[name="type"]');
            const targetField = document.getElementById('transferTargetField');
            const categoryField = document.getElementById('category-select-container').parentElement; // Get the parent div of category

            typeInputs.forEach(input => {
                input.addEventListener('change', (e) => {
                    if (e.target.value === 'transfer') {
                        targetField.classList.remove('hidden');
                        categoryField.classList.add('hidden'); // Hide category for transfers
                        
                        // Reuse your populate function for the "To" dropdown
                        const toSelect = document.getElementById('transferToAccount');
                        if(toSelect) {
                            toSelect.innerHTML = appState.accounts.map(acc => 
                                `<option value="${acc.id}">${acc.name}</option>`
                            ).join('');
                        }
                    } else {
                        targetField.classList.add('hidden');
                        categoryField.classList.remove('hidden');
                    }
                });
            });
        }

        // --- Category Create Logic (Unchanged) ---
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
                // PERSISTENCE HOOK: Save after new category is added to state
                saveAppState(); 
                initCategorySelect(); // Re-init to repopulate
                setSelectedCategory(newCategory.id); // Select it
                hideInput();
            });
        }
        
       // --- 3. VIEW SWITCHER & IMPORT SETUP (Merged) ---
       const entryModeSwitcher = document.getElementById('entry-mode-switcher');
       const manualView = document.getElementById('manual-entry-view');
       const importView = document.getElementById('import-view');
       const importAccountSelect = document.getElementById('importAccountSelect'); // <--- New element

       if (entryModeSwitcher && manualView && importView) {
           entryModeSwitcher.addEventListener('change', (event) => {
               if (event.target.value === 'manual') {
                   // 1. Switch the View
                   manualView.classList.add('active-view');
                   importView.classList.remove('active-view');
               } 
               else if (event.target.value === 'import') {
                   // 1. Switch the View
                   importView.classList.add('active-view');
                   manualView.classList.remove('active-view');

                   // 2. Populate the Account Dropdown (New Logic)
                   if (importAccountSelect) {
                       importAccountSelect.innerHTML = appState.accounts.map(acc => 
                           `<option value="${acc.id}">${acc.name}</option>`
                       ).join('');
                   }
               }
           });
       }
    
       // --- CSV IMPORT LOGIC ---
       const btnImportCsv = document.getElementById('btnImportCsv');
       const csvFileInput = document.getElementById('csvFileInput');
       
       if (btnImportCsv && csvFileInput) {
           // 1. When user clicks the visible button, trigger the hidden file input
           btnImportCsv.addEventListener('click', (e) => {
               e.preventDefault(); // Prevent any default button behavior
               csvFileInput.click();
           });

           // 2. When a file is selected, process it
           csvFileInput.addEventListener('change', (e) => {
               if (e.target.files.length > 0) {
                   this.handleImportCSV(e);
               }
           });
       }
        
        // --- "INSET JOURNAL" ACCORDION CLICK (Transactions) (Unchanged) ---
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

        // --- "INSET JOURNAL" ACCORDION CLICK (Accounts) (Unchanged) ---
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

        // --- "INSET JOURNAL" CARD CLICK (Transactions) (Unchanged) ---
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

        // --- "INSET JOURNAL" LIVE SEARCH (Transactions) (Unchanged) ---
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
        
        // --- "INSET JOURNAL" LIVE SEARCH (Accounts) (Unchanged) ---
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
        
        // --- Main Navigation & Header Buttons (Unchanged) ---
        elements.mobileMenuButton.addEventListener('click', () => document.querySelector('.sidebar').classList.toggle('active'));
        elements.addTransactionBtn.addEventListener('click', () => showTransactionModal(appState));
        elements.addAccountBtn.addEventListener('click', () => {
            this.switchAccountView('account-selection-view', true); // Reset to main view
            toggleModal('addAccountModal', true);
        });
        elements.addInvestmentBtn.addEventListener('click', () => showPortfolioModal());

        // --- Timeline Tabs (Unchanged) ---
        elements.expenseTimelineTabs.addEventListener('click', (event) => this.handleTimelineClick(event));
        elements.balanceHistoryTabs.addEventListener('click', (event) => this.handleBalanceTimelineClick(event));
        const investmentTimelineTabs = document.getElementById('investment-timeline-tabs');
        if (investmentTimelineTabs) {
            investmentTimelineTabs.addEventListener('click', (event) => this.handleInvestmentTimelineClick(event));
        }

        // --- Account Filter Listener (Unchanged) ---
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

            // --- Zero State Add Transaction Button (Unchanged) ---
            else if (event.target.id === 'zeroStateAddTransactionBtn' || event.target.closest('#zeroStateAddTransactionBtn')) {
                showTransactionModal(appState);
            }

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
                toggleModal('accountActionsModal', false);
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
            else if (event.target.id === 'cancelDeleteBtn') {
                toggleModal('deleteConfirmationModal', false);
            }
            else if (event.target.id === 'confirmDeleteBtn') {
                this.handleConfirmDelete(); 
            }
            
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
            
            // Investment View Selector (Unchanged)
            const viewSelector = document.getElementById('investmentViewSelector');
            if (viewSelector) {
                const btn = document.getElementById('investmentViewBtn');
                const dropdown = document.getElementById('investmentViewDropdown');
                const chevron = btn.querySelector('.chevron-icon');
                if (event.target.closest('#investmentViewBtn')) {
                    event.stopPropagation();
                    dropdown.classList.toggle('hidden');
                    chevron.classList.toggle('rotate-180');
                } else if (event.target.closest('.investment-view-option')) {
                    const option = event.target.closest('.investment-view-option');
                    event.preventDefault();
                    this.updateInvestmentView(option.dataset.view);
                }
            }
        });
        
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
                
                // 1. Handle Accordion Toggle (Unchanged)
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
                
                // 2. Handle Holding Actions Button (Unchanged)
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

        // --- Settings Modal Logic ---
        const profileSettingsBtn = document.getElementById('profileSettingsBtn'); 
        const settingsModal = document.getElementById('settingsModal'); 
        const settingsLinkMobile = document.getElementById('settingsLinkMobile'); 

        const openSettingsModal = (e) => {
             e.preventDefault(); 
             toggleModal('settingsModal', true);
        };
        
        if (profileSettingsBtn) {
            profileSettingsBtn.addEventListener('click', openSettingsModal);
        }
        
        if (settingsLinkMobile) {
            settingsLinkMobile.addEventListener('click', openSettingsModal);
        }

        // FIX: The core navigation binding fix
        const handleSidebarClick = (e) => {
            const item = e.target.closest('.sidebar-item');
            if (item) {
                const tabName = item.dataset.tab;
                if (tabName === 'settings') {
                    openSettingsModal(e);
                } else {
                    this.handleTabSwitch(tabName);
                }
            }
        };
        
        // FIX: Re-bind all sidebar items (including desktop links) using the new unified handler
        elements.sidebarItems.forEach(item => {
            item.removeEventListener('click', handleSidebarClick); 
            item.addEventListener('click', handleSidebarClick);
        });

        const handleBottomNavClick = (e) => {
            const item = e.target.closest('.nav-item');
            if (item) {
                this.handleTabSwitch(item.dataset.tab);
            }
        };

        elements.bottomNavItems.forEach(item => {
            item.removeEventListener('click', handleBottomNavClick);
            item.addEventListener('click', handleBottomNavClick);
        });

        // --- FAB Logic (Unchanged) ---
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
        
        // FIX: Ensure the sidebar drawer closes on navigation
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) sidebar.classList.remove('active'); 
        
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
        renderInvestmentsTab(appState); // Re-render investments tab logic
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
        else if (type === 'holding') {
            title.textContent = 'Delete Holding?';
            message.textContent = 'This will permanently delete this holding from your portfolio. This action cannot be undone.';
            confirmBtn.dataset.deleteType = 'holding';
            confirmBtn.dataset.portfolioId = ids.portfolioId;
            confirmBtn.dataset.holdingId = ids.holdingId;
        }
        else if (type === 'deleteAllData') {
            title.textContent = 'Delete All Data?';
            message.textContent = 'This will permanently delete all your accounts, transactions, and investment data. This action cannot be undone.';
            confirmBtn.dataset.deleteType = 'deleteAllData';
        }

        toggleModal('deleteConfirmationModal', true);
    },
    
    deleteAllData() {
        appState.accounts = [];
        appState.transactions = [];
        appState.investmentAccounts = [];
        appState.portfolioHistory = [];
        // We keep tags and categories
        
        // PERSISTENCE HOOK
        saveAppState();

        console.log("All user data deleted.");
        toggleModal('settingsModal', false); // Close settings
    },

    // --- Master Delete Handler (Added saveAppState hook) ---
    handleConfirmDelete() {
        const confirmBtn = document.getElementById('confirmDeleteBtn');
        const type = confirmBtn.dataset.deleteType;
        let activeTab = document.querySelector('.sidebar-item.active')?.dataset.tab || 'dashboard';

        if (type === 'account') {
            const accountId = parseInt(confirmBtn.dataset.accountId);
            this.deleteAccount(accountId);
        } 
        else if (type === 'transaction') {
            const transactionId = parseInt(confirmBtn.dataset.transactionId);
            this.deleteTransaction(transactionId);
        }
        else if (type === 'holding') {
            const portfolioId = parseInt(confirmBtn.dataset.portfolioId);
            const holdingId = confirmBtn.dataset.holdingId;
            this.deleteHolding(portfolioId, holdingId);
        }
        else if (type === 'deleteAllData') {
            this.deleteAllData();
            // No need to call saveAppState here, deleteAllData does it.
        }
        
        // PERSISTENCE HOOK: Save state after any mutation
        saveAppState();
        
        // Force re-render of the active tab
        this.handleTabSwitch(activeTab); 
        
        toggleModal('deleteConfirmationModal', false);
    },


    deleteAccount(accountId) {
        appState.accounts = appState.accounts.filter(acc => acc.id !== accountId);
        appState.transactions = appState.transactions.filter(t => t.accountId !== accountId);
        // PERSISTENCE HOOK is in handleConfirmDelete
    },

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
            account.balance += (transaction.type === 'income' ? transaction.amount : -transaction.amount); // Revert logic
        }
        
        // 2. Remove transaction from the state
        appState.transactions.splice(transactionIndex, 1);
        
        toggleModal('transactionModal', false); 
        // PERSISTENCE HOOK is in handleConfirmDelete
    },

    deletePortfolio(portfolioId) {
        appState.investmentAccounts = appState.investmentAccounts.filter(p => p.id !== portfolioId);
        // PERSISTENCE HOOK is in handleConfirmDelete
    },

    deleteHolding(portfolioId, holdingId) {
        const portfolio = appState.investmentAccounts.find(p => p.id === portfolioId);
        if (portfolio) {
            portfolio.holdings = portfolio.holdings.filter(h => 
                (h.name.replace(/\s+/g, '-').toLowerCase()) !== holdingId
            );
            
            // "Elite" UX: If last holding, delete parent portfolio
            if (portfolio.holdings.length === 0) {
                this.deletePortfolio(portfolioId);
            }
        }
        // PERSISTENCE HOOK is in handleConfirmDelete
    },

    handleEditHoldingSubmit(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const portfolioId = parseInt(formData.get('portfolioId'));
        const holdingId = formData.get('holdingId');
        const quantity = parseFloat(formData.get('quantity'));
        const avgBuyPrice = parseFloat(formData.get('avgBuyPrice'));
        
        const portfolio = appState.investmentAccounts.find(p => p.id === portfolioId);
        const holding = portfolio?.holdings.find(h => h.name.replace(/\s+/g, '-').toLowerCase() === holdingId);

        if (holding) {
            holding.name = formData.get('name');
            holding.ticker = formData.get('ticker') || null;
            holding.quantity = quantity;
            // Recalculate buyValue based on new inputs
            holding.buyValue = quantity * avgBuyPrice;
            // NOTE: currentValue is currently untouched, relying on next reload for API fetch simulation
            
            toggleModal('editHoldingModal', false);
            // PERSISTENCE HOOK: Save after editing holding
            saveAppState();
            this.render();
        }
    },

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
        // PERSISTENCE HOOK: Save after adding portfolio
        saveAppState();
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
        // PERSISTENCE HOOK: Save after adding fixed income
        saveAppState();
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
        // PERSISTENCE HOOK: Save after adding employee benefit
        saveAppState();
        this.render();
    },

    handleTransactionSubmit(event) {
        event.preventDefault(); // <--- THIS prevents the refresh
        
        const formData = new FormData(event.target);
        
        // 1. Resolve Account ID
        const accountIdOrCash = formData.get('accountId');
        let transactionAccountId;
        
        if (accountIdOrCash === 'cash') {
            const cashAccount = appState.accounts.find(acc => acc.type === 'Cash');
            transactionAccountId = cashAccount ? cashAccount.id : null;
        } else {
            transactionAccountId = parseInt(accountIdOrCash);
        }

        if (!transactionAccountId) {
            alert("Please select a valid account.");
            return;
        }

        // 2. Parse Form Data
        const amount = parseFloat(formData.get('amount'));
        const type = formData.get('type');
        const description = formData.get('description');
        
        const tagIds = formData.get('tagIds') ? formData.get('tagIds').split(',').filter(id => id.length > 0) : [];
        const transactionId = formData.get('id') ? parseInt(formData.get('id')) : null;

        // --- NEW: Handle Transfer Type ---
        let toAccountId = null;
        let categoryId = formData.get('categoryId'); // Default

        if (type === 'transfer') {
            toAccountId = parseInt(formData.get('toAccountId'));
            categoryId = 'cat-transfer'; // Optional: You can create a specific category ID for internal logic
            
            if (transactionAccountId === toAccountId) {
                alert("Source and Destination accounts cannot be the same.");
                return;
            }
        }

        // 3. FIX: Parse Date to ensure it stays on the selected day regardless of timezone.
        const rawDate = formData.get('date');
        let dateISO;

        if (rawDate) {
            const parts = rawDate.split('-').map(Number);
            // Construct the date using Date.UTC(year, monthIndex, day)
            // Month index is 0-based, so subtract 1 from the month part.
            const date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
            dateISO = date.toISOString();
        } else {
            // If no date is set, use the current UTC time
            dateISO = new Date().toISOString();
        }

        if (transactionId) {
            // --- EDIT MODE ---
            // For v1.0, we just update the properties. 
            // (Note: To strictly fix balance on edit, we'd need complex reversion logic.
            // For now, we assume edits are minor corrections.)
            const transaction = appState.transactions.find(t => t.id === transactionId);
            if (transaction) {
                // Simple Revert (Only works if account didn't change)
                const acc = appState.accounts.find(a => a.id === transaction.accountId);
                if(acc) {
                     acc.balance += (transaction.type === 'income' ? -transaction.amount : transaction.amount);
                }

                // Update
                transaction.accountId = transactionAccountId;
                transaction.date = dateISO;
                transaction.description = description;
                transaction.amount = amount;
                transaction.type = type;
                transaction.categoryId = categoryId;
                transaction.tagIds = tagIds;

                // Re-Apply Balance
                if(acc) {
                    acc.balance += (type === 'income' ? amount : -amount);
                }
            }
        } else {
            // --- ADD MODE ---
            const newTxn = {
                id: Date.now(),
                accountId: transactionAccountId,
                toAccountId: toAccountId, // <--- Add this
                date: dateISO, 
                description: description,
                amount: amount,
                type: type,
                categoryId: categoryId,
                tagIds: tagIds, 
            };
            
            // Call the fixed function
            addTransactionToState(newTxn);
        }
        
        // 4. Cleanup & Render
        toggleModal('transactionModal', false);
        event.target.reset();
        setSelectedTags([]);
        setSelectedCategory('cat-uncategorized'); 
        
        // Save & Refresh
        const STORAGE_KEY = 'arthaAppState'; 
        localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
        
        this.render(); 
        // Switch to transaction tab to see result?
        this.handleTabSwitch('transactions'); 
    },

    handleImportCSV(event) {
        const file = event.target.files[0];
        if (!file) return;

        const accountSelect = document.getElementById('importAccountSelect');
        const accountId = accountSelect ? parseInt(accountSelect.value) : null;

        if (!accountId) {
            alert("Please select an account to import into.");
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            const parsedTransactions = parseCSV(content);

            if (parsedTransactions.length === 0) {
                alert("No valid transactions found.");
                return;
            }

            let count = 0;
            
            // Helper to generate colors for new tags
            const colors = ['#F0857D', '#5BB974', '#1D4ED8', '#A78BFA', '#FBBF24', '#FB7185'];
            
            parsedTransactions.forEach((t, index) => {
                // 1. Resolve Category ID
                let categoryId = 'cat-uncategorized';
                if (t.rawCategory) {
                    const match = appState.categories.find(c => 
                        c.name.toLowerCase() === t.rawCategory.toLowerCase()
                    );
                    if (match) categoryId = match.id;
                }

                // 2. Resolve/Create Tag IDs
                let tagIds = [];
                if (t.rawTags) {
                    // Split by '|' (pipe) to allow multiple tags
                    const tagNames = t.rawTags.split('|').map(s => s.trim()).filter(s => s);
                    
                    tagNames.forEach(tagName => {
                        // Check if tag exists
                        let tag = appState.tags.find(tg => tg.name.toLowerCase() === tagName.toLowerCase());
                        
                        // If not, CREATE IT
                        if (!tag) {
                            tag = {
                                id: `tag-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                                name: tagName,
                                color: colors[Math.floor(Math.random() * colors.length)]
                            };
                            appState.tags.push(tag);
                        }
                        tagIds.push(tag.id);
                    });
                }

                const newTxn = {
                    id: Date.now() + index,
                    accountId: accountId,
                    date: t.date,
                    description: t.description,
                    amount: t.amount,
                    type: t.type,
                    categoryId: categoryId,
                    tagIds: tagIds
                };
                addTransactionToState(newTxn);
                count++;
            });

            saveAppState();
            this.render();
            
            alert(`Successfully imported ${count} transactions.`);
            toggleModal('transactionModal', false);
            event.target.value = '';
            this.handleTabSwitch('transactions'); 
        };
        reader.readAsText(file);
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
            balance = -Math.abs(balance); // Store debt as negative balance
        }
        if (formType === 'card') {
            type = 'Credit Card';
        }
        if (formType === 'cash') {
             type = 'Cash';
        }

        // Check for duplicates (Cash is the exception since we only allow one, but users might re-add it)
        const accountExists = appState.accounts.some(acc => acc.name.toLowerCase() === name.toLowerCase());
        if (accountExists && formType.toLowerCase() === 'cash') {
             // Silently ignore if 'Cash' account already exists
             toggleModal('addAccountModal', false);
             this.switchAccountView('account-selection-view', true);
             return;
        } else if (accountExists) {
            // Note: alerts are bad UX but kept for simplicity here since custom modal is complex.
            alert(`An account named "${name}" already exists.`); 
            return;
        }

        const newAccount = {
            id: Date.now(),
            name: name,
            number: number,
            type: type,
            balance: balance,
            createdAt: new Date().toISOString(),
            history: [{ date: new Date().toISOString().split('T')[0], balance: balance }]
        };
        appState.accounts.push(newAccount);
        toggleModal('addAccountModal', false);
        event.target.reset();
        
        // PERSISTENCE HOOK: Save after adding account
        saveAppState();
        
        this.render(); 
        this.switchAccountView('account-selection-view', true);
    },

    // --- (Timeline Handlers) ---
    updateTimelineUI(containerId, activePeriod) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.querySelectorAll('.timeline-selector-btn, .expense-tab').forEach(btn => {
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
        // PERSISTENCE HOOK: Save UI state
        saveAppState();
        this.updateTimelineUI('expenseTimelineTabs', appState.activeExpensePeriod);
        this.render();
    },

    handleBalanceTimelineClick(event) {
        const clickedTab = event.target.closest('button[data-period]');
        if (!clickedTab || clickedTab.dataset.period === appState.activeBalancePeriod) return;
        
        appState.activeBalancePeriod = clickedTab.dataset.period;
        // PERSISTENCE HOOK: Save UI state
        saveAppState();
        this.updateTimelineUI('balanceHistoryTabs', appState.activeBalancePeriod);
        createCharts(appState); 
    },

    handleInvestmentTimelineClick(event) {
        const clickedTab = event.target.closest('button[data-period]');
        if (!clickedTab || clickedTab.dataset.period === appState.activeInvestmentPeriod) return;

        appState.activeInvestmentPeriod = clickedTab.dataset.period;
        // PERSISTENCE HOOK: Save UI state
        saveAppState();
        this.updateTimelineUI('investment-timeline-tabs', appState.activeInvestmentPeriod);
        createCharts(appState);
    },

    // --- (Modal Helper Functions - Unchanged) ---
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

            const contentId = button.dataset.content;
            const targetPane = document.getElementById(contentId);

            navButtons.forEach(btn => btn.classList.remove('active'));
            contentPanes.forEach(pane => pane.classList.remove('active'));

            button.classList.add('active');
            if (targetPane) {
                targetPane.classList.add('active');
            }

            if (indicator) {
                // Determine which element to measure offset from (first non-hidden button)
                const firstVisibleBtn = Array.from(navButtons).find(btn => 
                    !btn.classList.contains('lg:hidden')
                ) || nav.firstElementChild; 
                
                indicator.style.transform = `translateY(${button.offsetTop - firstVisibleBtn.offsetTop}px)`;
                indicator.style.height = `${button.offsetHeight}px`;
            }
        });

        // 2. Initial position for desktop indicator
        setTimeout(() => {
            const initialActive = modal.querySelector('.settings-nav-btn.active');
            if (initialActive && indicator) {
                const firstVisibleBtn = Array.from(navButtons).find(btn => 
                    !btn.classList.contains('lg:hidden')
                ) || nav.firstElementChild; 

                indicator.style.transform = `translateY(${initialActive.offsetTop - firstVisibleBtn.offsetTop}px)`;
                indicator.style.height = `${initialActive.offsetHeight}px`;
            }
        }, 50); 
        
        // 3. Handle "Delete All Data" button
        const deleteDataBtn = modal.querySelector('#deleteAllDataBtn');
        if (deleteDataBtn) {
            deleteDataBtn.addEventListener('click', () => {
                this.showDeleteConfirmation('deleteAllData', {});
            });
        }
        
        // 4. Handle "Log Out" (Placeholder)
        const logoutBtn = modal.querySelector('#logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                console.log("Log Out Clicked");
                // In a real app, this would redirect to signin.html
            });
        }
    },

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
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});