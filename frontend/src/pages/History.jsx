
import { History, Search, CalendarDays, Globe } from 'lucide-react';

function HistoryPage() {
    return (
        <div className="dashboard-page">
            <div className="page-header">
                <div>
                    <h1>Browsing History</h1>
                    <p>View and explore your uploaded browsing records.</p>
                </div>
            </div>

            <section className="dashboard-panel history-panel">
                <div className="history-toolbar">
                    <div className="history-search">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Search websites..."
                        />
                    </div>

                    <div className="date-filter">
                        <CalendarDays size={18} />
                        <span>Filter by date</span>
                    </div>
                </div>

                <div className="history-empty">
                    <div className="empty-icon">
                        <History size={35} />
                    </div>

                    <h2>No browsing records displayed</h2>

                    <p>
                        Upload a browser history CSV file to view
                        your browsing activity here.
                    </p>

                    <Globe size={22} />
                </div>
            </section>
        </div>
    );
}

export default HistoryPage;

