
import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';

import {
    Activity,
    Globe,
    Trophy,
    CalendarDays,
    Filter
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
    getHourlyWebsiteBreakdown
} from '../services/analyticsService';

function Analytics() {
    const { theme } = useOutletContext();

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
        const fetchAnalytics = async () => {
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
                    activityData,
                    categoryData,
                    websiteData,
                    hourlyData,
                    hourlyWebsiteData
                ] = await Promise.all([
                    getBrowsingActivity(params),
                    getWebsiteCategories(params),
                    getTopWebsites(params),
                    getHourlyActivity(params),
                    getHourlyWebsiteBreakdown(params)
                ]);

                setActivity(activityData);
                setCategories(categoryData);
                setWebsites(websiteData);
                setHourly(hourlyData);
                setHourlyWebsites(hourlyWebsiteData);

            } catch (err) {
                setError(
                    err.response?.data?.message ||
                    'Unable to load analytics data. Please try again.'
                );
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [appliedDates]);

    const handleApplyFilter = () => {
        if (startDate && endDate && startDate > endDate) {
            setError('Start date cannot be after end date.');
            return;
        }

        setError('');

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

        setError('');
    };

    // Calculate analytics statistics
    const totalVisits = activity.reduce(
        (total, item) => total + Number(item.total_visits || 0),
        0
    );

    const uniqueWebsites = websites.length;

    const mostVisitedWebsite = [...websites].sort(
        (a, b) => Number(b.total_visits) - Number(a.total_visits)
    )[0];

    const mostVisitedWebsiteName = mostVisitedWebsite?.website_url
        ? (() => {
            try {
                return new URL(mostVisitedWebsite.website_url)
                    .hostname.replace(/^www\./, '');
            } catch {
                return mostVisitedWebsite.website_url;
            }
        })()
        : 'No data';

    const mostActiveDay = activity.reduce(
        (highest, current) =>
            Number(current.total_visits) > Number(highest?.total_visits || 0)
                ? current
                : highest,
        null
    );

    const formattedActiveDay = mostActiveDay?.activity_date
        ? new Date(mostActiveDay.activity_date).toLocaleDateString(
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
            title: 'Unique Websites',
            value: uniqueWebsites,
            icon: Globe,
            description: 'Different websites visited'
        },
        {
            title: 'Most Visited Website',
            value: mostVisitedWebsiteName,
            icon: Trophy,
            description: mostVisitedWebsite
                ? `${mostVisitedWebsite.total_visits} recorded visits`
                : 'No website visits recorded'
        },
        {
            title: 'Most Active Day',
            value: formattedActiveDay,
            icon: CalendarDays,
            description: mostActiveDay
                ? `${mostActiveDay.total_visits} visits on this day`
                : 'No activity recorded'
        }
    ];

    return (
        <div className="page-container">

            {/* Page Header */}
            <div className="page-header">
                <div>
                    <h1>Analytics</h1>
                    <p>Explore your browsing patterns and activity</p>
                </div>
            </div>

            {/* Date Filter */}
            <div className="date-filter-panel">
                <div className="date-filter-heading">
                    <CalendarDays size={20} />
                    <div>
                        <h3>Filter Analytics</h3>
                        <p>
                            Select a date range to explore your browsing activity
                        </p>
                    </div>
                </div>

                <div className="date-filter-fields">
                    <div className="date-filter-input">
                        <label htmlFor="analytics-start-date">
                            Start Date
                        </label>
                        <input
                            id="analytics-start-date"
                            type="date"
                            value={startDate}
                            max={endDate || undefined}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>

                    <div className="date-filter-input">
                        <label htmlFor="analytics-end-date">
                            End Date
                        </label>
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

            {/* Error Message */}
            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            {/* Browsing Overview */}
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

            {/* Detailed Analytics */}
            <div className="analytics-section">
                <div className="analytics-section-heading">
                    <h2>Detailed Analytics</h2>
                    <p>
                        Explore your browsing patterns through interactive charts
                    </p>
                </div>

                <div className="dashboard-grid">

                    {/* Daily Browsing Activity */}
                    <div className="chart-panel">
                        <div className="panel-header">
                            <div>
                                <h3>Daily Browsing Activity</h3>
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

                    {/* Category Distribution */}
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

                    {/* Most Visited Websites */}
                    <div className="chart-panel">
                        <div className="panel-header">
                            <div>
                                <h3>Most Visited Websites</h3>
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

                    {/* Hourly Activity */}
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

        </div>
    );
}

export default Analytics;
