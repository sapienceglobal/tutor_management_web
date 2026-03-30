'use client';

import { useMemo, useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { ArrowLeft, CalendarDays, CheckCircle2, Download, Loader2, Users, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { C, T, S, R } from '@/constants/tutorTokens';

function safeArray(value) {
    return Array.isArray(value) ? value : [];
}

export default function TutorBatchAttendancePage({ params }) {
    const { id } = use(params);
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [batch, setBatch] = useState(null);
    const [attendanceRows, setAttendanceRows] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [batchRes, attendanceRes] = await Promise.all([
                    api.get(`/batches/${id}`),
                    api.get(`/attendance/batch/${id}`),
                ]);
                setBatch(batchRes.data?.batch || null);
                setAttendanceRows(safeArray(attendanceRes.data?.records));
            } catch (error) {
                console.error('Failed to load batch attendance:', error);
                setBatch(null);
                setAttendanceRows([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    const stats = useMemo(() => {
        const sessions = attendanceRows.length;
        let markedEntries = 0;
        let presentEntries = 0;
        let absentEntries = 0;
        let lateEntries = 0;

        attendanceRows.forEach((row) => {
            safeArray(row.records).forEach((record) => {
                markedEntries += 1;
                const status = String(record.status || '').toLowerCase();
                if (status === 'present') presentEntries += 1;
                if (status === 'absent') absentEntries += 1;
                if (status === 'late') {
                    lateEntries += 1;
                    presentEntries += 1;
                }
            });
        });

        const attendanceRate = markedEntries > 0 ? Number(((presentEntries / markedEntries) * 100).toFixed(1)) : 0;
        return { sessions, markedEntries, presentEntries, absentEntries, lateEntries, attendanceRate };
    }, [attendanceRows]);

    const studentRows = useMemo(() => {
        const map = new Map();
        safeArray(batch?.students).forEach((student) => {
            const studentId = String(student._id);
            map.set(studentId, {
                studentId,
                name: student.name || 'Student',
                email: student.email || '',
                present: 0,
                absent: 0,
                late: 0,
                total: 0,
                lastMarkedAt: null,
            });
        });

        attendanceRows.forEach((row) => {
            const sessionDate = row.date ? new Date(row.date) : null;
            safeArray(row.records).forEach((record) => {
                const student = record.studentId;
                const studentId = String(student?._id || student || '');
                if (!studentId) return;

                if (!map.has(studentId)) {
                    map.set(studentId, {
                        studentId,
                        name: student?.name || 'Student',
                        email: student?.email || '',
                        present: 0,
                        absent: 0,
                        late: 0,
                        total: 0,
                        lastMarkedAt: null,
                    });
                }

                const rowData = map.get(studentId);
                rowData.total += 1;
                const status = String(record.status || '').toLowerCase();
                if (status === 'present') rowData.present += 1;
                if (status === 'absent') rowData.absent += 1;
                if (status === 'late') rowData.late += 1;

                if (sessionDate && (!rowData.lastMarkedAt || sessionDate > rowData.lastMarkedAt)) {
                    rowData.lastMarkedAt = sessionDate;
                }
            });
        });

        return Array.from(map.values())
            .map((row) => {
                const attendanceRate = row.total > 0
                    ? Number((((row.present + row.late) / row.total) * 100).toFixed(1))
                    : 0;
                return {
                    ...row,
                    attendanceRate,
                };
            })
            .sort((a, b) => a.attendanceRate - b.attendanceRate);
    }, [attendanceRows, batch?.students]);

    const sessionRows = useMemo(() => {
        return attendanceRows.map((row) => {
            const records = safeArray(row.records);
            const present = records.filter((record) => {
                const status = String(record.status || '').toLowerCase();
                return status === 'present' || status === 'late';
            }).length;
            const absent = records.filter((record) => String(record.status || '').toLowerCase() === 'absent').length;
            const rate = records.length > 0 ? Number(((present / records.length) * 100).toFixed(1)) : 0;
            return {
                id: row._id,
                date: row.date,
                records: records.length,
                present,
                absent,
                rate,
            };
        });
    }, [attendanceRows]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-3 w-full" style={{ backgroundColor: '#dfdaf3', fontFamily: T.fontFamily }}>
                <Loader2 className="animate-spin" style={{ color: C.btnPrimary, width: '28px', height: '28px' }} />
                <p style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.bold }}>Loading batch attendance...</p>
            </div>
        );
    }

    if (!batch) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-3 w-full" style={{ backgroundColor: '#dfdaf3', fontFamily: T.fontFamily }}>
                <p style={{ color: C.danger, fontSize: T.size.md, fontWeight: T.weight.bold }}>Failed to load batch attendance data.</p>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen p-6 space-y-6" style={{ backgroundColor: '#dfdaf3', fontFamily: T.fontFamily, color: C.text }}>
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center cursor-pointer border-none transition-opacity hover:opacity-80"
                        style={{ backgroundColor: '#EAE8FA', borderRadius: R.full }}>
                        <ArrowLeft size={18} color={C.heading} />
                    </button>
                    <div>
                        <h1 style={{ fontSize: T.size['2xl'], fontWeight: T.weight.black, color: C.heading, margin: '0 0 2px 0' }}>
                            {batch.name} Attendance
                        </h1>
                        <p style={{ fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.textMuted, margin: 0 }}>
                            Course: {batch.courseId?.title || 'N/A'} • Students: {safeArray(batch.students).length}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 h-11 px-5 cursor-pointer border-none transition-opacity hover:opacity-90 shadow-md"
                    style={{ background: C.gradientBtn, color: '#ffffff', borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}
                >
                    <Download size={16} /> Export Report
                </button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Sessions Marked', value: stats.sessions, icon: CalendarDays, color: C.btnPrimary, bg: '#E3DFF8' },
                    { label: 'Present + Late', value: stats.presentEntries, icon: CheckCircle2, color: C.success, bg: C.successBg },
                    { label: 'Absent', value: stats.absentEntries, icon: XCircle, color: C.danger, bg: C.dangerBg },
                    { label: 'Attendance Rate', value: `${stats.attendanceRate}%`, icon: Users, color: C.warning, bg: C.warningBg },
                ].map((item) => (
                    <div key={item.label} className="p-5 flex flex-col justify-between" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 flex items-center justify-center shrink-0" style={{ backgroundColor: item.bg, borderRadius: R.md }}>
                                <item.icon size={18} color={item.color} />
                            </div>
                            <p style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>{item.label}</p>
                        </div>
                        <p style={{ fontSize: T.size['3xl'], fontWeight: T.weight.black, color: C.heading, margin: 0, lineHeight: 1 }}>{item.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                
                {/* Student Attendance Summary */}
                <div className="overflow-hidden flex flex-col h-[500px]" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                    <div className="px-5 py-4 shrink-0" style={{ backgroundColor: C.surfaceWhite, borderBottom: `1px solid ${C.cardBorder}` }}>
                        <h2 style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>
                            Student Attendance Summary
                        </h2>
                    </div>
                    <div className="flex-1 overflow-auto custom-scrollbar">
                        <div className="min-w-[600px]">
                            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] px-5 py-3" style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                                {['Student', 'Rate', 'Present', 'Absent', 'Late'].map((h) => (
                                    <span key={h} style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted }}>{h}</span>
                                ))}
                            </div>
                            <div className="flex flex-col gap-2 p-3">
                                {studentRows.map((student) => (
                                    <div key={student.studentId} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] px-3 py-3 items-center" style={{ backgroundColor: '#E3DFF8', borderRadius: R.xl }}>
                                        <div>
                                            <p style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 2px 0' }}>{student.name}</p>
                                            <p style={{ fontSize: T.size.xs, fontWeight: T.weight.medium, color: C.textMuted, margin: 0 }}>{student.email}</p>
                                        </div>
                                        <span style={{ fontSize: T.size.sm, fontWeight: T.weight.black, color: C.heading }}>{student.attendanceRate}%</span>
                                        <span style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.success }}>{student.present + student.late}</span>
                                        <span style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.danger }}>{student.absent}</span>
                                        <span style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.warning }}>{student.late}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Session History */}
                <div className="overflow-hidden flex flex-col h-[500px]" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                    <div className="px-5 py-4 shrink-0" style={{ backgroundColor: C.surfaceWhite, borderBottom: `1px solid ${C.cardBorder}` }}>
                        <h2 style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>
                            Session History
                        </h2>
                    </div>
                    <div className="flex-1 overflow-auto custom-scrollbar">
                        <div className="min-w-[600px]">
                            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] px-5 py-3" style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                                {['Date', 'Entries', 'Present', 'Absent', 'Rate'].map((h) => (
                                    <span key={h} style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted }}>{h}</span>
                                ))}
                            </div>
                            <div className="flex flex-col gap-2 p-3">
                                {sessionRows.map((session) => (
                                    <div key={session.id} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] px-3 py-3 items-center" style={{ backgroundColor: '#E3DFF8', borderRadius: R.xl }}>
                                        <span style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>
                                            {session.date ? format(new Date(session.date), 'PPP') : 'N/A'}
                                        </span>
                                        <span style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.textMuted }}>{session.records}</span>
                                        <span style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.success }}>{session.present}</span>
                                        <span style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.danger }}>{session.absent}</span>
                                        <span style={{ fontSize: T.size.sm, fontWeight: T.weight.black, color: C.heading }}>{session.rate}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}