'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
    FileText, Timer, CheckCircle, ArrowRight, Clock, Search, Filter, Sparkles, Calendar
} from 'lucide-react';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { getAudienceDisplay } from '@/lib/audienceDisplay';

export default function StudentExamsPage() {
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchExams = async () => {
            try {
                // Only fetch enrolled exams (from enrolled courses)
                const res = await api.get('/exams/student/all');
                if (res.data.success) {
                    setExams(res.data.exams);
                }
            } catch (error) {
                console.error('Failed to load exams', error);
            } finally {
                setLoading(false);
            }
        };
        fetchExams();
    }, []);

    const getStatus = (exam) => {
        if (exam.isCompleted) return 'completed';
        if (exam.isScheduled) {
            const now = new Date();
            const start = new Date(exam.startDate);
            const end = new Date(exam.endDate);
            if (now < start) return 'upcoming';
            if (now > end) return 'expired';
        }
        return 'available';
    };

    const filteredExams = useMemo(() => {
        return exams.filter(exam => {
            const status = getStatus(exam);
            const matchesSearch = exam.title.toLowerCase().includes(searchTerm.toLowerCase());
            if (filter === 'all') return matchesSearch;
            return status === filter && matchesSearch;
        });
    }, [exams, filter, searchTerm]);

    // Stats
    const stats = useMemo(() => ({
        all: exams.length,
        available: exams.filter(e => getStatus(e) === 'available').length,
        upcoming: exams.filter(e => getStatus(e) === 'upcoming').length,
        completed: exams.filter(e => getStatus(e) === 'completed').length,
    }), [exams]);

    const statusConfig = {
        available: { label: 'Available', bg: 'bg-indigo-100', text: 'text-indigo-700' },
        upcoming: { label: 'Upcoming', bg: 'bg-amber-100', text: 'text-amber-700' },
        completed: { label: 'Completed', bg: 'bg-emerald-100', text: 'text-emerald-700' },
        expired: { label: 'Expired', bg: 'bg-red-100', text: 'text-red-700' },
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                    <p className="text-sm text-slate-500">Loading exams...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 font-sans">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">My Exams</h1>
                    <p className="text-sm text-slate-500 mt-1">Access exams from your enrolled courses</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search exams..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 pr-4 py-2 rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 text-sm w-64"
                    />
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Exams', count: stats.all, icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-100' },
                    { label: 'Available', count: stats.available, icon: ArrowRight, color: 'text-blue-600', bg: 'bg-blue-100' },
                    { label: 'Upcoming', count: stats.upcoming, icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-100' },
                    { label: 'Completed', count: stats.completed, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-100' },
                ].map(stat => (
                    <div key={stat.label} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full ${stat.bg} flex items-center justify-center`}>
                            <stat.icon className={`w-5 h-5 ${stat.color}`} />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
                            <p className={`text-xl font-bold ${stat.color}`}>{stat.count}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 flex-wrap">
                {[
                    { key: 'all', label: `All (${stats.all})` },
                    { key: 'available', label: `Available (${stats.available})` },
                    { key: 'upcoming', label: `Upcoming (${stats.upcoming})` },
                    { key: 'completed', label: `Completed (${stats.completed})` },
                ].map(f => (
                    <button
                        key={f.key}
                        onClick={() => setFilter(f.key)}
                        className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${filter === f.key
                            ? 'bg-indigo-600 text-white' : 'text-slate-600 bg-white border border-slate-200 hover:bg-slate-50'}`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Exam Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
                                <th className="px-5 py-3 text-left font-semibold">#</th>
                                <th className="px-5 py-3 text-left font-semibold">Exam Title</th>
                                <th className="px-5 py-3 text-left font-semibold">Duration</th>
                                <th className="px-5 py-3 text-left font-semibold">Questions</th>
                                <th className="px-5 py-3 text-left font-semibold">Status</th>
                                <th className="px-5 py-3 text-left font-semibold">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredExams.length > 0 ? filteredExams.map((exam, idx) => {
                                const status = getStatus(exam);
                                const cfg = statusConfig[status] || statusConfig.available;
                                const audienceInfo = getAudienceDisplay(exam);
                                return (
                                    <tr key={exam._id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-5 py-3.5 text-slate-500 font-medium">{idx + 1}</td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="font-semibold text-slate-800">{exam.title}</p>
                                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${audienceInfo.badgeClass}`}>
                                                    {audienceInfo.label}
                                                </span>
                                                {exam.isFree && (
                                                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full uppercase">Free</span>
                                                )}
                                            </div>
                                            {exam.courseTitle && <p className="text-xs text-slate-400 mt-0.5">{exam.courseTitle}</p>}
                                            <p className="text-[11px] text-slate-500 mt-0.5">{audienceInfo.reason}</p>
                                        </td>
                                        <td className="px-5 py-3.5 text-slate-600">
                                            <div className="flex items-center gap-1">
                                                <Timer className="w-3.5 h-3.5 text-slate-400" />
                                                {exam.duration} mins
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5 text-slate-600">{exam.totalQuestions || exam.questions?.length || '—'} Qs</td>
                                        <td className="px-5 py-3.5">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${cfg.bg} ${cfg.text}`}>
                                                {cfg.label}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            {status === 'available' ? (
                                                <Link href={`/student/exams/${exam._id}`} className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors inline-block">
                                                    Start Exam
                                                </Link>
                                            ) : status === 'completed' ? (
                                                <Link href={`/student/exams/${exam._id}/result${exam.lastAttemptId ? `?attemptId=${exam.lastAttemptId}` : ''}`} className="px-3 py-1.5 bg-slate-100 text-indigo-600 text-xs font-bold rounded-lg hover:bg-indigo-50 transition-colors inline-block">
                                                    View Result
                                                </Link>
                                            ) : status === 'upcoming' ? (
                                                <span className="px-3 py-1.5 bg-slate-100 text-slate-400 text-xs font-bold rounded-lg inline-block">
                                                    {new Date(exam.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                </span>
                                            ) : (
                                                <span className="px-3 py-1.5 bg-slate-100 text-slate-400 text-xs font-bold rounded-lg inline-block">Expired</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                                        <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                                        No exams found. Enroll in courses to access exams.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
