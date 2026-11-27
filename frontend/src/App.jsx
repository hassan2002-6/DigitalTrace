
import { useEffect, useState } from 'react';

import './App.css';
import './redesign.css';

import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import HistoryPage from './pages/History';
import Upload from './pages/Upload';
import Settings from './pages/Settings';

function App() {
    const [theme, setTheme] = useState(() => {
        const savedTheme = localStorage.getItem('theme');

        return savedTheme === 'light' ? 'light' : 'dark';
    });

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    return (
        <BrowserRouter>
            <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Protected routes */}
                <Route element={<ProtectedRoute />}>
                    <Route
                        element={
                            <Layout
                                theme={theme}
                                setTheme={setTheme}
                            />
                        }
                    >
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/analytics" element={<Analytics />} />
                        <Route path="/history" element={<HistoryPage />} />
                        <Route path="/upload" element={<Upload />} />
                        <Route
                            path="/settings"
                            element={
                                <Settings
                                    theme={theme}
                                    setTheme={setTheme}
                                />
                            }
                        />
                    </Route>
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
