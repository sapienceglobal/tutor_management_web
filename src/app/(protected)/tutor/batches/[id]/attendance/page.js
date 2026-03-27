'use client';

import { useMemo, useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { ArrowLeft, CalendarDays, CheckCircle2, Download, Loader2, Users, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { C, T, FX, S, pageStyle } from '@/constants/tutorTokens';

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
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
                <Loader2 className="w-7 h-7 animate-spin" style={{ color: C.btnPrimary }} />
                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.textMuted }}>Loading batch attendance...</p>
            </div>
        );
    }

    if (!batch) {
        return (
            <div className="p-8 text-center" style={pageStyle}>
                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.danger }}>
                    Failed to load batch attendance data.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-5" style={pageStyle}>
            <div className="rounded-2xl p-4" style={{ backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.back()}
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: FX.primary08 }}
                    >
                        <ArrowLeft className="w-4 h-4" style={{ color: C.btnPrimary }} />
                    </button>
                    <div className="min-w-0">
                        <h1 className="truncate" style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading }}>
                            {batch.name} Attendance
                        </h1>
                        <p className="truncate" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>
                            Course: {batch.courseId?.title || 'N/A'} • Students: {safeArray(batch.students).length}
                        </p>
                    </div>
                    <button
                        onClick={() => window.print()}
                        className="ml-auto inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border"
                        style={{ borderColor: C.cardBorder, color: C.btnPrimary, backgroundColor: FX.primary08 }}
                    >
                        <Download className="w-3.5 h-3.5" />
                        Export
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Sessions Marked', value: stats.sessions, icon: CalendarDays, color: C.btnPrimary, bg: FX.primary08 },
                    { label: 'Present + Late', value: stats.presentEntries, icon: CheckCircle2, color: C.success, bg: C.successBg },
                    { label: 'Absent', value: stats.absentEntries, icon: XCircle, color: C.danger, bg: C.dangerBg },
                    { label: 'Attendance Rate', value: `${stats.attendanceRate}%`, icon: Users, color: C.warning, bg: C.warningBg },
                ].map((item) => (
                    <div key={item.label} className="rounded-2xl border p-4" style={{ backgroundColor: C.surfaceWhite, borderColor: C.cardBorder, boxShadow: S.card }}>
                        <div className="flex items-center justify-between mb-2.5">
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted, fontWeight: T.weight.bold }}>{item.label}</p>
                            <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: item.bg }}>
                                <item.icon className="w-4 h-4" style={{ color: item.color }} />
                            </span>
                        </div>
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.black, color: C.heading }}>{item.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: C.surfaceWhite, borderColor: C.cardBorder, boxShadow: S.card }}>
                    <div className="px-4 py-3 border-b" style={{ borderColor: C.cardBorder }}>
                        <h2 style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>
                            Student Attendance Summary
                        </h2>
                    </div>
                    <div className="max-h-[430px] overflow-auto">
                        <table className="w-full min-w-[560px]">
                            <thead style={{ backgroundColor: FX.primary05 }}>
                                <tr>
                                    {['Student', 'Rate', 'Present', 'Absent', 'Late'].map((h) => (
                                        <th key={h} className="text-left px-4 py-2.5" style={{ fontFamily: T.fontFamily, fontSize: '10px', color: C.textMuted, fontWeight: T.weight.bold, textTransform: 'uppercase', letterSpacing: T.tracking.wider }}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {studentRows.map((student) => (
                                    <tr key={student.studentId} className="border-t" style={{ borderColor: C.cardBorder }}>
                                        <td className="px-4 py-3">
                                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.heading, fontWeight: T.weight.semibold }}>{student.name}</p>
                                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>{student.email}</p>
                                        </td>
                                        <td className="px-4 py-3" style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.text }}>{student.attendanceRate}%</td>
                                        <td className="px-4 py-3" style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.success }}>{student.present + student.late}</td>
                                        <td className="px-4 py-3" style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.danger }}>{student.absent}</td>
                                        <td className="px-4 py-3" style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.warning }}>{student.late}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: C.surfaceWhite, borderColor: C.cardBorder, boxShadow: S.card }}>
                    <div className="px-4 py-3 border-b" style={{ borderColor: C.cardBorder }}>
                        <h2 style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>
                            Session History
                        </h2>
                    </div>
                    <div className="max-h-[430px] overflow-auto">
                        <table className="w-full min-w-[560px]">
                            <thead style={{ backgroundColor: FX.primary05 }}>
                                <tr>
                                    {['Date', 'Entries', 'Present', 'Absent', 'Rate'].map((h) => (
                                        <th key={h} className="text-left px-4 py-2.5" style={{ fontFamily: T.fontFamily, fontSize: '10px', color: C.textMuted, fontWeight: T.weight.bold, textTransform: 'uppercase', letterSpacing: T.tracking.wider }}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {sessionRows.map((session) => (
                                    <tr key={session.id} className="border-t" style={{ borderColor: C.cardBorder }}>
                                        <td className="px-4 py-3" style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.heading, fontWeight: T.weight.semibold }}>
                                            {session.date ? format(new Date(session.date), 'PPP') : 'N/A'}
                                        </td>
                                        <td className="px-4 py-3" style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.text }}>{session.records}</td>
                                        <td className="px-4 py-3" style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.success }}>{session.present}</td>
                                        <td className="px-4 py-3" style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.danger }}>{session.absent}</td>
                                        <td className="px-4 py-3" style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.text }}>{session.rate}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
