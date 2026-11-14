
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

// Dynamic chart colors based on selected theme
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
        plugins: {
            legend: {
                labels: {
                    color: textColor,
                    usePointStyle: true,
                    padding: 20
                }
            },
            tooltip: {
                backgroundColor: tooltipBackground,
                titleColor: textColor,
                bodyColor: textColor,
                borderColor: tooltipBorder,
                borderWidth: 1
            }
        },
        scales: {
            x: {
                ticks: { color: mutedColor },
                grid: { color: gridColor }
            },
            y: {
                beginAtZero: true,
                ticks: { color: mutedColor },
                grid: { color: gridColor }
            }
        }
    };
};

export function ActivityLineChart({ activity = [], theme = 'dark' }) {
    const data = {
        labels: activity.map(item => item.activity_date),
        datasets: [{
            label: 'Website Visits',
            data: activity.map(item => Number(item.total_visits)),
            borderColor: '#3B82F6',
            backgroundColor: 'rgba(59, 130, 246, 0.15)',
            fill: true,
            tension: 0.4,
            pointRadius: 4
        }]
    };

    return (
        <Line
            data={data}
            options={getChartOptions(theme)}
        />
    );
}

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
            borderWidth: 3
        }]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            ...getChartOptions(theme).plugins,
            legend: {
                position: 'bottom',
                labels: {
                    color: isDark ? '#CBD5E1' : '#334155',
                    usePointStyle: true,
                    padding: 16
                }
            }
        }
    };

    return <Doughnut data={data} options={options} />;
}

export function WebsiteBarChart({ websites = [], theme = 'dark' }) {
    const data = {
        labels: websites.map(item => {
            try {
                return new URL(item.website_url).hostname.replace(/^www\./, '');
            } catch {
                return item.website_url;
            }
        }),
        datasets: [{
            label: 'Visits',
            data: websites.map(item => Number(item.total_visits)),
            backgroundColor: '#3B82F6',
            borderRadius: 6
        }]
    };

    return (
        <Bar
            data={data}
            options={getChartOptions(theme)}
        />
    );
}

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
            borderRadius: 6
        }]
    };

    const options = {
        ...getChartOptions(theme),
        plugins: {
            ...getChartOptions(theme).plugins,
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

                        const websites = hourlyWebsites.filter(
                            item => Number(item.activity_hour) === selectedHour
                        );

                        if (websites.length === 0) {
                            return ['No website details available.'];
                        }

                        return [
                            '',
                            'Websites:',
                            ...websites.map(item => {
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
        }
    };

    return <Bar data={data} options={options} />;
}
