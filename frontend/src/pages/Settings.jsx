
import { User, Palette, ShieldCheck, LogOut, Moon, Sun } from 'lucide-react';

function Settings({ theme, setTheme }) {
    return (
        <div className="dashboard-page">
            <div className="page-header">
                <div>
                    <h1>Settings</h1>
                    <p>Manage your account and dashboard preferences.</p>
                </div>
            </div>

            <div className="settings-grid">
                <section className="dashboard-panel settings-card">
                    <div className="settings-icon">
                        <User size={22} />
                    </div>

                    <h2>Account Settings</h2>

                    <p>Manage your profile and account information.</p>
                </section>

                <section className="dashboard-panel settings-card">
                    <div className="settings-icon">
                        <Palette size={22} />
                    </div>

                    <h2>Appearance</h2>

                    <p>Choose between dark and light dashboard themes.</p>

                    <div className="theme-options">
                        <button
                            type="button"
                            className={`theme-option ${theme === 'dark' ? 'active' : ''}`}
                            onClick={() => setTheme('dark')}
                            aria-pressed={theme === 'dark'}
                        >
                            <Moon size={18} />
                            <span>Dark Theme</span>
                        </button>

                        <button
                            type="button"
                            className={`theme-option ${theme === 'light' ? 'active' : ''}`}
                            onClick={() => setTheme('light')}
                            aria-pressed={theme === 'light'}
                        >
                            <Sun size={18} />
                            <span>Light Theme</span>
                        </button>
                    </div>

                    <span className="settings-status">
                        Current theme: {theme === 'dark' ? 'Dark' : 'Light'}
                    </span>
                </section>

                <section className="dashboard-panel settings-card">
                    <div className="settings-icon">
                        <ShieldCheck size={22} />
                    </div>

                    <h2>Privacy</h2>

                    <p>Manage your uploaded browsing data and privacy.</p>
                </section>

                <section className="dashboard-panel settings-card">
                    <div className="settings-icon">
                        <LogOut size={22} />
                    </div>

                    <h2>Session</h2>

                    <p>Account logout and session management.</p>
                </section>
            </div>
        </div>
    );
}

export default Settings;
