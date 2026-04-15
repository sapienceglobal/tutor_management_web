'use client';

import { useState, useEffect } from 'react';
import { ShieldX, LogOut, RefreshCw, Info } from 'lucide-react';
import Cookies from 'js-cookie';
import api from '@/lib/axios';

export default function BlockedPage() {
    const [checking, setChecking] = useState(false);

    useEffect(() => {
        checkStatus();
        const interval = setInterval(checkStatus, 15000);
        return () => clearInterval(interval);
    }, []);

    const checkStatus = async () => {
        setChecking(true);
        try {
            const res = await api.get('/auth/me');
            if (res.data.success && !res.data.userBlocked) {
                const role = res.data.user?.role;
                const dashPaths = { admin: '/admin/dashboard', tutor: '/tutor/dashboard', student: '/student/dashboard' };
                window.location.href = dashPaths[role] || '/';
            }
        } catch { } finally { setChecking(false); }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        Cookies.remove('token');
        Cookies.remove('user_role');
        window.location.href = '/login';
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
            style={{ background: '#080b14', fontFamily: "'DM Sans', sans-serif" }}>

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-950/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

            <div className="relative z-10 max-w-lg w-full">

                {/* Logo */}
                <div className="flex items-center justify-center gap-2.5 mb-10">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
                        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-4 h-4">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <span className="text-lg font-bold text-white">Sapience<span className="text-violet-400">LMS</span></span>
                </div>

                <div className="bg-white/[0.03] border border-white/[0.08] rounded-3xl overflow-hidden shadow-2xl">
                    <div className="h-1 w-full bg-gradient-to-r from-slate-600 via-red-700 to-slate-600" />

                    <div className="px-8 py-10 text-center">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                            <ShieldX className="w-9 h-9 text-red-400" />
                        </div>

                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold uppercase tracking-widest mb-4">
                            Account Blocked
                        </div>

                        <h1 className="text-2xl font-bold text-white mb-2">Access Restricted</h1>
                        <p className="text-slate-400 text-sm leading-relaxed mb-8">
                            Your account has been <span className="text-red-400 font-semibold">blocked</span> by the platform administrator.
                            You cannot access any features until your account is unblocked.
                        </p>

                        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 mb-8 text-left">
                            <div className="flex items-center gap-2 mb-3">
                                <Info className="w-4 h-4 text-slate-400 shrink-0" />
                                <span className="text-slate-300 text-sm font-semibold">What happened?</span>
                            </div>
                            <ul className="space-y-2">
                                {[
                                    'Your account has been blocked by the administrator',
                                    'You cannot access any features until unblocked',
                                    'All your data is safe and will be restored upon unblocking',
                                    'Contact the platform administrator for more details',
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-slate-500">
                                        <span className="mt-1.5 w-1 h-1 rounded-full bg-slate-500 shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <p className="flex items-center justify-center gap-2 text-slate-600 text-xs mb-6">
                            <RefreshCw className={`w-3 h-3 ${checking ? 'animate-spin text-violet-400' : ''}`} />
                            Auto-checking every 15 seconds…
                        </p>

                        <div className="flex gap-3 justify-center">
                            <button onClick={checkStatus} disabled={checking}
                                className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-50">
                                <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
                                Check Now
                            </button>
                            <button onClick={handleLogout}
                                className="flex items-center gap-2 px-5 py-2.5 bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.09] text-slate-300 text-sm font-semibold rounded-xl transition-all">
                                <LogOut className="w-4 h-4" />
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}