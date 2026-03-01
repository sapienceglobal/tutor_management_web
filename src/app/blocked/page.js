'use client';

import { useState, useEffect } from 'react';
import { ShieldX, LogOut, Mail, RefreshCw } from 'lucide-react';
import Cookies from 'js-cookie';
import api from '@/lib/axios';

export default function BlockedPage() {
    const [checking, setChecking] = useState(false);

    // Periodically check if user is unblocked
    useEffect(() => {
        const interval = setInterval(checkStatus, 15000);
        return () => clearInterval(interval);
    }, []);

    const checkStatus = async () => {
        setChecking(true);
        try {
            const res = await api.get('/auth/me');
            if (res.data.success && !res.data.userBlocked) {
                // User is unblocked — redirect to dashboard
                const role = res.data.user?.role;
                const dashPaths = { admin: '/admin/dashboard', tutor: '/tutor/dashboard', student: '/student/dashboard' };
                window.location.href = dashPaths[role] || '/';
            }
        } catch {
            // Still blocked
        } finally {
            setChecking(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        Cookies.remove('token');
        Cookies.remove('user_role');
        window.location.href = '/login';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-950 to-slate-900 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 text-center">
                <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
                    <ShieldX className="w-10 h-10 text-red-500" />
                </div>

                <h1 className="text-2xl font-black text-slate-800 mb-2">Account Blocked</h1>
                <p className="text-slate-500 leading-relaxed mb-6">
                    Your account has been <strong className="text-red-600">blocked</strong> by the platform administrator.
                    You cannot access any features until your account is unblocked.
                </p>

                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-left">
                    <h3 className="text-sm font-semibold text-red-800 mb-2">What happened?</h3>
                    <ul className="text-sm text-red-700 space-y-1.5">
                        <li>• Your account has been blocked by the administrator</li>
                        <li>• You cannot access any features until unblocked</li>
                        <li>• All your data is safe and will be restored upon unblocking</li>
                        <li>• Contact the platform administrator for more details</li>
                    </ul>
                </div>

                <p className="text-xs text-slate-400 mb-4 flex items-center justify-center gap-1.5">
                    <RefreshCw className={`w-3 h-3 ${checking ? 'animate-spin' : ''}`} />
                    Auto-checking every 15 seconds...
                </p>

                <div className="flex gap-3 justify-center">
                    <button
                        onClick={checkStatus}
                        disabled={checking}
                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
                        Check Now
                    </button>

                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-900 transition-colors font-medium"
                    >
                        <LogOut className="w-4 h-4" />
                        Logout
                    </button>
                </div>
            </div>
        </div>
    );
}
