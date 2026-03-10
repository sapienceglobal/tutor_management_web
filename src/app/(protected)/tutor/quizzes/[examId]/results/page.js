'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import {
    ArrowLeft, Trophy, Users, CheckCircle, XCircle, Clock,
    Search, Download, ChevronDown, ChevronUp, TrendingUp, TrendingDown,
    Minus, Calendar, Eye, BarChart3, FileQuestion, Loader2
} from 'lucide-react';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function ExamResultsPage({ params }) {
    const { examId } = use(params);
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedStudents, setExpandedStudents] = useState(new Set());
    const [selectedAttemptId, setSelectedAttemptId] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get(`/exams/${examId}/all-attempts`);
                if (res.data.success) setData(res.data);
            } catch (error) {
                console.error('Error fetching results:', error);
            } finally {
                setLoading(false);
            }
        };
        if (examId) fetchData();
    }, [examId]);

    const toggleStudentExpansion = (studentId) => {
        const newExpanded = new Set(expandedStudents);
        if (newExpanded.has(studentId)) newExpanded.delete(studentId);
        else newExpanded.add(studentId);
        setExpandedStudents(newExpanded);
    };

    const getScoreTrend = (attempts) => {
        if (attempts.length < 2) return null;
        const sorted = [...attempts].sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt));
        const diff = sorted[sorted.length - 1].percentage - sorted[0].percentage;
        if (diff > 5) return { icon: TrendingUp, color: 'text-emerald-600', label: 'Improving' };
        if (diff < -5) return { icon: TrendingDown, color: 'text-red-500', label: 'Declining' };
        return { icon: Minus, color: 'text-slate-500', label: 'Stable' };
    };

    const filteredStudents = data?.attempts.filter(item =>
        item.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.student.email.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                <p className="text-sm text-slate-400">Loading results...</p>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-base font-semibold text-red-500">Error loading results</h2>
                <Link href="/tutor/quizzes">
                    <Button variant="link" className="mt-3 text-orange-500">Go Back</Button>
                </Link>
            </div>
        );
    }

    const { exam, overallStats } = data;

    const statsConfig = [
        { label: 'Average Score', value: `${overallStats.averageScore}%`, sub: 'Class average', icon: Trophy, color: 'text-yellow-500', bg: 'bg-yellow-50', border: 'border-yellow-100' },
        { label: 'Pass Rate', value: `${overallStats.passRate}%`, sub: `${overallStats.passedCount} students passed`, icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100' },
        { label: 'Total Attempts', value: overallStats.totalAttempts, sub: `Across ${overallStats.uniqueStudents} students`, icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100' },
        { label: 'Unique Students', value: overallStats.uniqueStudents, sub: 'Participated', icon: Users, color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-100' },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                        <Link href="/tutor/quizzes" className="hover:text-orange-500 transition-colors flex items-center gap-1 font-medium">
                            <ArrowLeft className="w-3.5 h-3.5" /> Exams
                        </Link>
                        <span>/</span>
                        <span>Results</span>
                    </div>
                    <div className="flex items-center gap-2.5 mb-0.5">
                        <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center">
                            <BarChart3 className="w-4 h-4 text-orange-500" />
                        </div>
                        <h1 className="text-xl font-bold text-slate-800">{exam.title}</h1>
                    </div>
                    <p className="text-sm text-slate-400 pl-0.5">Performance Overview & Student Results</p>
                </div>
                <Button variant="outline" size="sm" className="border-slate-200 text-slate-600 gap-2 text-sm">
                    <Download className="w-4 h-4" /> Export CSV
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {statsConfig.map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                        <div key={i} className={`bg-white p-5 rounded-xl border ${stat.border} hover:shadow-md hover:-translate-y-0.5 transition-all duration-200`}>
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                                <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center`}>
                                    <Icon className={`w-4 h-4 ${stat.color}`} />
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-slate-800 leading-none mb-1">{stat.value}</p>
                            <p className="text-xs text-slate-400">{stat.sub}</p>
                        </div>
                    );
                })}
            </div>

            {/* Students Table */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-base font-semibold text-slate-800">Student Performance</h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input placeholder="Search student..." className="pl-9 w-56 h-9 text-sm border-slate-200 focus:border-orange-400 focus:ring-orange-500/10"
                            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                </div>

                <div className="rounded-xl border border-slate-100 bg-white overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/80">
                                <TableHead className="w-10"></TableHead>
                                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Student</TableHead>
                                <TableHead className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Attempts</TableHead>
                                <TableHead className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Best Score</TableHead>
                                <TableHead className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Trend</TableHead>
                                <TableHead className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</TableHead>
                                <TableHead className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredStudents.length > 0 ? (
                                filteredStudents.map((item) => {
                                    const trend = getScoreTrend(item.attempts);
                                    const isExpanded = expandedStudents.has(item.student._id);
                                    const sortedAttempts = [...item.attempts].sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

                                    return (
                                        <React.Fragment key={item.student._id}>
                                            <TableRow className="hover:bg-slate-50/50 transition-colors">
                                                <TableCell>
                                                    <button onClick={() => toggleStudentExpansion(item.student._id)}
                                                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-200 transition-colors">
                                                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
                                                    </button>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0">
                                                            {item.student.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-slate-800 text-sm">{item.student.name}</div>
                                                            <div className="text-xs text-slate-400">{item.student.email}</div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <span className="inline-flex items-center justify-center w-7 h-7 bg-slate-100 rounded-full font-bold text-slate-700 text-xs">
                                                        {item.totalAttempts}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-base font-bold text-slate-800">{item.bestScore}</span>
                                                        <span className="text-[10px] text-slate-400">/ {exam.totalMarks || exam.passingMarks}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {trend && (
                                                        <div className={`inline-flex items-center gap-1 ${trend.color} text-xs font-semibold`}>
                                                            {React.createElement(trend.icon, { className: 'w-3.5 h-3.5' })}
                                                            {trend.label}
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold
                                                        ${item.passed ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                                                        {item.passed ? <><CheckCircle className="w-3 h-3" /> Passed</> : <><XCircle className="w-3 h-3" /> Failed</>}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <button onClick={() => toggleStudentExpansion(item.student._id)}
                                                        className="text-xs text-orange-500 hover:text-orange-600 font-semibold px-2.5 py-1.5 rounded-lg hover:bg-orange-50 transition-colors">
                                                        {isExpanded ? 'Hide' : 'View'} Attempts
                                                    </button>
                                                </TableCell>
                                            </TableRow>

                                            {isExpanded && (
                                                <TableRow>
                                                    <TableCell colSpan={7} className="bg-slate-50/50 p-0">
                                                        <div className="p-5">
                                                            <h4 className="font-semibold text-slate-800 text-sm mb-3 flex items-center gap-2">
                                                                <Calendar className="w-4 h-4 text-orange-500" />
                                                                Attempt History ({sortedAttempts.length} total)
                                                            </h4>
                                                            <div className="space-y-2">
                                                                {sortedAttempts.map((attempt) => (
                                                                    <div key={attempt._id}
                                                                        className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-100 hover:shadow-sm transition-shadow">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm text-white shadow-sm
                                                                                ${attempt.isPassed ? 'bg-emerald-500' : 'bg-slate-400'}`}>
                                                                                #{attempt.attemptNumber}
                                                                            </div>
                                                                            <div>
                                                                                <div className="flex items-center gap-2 mb-0.5">
                                                                                    <span className="font-bold text-slate-800">{attempt.percentage}%</span>
                                                                                    <span className="text-xs text-slate-400">({attempt.score}/{exam.totalMarks || exam.passingMarks})</span>
                                                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold border
                                                                                        ${attempt.isPassed ? 'border-emerald-200 text-emerald-700 bg-emerald-50' : 'border-red-200 text-red-600 bg-red-50'}`}>
                                                                                        {attempt.isPassed ? 'Passed' : 'Failed'}
                                                                                    </span>
                                                                                </div>
                                                                                <div className="flex items-center gap-3 text-[10px] text-slate-400">
                                                                                    <span className="flex items-center gap-1">
                                                                                        <Calendar className="w-3 h-3" />
                                                                                        {new Date(attempt.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                                                    </span>
                                                                                    <span className="flex items-center gap-1">
                                                                                        <Clock className="w-3 h-3" />
                                                                                        {Math.floor(attempt.timeSpent / 60)}m {attempt.timeSpent % 60}s
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        <Button size="sm" onClick={() => setSelectedAttemptId(attempt._id)}
                                                                            className="bg-orange-500 hover:bg-orange-600 text-white gap-1.5 text-xs shadow-sm shadow-orange-200">
                                                                            <Eye className="w-3.5 h-3.5" /> View Details
                                                                        </Button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </React.Fragment>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-32 text-center">
                                        <div className="flex flex-col items-center justify-center text-slate-400">
                                            <Users className="w-10 h-10 mb-2 opacity-40" />
                                            <p className="text-sm">No students found</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Attempt Details Modal */}
            {selectedAttemptId && (
                <AttemptDetailsModal attemptId={selectedAttemptId} examTitle={exam.title} onClose={() => setSelectedAttemptId(null)} />
            )}
        </div>
    );
}

function AttemptDetailsModal({ attemptId, examTitle, onClose }) {
    const [loading, setLoading] = useState(true);
    const [details, setDetails] = useState(null);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const res = await api.get(`/exams/tutor/attempt/${attemptId}`);
                if (res.data.success) setDetails(res.data);
            } catch (error) { console.error('Error fetching attempt details:', error); }
            finally { setLoading(false); }
        };
        fetchDetails();
    }, [attemptId]);

    if (!attemptId) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-100">
                {/* Modal Header */}
                <div className="bg-white border-b border-slate-100 p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center">
                            <BarChart3 className="w-4 h-4 text-orange-500" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-slate-800">Detailed Performance Report</h2>
                            <p className="text-xs text-slate-400">{examTitle}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors">
                        <XCircle className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* Modal Content */}
                <div className="flex-1 overflow-y-auto p-5">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3">
                            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                            <p className="text-sm text-slate-400">Loading detailed analytics...</p>
                        </div>
                    ) : details ? (
                        <div className="space-y-5">
                            {/* Summary */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {[
                                    { label: 'Status', value: details.attempt.isPassed ? '✓ Passed' : '✗ Failed', color: details.attempt.isPassed ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-red-600 bg-red-50 border-red-200' },
                                    { label: 'Score', value: `${details.attempt.score}/${details.attempt.examId.totalMarks}`, sub: `${details.attempt.percentage}%`, color: 'text-blue-700 bg-blue-50 border-blue-200' },
                                    { label: 'Time Spent', value: `${Math.floor(details.attempt.timeSpent / 60)}m ${details.attempt.timeSpent % 60}s`, color: 'text-orange-700 bg-orange-50 border-orange-200' },
                                    { label: 'Attempt', value: `#${details.attempt.attemptNumber}`, color: 'text-slate-700 bg-slate-50 border-slate-200' },
                                ].map((item, i) => (
                                    <div key={i} className={`p-4 rounded-xl border text-center ${item.color}`}>
                                        <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70 mb-1">{item.label}</p>
                                        <p className="text-lg font-bold">{item.value}</p>
                                        {item.sub && <p className="text-xs opacity-70 mt-0.5">{item.sub}</p>}
                                    </div>
                                ))}
                            </div>

                            {/* Question Breakdown */}
                            {details.detailedResults && details.detailedResults.length > 0 ? (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                            <BarChart3 className="w-4 h-4 text-orange-500" /> Question Analysis
                                        </h3>
                                        <div className="flex gap-2 text-xs">
                                            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-lg font-bold">
                                                ✓ {details.detailedResults.filter(q => q.isCorrect).length} Correct
                                            </span>
                                            <span className="px-2.5 py-1 bg-red-100 text-red-600 rounded-lg font-bold">
                                                ✗ {details.detailedResults.filter(q => !q.isCorrect).length} Wrong
                                            </span>
                                        </div>
                                    </div>

                                    {details.detailedResults.map((q, idx) => (
                                        <div key={idx} className={`p-4 rounded-xl border-2 ${q.isCorrect ? 'bg-emerald-50/50 border-emerald-200' : 'bg-red-50/50 border-red-200'}`}>
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex items-start gap-3">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-white flex-shrink-0 ${q.isCorrect ? 'bg-emerald-500' : 'bg-red-500'}`}>
                                                        {idx + 1}
                                                    </div>
                                                    <p className="font-medium text-slate-800 text-sm leading-relaxed">{q.question}</p>
                                                </div>
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ml-3 flex-shrink-0 ${q.isCorrect ? 'bg-emerald-200 text-emerald-700' : 'bg-red-200 text-red-700'}`}>
                                                    {q.pointsEarned}/{q.pointsPossible} pts
                                                </span>
                                            </div>

                                            <div className="ml-11 space-y-2">
                                                <div className={`p-2.5 rounded-lg border text-sm ${q.isCorrect ? 'bg-emerald-100 border-emerald-300' : 'bg-red-100 border-red-300'}`}>
                                                    <p className="text-[10px] font-bold text-slate-600 uppercase mb-1">Student's Answer</p>
                                                    <p className={`font-medium ${q.isCorrect ? 'text-emerald-900' : 'text-red-900'}`}>
                                                        {q.selectedIndex !== undefined && q.selectedIndex !== -1 && q.options?.[q.selectedIndex]
                                                            ? q.options[q.selectedIndex]
                                                            : q.selectedText || q.selectedOption || "Not Answered"}
                                                    </p>
                                                </div>
                                                {!q.isCorrect && q.correctIndex !== undefined && q.options && (
                                                    <div className="p-2.5 rounded-lg border bg-emerald-50 border-emerald-200 text-sm">
                                                        <p className="text-[10px] font-bold text-emerald-700 uppercase mb-1">Correct Answer</p>
                                                        <p className="font-medium text-emerald-900">{q.options[q.correctIndex]}</p>
                                                    </div>
                                                )}
                                                {q.explanation && (
                                                    <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-sm">
                                                        <p className="text-[10px] font-bold text-blue-700 uppercase mb-1">Explanation</p>
                                                        <p className="text-blue-900 leading-relaxed text-xs">{q.explanation}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10 bg-slate-50 rounded-xl border border-slate-100">
                                    <BarChart3 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                    <p className="text-sm text-slate-500 font-medium">Detailed breakdowns not available</p>
                                    <p className="text-xs text-slate-400 mt-1">This may be due to exam settings</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <XCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                            <p className="text-sm text-red-500 font-semibold">Failed to load attempt details</p>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-slate-100 flex justify-end">
                    <Button variant="outline" onClick={onClose} className="border-slate-200 text-sm">Close</Button>
                </div>
            </div>
        </div>
    );
}