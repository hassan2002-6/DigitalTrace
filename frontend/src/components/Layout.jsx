
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

function Layout({ theme, setTheme }) {
    return (
        <div className="app-layout">
            <Sidebar />

            <main className="main-content">
                <Outlet context={{ theme, setTheme }} />
            </main>
        </div>
    );
}

export default Layout;
