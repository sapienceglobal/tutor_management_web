import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
    baseURL: 'http://localhost:4000/api',
    // baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to inject the token and API key
api.interceptors.request.use(
    (config) => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('token') || Cookies.get('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            config.headers['x-api-key'] = process.env.NEXT_PUBLIC_API_KEY || '';
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle 401 — Unauthorized
        if (error.response && error.response.status === 401) {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                Cookies.remove('token');
                Cookies.remove('user_role');

                if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
                    window.location.href = '/login';
                }
            }
        }

        // Handle Institute Suspension — redirect admin/tutor to /suspended
        if (error.response && error.response.status === 403 && error.response.data?.instituteSuspended) {
            if (typeof window !== 'undefined') {
                const userRole = Cookies.get('user_role');
                if ((userRole === 'admin' || userRole === 'tutor') && !window.location.pathname.includes('/suspended')) {
                    window.location.href = '/suspended';
                }
            }
        }

        // Handle Blocked User — redirect admin/tutor to /blocked
        if (error.response && error.response.status === 403 && error.response.data?.userBlocked) {
            if (typeof window !== 'undefined') {
                const userRole = Cookies.get('user_role');
                if ((userRole === 'admin' || userRole === 'tutor') && !window.location.pathname.includes('/blocked')) {
                    window.location.href = '/blocked';
                }
            }
        }

        // Handle Maintenance Mode (503)
        if (error.response && error.response.status === 503 && error.response.data?.isMaintenanceMode) {
            if (typeof window !== 'undefined' && !window.location.pathname.includes('/maintenance')) {
                window.location.href = '/maintenance';
            }
        }

        return Promise.reject(error);
    }
);

export default api;
