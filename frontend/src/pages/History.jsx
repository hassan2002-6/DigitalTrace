import { useEffect, useState } from 'react';

import {
    History,
    Search,
    CalendarDays,
    Globe,
    Filter,
    RefreshCw,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';

import { getBrowsingHistory } from '../services/historyService';

const PAGE_SIZE = 25;

function HistoryPage() {
    const [records, setRecords] = useState([]);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: PAGE_SIZE,
        total: 0,
        totalPages: 1
    });

    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [appliedDates, setAppliedDates] = useState({
        startDate: '',
        endDate: ''
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Debounce the search box so typing does not fire a request per key.
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm.trim());
            setPagination((current) => ({ ...current, page: 1 }));
        }, 350);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        let cancelled = false;

        const fetchHistory = async () => {
            try {
                setLoading(true);
                setError('');

                const params = {
                    page: pagination.page,
                    limit: PAGE_SIZE
                };

                if (debouncedSearch) {
                    params.search = debouncedSearch;
                }

                if (appliedDates.startDate) {
                    params.startDate = appliedDates.startDate;
                }

                if (appliedDates.endDate) {
                    params.endDate = appliedDates.endDate;
                }

                const data = await getBrowsingHistory(params);

                if (!cancelled) {
                    setRecords(data.records || []);
                    setPagination(data.pagination);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err.response?.data?.message ||
                        'Unable to load browsing history. Please try again.'
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        fetchHistory();

        return () => {
            cancelled = true;
        };
    }, [pagination.page, appliedDates, debouncedSearch]);

    const handleApplyFilter = () => {
        if (startDate && endDate && startDate > endDate) {
            setError('Start date cannot be after end date.');
            return;
        }

        setError('');
        setPagination((current) => ({ ...current, page: 1 }));
        setAppliedDates({ startDate, endDate });
    };

    const handleResetFilter = () => {
        setStartDate('');
        setEndDate('');
        setSearchTerm('');
        setError('');
        setPagination((current) => ({ ...current, page: 1 }));
        setAppliedDates({ startDate: '', endDate: '' });
    };

    const goToPage = (nextPage) => {
        if (nextPage < 1 || nextPage > pagination.totalPages) {
            return;
        }

        setPagination((current) => ({ ...current, page: nextPage }));
    };

    const getWebsiteName = (url) => {
        try {
            return new URL(url).hostname.replace(/^www\./, '');
        } catch {
            return url || 'Unknown website';
        }
    };

    const formatVisitTime = (value) => {
        const date = new Date(String(value).replace(' ', 'T'));

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

            <div className="page-header">
                <div>
                    <h1>Browsing History</h1>
                    <p>View and explore your uploaded browsing records.</p>
                </div>
            </div>

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
                                : `${pagination.total} records`}
                        </span>
                    </div>

                </div>

                <div className="history-filters">

                    <div className="date-filter-input">
                        <label htmlFor="history-start-date">Start Date</label>
                        <input
                            id="history-start-date"
                            type="date"
                            value={startDate}
                            max={endDate || undefined}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>

                    <div className="date-filter-input">
                        <label htmlFor="history-end-date">End Date</label>
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

                {error && (
                    <div className="error-message">{error}</div>
                )}

                {loading ? (
                    <div className="history-empty">
                        <History size={35} />
                        <h2>Loading browsing history</h2>
                        <p>Please wait while your records are retrieved.</p>
                    </div>
                ) : !error && records.length === 0 ? (
                    <div className="history-empty">
                        <div className="empty-icon">
                            {pagination.total === 0 && !debouncedSearch ? (
                                <Globe size={35} />
                            ) : (
                                <Search size={35} />
                            )}
                        </div>

                        <h2>
                            {!debouncedSearch && !appliedDates.startDate
                                ? 'No browsing records found'
                                : 'No matching records'}
                        </h2>

                        <p>
                            {!debouncedSearch && !appliedDates.startDate
                                ? 'Upload a browser history CSV file to view your browsing activity here.'
                                : 'Try changing your search term or date filters.'}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="history-table-container">
                            <table className="history-table">
                                <thead>
                                    <tr>
                                        <th>Website</th>
                                        <th>Page Title</th>
                                        <th>Category</th>
                                        <th>Visit Date &amp; Time</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {records.map((item) => (
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
                                                    {Number(item.visit_count) > 1 && (
                                                        <span className="visit-count-badge">
                                                            ×{item.visit_count}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="pagination">
                            <button
                                type="button"
                                className="pagination-button"
                                onClick={() => goToPage(pagination.page - 1)}
                                disabled={pagination.page <= 1 || loading}
                                aria-label="Previous page"
                            >
                                <ChevronLeft size={17} />
                                Previous
                            </button>

                            <span className="pagination-info">
                                Page {pagination.page} of {pagination.totalPages}
                            </span>

                            <button
                                type="button"
                                className="pagination-button"
                                onClick={() => goToPage(pagination.page + 1)}
                                disabled={pagination.page >= pagination.totalPages || loading}
                                aria-label="Next page"
                            >
                                Next
                                <ChevronRight size={17} />
                            </button>
                        </div>
                    </>
                )}

            </div>
        </div>
    );
}

export default HistoryPage;
