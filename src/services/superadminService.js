import api from '@/lib/api';

const normalizeError = (error, fallbackMessage) => {
    return error?.response?.data?.message || error?.message || fallbackMessage;
};

export const fetchPlatformStats = async (params = {}) => {
    try {
        const res = await api.get('/superadmin/dashboard-stats', { params });
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

/**
 * Get plan limits and features for a specific plan
 */
export const getPlanDetails = (plan) => {
    const planConfigs = {
        free: {
            name: 'Free',
            price: '$0/month',
            features: [
                '👥 2 Tutors',
                '👥 10 Students',
                '📚 Basic Course Management',
                '🔒 Standard Security'
            ],
            limits: {
                tutors: 2,
                students: 10,
                storage: '1GB'
            }
        },
        basic: {
            name: 'Basic',
            price: '$49/month',
            features: [
                '👥 10 Tutors',
                '👥 100 Students',
                '📚 Advanced Course Management',
                '🎥 HLS Video Streaming',
                '🔒 Enhanced Security',
                '📊 Basic Analytics'
            ],
            limits: {
                tutors: 10,
                students: 100,
                storage: '10GB'
            }
        },
        pro: {
            name: 'Pro',
            price: '$149/month',
            features: [
                '👥 50 Tutors',
                '👥 500 Students',
                '📚 Advanced Course Management',
                '🎥 HLS Video Streaming',
                '🎨 Custom Branding',
                '📹 Zoom Integration',
                '🤖 AI Tutor Basic',
                '🔒 Enterprise Security',
                '📊 Advanced Analytics',
                '🌐 Custom Domain'
            ],
            limits: {
                tutors: 50,
                students: 500,
                storage: '100GB'
            }
        },
        enterprise: {
            name: 'Enterprise',
            price: 'Custom',
            features: [
                '👥 Unlimited Tutors',
                '👥 Unlimited Students',
                '📚 Full Course Management',
                '🎥 HLS Video Streaming',
                '🎨 Custom Branding',
                '📹 Zoom Integration',
                '🤖 AI Tutor Advanced',
                '🔒 Enterprise Security',
                '📊 Advanced Analytics',
                '🌐 Custom Domain',
                '🔌 API Access',
                '📞 Priority Support'
            ],
            limits: {
                tutors: 'Unlimited',
                students: 'Unlimited',
                storage: 'Unlimited'
            }
        }
    };

    return planConfigs[plan] || planConfigs.free;
};


export const getSubscriptionPlans = async () => {
    const response = await api.get('/subscriptions');
    return response.data;
};

export const createSubscriptionPlan = async (planData) => {
    const response = await api.post('/subscriptions', planData);
    return response.data;
};

export const updateSubscriptionPlan = async (id, planData) => {
    const response = await api.put(`/subscriptions/${id}`, planData);
    return response.data;
};

export const deleteSubscriptionPlan = async (id) => {
    const response = await api.delete(`/subscriptions/${id}`);
    return response.data;
};

export const getSubscriptionsOverview = async () => {
    try {
        const res = await api.get('/superadmin/subscriptions-overview');
        return res.data; // API se { success: true, kpis, distribution, subscriptions } return hoga
    } catch (error) {
        throw new Error(normalizeError(error, 'Failed to fetch subscriptions overview data'));
    }
};

// Delete Institute Permanently
export const deleteInstitute = async (id) => {
    try {
        const response = await api.delete(`/superadmin/institutes/${id}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to delete institute' };
    }
};
