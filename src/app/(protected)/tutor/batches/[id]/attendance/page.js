'use client';

import { useMemo, useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { format } from 'date-fns';
import { 
    MdArrowBack, MdCalendarToday, MdCheckCircle, 
    MdDownload, MdHourglassEmpty, MdPeople, MdCancel 
} from 'react-icons/md';
import { C, T, S, R } from '@/constants/studentTokens';
import StatCard from '@/components/StatCard'; // Global StatCard component

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
            <div className="flex flex-col items-center justify-center min-h-screen gap-3 w-full" style={{ backgroundColor: C.pageBg, fontFamily: T.fontFamily }}>
                <MdHourglassEmpty className="animate-spin" style={{ color: C.btnPrimary, width: '28px', height: '28px' }} />
                <p style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.bold }}>Loading batch attendance...</p>
            </div>
        );
    }

    if (!batch) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-3 w-full" style={{ backgroundColor: C.pageBg, fontFamily: T.fontFamily }}>
                <p style={{ color: C.danger, fontSize: T.size.md, fontWeight: T.weight.bold }}>Failed to load batch attendance data.</p>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen space-y-6" style={{ backgroundColor: C.pageBg, fontFamily: T.fontFamily, color: C.text }}>
            
            {/* Header */}
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
                            {batch.name} Attendance
                        </h1>
                        <p style={{ fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.textMuted, margin: 0 }}>
                            Course: {batch.courseId?.title || 'N/A'} • Students: {safeArray(batch.students).length}
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

            {/* Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-500 delay-100">
                <StatCard label="Sessions Marked" value={stats.sessions} icon={MdCalendarToday} iconBg={C.iconBg} iconColor={C.btnPrimary} />
                <StatCard label="Present + Late" value={stats.presentEntries} icon={MdCheckCircle} iconBg={C.successBg} iconColor={C.success} />
                <StatCard label="Absent" value={stats.absentEntries} icon={MdCancel} iconBg={C.dangerBg} iconColor={C.danger} />
                <StatCard label="Attendance Rate" value={`${stats.attendanceRate}%`} icon={MdPeople} iconBg={C.warningBg} iconColor={C.warning} />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 animate-in fade-in duration-500 delay-200">
                
                {/* Student Attendance Summary */}
                <div className="overflow-hidden flex flex-col h-[500px]" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                    <div className="px-6 py-4 shrink-0" style={{ backgroundColor: C.innerBg, borderBottom: `1px solid ${C.cardBorder}` }}>
                        <h2 style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>
                            Student Attendance Summary
                        </h2>
                    </div>
                    <div className="flex-1 overflow-auto custom-scrollbar">
                        <div className="min-w-[600px]">
                            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] px-6 py-3" style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                                {['Student', 'Rate', 'Present', 'Absent', 'Late'].map((h) => (
                                    <span key={h} style={{ fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', letterSpacing: T.tracking.wider }}>{h}</span>
                                ))}
                            </div>
                            <div className="flex flex-col gap-2 p-4">
                                {studentRows.map((student) => (
                                    <div key={student.studentId} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] px-4 py-3 items-center transition-colors hover:bg-white/40" 
                                        style={{ backgroundColor: C.innerBg, borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}
                                        onMouseEnter={e => e.currentTarget.style.backgroundColor = C.btnViewAllBg}
                                        onMouseLeave={e => e.currentTarget.style.backgroundColor = C.innerBg}>
                                        <div className="min-w-0 pr-2">
                                            <p className="truncate" style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 2px 0' }}>{student.name}</p>
                                            <p className="truncate" style={{ fontSize: T.size.xs, fontWeight: T.weight.medium, color: C.textMuted, margin: 0 }}>{student.email}</p>
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
                <div className="overflow-hidden flex flex-col h-[500px]" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                    <div className="px-6 py-4 shrink-0" style={{ backgroundColor: C.innerBg, borderBottom: `1px solid ${C.cardBorder}` }}>
                        <h2 style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>
                            Session History
                        </h2>
                    </div>
                    <div className="flex-1 overflow-auto custom-scrollbar">
                        <div className="min-w-[600px]">
                            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] px-6 py-3" style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                                {['Date', 'Entries', 'Present', 'Absent', 'Rate'].map((h) => (
                                    <span key={h} style={{ fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', letterSpacing: T.tracking.wider }}>{h}</span>
                                ))}
                            </div>
                            <div className="flex flex-col gap-2 p-4">
                                {sessionRows.map((session) => (
                                    <div key={session.id} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] px-4 py-3 items-center transition-colors hover:bg-white/40" 
                                        style={{ backgroundColor: C.innerBg, borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}
                                        onMouseEnter={e => e.currentTarget.style.backgroundColor = C.btnViewAllBg}
                                        onMouseLeave={e => e.currentTarget.style.backgroundColor = C.innerBg}>
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