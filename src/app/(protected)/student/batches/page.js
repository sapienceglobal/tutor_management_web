'use client';

import { useState, useEffect } from 'react';
import { BookOpen, Calendar, Clock, CheckCircle2, XCircle, AlertCircle, Globe, Building2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '@/lib/axios';
import { C, T, S, R, cx, pageStyle } from '@/constants/studentTokens';

export default function StudentBatchesPage() {
    const [batches, setBatches]         = useState([]);
    const [loading, setLoading]         = useState(true);
    const [filterScope, setFilterScope] = useState('all');

    useEffect(() => { fetchMyBatches(); }, [filterScope]);

    const fetchMyBatches = async () => {
        setLoading(true);
        try {
            const endpoint = filterScope === 'strict' ? '/batches/my?scope=strict' : '/batches/my';
            const res = await api.get(endpoint);
            if (res.data.success) {
                const batchesWithStats = await Promise.all(res.data.batches.map(async (batch) => {
                    try {
                        const attRes = await api.get(`/attendance/batch/${batch._id}`);
                        if (attRes.data.success) {
                            const records  = attRes.data.records;
                            const present  = records.filter(r => r.status === 'present').length;
                            const total    = records.length;
                            const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
                            return { ...batch, attendanceStats: { present, total, percentage }, recentLogs: records.slice(0, 5) };
                        }
                    } catch { return { ...batch, attendanceStats: null, recentLogs: [] }; }
                }));
                setBatches(batchesWithStats);
            }
        } catch (err) {
            console.error(err);
            toast.error('Failed to load your enrolled batches');
        } finally {
            setLoading(false);
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

    // ── Loading ──────────────────────────────────────────────────────────────
    if (loading) return (
        <div className="flex items-center justify-center min-h-[50vh]">
            <div className="flex flex-col items-center gap-3">
                <div className="w-11 h-11 rounded-full border-[3px] animate-spin"
                    style={{ borderColor: `${C.btnPrimary}30`, borderTopColor: C.btnPrimary }} />
                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.text, opacity: 0.55 }}>
                    Loading batches…
                </p>
            </div>
        </div>
    );

    return (
        <div className="space-y-5 pb-8" style={pageStyle}>

            {/* ── Header ───────────────────────────────────────────────── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.black, color: C.heading }}>
                        My Batches
                    </h1>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.text, opacity: 0.55, marginTop: 2 }}>
                        Track your enrolled cohorts and daily attendance.
                    </p>
                </div>

                {/* Scope Toggle */}
                <div className="flex p-1 rounded-2xl self-start"
                    style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}` }}>
                    {[
                        { key: 'all',    label: 'All Institutes',    Icon: Globe },
                        { key: 'strict', label: 'This Institute',    Icon: Building2 },
                    ].map(({ key, label, Icon }) => (
                        <button key={key} onClick={() => setFilterScope(key)}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm transition-all"
                            style={filterScope === key
                                ? { backgroundColor: C.btnPrimary, color: '#ffffff', fontFamily: T.fontFamily, fontWeight: T.weight.bold }
                                : { color: C.text, opacity: 0.7, fontFamily: T.fontFamily, fontWeight: T.weight.semibold }}>
                            <Icon className="w-4 h-4" /> {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Empty ────────────────────────────────────────────────── */}
            {batches.length === 0 ? (
                <div className="rounded-2xl p-16 text-center"
                    style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                        style={{ backgroundColor: C.innerBg }}>
                        <BookOpen className="w-8 h-8" style={{ color: C.cardBorder }} />
                    </div>
                    <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading }}>
                        Not Enrolled Yet
                    </h3>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.textMuted, marginTop: 8, maxWidth: 380, margin: '8px auto 0' }}>
                        You have not been assigned to any specific batches. Once your instructor adds you to a cohort, it will appear here.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {batches.map(batch => {
                        const pct      = batch.attendanceStats?.percentage || 0;
                        const attColor = getAttColor(pct);

                        return (
                            <div key={batch._id} className="rounded-2xl overflow-hidden flex flex-col transition-all hover:shadow-lg"
                                style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>

                                {/* Header */}
                                <div className="p-5 flex items-start gap-4"
                                    style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
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

                                {/* Date + Schedule row */}
                                <div className="grid grid-cols-2 divide-x"
                                    style={{ borderBottom: `1px solid ${C.cardBorder}`, divideColor: C.cardBorder, backgroundColor: C.innerBg }}>
                                    {[
                                        { icon: Calendar, label: 'Start Date',  value: new Date(batch.startDate).toLocaleDateString() },
                                        { icon: Clock,    label: 'Schedule',    value: batch.scheduleDescription || 'Flexible' },
                                    ].map(({ icon: Icon, label, value }) => (
                                        <div key={label} className="p-4 flex flex-col gap-1"
                                            style={{ borderColor: C.cardBorder }}>
                                            <div className="flex items-center gap-1.5"
                                                style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider }}>
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

                                    {/* Progress bar */}
                                    <div className="w-full h-2 rounded-full overflow-hidden mb-5"
                                        style={{ backgroundColor: C.innerBg }}>
                                        <div className="h-full rounded-full transition-all duration-700"
                                            style={{ width: `${pct}%`, backgroundColor: attColor }} />
                                    </div>

                                    {/* Recent Logs */}
                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, marginBottom: 10 }}>
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
                                                    <span className="truncate max-w-[120px] italic"
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
            )}
        </div>
    );
}