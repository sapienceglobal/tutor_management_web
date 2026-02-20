'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import {
    ArrowLeft,
    Trophy,
    Users,
    CheckCircle,
    XCircle,
    Clock,
    Search,
    Download,
    ChevronDown,
    ChevronUp,
    TrendingUp,
    TrendingDown,
    Minus,
    Calendar,
    Eye,
    BarChart3
} from 'lucide-react';

import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

export default function ExamResultsPage({ params }) {
    // Unwrap params using React.use() (Next.js 15/16+)
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
                if (res.data.success) {
                    setData(res.data);
                }
            } catch (error) {
                console.error('Error fetching results:', error);
            } finally {
                setLoading(false);
            }
        };

        if (examId) {
            fetchData();
        }
    }, [examId]);

    const toggleStudentExpansion = (studentId) => {
        const newExpanded = new Set(expandedStudents);
        if (newExpanded.has(studentId)) {
            newExpanded.delete(studentId);
        } else {
            newExpanded.add(studentId);
        }
        setExpandedStudents(newExpanded);
    };

    const getScoreTrend = (attempts) => {
        if (attempts.length < 2) return null;
        const sorted = [...attempts].sort((a, b) =>
            new Date(a.submittedAt) - new Date(b.submittedAt)
        );
        const first = sorted[0].percentage;
        const last = sorted[sorted.length - 1].percentage;
        const diff = last - first;

        if (diff > 5) return { icon: TrendingUp, color: 'text-green-600', label: 'Improving' };
        if (diff < -5) return { icon: TrendingDown, color: 'text-red-600', label: 'Declining' };
        return { icon: Minus, color: 'text-gray-600', label: 'Stable' };
    };

    const filteredStudents = data?.attempts.filter(item =>
        item.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.student.email.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-xl font-bold text-red-500">Error loading results</h2>
                <Button variant="link" asChild className="mt-4">
                    <Link href="/tutor/quizzes">Go Back</Link>
                </Button>
            </div>
        );
    }

    const { exam, overallStats } = data;

    return (
        <div className="space-y-8 p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                        <Link href="/tutor/quizzes" className="hover:text-primary transition-colors flex items-center gap-1">
                            <ArrowLeft className="w-4 h-4" />
                            Back to Exams
                        </Link>
                        <span>/</span>
                        <span>Results</span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">{exam.title}</h1>
                    <p className="text-gray-500">Performance Overview & Student Results</p>
                </div>
                <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                        <Trophy className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{overallStats.averageScore}%</div>
                        <p className="text-xs text-muted-foreground">Class average</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{overallStats.passRate}%</div>
                        <p className="text-xs text-muted-foreground">{overallStats.passedCount} students passed</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
                        <Clock className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{overallStats.totalAttempts}</div>
                        <p className="text-xs text-muted-foreground">Across {overallStats.uniqueStudents} students</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Unique Students</CardTitle>
                        <Users className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{overallStats.uniqueStudents}</div>
                        <p className="text-xs text-muted-foreground">Participated</p>
                    </CardContent>
                </Card>
            </div>

            {/* Students List */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Student Performance</h2>
                    <div className="relative w-64">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                            placeholder="Search student..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="rounded-md border bg-white">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12"></TableHead>
                                <TableHead>Student</TableHead>
                                <TableHead className="text-center">Attempts</TableHead>
                                <TableHead className="text-center">Best Score</TableHead>
                                <TableHead className="text-center">Trend</TableHead>
                                <TableHead className="text-center">Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredStudents.length > 0 ? (
                                filteredStudents.map((item) => {
                                    const trend = getScoreTrend(item.attempts);
                                    const isExpanded = expandedStudents.has(item.student._id);
                                    const sortedAttempts = [...item.attempts].sort((a, b) =>
                                        new Date(b.submittedAt) - new Date(a.submittedAt)
                                    );

                                    return (
                                        <React.Fragment key={item.student._id}>
                                            <TableRow className="hover:bg-slate-50">
                                                <TableCell>
                                                    <button
                                                        onClick={() => toggleStudentExpansion(item.student._id)}
                                                        className="p-1 hover:bg-slate-200 rounded transition-colors"
                                                    >
                                                        {isExpanded ? (
                                                            <ChevronUp className="w-4 h-4 text-slate-600" />
                                                        ) : (
                                                            <ChevronDown className="w-4 h-4 text-slate-600" />
                                                        )}
                                                    </button>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                                                            {item.student.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-slate-900">{item.student.name}</div>
                                                            <div className="text-xs text-slate-500">{item.student.email}</div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <div className="inline-flex items-center justify-center w-8 h-8 bg-slate-100 rounded-full font-bold text-slate-700">
                                                        {item.totalAttempts}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-lg font-bold text-slate-900">{item.bestScore}</span>
                                                        <span className="text-xs text-slate-500">/ {exam.totalMarks || exam.passingMarks}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {trend && (
                                                        <div className={`inline-flex items-center gap-1 ${trend.color} font-medium text-sm`}>
                                                            {React.createElement(trend.icon, { className: 'w-4 h-4' })}
                                                            <span>{trend.label}</span>
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge
                                                        variant={item.passed ? "default" : "destructive"}
                                                        className={item.passed ? "bg-green-600" : ""}
                                                    >
                                                        {item.passed ? (
                                                            <><CheckCircle className="w-3 h-3 mr-1" /> Passed</>
                                                        ) : (
                                                            <><XCircle className="w-3 h-3 mr-1" /> Failed</>
                                                        )}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => toggleStudentExpansion(item.student._id)}
                                                        className="hover:bg-indigo-50 hover:text-indigo-700"
                                                    >
                                                        {isExpanded ? 'Hide' : 'View'} Attempts
                                                    </Button>
                                                </TableCell>
                                            </TableRow>

                                            {/* Expanded Attempts Row */}
                                            {isExpanded && (
                                                <TableRow>
                                                    <TableCell colSpan={7} className="bg-slate-50 p-0">
                                                        <div className="p-6">
                                                            <h4 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                                                <Calendar className="w-4 h-4 text-indigo-600" />
                                                                Attempt History ({sortedAttempts.length} total)
                                                            </h4>
                                                            <div className="grid gap-3">
                                                                {sortedAttempts.map((attempt, idx) => (
                                                                    <div
                                                                        key={attempt._id}
                                                                        className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200 hover:shadow-md transition-shadow"
                                                                    >
                                                                        <div className="flex items-center gap-4">
                                                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold shadow-md ${attempt.isPassed
                                                                                ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white'
                                                                                : 'bg-gradient-to-br from-slate-400 to-slate-500 text-white'
                                                                                }`}>
                                                                                #{attempt.attemptNumber}
                                                                            </div>
                                                                            <div>
                                                                                <div className="flex items-center gap-2 mb-1">
                                                                                    <span className="font-bold text-lg text-slate-900">
                                                                                        {attempt.percentage}%
                                                                                    </span>
                                                                                    <span className="text-sm text-slate-600">
                                                                                        ({attempt.score}/{exam.totalMarks || exam.passingMarks})
                                                                                    </span>
                                                                                    <Badge
                                                                                        variant="outline"
                                                                                        className={attempt.isPassed ? "border-green-300 text-green-700" : "border-red-300 text-red-700"}
                                                                                    >
                                                                                        {attempt.isPassed ? 'Passed' : 'Failed'}
                                                                                    </Badge>
                                                                                </div>
                                                                                <div className="flex items-center gap-3 text-xs text-slate-500">
                                                                                    <span className="flex items-center gap-1">
                                                                                        <Calendar className="w-3 h-3" />
                                                                                        {new Date(attempt.submittedAt).toLocaleDateString('en-US', {
                                                                                            month: 'short',
                                                                                            day: 'numeric',
                                                                                            year: 'numeric',
                                                                                            hour: '2-digit',
                                                                                            minute: '2-digit'
                                                                                        })}
                                                                                    </span>
                                                                                    <span className="flex items-center gap-1">
                                                                                        <Clock className="w-3 h-3" />
                                                                                        {Math.floor(attempt.timeSpent / 60)}m {attempt.timeSpent % 60}s
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        <Button
                                                                            size="sm"
                                                                            onClick={() => setSelectedAttemptId(attempt._id)}
                                                                            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-md"
                                                                        >
                                                                            <Eye className="w-4 h-4 mr-2" />
                                                                            View Details
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
                                        <div className="flex flex-col items-center justify-center text-slate-500">
                                            <Users className="w-12 h-12 mb-2 opacity-50" />
                                            <p>No students found</p>
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
                <AttemptDetailsModal
                    attemptId={selectedAttemptId}
                    examTitle={exam.title}
                    onClose={() => setSelectedAttemptId(null)}
                />
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
                if (res.data.success) {
                    setDetails(res.data);
                }
            } catch (error) {
                console.error('Error fetching attempt details:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [attemptId]);

    if (!attemptId) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                                <BarChart3 className="w-7 h-7" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">Detailed Performance Report</h2>
                                <p className="text-indigo-100 text-sm mt-1">{examTitle}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                        >
                            <XCircle className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="text-center">
                                <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                <p className="text-slate-600">Loading detailed analytics...</p>
                            </div>
                        </div>
                    ) : details ? (
                        <div className="space-y-6">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className={`p-5 rounded-xl border-2 text-center shadow-md ${details.attempt.isPassed
                                    ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300'
                                    : 'bg-gradient-to-br from-red-50 to-rose-50 border-red-300'
                                    }`}>
                                    <div className="text-xs font-semibold text-slate-600 mb-1">Final Status</div>
                                    <div className={`text-2xl font-bold ${details.attempt.isPassed ? 'text-green-700' : 'text-red-700'}`}>
                                        {details.attempt.isPassed ? '✓ Passed' : '✗ Failed'}
                                    </div>
                                </div>
                                <div className="p-5 rounded-xl border-2 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-300 text-center shadow-md">
                                    <div className="text-xs font-semibold text-blue-700 mb-1">Score Achieved</div>
                                    <div className="text-2xl font-bold text-blue-900">
                                        {details.attempt.score}/{details.attempt.examId.totalMarks}
                                    </div>
                                    <div className="text-sm text-blue-600 mt-1">{details.attempt.percentage}%</div>
                                </div>
                                <div className="p-5 rounded-xl border-2 bg-gradient-to-br from-orange-50 to-amber-50 border-orange-300 text-center shadow-md">
                                    <div className="text-xs font-semibold text-orange-700 mb-1">Time Spent</div>
                                    <div className="text-2xl font-bold text-orange-900">
                                        {Math.floor(details.attempt.timeSpent / 60)}m {details.attempt.timeSpent % 60}s
                                    </div>
                                </div>
                                <div className="p-5 rounded-xl border-2 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-300 text-center shadow-md">
                                    <div className="text-xs font-semibold text-purple-700 mb-1">Attempt</div>
                                    <div className="text-2xl font-bold text-purple-900">
                                        #{details.attempt.attemptNumber}
                                    </div>
                                </div>
                            </div>

                            {/* Question Breakdown */}
                            {details.detailedResults && details.detailedResults.length > 0 ? (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                            <BarChart3 className="w-5 h-5 text-indigo-600" />
                                            Question-by-Question Analysis
                                        </h3>
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg font-semibold">
                                                ✓ {details.detailedResults.filter(q => q.isCorrect).length} Correct
                                            </span>
                                            <span className="px-3 py-1 bg-red-100 text-red-700 rounded-lg font-semibold">
                                                ✗ {details.detailedResults.filter(q => !q.isCorrect).length} Incorrect
                                            </span>
                                        </div>
                                    </div>
                                    {details.detailedResults.map((q, idx) => (
                                        <div
                                            key={idx}
                                            className={`p-5 rounded-xl border-2 transition-all ${q.isCorrect
                                                ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'
                                                : 'bg-gradient-to-br from-red-50 to-rose-50 border-red-200'
                                                }`}
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex items-start gap-3">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-md ${q.isCorrect ? 'bg-green-600' : 'bg-red-600'
                                                        }`}>
                                                        {idx + 1}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-semibold text-slate-900 text-base leading-relaxed">{q.question}</p>
                                                    </div>
                                                </div>
                                                <Badge variant={q.isCorrect ? "success" : "destructive"} className="shadow-sm">
                                                    {q.pointsEarned} / {q.pointsPossible} pts
                                                </Badge>
                                            </div>

                                            <div className="pl-13 space-y-3 mt-4">
                                                {/* Student Answer */}
                                                <div className={`p-3 rounded-lg border-2 ${q.isCorrect
                                                    ? 'bg-green-100 border-green-300'
                                                    : 'bg-red-100 border-red-300'
                                                    }`}>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-xs font-bold text-slate-700 uppercase">Student's Answer:</span>
                                                        {q.isCorrect && <CheckCircle className="w-4 h-4 text-green-600" />}
                                                        {!q.isCorrect && <XCircle className="w-4 h-4 text-red-600" />}
                                                    </div>
                                                    <p className={`font-medium ${q.isCorrect ? 'text-green-900' : 'text-red-900'}`}>
                                                        {(() => {
                                                            // Try to display from selectedIndex and options array
                                                            if (q.selectedIndex !== undefined && q.selectedIndex !== -1 && q.options && q.options[q.selectedIndex]) {
                                                                return q.options[q.selectedIndex];
                                                            }
                                                            // Fallback to selectedText if available
                                                            if (q.selectedText) {
                                                                return q.selectedText;
                                                            }
                                                            // Fallback to selectedOption if available
                                                            if (q.selectedOption) {
                                                                return q.selectedOption;
                                                            }
                                                            return "Not Answered";
                                                        })()}
                                                    </p>
                                                </div>

                                                {/* Correct Answer (if wrong) */}
                                                {!q.isCorrect && q.correctIndex !== undefined && q.options && (
                                                    <div className="p-3 rounded-lg border-2 bg-green-50 border-green-200">
                                                        <div className="text-xs font-bold text-green-700 uppercase mb-1">Correct Answer:</div>
                                                        <p className="font-medium text-green-900">{q.options[q.correctIndex]}</p>
                                                    </div>
                                                )}

                                                {/* Explanation */}
                                                {q.explanation && (
                                                    <div className="p-3 rounded-lg bg-blue-50 border-2 border-blue-200">
                                                        <div className="text-xs font-bold text-blue-700 uppercase mb-1">Explanation:</div>
                                                        <p className="text-sm text-blue-900 leading-relaxed">{q.explanation}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 bg-slate-50 rounded-xl">
                                    <BarChart3 className="w-16 h-16 text-slate-400 mx-auto mb-3" />
                                    <p className="text-slate-600 font-medium">Detailed question breakdowns are not available</p>
                                    <p className="text-sm text-slate-500 mt-1">This may be due to exam settings or data constraints</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-3" />
                            <p className="text-red-600 font-semibold">Failed to load attempt details</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t bg-slate-50 flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose}>Close</Button>
                </div>
            </div>
        </div>
    );
}
