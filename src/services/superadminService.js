import api from '@/lib/api';

const normalizeError = (error, fallbackMessage) => {
    return error?.response?.data?.message || error?.message || fallbackMessage;
};

export const fetchPlatformStats = async () => {
    try {
        const res = await api.get('/superadmin/dashboard-stats');
        return res.data;
    } catch (error) {
        throw new Error(normalizeError(error, 'Failed to fetch platform stats'));
    }
};

export const getInstitutes = async () => {
    try {
        const res = await api.get('/superadmin/institutes');
        return res.data;
    } catch (error) {
        throw new Error(normalizeError(error, 'Failed to fetch institutes'));
    }
};

export const createInstitute = async (payload) => {
    try {
        const res = await api.post('/superadmin/institutes', payload);
        return res.data;
    } catch (error) {
        throw new Error(normalizeError(error, 'Failed to create institute'));
    }
};

export const updateInstituteStatus = async (id, isActive) => {
    try {
        const res = await api.put(`/superadmin/institutes/${id}`, { isActive });
        return res.data;
    } catch (error) {
        throw new Error(normalizeError(error, 'Failed to update institute status'));
    }
};
