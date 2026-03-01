'use client';

import { useState, useEffect } from 'react';
import { ShieldX, Phone, Mail, LogOut, RefreshCw } from 'lucide-react';
import Cookies from 'js-cookie';
import api from '@/lib/axios';

export default function SuspendedPage() {
    const [checking, setChecking] = useState(false);

    // Periodically check if institute is unsuspended
    useEffect(() => {
        const interval = setInterval(checkStatus, 15000); // every 15 sec
        return () => clearInterval(interval);
    }, []);

    const checkStatus = async () => {
        setChecking(true);
        try {
            const res = await api.get('/auth/me');
            if (res.data.success && !res.data.instituteSuspended) {
                // Institute is active again — redirect to dashboard
                const role = res.data.user?.role;
                const dashPaths = { admin: '/admin/dashboard', tutor: '/tutor/dashboard', student: '/student/dashboard' };
                window.location.href = dashPaths[role] || '/';
            }
        } catch {
            // Still suspended, stay on this page
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
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-amber-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl border border-red-100 max-w-lg w-full p-8 text-center">
                <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
                    <ShieldX className="w-10 h-10 text-red-500" />
                </div>

                <h1 className="text-2xl font-black text-slate-800 mb-2">Institute Suspended</h1>
                <p className="text-slate-500 leading-relaxed mb-6">
                    Your institute has been <strong className="text-red-600">suspended</strong> by the platform administrator.
                    You cannot access any features until your institute is reactivated.
                </p>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-left">
                    <h3 className="text-sm font-semibold text-amber-800 mb-2">What does this mean?</h3>
                    <ul className="text-sm text-amber-700 space-y-1.5">
                        <li>• Your admin & tutor accounts are temporarily disabled</li>
                        <li>• Students can still view their purchased courses (read-only)</li>
                        <li>• No new enrollments, courses, or activities can happen</li>
                        <li>• Contact the platform administrator to resolve this</li>
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
