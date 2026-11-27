import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

import {
    Activity,
    ArrowRight,
    CheckCircle2,
    Eye,
    EyeOff,
    LockKeyhole,
    Mail,
    ShieldCheck,
    Sparkles
} from 'lucide-react';

import { loginUser } from '../services/authService';

function Login() {
    const navigate = useNavigate();
    const location = useLocation();

    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const [remember, setRemember] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((current) => ({
            ...current,
            [name]: value
        }));

        setFieldErrors((current) => ({
            ...current,
            [name]: ''
        }));
    };

    const validate = () => {
        const errors = {};
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!formData.email.trim()) {
            errors.email = 'Email is required.';
        } else if (!emailPattern.test(formData.email.trim())) {
            errors.email = 'Enter a valid email address.';
        }

        if (!formData.password) {
            errors.password = 'Password is required.';
        }

        setFieldErrors(errors);

        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');

        if (!validate()) {
            return;
        }

        setLoading(true);

        try {
            const response = await loginUser({
                email: formData.email.trim(),
                password: formData.password
            });

            if (!response.token) {
                throw new Error('Login response did not contain a token.');
            }

            // "Remember me" chooses persistent vs session storage.
            const target = remember ? localStorage : sessionStorage;
            const other = remember ? sessionStorage : localStorage;

            other.removeItem('token');
            target.setItem('token', response.token);

            navigate('/', { replace: true });
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.message ||
                'Login failed. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-shell">
            <aside className="auth-visual" aria-hidden="true">
                <div className="auth-visual-grid" />

                <div className="auth-visual-brand">
                    <span className="brand-mark">
                        <ShieldCheck size={24} />
                    </span>
                    <span>
                        <strong>DigitalTrace</strong>
                        <small>Digital Footprint Analytics</small>
                    </span>
                </div>

                <div className="auth-visual-copy">
                    <span className="eyebrow">
                        <Sparkles size={14} />
                        Your data, decoded
                    </span>

                    <h1>
                        See where your
                        <span> attention goes.</span>
                    </h1>

                    <p>
                        Turn a browser-history export into clean, private
                        analytics — visits, habits and daily rhythms in one
                        dashboard.
                    </p>

                    <ul className="auth-benefits">
                        <li>
                            <CheckCircle2 size={17} />
                            Local CSV import, no browser extension
                        </li>
                        <li>
                            <CheckCircle2 size={17} />
                            Daily, weekly and hourly patterns
                        </li>
                        <li>
                            <CheckCircle2 size={17} />
                            Your history stays tied to your account
                        </li>
                    </ul>
                </div>

                <div className="auth-visual-card">
                    <div className="auth-visual-card-head">
                        <Activity size={17} />
                        <span>Weekly activity</span>
                    </div>

                    <div className="auth-bars">
                        {[38, 62, 45, 78, 56, 88, 70].map((height, index) => (
                            <span
                                key={index}
                                style={{ height: `${height}%` }}
                            />
                        ))}
                    </div>

                    <div className="auth-visual-card-foot">
                        <span>Mon</span>
                        <span>Sun</span>
                    </div>
                </div>

                <p className="auth-visual-footnote">
                    <LockKeyhole size={14} />
                    Private by design. You control every upload.
                </p>
            </aside>

            <main className="auth-panel">
                <div className="auth-form-card">
                    <div className="auth-form-head">
                        <span className="auth-mobile-brand">
                            <ShieldCheck size={22} />
                            DigitalTrace
                        </span>

                        <h2>Welcome back</h2>
                        <p>Sign in to continue to your dashboard.</p>
                    </div>

                    {location.state?.message && (
                        <div className="success-message">
                            <CheckCircle2 size={18} />
                            <span>{location.state.message}</span>
                        </div>
                    )}

                    {error && (
                        <div className="error-message" role="alert">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} noValidate>
                        <div className="form-field">
                            <label htmlFor="login-email">Email address</label>

                            <div className={`input-shell ${fieldErrors.email ? 'has-error' : ''}`}>
                                <Mail size={17} />
                                <input
                                    id="login-email"
                                    type="email"
                                    name="email"
                                    autoComplete="email"
                                    placeholder="you@example.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    aria-invalid={Boolean(fieldErrors.email)}
                                />
                            </div>

                            {fieldErrors.email && (
                                <span className="field-error">{fieldErrors.email}</span>
                            )}
                        </div>

                        <div className="form-field">
                            <label htmlFor="login-password">Password</label>

                            <div className={`input-shell ${fieldErrors.password ? 'has-error' : ''}`}>
                                <LockKeyhole size={17} />
                                <input
                                    id="login-password"
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    autoComplete="current-password"
                                    placeholder="Enter your password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    aria-invalid={Boolean(fieldErrors.password)}
                                />

                                <button
                                    type="button"
                                    className="input-action"
                                    onClick={() => setShowPassword((value) => !value)}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                                </button>
                            </div>

                            {fieldErrors.password && (
                                <span className="field-error">{fieldErrors.password}</span>
                            )}
                        </div>

                        <div className="auth-row">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={remember}
                                    onChange={(event) => setRemember(event.target.checked)}
                                />
                                <span>Remember me</span>
                            </label>

                            <span className="auth-helper">Session expires in 1 day</span>
                        </div>

                        <button
                            type="submit"
                            className="auth-submit"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="button-spinner" />
                                    Signing in…
                                </>
                            ) : (
                                <>
                                    Sign in
                                    <ArrowRight size={17} />
                                </>
                            )}
                        </button>
                    </form>

                    <p className="auth-switch">
                        New to DigitalTrace? <Link to="/register">Create an account</Link>
                    </p>

                    <p className="auth-legal">
                        By signing in you agree to keep your exported history private.
                    </p>
                </div>
            </main>
        </div>
    );
}

export default Login;
