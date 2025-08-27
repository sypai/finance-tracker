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
                }
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
                ticks: { color: '#7F849B', font: { family: 'Manrope', size: 12 } }
            }
        };
    } else {
        options.scales = { x: { display: false }, y: { display: false } };
    }
    return options;
}

export function createCharts(appState) {
    Object.values(Chart.instances).forEach(chart => chart.destroy());

    // --- Expense Analysis (Horizontal Bar Chart) ---
    const expenseBarCtx = document.getElementById('expenseBarChart')?.getContext('2d');
    if (expenseBarCtx) {
        // Sort categories by amount to show the highest spenders, and take the top 5
        const expenseData = [...appState.expenseCategories]
            .sort((a, b) => a.amount - b.amount) // Sort ascending for Chart.js horizontal display
            .slice(-5); 
        
        new Chart(expenseBarCtx, {
            type: 'bar',
            data: {
                labels: expenseData.map(d => d.category), // These labels will now be shown on the Y-axis
                datasets: [{
                    label: 'Expenses',
                    data: expenseData.map(d => d.amount),
                    backgroundColor: context => {
                        const ctx = context.chart.ctx;
                        const gradient = ctx.createLinearGradient(0, 0, ctx.canvas.width, 0);
                        gradient.addColorStop(0, 'rgba(186, 186, 244, 0.5)');
                        gradient.addColorStop(1, '#babaf4');
                        return gradient;
                    },
                    borderColor: '#babaf4',
                    borderWidth: 1,
                    borderRadius: 4,
                    borderSkipped: false,
                    barThickness: 16, // Thinner bars
                    maxBarThickness: 20, // Max thickness to prevent them from becoming too wide
                    categoryPercentage: 0.8 // Reduces space between bars slightly
                }]
            },
            options: {
                ...getCommonChartOptions(true, 'y'), // 'y' makes it horizontal
                scales: {
                     x: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255, 255, 255, 0.05)', drawBorder: false },
                        ticks: {
                            display: true, // Keep ticks (values) on X-axis if desired, otherwise set to false
                            color: '#7F849B',
                            font: { family: 'Manrope', size: 10 }
                        }
                    },
                    y: {
                        grid: { display: false, drawBorder: false }, // No grid lines on Y-axis
                        ticks: {
                            display: true, // Display labels on the Y-axis (category names)
                            color: '#F0F0F5', // Make category labels brighter
                            font: { family: 'Manrope', size: 12, weight: 'bold' } // Emphasize category labels
                        }
                    }
                }
            }
        });
    }

    // --- Investments Growth Chart (Restored) ---
    const investmentsGrowthChartCtx = document.getElementById('investmentsGrowthChart')?.getContext('2d');
    if (investmentsGrowthChartCtx && appState.investmentGrowth) {
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
    }

    // --- Balance Chart (Restored) ---
    const balanceChartCtx = document.getElementById('balanceChart')?.getContext('2d');
    if (balanceChartCtx && appState.accounts) {
        const allBalances = appState.accounts.reduce((acc, account) => {
            if (!account.history) return acc;
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
                    borderColor: '#babaf4',
                    backgroundColor: 'rgba(184, 184, 242, 0.2)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#babaf4',
                    pointBorderColor: '#000000',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                }]
            },
            options: getCommonChartOptions(true)
        });
    }
}