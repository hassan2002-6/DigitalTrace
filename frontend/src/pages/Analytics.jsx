
import {
    ActivityLineChart,
    CategoryDoughnutChart,
    WebsiteBarChart,
    HourlyBarChart
} from '../components/ActivityChart';

function Analytics() {
    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1>Analytics</h1>
                    <p>Explore your browsing patterns and activity</p>
                </div>
            </div>

            <div className="dashboard-grid">
                <div className="chart-panel">
                    <div className="panel-header">
                        <div>
                            <h3>Daily Browsing Activity</h3>
                            <p>Website visits throughout the week</p>
                        </div>
                    </div>
                    <div className="chart-container">
                        <ActivityLineChart />
                    </div>
                </div>

                <div className="chart-panel">
                    <div className="panel-header">
                        <div>
                            <h3>Category Distribution</h3>
                            <p>Browsing by website category</p>
                        </div>
                    </div>
                    <div className="chart-container">
                        <CategoryDoughnutChart />
                    </div>
                </div>

                <div className="chart-panel">
                    <div className="panel-header">
                        <div>
                            <h3>Most Visited Websites</h3>
                            <p>Websites with the highest visits</p>
                        </div>
                    </div>
                    <div className="chart-container">
                        <WebsiteBarChart />
                    </div>
                </div>

                <div className="chart-panel">
                    <div className="panel-header">
                        <div>
                            <h3>Hourly Activity</h3>
                            <p>Browsing activity by time of day</p>
                        </div>
                    </div>
                    <div className="chart-container">
                        <HourlyBarChart />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Analytics;
