import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';

import {
    Activity,
    Globe,
    Trophy,
    CalendarDays,
    Filter,
    Layers
} from 'lucide-react';

import {
    ActivityLineChart,
    CategoryDoughnutChart,
    WebsiteBarChart,
    HourlyBarChart
} from '../components/ActivityChart';

import {
    getBrowsingActivity,
    getWebsiteCategories,
    getTopWebsites,
    getHourlyActivity,
    getHourlyWebsiteBreakdown,
    getDomains
} from '../services/analyticsService';

const PERIODS = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' }
];

function Analytics() {
    const { theme } = useOutletContext();

    const [activity, setActivity] = useState([]);
    const [categories, setCategories] = useState([]);
    const [websites, setWebsites] = useState([]);
    const [hourly, setHourly] = useState([]);
    const [hourlyWebsites, setHourlyWebsites] = useState([]);
    const [domains, setDomains] = useState([]);

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

        const fetchAnalytics = async () => {
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
                    activityData,
                    categoryData,
                    websiteData,
                    hourlyData,
                    hourlyWebsiteData,
                    domainData
                ] = await Promise.all([
                    getBrowsingActivity(params),
                    getWebsiteCategories(params),
                    getTopWebsites(params),
                    getHourlyActivity(params),
                    getHourlyWebsiteBreakdown(params),
                    getDomains(params)
                ]);

                if (cancelled) {
                    return;
                }

                setActivity(activityData.buckets || []);
                setCategories(categoryData);
                setWebsites(websiteData);
                setHourly(hourlyData);
                setHourlyWebsites(hourlyWebsiteData);
                setDomains(domainData);

            } catch (err) {
                if (!cancelled) {
                    setError(
                        err.response?.data?.message ||
                        'Unable to load analytics data. Please try again.'
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        fetchAnalytics();

        return () => {
            cancelled = true;
        };
    }, [appliedDates, period]);

    const handleApplyFilter = () => {
        if (startDate && endDate && startDate > endDate) {
            setError('Start date cannot be after end date.');
            return;
        }

        setError('');
        setAppliedDates({ startDate, endDate });
    };

    const handleResetFilter = () => {
        setStartDate('');
        setEndDate('');
        setAppliedDates({ startDate: '', endDate: '' });
        setError('');
    };

    const totalVisits = activity.reduce(
        (total, item) => total + Number(item.total_visits || 0),
        0
    );

    const mostVisitedWebsite = [...websites].sort(
        (a, b) => Number(b.total_visits) - Number(a.total_visits)
    )[0];

    const mostActiveBucket = activity.reduce(
        (highest, current) =>
            Number(current.total_visits) > Number(highest?.total_visits || 0)
                ? current
                : highest,
        null
    );

    const formattedActiveBucket = mostActiveBucket?.bucket
        ? new Date(`${mostActiveBucket.bucket}T00:00:00Z`).toLocaleDateString(
            'en-US',
            {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                timeZone: 'UTC'
            }
        )
        : 'No data';

    const stats = [
        {
            title: 'Total Visits',
            value: totalVisits,
            icon: Activity,
            description: 'Total recorded browsing visits'
        },
        {
            title: 'Unique Domains',
            value: domains.length,
            icon: Globe,
            description: 'Distinct domains across the team'
        },
        {
            title: 'Most Visited Website',
            value: mostVisitedWebsite?.website_url || 'No data',
            icon: Trophy,
            description: mostVisitedWebsite
                ? `${mostVisitedWebsite.total_visits} recorded visits`
                : 'No website visits recorded'
        },
        {
            title: period === 'monthly' ? 'Most Active Month' : period === 'weekly' ? 'Most Active Week' : 'Most Active Day',
            value: formattedActiveBucket,
            icon: CalendarDays,
            description: mostActiveBucket
                ? `${mostActiveBucket.total_visits} visits in this period`
                : 'No activity recorded'
        }
    ];

    return (
        <div className="page-container">

            <div className="page-header">
                <div>
                    <h1>Analytics</h1>
                    <p>Combined browsing patterns from all team members</p>
                </div>

                <div className="period-toggle" role="group" aria-label="Analytics period">
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

            <div className="date-filter-panel">
                <div className="date-filter-heading">
                    <CalendarDays size={20} />
                    <div>
                        <h3>Filter Analytics</h3>
                        <p>Select a date range to explore your browsing activity</p>
                    </div>
                </div>

                <div className="date-filter-fields">
                    <div className="date-filter-input">
                        <label htmlFor="analytics-start-date">Start Date</label>
                        <input
                            id="analytics-start-date"
                            type="date"
                            value={startDate}
                            max={endDate || undefined}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>

                    <div className="date-filter-input">
                        <label htmlFor="analytics-end-date">End Date</label>
                        <input
                            id="analytics-end-date"
                            type="date"
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
                            <Filter size={15} />
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

            <div className="analytics-section">
                <div className="analytics-section-heading">
                    <h2>Browsing Overview</h2>
                    <p>A quick summary of your browsing activity</p>
                </div>

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
            </div>

            <div className="analytics-section">
                <div className="analytics-section-heading">
                    <h2>Detailed Analytics</h2>
                    <p>Explore your browsing patterns through interactive charts</p>
                </div>

                <div className="dashboard-grid">

                    <div className="chart-panel chart-panel--wide">
                        <div className="panel-header">
                            <div>
                                <h3>{PERIODS.find((item) => item.value === period)?.label} Browsing Activity</h3>
                                <p>Website visits by {period.replace('ly', '')}</p>
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
                                <h3>Category Distribution</h3>
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
                                <h3>Most Visited Websites</h3>
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
            </div>

            <div className="chart-panel domain-panel">
                <div className="panel-header">
                    <div>
                        <h3>Domain Breakdown</h3>
                        <p>Every domain, its category and recorded visits</p>
                    </div>

                    <span className="panel-badge">
                        <Layers size={14} />
                        {domains.length} domains
                    </span>
                </div>

                {loading ? (
                    <p>Loading domains...</p>
                ) : domains.length === 0 ? (
                    <p>No domain data available.</p>
                ) : (
                    <div className="domain-table-wrap">
                        <table className="domain-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Domain</th>
                                    <th>Category</th>
                                    <th>Unique URLs</th>
                                    <th>Visits</th>
                                </tr>
                            </thead>

                            <tbody>
                                {domains.slice(0, 15).map((domain, index) => (
                                    <tr key={domain.hostname}>
                                        <td>{index + 1}</td>
                                        <td>
                                            <strong>{domain.hostname}</strong>
                                        </td>
                                        <td>
                                            <span className="history-category">
                                                {domain.category_name}
                                            </span>
                                        </td>
                                        <td>{domain.unique_urls}</td>
                                        <td>
                                            <span className="domain-visits">
                                                {domain.total_visits}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

        </div>
    );
}

export default Analytics;
