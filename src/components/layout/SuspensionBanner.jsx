'use client';

import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, ShieldX } from 'lucide-react';
import api from '@/lib/axios';
import Cookies from 'js-cookie';

export default function SuspensionBanner() {
    const [status, setStatus] = useState(null); // null | 'suspended' | 'blocked'

    const checkStatus = useCallback(async () => {
        try {
            // Only check if user is logged in
            const token = typeof window !== 'undefined' && (localStorage.getItem('token') || Cookies.get('token'));
            if (!token) return;

            const res = await api.get('/auth/me');
            if (res.data.success) {
                const role = res.data.user?.role;
                // Only show banners for students — admin/tutor go to full-page redirects
                if (role === 'student') {
                    if (res.data.userBlocked) {
                        setStatus('blocked');
                    } else if (res.data.instituteSuspended) {
                        setStatus('suspended');
                    } else {
                        setStatus(null);
                    }
                } else {
                    setStatus(null);
                }
            }
        } catch (err) {
            // If 403 with instituteSuspended for student, show banner
            if (err.response?.status === 403 && err.response?.data?.instituteSuspended) {
                setStatus('suspended');
            } else if (err.response?.status === 403 && err.response?.data?.userBlocked) {
                setStatus('blocked');
            }
        }
    }, []);

    useEffect(() => {
        checkStatus();
        const interval = setInterval(checkStatus, 30000);
        return () => clearInterval(interval);
    }, [checkStatus]);

    if (!status) return null;

    const config = {
        suspended: {
            icon: AlertTriangle,
            gradient: 'from-red-500 to-red-600',
            message: 'Your institute has been suspended. You can view your purchased courses but no new activity is allowed.',
        },
        blocked: {
            icon: ShieldX,
            gradient: 'from-slate-800 to-red-900',
            message: 'Your account has been blocked by the administrator. You can view your purchased courses but no new activity is allowed.',
        },
    };

    const { icon: Icon, gradient, message } = config[status];

    return (
        <div className={`fixed top-0 left-0 right-0 z-[9998] bg-gradient-to-r ${gradient} text-white shadow-lg`}>
            <div className="flex items-center justify-center gap-3 px-4 py-2.5 text-sm font-medium">
                <Icon className="w-4 h-4 animate-pulse shrink-0" />
                <span>{message}</span>
            </div>
        </div>
    );
}
