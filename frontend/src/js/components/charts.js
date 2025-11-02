// js/components/charts.js
import { formatIndianCurrency } from '../utils/ui/formatters.js'; // Import our formatter

// --- Chart Instance Management ---
const chartInstances = {};
function destroyChart(id) {
    if (chartInstances[id]) {
        chartInstances[id].destroy();
        delete chartInstances[id];
    }
}
// --- End Instance Management ---

// --- NEW: "Zerodha-style" Crosshair Plugin ---
// This plugin draws the vertical dashed line on hover, just like in the screenshot.
const crosshairPlugin = {
    id: 'crosshair',
    afterDraw: (chart) => {
        if (chart.tooltip?._active?.length) {
            let x = chart.tooltip._active[0].element.x;
            let yAxis = chart.scales.y;
            let ctx = chart.ctx;
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(x, yAxis.top);
            ctx.lineTo(x, yAxis.bottom);
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]); // Dashed line
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'; // Light gray, semi-transparent
            ctx.stroke();
            ctx.restore();
        }
    }
};
// We must register the plugin for it to work
Chart.register(crosshairPlugin); 
// --- End of Plugin ---


/**
 * Creates all charts for the application.
 * @param {object} appState The global application state.
 */
export function createCharts(appState) {
    // Destroy all existing chart instances to prevent duplicates
    Object.values(chartInstances).forEach(chart => {
        if(chart) chart.destroy();
    });

    // --- 1. Expense Bar Chart (Dashboard) ---
    const expenseBarCtx = document.getElementById('expenseBarChart')?.getContext('2d');
    if (expenseBarCtx) {
        renderExpenseBarChart(expenseBarCtx, appState);
    }

    // --- 2. Investments Growth Chart (Dashboard) ---
    const investmentsGrowthChartCtx = document.getElementById('investmentsGrowthChart')?.getContext('2d');
    if (investmentsGrowthChartCtx) {
        renderInvestmentsGrowthChart(investmentsGrowthChartCtx, appState);
    }
    
    // --- 3. Cash Flow Chart (Transactions) ---
    const cashFlowChartCtx = document.getElementById('cashFlowChart')?.getContext('2d');
    if (cashFlowChartCtx) {
        renderCashFlowChart(cashFlowChartCtx, appState);
    }

    // --- 4. Allocation Chart (Investments) ---
    const allocationChartCtx = document.getElementById('allocationChart')?.getContext('2d');
    if (allocationChartCtx) {
        renderAllocationChart(allocationChartCtx, appState);
    }
    
    // --- 5. Balance History Chart (Accounts) ---
    const balanceChartCtx = document.getElementById('balanceChart')?.getContext('2d');
    if (balanceChartCtx && appState.accounts.length > 0) {
        renderBalanceHistoryChart(balanceChartCtx, appState);
    }
}


// --- INDIVIDUAL CHART FUNCTIONS ---

/**
 * Renders the Balance History "Zerodha-style" Line Chart (Accounts Tab)
 */
function renderBalanceHistoryChart(ctx, appState) {
    const selectedAccountId = document.getElementById('accountFilter').value;
    const selectedPeriod = appState.activeBalancePeriod;

    const accountsToChart = selectedAccountId === 'all'
        ? appState.accounts 
        : appState.accounts.filter(acc => acc.id == selectedAccountId); 

    const { labels, datasets } = prepareBalanceHistoryDatasets(
        accountsToChart, 
        appState.transactions, 
        selectedPeriod,
        selectedAccountId
    );

    chartInstances['balanceChart'] = new Chart(ctx, {
        type: 'line', 
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index', // <-- This enables the "snap" tooltip
                intersect: false,
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'month',
                        tooltipFormat: 'dd MMM yyyy' // "02 Apr 2025"
                    },
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#7F849B' }
                },
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: {
                        color: '#7F849B',
                        callback: (value) => formatIndianCurrency(value)
                    }
                }
            },
            plugins: {
                // The crosshair plugin is now registered globally and will work
                legend: {
                    display: true, 
                    position: 'bottom',
                    labels: { 
                        color: '#E3E3E3', 
                        font: { family: 'Inter' },
                        usePointStyle: true,
                        boxWidth: 8
                    }
                },
                tooltip: {
                    enabled: true,
                    backgroundColor: 'rgba(30, 31, 32, 0.9)', // var(--card-bg)
                    titleColor: '#E3E3E3', // var(--text-primary)
                    bodyColor: '#E3E3E3', 
                    borderColor: 'rgba(255, 255, 255, 0.1)', // var(--card-border)
                    borderWidth: 1,
                    cornerRadius: 8, // var(--radius-sm)
                    padding: 12,
                    callbacks: {
                        title: function(tooltipItems) {
                            return tooltipItems[0].label;
                        },
                        label: function(context) {
                            const label = context.dataset.label || '';
                            const value = context.parsed.y;
                            return `${label}: ${formatIndianCurrency(value)}`;
                        },
                    },
                }
            }
        }
    });
}

