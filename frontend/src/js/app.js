// js/app.js

import { appState } from './utils/state.js';
import { createCharts } from './components/charts.js';
import { 
    initUI, // <-- Import the new function
    elements, 
    setActiveTab, 
    updateDateTime, 
    updateGreeting, 
    renderAccounts, 
    renderTransactions,
    populateAccountDropdown,
    renderDashboardInvestmentAccounts,
    renderInvestmentsTab,
    renderExpenseInsights,
    updateDashboardMetrics
} from './utils/ui.js';
import { setupEventHandlers } from './utils/handlers.js';

const App = {
    init() {
        initUI(); // <-- Call it first! This populates the `elements` object.
        this.bindEvents();
        this.render(); // Initial render
        updateDateTime();
        setInterval(updateDateTime, 1000 * 60);
    },

    render() {
        updateDashboardMetrics(appState);
        updateGreeting();
        renderAccounts(appState.accounts);
        populateAccountDropdown(appState.accounts);
        renderTransactions(appState.transactions, appState.accounts);
        renderDashboardInvestmentAccounts(appState.investments);
        renderInvestmentsTab(appState.investments);
        renderExpenseInsights(appState.expenseCategories);
        createCharts(appState);
    },

    bindEvents() {
        elements.mobileMenuButton.addEventListener('click', () => {
            document.querySelector('.sidebar').classList.toggle('active');
        });

        elements.sidebarItems.forEach(item => {
            item.addEventListener('click', () => setActiveTab(item.dataset.tab, createCharts, appState));
        });

        setupEventHandlers(this.render.bind(this));
    }
};

// Start the application once the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});