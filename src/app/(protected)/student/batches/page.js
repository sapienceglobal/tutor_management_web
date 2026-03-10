'use client';

import { useState, useEffect } from 'react';
import { BookOpen, Calendar, Clock, CheckCircle2, XCircle, AlertCircle, Globe, Building2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '@/lib/axios';

export default function StudentBatchesPage() {
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterScope, setFilterScope] = useState('all'); // 'all' or 'strict'

    useEffect(() => {
        fetchMyBatches();
    }, [filterScope]);

    const fetchMyBatches = async () => {
        setLoading(true);
        try {
            // Wait, we need to fetch both the batches the student is in AND their attendance for those batches.
            // First, fetch batches based on filterScope
            const endpoint = filterScope === 'strict' ? '/batches/my?scope=strict' : '/batches/my';
            const res = await api.get(endpoint);
            if (res.data.success) {
                const fetchedBatches = res.data.batches;

                // Now fetch attendance for each batch to show basic stats
                const batchesWithStats = await Promise.all(fetchedBatches.map(async (batch) => {
                    try {
                        const attRes = await api.get(`/attendance/batch/${batch._id}`);
                        if (attRes.data.success) {
                            const records = attRes.data.records;
                            const present = records.filter(r => r.status === 'present').length;
                            const total = records.length;
                            const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

                            return {
                                ...batch,
                                attendanceStats: { present, total, percentage },
                                recentLogs: records.slice(0, 5) // Last 5 days
                            };
                        }
                    } catch (e) {
                        return { ...batch, attendanceStats: null, recentLogs: [] };
                    }
                }));

                setBatches(batchesWithStats);
            }
        } catch (error) {
            console.error('Fetch student batches error:', error);
            toast.error('Failed to load your enrolled batches');
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'present': return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
            case 'absent': return <XCircle className="w-4 h-4 text-red-600" />;
            case 'late': return <AlertCircle className="w-4 h-4 text-amber-600" />;
            default: return null;
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-24">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-[#0F172A] tracking-tight">My Batches</h1>
                    <p className="text-slate-500 mt-2 text-lg">Track your enrolled cohorts and daily attendance.</p>
                </div>

                {/* Institute Filter Toggle */}
                <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto self-start">
                    <button
                        onClick={() => setFilterScope('all')}
                        className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${filterScope === 'all' ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                        <Globe className="w-4 h-4" /> All Institutes
                    </button>
                    <button
                        onClick={() => setFilterScope('strict')}
                        className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${filterScope === 'strict' ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                        <Building2 className="w-4 h-4" /> This Institute Only
                    </button>
                </div>
            </div>

            {batches.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center shadow-sm">
                    <BookOpen className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-800">Not Enrolled Yet</h3>
                    <p className="text-slate-500 mt-2 max-w-md mx-auto">You have not been assigned to any specific student batches. Once your instructor adds you to a cohort, it will appear here.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {batches.map((batch) => (
                        <div key={batch._id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">

                            {/* Header / Course Info */}
                            <div className="p-6 border-b border-slate-100 flex items-start gap-4">
                                <div className="w-16 h-16 bg-indigo-50 rounded-xl border border-indigo-100 flex items-center justify-center shrink-0">
                                    <BookOpen className="w-8 h-8 text-indigo-500" />
                                </div>

                                <div className="flex-1 w-full">
                                    <div className="flex justify-between items-start">
                                        <h2 className="text-xl font-bold text-slate-900 line-clamp-1">{batch.name}</h2>
                                        <span className={`px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-lg ${batch.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {batch.status}
                                        </span>
                                    </div>
                                    <p className="text-slate-500 text-sm mt-1">{batch.courseId?.title}</p>

                                    <div className="flex items-center gap-2 mt-3 text-sm text-slate-600 font-medium">
                                        <img
                                            src={batch.tutorId?.userId?.profileImage || `https://ui-avatars.com/api/?name=${batch.tutorId?.userId?.name}`}
                                            alt=""
                                            className="w-5 h-5 rounded-full"
                                        />
                                        <span>Instructor: {batch.tutorId?.userId?.name}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 divide-x divide-slate-100 border-b border-slate-100 bg-slate-50/50">
                                <div className="p-4 flex flex-col gap-1">
                                    <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider">
                                        <Calendar className="w-3.5 h-3.5" /> Start Date
                                    </div>
                                    <span className="text-slate-900 font-semibold">{new Date(batch.startDate).toLocaleDateString()}</span>
                                </div>
                                <div className="p-4 flex flex-col gap-1">
                                    <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider">
                                        <Clock className="w-3.5 h-3.5" /> Schedule
                                    </div>
                                    <span className="text-slate-900 font-semibold truncate" title={batch.scheduleDescription}>{batch.scheduleDescription || 'Flexible'}</span>
                                </div>
                            </div>

                            {/* Attendance Section */}
                            <div className="p-6 bg-white flex-1">
                                <div className="flex justify-between items-end mb-4">
                                    <div>
                                        <h3 className="font-bold text-slate-800">Your Attendance</h3>
                                        <p className="text-xs text-slate-500 mt-0.5">Overall presence rate in this batch</p>
                                    </div>
                                    <div className="text-right">
                                        <span className={`text-2xl font-black ${batch.attendanceStats?.percentage >= 75 ? 'text-emerald-600' : batch.attendanceStats?.percentage >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                                            {batch.attendanceStats?.percentage || 0}%
                                        </span>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="w-full bg-slate-100 rounded-full h-2.5 mb-6 overflow-hidden">
                                    <div
                                        className={`h-2.5 rounded-full ${batch.attendanceStats?.percentage >= 75 ? 'bg-emerald-500' : batch.attendanceStats?.percentage >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                                        style={{ width: `${batch.attendanceStats?.percentage || 0}%` }}
                                    ></div>
                                </div>

                                {/* Recent Logs Timeline */}
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Recent Logs</h4>
                                    {batch.recentLogs && batch.recentLogs.length > 0 ? (
                                        batch.recentLogs.map((log) => (
                                            <div key={log._id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-1.5 rounded-md ${log.status === 'present' ? 'bg-emerald-100' : log.status === 'absent' ? 'bg-red-100' : 'bg-amber-100'}`}>
                                                        {getStatusIcon(log.status)}
                                                    </div>
                                                    <div>
                                                        <span className="block text-sm font-semibold text-slate-700 capitalize">{log.status}</span>
                                                        <span className="block text-xs text-slate-500">{new Date(log.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                                                    </div>
                                                </div>
                                                {log.remarks && (
                                                    <div className="text-xs text-slate-500 italic max-w-[120px] truncate" title={log.remarks}>
                                                        "{log.remarks}"
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-slate-500 italic">No attendance records documented yet.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
