
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';

import { Line, Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Tooltip,
    Legend,
    Filler
);

// Shared chart options based on selected theme
const getChartOptions = (theme) => {
    const isDark = theme === 'dark';

    const textColor = isDark ? '#CBD5E1' : '#334155';
    const mutedColor = isDark ? '#94A3B8' : '#64748B';
    const gridColor = isDark ? '#263650' : '#E2E8F0';
    const tooltipBackground = isDark ? '#17243A' : '#FFFFFF';
    const tooltipBorder = isDark ? '#334155' : '#CBD5E1';

    return {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            intersect: false,
            mode: 'index'
        },
        animation: {
            duration: 700
        },
        plugins: {
            legend: {
                labels: {
                    color: textColor,
                    usePointStyle: true,
                    pointStyle: 'circle',
                    padding: 20,
                    font: {
                        family: 'Inter',
                        size: 12
                    }
                }
            },
            tooltip: {
                backgroundColor: tooltipBackground,
                titleColor: textColor,
                bodyColor: textColor,
                borderColor: tooltipBorder,
                borderWidth: 1,
                padding: 12,
                cornerRadius: 8,
                displayColors: true,
                titleFont: {
                    size: 12,
                    weight: '600'
                },
                bodyFont: {
                    size: 12
                }
            }
        },
        scales: {
            x: {
                ticks: {
                    color: mutedColor,
                    font: {
                        size: 11
                    }
                },
                grid: {
                    display: false
                },
                border: {
                    display: false
                }
            },
            y: {
                beginAtZero: true,
                ticks: {
                    color: mutedColor,
                    precision: 0,
                    font: {
                        size: 11
                    }
                },
                grid: {
                    color: gridColor
                },
                border: {
                    display: false,
                    dash: [4, 4]
                }
            }
        }
    };
};

// Daily Browsing Activity
export function ActivityLineChart({
    activity = [],
    theme = 'dark'
}) {
    const data = {
        labels: activity.map(item => {
            const date = new Date(`${item.activity_date}T00:00:00`);

            return Number.isNaN(date.getTime())
                ? item.activity_date
                : date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    timeZone: 'UTC'
                });
        }),
        datasets: [{
            label: 'Website Visits',
            data: activity.map(item => Number(item.total_visits)),
            borderColor: '#3B82F6',
            backgroundColor: 'rgba(59, 130, 246, 0.15)',
            fill: true,
            tension: 0.4,
            borderWidth: 3,
            pointRadius: 4,
            pointHoverRadius: 7,
            pointBackgroundColor: '#3B82F6',
            pointBorderColor: theme === 'dark' ? '#17243A' : '#FFFFFF',
            pointBorderWidth: 2
        }]
    };

    const options = {
        ...getChartOptions(theme),
        plugins: {
            ...getChartOptions(theme).plugins,
            legend: {
                display: false
            }
        },
        scales: {
            ...getChartOptions(theme).scales,
            x: {
                ...getChartOptions(theme).scales.x,
                ticks: {
                    ...getChartOptions(theme).scales.x.ticks,
                    maxRotation: 0
                }
            }
        }
    };

    return <Line data={data} options={options} />;
}

// Website Category Distribution
export function CategoryDoughnutChart({
    categories = [],
    theme = 'dark'
}) {
    const isDark = theme === 'dark';

    const data = {
        labels: categories.map(item => item.category_name),
        datasets: [{
            data: categories.map(item => Number(item.total_visits)),
            backgroundColor: [
                '#3B82F6',
                '#8B5CF6',
                '#06B6D4',
                '#F59E0B',
                '#10B981',
                '#EF4444',
                '#EC4899'
            ],
            borderColor: isDark ? '#17243A' : '#FFFFFF',
            borderWidth: 3,
            hoverOffset: 8,
            hoverBorderWidth: 3
        }]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        animation: {
            animateRotate: true,
            duration: 700
        },
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    color: isDark ? '#CBD5E1' : '#334155',
                    usePointStyle: true,
                    pointStyle: 'circle',
                    padding: 18,
                    font: {
                        family: 'Inter',
                        size: 12
                    }
                }
            },
            tooltip: {
                backgroundColor: isDark ? '#17243A' : '#FFFFFF',
                titleColor: isDark ? '#CBD5E1' : '#334155',
                bodyColor: isDark ? '#CBD5E1' : '#334155',
                borderColor: isDark ? '#334155' : '#CBD5E1',
                borderWidth: 1,
                padding: 12,
                cornerRadius: 8,
                callbacks: {
                    label: (context) => {
                        return ` ${context.label}: ${context.parsed} visits`;
                    }
                }
            }
        }
    };

    return <Doughnut data={data} options={options} />;
}

