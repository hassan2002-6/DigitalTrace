import { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';

import {
    Activity,
    ArrowUpRight,
    CalendarDays,
    Clock,
    FileUp,
    Globe,
    History,
    TrendingUp
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
    getHourlyWebsiteBreakdown,
    getRecentActivity
} from '../services/analyticsService';

const PERIODS = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' }
];

function formatVisitTime(value) {
    const date = new Date(String(value).replace(' ', 'T'));

    if (Number.isNaN(date.getTime())) {
        return 'Unknown time';
    }

    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function Dashboard() {
    const { theme } = useOutletContext();

    const [summary, setSummary] = useState(null);
    const [activity, setActivity] = useState([]);
    const [categories, setCategories] = useState([]);
    const [websites, setWebsites] = useState([]);
    const [hourly, setHourly] = useState([]);
    const [hourlyWebsites, setHourlyWebsites] = useState([]);
    const [recent, setRecent] = useState([]);

    const [period, setPeriod] = useState('daily');

    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [appliedDates, setAppliedDates] = useState({
        startDate: '',
        endDate: ''
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;

        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                setError('');

                const params = { period };

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
                    hourlyWebsiteData,
                    recentData
                ] = await Promise.all([
                    getDashboardSummary(params),
                    getBrowsingActivity(params),
                    getWebsiteCategories(params),
                    getTopWebsites(params),
                    getHourlyActivity(params),
                    getHourlyWebsiteBreakdown(params),
                    getRecentActivity({ limit: 5 })
                ]);

                if (cancelled) {
                    return;
                }

                setSummary(summaryData);
                setActivity(activityData.buckets || []);
                setCategories(categoryData);
                setWebsites(websiteData);
                setHourly(hourlyData);
                setHourlyWebsites(hourlyWebsiteData);
                setRecent(recentData);

            } catch (err) {
                if (!cancelled) {
                    setError(
                        err.response?.data?.message ||
                        'Unable to load dashboard data.'
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        fetchDashboardData();

        return () => {
            cancelled = true;
        };
    }, [appliedDates, period]);

    const handleApplyFilter = () => {
        if (startDate && endDate && startDate > endDate) {
            setError('Start date cannot be after end date.');
            return;
        }

        setAppliedDates({ startDate, endDate });
    };

    const handleResetFilter = () => {
        setStartDate('');
        setEndDate('');
        setAppliedDates({ startDate: '', endDate: '' });
    };

    const mostVisitedWebsite = summary?.most_visited_website?.website_url || 'No data';

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
            description: 'Distinct domains visited'
        },
        {
            title: 'Total Uploads',
            value: summary?.total_files ?? '—',
            icon: FileUp,
            description: 'History files uploaded'
        },
        {
            title: 'Most Visited',
            value: mostVisitedWebsite,
            icon: TrendingUp,
            description: 'Your top website by visits'
        }
    ];

    return (
        <div className="page-container">

            <div className="page-header">
                <div>
                    <h1>Dashboard</h1>
                    <p>Overview of your digital activity</p>
                </div>

                <Link to="/upload" className="header-action">
                    <FileUp size={16} />
                    Upload history
                </Link>
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
                <div className="error-message">{error}</div>
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

                <div className="chart-panel chart-panel--wide">
                    <div className="panel-header">
                        <div>
                            <h3>Browsing Activity</h3>
                            <p>Website visits by {period.replace('ly', '')}</p>
                        </div>

                        <div className="period-toggle" role="group" aria-label="Activity period">
                            {PERIODS.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    className={period === option.value ? 'active' : ''}
                                    onClick={() => setPeriod(option.value)}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="chart-container">
                        {loading ? (
                            <p>Loading browsing activity...</p>
                        ) : activity.length > 0 ? (
                            <ActivityLineChart
                                activity={activity}
                                period={period}
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
                            <p>Most frequently visited domains</p>
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

            <div className="chart-panel recent-panel">
                <div className="panel-header">
                    <div>
                        <h3>Recent Activity</h3>
                        <p>Your latest five recorded visits</p>
                    </div>

                    <Link to="/history" className="panel-link">
                        <History size={15} />
                        View all
                    </Link>
                </div>

                {loading ? (
                    <p>Loading recent activity...</p>
                ) : recent.length === 0 ? (
                    <p>No recent activity yet. Upload a CSV to get started.</p>
                ) : (
                    <ul className="recent-list">
                        {recent.map((item) => (
                            <li key={item.id} className="recent-item">
                                <span className="recent-icon">
                                    <Globe size={16} />
                                </span>

                                <div className="recent-main">
                                    <strong>{item.hostname || item.website_url}</strong>
                                    <span>{item.page_title || 'Untitled page'}</span>
                                </div>

                                <span className="recent-category">
                                    {item.category_name}
                                </span>

                                <span className="recent-time">
                                    <Clock size={13} />
                                    {formatVisitTime(item.visit_time)}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}

                <Link to="/history" className="recent-footer">
                    Search the full history
                    <ArrowUpRight size={14} />
                </Link>
            </div>

        </div>
    );
}

export default Dashboard;
