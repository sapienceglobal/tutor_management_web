'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
    MdHourglassEmpty, 
    MdEventAvailable, 
    MdVideocam, 
    MdPeople, 
    MdArrowForward, 
    MdDownload, 
    MdAccessTime 
} from 'react-icons/md';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { C, T, S, R } from '@/constants/studentTokens';
import StatCard from '@/components/StatCard'; // Global StatCard Component

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
            <div className="flex flex-col items-center justify-center min-h-screen gap-3 w-full" style={{ backgroundColor: C.pageBg, fontFamily: T.fontFamily }}>
                <MdHourglassEmpty className="animate-spin" style={{ color: C.btnPrimary, width: '28px', height: '28px' }} />
                <p style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.bold }}>Loading attendance hub...</p>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen space-y-6" style={{ backgroundColor: C.pageBg, fontFamily: T.fontFamily, color: C.text }}>
            
            {/* ── Header ────────────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 flex items-center justify-center shrink-0" style={{ backgroundColor: C.iconBg, borderRadius: '10px' }}>
                        <MdEventAvailable size={24} color={C.iconColor} />
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
                    className="flex items-center justify-center gap-2 h-11 px-6 cursor-pointer border-none transition-opacity hover:opacity-90 shadow-md w-full sm:w-auto"
                    style={{ background: C.gradientBtn, color: '#ffffff', borderRadius: '10px', fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily, boxShadow: S.btn }}
                >
                    <MdDownload size={18} /> Export Report
                </button>
            </div>

            {/* ── Top Stats Row ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-500 delay-100">
                <StatCard label="Present Today" value="42" icon={MdPeople} iconBg={C.successBg} iconColor={C.success} />
                <StatCard label="Absent" value="8" icon={MdPeople} iconBg={C.dangerBg} iconColor={C.danger} />
                <StatCard label="Late" value="5" icon={MdAccessTime} iconBg={C.warningBg} iconColor={C.warning} />
                <StatCard label="Avg Attendance" value="87%" icon={MdEventAvailable} iconBg={C.iconBg} iconColor={C.btnPrimary} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-500 delay-200">
                
                {/* ── Left Column (Main Data) ─────────────────────────────────── */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* Live Classes Section */}
                    <div className="p-6" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-10 h-10 flex items-center justify-center shrink-0" style={{ backgroundColor: C.innerBg, borderRadius: '10px' }}>
                                <MdVideocam size={20} color={C.btnPrimary} />
                            </div>
                            <h2 style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>
                                Live Class Attendance
                            </h2>
                        </div>

                        {upcomingClasses.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10" style={{ backgroundColor: C.innerBg, borderRadius: R.xl, border: `1px dashed ${C.cardBorder}` }}>
                                <MdVideocam size={32} color={C.textMuted} style={{ opacity: 0.5, marginBottom: '12px' }} />
                                <p style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.textMuted, margin: 0 }}>No upcoming live classes found.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {upcomingClasses.map((liveClass) => (
                                    <button
                                        key={liveClass._id}
                                        onClick={() => router.push(`/tutor/live-classes/${liveClass._id}/attendance`)}
                                        className="w-full p-4 flex items-center justify-between cursor-pointer border-none transition-colors hover:bg-white/40"
                                        style={{ backgroundColor: C.innerBg, borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}
                                        onMouseEnter={e => e.currentTarget.style.backgroundColor = C.btnViewAllBg}
                                        onMouseLeave={e => e.currentTarget.style.backgroundColor = C.innerBg}
                                    >
                                        <div className="min-w-0 text-left">
                                            <p className="truncate" style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 4px 0' }}>
                                                {liveClass.title}
                                            </p>
                                            <p style={{ fontSize: T.size.xs, fontWeight: T.weight.semibold, color: C.textMuted, margin: 0, textTransform: 'uppercase', letterSpacing: T.tracking.wider }}>
                                                {new Date(liveClass.dateTime).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="w-8 h-8 flex items-center justify-center shrink-0 shadow-sm" style={{ backgroundColor: C.surfaceWhite, borderRadius: '8px', border: `1px solid ${C.cardBorder}` }}>
                                            <MdArrowForward size={16} color={C.btnPrimary} />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Batch Attendance Section */}
                    <div className="p-6" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-10 h-10 flex items-center justify-center shrink-0" style={{ backgroundColor: C.innerBg, borderRadius: '10px' }}>
                                <MdPeople size={20} color={C.btnPrimary} />
                            </div>
                            <h2 style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>
                                Batch Attendance Tracker
                            </h2>
                        </div>

                        {batches.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10" style={{ backgroundColor: C.innerBg, borderRadius: R.xl, border: `1px dashed ${C.cardBorder}` }}>
                                <MdPeople size={32} color={C.textMuted} style={{ opacity: 0.5, marginBottom: '12px' }} />
                                <p style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.textMuted, margin: 0 }}>No batches found yet.</p>
                            </div>
                        ) : (
                            <div className="overflow-hidden" style={{ backgroundColor: C.surfaceWhite, borderRadius: '12px', border: `1px solid ${C.cardBorder}` }}>
                                <div className="max-h-[360px] overflow-auto custom-scrollbar">
                                    <div className="flex flex-col">
                                        {batches.map((batch, idx) => (
                                            <button
                                                key={batch._id}
                                                onClick={() => router.push(`/tutor/batches/${batch._id}/attendance`)}
                                                className="w-full p-4 flex items-center justify-between cursor-pointer border-none transition-colors hover:bg-white/40"
                                                style={{ backgroundColor: C.innerBg, borderBottom: idx !== batches.length - 1 ? `1px solid ${C.cardBorder}` : 'none' }}
                                                onMouseEnter={e => e.currentTarget.style.backgroundColor = C.btnViewAllBg}
                                                onMouseLeave={e => e.currentTarget.style.backgroundColor = C.innerBg}
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <span style={{ fontSize: '10px', fontWeight: T.weight.black, color: C.textMuted, backgroundColor: C.surfaceWhite, padding: '4px 8px', borderRadius: '6px', border: `1px solid ${C.cardBorder}` }}>
                                                        {idx + 1}
                                                    </span>
                                                    <span className="truncate" style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>
                                                        {batch.name}
                                                    </span>
                                                </div>
                                                <MdArrowForward size={18} color={C.btnPrimary} />
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
                    <div className="p-6 h-full flex flex-col" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                        <div className="flex items-center justify-between mb-8">
                            <h3 style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>Overview</h3>
                        </div>

                        {/* Donut Chart Placeholder */}
                        <div className="flex items-center justify-center py-6 mb-8 mt-4">
                            <div className="relative flex items-center justify-center shadow-sm" style={{ width: '180px', height: '180px', borderRadius: '50%', border: `16px solid ${C.btnPrimary}` }}>
                                <div className="text-center">
                                    <p style={{ fontSize: T.size['3xl'], fontWeight: T.weight.black, color: C.heading, margin: '0 0 2px 0' }}>84%</p>
                                    <p style={{ fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', letterSpacing: T.tracking.wider }}>Overall</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 mt-auto">
                            <div className="flex items-center justify-between p-4 transition-colors hover:bg-white/40" style={{ backgroundColor: C.innerBg, borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: C.successBg }}>
                                        <MdPeople size={16} color={C.success} />
                                    </div>
                                    <span style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>Present Today</span>
                                </div>
                                <span style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading }}>42</span>
                            </div>
                            
                            <div className="flex items-center justify-between p-4 transition-colors hover:bg-white/40" style={{ backgroundColor: C.innerBg, borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: C.dangerBg }}>
                                        <MdPeople size={16} color={C.danger} />
                                    </div>
                                    <span style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>Absent Today</span>
                                </div>
                                <span style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading }}>8</span>
                            </div>

                            <div className="flex items-center justify-between p-4 transition-colors hover:bg-white/40" style={{ backgroundColor: C.innerBg, borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: C.warningBg }}>
                                        <MdAccessTime size={16} color={C.warning} />
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