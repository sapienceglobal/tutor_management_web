'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { ArrowLeft, Users, CheckCircle, XCircle, Clock, Download, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { C, T, S, R } from '@/constants/tutorTokens';

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
            <div className="flex flex-col items-center justify-center min-h-screen gap-3 w-full" style={{ backgroundColor: '#dfdaf3', fontFamily: T.fontFamily }}>
                <Loader2 className="animate-spin" style={{ color: C.btnPrimary, width: '28px', height: '28px' }} />
                <p style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.bold }}>Loading live class attendance...</p>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-3 w-full" style={{ backgroundColor: '#dfdaf3', fontFamily: T.fontFamily }}>
                <p style={{ color: C.danger, fontSize: T.size.md, fontWeight: T.weight.bold }}>Failed to load attendance data.</p>
            </div>
        );
    }

    const { classDetails, stats, students } = data;

    return (
        <div className="w-full min-h-screen p-6 space-y-6" style={{ backgroundColor: '#dfdaf3', fontFamily: T.fontFamily, color: C.text }}>
            
            {/* ── Header ────────────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center cursor-pointer border-none transition-opacity hover:opacity-80"
                        style={{ backgroundColor: '#EAE8FA', borderRadius: R.full }}>
                        <ArrowLeft size={18} color={C.heading} />
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
                    className="flex items-center gap-2 h-10 px-5 cursor-pointer border-none transition-opacity hover:opacity-90 shadow-md"
                    style={{ background: C.gradientBtn, color: '#ffffff', borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}
                >
                    <Download size={16} /> Export
                </button>
            </div>

            {/* ── Top Stats Row ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Enrolled', value: stats.totalEnrolled, icon: Users, color: '#7573E8', bg: '#E3DFF8' },
                    { label: 'Present', value: stats.totalPresent, icon: CheckCircle, color: '#10B981', bg: 'rgba(16,185,129,0.15)' },
                    { label: 'Absent', value: stats.totalAbsent, icon: XCircle, color: '#F43F5E', bg: 'rgba(244,63,94,0.15)' },
                    { label: 'Turnout', value: `${stats.attendancePercentage}%`, icon: Clock, color: '#F59E0B', bg: 'rgba(245,158,11,0.15)' },
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

            {/* ── Attendance List Table ─────────────────────────────────────── */}
            <div className="p-5 overflow-x-auto" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                <div className="min-w-[800px]">
                    {/* Head */}
                    <div className="grid grid-cols-[2fr_2fr_1.5fr_1.5fr] gap-4 px-4 pb-3 mb-2" style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                        {['Student Name', 'Email', 'Status', 'Join Time'].map(h => (
                            <span key={h} style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted }}>{h}</span>
                        ))}
                    </div>

                    {students.length > 0 ? (
                        <div className="flex flex-col gap-2">
                            {students.map(student => {
                                const isPresent = student.status === 'Present';
                                return (
                                    <div key={student.studentId} className="grid grid-cols-[2fr_2fr_1.5fr_1.5fr] gap-4 px-4 py-3 items-center"
                                        style={{ backgroundColor: '#E3DFF8', borderRadius: R.xl }}>
                                        
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="flex items-center justify-center shrink-0 w-8 h-8"
                                                style={{ backgroundColor: C.surfaceWhite, borderRadius: R.full, color: C.btnPrimary, fontSize: T.size.sm, fontWeight: T.weight.bold, border: `1px solid ${C.cardBorder}` }}>
                                                {student.name.charAt(0)}
                                            </div>
                                            <p className="truncate" style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>
                                                {student.name}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="truncate" style={{ fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.textMuted, margin: 0 }}>
                                                {student.email}
                                            </p>
                                        </div>

                                        <div>
                                            <span style={{ 
                                                fontSize: '10px', fontWeight: T.weight.black, padding: '4px 8px', borderRadius: R.md, textTransform: 'uppercase',
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
                            <div className="w-12 h-12 flex items-center justify-center mb-3" style={{ backgroundColor: '#E3DFF8', borderRadius: R.xl }}>
                                <Users size={24} color={C.btnPrimary} />
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
    );
}