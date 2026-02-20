'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { GraduationCap, BookOpen, Users, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import Cookies from 'js-cookie';
import api from '@/lib/axios';

export default function SelectRolePage() {
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

        if (!token) {
            router.push('/login');
            return;
        }

        // Store token temporarily
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

            // Update stored data
            Cookies.set('token', token, { expires: 7 });
            Cookies.set('user_role', user.role, { expires: 7 });
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            // Redirect to dashboard
            if (user.role === 'tutor') {
                router.push('/tutor/dashboard');
            } else {
                router.push('/student/dashboard');
            }
        } catch (err) {
            console.error('Role selection error:', err);
            setIsLoading(false);
        }
    };

    const roles = [
        {
            id: 'student',
            title: 'Student',
            subtitle: 'I want to learn',
            description: 'Access courses, take quizzes, attend live classes, and track your learning progress.',
            icon: BookOpen,
            gradient: 'from-blue-500 to-cyan-500',
            shadowColor: 'shadow-blue-500/25',
            bgGlow: 'bg-blue-500/10',
            borderHover: 'hover:border-blue-400/60',
            features: ['Browse & enroll in courses', 'Take quizzes & exams', 'Attend live classes', 'Track your progress']
        },
        {
            id: 'tutor',
            title: 'Tutor',
            subtitle: 'I want to teach',
            description: 'Create courses, manage students, conduct live classes, and build your teaching brand.',
            icon: Users,
            gradient: 'from-purple-500 to-pink-500',
            shadowColor: 'shadow-purple-500/25',
            bgGlow: 'bg-purple-500/10',
            borderHover: 'hover:border-purple-400/60',
            features: ['Create & publish courses', 'Manage students', 'Conduct live classes', 'View analytics & reports']
        }
    ];

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-900">
            {/* Animated Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/20 blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/20 blur-[120px] animate-pulse delay-1000" />
                <div className="absolute top-[20%] right-[20%] w-[30%] h-[30%] rounded-full bg-cyan-500/15 blur-[100px] animate-pulse delay-2000" />
            </div>

            <div className="relative z-10 w-full max-w-4xl px-4 py-8">
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="flex items-center justify-center gap-3 mb-6">
                        <div className="bg-indigo-500/20 p-3 rounded-2xl backdrop-blur-md">
                            <GraduationCap className="h-8 w-8 text-indigo-400" />
                        </div>
                    </div>

                    {userAvatar && (
                        <div className="mb-5">
                            <img
                                src={userAvatar}
                                alt="Profile"
                                className="w-20 h-20 rounded-full mx-auto ring-4 ring-indigo-500/30 shadow-xl"
                            />
                        </div>
                    )}

                    <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
                        Welcome{userName ? `, ${userName}` : ''}! <span className="inline-block animate-bounce">👋</span>
                    </h1>
                    <p className="text-slate-400 text-lg max-w-md mx-auto">
                        How would you like to use TutorApp?
                    </p>
                </div>

                {/* Role Cards */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                    {roles.map((role) => {
                        const Icon = role.icon;
                        const isSelected = selectedRole === role.id;
                        return (
                            <button
                                key={role.id}
                                onClick={() => setSelectedRole(role.id)}
                                className={`relative text-left p-6 rounded-2xl border-2 transition-all duration-300 group
                                    ${isSelected
                                        ? `border-white/30 bg-white/10 ${role.shadowColor} shadow-2xl scale-[1.02]`
                                        : `border-slate-700/50 bg-slate-800/30 hover:bg-slate-800/50 ${role.borderHover}`
                                    }`}
                            >
                                {/* Selection indicator */}
                                {isSelected && (
                                    <div className="absolute top-4 right-4">
                                        <div className={`w-6 h-6 rounded-full bg-gradient-to-r ${role.gradient} flex items-center justify-center`}>
                                            <Sparkles className="w-3.5 h-3.5 text-white" />
                                        </div>
                                    </div>
                                )}

                                {/* Icon */}
                                <div className={`w-14 h-14 rounded-2xl ${role.bgGlow} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                                    <Icon className={`w-7 h-7 ${isSelected ? 'text-white' : 'text-slate-400'} transition-colors`} />
                                </div>

                                {/* Title */}
                                <h3 className="text-xl font-bold text-white mb-1">{role.title}</h3>
                                <p className={`text-sm font-medium bg-gradient-to-r ${role.gradient} bg-clip-text text-transparent mb-3`}>
                                    {role.subtitle}
                                </p>
                                <p className="text-slate-400 text-sm mb-5 leading-relaxed">{role.description}</p>

                                {/* Features */}
                                <ul className="space-y-2">
                                    {role.features.map((feature, idx) => (
                                        <li key={idx} className="flex items-center gap-2 text-sm text-slate-400">
                                            <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${role.gradient}`} />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </button>
                        );
                    })}
                </div>

                {/* Continue Button */}
                <div className="text-center">
                    <button
                        onClick={handleRoleSelect}
                        disabled={!selectedRole || isLoading}
                        className={`inline-flex items-center gap-2 px-10 py-4 rounded-2xl text-lg font-bold transition-all duration-300
                            ${selectedRole
                                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/30 hover:scale-[1.03] active:scale-[0.98]'
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            }`}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Setting up your account...
                            </>
                        ) : (
                            <>
                                Continue
                                <ArrowRight className="w-5 h-5" />
                            </>
                        )}
                    </button>

                    {!selectedRole && (
                        <p className="text-slate-600 text-sm mt-4">
                            Please select a role to continue
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
