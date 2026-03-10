'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { ArrowLeft, Users, CheckCircle, XCircle, Clock, Download, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export default function AttendancePage({ params }) {
    const { id }    = use(params);
    const router    = useRouter();
    const [loading, setLoading] = useState(true);
    const [data, setData]       = useState(null);

    useEffect(() => {
        (async () => {
            try {
                const res = await api.get(`/live-classes/${id}/attendance-report`);
                if (res.data.success) setData(res.data.data);
            } catch { /* handled below */ }
            finally { setLoading(false); }
        })();
    }, [id]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3"
                style={{ fontFamily: "var(--theme-font, 'DM Sans', sans-serif)" }}>
                <Loader2 className="w-7 h-7 animate-spin" style={{ color: 'var(--theme-primary)' }} />
                <p className="text-sm text-slate-400">Loading attendance...</p>
            </div>
        );
    }

    if (!data) {
        return <div className="p-8 text-center text-sm text-red-500">Failed to load attendance data.</div>;
    }

    const { classDetails, stats, students } = data;

    return (
        <div className="space-y-5" style={{ fontFamily: "var(--theme-font, 'DM Sans', sans-serif)" }}>

            {/* ── Header ────────────────────────────────────────────────────── */}
            <div className="bg-white rounded-xl border border-slate-100 px-5 py-4">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.back()}
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors flex-shrink-0">
                        <ArrowLeft className="w-4 h-4 text-slate-500" />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold text-slate-800">{classDetails.title}</h1>
                        <p className="text-xs text-slate-400">
                            {format(new Date(classDetails.dateTime), 'PPP p')} · {classDetails.duration} mins
                        </p>
                    </div>
                    <button onClick={() => window.print()}
                        className="ml-auto flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                        <Download className="w-3.5 h-3.5" /> Export
                    </button>
                </div>
            </div>

            {/* ── Stats ─────────────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Enrolled', value: stats.totalEnrolled,        icon: Users,       color: 'text-blue-500',    bg: 'bg-blue-50',    theme: false },
                    { label: 'Present',         value: stats.totalPresent,         icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', theme: false },
                    { label: 'Absent',          value: stats.totalAbsent,          icon: XCircle,     color: 'text-red-500',     bg: 'bg-red-50',     theme: false },
                    { label: 'Turnout',         value: `${stats.attendancePercentage}%`, icon: Clock, color: '',                bg: '',              theme: true  },
                ].map(({ label, value, icon: Icon, color, bg, theme }) => (
                    <div key={label} className="bg-white rounded-xl border border-slate-100 p-5 hover:shadow-sm transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-semibold text-slate-500">{label}</p>
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${bg}`}
                                style={theme ? { backgroundColor: 'color-mix(in srgb, var(--theme-primary) 10%, white)' } : {}}>
                                <Icon className={`w-4 h-4 ${color}`}
                                    style={theme ? { color: 'var(--theme-primary)' } : {}} />
                            </div>
                        </div>
                        <p className={`text-2xl font-black ${color}`}
                            style={theme ? { color: 'var(--theme-primary)' } : {}}>
                            {value}
                        </p>
                    </div>
                ))}
            </div>

            {/* ── Students table ────────────────────────────────────────────── */}
            <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-slate-800">Attendance List</h3>
                </div>

                {/* Head */}
                <div className="grid grid-cols-[2fr_2fr_100px_100px] gap-4 px-5 py-3 border-b border-slate-50 bg-slate-50/60">
                    {['Student', 'Email', 'Status', 'Join Time'].map(h => (
                        <span key={h} className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{h}</span>
                    ))}
                </div>

                {students.length > 0 ? (
                    <div className="divide-y divide-slate-50">
                        {students.map(student => (
                            <div key={student.studentId}
                                className="grid grid-cols-[2fr_2fr_100px_100px] gap-4 px-5 py-4 items-center hover:bg-slate-50/40 transition-colors">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                                        style={{ background: 'linear-gradient(135deg, var(--theme-sidebar), var(--theme-primary))' }}>
                                        {student.name.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="text-sm font-semibold text-slate-800 truncate">{student.name}</span>
                                </div>
                                <span className="text-xs text-slate-500 truncate">{student.email}</span>
                                <div>
                                    <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold border
                                        ${student.status === 'Present'
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                            : 'bg-red-50 text-red-600 border-red-200'}`}>
                                        {student.status}
                                    </span>
                                </div>
                                <span className="text-xs text-slate-500">
                                    {student.joinedAt ? format(new Date(student.joinedAt), 'h:mm a') : '—'}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <Users className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                        <p className="text-sm text-slate-400">No students enrolled in this course yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
}