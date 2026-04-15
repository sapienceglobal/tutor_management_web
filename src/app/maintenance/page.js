'use client';

import { useState, useEffect } from 'react';
import { Wrench } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';

export default function MaintenancePage() {
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
            if (res.data.success) {
                const role = res.data.user?.role;
                const dashPaths = { admin: '/admin/dashboard', tutor: '/tutor/dashboard', student: '/student/dashboard' };
                window.location.href = dashPaths[role] || '/login';
            }
        } catch { } finally { setChecking(false); }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden"
            style={{ background: '#080b14', fontFamily: "'DM Sans', sans-serif" }}>

            {/* Background glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-900/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-indigo-900/15 rounded-full blur-[80px] pointer-events-none" />
            {/* Dot grid */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

            <div className="relative z-10 max-w-md w-full text-center space-y-8">

                {/* Logo */}
                <div className="flex items-center justify-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-900/40">
                        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-5 h-5">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <span className="text-lg font-bold text-white tracking-tight">
                        Sapience<span className="text-violet-400">LMS</span>
                    </span>
                </div>

                {/* Card */}
                <div className="bg-white/[0.03] border border-white/[0.08] rounded-3xl px-10 py-12 shadow-2xl backdrop-blur-sm">
                    {/* Icon */}
                    <div className="w-20 h-20 mx-auto mb-7 rounded-2xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center relative">
                        <Wrench className="w-9 h-9 text-violet-400 animate-bounce" />
                        <span className="absolute inset-0 rounded-2xl bg-violet-500/10 animate-ping opacity-30" />
                    </div>

                    <h1 className="text-2xl font-bold text-white mb-3 tracking-tight">
                        Under Maintenance
                    </h1>
                    <p className="text-slate-400 text-sm leading-relaxed">
                        We're upgrading the platform to serve you better. We'll be back online shortly — thank you for your patience!
                    </p>

                    {/* Animated progress bar */}
                    <div className="mt-8 h-1 w-full bg-white/[0.06] rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-violet-600 to-indigo-500 rounded-full animate-pulse" style={{ width: '65%' }} />
                    </div>
                    <p className="text-slate-600 text-xs mt-2">Platform upgrade in progress…</p>
                </div>

                {/* Admin link */}
                <Link href="/login"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-violet-400 transition-colors">
                    Admin Login
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                        <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </Link>
            </div>
        </div>
    );
}