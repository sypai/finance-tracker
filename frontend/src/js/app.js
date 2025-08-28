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
    updateDashboardMetrics,
    updateActiveTimelineTab,
    renderExpenseList
} from './utils/ui.js';
import { setupEventHandlers } from './utils/handlers.js';

const App = {
    init() {
        initUI(); // <-- Call it first! This populates the `elements` object.
        this.loadData();
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
        createCharts(appState);
        updateActiveTimelineTab(appState.activeExpensePeriod);
        renderExpenseList(appState.transactions, appState.activeExpensePeriod);
    },

    bindEvents() {
        elements.mobileMenuButton.addEventListener('click', () => {
            document.querySelector('.sidebar').classList.toggle('active');
        });

        elements.sidebarItems.forEach(item => {
            item.addEventListener('click', () => setActiveTab(item.dataset.tab, createCharts, appState));
        });

        elements.expenseTimelineTabs.addEventListener('click', (event) => this.handleTimelineClick(event));

        setupEventHandlers(this.render.bind(this));
    },

    handleTimelineClick(event) {
        const clickedTab = event.target.closest('button');
        if (!clickedTab || clickedTab.dataset.period === appState.activeExpensePeriod) return;

        // The only job of the event handler is to update the state.
        appState.activeExpensePeriod = clickedTab.dataset.period;
        
        // Then, we simply re-render the entire app.
        this.render();
    },

    loadData() {
        const today = new Date();
        appState.transactions = [
            { description: 'Salary', amount: 95000, type: 'income', date: new Date(new Date().setDate(1)) },
            { description: 'Groceries', amount: 3200, type: 'expense', date: today },
            { description: 'Transport', amount: 1500, type: 'expense', date: new Date(today.getTime() - 2 * 86400000) },
            { description: 'Shopping', amount: 4000, type: 'expense', date: new Date(today.getTime() - 4 * 86400000) },
            { description: 'Rent', amount: 20000, type: 'expense', date: new Date(new Date().setDate(1))},
            { description: 'Flight', amount: 12000, type: 'expense', date: new Date(new Date().setMonth(today.getMonth() - 2))},
            { description: 'Hotel', amount: 18000, type: 'expense', date: new Date(new Date().setFullYear(today.getFullYear() - 1))},
        ];
    },
};

// Start the application once the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});