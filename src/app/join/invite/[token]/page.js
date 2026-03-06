'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { GraduationCap, Mail, User, Phone, CheckCircle, AlertCircle, Loader2, Building2, ArrowRight } from 'lucide-react';
import api from '@/lib/axios';
import Cookies from 'js-cookie';

export default function InviteJoinPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [inviteData, setInviteData] = useState(null);
    const [isRegistered, setIsRegistered] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });

    useEffect(() => {
        if (!token) { setError('Invalid invite link'); return; }
        api.get(`/membership/invite/${token}`).then(res => {
            if (res.data.success) {
                setInviteData(res.data.invite);
                setFormData(p => ({ ...p, email: res.data.invite.email || '' }));
                setIsRegistered(!!res.data.invite.email);
            }
        }).catch(err => setError(err.response?.data?.message || 'Invalid or expired invite'));
    }, [token]);

    const handleChange = (e) => { setFormData(p => ({ ...p, [e.target.name]: e.target.value })); setError(''); };

    const handleSubmit = async (e) => {
        e.preventDefault(); setIsLoading(true); setError('');
        try {
            if (!isRegistered) {
                if (formData.password !== formData.confirmPassword) { setError('Passwords do not match'); return; }
                const { confirmPassword, ...data } = formData;
                const res = await api.post('/auth/register-with-invite', { ...data, inviteToken: token });
                const { token: authToken, user } = res.data;
                Cookies.set('token', authToken, { expires: 7 }); Cookies.set('user_role', user.role, { expires: 7 });
                localStorage.setItem('token', authToken); localStorage.setItem('user', JSON.stringify(user));
                router.push(user.role === 'tutor' ? '/tutor/dashboard' : '/student/dashboard');
            } else {
                const res = await api.post('/membership/accept-invite', { token });
                if (res.data.success) {
                    const m = res.data.membership;
                    router.push(m.roleInInstitute === 'tutor' ? '/tutor/dashboard' : '/student/dashboard');
                }
            }
        } catch (err) { setError(err.response?.data?.message || 'Failed to accept invite'); }
        finally { setIsLoading(false); }
    };

    const bgStyle = { background: '#080b14', fontFamily: "'DM Sans', sans-serif" };

    if (error && !inviteData) return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={bgStyle}>
            <div className="relative z-10 bg-white/[0.03] border border-white/[0.08] rounded-2xl p-10 max-w-md w-full text-center">
                <AlertCircle className="w-14 h-14 text-red-400 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">Invalid Invite</h2>
                <p className="text-slate-500 text-sm mb-6">{error}</p>
                <button onClick={() => router.push('/')} className="px-6 py-2.5 bg-violet-600 text-white text-sm font-semibold rounded-xl">Go Home</button>
            </div>
        </div>
    );

    if (!inviteData) return (
        <div className="min-h-screen flex items-center justify-center" style={bgStyle}>
            <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
        </div>
    );

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={bgStyle}>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-900/15 rounded-full blur-[120px] pointer-events-none" />
            <div className="relative z-10 w-full max-w-md">
                <div className="flex justify-center mb-8">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center"><GraduationCap className="w-5 h-5 text-white" /></div>
                        <span className="text-xl font-bold text-white">Sapience<span className="text-violet-400">LMS</span></span>
                    </div>
                </div>
                <div className="bg-white/[0.03] border border-white/[0.08] rounded-3xl overflow-hidden shadow-2xl">
                    <div className="h-1 bg-gradient-to-r from-violet-600 to-indigo-600" />
                    <div className="p-8">
                        <div className="text-center mb-6">
                            <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center"><Building2 className="w-7 h-7 text-violet-400" /></div>
                            <h1 className="text-xl font-bold text-white mb-1">You're Invited!</h1>
                            <p className="text-slate-400 text-sm">Join {inviteData.instituteId?.name} as <span className="capitalize text-violet-400 font-semibold">{inviteData.roleInInstitute}</span></p>
                        </div>
                        <div className="bg-violet-500/5 border border-violet-500/15 rounded-xl p-4 mb-6">
                            <div className="flex items-center gap-2 mb-2"><CheckCircle className="w-4 h-4 text-violet-400" /><span className="text-violet-300 text-sm font-semibold">Invite Details</span></div>
                            <div className="text-xs text-slate-500 space-y-1">
                                <p><span className="text-slate-400">Institute:</span> {inviteData.instituteId?.name}</p>
                                <p><span className="text-slate-400">Role:</span> <span className="capitalize">{inviteData.roleInInstitute}</span></p>
                                <p><span className="text-slate-400">Invited by:</span> {inviteData.invitedBy?.name}</p>
                            </div>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {!isRegistered ? (
                                <>
                                    {[{ id: 'name', label: 'Full Name', icon: User, placeholder: 'John Doe', type: 'text' },
                                      { id: 'phone', label: 'Phone', icon: Phone, placeholder: '+91 98765…', type: 'tel' },
                                      { id: 'password', label: 'Password', icon: null, placeholder: '••••••••', type: 'password' },
                                      { id: 'confirmPassword', label: 'Confirm Password', icon: null, placeholder: '••••••••', type: 'password' },
                                    ].map(f => (
                                        <div key={f.id} className="space-y-1.5">
                                            <label className="text-xs font-medium text-slate-500">{f.label}</label>
                                            <input id={f.id} name={f.id} type={f.type} placeholder={f.placeholder} required
                                                value={formData[f.id]} onChange={handleChange}
                                                className="w-full h-10 px-3.5 bg-white/[0.04] border border-white/[0.09] rounded-xl text-sm text-white placeholder:text-slate-700 focus:outline-none focus:border-violet-500/60 transition-all" />
                                        </div>
                                    ))}
                                </>
                            ) : (
                                <div className="text-center py-4">
                                    <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                                    <p className="text-white font-bold mb-1">Ready to Join!</p>
                                    <p className="text-slate-500 text-sm">Accept the invite to join {inviteData.instituteId?.name}</p>
                                </div>
                            )}
                            {error && <div className="flex items-center gap-2 px-3 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm"><AlertCircle className="w-4 h-4" />{error}</div>}
                            <button type="submit" disabled={isLoading}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-60">
                                {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Processing…</> : isRegistered ? 'Accept Invite' : <>Register & Join <ArrowRight className="w-4 h-4" /></>}
                            </button>
                        </form>
                        <p className="text-center text-xs text-slate-600 mt-5">By joining, you agree to the institute's terms and policies</p>
                    </div>
                </div>
            </div>
        </div>
    );
}