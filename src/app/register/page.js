'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GraduationCap, Loader2, Mail, Lock, User, Phone, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import api from '@/lib/axios';
import Cookies from 'js-cookie';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export default function RegisterPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        role: 'student', // Default role
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleRoleSelect = (role) => {
        setFormData({ ...formData, role });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const { confirmPassword, ...payload } = formData;
            const response = await api.post('/auth/register', payload);
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
            console.error('Registration error:', err);
            setError(
                err.response?.data?.message || 'Registration failed. Please try again.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-900">
            {/* Animated Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/30 blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-teal-600/30 blur-[120px] animate-pulse delay-1000" />
                <div className="absolute top-[20%] left-[20%] w-[30%] h-[30%] rounded-full bg-indigo-500/20 blur-[100px] animate-pulse delay-2000" />
            </div>

            <div className="relative z-10 w-full max-w-6xl p-4 lg:p-6">
                <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden grid lg:grid-cols-5 min-h-[600px]">

                    {/* Left: Brand/Context Section (Smaller 2 cols) */}
                    <div className="relative hidden lg:flex lg:col-span-2 flex-col justify-between p-10 bg-gradient-to-br from-slate-900/90 to-indigo-900/90 text-white">
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay opacity-30"></div>

                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="bg-white/10 p-2 rounded-lg backdrop-blur-md border border-white/10">
                                    <GraduationCap className="h-6 w-6 text-indigo-300" />
                                </div>
                                <span className="text-xl font-bold tracking-wide">TutorApp</span>
                            </div>

                            <h2 className="text-3xl font-bold leading-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 to-teal-200">
                                Start your learning journey today.
                            </h2>
                            <p className="text-slate-300 text-sm leading-relaxed">
                                Join thousands of students and expert tutors in a community dedicated to academic excellence.
                            </p>
                        </div>

                        <div className="relative z-10">
                            <div className="grid grid-cols-2 gap-3 mt-8">
                                <div className="bg-white/5 backdrop-blur-sm p-3 rounded-xl border border-white/10">
                                    <div className="text-2xl font-bold text-teal-400">10k+</div>
                                    <div className="text-xs text-slate-400">Active Students</div>
                                </div>
                                <div className="bg-white/5 backdrop-blur-sm p-3 rounded-xl border border-white/10">
                                    <div className="text-2xl font-bold text-purple-400">500+</div>
                                    <div className="text-xs text-slate-400">Expert Tutors</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Form Section (Larger 3 cols) */}
                    <div className="lg:col-span-3 p-6 lg:p-10 bg-white/80 lg:bg-white/60 backdrop-blur-xl flex flex-col justify-center">
                        <div className="max-w-lg mx-auto w-full">
                            <div className="text-center mb-6">
                                <h1 className="text-2xl font-bold text-slate-800">Create Account</h1>
                                <p className="text-slate-500 text-sm">Join our community of learners and educators.</p>
                            </div>

                            {error && (
                                <div className="mb-6 flex items-center gap-3 rounded-xl bg-red-50 p-4 text-sm font-medium text-red-600 border border-red-100 animate-in fade-in slide-in-from-top-2">
                                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                    <p>{error}</p>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-5">
                                {/* Role Selection */}
                                <div className="space-y-3">
                                    <Label className="text-sm font-semibold text-slate-700">I want to...</Label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div
                                            onClick={() => handleRoleSelect('student')}
                                            className={cn(
                                                "cursor-pointer relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 p-4 transition-all hover:scale-[1.02] duration-200",
                                                formData.role === 'student'
                                                    ? "border-indigo-500 bg-indigo-50/80 shadow-md ring-1 ring-indigo-500/20"
                                                    : "border-white/50 bg-white/40 hover:bg-white/80 hover:border-indigo-200"
                                            )}
                                        >
                                            <div className={cn("p-2 rounded-full transition-colors", formData.role === 'student' ? "bg-indigo-100" : "bg-white/50")}>
                                                <GraduationCap className={cn("h-5 w-5", formData.role === 'student' ? "text-indigo-600" : "text-slate-500")} />
                                            </div>
                                            <span className={cn("font-bold text-sm", formData.role === 'student' ? "text-indigo-900" : "text-slate-600")}>Student</span>
                                            {formData.role === 'student' && <div className="absolute top-2 right-2 text-indigo-600"><CheckCircle className="h-4 w-4 fill-indigo-100" /></div>}
                                        </div>

                                        <div
                                            onClick={() => handleRoleSelect('tutor')}
                                            className={cn(
                                                "cursor-pointer relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 p-4 transition-all hover:scale-[1.02] duration-200",
                                                formData.role === 'tutor'
                                                    ? "border-purple-500 bg-purple-50/80 shadow-md ring-1 ring-purple-500/20"
                                                    : "border-white/50 bg-white/40 hover:bg-white/80 hover:border-purple-200"
                                            )}
                                        >
                                            <div className={cn("p-2 rounded-full transition-colors", formData.role === 'tutor' ? "bg-purple-100" : "bg-white/50")}>
                                                <User className={cn("h-5 w-5", formData.role === 'tutor' ? "text-purple-600" : "text-slate-500")} />
                                            </div>
                                            <span className={cn("font-bold text-sm", formData.role === 'tutor' ? "text-purple-900" : "text-slate-600")}>Tutor</span>
                                            {formData.role === 'tutor' && <div className="absolute top-2 right-2 text-purple-600"><CheckCircle className="h-4 w-4 fill-purple-100" /></div>}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <Label htmlFor="name" className="text-xs font-medium text-slate-600 ml-1">Full Name</Label>
                                            <div className="relative group">
                                                <User className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                                                <Input id="name" name="name" placeholder="John Doe" required className="pl-9 h-10 text-sm bg-white/50 border-slate-200 focus:bg-white rounded-lg" value={formData.name} onChange={handleChange} />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor="phone" className="text-xs font-medium text-slate-600 ml-1">Phone</Label>
                                            <div className="relative group">
                                                <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                                                <Input id="phone" name="phone" placeholder="+1 234..." type="tel" required className="pl-9 h-10 text-sm bg-white/50 border-slate-200 focus:bg-white rounded-lg" value={formData.phone} onChange={handleChange} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <Label htmlFor="email" className="text-xs font-medium text-slate-600 ml-1">Email</Label>
                                        <div className="relative group">
                                            <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                                            <Input id="email" name="email" placeholder="name@example.com" type="email" required className="pl-9 h-10 text-sm bg-white/50 border-slate-200 focus:bg-white rounded-lg" value={formData.email} onChange={handleChange} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <Label htmlFor="password" className="text-xs font-medium text-slate-600 ml-1">Password</Label>
                                            <div className="relative group">
                                                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                                                <Input id="password" name="password" placeholder="••••••••" type="password" required className="pl-9 h-10 text-sm bg-white/50 border-slate-200 focus:bg-white rounded-lg" value={formData.password} onChange={handleChange} />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor="confirmPassword" className="text-xs font-medium text-slate-600 ml-1">Confirm</Label>
                                            <div className="relative group">
                                                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                                                <Input id="confirmPassword" name="confirmPassword" placeholder="••••••••" type="password" required className="pl-9 h-10 text-sm bg-white/50 border-slate-200 focus:bg-white rounded-lg" value={formData.confirmPassword} onChange={handleChange} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-11 text-base font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-200 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] mt-2"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            Create Account
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </>
                                    )}
                                </Button>
                            </form>

                            <p className="text-center text-sm text-slate-600 mt-6">
                                Already have an account?{' '}
                                <a href="/login" className="font-bold text-indigo-600 hover:text-indigo-500 hover:underline transition-all">
                                    Sign in
                                </a>
                            </p>

                            <div className="mt-8 text-center">
                                <span className="text-xs text-slate-400">
                                    By registering, you agree to our <a href="#" className="underline hover:text-indigo-500">Terms</a> and <a href="#" className="underline hover:text-indigo-500">Privacy Policy</a>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
