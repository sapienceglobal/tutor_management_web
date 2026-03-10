// ════════════════════════════════════════════════════════════════════════════
// ForgotPasswordPage  —  /app/forgot-password/page.jsx
// ════════════════════════════════════════════════════════════════════════════
'use client';

import { useEffect, useState } from 'react';
import { Mail, Loader2, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';
import { GraduationCap } from 'lucide-react';

function Logo() {
    return (
        <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Sapience<span className="text-violet-400">LMS</span></span>
        </div>
    );
}

export function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const prefill = new URLSearchParams(window.location.search).get('email');
        if (prefill) setEmail(decodeURIComponent(prefill));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true); setError(''); setSuccess(false);
        try {
            await api.post('/auth/forgot-password', { email });
            setSuccess(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send reset email. Please try again.');
        } finally { setIsLoading(false); }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
            style={{ background: '#080b14', fontFamily: "'DM Sans', sans-serif" }}>

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-900/15 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute inset-0 opacity-[0.025] pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

            <div className="relative z-10 w-full max-w-sm">
                <div className="flex justify-center mb-10"><Logo /></div>

                <div className="bg-white/[0.03] border border-white/[0.08] rounded-3xl p-8 shadow-2xl">
                    <div className="text-center mb-7">
                        <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center">
                            <Mail className="w-7 h-7 text-violet-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-1">Forgot password?</h1>
                        <p className="text-slate-500 text-sm">No worries, we'll send you reset instructions.</p>
                    </div>

                    {success ? (
                        <div className="text-center">
                            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center">
                                <CheckCircle className="w-7 h-7 text-emerald-400" />
                            </div>
                            <h3 className="text-white font-bold mb-2">Email sent!</h3>
                            <p className="text-slate-500 text-sm mb-6">Check your inbox for instructions to reset your password.</p>
                            <button onClick={() => setSuccess(false)}
                                className="w-full h-10 bg-white/[0.05] border border-white/[0.08] text-slate-300 text-sm font-semibold rounded-xl hover:bg-white/[0.08] transition-all">
                                Back to reset
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                    <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                                </div>
                            )}
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-400">Email address</label>
                                <div className="relative group">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-violet-400 transition-colors" />
                                    <input type="email" placeholder="name@example.com" required
                                        value={email} onChange={e => setEmail(e.target.value)}
                                        className="w-full h-11 pl-10 pr-4 bg-white/[0.04] border border-white/[0.09] rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/10 transition-all" />
                                </div>
                            </div>
                            <button type="submit" disabled={isLoading}
                                className="w-full h-11 flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-60">
                                {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</> : 'Reset Password'}
                            </button>
                        </form>
                    )}
                </div>

                <div className="text-center mt-6">
                    <Link href="/login" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-300 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Back to sign in
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default ForgotPasswordPage;


