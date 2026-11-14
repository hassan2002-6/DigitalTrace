
import {
    LayoutDashboard,
    History,
    ChartNoAxesCombined,
    Upload,
    Settings,
    ShieldCheck
} from 'lucide-react';

import { NavLink } from 'react-router-dom';

const menuItems = [
    {
        name: 'Dashboard',
        path: '/',
        icon: LayoutDashboard
    },
    {
        name: 'Browsing History',
        path: '/history',
        icon: History
    },
    {
        name: 'Analytics',
        path: '/analytics',
        icon: ChartNoAxesCombined
    },
    {
        name: 'Upload Data',
        path: '/upload',
        icon: Upload
    },
    {
        name: 'Settings',
        path: '/settings',
        icon: Settings
    }
];

function Sidebar() {
    return (
        <aside className="sidebar">
            <div className="sidebar-brand">
                <div className="brand-icon">
                    <ShieldCheck size={25} />
                </div>

                <div>
                    <h2>Footprint</h2>
                    <span>Personal Dashboard</span>
                </div>
            </div>

            <div className="sidebar-section">
                <p className="sidebar-heading">MENU</p>

                <nav className="sidebar-nav">
                    {menuItems.map((item) => {
                        const Icon = item.icon;

                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                end={item.path === '/'}
                                className={({ isActive }) =>
                                    isActive
                                        ? 'nav-link active'
                                        : 'nav-link'
                                }
                            >
                                <Icon size={19} />
                                <span>{item.name}</span>
                            </NavLink>
                        );
                    })}
                </nav>
            </div>

            <div className="sidebar-footer">
                <ShieldCheck size={18} />
                <div>
                    <strong>Your privacy matters</strong>
                    <p>Your data stays under your control.</p>
                </div>
            </div>
        </aside>
    );
}

export default Sidebar;
