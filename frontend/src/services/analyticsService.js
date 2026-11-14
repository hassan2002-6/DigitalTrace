
import api from './api';

export const getDashboardSummary = async (params = {}) => {
    const response = await api.get('/analytics/summary', { params });
    return response.data;
};

export const getBrowsingActivity = async (params = {}) => {
    const response = await api.get('/analytics/activity', { params });
    return response.data;
};

export const getWebsiteCategories = async (params = {}) => {
    const response = await api.get('/analytics/categories', { params });
    return response.data;
};

export const getTopWebsites = async (params = {}) => {
    const response = await api.get('/analytics/websites', { params });
    return response.data;
};

export const getHourlyActivity = async (params = {}) => {
    const response = await api.get('/analytics/hourly', { params });
    return response.data;
};

export const getHourlyWebsiteBreakdown = async (params = {}) => {
    const response = await api.get('/analytics/hourly-websites', { params });
    return response.data;
};
