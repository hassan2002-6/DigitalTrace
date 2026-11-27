import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
    CheckCircle2,
    LogOut,
    Moon,
    Palette,
    Save,
    ShieldCheck,
    Sun,
    User
} from 'lucide-react';

import { getUserProfile, updateUserProfile } from '../services/authService';

function Settings({ theme, setTheme }) {
    const navigate = useNavigate();

    const [profile, setProfile] = useState(null);
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;

        const loadProfile = async () => {
            try {
                const data = await getUserProfile();

                if (!cancelled) {
                    setProfile(data);
                    setName(data.name || '');
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err.response?.data?.message ||
                        'Unable to load your profile.'
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadProfile();

        return () => {
            cancelled = true;
        };
    }, []);

    const handleSave = async (event) => {
        event.preventDefault();
        setMessage('');
        setError('');

        if (!name.trim()) {
            setError('Name cannot be empty.');
            return;
        }

        setSaving(true);

        try {
            const result = await updateUserProfile({ name: name.trim() });
            setProfile(result.user);
            setMessage('Profile updated successfully.');
        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Unable to update your profile.'
            );
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        navigate('/login', { replace: true });
    };

    const joinedDate = profile?.created_at
        ? new Date(profile.created_at).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        })
        : '—';

    return (
        <div className="dashboard-page">
            <div className="page-header">
                <div>
                    <h1>Settings</h1>
                    <p>Manage your account and dashboard preferences.</p>
                </div>
            </div>

            {message && (
                <div className="success-message">
                    <CheckCircle2 size={18} />
                    <span>{message}</span>
                </div>
            )}

            {error && (
                <div className="error-message">{error}</div>
            )}

            <div className="settings-grid">
                <section className="dashboard-panel settings-card settings-card--wide">
                    <div className="settings-icon">
                        <User size={22} />
                    </div>

                    <h2>Account Settings</h2>
                    <p>Manage your profile and account information.</p>

                    {loading ? (
                        <p>Loading profile...</p>
                    ) : (
                        <div className="settings-profile">
                            <div className="settings-avatar">
                                {(profile?.name || 'U').charAt(0).toUpperCase()}
                            </div>

                            <div className="settings-profile-meta">
                                <strong>{profile?.name || 'Unknown user'}</strong>
                                <span>{profile?.email || '—'}</span>
                                <small>Member since {joinedDate}</small>
                            </div>
                        </div>
                    )}

                    <form className="settings-form" onSubmit={handleSave}>
                        <label htmlFor="settings-name">Display name</label>

                        <div className="settings-inline">
                            <input
                                id="settings-name"
                                type="text"
                                value={name}
                                maxLength={100}
                                onChange={(event) => setName(event.target.value)}
                                disabled={loading || saving}
                            />

                            <button
                                type="submit"
                                className="primary-button"
                                disabled={loading || saving || !name.trim()}
                            >
                                <Save size={15} />
                                {saving ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </form>
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

                    <p>
                        Uploaded browsing records are linked to your account and
                        filtered by your user ID on every query. Deleting an
                        upload removes its history rows in the same transaction.
                    </p>
                </section>

                <section className="dashboard-panel settings-card">
                    <div className="settings-icon">
                        <LogOut size={22} />
                    </div>

                    <h2>Session</h2>

                    <p>Sign out of this browser and clear your stored token.</p>

                    <button
                        type="button"
                        className="danger-button"
                        onClick={handleLogout}
                    >
                        <LogOut size={15} />
                        Log out
                    </button>
                </section>
            </div>
        </div>
    );
}

export default Settings;
