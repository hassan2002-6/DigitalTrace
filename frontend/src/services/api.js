
import axios from 'axios';

const api = axios.create({
    baseURL:
        import.meta.env.VITE_API_URL ||
        (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api'),
    headers: {
        'Content-Type': 'application/json'
    }
});

// Automatically attach the JWT token to requests.
api.interceptors.request.use((config) => {
    const token =
        localStorage.getItem('token') ||
        sessionStorage.getItem('token');

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

// Clear an expired session and return to the login page.
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;
        const url = error.config?.url || '';

        if (status === 401 && !url.includes('/users/login')) {
            localStorage.removeItem('token');
            sessionStorage.removeItem('token');

            if (window.location.pathname !== '/login') {
                window.location.assign('/login');
            }
        }

        return Promise.reject(error);
    }
);

export default api;
