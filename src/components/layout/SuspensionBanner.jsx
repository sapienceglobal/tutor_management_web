'use client';

import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, ShieldX, X } from 'lucide-react';
import api from '@/lib/axios';
import Cookies from 'js-cookie';

export default function SuspensionBanner() {
    const [status, setStatus] = useState(null);
    const [visible, setVisible] = useState(true);

    const checkStatus = useCallback(async () => {
        try {
            const token = typeof window !== 'undefined' && (localStorage.getItem('token') || Cookies.get('token'));
            if (!token) return;
            const res = await api.get('/auth/me');
            if (res.data.success) {
                const role = res.data.user?.role;
                if (role === 'student') {
                    if (res.data.userBlocked) setStatus('blocked');
                    else if (res.data.instituteSuspended) setStatus('suspended');
                    else setStatus(null);
                } else {
                    setStatus(null);
                }
            }
        } catch (err) {
            if (err.response?.status === 403) {
                if (err.response?.data?.instituteSuspended) setStatus('suspended');
                else if (err.response?.data?.userBlocked) setStatus('blocked');
            }
        }
    }, []);

    useEffect(() => {
        checkStatus();
        const interval = setInterval(checkStatus, 30000);
        return () => clearInterval(interval);
    }, [checkStatus]);

    if (!status || !visible) return null;

    const config = {
        suspended: {
            Icon: AlertTriangle,
            bg: 'from-red-500 to-rose-600',
            pill: 'bg-red-700/30 text-red-100',
            pillText: 'Institute Suspended',
            message: 'Your institute has been suspended. You can view your purchased courses but no new activity is allowed.',
        },
        blocked: {
            Icon: ShieldX,
            bg: 'from-slate-700 to-red-800',
            pill: 'bg-black/20 text-red-200',
            pillText: 'Account Blocked',
            message: 'Your account has been blocked. You can view your purchased courses but no new activity is allowed.',
        },
    };

    const { Icon, bg, pill, pillText, message } = config[status];

    return (
        <div className={`fixed top-0 left-0 right-0 z-[9998] bg-gradient-to-r ${bg} text-white shadow-md`}>
            <div className="flex items-center justify-center gap-3 px-4 py-2.5 text-[13px] font-medium max-w-5xl mx-auto">
                <Icon className="w-4 h-4 shrink-0 animate-pulse" />
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide shrink-0 ${pill}`}>
                    {pillText}
                </span>
                <span className="text-white/90 text-center">{message}</span>
                <button
                    onClick={() => setVisible(false)}
                    className="ml-auto p-1 rounded-lg hover:bg-white/15 transition-colors flex-shrink-0"
                    title="Dismiss"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
}