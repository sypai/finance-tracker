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
    loadTransactionData,        // Kept
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
    renderSmartStackView, // <-- ADD THIS
    initTagInput, // <-- ADD THIS IMPORT
    setSelectedTags, // <-- ADD THIS IMPORT (for submit handler)
    initCategorySelect, // <-- ADD
    setSelectedCategory, // <-- ADD
    updateBrokerageFormHeaders // <-- ADD THIS
} from './utils/ui/index.js';

const App = {
    init() {
        // NEW: Add navigation state
        appState.activeYear = new Date().getFullYear().toString();
        appState.activeMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');
        appState.hasDashboardLoaded = false;
        initUI();
        initTagInput(); // <-- INITIALIZE THE TAG COMPONENT
        initCategorySelect();
        this.bindEvents();
        this.bindPortfolioModalEvents(); // <-- ADD THIS CALL
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
        } 
        
        createCharts(appState);
    },

    bindEvents() {

        // --- *** NEW: "+ New Category" LOGIC *** ---
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
                newCategoryNameInput.value = ''; // Clear input
            };

            newCategoryBtn.addEventListener('click', showInput);
            cancelNewCategoryBtn.addEventListener('click', hideInput);

            saveNewCategoryBtn.addEventListener('click', () => {
                const newName = newCategoryNameInput.value.trim();
                if (!newName) {
                    alert('Please enter a category name.');
                    return;
                }
                // Basic duplicate check (case-insensitive)
                if (appState.categories.some(cat => cat.name.toLowerCase() === newName.toLowerCase())) {
                    alert(`Category "${newName}" already exists.`);
                    return;
                }

                // Create new category
                const newCategory = {
                    id: `cat-${Date.now()}`, // Simple unique ID
                    name: newName,
                    iconId: '#icon-default' // Assign default icon for now
                };

                // Add to state
                appState.categories.push(newCategory);

                // Re-populate dropdown (using the function from transactions.js)
                populateCategoryDropdown(appState.categories); // Ensure this is imported/accessible

                // Select the new category
                categorySelect.value = newCategory.id;

                // Hide input, show select
                hideInput();
            });
        }
        // --- *** END "+ New Category" LOGIC *** ---

        const entryModeSwitcher = document.getElementById('entry-mode-switcher');
        const manualView = document.getElementById('manual-entry-view');
        const importView = document.getElementById('import-view');
        const modalTitle = document.getElementById('transactionModalTitle'); // Keep title update

        if (entryModeSwitcher && manualView && importView && modalTitle) {
            entryModeSwitcher.addEventListener('change', (event) => {
                if (event.target.value === 'manual') {
                    // Slide Manual IN, Import OUT (to the right)
                    manualView.classList.add('active-view');
                    importView.classList.remove('active-view'); // Ensure only one is active
                    // modalTitle.textContent = document.getElementById('transactionId').value ? 'Edit Transaction' : 'Add Transaction';
                } else if (event.target.value === 'import') {
                    // Slide Import IN, Manual OUT (to the left)
                    importView.classList.add('active-view');
                    manualView.classList.remove('active-view'); // Ensure only one is active
                    // modalTitle.textContent = 'Import Transactions';
                }
            });
        }
        
        // --- "INSET JOURNAL" ACCORDION CLICK ---
        elements.transactionList.addEventListener('click', (event) => {
            const header = event.target.closest('.transaction-group-header');
            if (header) {
                // Toggle the clicked group
                header.parentElement.classList.toggle('is-open');
                
                // Elite Touch: Close other groups
                document.querySelectorAll('#transactionList .transaction-group.is-open').forEach(openGroup => {
                    if (openGroup !== header.parentElement) {
                        openGroup.classList.remove('is-open');
                    }
                });
            }
        });

        // --- "INSET JOURNAL" CARD CLICK (Drill-Down) ---
        // This targets the .transaction-card, which is now inside the horizontal stream
        elements.transactionList.addEventListener('click', (event) => {
            const row = event.target.closest('.transaction-card'); // Changed from .transaction-row
            if (row) {
                event.preventDefault(); 
                const transactionId = parseInt(row.dataset.transactionId);
                const transaction = appState.transactions.find(t => t.id === transactionId);
                if (transaction) {
                    showTransactionModal(appState, transaction);
                }
            }
        });

        // --- "INSET JOURNAL" LIVE SEARCH ---
        const transactionSearchInput = document.getElementById('transactionSearch');
        if (transactionSearchInput) {
            transactionSearchInput.addEventListener('input', (event) => {
                const searchTerm = event.target.value.toLowerCase();
                
                // We must search all the way down to the cards
                document.querySelectorAll('.transaction-group').forEach(group => {
                    let groupHasVisibleCards = false;
                    
                    group.querySelectorAll('.day-column').forEach(column => {
                        let columnHasVisibleCards = false;

                        column.querySelectorAll('.transaction-card').forEach(card => {
                            const description = card.querySelector('.font-semibold').textContent.toLowerCase();
                            const account = card.querySelector('.text-sm').textContent.toLowerCase();
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
                        // Hide the *day column* if no cards match
                        column.classList.toggle('hidden', !columnHasVisibleCards);
                    });
                    // Hide the *entire month group* if no days match
                    group.classList.toggle('hidden', !groupHasVisibleCards);
                });
            });
        }
        
        elements.mobileMenuButton.addEventListener('click', () => document.querySelector('.sidebar').classList.toggle('active'));
        
        elements.addTransactionBtn.addEventListener('click', () => showTransactionModal(appState));
        
        elements.addAccountBtn.addEventListener('click', () => toggleModal('addAccountModal', true));
        
        elements.addInvestmentBtn.addEventListener('click', () => showPortfolioModal());
        
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
            if (event.target.id === 'addFixedIncomeForm') this.handleFixedIncomeSubmit(event);
            if (event.target.id === 'addRetirementForm') this.handleEmployeeBenefitSubmit(event); // <-- ADD THIS
            if (event.target.id === 'addStockGrantForm') this.handleEmployeeBenefitSubmit(event); // <-- ADD THIS
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

        // --- FIX: Use requestAnimationFrame for Async Loading ---
        if (tabName === 'transactions') {
            // 1. Immediately render the basic structure (fast)
            renderTransactionStructure(appState.transactions);

            // 2. Schedule the heavy data loading using requestAnimationFrame
            requestAnimationFrame(() => {
                // *** MODIFICATION HERE ***
                loadTransactionData(
                    appState.transactions, 
                    appState.accounts, 
                    appState.categories, // Pass categories
                    appState.tags         // Pass tags
                );
                // *** END MODIFICATION ***

                renderTransactionInsights(appState);
                createCharts(appState);
            });
        } else {
            // For other tabs, render everything synchronously
            this.render();
        }

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
            // --- THIS IS THE CHANGE ---
            renderSmartStackView(appState.investmentAccounts);
        } else if (viewName === 'allocation') {
            document.getElementById('investmentTabContent').innerHTML = `<div class="p-6"><div class="chart-container h-80"><canvas id="allocationChart"></canvas></div></div>`;
            createCharts(appState);
        } else if (viewName === 'performance') {
            document.getElementById('investmentTabContent').innerHTML = `<div class="p-6 text-center text-text-secondary">Performance Chart Coming Soon!</div>`;
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

    // *** REVISED handlePortfolioSubmit ***
    handlePortfolioSubmit(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const portfolioType = formData.get('portfolioType'); // 'brokerage'
        
        // --- NEW: Read the *current* asset type from the switcher ---
        const currentAssetType = document.getElementById('currentAssetType').value;

        // Get all the dynamic holding rows
        const holdingNames = formData.getAll('holdingName');
        const holdingTickers = formData.getAll('holdingTicker');
        const holdingUnits = formData.getAll('holdingUnits');
        const holdingBuyPrices = formData.getAll('holdingBuyPrice');

        // Process holdings
        const newHoldings = holdingNames.map((name, index) => {
            const units = parseFloat(holdingUnits[index]);
            const buyPrice = parseFloat(holdingBuyPrices[index]);
            return {
                type: currentAssetType, // <-- SAVE THE CORRECT ASSET TYPE
                name: name,
                ticker: holdingTickers[index] || null,
                quantity: units,
                buyValue: units * buyPrice,
                // In a real app, API would fetch this. For now, set to buy value.
                currentValue: units * buyPrice 
            };
        });

        const newAccount = {
            id: Date.now(),
            name: formData.get('name'),
            type: formData.get('type'), // This is the old dropdown, let's fix
            // --- FIX: Use the value from the hidden input ---
            // type: formData.get('portfolioType'), // This is 'brokerage'
            holdings: newHoldings
        };

        // --- Let's correct the 'type' field ---
        // The *Portfolio's* type (e.g., "Brokerage", "Retirement") is what matters
        const newPortfolio = {
            id: Date.now(),
            name: formData.get('name'),
            type: portfolioType, // 'brokerage', 'fixed_income', 'employee'
            holdings: newHoldings
        };
        
        appState.investmentAccounts.push(newPortfolio);
        console.log("New Portfolio Account:", newPortfolio);

        toggleModal('addPortfolioModal', false);
        this.render(); // Re-render the app
    },

    /**
     * Handles the submission of the Fixed Income form.
     */
    handleFixedIncomeSubmit(event) {
        event.preventDefault();
        const formData = new FormData(event.target);

        // For Fixed Income, the entire investment is a single "holding"
        const holding = {
            type: formData.get('type'), // 'fd', 'p2p', 'bond'
            name: formData.get('type') === 'fd' ? 'Fixed Deposit' : 
                  formData.get('type') === 'p2p' ? 'P2P Investment' : 'Bond',
            quantity: 1, // Represents a single investment
            buyValue: parseFloat(formData.get('investedAmount')),
            currentValue: parseFloat(formData.get('investedAmount')), // Starts at buy value
            
            // Store the extra metadata specific to fixed income
            meta: {
                rate: parseFloat(formData.get('interestRate')),
                investmentDate: formData.get('investmentDate'),
                maturityDate: formData.get('maturityDate')
            }
        };

        const newPortfolio = {
            id: Date.now(),
            name: formData.get('name'), // e.g., "HDFC Bank"
            type: formData.get('portfolioType'), // 'fixed_income'
            holdings: [holding] // This portfolio contains this one investment
        };
        
        appState.investmentAccounts.push(newPortfolio);
        console.log("New Fixed Income Portfolio:", newPortfolio);

        toggleModal('addPortfolioModal', false);
        this.render(); // Re-render the app
    },

    /**
     * Handles submission for BOTH Employee Benefit forms.
     */
    handleEmployeeBenefitSubmit(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const assetType = formData.get('assetType'); // 'retirement_fund' or 'stock_grant'

        let holding;
        if (assetType === 'retirement_fund') {
            holding = {
                type: formData.get('type'), // 'epf', 'nps'
                name: formData.get('type').toUpperCase(), // e.g., "EPF"
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
                type: formData.get('type'), // 'rsu', 'esop'
                name: formData.get('name'), // Company Name
                ticker: formData.get('ticker') || null,
                quantity: vestedUnits + unvestedUnits, // Total shares in grant
                
                // Buy value is what *vested* shares cost
                buyValue: vestedUnits * grantPrice,
                // Current value is what *vested* shares are worth
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
            name: formData.get('name'), // Provider or Company Name
            type: formData.get('portfolioType'), // 'employee_benefit'
            holdings: [holding]
        };
        
        appState.investmentAccounts.push(newPortfolio);
        console.log("New Employee Benefit Portfolio:", newPortfolio);

        toggleModal('addPortfolioModal', false);
        this.render(); // Re-render the app
    },

    handleTransactionSubmit(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        // *** MODIFICATION: Get accountId based on selected value (could be 'cash') ***
        const accountIdOrCash = formData.get('accountId');
        let transactionAccountId;
        let account;

        if (accountIdOrCash === 'cash') {
            transactionAccountId = 'cash'; // Store 'cash' literally
            // No specific account object needed for balance update here
        } else {
            transactionAccountId = parseInt(accountIdOrCash); // Store the ID
            account = appState.accounts.find(acc => acc.id === transactionAccountId);
            if (!account) {
                 console.error("Selected account not found!");
                 return; // Prevent submission if account invalid
            }
        }
        // *** END MODIFICATION ***

        const amount = parseFloat(formData.get('amount'));
        const type = formData.get('type');
        const transactionId = formData.get('id') ? parseInt(formData.get('id')) : null; // Get ID for editing

        // --- NEW TAG HANDLING ---
        // Read the comma-separated IDs from our hidden input
        const tagIds = formData.get('tagIds') 
            ? formData.get('tagIds').split(',').filter(id => id.length > 0) 
            : [];

        // --- END NEW TAG HANDLING ---
        const categoryId = formData.get('categoryId');

        if (transactionId) {
            // --- EDIT LOGIC ---
            const transaction = appState.transactions.find(t => t.id === parseInt(transactionId));
            if (transaction) {
                // Note: We need to revert balance changes before applying new ones
                const oldAmount = transaction.amount;
                const oldType = transaction.type;
                const oldAccountId = transaction.accountId;

                // Revert old balance
                const oldAccount = appState.accounts.find(acc => acc.id === oldAccountId);
                if (oldAccount) {
                    oldAccount.balance += (oldType === 'income' ? -oldAmount : oldAmount);
                }

                // Apply new balance
                const newAccount = appState.accounts.find(acc => acc.id === accountId);
                if (newAccount) {
                    newAccount.balance += (type === 'income' ? amount : -amount);
                }

                // Update transaction object
                transaction.accountId = accountId;
                transaction.description = formData.get('description');
                transaction.amount = amount;
                transaction.type = type;
        
                transaction.tagIds = tagIds; // <-- Save the new tag IDs
                transaction.categoryId = categoryId;
            }
        } else {
            // --- ADD NEW LOGIC ---
            if (accountId === 'cash') {
                // No balance to update for 'cash'
            } else {
                const account = appState.accounts.find(acc => acc.id === accountId);
                if (account) {
                    account.balance += type === 'income' ? amount : -amount;
                }
            }
            appState.transactions.unshift({
                id: Date.now(),
                accountId,
                date: new Date().toISOString(), // Use ISO string for consistency
                description: formData.get('description'),
                amount,
                type,
                categoryId: categoryId,
                tagIds: tagIds, // <-- Save the new tag IDs
            });
        }
        
        toggleModal('transactionModal', false);
        event.target.reset();
        setSelectedTags([]);
        setSelectedCategory('cat-uncategorized'); // Manually clear pills after form reset
        this.render(); // Re-render everything
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

    bindPortfolioModalEvents() {
        const modal = document.getElementById('addPortfolioModal');
        if (!modal) return;

        const viewContainer = document.getElementById('portfolio-modal-view-container');
        const modalTitle = document.getElementById('portfolioModalTitle');
        const selectionView = document.getElementById('portfolio-selection-view');
        
        // --- NEW: Get Brokerage Form Elements ---
        const assetSwitcher = document.getElementById('brokerage-asset-switcher');
        const hiddenAssetType = document.getElementById('currentAssetType');
        const holdingsContainer = document.getElementById('holdingsContainer');
        const addHoldingBtn = document.getElementById('addHoldingBtn');

        // --- NEW: Get Fixed Income Date Pickers ---
        const investmentDateInput = document.getElementById('fi-investment-date');
        const maturityDateInput = document.getElementById('fi-maturity-date');

        // Function to switch views
        const switchView = (viewId, title) => {
            viewContainer.querySelectorAll('.modal-view').forEach(view => {
                view.classList.remove('active-view');
            });
            const targetView = document.getElementById(viewId);
            if (targetView) {
                targetView.classList.add('active-view');
            }
            if (modalTitle) modalTitle.textContent = title;

            // --- NEW: Set date rules when switching to Fixed Income view ---
            if (viewId === 'portfolio-fixed-income-view' && investmentDateInput && maturityDateInput) {
                // 1. Get today's date in YYYY-MM-DD format
                const today = new Date().toISOString().split('T')[0];
                
                // 2. Set the max for Investment Date to today
                investmentDateInput.max = today;
                
                // 3. If investment date is already filled, set maturity date's min
                if (investmentDateInput.value) {
                    const minMaturity = new Date(investmentDateInput.value);
                    minMaturity.setDate(minMaturity.getDate() + 1);
                    maturityDateInput.min = minMaturity.toISOString().split('T')[0];
                } else {
                    // 4. If investment date is empty, set maturity min to tomorrow (as a fallback)
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    maturityDateInput.min = tomorrow.toISOString().split('T')[0];
                }
            }
        };

        // 1. Listen for clicks on the selection cards
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

        // 2. Listen for clicks on any "Back" button
        modal.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-back-btn')) {
                switchView('portfolio-selection-view', 'Add Portfolio');
            }
        });

        // --- NEW 3: Listen for Asset Type change ---
        if (assetSwitcher) {
            assetSwitcher.addEventListener('change', (e) => {
                const newAssetType = e.target.value; // 'stock', 'mutual_fund', or 'bond'
                hiddenAssetType.value = newAssetType;
                
                // Update headers and placeholders
                updateBrokerageFormHeaders(newAssetType);

                // Clear existing rows and add a new one of the correct type
                holdingsContainer.innerHTML = '';
                holdingsContainer.appendChild(createHoldingRow(newAssetType));
            });
        }

        // --- NEW 4: Update Add Row button listener ---
        if (addHoldingBtn) {
            addHoldingBtn.addEventListener('click', () => {
                const currentAssetType = hiddenAssetType.value;
                holdingsContainer.appendChild(createHoldingRow(currentAssetType));
            });
        }

        // --- NEW 5: Add listener for Investment Date change ---
        if (investmentDateInput && maturityDateInput) {
            investmentDateInput.addEventListener('change', () => {
                if (investmentDateInput.value) {
                    // Create a new date object from the investment date
                    const minMaturity = new Date(investmentDateInput.value);
                    // Set it to the next day
                    minMaturity.setDate(minMaturity.getDate() + 1);
                    
                    // Set the min attribute of the maturity date picker
                    maturityDateInput.min = minMaturity.toISOString().split('T')[0];

                    // (Optional) If maturity date is now invalid, clear it
                    if (maturityDateInput.value && maturityDateInput.value < maturityDateInput.min) {
                        maturityDateInput.value = '';
                    }
                } else {
                    // If investment date is cleared, reset maturity date min
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    maturityDateInput.min = tomorrow.toISOString().split('T')[0];
                }
            });
        }

        // --- NEW: Employee View Logic ---
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
    // *** END NEW FUNCTION ***
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});