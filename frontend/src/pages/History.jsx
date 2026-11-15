
import { useEffect, useMemo, useState } from 'react';

import {
    History,
    Search,
    CalendarDays,
    Globe,
    Filter,
    RefreshCw
} from 'lucide-react';

import { getBrowsingHistory } from '../services/historyService';

function HistoryPage() {
    const [history, setHistory] = useState([]);

    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const [appliedDates, setAppliedDates] = useState({
        startDate: '',
        endDate: ''
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Fetch browsing history
    useEffect(() => {
        const fetchHistory = async () => {
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

                const data = await getBrowsingHistory(params);

                setHistory(data);

            } catch (err) {
                setError(
                    err.response?.data?.message ||
                    'Unable to load browsing history. Please try again.'
                );
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [appliedDates]);

    // Apply date filter
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

    // Reset filters
    const handleResetFilter = () => {
        setStartDate('');
        setEndDate('');
        setSearchTerm('');

        setAppliedDates({
            startDate: '',
            endDate: ''
        });

        setError('');
    };

    // Search by website, page title or category
    const filteredHistory = useMemo(() => {
        const search = searchTerm.toLowerCase().trim();

        if (!search) {
            return history;
        }

        return history.filter(item =>
            (item.website_url || '').toLowerCase().includes(search) ||
            (item.page_title || '').toLowerCase().includes(search) ||
            (item.category_name || '').toLowerCase().includes(search)
        );
    }, [history, searchTerm]);

    // Format website URL
    const getWebsiteName = (url) => {
        try {
            return new URL(url).hostname.replace(/^www\./, '');
        } catch {
            return url || 'Unknown website';
        }
    };

    // Format visit date and time
    const formatVisitTime = (value) => {
        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return 'Invalid date';
        }

        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="page-container">

            {/* Page Header */}
            <div className="page-header">
                <div>
                    <h1>Browsing History</h1>
                    <p>
                        View and explore your uploaded browsing records.
                    </p>
                </div>
            </div>

            {/* History Toolbar */}
            <div className="history-panel">

                <div className="history-toolbar">

                    <div className="history-search">
                        <Search size={18} />

                        <input
                            type="text"
                            placeholder="Search websites, pages or categories..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="history-record-count">
                        <History size={17} />
                        <span>
                            {loading
                                ? 'Loading records...'
                                : `${filteredHistory.length} records`
                            }
                        </span>
                    </div>

                </div>

                {/* Date Filters */}
                <div className="history-filters">

                    <div className="date-filter-input">
                        <label htmlFor="history-start-date">
                            Start Date
                        </label>

                        <input
                            id="history-start-date"
                            type="date"
                            value={startDate}
                            max={endDate || undefined}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>

                    <div className="date-filter-input">
                        <label htmlFor="history-end-date">
                            End Date
                        </label>

                        <input
                            id="history-end-date"
                            type="date"
                            value={endDate}
                            min={startDate || undefined}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>

                    <div className="history-filter-actions">

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
                            <RefreshCw size={15} />
                            Reset
                        </button>

                    </div>

                </div>

                {/* Error Message */}
                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                {/* Loading State */}
                {loading ? (
                    <div className="history-empty">
                        <History size={35} />
                        <h2>Loading browsing history</h2>
                        <p>Please wait while your records are retrieved.</p>
                    </div>
                ) : error ? (
                    <div className="history-empty">
                        <History size={35} />
                        <h2>Unable to display history</h2>
                        <p>Please try refreshing the page.</p>
                    </div>
                ) : filteredHistory.length === 0 ? (
                    <div className="history-empty">
                        <div className="empty-icon">
                            {history.length === 0 ? (
                                <Globe size={35} />
                            ) : (
                                <Search size={35} />
                            )}
                        </div>

                        <h2>
                            {history.length === 0
                                ? 'No browsing records found'
                                : 'No matching records'
                            }
                        </h2>

                        <p>
                            {history.length === 0
                                ? 'Upload a browser history CSV file to view your browsing activity here.'
                                : 'Try changing your search term or date filters.'
                            }
                        </p>
                    </div>
                ) : (

                    /* Browsing History Table */
                    <div className="history-table-container">
                        <table className="history-table">

                            <thead>
                                <tr>
                                    <th>Website</th>
                                    <th>Page Title</th>
                                    <th>Category</th>
                                    <th>Visit Date & Time</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredHistory.map((item) => (
                                    <tr key={item.id}>

                                        <td>
                                            <div className="history-website">
                                                <div className="history-website-icon">
                                                    <Globe size={17} />
                                                </div>

                                                <a
                                                    href={item.website_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    title={item.website_url}
                                                >
                                                    {getWebsiteName(item.website_url)}
                                                </a>
                                            </div>
                                        </td>

                                        <td>
                                            <span
                                                className="history-page-title"
                                                title={item.page_title || ''}
                                            >
                                                {item.page_title || 'Untitled page'}
                                            </span>
                                        </td>

                                        <td>
                                            <span className="history-category">
                                                {item.category_name || 'Uncategorized'}
                                            </span>
                                        </td>

                                        <td>
                                            <div className="history-visit-time">
                                                <CalendarDays size={15} />
                                                {formatVisitTime(item.visit_time)}
                                            </div>
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

export default HistoryPage;