// ════════════════════════════════════════════════════════════════════════════
// SelectRolePage  —  /app/select-role/page.jsx
// Copy this into its own file and add 'use client'; + imports as needed
// ════════════════════════════════════════════════════════════════════════════
/*
'use client';
import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { GraduationCap, BookOpen, Users, ArrowRight, Loader2 } from 'lucide-react';
import Cookies from 'js-cookie';
import api from '@/lib/axios';

function SelectRoleClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [selectedRole, setSelectedRole] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [userName, setUserName] = useState('');
    const [userAvatar, setUserAvatar] = useState('');

    useEffect(() => {
        const token = searchParams.get('token');
        const name = searchParams.get('name');
        const avatar = searchParams.get('avatar');
        if (!token) { router.push('/login'); return; }
        Cookies.set('token', token, { expires: 7 });
        localStorage.setItem('token', token);
        if (name) setUserName(decodeURIComponent(name));
        if (avatar) setUserAvatar(decodeURIComponent(avatar));
    }, [searchParams, router]);

    const handleRoleSelect = async () => {
        if (!selectedRole) return;
        setIsLoading(true);
        try {
            const res = await api.post('/auth/set-role', { role: selectedRole });
            const { token, user } = res.data;
            Cookies.set('token', token, { expires: 7 }); Cookies.set('user_role', user.role, { expires: 7 });
            localStorage.setItem('token', token); localStorage.setItem('user', JSON.stringify(user));
            router.push(user.role === 'tutor' ? '/tutor/dashboard' : '/student/dashboard');
        } catch { setIsLoading(false); }
    };

    const roles = [
        { id: 'student', title: 'Student', subtitle: 'I want to learn', icon: BookOpen,
          desc: 'Access courses, take quizzes, attend live classes, and track your progress.',
          features: ['Browse & enroll in courses', 'Take quizzes & exams', 'Attend live classes', 'AI Tutor support'], color: 'blue' },
        { id: 'tutor', title: 'Tutor', subtitle: 'I want to teach', icon: Users,
          desc: 'Create courses, manage students, conduct live classes, and build your teaching brand.',
          features: ['Create & publish courses', 'Manage students', 'Conduct live classes', 'Analytics & reports'], color: 'violet' },
    ];

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
            style={{ background: '#080b14', fontFamily: "'DM Sans', sans-serif" }}>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-900/15 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute inset-0 opacity-[0.025] pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

            <div className="relative z-10 w-full max-w-2xl">
                <div className="text-center mb-10">
                    <div className="flex items-center justify-center gap-2.5 mb-6">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center"><GraduationCap className="w-5 h-5 text-white" /></div>
                        <span className="text-xl font-bold text-white">Sapience<span className="text-violet-400">LMS</span></span>
                    </div>
                    {userAvatar && <img src={userAvatar} alt="" className="w-16 h-16 rounded-full mx-auto mb-5 ring-2 ring-violet-500/30 shadow-xl" />}
                    <h1 className="text-3xl font-bold text-white mb-2">Welcome{userName ? `, ${userName}` : ''}! 👋</h1>
                    <p className="text-slate-400">How would you like to use Sapience LMS?</p>
                </div>

                <div className="grid md:grid-cols-2 gap-5 mb-8">
                    {roles.map(role => {
                        const Icon = role.icon;
                        const isSelected = selectedRole === role.id;
                        return (
                            <button key={role.id} onClick={() => setSelectedRole(role.id)}
                                className={`relative text-left p-6 rounded-2xl border-2 transition-all duration-200 group
                                    ${isSelected ? 'border-violet-500/50 bg-violet-500/10 scale-[1.02]' : 'border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20'}`}>
                                {isSelected && <div className="absolute top-4 right-4 w-5 h-5 rounded-full bg-violet-600 flex items-center justify-center"><svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z"/></svg></div>}
                                <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center mb-5">
                                    <Icon className={`w-6 h-6 ${isSelected ? 'text-violet-400' : 'text-slate-500'} transition-colors`} />
                                </div>
                                <h3 className="text-lg font-bold text-white mb-0.5">{role.title}</h3>
                                <p className="text-violet-400 text-sm font-medium mb-3">{role.subtitle}</p>
                                <p className="text-slate-500 text-sm mb-4 leading-relaxed">{role.desc}</p>
                                <ul className="space-y-1.5">
                                    {role.features.map((f, i) => (
                                        <li key={i} className="flex items-center gap-2 text-sm text-slate-500">
                                            <span className="w-1 h-1 rounded-full bg-violet-500/60 shrink-0" />{f}
                                        </li>
                                    ))}
                                </ul>
                            </button>
                        );
                    })}
                </div>

                <div className="text-center">
                    <button onClick={handleRoleSelect} disabled={!selectedRole || isLoading}
                        className={`inline-flex items-center gap-2 px-10 py-4 rounded-2xl text-base font-bold transition-all duration-200
                            ${selectedRole ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-900/30 hover:scale-[1.02]' : 'bg-white/[0.04] border border-white/[0.06] text-slate-600 cursor-not-allowed'}`}>
                        {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> Setting up…</> : <>Continue <ArrowRight className="w-5 h-5" /></>}
                    </button>
                    {!selectedRole && <p className="text-slate-600 text-sm mt-3">Please select a role to continue</p>}
                </div>
            </div>
        </div>
    );
}

export default function SelectRolePage() {
    return <Suspense fallback={<div className="min-h-screen" style={{ background: '#080b14' }} />}><SelectRoleClient /></Suspense>;
}
*/