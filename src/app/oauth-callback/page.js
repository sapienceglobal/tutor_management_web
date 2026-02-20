'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import Cookies from 'js-cookie';
import api from '@/lib/axios';

function OAuthCallbackPageClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState('loading'); // loading, success, error
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        const token = searchParams.get('token');
        const error = searchParams.get('error');

        if (error) {
            setStatus('error');
            setErrorMsg(decodeURIComponent(error));
            return;
        }

        if (!token) {
            setStatus('error');
            setErrorMsg('No authentication token received');
            return;
        }

        // Store token
        Cookies.set('token', token, { expires: 7 });
        localStorage.setItem('token', token);

        // Fetch user data
        const fetchUser = async () => {
            try {
                const res = await api.get('/auth/me');
                const user = res.data.user || res.data;

                Cookies.set('user_role', user.role, { expires: 7 });
                localStorage.setItem('user', JSON.stringify(user));

                setStatus('success');

                // Redirect to appropriate dashboard
                setTimeout(() => {
                    if (user.role === 'admin') {
                        router.push('/admin/dashboard');
                    } else if (user.role === 'tutor') {
                        router.push('/tutor/dashboard');
                    } else {
                        router.push('/student/dashboard');
                    }
                }, 1000);
            } catch (err) {
                console.error('OAuth callback error:', err);
                setStatus('error');
                setErrorMsg('Failed to fetch user data. Please try logging in again.');
            }
        };

        fetchUser();
    }, [searchParams, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900">
            {/* Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/30 blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/30 blur-[120px] animate-pulse delay-1000" />
            </div>

            <div className="relative z-10 text-center p-8">
                {status === 'loading' && (
                    <div className="space-y-6">
                        <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto">
                            <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-2">Signing you in...</h2>
                            <p className="text-slate-400">Please wait while we set up your session</p>
                        </div>
                    </div>
                )}

                {status === 'success' && (
                    <div className="space-y-6">
                        <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle className="w-10 h-10 text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-2">Welcome back!</h2>
                            <p className="text-slate-400">Redirecting to your dashboard...</p>
                        </div>
                    </div>
                )}

                {status === 'error' && (
                    <div className="space-y-6">
                        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
                            <AlertCircle className="w-10 h-10 text-red-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-2">Login Failed</h2>
                            <p className="text-slate-400 mb-6">{errorMsg}</p>
                            <button
                                onClick={() => router.push('/login')}
                                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all"
                            >
                                Back to Login
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function OAuthCallbackPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-900" />}>
            <OAuthCallbackPageClient />
        </Suspense>
    );
}
