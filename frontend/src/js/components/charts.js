function getCommonChartOptions(showScales = true) {
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 1000, easing: 'easeOutQuart' },
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(20, 20, 20, 0.8)',
                titleColor: '#F0F0F5', // Using direct color code
                bodyColor: '#7F849B',    // Using direct color code
                borderColor: 'rgba(240, 240, 245, 0.1)', // Using direct color code
                borderWidth: 1,
                cornerRadius: 4,
                padding: 12,
                callbacks: {
                    label: function(context) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed.y !== null) {
                            label += '₹' + context.parsed.y.toLocaleString('en-IN');
                        }
                        return label;
                    }
                }
            }
        },
        onResize: function(chart, size) {
            chart.options.animation = false;
        }
    };

    if (showScales) {
        options.scales = {
            x: {
                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                ticks: {
                    // ✅ FIX: Using the direct hex color code instead of a CSS variable
                    color: '#7F849B',
                    font: { family: 'Inter', size: 12 }
                }
            },
            y: {
                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                ticks: {
                    // ✅ FIX: Using the direct hex color code
                    color: '#7F849B',
                    font: { family: 'Inter', size: 12 },
                    callback: (value) => `₹${value / 1000}k`
                }
            }
        }
    }
    return options;
}

export function createCharts(appState) {
    Object.values(Chart.instances).forEach(chart => chart.destroy());

    // Investments Growth Chart
    const investmentsGrowthChartCtx = document.getElementById('investmentsGrowthChart')?.getContext('2d');
    if (investmentsGrowthChartCtx) {
        new Chart(investmentsGrowthChartCtx, {
            type: 'line',
            data: {
                labels: appState.investmentGrowth.map(d => d.month),
                datasets: [{
                    label: 'Portfolio Value',
                    data: appState.investmentGrowth.map(d => d.value),
                    borderColor: '#5CF1B2', // Direct color
                    backgroundColor: 'rgba(92, 241, 178, 0.2)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#5CF1B2', // Direct color
                    pointBorderColor: '#000000', // Direct color
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                }]
            },
            options: getCommonChartOptions(true)
        });
    }

    // Expense Breakdown Chart (Doughnut)
    const expenseBreakdownCtx = document.getElementById('expenseBreakdownChart')?.getContext('2d');
    if (expenseBreakdownCtx) {
         new Chart(expenseBreakdownCtx, {
            type: 'doughnut',
            data: {
                labels: appState.expenseCategories.map(d => d.category),
                datasets: [{
                    data: appState.expenseCategories.map(d => d.amount),
                    backgroundColor: ['#B8B8F2', '#FF9B9B', '#5CF1B2', '#E1AF4E'],
                    borderWidth: 0,
                    hoverOffset: 8,
                }]
            },
            options: {
                ...getCommonChartOptions(false),
                cutout: '70%',
                plugins: {
                    ...getCommonChartOptions(false).plugins,
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                            // ✅ FIX: Using the direct hex color code
                            color: '#7F849B',
                            font: { family: 'Inter', size: 12 }
                        }
                    },
                }
            }
         });
    }

    // Balance Chart (on Accounts page)
    const balanceChartCtx = document.getElementById('balanceChart')?.getContext('2d');
    if (balanceChartCtx) {
        const allBalances = appState.accounts.reduce((acc, account) => {
            const newBalances = account.history.map(h => ({date: h.date, balance: h.balance}));
            return [...acc, ...newBalances];
        }, []);

        const sortedBalances = allBalances.sort((a, b) => new Date(a.date) - new Date(b.date));

        new Chart(balanceChartCtx, {
            type: 'line',
            data: {
                labels: sortedBalances.map(d => new Date(d.date).toLocaleDateString('en-IN', {month: 'short'})),
                datasets: [{
                    label: 'Total Balance',
                    data: sortedBalances.map(d => d.balance),
                    borderColor: '#babaf4', // Direct color
                    backgroundColor: 'rgba(184, 184, 242, 0.2)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#babaf4', // Direct color
                    pointBorderColor: '#000000', // Direct color
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                }]
            },
            options: getCommonChartOptions(true)
        });
    }
}