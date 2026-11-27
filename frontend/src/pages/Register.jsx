import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import {
    ArrowRight,
    Check,
    Eye,
    EyeOff,
    LockKeyhole,
    Mail,
    ShieldCheck,
    Sparkles,
    User,
    X
} from 'lucide-react';

import { registerUser } from '../services/authService';

const PASSWORD_RULES = [
    { key: 'length', label: 'At least 8 characters', test: (value) => value.length >= 8 },
    { key: 'upper', label: 'One uppercase letter', test: (value) => /[A-Z]/.test(value) },
    { key: 'lower', label: 'One lowercase letter', test: (value) => /[a-z]/.test(value) },
    { key: 'number', label: 'One number', test: (value) => /[0-9]/.test(value) }
];

function Register() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
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

    const ruleResults = PASSWORD_RULES.map((rule) => ({
        ...rule,
        passed: rule.test(formData.password)
    }));

    const validate = () => {
        const errors = {};
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!formData.name.trim()) {
            errors.name = 'Your name is required.';
        } else if (formData.name.trim().length > 100) {
            errors.name = 'Name must be 100 characters or fewer.';
        }

        if (!formData.email.trim()) {
            errors.email = 'Email is required.';
        } else if (!emailPattern.test(formData.email.trim())) {
            errors.email = 'Enter a valid email address.';
        }

        if (!formData.password) {
            errors.password = 'Password is required.';
        } else if (!ruleResults.every((rule) => rule.passed)) {
            errors.password = 'Password must meet all four rules below.';
        }

        if (formData.confirmPassword !== formData.password) {
            errors.confirmPassword = 'Passwords do not match.';
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
            await registerUser({
                name: formData.name.trim(),
                email: formData.email.trim(),
                password: formData.password
            });

            navigate('/login', {
                state: { message: 'Account created. Sign in to continue.' }
            });
        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Registration failed. Please try again.'
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
                        Start in under a minute
                    </span>

                    <h1>
                        Your browsing,
                        <span> made meaningful.</span>
                    </h1>

                    <p>
                        Create a private account, upload a browser-history CSV,
                        and get a dashboard you can actually explain.
                    </p>

                    <ul className="auth-benefits">
                        <li>
                            <Check size={17} />
                            No extension or account syncing
                        </li>
                        <li>
                            <Check size={17} />
                            Every chart comes from your database
                        </li>
                        <li>
                            <Check size={17} />
                            Delete an upload and its rows anytime
                        </li>
                    </ul>
                </div>

                <div className="auth-visual-card auth-visual-card--quote">
                    <p>
                        “We built DigitalTrace to make browser history
                        understandable without sending it anywhere.”
                    </p>
                    <span>Full Stack course project</span>
                </div>

                <p className="auth-visual-footnote">
                    <LockKeyhole size={14} />
                    Passwords are hashed; uploads stay user-scoped.
                </p>
            </aside>

            <main className="auth-panel">
                <div className="auth-form-card">
                    <div className="auth-form-head">
                        <span className="auth-mobile-brand">
                            <ShieldCheck size={22} />
                            DigitalTrace
                        </span>

                        <h2>Create your account</h2>
                        <p>Register to start analysing your browsing history.</p>
                    </div>

                    {error && (
                        <div className="error-message" role="alert">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} noValidate>
                        <div className="form-field">
                            <label htmlFor="register-name">Full name</label>

                            <div className={`input-shell ${fieldErrors.name ? 'has-error' : ''}`}>
                                <User size={17} />
                                <input
                                    id="register-name"
                                    type="text"
                                    name="name"
                                    autoComplete="name"
                                    placeholder="Your name"
                                    maxLength={100}
                                    value={formData.name}
                                    onChange={handleChange}
                                    aria-invalid={Boolean(fieldErrors.name)}
                                />
                            </div>

                            {fieldErrors.name && (
                                <span className="field-error">{fieldErrors.name}</span>
                            )}
                        </div>

                        <div className="form-field">
                            <label htmlFor="register-email">Email address</label>

                            <div className={`input-shell ${fieldErrors.email ? 'has-error' : ''}`}>
                                <Mail size={17} />
                                <input
                                    id="register-email"
                                    type="email"
                                    name="email"
                                    autoComplete="email"
                                    placeholder="you@example.com"
                                    maxLength={150}
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
                            <label htmlFor="register-password">Password</label>

                            <div className={`input-shell ${fieldErrors.password ? 'has-error' : ''}`}>
                                <LockKeyhole size={17} />
                                <input
                                    id="register-password"
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    autoComplete="new-password"
                                    placeholder="Create a password"
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

                            <div className="password-rules">
                                {ruleResults.map((rule) => (
                                    <span
                                        key={rule.key}
                                        className={rule.passed ? 'rule-pass' : 'rule-pending'}
                                    >
                                        {rule.passed ? <Check size={13} /> : <X size={13} />}
                                        {rule.label}
                                    </span>
                                ))}
                            </div>

                            {fieldErrors.password && (
                                <span className="field-error">{fieldErrors.password}</span>
                            )}
                        </div>

                        <div className="form-field">
                            <label htmlFor="register-confirm">Confirm password</label>

                            <div className={`input-shell ${fieldErrors.confirmPassword ? 'has-error' : ''}`}>
                                <LockKeyhole size={17} />
                                <input
                                    id="register-confirm"
                                    type={showConfirm ? 'text' : 'password'}
                                    name="confirmPassword"
                                    autoComplete="new-password"
                                    placeholder="Repeat your password"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    aria-invalid={Boolean(fieldErrors.confirmPassword)}
                                />

                                <button
                                    type="button"
                                    className="input-action"
                                    onClick={() => setShowConfirm((value) => !value)}
                                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                                >
                                    {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                                </button>
                            </div>

                            {fieldErrors.confirmPassword && (
                                <span className="field-error">{fieldErrors.confirmPassword}</span>
                            )}
                        </div>

                        <button
                            type="submit"
                            className="auth-submit"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="button-spinner" />
                                    Creating account…
                                </>
                            ) : (
                                <>
                                    Create account
                                    <ArrowRight size={17} />
                                </>
                            )}
                        </button>
                    </form>

                    <p className="auth-switch">
                        Already have an account? <Link to="/login">Sign in</Link>
                    </p>

                    <p className="auth-legal">
                        Your uploaded history is visible only inside your account.
                    </p>
                </div>
            </main>
        </div>
    );
}

export default Register;
