'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CalendarCheck2, Video, Users, ArrowRight, Download, Clock } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { C, T, S, R } from '@/constants/tutorTokens';

export default function TutorAttendanceHubPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [liveClasses, setLiveClasses] = useState([]);
    const [batches, setBatches] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [liveClassesRes, batchesRes] = await Promise.all([
                    api.get('/live-classes'),
                    api.get('/batches'),
                ]);
                setLiveClasses(liveClassesRes?.data?.liveClasses || []);
                setBatches(batchesRes?.data?.batches || batchesRes?.data?.data || []);
            } catch {
                toast.error('Failed to load attendance data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const upcomingClasses = useMemo(
        () =>
            liveClasses
                .filter((liveClass) => new Date(liveClass.dateTime) >= new Date())
                .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime))
                .slice(0, 6),
        [liveClasses]
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-3 w-full" style={{ backgroundColor: '#dfdaf3', fontFamily: T.fontFamily }}>
                <Loader2 className="animate-spin" style={{ color: C.btnPrimary, width: '28px', height: '28px' }} />
                <p style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.bold }}>Loading attendance hub...</p>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen p-6 space-y-6" style={{ backgroundColor: '#dfdaf3', fontFamily: T.fontFamily, color: C.text }}>
            
            {/* ── Header ────────────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex items-center justify-center shrink-0" style={{ backgroundColor: '#EAE8FA', borderRadius: R.xl }}>
                        <CalendarCheck2 size={20} color={C.btnPrimary} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: T.size['2xl'], fontWeight: T.weight.black, color: C.heading, margin: '0 0 2px 0' }}>
                            Attendance Hub
                        </h1>
                        <p style={{ fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.textMuted, margin: 0 }}>
                            Check attendance by live class or student batch
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 h-10 px-5 cursor-pointer border-none transition-opacity hover:opacity-90 shadow-md"
                    style={{ background: C.gradientBtn, color: '#ffffff', borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}
                >
                    <Download size={16} /> Export Report
                </button>
            </div>

            {/* ── Top Stats Row ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Present Today', value: '42', icon: Users, color: '#10B981', bg: 'rgba(16,185,129,0.15)' },
                    { label: 'Absent', value: '8', icon: Users, color: '#F43F5E', bg: 'rgba(244,63,94,0.15)' },
                    { label: 'Late', value: '5', icon: Clock, color: '#F59E0B', bg: 'rgba(245,158,11,0.15)' },
                    { label: 'Avg Attendance', value: '87%', icon: CalendarCheck2, color: '#7573E8', bg: '#E3DFF8' },
                ].map((stat, i) => (
                    <div key={i} className="p-5 flex flex-col justify-between" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card, minHeight: '120px' }}>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 flex items-center justify-center shrink-0" style={{ backgroundColor: stat.bg, borderRadius: R.md }}>
                                <stat.icon size={16} color={stat.color} />
                            </div>
                            <p style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>{stat.label}</p>
                        </div>
                        <p style={{ fontSize: T.size['3xl'], fontWeight: T.weight.black, color: C.heading, margin: 0 }}>{stat.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* ── Left Column (Main Data) ─────────────────────────────────── */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* Live Classes Section */}
                    <div className="p-6" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-10 h-10 flex items-center justify-center shrink-0" style={{ backgroundColor: '#E3DFF8', borderRadius: R.xl }}>
                                <Video size={20} color={C.btnPrimary} />
                            </div>
                            <h2 style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>
                                Live Class Attendance
                            </h2>
                        </div>

                        {upcomingClasses.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10" style={{ backgroundColor: '#E3DFF8', borderRadius: R.xl, border: `1px dashed ${C.cardBorder}` }}>
                                <Video size={32} color={C.textMuted} style={{ opacity: 0.3, marginBottom: '12px' }} />
                                <p style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.textMuted, margin: 0 }}>No upcoming live classes found.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {upcomingClasses.map((liveClass) => (
                                    <button
                                        key={liveClass._id}
                                        onClick={() => router.push(`/tutor/live-classes/${liveClass._id}/attendance`)}
                                        className="w-full p-4 flex items-center justify-between cursor-pointer border-none transition-transform hover:-translate-y-0.5"
                                        style={{ backgroundColor: '#E3DFF8', borderRadius: R.xl, border: `1px solid ${C.cardBorder}` }}
                                    >
                                        <div className="min-w-0 text-left">
                                            <p className="truncate" style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 2px 0' }}>
                                                {liveClass.title}
                                            </p>
                                            <p style={{ fontSize: T.size.xs, fontWeight: T.weight.medium, color: C.textMuted, margin: 0 }}>
                                                {new Date(liveClass.dateTime).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="w-8 h-8 flex items-center justify-center shrink-0" style={{ backgroundColor: C.surfaceWhite, borderRadius: R.full }}>
                                            <ArrowRight size={14} color={C.btnPrimary} />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Batch Attendance Section */}
                    <div className="p-6" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-10 h-10 flex items-center justify-center shrink-0" style={{ backgroundColor: '#E3DFF8', borderRadius: R.xl }}>
                                <Users size={20} color={C.btnPrimary} />
                            </div>
                            <h2 style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>
                                Batch Attendance Tracker
                            </h2>
                        </div>

                        {batches.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10" style={{ backgroundColor: '#E3DFF8', borderRadius: R.xl, border: `1px dashed ${C.cardBorder}` }}>
                                <Users size={32} color={C.textMuted} style={{ opacity: 0.3, marginBottom: '12px' }} />
                                <p style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.textMuted, margin: 0 }}>No batches found yet.</p>
                            </div>
                        ) : (
                            <div className="overflow-hidden" style={{ backgroundColor: C.surfaceWhite, borderRadius: R.xl, border: `1px solid ${C.cardBorder}` }}>
                                <div className="max-h-[360px] overflow-auto custom-scrollbar">
                                    <div className="flex flex-col">
                                        {batches.map((batch, idx) => (
                                            <button
                                                key={batch._id}
                                                onClick={() => router.push(`/tutor/batches/${batch._id}/attendance`)}
                                                className="w-full p-4 flex items-center justify-between cursor-pointer border-none transition-colors hover:opacity-80"
                                                style={{ backgroundColor: '#E3DFF8', borderBottom: idx !== batches.length - 1 ? `1px solid ${C.cardBorder}` : 'none' }}
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <span style={{ fontSize: T.size.xs, fontWeight: T.weight.black, color: C.textMuted, backgroundColor: C.surfaceWhite, padding: '4px 8px', borderRadius: R.md }}>
                                                        {idx + 1}
                                                    </span>
                                                    <span className="truncate" style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>
                                                        {batch.name}
                                                    </span>
                                                </div>
                                                <ArrowRight size={16} color={C.btnPrimary} />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Right Column (Overview Widget) ─────────────────────────── */}
                <div className="lg:col-span-1">
                    <div className="p-6 h-full" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>Overview</h3>
                        </div>

                        {/* Donut Chart Placeholder */}
                        <div className="flex items-center justify-center py-6 mb-6">
                            <div className="relative flex items-center justify-center" style={{ width: '160px', height: '160px', borderRadius: '50%', border: `16px solid ${C.btnPrimary}` }}>
                                <div className="text-center">
                                    <p style={{ fontSize: T.size['3xl'], fontWeight: T.weight.black, color: C.heading, margin: '0 0 2px 0' }}>84%</p>
                                    <p style={{ fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase' }}>Overall</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between p-4" style={{ backgroundColor: '#E3DFF8', borderRadius: R.xl }}>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: C.successBg }}>
                                        <Users size={16} color={C.success} />
                                    </div>
                                    <span style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>Present Today</span>
                                </div>
                                <span style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading }}>42</span>
                            </div>
                            
                            <div className="flex items-center justify-between p-4" style={{ backgroundColor: '#E3DFF8', borderRadius: R.xl }}>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: C.dangerBg }}>
                                        <Users size={16} color={C.danger} />
                                    </div>
                                    <span style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>Absent Today</span>
                                </div>
                                <span style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading }}>8</span>
                            </div>

                            <div className="flex items-center justify-between p-4" style={{ backgroundColor: '#E3DFF8', borderRadius: R.xl }}>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: C.warningBg }}>
                                        <Clock size={16} color={C.warning} />
                                    </div>
                                    <span style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>Late Today</span>
                                </div>
                                <span style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading }}>5</span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}