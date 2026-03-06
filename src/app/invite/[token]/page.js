'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import {
    GraduationCap, Mail, User, Lock, CheckCircle, AlertCircle,
    Loader2, Shield, ArrowRight, Building2
} from 'lucide-react';

function Logo() {
    return (
        <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-900/40">
                <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Sapience<span className="text-violet-400">LMS</span></span>
        </div>
    );
}

function PageShell({ children }) {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
            style={{ background: '#080b14', fontFamily: "'DM Sans', sans-serif" }}>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-900/15 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute inset-0 opacity-[0.025] pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
            <div className="relative z-10 w-full max-w-md">
                <div className="flex justify-center mb-8"><Logo /></div>
                {children}
            </div>
        </div>
    );
}

export default function InvitePage() {
    const router = useRouter();
    const params = useParams();
    const token = params.token || '';

    const [inviteData, setInviteData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [user, setUser] = useState(null);
    const [userExists, setUserExists] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (token) {
            fetchInviteData().then(data => { if (data) checkAuthStatus(data); });
        } else { setError('Invalid invite link'); setLoading(false); }
    }, [token]);

    useEffect(() => {
        if (user && inviteData && user.email.toLowerCase() === inviteData.email.toLowerCase()) {
            const timer = setTimeout(() => acceptInvite(), 1000);
            return () => clearTimeout(timer);
        }
    }, [user, inviteData]);

    useEffect(() => {
        if (inviteData?.email) checkIfUserExists(inviteData.email).then(setUserExists);
    }, [inviteData?.email]);

    const fetchInviteData = async () => {
        try {
            const res = await api.get(`/invite/${token}`);
            if (res.data?.success) { setInviteData(res.data.data); return res.data.data; }
        } catch (err) { setError(err.response?.data?.message || 'Invalid or expired invite link'); }
        finally { setLoading(false); }
    };

    const checkAuthStatus = async (passedData = null) => {
        try {
            const tkn = localStorage.getItem('token');
            if (!tkn) return;
            const res = await api.get('/auth/me');
            if (res.data?.success) {
                const loggedInUser = res.data.user || res.data.data;
                if (!loggedInUser) return;
                const inv = passedData || inviteData;
                if (inv && loggedInUser.email.toLowerCase() === inv.email.toLowerCase()) setUser(loggedInUser);
            }
        } catch { localStorage.removeItem('token'); localStorage.removeItem('user'); }
    };

    const checkIfUserExists = async (email) => {
        try { const res = await api.post('/auth/check-user-exists', { email }); return res.data?.exists || false; }
        catch { return false; }
    };

    const acceptInvite = async () => {
        setIsSubmitting(true);
        try {
            const res = await api.post('/invite/accept', { token });
            if (res.data?.success) {
                toast.success('Invite accepted!');
                setTimeout(() => router.push(inviteData.role === 'tutor' ? '/tutor/dashboard' : '/student/dashboard'), 2000);
            } else toast.error(res.data?.message || 'Failed to accept invite');
        } catch (err) { toast.error(err.response?.data?.message || 'Failed to accept invite'); }
        finally { setIsSubmitting(false); }
    };

    // Loading
    if (loading) return (
        <PageShell>
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-10 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-violet-400 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">Loading invite…</p>
            </div>
        </PageShell>
    );

    // Error
    if (error) return (
        <PageShell>
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-10 text-center">
                <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                    <AlertCircle className="w-8 h-8 text-red-400" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Invalid Invite</h2>
                <p className="text-slate-500 text-sm mb-6">{error}</p>
                <button onClick={() => router.push('/login')}
                    className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-all">
                    Go to Login
                </button>
            </div>
        </PageShell>
    );

    // Logged in — correct user
    if (user && user.email.toLowerCase() === inviteData.email.toLowerCase()) return (
        <PageShell>
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl">
                <div className="h-1 w-full bg-gradient-to-r from-violet-600 to-indigo-600" />
                <div className="p-8 text-center">
                    {inviteData.institute?.logo && (
                        <img src={inviteData.institute.logo} alt="" className="w-16 h-16 mx-auto mb-4 rounded-xl object-contain" />
                    )}
                    <h2 className="text-xl font-bold text-white mb-1">Welcome to {inviteData.institute?.name}</h2>
                    <p className="text-slate-400 text-sm mb-6">
                        You've been invited as a <span className="capitalize text-violet-400 font-semibold">{inviteData.role}</span>
                    </p>
                    <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-4 mb-6 flex items-center gap-3 text-left">
                        <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                        <div>
                            <p className="text-emerald-300 text-sm font-semibold">Email Verified</p>
                            <p className="text-slate-500 text-xs">This invite is for your account</p>
                        </div>
                    </div>
                    <div className="w-full py-3 rounded-xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center gap-2 text-emerald-400 text-sm font-semibold">
                        {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Accepting…</> : '✓ Accepting invitation…'}
                    </div>
                </div>
            </div>
        </PageShell>
    );

    // Logged in — wrong user
    if (user) return (
        <PageShell>
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                    <AlertCircle className="w-8 h-8 text-amber-400" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Account Mismatch</h2>
                <p className="text-slate-400 text-sm mb-2">
                    This invite is for <span className="text-white font-semibold">{inviteData.email}</span>
                </p>
                <p className="text-slate-500 text-xs mb-6">You're signed in as <span className="text-slate-300">{user.email}</span></p>
                <div className="space-y-3">
                    <button onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); window.location.reload(); }}
                        className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-all">
                        Logout & Continue
                    </button>
                    <button onClick={() => router.push('/dashboard')}
                        className="w-full py-2.5 bg-white/[0.04] border border-white/[0.08] text-slate-400 text-sm font-semibold rounded-xl hover:bg-white/[0.07] transition-all">
                        Go to Dashboard
                    </button>
                </div>
            </div>
        </PageShell>
    );

    // Not logged in
    return (
        <PageShell>
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl">
                <div className="h-1 w-full bg-gradient-to-r from-violet-600 to-indigo-600" />
                <div className="p-8">
                    {/* Institute header */}
                    <div className="text-center mb-6">
                        {inviteData.institute?.logo
                            ? <img src={inviteData.institute.logo} alt="" className="w-16 h-16 mx-auto mb-4 rounded-xl object-contain" />
                            : <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center"><Building2 className="w-7 h-7 text-violet-400" /></div>
                        }
                        <h2 className="text-xl font-bold text-white mb-1">Join {inviteData.institute?.name}</h2>
                        <p className="text-slate-400 text-sm">
                            Invited as <span className="capitalize text-violet-400 font-semibold">{inviteData.role}</span>
                        </p>
                    </div>

                    {/* Status info */}
                    <div className="bg-blue-500/5 border border-blue-500/15 rounded-xl p-4 mb-6 flex items-start gap-3">
                        <CheckCircle className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-blue-300 text-sm font-semibold">Invite Ready</p>
                            <p className="text-slate-500 text-xs mt-0.5">
                                {userExists
                                    ? `Account found for ${inviteData.email}. Please log in to accept.`
                                    : `No account found for ${inviteData.email}. Create one to join.`}
                            </p>
                        </div>
                    </div>

                    {userExists ? (
                        <div className="space-y-4">
                            <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-4 flex items-start gap-3">
                                <Shield className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-amber-300 text-sm font-semibold">Security Notice</p>
                                    <p className="text-slate-500 text-xs mt-0.5">Log in with your account to verify and accept this invite.</p>
                                </div>
                            </div>
                            <button onClick={() => router.push(`/login?redirect=/invite/${token}&email=${encodeURIComponent(inviteData.email)}&locked=true`)}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold rounded-xl transition-all">
                                <Lock className="w-4 h-4" /> Login to Accept
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-4 flex items-start gap-3">
                                <User className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-emerald-300 text-sm font-semibold">Create Account</p>
                                    <p className="text-slate-500 text-xs mt-0.5">Click below to create your account and join the institute.</p>
                                </div>
                            </div>
                            <button onClick={() => router.push(`/register?invite=${token}&email=${encodeURIComponent(inviteData.email)}&name=${encodeURIComponent(inviteData.name)}&role=${inviteData.role}&otpRequired=true`)}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold rounded-xl transition-all">
                                <ArrowRight className="w-4 h-4" /> Create Account & Join
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </PageShell>
    );
}