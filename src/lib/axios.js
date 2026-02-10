import axios from 'axios';

const api = axios.create({
    // baseURL: 'http://localhost:5000/api', //for localhost
    baseURL: 'http://195.35.20.207:5000/api', //for vps
    headers: {
        'Content-Type': 'application/json',
    },
});

import Cookies from 'js-cookie';

// ... (existing code)

// Add a request interceptor to inject the token
api.interceptors.request.use(
    (config) => {
        if (typeof window !== 'undefined') {
            // Try localStorage first, then cookies
            const token = localStorage.getItem('token') || Cookies.get('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            // Add custom API Key
            config.headers['x-api-key'] = "bumpicare_flutter_2025_secure_key_xyz123abc456";
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Add a response interceptor to handle 401 errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            if (typeof window !== 'undefined') {
                // Clear all auth data
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                Cookies.remove('token');
                Cookies.remove('user_role');

                // Redirect to login
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
