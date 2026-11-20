
import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';

import {
    Activity,
    Globe,
    FileUp,
    Clock,
    CalendarDays
} from 'lucide-react';

import {
    ActivityLineChart,
    CategoryDoughnutChart,
    WebsiteBarChart,
    HourlyBarChart
} from '../components/ActivityChart';

import {
    getDashboardSummary,
    getBrowsingActivity,
    getWebsiteCategories,
    getTopWebsites,
    getHourlyActivity,
    getHourlyWebsiteBreakdown
} from '../services/analyticsService';

function Dashboard() {
    const { theme } = useOutletContext();

    const [summary, setSummary] = useState(null);
    const [activity, setActivity] = useState([]);
    const [categories, setCategories] = useState([]);
    const [websites, setWebsites] = useState([]);
    const [hourly, setHourly] = useState([]);
    const [hourlyWebsites, setHourlyWebsites] = useState([]);

    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const [appliedDates, setAppliedDates] = useState({
        startDate: '',
        endDate: ''
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                setError('');

                const params = {};

                if (appliedDates.startDate) {
                    params.startDate = appliedDates.startDate;
                }

                if (appliedDates.endDate) {
                    params.endDate = appliedDates.endDate;
                }

                const [
                    summaryData,
                    activityData,
                    categoryData,
                    websiteData,
                    hourlyData,
                    hourlyWebsiteData
                ] = await Promise.all([
                    getDashboardSummary(params),
                    getBrowsingActivity(params),
                    getWebsiteCategories(params),
                    getTopWebsites(params),
                    getHourlyActivity(params),
                    getHourlyWebsiteBreakdown(params)
                ]);

                setSummary(summaryData);
                setActivity(activityData);
                setCategories(categoryData);
                setWebsites(websiteData);
                setHourly(hourlyData);
                setHourlyWebsites(hourlyWebsiteData);

            } catch (err) {
                setError(
                    err.response?.data?.message ||
                    'Unable to load dashboard data.'
                );
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [appliedDates]);

    const handleApplyFilter = () => {
        if (startDate && endDate && startDate > endDate) {
            setError('Start date cannot be after end date.');
            return;
        }

        setAppliedDates({
            startDate,
            endDate
        });
    };

    const handleResetFilter = () => {
        setStartDate('');
        setEndDate('');

        setAppliedDates({
            startDate: '',
            endDate: ''
        });
    };

    const mostVisitedWebsite = summary?.most_visited_website?.website_url
        ? (() => {
            try {
                return new URL(
                    summary.most_visited_website.website_url
                ).hostname.replace(/^www\./, '');
            } catch {
                return summary.most_visited_website.website_url;
            }
        })()
        : 'No data';

    const stats = [
        {
            title: 'Total Visits',
            value: summary?.total_visits ?? '—',
            icon: Activity,
            description: 'Total recorded visits'
        },
        {
            title: 'Unique Websites',
            value: summary?.unique_websites ?? '—',
            icon: Globe,
            description: 'Different websites visited'
        },
        {
            title: 'Total Uploads',
            value: summary?.total_files ?? '—',
            icon: FileUp,
            description: 'History files uploaded'
        },
        {
            title: 'Most Visited Website',
            value: mostVisitedWebsite,
            icon: Clock,
            description: 'Your most frequently visited site'
        }
    ];

    return (
        <div className="page-container">

            <div className="page-header">
                <div>
                    <h1>Dashboard</h1>
                    <p>Overview of your digital activity</p>
                </div>
            </div>

            <div className="date-filter-panel">
                <div className="date-filter-heading">
                    <CalendarDays size={20} />
                    <div>
                        <h3>Date Range Filter</h3>
                        <p>Select a period to analyze your browsing activity</p>
                    </div>
                </div>

                <div className="date-filter-fields">
                    <div className="date-filter-input">
                        <label htmlFor="startDate">Start Date</label>
                        <input
                            type="date"
                            id="startDate"
                            value={startDate}
                            max={endDate || undefined}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>

                    <div className="date-filter-input">
                        <label htmlFor="endDate">End Date</label>
                        <input
                            type="date"
                            id="endDate"
                            value={endDate}
                            min={startDate || undefined}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>

                    <div className="date-filter-actions">
                        <button
                            type="button"
                            className="primary-button"
                            onClick={handleApplyFilter}
                            disabled={loading}
                        >
                            Apply Filter
                        </button>

                        <button
                            type="button"
                            className="secondary-button"
                            onClick={handleResetFilter}
                            disabled={loading}
                        >
                            Reset
                        </button>
                    </div>
                </div>
            </div>

            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            <div className="stats-grid">
                {stats.map((stat) => {
                    const Icon = stat.icon;

                    return (
                        <div className="stat-card" key={stat.title}>
                            <div className="stat-card-top">
                                <span>{stat.title}</span>
                                <div className="stat-icon">
                                    <Icon size={20} />
                                </div>
                            </div>

                            <h2 title={String(stat.value)}>
                                {loading ? 'Loading...' : stat.value}
                            </h2>

                            <p>{stat.description}</p>
                        </div>
                    );
                })}
            </div>

            <div className="dashboard-grid">

                <div className="chart-panel">
                    <div className="panel-header">
                        <div>
                            <h3>Browsing Activity</h3>
                            <p>Website visits by date</p>
                        </div>
                    </div>

                    <div className="chart-container">
                        {loading ? (
                            <p>Loading browsing activity...</p>
                        ) : activity.length > 0 ? (
                            <ActivityLineChart
                                activity={activity}
                                theme={theme}
                            />
                        ) : (
                            <p>No browsing activity available.</p>
                        )}
                    </div>
                </div>

                <div className="chart-panel">
                    <div className="panel-header">
                        <div>
                            <h3>Website Categories</h3>
                            <p>Distribution of visited websites</p>
                        </div>
                    </div>

                    <div className="chart-container">
                        {loading ? (
                            <p>Loading website categories...</p>
                        ) : categories.length > 0 ? (
                            <CategoryDoughnutChart
                                categories={categories}
                                theme={theme}
                            />
                        ) : (
                            <p>No category data available.</p>
                        )}
                    </div>
                </div>

                <div className="chart-panel">
                    <div className="panel-header">
                        <div>
                            <h3>Top Websites</h3>
                            <p>Most frequently visited websites</p>
                        </div>
                    </div>

                    <div className="chart-container">
                        {loading ? (
                            <p>Loading top websites...</p>
                        ) : websites.length > 0 ? (
                            <WebsiteBarChart
                                websites={websites}
                                theme={theme}
                            />
                        ) : (
                            <p>No website data available.</p>
                        )}
                    </div>
                </div>

                <div className="chart-panel">
                    <div className="panel-header">
                        <div>
                            <h3>Hourly Activity</h3>
                            <p>Hover over a bar to see website visits</p>
                        </div>
                    </div>

                    <div className="chart-container">
                        {loading ? (
                            <p>Loading hourly activity...</p>
                        ) : hourly.length > 0 ? (
                            <HourlyBarChart
                                hourly={hourly}
                                hourlyWebsites={hourlyWebsites}
                                theme={theme}
                            />
                        ) : (
                            <p>No hourly activity available.</p>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}

export default Dashboard;
