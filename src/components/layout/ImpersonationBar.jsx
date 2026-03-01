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
        // Restore superadmin credentials
        const originalToken = localStorage.getItem('sa_original_token');
        const originalUser = localStorage.getItem('sa_original_user');

        if (originalToken && originalUser) {
            localStorage.setItem('token', originalToken);
            localStorage.setItem('user', originalUser);

            const user = JSON.parse(originalUser);
            Cookies.set('token', originalToken, { expires: 7 });
            Cookies.set('user_role', user.role || 'superadmin', { expires: 7 });
        }

        // Clean up impersonation data
        localStorage.removeItem('sa_original_token');
        localStorage.removeItem('sa_original_user');
        localStorage.removeItem('sa_impersonating');

        // Redirect back to superadmin
        window.location.href = '/superadmin/institutes';
    };

    if (!impersonation) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-[9999] bg-gradient-to-r from-amber-400 to-orange-400 text-amber-950 shadow-lg">
            <div className="flex items-center justify-center gap-3 px-4 py-2.5 text-sm font-medium">
                <Zap className="w-4 h-4 animate-pulse" />
                <span>
                    You are viewing as <strong>{impersonation.name}</strong>
                    <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-950/20">
                        {impersonation.role}
                    </span>
                    <span className="ml-1 text-amber-800">({impersonation.email})</span>
                </span>
                <button
                    onClick={handleExit}
                    className="ml-4 flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-950 text-amber-100 hover:bg-amber-900 transition-colors text-xs font-bold"
                >
                    <X className="w-3.5 h-3.5" />
                    Exit Impersonation
                </button>
            </div>
        </div>
    );
}
