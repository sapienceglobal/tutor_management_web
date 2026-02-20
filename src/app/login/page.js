'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { GraduationCap, Loader2, Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import api from '@/lib/axios';
import Cookies from 'js-cookie';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api';

function LoginPageClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [oauthResetEmail, setOauthResetEmail] = useState('');
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    // Check for OAuth error in URL params
    useEffect(() => {
        const oauthError = searchParams.get('error');
        if (oauthError) {
            setError(decodeURIComponent(oauthError));
        }
    }, [searchParams]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
        setOauthResetEmail('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setOauthResetEmail('');

        try {
            const response = await api.post('/auth/login', formData);
            const { token, user } = response.data;

            Cookies.set('token', token, { expires: 7 });
            Cookies.set('user_role', user.role, { expires: 7 });

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            if (user.role === 'tutor') {
                router.push('/tutor/dashboard');
            } else {
                router.push('/student/dashboard');
            }
        } catch (err) {
            console.error('Login error:', err);
            const apiError = err.response?.data;
            if (apiError?.code === 'OAUTH_PASSWORD_NOT_SET' && formData.email) {
                setOauthResetEmail(formData.email.trim());
            }
            setError(
                apiError?.message || 'Something went wrong. Please try again.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        window.location.href = `${BACKEND_URL}/auth/google`;
    };

    const handleGitHubLogin = () => {
        window.location.href = `${BACKEND_URL}/auth/github`;
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-900">
            {/* Animated Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/30 blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/30 blur-[120px] animate-pulse delay-1000" />
                <div className="absolute top-[20%] right-[20%] w-[30%] h-[30%] rounded-full bg-teal-500/20 blur-[100px] animate-pulse delay-2000" />
            </div>

            <div className="relative z-10 w-full max-w-5xl p-4 lg:p-8">
                <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden grid lg:grid-cols-2 min-h-[600px]">

                    {/* Left: Brand Section */}
                    <div className="relative hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-indigo-600/90 to-purple-700/90 text-white">
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=2073&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay opacity-20"></div>

                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-12">
                                <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-md">
                                    <GraduationCap className="h-6 w-6 text-white" />
                                </div>
                                <span className="text-xl font-bold tracking-wide">TutorApp</span>
                            </div>

                            <h2 className="text-4xl font-bold leading-tight mb-6">
                                Unlock your potential with expert guidance.
                            </h2>
                            <p className="text-indigo-100 text-lg leading-relaxed max-w-sm">
                                Join our community of learners and educators to achieve your academic goals.
                            </p>
                        </div>

                        <div className="relative z-10 space-y-6">
                            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                                <div className="flex gap-1 mb-2">
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20"><path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" /></svg>
                                    ))}
                                </div>
                                <p className="text-sm italic opacity-90">"This platform transformed the way I study. The tutors are incredible!"</p>
                                <div className="mt-3 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-indigo-400"></div>
                                    <div className="text-xs">
                                        <div className="font-bold">Sarah Jenkins</div>
                                        <div className="opacity-70">Student, Harvard</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Form Section */}
                    <div className="p-8 lg:p-12 flex flex-col justify-center bg-white/80 lg:bg-white/50 backdrop-blur-xl">
                        <div className="max-w-md mx-auto w-full">
                            <div className="text-center mb-10">
                                <h1 className="text-3xl font-bold text-slate-800 mb-2">Welcome Back</h1>
                                <p className="text-slate-500">Sign in to continue your journey</p>
                            </div>

                            {error && (
                                <div className="mb-6 space-y-3">
                                    <div className="flex items-center gap-3 rounded-xl bg-red-50/80 backdrop-blur-sm p-4 text-sm font-medium text-red-600 border border-red-100 animate-in fade-in slide-in-from-top-2">
                                        <AlertCircle className="h-5 w-5 flex-shrink-0" />
                                        <p>{error}</p>
                                    </div>
                                    {oauthResetEmail && (
                                        <a
                                            href={`/forgot-password?email=${encodeURIComponent(oauthResetEmail)}`}
                                            className="inline-flex text-sm font-semibold text-indigo-600 hover:text-indigo-500 hover:underline"
                                        >
                                            Set password via email
                                        </a>
                                    )}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-slate-700 font-medium ml-1">Email</Label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                                        <Input
                                            id="email"
                                            name="email"
                                            placeholder="name@example.com"
                                            type="email"
                                            required
                                            className="pl-12 h-12 bg-white/50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all rounded-xl shadow-sm"
                                            value={formData.email}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between ml-1">
                                        <Label htmlFor="password" className="text-slate-700 font-medium">Password</Label>
                                        <a href="/forgot-password" className="text-xs font-semibold text-indigo-600 hover:text-indigo-500">
                                            Forgot password?
                                        </a>
                                    </div>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                                        <Input
                                            id="password"
                                            name="password"
                                            placeholder="••••••••"
                                            type="password"
                                            className="pl-12 h-12 bg-white/50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all rounded-xl shadow-sm"
                                            value={formData.password}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-12 text-base font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-200 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] mt-2"
                                    disabled={isLoading}
                                    style={{
                                        boxShadow: "0 10px 30px -10px rgba(79, 70, 229, 0.4)"
                                    }}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Verifying...
                                        </>
                                    ) : (
                                        <>
                                            Sign In
                                            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </Button>
                            </form>

                            <div className="mt-8 mb-8 relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-slate-200" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-transparent backdrop-blur-xl px-2 text-slate-500 font-medium">Or continue with</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Button
                                    variant="outline"
                                    className="h-12 border-slate-200 hover:bg-white/60 hover:border-indigo-200 rounded-xl bg-white/40 backdrop-blur-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                                    onClick={handleGoogleLogin}
                                    type="button"
                                >
                                    <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                    </svg>
                                    Google
                                </Button>
                                <Button
                                    variant="outline"
                                    className="h-12 border-slate-200 hover:bg-white/60 hover:border-indigo-200 rounded-xl bg-white/40 backdrop-blur-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                                    onClick={handleGitHubLogin}
                                    type="button"
                                >
                                    <svg className="mr-2 h-5 w-5 fill-slate-900" viewBox="0 0 24 24">
                                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                    </svg>
                                    GitHub
                                </Button>
                            </div>

                            <p className="text-center text-sm text-slate-600 mt-8">
                                Don&apos;t have an account?{' '}
                                <a href="/register" className="font-bold text-indigo-600 hover:text-indigo-500 hover:underline transition-all">
                                    Create free account
                                </a>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Copyright/Footer */}
                <div className="absolute bottom-4 text-slate-400 text-xs text-center w-full z-10">
                    &copy; 2024 TutorApp Inc. All rights reserved.
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-900" />}>
            <LoginPageClient />
        </Suspense>
    );
}
