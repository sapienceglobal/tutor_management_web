'use client';

import { useState, useEffect } from 'react';
import { Zap, X } from 'lucide-react';
import Cookies from 'js-cookie';

export default function ImpersonationBar() {
    const [impersonation, setImpersonation] = useState(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const data = localStorage.getItem('sa_impersonating');
            if (data) {
                try { setImpersonation(JSON.parse(data)); } catch { }
            }
        }
    }, []);

    const handleExit = () => {
        const originalToken = localStorage.getItem('sa_original_token');
        const originalUser = localStorage.getItem('sa_original_user');
        if (originalToken && originalUser) {
            localStorage.setItem('token', originalToken);
            localStorage.setItem('user', originalUser);
            const user = JSON.parse(originalUser);
            Cookies.set('token', originalToken, { expires: 7 });
            Cookies.set('user_role', user.role || 'superadmin', { expires: 7 });
        }
        localStorage.removeItem('sa_original_token');
        localStorage.removeItem('sa_original_user');
        localStorage.removeItem('sa_impersonating');
        window.location.href = '/superadmin/institutes';
    };

    if (!impersonation) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-[9999] shadow-md"
            style={{ background: 'linear-gradient(90deg, #f59e0b 0%, #f97316 100%)' }}>
            <div className="flex items-center justify-center gap-2.5 px-4 py-2.5 text-amber-950 max-w-5xl mx-auto">
                <Zap className="w-4 h-4 shrink-0 animate-pulse" />
                <span className="text-[13px] font-semibold">Viewing as</span>
                <span className="flex items-center gap-1.5">
                    <strong className="text-[13px] font-bold">{impersonation.name}</strong>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-950/15 border border-amber-950/10">
                        {impersonation.role}
                    </span>
                    <span className="text-[12px] text-amber-900/70 hidden sm:inline">
                        ({impersonation.email})
                    </span>
                </span>
                <button
                    onClick={handleExit}
                    className="ml-4 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-950 text-amber-100 hover:bg-amber-900 transition-colors text-[12px] font-bold shadow-sm flex-shrink-0"
                >
                    <X className="w-3.5 h-3.5" />
                    Exit Impersonation
                </button>
            </div>
        </div>
    );
}