
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { loginUser } from '../services/authService';

function Login() {
    const navigate = useNavigate();
    const location = useLocation();

    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await loginUser(formData);

            if (!response.token) {
                throw new Error('Login response did not contain a token.');
            }

            localStorage.setItem('token', response.token);
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
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-brand">
                    <ShieldCheck size={32} />
                    <h2>Footprint</h2>
                </div>

                <h1>Welcome Back</h1>
                <p className="auth-subtitle">
                    Login to access your digital footprint dashboard.
                </p>

                {location.state?.message && (
                    <div className="success-message">
                        {location.state.message}
                    </div>
                )}

                {error && (
                    <div className="error-message">{error}</div>
                )}

                <form onSubmit={handleSubmit}>
                    <label>Email Address</label>
                    <input
                        type="email"
                        name="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />

                    <label>Password</label>
                    <input
                        type="password"
                        name="password"
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />

                    <button type="submit" disabled={loading}>
                        {loading ? 'Logging In...' : 'Login'}
                    </button>
                </form>

                <p className="auth-switch">
                    Don't have an account? <Link to="/register">Register</Link>
                </p>
            </div>
        </div>
    );
}

export default Login;
