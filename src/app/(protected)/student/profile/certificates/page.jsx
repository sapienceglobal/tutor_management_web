'use client';

import { useState, useEffect } from 'react';
import {
    Award, Download, Share2, CheckCircle, Lock, ExternalLink,
    Search, Loader2, Calendar, BookOpen, Trophy, Star,
    Eye, Copy, QrCode, Shield
} from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';

const dg = { background: 'linear-gradient(135deg, var(--theme-sidebar), var(--theme-primary))' };
const font = { fontFamily: "var(--theme-font, 'DM Sans', sans-serif)" };

function CertCard({ cert }) {
    const [showShare, setShowShare] = useState(false);
    const issued = new Date(cert.issuedAt || cert.completedAt);

    const handleCopyLink = () => {
        const url = `${window.location.origin}/verify/${cert.credentialId || cert._id}`;
        navigator.clipboard.writeText(url);
        toast.success('Verification link copied!');
    };

    return (
        <div className="rounded-2xl border border-white/10 overflow-hidden hover:border-white/20 transition-all group"
            style={{ background: 'rgba(255,255,255,0.03)' }}>

            {/* Certificate preview */}
            <div className="relative h-44 overflow-hidden" style={dg}>
                <div className="absolute inset-0 opacity-[0.06]"
                    style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                {/* Decorative border */}
                <div className="absolute inset-3 border-2 border-white/10 rounded-xl pointer-events-none" />
                <div className="absolute inset-4 border border-white/5 rounded-lg pointer-events-none" />

                {/* Seal */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
                    <div className="w-16 h-16 bg-white/15 rounded-full flex items-center justify-center border-2 border-white/25">
                        <Trophy className="w-8 h-8 text-white/80" />
                    </div>
                    <div className="text-center">
                        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-white/50">Certificate of</p>
                        <p className="text-sm font-black text-white">Completion</p>
                    </div>
                </div>

                {/* Stars deco */}
                <Star className="absolute top-4 left-4 w-3 h-3 text-white/20 fill-white/20" />
                <Star className="absolute top-4 right-4 w-3 h-3 text-white/20 fill-white/20" />
                <Star className="absolute bottom-4 left-4 w-3 h-3 text-white/20 fill-white/20" />
                <Star className="absolute bottom-4 right-4 w-3 h-3 text-white/20 fill-white/20" />

                {/* Verified badge */}
                <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-emerald-500/30 border border-emerald-500/40 rounded-full">
                    <Shield className="w-2.5 h-2.5 text-emerald-400" />
                    <span className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.05em]">Verified</span>
                </div>
            </div>

            {/* Info */}
            <div className="p-4 space-y-3">
                <div>
                    <h3 className="font-black text-white text-sm leading-snug">{cert.courseName || cert.title}</h3>
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                        {cert.instituteName || 'Sapience LMS'} · Issued {issued.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                </div>

                {cert.credentialId && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/8 rounded-xl">
                        <QrCode className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="text-[10px] font-mono text-slate-400 truncate">{cert.credentialId}</span>
                    </div>
                )}

                <div className="flex items-center gap-2">
                    {cert.downloadUrl ? (
                        <a href={cert.downloadUrl} target="_blank" rel="noreferrer"
                            className="flex-1 py-2 rounded-xl text-xs font-black text-white flex items-center justify-center gap-1.5 hover:opacity-90 transition-all"
                            style={dg}>
                            <Download className="w-3.5 h-3.5" /> Download
                        </a>
                    ) : (
                        <button disabled className="flex-1 py-2 rounded-xl text-xs font-bold text-slate-500 bg-white/5 border border-white/8 flex items-center justify-center gap-1.5">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating…
                        </button>
                    )}
                    <button onClick={handleCopyLink}
                        className="w-9 h-9 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center justify-center transition-colors">
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                    <button onClick={() => {
                        const url = `${window.location.origin}/verify/${cert.credentialId || cert._id}`;
                        if (navigator.share) navigator.share({ title: cert.courseName, url });
                        else { navigator.clipboard.writeText(url); toast.success('Link copied!'); }
                    }}
                        className="w-9 h-9 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center justify-center transition-colors">
                        <Share2 className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                </div>
            </div>
        </div>
    );
}

