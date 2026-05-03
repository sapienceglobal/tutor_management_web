'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { 
    MdArrowBack, MdPeople, MdCheckCircle, 
    MdCancel, MdAccessTime, MdDownload, MdHourglassEmpty 
} from 'react-icons/md';
import { format } from 'date-fns';
import { C, T, S, R } from '@/constants/studentTokens';
import StatCard from '@/components/StatCard'; // Global StatCard component

export default function AttendancePage({ params }) {
    const { id } = use(params);
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);

    useEffect(() => {
        const fetchAttendance = async () => {
            try {
                const res = await api.get(`/live-classes/${id}/attendance-report`);
                if (res?.data?.success) {
                    setData(res.data.data);
                }
            } catch (error) {
                console.error('Failed to fetch attendance:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAttendance();
    }, [id]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-3 w-full" style={{ backgroundColor: C.pageBg, fontFamily: T.fontFamily }}>
                <MdHourglassEmpty className="animate-spin" style={{ color: C.btnPrimary, width: '28px', height: '28px' }} />
                <p style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.bold }}>Loading live class attendance...</p>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-3 w-full" style={{ backgroundColor: C.pageBg, fontFamily: T.fontFamily }}>
                <p style={{ color: C.danger, fontSize: T.size.md, fontWeight: T.weight.bold }}>Failed to load attendance data.</p>
            </div>
        );
    }

    const { classDetails, stats, students } = data;

    return (
        <div className="w-full min-h-screen space-y-6" style={{ backgroundColor: C.pageBg, fontFamily: T.fontFamily, color: C.text }}>
            
            {/* ── Header ────────────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center cursor-pointer border-none transition-colors hover:opacity-80 shrink-0"
                        style={{ backgroundColor: C.innerBg, borderRadius: '10px' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = C.btnViewAllBg}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = C.innerBg}>
                        <MdArrowBack size={20} color={C.heading} />
                    </button>
                    <div>
                        <h1 style={{ fontSize: T.size['2xl'], fontWeight: T.weight.black, color: C.heading, margin: '0 0 2px 0' }}>
                            {classDetails.title}
                        </h1>
                        <p style={{ fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.textMuted, margin: 0 }}>
                            {format(new Date(classDetails.dateTime), 'PPP p')} • {classDetails.duration} mins
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => window.print()}
                    className="flex items-center justify-center gap-2 h-11 px-6 cursor-pointer border-none transition-opacity hover:opacity-90 shadow-md w-full sm:w-auto"
                    style={{ background: C.gradientBtn, color: '#ffffff', borderRadius: '10px', fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily, boxShadow: S.btn }}
                >
                    <MdDownload size={18} /> Export
                </button>
            </div>

            {/* ── Top Stats Row ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-500 delay-100">
                <StatCard label="Total Enrolled" value={stats.totalEnrolled} icon={MdPeople} iconBg={C.iconBg} iconColor={C.btnPrimary} />
                <StatCard label="Present" value={stats.totalPresent} icon={MdCheckCircle} iconBg={C.successBg} iconColor={C.success} />
                <StatCard label="Absent" value={stats.totalAbsent} icon={MdCancel} iconBg={C.dangerBg} iconColor={C.danger} />
                <StatCard label="Turnout" value={`${stats.attendancePercentage}%`} icon={MdAccessTime} iconBg={C.warningBg} iconColor={C.warning} />
            </div>

            {/* ── Attendance List Table ─────────────────────────────────────── */}
            <div className="overflow-hidden animate-in fade-in duration-500 delay-200" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.cardBorder}`, backgroundColor: C.innerBg }}>
                    <h2 style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>Student Attendance</h2>
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                    <div className="min-w-[800px]">
                        {/* Head */}
                        <div className="grid grid-cols-[2fr_2fr_1.5fr_1.5fr] gap-4 px-6 py-3" style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                            {['Student Name', 'Email', 'Status', 'Join Time'].map(h => (
                                <span key={h} style={{ fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', letterSpacing: T.tracking.wider }}>{h}</span>
                            ))}
                        </div>

                        {students.length > 0 ? (
                            <div className="flex flex-col gap-2 p-4">
                                {students.map(student => {
                                    const isPresent = student.status === 'Present';
                                    return (
                                        <div key={student.studentId} className="grid grid-cols-[2fr_2fr_1.5fr_1.5fr] gap-4 px-4 py-3 items-center transition-colors hover:bg-white/40"
                                            style={{ backgroundColor: C.innerBg, borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}
                                            onMouseEnter={e => e.currentTarget.style.backgroundColor = C.btnViewAllBg}
                                            onMouseLeave={e => e.currentTarget.style.backgroundColor = C.innerBg}>
                                            
                                            <div className="flex items-center gap-3 min-w-0 pr-2">
                                                <div className="flex items-center justify-center shrink-0 w-8 h-8"
                                                    style={{ backgroundColor: C.surfaceWhite, borderRadius: '8px', color: C.btnPrimary, fontSize: T.size.sm, fontWeight: T.weight.bold, border: `1px solid ${C.cardBorder}` }}>
                                                    {student.name.charAt(0).toUpperCase()}
                                                </div>
                                                <p className="truncate" style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>
                                                    {student.name}
                                                </p>
                                            </div>

                                            <div className="min-w-0 pr-2">
                                                <p className="truncate" style={{ fontSize: T.size.sm, fontWeight: T.weight.semibold, color: C.textMuted, margin: 0 }}>
                                                    {student.email}
                                                </p>
                                            </div>

                                            <div>
                                                <span style={{ 
                                                    fontSize: '10px', fontWeight: T.weight.black, padding: '4px 10px', borderRadius: '6px', textTransform: 'uppercase', letterSpacing: T.tracking.wider,
                                                    backgroundColor: isPresent ? C.successBg : C.dangerBg, 
                                                    color: isPresent ? C.success : C.danger, 
                                                    border: `1px solid ${isPresent ? C.successBorder : C.dangerBorder}`
                                                }}>
                                                    {student.status}
                                                </span>
                                            </div>

                                            <div>
                                                <p style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.textMuted, margin: 0 }}>
                                                    {student.joinedAt ? format(new Date(student.joinedAt), 'h:mm a') : '-'}
                                                </p>
                                            </div>

                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-16 flex flex-col items-center">
                                <div className="w-14 h-14 flex items-center justify-center mb-3" style={{ backgroundColor: C.innerBg, borderRadius: '12px' }}>
                                    <MdPeople size={28} color={C.textMuted} style={{ opacity: 0.5 }} />
                                </div>
                                <p style={{ fontSize: T.size.md, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 4px 0' }}>No students found</p>
                                <p style={{ fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.textMuted, margin: 0 }}>
                                    No students have enrolled or joined this class yet.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}