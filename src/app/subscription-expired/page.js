'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/lib/axios';

export default function SubscriptionExpiredPage() {
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
            // If the institute is fully active, they shouldn't be here
            if (res.data.success && res.data.user?.institute?.isActive === true) {
                const role = res.data.user?.role;
                const dashPaths = { admin: '/admin/dashboard', tutor: '/tutor/dashboard', student: '/student/dashboard' };
                window.location.href = dashPaths[role] || '/';
            }
        } catch { } finally { setChecking(false); }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-900">
            {/* Background effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-red-600/20 blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-orange-600/20 blur-[120px] animate-pulse delay-1000" />
            </div>

            <div className="relative z-10 max-w-lg mx-auto text-center px-6">
                <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-2xl p-10">
                    <div className="bg-red-500/20 p-5 rounded-full inline-flex mb-6">
                        <AlertTriangle className="h-12 w-12 text-red-400" />
                    </div>

                    <h1 className="text-3xl font-bold text-white mb-3">
                        Subscription Expired
                    </h1>
                    <p className="text-slate-300 text-lg mb-8 leading-relaxed">
                        Your institute&apos;s subscription has expired. Please renew to continue accessing all features.
                        You can still view your data in read-only mode.
                    </p>

                    <div className="space-y-4">
                        <Button
                            onClick={() => window.location.href = '/student/payments'}
                            className="w-full h-12 text-base font-bold bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl transition-all hover:scale-[1.02]"
                        >
                            <CreditCard className="mr-2 h-5 w-5" />
                            Renew Subscription
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => window.history.back()}
                            className="w-full h-12 text-base font-medium border-white/20 text-white hover:bg-white/10 rounded-xl"
                        >
                            Go Back (Read-Only)
                        </Button>
                    </div>

                    <p className="text-slate-400 text-sm mt-6">
                        Need help? Contact <a href="mailto:support@sapience.app" className="text-indigo-400 hover:underline">support@sapience.app</a>
                    </p>
                </div>
            </div>
        </div>
    );
}