function LockedCertCard({ course }) {
    const pct = course.progress || 0;
    return (
        <div className="rounded-2xl border border-white/8 overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <div className="relative h-32 flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))' }}>
                <div className="flex flex-col items-center gap-2 opacity-50">
                    <Lock className="w-8 h-8 text-slate-400" />
                    <p className="text-xs font-black text-slate-400">{pct}% complete</p>
                </div>
                {/* Progress bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, var(--theme-sidebar), var(--theme-primary))' }} />
                </div>
            </div>
            <div className="p-4">
                <h3 className="font-black text-slate-400 text-sm">{course.title}</h3>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">Complete course to earn certificate</p>
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                    <span>{pct}% done</span>
                    <span>{100 - pct}% remaining</span>
                </div>
            </div>
        </div>
    );
}

export default function CertificatesPage() {
    const [certs, setCerts]             = useState([]);
    const [inProgress, setInProgress]   = useState([]);
    const [loading, setLoading]         = useState(true);
    const [tab, setTab]                 = useState('earned');
    const [search, setSearch]           = useState('');

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [cRes, pRes] = await Promise.all([
                api.get('/certificates/student'),
                api.get('/courses/in-progress').catch(() => ({ data: { courses: [] } })),
            ]);
            if (cRes.data?.success) setCerts(cRes.data.certificates || []);
            if (pRes.data?.courses) setInProgress(pRes.data.courses.filter(c => (c.progress || 0) < 100));
        } catch (e) { toast.error('Failed to load certificates'); }
        finally { setLoading(false); }
    };

    const filtered = certs.filter(c =>
        !search || c.courseName?.toLowerCase().includes(search.toLowerCase()) ||
        c.instituteName?.toLowerCase().includes(search.toLowerCase())
    );

    const tabs = [
        { key: 'earned',      label: 'Earned',       count: certs.length },
        { key: 'in-progress', label: 'In Progress',  count: inProgress.length },
    ];

    return (
        <div className="min-h-screen" style={{ ...font, background: 'var(--theme-background)' }}>
            <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

                {/* Header */}
                <div className="rounded-2xl p-6 relative overflow-hidden" style={dg}>
                    <div className="absolute inset-0 opacity-[0.06]"
                        style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                    <div className="relative flex items-start justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Award className="w-5 h-5 text-white/70" />
                                <span className="text-[11px] font-black uppercase tracking-[0.08em] text-white/60">My Certificates</span>
                            </div>
                            <h1 className="text-2xl font-black text-white">Certificates & Achievements</h1>
                            <p className="text-white/60 text-sm font-medium mt-1">
                                {certs.length} certificate{certs.length !== 1 ? 's' : ''} earned
                            </p>
                        </div>
                        {certs.length > 0 && (
                            <div className="w-16 h-16 bg-white/15 rounded-2xl flex items-center justify-center">
                                <Trophy className="w-8 h-8 text-white/80" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 p-1 bg-white/5 border border-white/8 rounded-xl w-fit">
                    {tabs.map(t => (
                        <button key={t.key} onClick={() => setTab(t.key)}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-[0.04em] transition-all
                                ${tab === t.key ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}
                            style={tab === t.key ? dg : {}}>
                            {t.label}
                            {t.count > 0 && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${tab === t.key ? 'bg-white/20 text-white' : 'bg-white/8 text-slate-400'}`}>
                                    {t.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-7 h-7 animate-spin text-[var(--theme-primary)]/70" />
                    </div>
                ) : tab === 'earned' ? (
                    filtered.length === 0 ? (
                        <div className="text-center py-20 space-y-4">
                            <div className="w-20 h-20 rounded-2xl mx-auto flex items-center justify-center" style={dg}>
                                <Award className="w-10 h-10 text-white/70" />
                            </div>
                            <p className="font-black text-white text-lg">No certificates yet</p>
                            <p className="text-sm text-slate-400 font-medium">Complete a course to earn your first certificate!</p>
                        </div>
                    ) : (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filtered.map(c => <CertCard key={c._id} cert={c} />)}
                        </div>
                    )
                ) : (
                    inProgress.length === 0 ? (
                        <div className="text-center py-20 space-y-3">
                            <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center" style={dg}>
                                <BookOpen className="w-8 h-8 text-white/70" />
                            </div>
                            <p className="font-black text-white">No courses in progress</p>
                        </div>
                    ) : (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {inProgress.map(c => <LockedCertCard key={c._id} course={c} />)}
                        </div>
                    )
                )}
            </div>
        </div>
    );
}