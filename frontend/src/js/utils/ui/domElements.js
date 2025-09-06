
// This object is populated by initUI() once the DOM is ready.
export const elements = {};

// Finds and caches all necessary DOM elements.
export function initUI() {
    // Sidebar
    elements.sidebarItems = document.querySelectorAll('.sidebar-item');
    elements.tabContents = document.querySelectorAll('.tab-content');
    elements.mobileMenuButton = document.getElementById('mobileMenuButton');

    // Transactions
    elements.addTransactionBtn = document.getElementById('addTransactionBtn');
    elements.addAccountBtn = document.getElementById('addAccountBtn');
    elements.addInvestmentBtn = document.getElementById('addInvestmentBtn'); // Caches the new button
    elements.transactionModal = document.getElementById('transactionModal');
    elements.addAccountModal = document.getElementById('addAccountModal');
    elements.closeTransactionModalBtn = document.getElementById('closeTransactionModalBtn');
    elements.closeAddAccountModalBtn = document.getElementById('closeAddAccountModalBtn');
    elements.transactionForm = document.getElementById('transactionForm');
    elements.addAccountForm = document.getElementById('addAccountForm');

    elements.transactionFormWrapper = document.getElementById('transactionFormWrapper');
    elements.transactionZeroState = document.getElementById('transactionZeroState');
    elements.transactionAccountSelect = document.getElementById('transactionAccount');
    
    // Dashboard UI
    elements.greetingTitle = document.getElementById('greeting-title');
    elements.greetingSubtitle = document.getElementById('greeting-subtitle');
    elements.currentTime = document.getElementById('currentTime');
    elements.currentDate = document.getElementById('currentDate');
    
    // Investments
    elements.investmentAccountsList = document.getElementById('investmentAccountsList');
    elements.investmentsLastUpdated = document.getElementById('investments-last-updated');
    elements.addInvestmentAccountBtn = document.getElementById('addInvestmentAccountBtn');
    elements.addInvestmentAccountModal = document.getElementById('addInvestmentAccountModal');
    elements.closeAddInvestmentAccountModalBtn = document.getElementById('closeAddInvestmentAccountModalBtn');
    elements.addInvestmentAccountForm = document.getElementById('addInvestmentAccountForm');
    elements.investmentAccountList = document.getElementById('investmentAccountList');

    elements.netWorthValue = document.getElementById('netWorthValue');
    elements.netWorthChange = document.getElementById('netWorthChange');
    elements.monthlyExpensesValue = document.getElementById('monthlyExpensesValue');
    elements.monthlyExpensesChange = document.getElementById('monthlyExpensesChange');
    elements.investmentsValue = document.getElementById('investmentsValue');
    elements.investmentsChange = document.getElementById('investmentsChange');
    
    elements.expenseAnalysisTitle = document.getElementById('expenseAnalysisTitle');
    elements.expenseTimelineTabs = document.getElementById('expenseTimelineTabs');
    elements.expenseInsightsList = document.getElementById('expenseInsightsList');
    elements.expenseAnalysisNormalView = document.getElementById('expenseAnalysisNormalView');
    elements.expenseAnalysisZeroState = document.getElementById('expenseAnalysisZeroState');
    elements.expenseChartContainer = document.getElementById('expenseChartContainer');
    
    elements.investmentPortfolioNormalView = document.getElementById('investmentPortfolioNormalView');
    elements.investmentPortfolioZeroState = document.getElementById('investmentPortfolioZeroState');
    // --- ADD THESE NEW LINES ---
    elements.investmentsZeroState = document.getElementById('investmentsZeroState');
    elements.investmentsNormalView = document.getElementById('investmentsNormalView');
    elements.investmentsCurrentValue = document.getElementById('investmentsCurrentValue');
    elements.investmentsTotalInvested = document.getElementById('investmentsTotalInvested');
    elements.investmentsDayGain = document.getElementById('investmentsDayGain');
    elements.investmentsTotalGain = document.getElementById('investmentsTotalGain');
    elements.investmentsMonthChange = document.getElementById('investmentsMonthChange');
    elements.investmentsTotalGainPercent = document.getElementById('investmentsTotalGainPercent');
    elements.portfolioView = document.getElementById('portfolioView');
    elements.investmentTabContent = document.getElementById('investmentTabContent');


    elements.addHoldingBtn = document.getElementById('addHoldingBtn');
    elements.holdingsContainer = document.getElementById('holdingsContainer');
    elements.addPortfolioForm = document.getElementById('addPortfolioForm');

    // Transaction Tab
    elements.transactionList = document.getElementById('transactionList');
    

    // Accounts Tab
    elements.accountList = document.getElementById('accountList');
    elements.balanceHistoryCard = document.getElementById('balanceHistoryCard');
    elements.accountsNormalView = document.getElementById('accountsNormalView');
    elements.accountsZeroState = document.getElementById('accountsZeroState');
    elements.balanceHistoryTabs = document.getElementById('balanceHistoryTabs');
    elements.accountFilter = document.getElementById('accountFilter'); 

    elements.bottomNavItems = document.querySelectorAll('#bottom-nav .nav-item');
}