// Most Visited Websites
export function WebsiteBarChart({
    websites = [],
    theme = 'dark'
}) {
    const data = {
        labels: websites.map(item => {
            try {
                return new URL(item.website_url)
                    .hostname.replace(/^www\./, '');
            } catch {
                return item.website_url;
            }
        }),
        datasets: [{
            label: 'Visits',
            data: websites.map(item => Number(item.total_visits)),
            backgroundColor: '#3B82F6',
            hoverBackgroundColor: '#60A5FA',
            borderRadius: 6,
            borderSkipped: false,
            barPercentage: 0.7,
            categoryPercentage: 0.8
        }]
    };

    const options = {
        ...getChartOptions(theme),
        plugins: {
            ...getChartOptions(theme).plugins,
            legend: {
                display: false
            },
            tooltip: {
                ...getChartOptions(theme).plugins.tooltip,
                callbacks: {
                    label: (context) => {
                        return ` ${context.parsed.y} visits`;
                    }
                }
            }
        },
        scales: {
            ...getChartOptions(theme).scales,
            x: {
                ...getChartOptions(theme).scales.x,
                ticks: {
                    ...getChartOptions(theme).scales.x.ticks,
                    maxRotation: 0,
                    minRotation: 0
                }
            }
        }
    };

    return <Bar data={data} options={options} />;
}

// Hourly Browsing Activity
export function HourlyBarChart({
    hourly = [],
    hourlyWebsites = [],
    theme = 'dark'
}) {
    const data = {
        labels: hourly.map(item => {
            const hour = Number(item.activity_hour);

            if (Number.isNaN(hour)) {
                return item.activity_hour;
            }

            return `${hour % 12 || 12} ${hour < 12 ? 'AM' : 'PM'}`;
        }),
        datasets: [{
            label: 'Total Visits',
            data: hourly.map(item => Number(item.total_visits)),
            backgroundColor: '#2563EB',
            hoverBackgroundColor: '#60A5FA',
            borderRadius: 6,
            borderSkipped: false,
            barPercentage: 0.7,
            categoryPercentage: 0.8
        }]
    };

    const options = {
        ...getChartOptions(theme),
        plugins: {
            ...getChartOptions(theme).plugins,
            legend: {
                display: false
            },
            tooltip: {
                ...getChartOptions(theme).plugins.tooltip,
                callbacks: {
                    title: (context) => {
                        return `Time: ${context[0].label}`;
                    },
                    label: (context) => {
                        return `Total Visits: ${context.parsed.y}`;
                    },
                    afterBody: (context) => {
                        const selectedHour = Number(
                            hourly[context[0].dataIndex]?.activity_hour
                        );

                        const websitesAtHour = hourlyWebsites.filter(
                            item => Number(item.activity_hour) === selectedHour
                        );

                        if (websitesAtHour.length === 0) {
                            return ['No website details available.'];
                        }

                        return [
                            '',
                            'Websites:',
                            ...websitesAtHour.map(item => {
                                let websiteName = item.website_url;

                                try {
                                    websiteName = new URL(
                                        item.website_url
                                    ).hostname.replace(/^www\./, '');
                                } catch {
                                    // Keep original URL if invalid.
                                }

                                return `${websiteName}: ${item.total_visits} visits`;
                            })
                        ];
                    }
                }
            }
        },
        scales: {
            ...getChartOptions(theme).scales,
            x: {
                ...getChartOptions(theme).scales.x,
                ticks: {
                    ...getChartOptions(theme).scales.x.ticks,
                    maxRotation: 0,
                    autoSkip: true,
                    maxTicksLimit: 12
                }
            }
        }
    };

    return <Bar data={data} options={options} />;
}
