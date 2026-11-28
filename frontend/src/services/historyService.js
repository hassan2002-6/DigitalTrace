
import api from './api';

export const getBrowsingHistory = async (params = {}) => {
    const response = await api.get('/history', { params });
    return response.data;
};

export const getUploadedFiles = async () => {
    const response = await api.get('/history/uploads');
    return response.data;
};