/**
 * Renders the Cash Flow Bar Chart (Transactions Tab)
 */
function renderCashFlowChart(ctx, appState) {
    // ... (This function is unchanged) ...
    const monthlyData = appState.transactions.reduce((acc, t) => {
        const date = new Date(t.date);
        const monthYearKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!acc[monthYearKey]) {
            acc[monthYearKey] = { monthName: date.toLocaleDateString('en-US', { month: 'short' }), income: 0, expense: 0 };
        }
        if (t.type === 'income') acc[monthYearKey].income += t.amount;
        else acc[monthYearKey].expense += t.amount;
        return acc;
    }, {});

    const sortedKeys = Object.keys(monthlyData).sort((a, b) => a.localeCompare(b)).slice(-6);
    const labels = sortedKeys.map(key => monthlyData[key].monthName);
    const incomeData = sortedKeys.map(key => monthlyData[key].income);
    const expenseData = sortedKeys.map(key => monthlyData[key].expense);

    chartInstances['cashFlowChart'] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                { label: 'Income', data: incomeData, backgroundColor: 'rgba(91, 185, 116, 0.7)', borderWidth: 0, borderRadius: 4, },
                { label: 'Expense', data: expenseData, backgroundColor: 'rgba(240, 133, 125, 0.7)', borderWidth: 0, borderRadius: 4, }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            animation: { duration: 800, easing: 'easeOutQuart' },
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(255, 255, 255, 0.1)' }, ticks: { color: '#969696', callback: (value) => `₹${value / 1000}k` } },
                x: { grid: { display: false }, ticks: { color: '#969696' } }
            },
            plugins: {
                legend: { position: 'bottom', labels: { color: '#969696', boxWidth: 12, padding: 20 } },
                tooltip: { 
                    backgroundColor: '#1E1F20',
                    titleColor: '#E3E3E3',
                    bodyColor: '#E3E3E3',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    callbacks: {
                        label: (context) => ` ${context.dataset.label}: ₹${context.raw.toLocaleString('en-IN')}`
                    }
                }
            }
        }
    });
}

/**
 * Renders the Allocation Doughnut Chart (Investments Tab)
 */
function renderAllocationChart(ctx, appState) {
    // ... (This function is unchanged) ...
    const allocationData = appState.investmentAccounts
        .flatMap(acc => acc.holdings)
        .reduce((acc, holding) => {
            const type = holding.type || 'Other';
            acc[type] = (acc[type] || 0) + holding.currentValue;
            return acc;
        }, {});

    chartInstances['allocationChart'] = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(allocationData),
            datasets: [{
                data: Object.values(allocationData),
                backgroundColor: ['#babaf4', '#5CF1B2', '#FF9B9B', '#FBBF24', '#818CF8', '#F87171'],
                borderWidth: 0,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: { 
                    position: 'bottom', 
                    labels: { 
                        color: '#E3E3E3',
                        font: { family: 'Inter' }
                    } 
                }
            }
        }
    });
}

/**
 * Renders the Investments Growth Line Chart (Dashboard)
 */
function renderInvestmentsGrowthChart(ctx, appState) {
    // ... (This function is unchanged) ...
    if (appState.investmentGrowth && appState.investmentGrowth.length > 0) {
        chartInstances['investmentsGrowthChart'] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: appState.investmentGrowth.map(d => d.month),
                datasets: [{
                    label: 'Portfolio Value',
                    data: appState.investmentGrowth.map(d => d.value),
                    borderColor: '#5BB974', // var(--positive-color)
                    backgroundColor: 'rgba(91, 185, 116, 0.1)', // var(--positive-color) w/ alpha
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#5BB974', // var(--positive-color)
                    pointBorderColor: '#131314', // var(--background)
                    pointBorderWidth: 2,
                    pointRadius: 0,
                    pointHoverRadius: 7,
                }]
            },
            options: getCommonChartOptions(true)
        });
    } else {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }
}

