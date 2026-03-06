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
        {
            id: 'student', title: 'Student', subtitle: 'I want to learn', icon: BookOpen,
            desc: 'Access courses, take quizzes, attend live classes, and get AI tutor support.',
            features: ['Browse & enroll in courses', 'Take quizzes & exams', 'Attend live classes', 'AI Tutor 24/7'],
        },
        {
            id: 'tutor', title: 'Tutor', subtitle: 'I want to teach', icon: Users,
            desc: 'Create courses, manage students, conduct live classes, and track learner analytics.',
            features: ['Create & publish courses', 'Manage students & batches', 'Conduct live classes', 'Analytics & reports'],
        },
    ];

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
            style={{ background: '#080b14', fontFamily: "'DM Sans', sans-serif" }}>

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-900/15 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute inset-0 opacity-[0.025] pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

            <div className="relative z-10 w-full max-w-2xl">

                {/* Header */}
                <div className="text-center mb-10">
                    <div className="flex items-center justify-center gap-2.5 mb-7">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-900/40">
                            <GraduationCap className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-white">Sapience<span className="text-violet-400">LMS</span></span>
                    </div>
                    {userAvatar && (
                        <img src={userAvatar} alt="Avatar"
                            className="w-16 h-16 rounded-full mx-auto mb-5 ring-2 ring-violet-500/30 shadow-xl object-cover" />
                    )}
                    <h1 className="text-3xl font-bold text-white mb-2">
                        Welcome{userName ? `, ${userName}` : ''}! 👋
                    </h1>
                    <p className="text-slate-400 text-sm">How would you like to use Sapience LMS?</p>
                </div>

                {/* Role cards */}
                <div className="grid md:grid-cols-2 gap-5 mb-8">
                    {roles.map(role => {
                        const Icon = role.icon;
                        const isSelected = selectedRole === role.id;
                        return (
                            <button key={role.id} onClick={() => setSelectedRole(role.id)}
                                className={`relative text-left p-6 rounded-2xl border-2 transition-all duration-200 group
                                    ${isSelected
                                        ? 'border-violet-500/50 bg-violet-500/10 scale-[1.02] shadow-xl shadow-violet-900/20'
                                        : 'border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/[0.15]'}`}>

                                {/* Check indicator */}
                                {isSelected && (
                                    <div className="absolute top-4 right-4 w-5 h-5 rounded-full bg-violet-600 flex items-center justify-center">
                                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z" />
                                        </svg>
                                    </div>
                                )}

                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-colors
                                    ${isSelected ? 'bg-violet-500/15' : 'bg-white/[0.04]'}`}>
                                    <Icon className={`w-6 h-6 ${isSelected ? 'text-violet-400' : 'text-slate-500'} transition-colors`} />
                                </div>

                                <h3 className="text-lg font-bold text-white mb-0.5">{role.title}</h3>
                                <p className="text-violet-400 text-sm font-medium mb-3">{role.subtitle}</p>
                                <p className="text-slate-500 text-sm leading-relaxed mb-4">{role.desc}</p>

                                <ul className="space-y-2">
                                    {role.features.map((f, i) => (
                                        <li key={i} className="flex items-center gap-2 text-sm text-slate-500">
                                            <span className="w-1 h-1 rounded-full bg-violet-500/50 shrink-0" />
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                            </button>
                        );
                    })}
                </div>

                {/* CTA */}
                <div className="text-center">
                    <button onClick={handleRoleSelect} disabled={!selectedRole || isLoading}
                        className={`inline-flex items-center gap-2.5 px-10 py-4 rounded-2xl text-base font-bold transition-all duration-200
                            ${selectedRole
                                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-900/30 hover:scale-[1.02] active:scale-[0.99]'
                                : 'bg-white/[0.03] border border-white/[0.07] text-slate-600 cursor-not-allowed'}`}>
                        {isLoading
                            ? <><Loader2 className="w-5 h-5 animate-spin" /> Setting up your account…</>
                            : <>Continue <ArrowRight className="w-5 h-5" /></>}
                    </button>
                    {!selectedRole && <p className="text-slate-600 text-sm mt-3">Please select a role to continue</p>}
                </div>
            </div>
        </div>
    );
}

export default function SelectRolePage() {
    return (
        <Suspense fallback={<div className="min-h-screen" style={{ background: '#080b14' }} />}>
            <SelectRoleClient />
        </Suspense>
    );
}