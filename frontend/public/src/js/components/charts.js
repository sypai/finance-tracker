// js/components/charts.js
import { elements } from '../utils/ui/domElements.js';
import { formatIndianCurrency } from '../utils/ui/formatters.js';

// --- Chart Instance Management ---
const chartInstances = {};
function destroyChart(id) {
    if (chartInstances[id]) {
        chartInstances[id].destroy();
        delete chartInstances[id];
    }
}
// --- End Instance Management ---

// --- "Zerodha-style" Crosshair Plugin ---
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
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'; // Light gray
            ctx.stroke();
            ctx.restore();
        }
    }
};
Chart.register(crosshairPlugin); 
// --- End of Plugin ---


/**
 * Creates all charts for the application.
 * @param {object} appState The global application state.
 */
export function createCharts(appState) {
    // Destroy all existing chart instances
    Object.values(chartInstances).forEach(chart => {
        if(chart) chart.destroy();
    });

    // --- 1. Expense Bar Chart (Dashboard) ---
    const expenseBarCtx = document.getElementById('expenseBarChart')?.getContext('2d');
    if (expenseBarCtx) {
        renderExpenseBarChart(expenseBarCtx, appState);
    }

    // --- 2. Investments Growth Chart (Dashboard) ---
    // THIS IS THE REFACTORED ONE
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
 * Renders the NEW Portfolio Performance Chart (Dashboard)
 */
function renderInvestmentsGrowthChart(ctx, appState) {
    const period = appState.activeInvestmentPeriod;
    const history = appState.portfolioHistory;

    if (!history || history.length === 0) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        return;
    }

    // 1. Filter history based on selected period
    const today = new Date(2025, 10, 2); // Same "today" as state.js
    let startDate;

    switch (period) {
        case '1M':
            startDate = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
            break;
        case '6M':
            startDate = new Date(today.getFullYear(), today.getMonth() - 6, today.getDate());
            break;
        case '1Y':
            startDate = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
            break;
        case 'Max':
        default:
            startDate = new Date(history[0].date);
            break;
    }
    startDate.setHours(0,0,0,0);

    const filteredHistory = history.filter(d => new Date(d.date) >= startDate);

    // 2. Create the two datasets
    const currentValueData = filteredHistory.map(d => ({ x: new Date(d.date).getTime(), y: d.currentValue }));
    const totalInvestedData = filteredHistory.map(d => ({ x: new Date(d.date).getTime(), y: d.totalInvested }));

    // 3. Determine colors
    const finalValue = currentValueData[currentValueData.length - 1].y;
    const initialValue = currentValueData[0].y;
    const isPositiveGrowth = finalValue >= initialValue;
    const mainColor = isPositiveGrowth ? '#5BB974' : '#F0857D'; // green or red
    const mainBgColor = isPositiveGrowth ? 'rgba(91, 185, 116, 0.1)' : 'rgba(240, 133, 125, 0.1)';

    chartInstances['investmentsGrowthChart'] = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [
                {
                    label: 'Current Value',
                    data: currentValueData,
                    borderColor: mainColor,
                    backgroundColor: mainBgColor,
                    fill: 'origin',
                    tension: 0.1,
                    pointRadius: 0,
                    pointHoverRadius: 5,
                    pointHoverBorderWidth: 2,
                    pointHoverBackgroundColor: mainColor,
                    pointHoverBorderColor: '#131314'
                },
                {
                    label: 'Total Invested',
                    data: totalInvestedData,
                    borderColor: '#969696', // var(--text-secondary)
                    borderDash: [5, 5], // Dashed line
                    backgroundColor: 'transparent',
                    fill: false,
                    tension: 0.1,
                    pointRadius: 0,
                    pointHoverRadius: 5,
                    pointHoverBorderWidth: 2,
                    pointHoverBackgroundColor: '#969696',
                    pointHoverBorderColor: '#131314'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'month',
                        tooltipFormat: 'dd MMM yyyy'
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
                    backgroundColor: 'rgba(30, 31, 32, 0.9)',
                    titleColor: '#E3E3E3',
                    bodyColor: '#E3E3E3', 
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    cornerRadius: 8,
                    padding: 12,
                    callbacks: {
                        title: function(tooltipItems) {
                            const date = new Date(tooltipItems[0].parsed.x);
                            return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
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
 * Renders the Balance History "Zerodha-style" Line Chart (Accounts Tab)
 */
function renderBalanceHistoryChart(ctx, appState) {
    // ... (This function is unchanged from v10) ...
    const selectedAccountId = document.getElementById('accountFilter').value;
    const selectedPeriod = appState.activeBalancePeriod;

    const accountsToChart = selectedAccountId === 'all'
        ? appState.accounts 
        : appState.accounts.filter(acc => acc.id == selectedAccountId); 

    const { history, datasetLabel, datasetColor, datasetBgColor } = 
        prepareBalanceHistory(
            accountsToChart, 
            appState.transactions, 
            selectedPeriod
        );

    chartInstances['balanceChart'] = new Chart(ctx, {
        type: 'line', 
        data: {
            datasets: [{
                label: datasetLabel,
                data: history, 
                borderColor: datasetColor,
                backgroundColor: datasetBgColor,
                fill: 'origin',
                tension: 0.1,
                pointRadius: 0,
                pointHoverRadius: 5,
                pointHoverBorderWidth: 2,
                pointHoverBackgroundColor: datasetColor,
                pointHoverBorderColor: '#131314'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index', 
                intersect: false,
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'month',
                        tooltipFormat: 'dd MMM yyyy'
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
                    backgroundColor: 'rgba(30, 31, 32, 0.9)',
                    titleColor: '#E3E3E3',
                    bodyColor: '#E3E3E3', 
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    cornerRadius: 8,
                    padding: 12,
                    callbacks: {
                        title: function(tooltipItems) {
                            const date = new Date(tooltipItems[0].parsed.x);
                            return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
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
 * NEW, SIMPLIFIED, AND CORRECTED data function for Accounts
 */
function prepareBalanceHistory(accounts, allTransactions, period) {
    // ... (This function is unchanged from v10) ...
    const today = new Date(2025, 10, 2); 
    let startDate;
    const earliestAccountDate = new Date(Math.min(...accounts.map(acc => new Date(acc.createdAt).getTime())));
    
    switch (period) {
        case 'day': startDate = new Date(new Date(today).setHours(0, 0, 0, 0)); break;
        case 'week': startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000); break;
        case 'month': startDate = new Date(today.getFullYear(), today.getMonth(), 1); break;
        case 'year': startDate = new Date(today.getFullYear(), 0, 1); break;
        case 'max': default:
            startDate = earliestAccountDate;
            break;
    }
    startDate.setHours(0,0,0,0);

    const accountIds = new Set(accounts.map(acc => acc.id));

    const relevantTransactions = allTransactions
        .filter(t => accountIds.has(t.accountId))
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    let runningBalance = 0;
    accounts.forEach(acc => {
        runningBalance += acc.startingBalance; 
        relevantTransactions.forEach(t => {
            if (new Date(t.date) < startDate && t.accountId === acc.id && new Date(t.date) >= new Date(acc.createdAt)) {
                runningBalance += (t.type === 'income' ? t.amount : -t.amount);
            }
        });
    });

    const history = [];
    const endDate = today;
    const days = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    let txIndex = relevantTransactions.findIndex(t => new Date(t.date) >= startDate);
    if (txIndex === -1) txIndex = relevantTransactions.length;

    for (let i = 0; i <= days; i++) {
        const currentDate = new Date(startDate.getTime() + (i * 24 * 60 * 60 * 1000));
        
        while (txIndex < relevantTransactions.length) {
            const txDate = new Date(relevantTransactions[txIndex].date);
            if (txDate.getFullYear() === currentDate.getFullYear() &&
                txDate.getMonth() === currentDate.getMonth() &&
                txDate.getDate() === currentDate.getDate()) {
                
                const t = relevantTransactions[txIndex];
                runningBalance += (t.type === 'income' ? t.amount : -t.amount);
                txIndex++;
            } else {
                break; 
            }
        }
        
        history.push({ x: currentDate.getTime(), y: runningBalance });
    }

    let datasetLabel = "Net Liquid Worth";
    let datasetColor, datasetBgColor;

    if (accounts.length === 1) {
        datasetLabel = accounts[0].name;
    }
    
    if (runningBalance >= 0) {
        datasetColor = '#5BB974'; // var(--positive-color)
        datasetBgColor = 'rgba(91, 185, 116, 0.1)';
    } else {
        datasetColor = '#F0857D'; // var(--negative-color)
        datasetBgColor = 'rgba(240, 133, 125, 0.1)';
    }

    return { history, datasetLabel, datasetColor, datasetBgColor };
}


// --- OTHER CHART FUNCTIONS (Unchanged) ---

function renderCashFlowChart(ctx, appState) {
    // ... (This function is unchanged) ...

    // Get chart canvas element reference for toggle
    const cashFlowCard = elements.cashFlowCard;
    const cashFlowCanvas = elements.cashFlowChartCanvas;
    const cashFlowZeroState = elements.cashFlowZeroState;

    const monthlyData = appState.transactions.reduce((acc, t) => {
        const date = new Date(t.date);
        const monthYearKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!acc[monthYearKey]) {
            acc[monthYearKey] = { monthName: date.toLocaleDateString('en-US', { month: 'short' }), income: 0, expense: 0 };
        }
        // --- FIX: Strictly check for 'income' and 'expense'. Ignore 'transfer'. ---
        if (t.type === 'income') {
            acc[monthYearKey].income += t.amount;
        } else if (t.type === 'expense') {
            acc[monthYearKey].expense += t.amount;
        }
        return acc;
    }, {});
    

    const sortedKeys = Object.keys(monthlyData).sort((a, b) => a.localeCompare(b)).slice(-6);
    
    // --- FIX: Implement HTML Zero State Toggle & Sizing ---
    if (Object.keys(monthlyData).length === 0) {
        if (cashFlowZeroState) cashFlowZeroState.classList.remove('hidden');
        if (cashFlowCanvas) cashFlowCanvas.classList.add('hidden'); 
        
        // Shrink the card by manipulating the Chart Container's height
        if (cashFlowCard) {
             // Reduce padding to make the card smaller
             cashFlowCard.classList.remove('p-6', 'lg:p-8');
             cashFlowCard.classList.add('p-4', 'lg:p-6'); 
        }

        const chartContainer = cashFlowCanvas ? cashFlowCanvas.closest('.chart-container-medium') : null;
        if(chartContainer) {
            chartContainer.style.height = '150px'; // Explicitly shrink the chart area height
        }
        
        // Ensure chart instance is destroyed to prevent ghosting
        destroyChart('cashFlowChart'); 
        return; 
    }

    // Restore size and visibility for normal rendering
    if (cashFlowZeroState) cashFlowZeroState.classList.add('hidden');
    if (cashFlowCanvas) {
        cashFlowCanvas.classList.remove('hidden');
        
        if (cashFlowCard) {
            // Restore padding
            cashFlowCard.classList.add('p-6', 'lg:p-8');
            cashFlowCard.classList.remove('p-4', 'lg:p-6');
        }

        const chartContainer = cashFlowCanvas ? cashFlowCanvas.closest('.chart-container-medium') : null;
        if(chartContainer) {
            // Restore default height (we use CSS variables or classes for this, 
            // but setting it via JS is the most robust way to override the zero state shrink)
            chartContainer.style.height = ''; 
        }
    }
    
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

function renderExpenseBarChart(ctx, appState) {
    // ... (This function is unchanged) ...
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
                     y: { grid: { display: false, drawBorder: false }, ticks: { color: '#E3E3E3', font: { family: 'Manrope' } } }
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