/**
 * Renders the Expense Bar Chart (Dashboard)
 */
function renderExpenseBarChart(ctx, appState) {
    const filteredTransactions = getTransactionsForPeriod(appState.transactions, appState.activeExpensePeriod);
    const categoryTotals = filteredTransactions.filter(t => t.type === 'expense').reduce((acc, t) => {
        const category = appState.categories.find(c => c.id === t.categoryId)?.name || 'Uncategorized';
        acc[category] = (acc[category] || 0) + t.amount;
        return acc;
    }, {});

    const sortedExpenses = Object.entries(categoryTotals)
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount);

    const topN = 3; 
    let finalChartData = [];
    if (sortedExpenses.length > topN) {
        finalChartData = sortedExpenses.slice(0, topN);
        const otherAmount = sortedExpenses.slice(topN).reduce((sum, item) => sum + item.amount, 0);
        if (otherAmount > 0) {
            finalChartData.push({ category: 'Other', amount: otherAmount });
        }
    } else {
        finalChartData = sortedExpenses;
    }

    finalChartData.sort((a, b) => a.amount - b.amount);
    
    if (finalChartData.length === 0) {
        const canvas = ctx.canvas;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.textAlign = 'center';
        ctx.fillStyle = 'var(--text-secondary)';
        ctx.font = "14px 'Manrope'";
        ctx.fillText("No expense data for this period", canvas.width / 2, canvas.height / 2);
        ctx.restore();
    } else {
         chartInstances['expenseBarChart'] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: finalChartData.map(d => d.category),
                datasets: [{
                    data: finalChartData.map(d => d.amount),
                    backgroundColor: '#C5CBD3', // var(--text-metric)
                    borderRadius: 5,
                    barThickness: 10,
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                     x: { grid: { drawBorder: false, color: 'rgba(255,255,255,0.05)' }, ticks: { display: false } },
                     // --- THIS IS THE FIX ---
                     y: { 
                         grid: { display: false, drawBorder: false }, 
                         ticks: { 
                             color: '#E3E3E3', // Hardcoded var(--text-primary)
                             font: { family: 'Manrope' } 
                         } 
                     }
                     // --- END OF FIX ---
                }
            }
        });
    }
}


// --- HELPER FUNCTIONS ---

function getCommonChartOptions(showScales = true, indexAxis = 'x') {
    // ... (This function is unchanged) ...
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: indexAxis, 
        animation: { duration: 1000, easing: 'easeOutQuart' },
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(20, 20, 20, 0.8)',
                titleColor: '#F0F0F5',
                bodyColor: '#7F849B',
                borderColor: 'rgba(240, 240, 245, 0.1)',
                borderWidth: 1,
                cornerRadius: 4,
                padding: 12,
                callbacks: {
                    label: function(context) {
                        const value = context.parsed.x ?? context.parsed.y;
                        if (value === null) return '';
                        return ' ₹' + value.toLocaleString('en-IN');
                    }
                },
            }
        },
        onResize: (chart) => { chart.options.animation = false; }
    };

    if (showScales) {
        options.scales = {
            x: {
                beginAtZero: true,
                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                ticks: { color: '#7F849B', font: { family: 'Manrope', size: 12 } }
            },
            y: {
                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                ticks: {
                     color: '#7F849B', 
                     font: { family: 'Manrope', size: 12 },
                    callback: function(value) {
                        return formatIndianCurrency(value);
                    }
                }
            }
        };
    } else {
        options.scales = { x: { display: false }, y: { display: false } };
    }
    return options;
}

function getTransactionsForPeriod(transactions, period = 'month') {
    // ... (This function is unchanged) ...
    const now = new Date();
    const currentYear = now.getFullYear();

    if (period === 'year') {
        return transactions.filter(t => new Date(t.date).getFullYear() === currentYear);
    }
    if (period === 'week') {
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return transactions.filter(t => new Date(t.date) >= oneWeekAgo);
    }
    // Default to month
    return transactions.filter(t => new Date(t.date).getMonth() === now.getMonth() && new Date(t.date).getFullYear() === currentYear);
}


