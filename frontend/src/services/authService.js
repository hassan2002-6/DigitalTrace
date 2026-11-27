
import api from './api';

export const registerUser = async (userData) => {
    const response = await api.post('/users/register', userData);
    return response.data;
};

export const loginUser = async (userData) => {
    const response = await api.post('/users/login', userData);
    return response.data;
};

export const getUserProfile = async () => {
    const response = await api.get('/users/profile');
    return response.data;
};

export const updateUserProfile = async (data) => {
    const response = await api.patch('/users/profile', data);
    return response.data;
};
