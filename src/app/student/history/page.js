'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
    FileText, Calendar, Timer, CheckCircle, ChevronLeft, ChevronRight,
    Download, BarChart3, Filter, Eye, Clock, ArrowRight
} from 'lucide-react';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';

const ITEMS_PER_PAGE = 10;

export default function StudentTestsPage() {
    const [attempts, setAttempts] = useState([]);
    const [allExams, setAllExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('completed');
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [historyRes, examsRes] = await Promise.all([
                    api.get('/exams/student/history-all'),
                    api.get('/exams/student/all'),
                ]);
                if (historyRes.data.success) setAttempts(historyRes.data.attempts || []);
                if (examsRes.data.success) setAllExams(examsRes.data.exams || []);
            } catch (error) {
                console.error('Error fetching tests data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Filter data by tab
    const upcomingExams = useMemo(() => allExams.filter(e => !e.isCompleted), [allExams]);
    const completedAttempts = useMemo(() => attempts, [attempts]);
    const gradedAttempts = useMemo(() => attempts.filter(a => a.score !== undefined && a.score !== null), [attempts]);

    const activeData = activeTab === 'upcoming' ? upcomingExams : activeTab === 'graded' ? gradedAttempts : completedAttempts;
    const totalPages = Math.ceil(activeData.length / ITEMS_PER_PAGE);
    const paginatedData = activeData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const getGrade = (pct) => {
        if (pct >= 90) return { label: 'A+', color: 'text-emerald-600' };
        if (pct >= 80) return { label: 'A', color: 'text-emerald-600' };
        if (pct >= 70) return { label: 'B+', color: 'text-blue-600' };
        if (pct >= 60) return { label: 'B', color: 'text-blue-600' };
        if (pct >= 50) return { label: 'C', color: 'text-amber-600' };
        return { label: 'D', color: 'text-red-600' };
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                    <p className="text-sm text-slate-500">Loading tests...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 font-sans">
            {/* Breadcrumb + Actions */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Link href="/student/dashboard" className="hover:text-indigo-600">Tests</Link>
                    <span>›</span>
                    <span className="font-semibold text-slate-800">{activeTab === 'upcoming' ? 'Upcoming Tests' : activeTab === 'graded' ? 'Graded Tests' : 'Completed Tests'}</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => toast('Certificate download coming soon!', { icon: '🎓' })}
                        className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors"
                    >
                        <Download className="w-3.5 h-3.5" /> Download Certificate
                    </button>
                    <Link href="/student/ai-analytics" className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                        <BarChart3 className="w-3.5 h-3.5" /> View Analytics
                    </Link>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1">
                {[
                    { key: 'upcoming', label: 'Upcoming' },
                    { key: 'completed', label: `Completed (${completedAttempts.length})` },
                    { key: 'graded', label: 'Graded' },
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => { setActiveTab(tab.key); setCurrentPage(1); }}
                        className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${activeTab === tab.key
                            ? 'bg-indigo-600 text-white' : 'text-slate-600 bg-white border border-slate-200 hover:bg-slate-50'}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100">
                    <h2 className="text-base font-bold text-slate-800">
                        {activeTab === 'upcoming' ? 'Upcoming Tests' : activeTab === 'graded' ? 'Graded Tests' : 'Completed Tests List'}
                    </h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
                                <th className="px-5 py-3 text-left font-semibold">#</th>
                                <th className="px-5 py-3 text-left font-semibold">Test Title</th>
                                <th className="px-5 py-3 text-left font-semibold">{activeTab === 'upcoming' ? 'Duration' : 'Course'}</th>
                                <th className="px-5 py-3 text-left font-semibold">Date</th>
                                {activeTab !== 'upcoming' && (
                                    <>
                                        <th className="px-5 py-3 text-left font-semibold">Score</th>
                                        <th className="px-5 py-3 text-left font-semibold">Status</th>
                                    </>
                                )}
                                <th className="px-5 py-3 text-left font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {paginatedData.length > 0 ? paginatedData.map((item, idx) => {
                                const isUpcoming = activeTab === 'upcoming';
                                const score = item.score || 0;
                                const totalMarks = item.totalMarks || 100;
                                const pct = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;
                                const grade = getGrade(pct);

                                return (
                                    <tr key={item._id || idx} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-5 py-3.5 text-slate-500 font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}</td>
                                        <td className="px-5 py-3.5 font-semibold text-slate-800">{item.examTitle || item.title || 'Test'}</td>
                                        <td className="px-5 py-3.5">
                                            {isUpcoming ? (
                                                <span className="text-slate-600">{item.duration} mins</span>
                                            ) : (
                                                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-md">{item.courseTitle || 'General'}</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-3.5 text-slate-500 text-xs">
                                            {new Date(item.date || item.submittedAt || item.startDate || item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </td>
                                        {!isUpcoming && (
                                            <>
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-slate-800">{score} / {totalMarks}</span>
                                                        <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                            <div className={`h-full rounded-full ${pct >= 60 ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${pct}%` }}></div>
                                                        </div>
                                                        <span className={`text-xs font-bold ${pct >= 60 ? 'text-emerald-600' : 'text-red-600'}`}>{pct}%</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${item.passed || item.isPassed ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                                        {item.passed || item.isPassed ? '✓ Passed' : 'Failed'}
                                                    </span>
                                                </td>
                                            </>
                                        )}
                                        <td className="px-5 py-3.5">
                                            {isUpcoming ? (
                                                <Link href={`/student/exams/${item._id}`} className="px-3 py-1.5 bg-emerald-500 text-white text-xs font-bold rounded-lg hover:bg-emerald-600 transition-colors inline-block">
                                                    Attempt Test
                                                </Link>
                                            ) : (
                                                <Link href={`/student/exams/${item.examId || item._id}/result?attemptId=${item._id}`} className="flex items-center gap-1 px-3 py-1.5 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg hover:bg-indigo-200 transition-colors inline-block">
                                                    <Eye className="w-3 h-3" /> View Report
                                                </Link>
                                            )}
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan={activeTab === 'upcoming' ? 5 : 7} className="px-5 py-12 text-center text-slate-400">
                                        <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                                        No {activeTab} tests found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                        Showing {Math.min(paginatedData.length, ITEMS_PER_PAGE)} of {activeData.length} • Total Tests {activeData.length}
                    </div>
                    {totalPages > 1 && (
                        <div className="flex items-center gap-2">
                            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="flex items-center gap-1 px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-40 transition-colors">
                                <ChevronLeft className="w-3.5 h-3.5" /> Previous
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => (
                                <button key={i} onClick={() => setCurrentPage(i + 1)} className={`w-8 h-8 font-bold rounded-lg transition-colors ${currentPage === i + 1 ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
                                    {i + 1}
                                </button>
                            ))}
                            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="flex items-center gap-1 px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-40 transition-colors">
                                Next <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
