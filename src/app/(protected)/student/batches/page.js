'use client';

import { useState, useEffect } from 'react';
import {
    BookOpen, Calendar, Clock, CheckCircle2, XCircle, AlertCircle,
    Globe, Building2, Search, Users, Plus, Loader2, LogIn
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '@/lib/axios';
import { C, T, S, pageStyle } from '@/constants/studentTokens';

export default function StudentBatchesPage() {
    const [myBatches, setMyBatches]               = useState([]);
    const [availableBatches, setAvailableBatches] = useState([]);
    const [loading, setLoading]                   = useState(true);
    const [loadingAvail, setLoadingAvail]         = useState(false);
    const [joiningId, setJoiningId]               = useState(null);
    const [activeTab, setActiveTab]               = useState('my');    // 'my' | 'discover'
    const [discoverSearch, setDiscoverSearch]     = useState('');

    useEffect(() => { fetchMyBatches(); }, []);
    useEffect(() => { if (activeTab === 'discover') fetchAvailableBatches(); }, [activeTab]);

    const fetchMyBatches = async () => {
        setLoading(true);
        try {
            const res = await api.get('/batches/my');
            if (res.data.success) {
                const batchesWithStats = await Promise.all(res.data.batches.map(async (batch) => {
                    try {
                        const attRes = await api.get(`/attendance/batch/${batch._id}`);
                        if (attRes.data.success) {
                            const records    = attRes.data.records;
                            const present    = records.filter(r => r.status === 'present').length;
                            const total      = records.length;
                            const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
                            return { ...batch, attendanceStats: { present, total, percentage }, recentLogs: records.slice(0, 5) };
                        }
                    } catch { return { ...batch, attendanceStats: null, recentLogs: [] }; }
                    return { ...batch, attendanceStats: null, recentLogs: [] };
                }));
                setMyBatches(batchesWithStats);
            }
        } catch (err) {
            console.error(err);
            toast.error('Failed to load your enrolled batches');
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailableBatches = async () => {
        setLoadingAvail(true);
        try {
            const res = await api.get('/batches/available');
            if (res.data.success) setAvailableBatches(res.data.batches || []);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load available batches');
        } finally {
            setLoadingAvail(false);
        }
    };

    const handleJoin = async (batchId) => {
        setJoiningId(batchId);
        try {
            const res = await api.post(`/batches/${batchId}/join`);
            if (res.data.success) {
                toast.success('Successfully joined the batch!');
                // Move batch from available to my batches
                const joined = availableBatches.find(b => b._id === batchId);
                if (joined) {
                    setMyBatches(prev => [{ ...joined, attendanceStats: null, recentLogs: [] }, ...prev]);
                    setAvailableBatches(prev => prev.filter(b => b._id !== batchId));
                }
                setActiveTab('my');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to join batch');
        } finally {
            setJoiningId(null);
        }
    };

    const getStatusIcon = (status) => {
        if (status === 'present') return <CheckCircle2 className="w-4 h-4" style={{ color: C.success }} />;
        if (status === 'absent')  return <XCircle      className="w-4 h-4" style={{ color: C.danger }} />;
        if (status === 'late')    return <AlertCircle  className="w-4 h-4" style={{ color: C.warning }} />;
        return null;
    };

    const getAttColor = (pct) => {
        if (pct >= 75) return C.success;
        if (pct >= 50) return C.warning;
        return C.danger;
    };

    const filteredAvailable = availableBatches.filter(b => {
        const q = discoverSearch.toLowerCase();
        return !q || b.name?.toLowerCase().includes(q) || b.courseId?.title?.toLowerCase().includes(q);
    });

    if (loading) return (
        <div className="flex items-center justify-center min-h-[50vh]">
            <div className="flex flex-col items-center gap-3">
                <div className="w-11 h-11 rounded-full border-[3px] animate-spin"
                    style={{ borderColor: `${C.btnPrimary}30`, borderTopColor: C.btnPrimary }} />
                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.text, opacity: 0.55 }}>Loading batches…</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-5 pb-8" style={pageStyle}>

            {/* ── Header ─────────────────────────────────────────────── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.black, color: C.heading }}>
                        Batches
                    </h1>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.text, opacity: 0.55, marginTop: 2 }}>
                        Track your enrolled cohorts or join new ones.
                    </p>
                </div>

                {/* Tab switcher */}
                <div className="flex p-1 rounded-2xl self-start"
                    style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}` }}>
                    {[
                        { key: 'my',       label: 'My Batches',      Icon: BookOpen },
                        { key: 'discover', label: 'Discover Batches', Icon: Globe },
                    ].map(({ key, label, Icon }) => (
                        <button key={key} onClick={() => setActiveTab(key)}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm transition-all"
                            style={activeTab === key
                                ? { backgroundColor: C.btnPrimary, color: '#ffffff', fontFamily: T.fontFamily, fontWeight: T.weight.bold }
                                : { color: C.text, opacity: 0.7, fontFamily: T.fontFamily, fontWeight: T.weight.semibold }}>
                            <Icon className="w-4 h-4" /> {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ══ MY BATCHES TAB ══════════════════════════════════════════ */}
            {activeTab === 'my' && (
                myBatches.length === 0 ? (
                    <div className="rounded-2xl p-16 text-center"
                        style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                            style={{ backgroundColor: C.innerBg }}>
                            <BookOpen className="w-8 h-8" style={{ color: C.cardBorder }} />
                        </div>
                        <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading }}>
                            No Batches Yet
                        </h3>
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.textMuted, marginTop: 8, maxWidth: 380, margin: '8px auto 0' }}>
                            You haven't joined any batches. Explore available batches or wait for your instructor to add you.
                        </p>
                        <button onClick={() => setActiveTab('discover')}
                            className="mt-6 px-6 py-3 rounded-xl text-white text-sm font-bold border-none cursor-pointer hover:opacity-90 transition-opacity"
                            style={{ background: C.gradientBtn }}>
                            Discover Batches
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        {myBatches.map(batch => {
                            const pct      = batch.attendanceStats?.percentage || 0;
                            const attColor = getAttColor(pct);

                            return (
                                <div key={batch._id} className="rounded-2xl overflow-hidden flex flex-col transition-all hover:shadow-lg"
                                    style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>

                                    {/* Header */}
                                    <div className="p-5 flex items-start gap-4" style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                                        <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
                                            style={{ backgroundColor: `${C.btnPrimary}15`, border: `1px solid ${C.btnPrimary}25` }}>
                                            <BookOpen className="w-7 h-7" style={{ color: C.btnPrimary }} />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <h2 className="line-clamp-1"
                                                    style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading }}>
                                                    {batch.name}
                                                </h2>
                                                <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider shrink-0"
                                                    style={batch.status === 'active'
                                                        ? { backgroundColor: C.successBg, color: C.success, fontFamily: T.fontFamily }
                                                        : { backgroundColor: `${C.btnPrimary}15`, color: C.btnPrimary, fontFamily: T.fontFamily }}>
                                                    {batch.status}
                                                </span>
                                            </div>
                                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.textMuted, marginTop: 2 }}>
                                                {batch.courseId?.title}
                                            </p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <img
                                                    src={batch.tutorId?.userId?.profileImage || `https://ui-avatars.com/api/?name=${batch.tutorId?.userId?.name}`}
                                                    alt="" className="w-5 h-5 rounded-full"
                                                />
                                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.text, fontWeight: T.weight.medium }}>
                                                    {batch.tutorId?.userId?.name}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Date + Schedule */}
                                    <div className="grid grid-cols-2 divide-x"
                                        style={{ borderBottom: `1px solid ${C.cardBorder}`, backgroundColor: C.innerBg }}>
                                        {[
                                            { icon: Calendar, label: 'Start Date', value: new Date(batch.startDate).toLocaleDateString() },
                                            { icon: Clock, label: 'Schedule', value: batch.scheduleDescription || 'Flexible' },
                                        ].map(({ icon: Icon, label, value }) => (
                                            <div key={label} className="p-4 flex flex-col gap-1" style={{ borderColor: C.cardBorder }}>
                                                <div className="flex items-center gap-1.5"
                                                    style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase' }}>
                                                    <Icon className="w-3.5 h-3.5" /> {label}
                                                </div>
                                                <span className="truncate"
                                                    style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.semibold, color: C.heading }}>
                                                    {value}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Attendance */}
                                    <div className="p-5 flex-1">
                                        <div className="flex items-end justify-between mb-3">
                                            <div>
                                                <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading }}>
                                                    Your Attendance
                                                </h3>
                                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted, marginTop: 2 }}>
                                                    Overall presence rate
                                                </p>
                                            </div>
                                            <span style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.black, color: attColor }}>
                                                {pct}%
                                            </span>
                                        </div>

                                        <div className="w-full h-2 rounded-full overflow-hidden mb-5" style={{ backgroundColor: C.innerBg }}>
                                            <div className="h-full rounded-full transition-all duration-700"
                                                style={{ width: `${pct}%`, backgroundColor: attColor }} />
                                        </div>

                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                                            Recent Logs
                                        </p>
                                        <div className="space-y-2.5">
                                            {batch.recentLogs?.length > 0 ? batch.recentLogs.map(log => (
                                                <div key={log._id} className="flex items-center justify-between p-3 rounded-xl"
                                                    style={{ backgroundColor: C.innerBg, border: `1px solid ${C.cardBorder}` }}>
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-1.5 rounded-lg"
                                                            style={{
                                                                backgroundColor: log.status === 'present' ? C.successBg :
                                                                                 log.status === 'absent'  ? C.dangerBg  : C.warningBg,
                                                            }}>
                                                            {getStatusIcon(log.status)}
                                                        </div>
                                                        <div>
                                                            <span className="block capitalize"
                                                                style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.semibold, color: C.heading }}>
                                                                {log.status}
                                                            </span>
                                                            <span className="block"
                                                                style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>
                                                                {new Date(log.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {log.remarks && (
                                                        <span className="truncate max-w-[140px] italic"
                                                            style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}
                                                            title={log.remarks}>
                                                            "{log.remarks}"
                                                        </span>
                                                    )}
                                                </div>
                                            )) : (
                                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.textMuted, fontStyle: 'italic' }}>
                                                    No attendance records yet.
                                                </p>
                                            )}
                                        </div>


                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )
            )}

            {/* ══ DISCOVER BATCHES TAB ════════════════════════════════════ */}
            {activeTab === 'discover' && (
                <div className="space-y-5">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: C.text, opacity: 0.4 }} />
                        <input
                            type="text"
                            placeholder="Search batches by name or course…"
                            value={discoverSearch}
                            onChange={e => setDiscoverSearch(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 rounded-xl focus:outline-none transition-all"
                            style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, color: C.heading, fontSize: T.size.sm, fontFamily: T.fontFamily, boxShadow: S.card }}
                            onFocus={e => { e.currentTarget.style.borderColor = C.btnPrimary; e.currentTarget.style.boxShadow = `0 0 0 3px ${C.btnPrimary}15`; }}
                            onBlur={e => { e.currentTarget.style.borderColor = C.cardBorder; e.currentTarget.style.boxShadow = S.card; }}
                        />
                    </div>

                    {loadingAvail ? (
                        <div className="flex justify-center py-20">
                            <div className="w-10 h-10 rounded-full border-[3px] animate-spin"
                                style={{ borderColor: `${C.btnPrimary}30`, borderTopColor: C.btnPrimary }} />
                        </div>
                    ) : filteredAvailable.length === 0 ? (
                        <div className="rounded-2xl p-16 text-center"
                            style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                            <Globe className="w-12 h-12 mx-auto mb-4" style={{ color: C.cardBorder }} />
                            <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading }}>
                                {discoverSearch ? 'No batches match your search' : 'No Available Batches'}
                            </h3>
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.textMuted, marginTop: 8 }}>
                                {discoverSearch ? 'Try a different search term.' : 'Check back later — new batches are added regularly.'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                            {filteredAvailable.map(batch => (
                                <div key={batch._id} className="rounded-2xl overflow-hidden flex flex-col transition-all hover:shadow-lg"
                                    style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>

                                    {/* Header */}
                                    <div className="p-5 flex items-start gap-4" style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                                        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                                            style={{ backgroundColor: `${C.btnPrimary}15` }}>
                                            <BookOpen className="w-6 h-6" style={{ color: C.btnPrimary }} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <h2 className="line-clamp-1"
                                                    style={{ fontFamily: T.fontFamily, fontSize: T.size.md, fontWeight: T.weight.bold, color: C.heading }}>
                                                    {batch.name}
                                                </h2>
                                                {/* Institute vs Global badge */}
                                                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full shrink-0 text-[10px] font-bold"
                                                    style={batch.instituteId
                                                        ? { backgroundColor: `${C.btnPrimary}10`, color: C.btnPrimary }
                                                        : { backgroundColor: '#EFF6FF', color: '#2563EB' }}>
                                                    {batch.instituteId ? <Building2 className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                                                    {batch.instituteId ? 'Institute' : 'Global'}
                                                </span>
                                            </div>
                                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.textMuted, marginTop: 2 }}>
                                                {batch.courseId?.title || 'Course'}
                                            </p>
                                            <div className="flex items-center gap-4 mt-2">
                                                <span className="flex items-center gap-1" style={{ fontSize: T.size.xs, color: C.textMuted }}>
                                                    <Users className="w-3 h-3" />
                                                    {batch.students?.length || 0} students
                                                </span>
                                                {batch.grade && (
                                                    <span style={{ fontSize: T.size.xs, color: C.textMuted }}>Grade: {batch.grade}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Date + Schedule */}
                                    <div className="grid grid-cols-2 divide-x"
                                        style={{ borderBottom: `1px solid ${C.cardBorder}`, backgroundColor: C.innerBg }}>
                                        {[
                                            { icon: Calendar, label: 'Start Date', value: batch.startDate ? new Date(batch.startDate).toLocaleDateString() : '—' },
                                            { icon: Clock, label: 'Schedule', value: batch.scheduleDescription || 'Flexible' },
                                        ].map(({ icon: Icon, label, value }) => (
                                            <div key={label} className="p-4 flex flex-col gap-1">
                                                <div className="flex items-center gap-1.5"
                                                    style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase' }}>
                                                    <Icon className="w-3.5 h-3.5" /> {label}
                                                </div>
                                                <span className="truncate"
                                                    style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.semibold, color: C.heading }}>
                                                    {value}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Instructor + Join */}
                                    <div className="p-5 flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <img
                                                src={batch.tutorId?.userId?.profileImage || `https://ui-avatars.com/api/?name=${batch.tutorId?.userId?.name || 'T'}`}
                                                alt="" className="w-8 h-8 rounded-full shrink-0"
                                            />
                                            <div className="min-w-0">
                                                <p className="truncate" style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>
                                                    {batch.tutorId?.userId?.name || 'Instructor'}
                                                </p>
                                                <p style={{ fontSize: T.size.xs, color: C.textMuted }}>Instructor</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleJoin(batch._id)}
                                            disabled={joiningId === batch._id}
                                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold border-none cursor-pointer hover:opacity-90 disabled:opacity-60 transition-opacity shrink-0 shadow-md"
                                            style={{ background: C.gradientBtn, fontFamily: T.fontFamily }}>
                                            {joiningId === batch._id
                                                ? <><Loader2 className="w-4 h-4 animate-spin" /> Joining…</>
                                                : <><LogIn className="w-4 h-4" /> Join Batch</>
                                            }
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}