// --- THIS IS THE REWRITTEN FUNCTION ---
/**
 * Prepares datasets for the "Zerodha-style" line chart.
 * @param {Array} accounts - The accounts to include. If count > 1, calculates Net Worth.
 * @param {Array} transactions - ALL transactions.
 * @param {string} period - The time period ('day', 'week', 'month', 'year', 'max').
 * @param {string} selectedAccountId - The ID from the dropdown ('all' or a number).
 * @returns {object} - An object containing `labels` and `datasets`.
 */
function prepareBalanceHistoryDatasets(accounts, transactions, period, selectedAccountId) {
    const now = new Date();
    let startDate;

    // 1. Determine Start Date
    switch (period) {
        case 'day': startDate = new Date(new Date().setHours(0, 0, 0, 0)); break;
        case 'week': startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
        case 'month': startDate = new Date(now.getFullYear(), now.getMonth(), 1); break;
        case 'year': startDate = new Date(now.getFullYear(), 0, 1); break;
        case 'max': default:
            startDate = new Date(Math.min(...accounts.map(acc => new Date(acc.createdAt).getTime())));
            break;
    }
    startDate.setHours(0,0,0,0);

    const accountIds = new Set(accounts.map(acc => acc.id));
    
    // 2. Get all relevant transactions
    const relevantTransactions = transactions
        .filter(t => accountIds.has(t.accountId) && new Date(t.date) >= startDate)
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    // 3. Create a map of all unique dates
    const allDates = new Set();
    allDates.add(startDate.getTime());
    relevantTransactions.forEach(t => allDates.add(new Date(t.date).setHours(0,0,0,0)));
    allDates.add(new Date().setHours(0,0,0,0)); // Ensure today is included
    
    const sortedDates = Array.from(allDates).sort((a, b) => a - b);
    
    // Map transactions by date for quick lookup
    const transactionsByDate = relevantTransactions.reduce((acc, t) => {
        const dateKey = new Date(t.date).setHours(0,0,0,0);
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(t);
        return acc;
    }, {});

    // 4. Calculate History
    const history = [];
    let datasetLabel = "Net Liquid Worth";
    let datasetColor = '#1D4ED8'; // var(--primary-accent)
    let datasetBgColor = 'rgba(29, 78, 216, 0.1)';
    let runningBalance = 0;

    // --- Calculate the true starting balance(s) at `startDate` ---
    accounts.forEach(acc => {
        const historyTx = transactions
            .filter(t => t.accountId === acc.id && new Date(t.date) < startDate)
            .sort((a, b) => new Date(a.date) - new Date(b.date));
            
        let balance = acc.startingBalance;
        historyTx.forEach(t => {
            balance += (t.type === 'income' ? t.amount : -t.amount);
        });
        runningBalance += balance; // Add this account's starting balance to the total
    });

    // --- Set label and color based on selection ---
    if (selectedAccountId !== 'all' && accounts.length === 1) {
        const account = accounts[0];
        datasetLabel = account.name;
        if (account.balance >= 0) {
            datasetColor = '#5BB974'; // var(--positive-color)
            datasetBgColor = 'rgba(91, 185, 116, 0.1)';
        } else {
            datasetColor = '#F0857D'; // var(--negative-color)
            datasetBgColor = 'rgba(240, 133, 125, 0.1)';
        }
    } else {
        // "All Accounts" is selected, so set color based on final Net Worth
        if (runningBalance >= 0) {
            datasetColor = '#5BB974'; // var(--positive-color)
            datasetBgColor = 'rgba(91, 185, 116, 0.1)';
        } else {
            datasetColor = '#F0857D'; // var(--negative-color)
            datasetBgColor = 'rgba(240, 133, 125, 0.1)';
        }
    }

    // 5. Iterate through dates and calculate running balance
    sortedDates.forEach(dateMs => {
        if (transactionsByDate[dateMs]) {
            transactionsByDate[dateMs].forEach(t => {
                runningBalance += (t.type === 'income' ? t.amount : -t.amount);
            });
        }
        history.push({ x: dateMs, y: runningBalance });
    });

    // 6. Build the final Chart.js dataset
    const datasets = [{
        label: datasetLabel,
        data: history,
        borderColor: datasetColor,
        backgroundColor: datasetBgColor, // <-- THIS IS THE FIX
        fill: 'origin', // Fill from y=0
        tension: 0.1,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBorderWidth: 2,
        pointHoverBackgroundColor: datasetColor,
        pointHoverBorderColor: '#131314' // var(--background)
    }];

    return { labels: sortedDates, datasets };
}

