'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { GraduationCap, Loader2, ArrowLeft, CheckCircle, AlertCircle, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';

export default function ResetPasswordPage({ params }) {
    const router = useRouter();
    const { token } = use(params);

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [showPwd, setShowPwd] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) { setError('Passwords do not match'); return; }
        if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
        setIsLoading(true); setError('');
        try {
            await api.post(`/auth/reset-password/${token}`, { password });
            setSuccess(true);
            setTimeout(() => router.push('/login'), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reset password. Link may be expired.');
        } finally { setIsLoading(false); }
    };

    // password strength
    const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
    const strengthConfig = [
        { label: '', color: '' },
        { label: 'Weak', color: 'bg-red-500' },
        { label: 'Fair', color: 'bg-amber-400' },
        { label: 'Strong', color: 'bg-emerald-500' },
    ];

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
            style={{ background: '#080b14', fontFamily: "'DM Sans', sans-serif" }}>

            {/* Glows */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-900/15 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute inset-0 opacity-[0.025] pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

            <div className="relative z-10 w-full max-w-sm">

                {/* Logo */}
                <div className="flex justify-center mb-10">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-900/40">
                            <GraduationCap className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-white tracking-tight">
                            Sapience<span className="text-violet-400">LMS</span>
                        </span>
                    </div>
                </div>

                <div className="bg-white/[0.03] border border-white/[0.08] rounded-3xl overflow-hidden shadow-2xl shadow-black/60">
                    <div className="h-1 w-full bg-gradient-to-r from-violet-600 to-indigo-600" />

                    <div className="px-8 py-10">
                        {/* Header */}
                        <div className="text-center mb-8">
                            <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center">
                                <Lock className="w-7 h-7 text-violet-400" />
                            </div>
                            <h1 className="text-2xl font-bold text-white mb-1">Set New Password</h1>
                            <p className="text-slate-500 text-sm">Enter your new password below.</p>
                        </div>

                        {success ? (
                            <div className="text-center">
                                <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center">
                                    <CheckCircle className="w-8 h-8 text-emerald-400" />
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">Password Updated!</h3>
                                <p className="text-slate-500 text-sm mb-6">
                                    Your password has been successfully reset. Redirecting to login…
                                </p>
                                {/* Progress bar */}
                                <div className="h-1 w-full bg-white/[0.06] rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 rounded-full animate-[shrink_3s_linear_forwards]"
                                        style={{ width: '100%', animation: 'width 3s linear forwards' }} />
                                </div>
                                <p className="text-slate-600 text-xs mt-2">Redirecting in 3 seconds…</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Error */}
                                {error && (
                                    <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-in fade-in slide-in-from-top-2">
                                        <AlertCircle className="w-4 h-4 shrink-0" />
                                        <p>{error}</p>
                                    </div>
                                )}

                                {/* New password */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-400">New Password</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-violet-400 transition-colors" />
                                        <input
                                            type={showPwd ? 'text' : 'password'}
                                            placeholder="••••••••" required
                                            value={password}
                                            onChange={e => { setPassword(e.target.value); setError(''); }}
                                            className="w-full h-11 pl-10 pr-10 bg-white/[0.04] border border-white/[0.09] rounded-xl text-sm text-white placeholder:text-slate-700 focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/10 transition-all"
                                        />
                                        <button type="button" onClick={() => setShowPwd(v => !v)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-300 transition-colors">
                                            {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    {/* Strength indicator */}
                                    {password.length > 0 && (
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <div className="flex gap-1 flex-1">
                                                {[1, 2, 3].map(i => (
                                                    <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= strength ? strengthConfig[strength].color : 'bg-white/[0.07]'}`} />
                                                ))}
                                            </div>
                                            <span className={`text-xs font-medium ${strength === 1 ? 'text-red-400' : strength === 2 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                                {strengthConfig[strength].label}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Confirm password */}
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-slate-400">Confirm Password</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-violet-400 transition-colors" />
                                        <input
                                            type={showConfirm ? 'text' : 'password'}
                                            placeholder="••••••••" required
                                            value={confirmPassword}
                                            onChange={e => { setConfirmPassword(e.target.value); setError(''); }}
                                            className={`w-full h-11 pl-10 pr-10 bg-white/[0.04] border rounded-xl text-sm text-white placeholder:text-slate-700 focus:outline-none focus:ring-1 transition-all
                                                ${confirmPassword.length > 0
                                                    ? confirmPassword === password
                                                        ? 'border-emerald-500/40 focus:border-emerald-500/60 focus:ring-emerald-500/10'
                                                        : 'border-red-500/40 focus:border-red-500/60 focus:ring-red-500/10'
                                                    : 'border-white/[0.09] focus:border-violet-500/60 focus:ring-violet-500/10'}`}
                                        />
                                        <button type="button" onClick={() => setShowConfirm(v => !v)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-300 transition-colors">
                                            {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                        {/* Match indicator */}
                                        {confirmPassword.length > 0 && (
                                            <div className="absolute right-9 top-1/2 -translate-y-1/2">
                                                {confirmPassword === password
                                                    ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                                                    : <AlertCircle className="w-3.5 h-3.5 text-red-400" />}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <button type="submit" disabled={isLoading}
                                    className="w-full h-11 flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-violet-900/30 disabled:opacity-60 mt-2">
                                    {isLoading
                                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Updating…</>
                                        : <>Set New Password <ArrowRight className="w-4 h-4" /></>}
                                </button>
                            </form>
                        )}
                    </div>
                </div>

                {/* Back link */}
                {!success && (
                    <div className="text-center mt-6">
                        <Link href="/login"
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-300 transition-colors">
                            <ArrowLeft className="w-4 h-4" />
                            Back to sign in
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}