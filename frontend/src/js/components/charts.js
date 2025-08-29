// js/charts.js

function getCommonChartOptions(showScales = true, indexAxis = 'x') {
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: indexAxis, // Can be 'x' or 'y' for horizontal bars
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
                        // For horizontal bars, the value is on the x-axis
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
                    // This callback formats the axis label
                    callback: function(value) {
                        if (value >= 1000) {
                            return `₹${value / 1000}k`;
                        }
                        return `₹${value}`;
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

export function createCharts(appState) {
    Object.values(Chart.instances).forEach(chart => chart.destroy());

    // --- Investments Growth Chart ---
    const investmentsGrowthChartCtx = document.getElementById('investmentsGrowthChart')?.getContext('2d');
    if (investmentsGrowthChartCtx) {
        // FIX: Only draw the chart if there is data for it
        if (appState.investmentGrowth && appState.investmentGrowth.length > 0) {
            new Chart(investmentsGrowthChartCtx, {
                type: 'line',
                data: {
                    labels: appState.investmentGrowth.map(d => d.month),
                    datasets: [{
                        label: 'Portfolio Value',
                        data: appState.investmentGrowth.map(d => d.value),
                        borderColor: '#5CF1B2',
                        backgroundColor: 'rgba(92, 241, 178, 0.2)',
                        borderWidth: 2,
                        tension: 0.4,
                        fill: true,
                        pointBackgroundColor: '#5CF1B2',
                        pointBorderColor: '#000000',
                        pointBorderWidth: 2,
                        pointRadius: 5,
                        pointHoverRadius: 7,
                    }]
                },
                options: getCommonChartOptions(true)
            });
        } else {
            // If no data, clear the canvas to prevent old charts from showing
            investmentsGrowthChartCtx.clearRect(0, 0, investmentsGrowthChartCtx.canvas.width, investmentsGrowthChartCtx.canvas.height);
        }
    }

    const expenseBarCtx = document.getElementById('expenseBarChart')?.getContext('2d');
    if (expenseBarCtx) {
        const filteredTransactions = getTransactionsForPeriod(appState.transactions, appState.activeExpensePeriod);
        const categoryTotals = filteredTransactions.filter(t => t.type === 'expense').reduce((acc, t) => {
            const category = t.description.split(' ')[0];
            acc[category] = (acc[category] || 0) + t.amount;
            return acc;
        }, {});

        const sortedExpenses = Object.entries(categoryTotals)
            .map(([category, amount]) => ({ category, amount }))
            .sort((a, b) => b.amount - a.amount);

        const topN = 3; // Show top 3
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
        
        // If there is no expense data, clear the canvas and show a message
        if (finalChartData.length === 0) {
            const canvas = expenseBarCtx.canvas;
            const ctx = expenseBarCtx;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.save();
            ctx.textAlign = 'center';
            ctx.fillStyle = '#7F849B'; // --text-secondary
            ctx.font = "14px 'Manrope'";
            ctx.fillText("No expense data for this period", canvas.width / 2, canvas.height / 2);
            ctx.restore();
            return; // Stop before trying to create a chart
        }

        new Chart(expenseBarCtx, {
            type: 'bar',
            data: {
                labels: finalChartData.map(d => d.category),
                datasets: [{
                    data: finalChartData.map(d => d.amount),
                    backgroundColor: '#babaf4',
                    borderRadius: 4,
                    barThickness: 12,
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                     x: { grid: { drawBorder: false, color: 'rgba(255,255,255,0.05)' }, ticks: { display: false } },
                     y: { grid: { display: false, drawBorder: false }, ticks: { color: '#F0F0F5', font: { family: 'Manrope' } } }
                }
            }
        });
    }

    // --- Balance History Chart ---
    const balanceChartCtx = document.getElementById('balanceChart')?.getContext('2d');
    if (balanceChartCtx && appState.accounts.length > 0) {
        const selectedAccountId = document.getElementById('accountFilter').value;
        const selectedPeriod = appState.activeBalancePeriod;
        
        const accountsToChart = selectedAccountId === 'all'
            ? appState.accounts
            : appState.accounts.filter(acc => acc.id == selectedAccountId);
        
        const datasets = prepareBalanceHistoryDatasets(accountsToChart, appState.transactions, selectedPeriod);

        // --- DYNAMIC Y-AXIS LOGIC ---
        let minBalance = Infinity;
        let maxBalance = -Infinity;
        datasets.forEach(ds => {
            ds.data.forEach(point => {
                if (point.y < minBalance) minBalance = point.y;
                if (point.y > maxBalance) maxBalance = point.y;
            });
        });
        
         // Add a bit of padding to the top and bottom of the data
        const yPadding = (maxBalance - minBalance) * 0.1; // 10% padding
        const yAxisMin = minBalance - yPadding;
        const yAxisMax = maxBalance + yPadding;

        new Chart(balanceChartCtx, {
            type: 'line',
            data: { datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: datasets.length > 1, position: 'top', align: 'end', labels: { color: '#F0F0F5' } },
                    // --- TOOLTIP FIX IS HERE ---
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            // This new function formats the title (the date)
                            title: function(tooltipItems) {
                                const timestamp = tooltipItems[0].parsed.x;
                                return new Date(timestamp).toLocaleDateString('en-IN', {
                                    weekday: 'short',
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric'
                                });
                            },
                            // This function formats each line in the tooltip
                            label: function(context) {
                                const label = context.dataset.label || '';
                                const value = context.parsed.y;
                                return `${label}: ₹${value.toLocaleString('en-IN')}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'time',
                        // --- X-AXIS FIX ---
                        // Instructs Chart.js to create clean, regular time intervals
                        time: {
                            unit: 'month', // Can be 'day', 'week', 'month', 'year'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)',
                            borderColor: 'rgba(255, 255, 255, 0.1)',
                            borderDash: [2, 4], // Dashed grid lines
                        },
                        ticks: { color: '#7F849B' }
                    },
                    y: {
                        stacked: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.05)',
                            borderColor: 'rgba(255, 255, 255, 0.1)',
                        },
                        ticks: {
                            color: '#7F849B',
                            callback: (value) => {
                                if (Math.abs(value) >= 100000) return `₹${value / 100000}L`;
                                if (Math.abs(value) >= 1000) return `₹${value / 1000}k`;
                                return `₹${value}`;
                            }
                        }
                    }
                }
            }
        });
    }
}

function prepareBalanceHistoryDatasets(accounts, transactions, period) {
    const now = new Date();
    let startDate;

    switch (period) {
        case 'day': startDate = new Date(new Date().setHours(0, 0, 0, 0)); break;
        case 'week': startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
        case 'month': startDate = new Date(now.getFullYear(), now.getMonth(), 1); break;
        case 'year': startDate = new Date(now.getFullYear(), 0, 1); break;
        case 'max': default:
            startDate = new Date(Math.min(...accounts.map(acc => new Date(acc.createdAt).getTime())));
            break;
    }

    const colors = ['#babaf4', '#5CF1B2', '#FF9B9B', '#FBBF24', '#818CF8'];

    return accounts.map((account, index) => {
        const createdAt = new Date(account.createdAt).getTime();
        let runningBalance = account.startingBalance;
        const balanceHistory = [{ x: createdAt, y: runningBalance }];

        const accountTransactions = transactions
            .filter(t => t.accountId === account.id)
            .sort((a, b) => new Date(a.date) - new Date(b.date));
        
        accountTransactions.forEach(t => {
            runningBalance += t.type === 'income' ? t.amount : -t.amount;
            balanceHistory.push({ x: new Date(t.date).getTime(), y: runningBalance });
        });

        const filteredHistory = balanceHistory.filter(point => point.x >= startDate.getTime());

        return {
            label: account.name,
            data: filteredHistory,
            borderColor: colors[index % colors.length],
            tension: 0.4,
            fill: true, // This is important for area charts
            backgroundColor: `${colors[index % colors.length]}4D` // Semi-transparent fill
        };
    });
}
