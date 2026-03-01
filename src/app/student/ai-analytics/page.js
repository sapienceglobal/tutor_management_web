'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
    BarChart3, CheckCircle, Clock, TrendingUp, Eye, Sparkles, Brain
} from 'lucide-react';
import api from '@/lib/axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

export default function ResultsAnalyticsPage() {
    const [attempts, setAttempts] = useState([]);
    const [allExams, setAllExams] = useState([]);
    const [loading, setLoading] = useState(true);

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
                console.error('Error fetching analytics:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Insights
    const insights = useMemo(() => {
        if (!attempts.length) return { avgScore: 0, completed: 0, pending: 0 };
        const totalPct = attempts.reduce((sum, a) => {
            const pct = a.totalMarks > 0 ? Math.round((a.score / a.totalMarks) * 100) : 0;
            return sum + pct;
        }, 0);
        const pending = allExams.filter(e => !e.isCompleted).length;
        return {
            avgScore: Math.round(totalPct / attempts.length),
            completed: attempts.length,
            pending,
        };
    }, [attempts, allExams]);

    // Performance trend (monthly bar chart)
    const performanceTrend = useMemo(() => {
        const monthMap = {};
        attempts.forEach(a => {
            const d = new Date(a.date || a.submittedAt || a.createdAt);
            const key = d.toLocaleDateString('en-US', { month: 'short' });
            if (!monthMap[key]) monthMap[key] = { name: key, total: 0, count: 0 };
            const pct = a.totalMarks > 0 ? Math.round((a.score / a.totalMarks) * 100) : 0;
            monthMap[key].total += pct;
            monthMap[key].count++;
        });
        return Object.values(monthMap).map(m => ({ name: m.name, avg: Math.round(m.total / m.count), count: m.count }));
    }, [attempts]);

    // Score distribution (pie)
    const scoreDistribution = useMemo(() => {
        const ranges = [
            { name: '90-100', min: 90, count: 0 },
            { name: '80-89', min: 80, count: 0 },
            { name: '70-79', min: 70, count: 0 },
            { name: 'Below 70', min: 0, count: 0 },
        ];
        attempts.forEach(a => {
            const pct = a.totalMarks > 0 ? Math.round((a.score / a.totalMarks) * 100) : 0;
            if (pct >= 90) ranges[0].count++;
            else if (pct >= 80) ranges[1].count++;
            else if (pct >= 70) ranges[2].count++;
            else ranges[3].count++;
        });
        return ranges.filter(r => r.count > 0);
    }, [attempts]);

    // Recent scores
    const recentScores = useMemo(() => {
        return [...attempts]
            .sort((a, b) => new Date(b.date || b.submittedAt) - new Date(a.date || a.submittedAt))
            .slice(0, 5);
    }, [attempts]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                    <p className="text-sm text-slate-500">Loading analytics...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 font-sans">
            {/* Header */}
            <h1 className="text-2xl font-bold text-slate-800">Performance Insights</h1>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { label: 'Average Score', value: `${insights.avgScore}%`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-100' },
                    { label: 'Completed Tests', value: insights.completed, icon: CheckCircle, color: 'text-indigo-600', bg: 'bg-indigo-100' },
                    { label: 'Tests Pending', value: insights.pending, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-100' },
                ].map(stat => (
                    <div key={stat.label} className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full ${stat.bg} flex items-center justify-center`}>
                            <stat.icon className={`w-6 h-6 ${stat.color}`} />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
                            <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Performance Trend */}
                <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-bold text-slate-800">Performance Trend</h2>
                        <span className="text-xs text-slate-400 font-medium">Monthly Average</span>
                    </div>
                    {performanceTrend.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={performanceTrend}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={[0, 100]} />
                                <Tooltip
                                    contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
                                    formatter={(value) => [`${value}%`, 'Avg Score']}
                                />
                                <Bar dataKey="avg" radius={[6, 6, 0, 0]} maxBarSize={40}>
                                    {performanceTrend.map((_, i) => (
                                        <Cell key={i} fill={i === performanceTrend.length - 1 ? '#6366f1' : '#a5b4fc'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[220px] flex items-center justify-center text-sm text-slate-400">No data yet</div>
                    )}
                </div>

                {/* Score Distribution */}
                <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
                    <h2 className="text-base font-bold text-slate-800 mb-4">Score Distribution</h2>
                    {scoreDistribution.length > 0 ? (
                        <div className="flex items-center gap-6">
                            <div className="w-40 h-40">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={scoreDistribution} dataKey="count" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={4}>
                                            {scoreDistribution.map((_, i) => (
                                                <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value, name) => [`${value} Tests`, name]} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="space-y-2">
                                {scoreDistribution.map((range, i) => (
                                    <div key={i} className="flex items-center gap-2 text-xs">
                                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                                        <span className="text-slate-500">{range.name}:</span>
                                        <span className="font-bold" style={{ color: COLORS[i % COLORS.length] }}>{range.count} Tests</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="h-[180px] flex items-center justify-center text-sm text-slate-400">No data yet</div>
                    )}
                </div>
            </div>

            {/* Recent Scores Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100">
                    <h2 className="text-lg font-bold text-slate-800">Recent Scores</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
                                <th className="px-5 py-3 text-left font-semibold">#</th>
                                <th className="px-5 py-3 text-left font-semibold">Test</th>
                                <th className="px-5 py-3 text-left font-semibold">Date Taken</th>
                                <th className="px-5 py-3 text-left font-semibold">Score</th>
                                <th className="px-5 py-3 text-left font-semibold">Status</th>
                                <th className="px-5 py-3 text-left font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {recentScores.length > 0 ? recentScores.map((item, idx) => {
                                const pct = item.totalMarks > 0 ? Math.round((item.score / item.totalMarks) * 100) : 0;
                                return (
                                    <tr key={item._id || idx} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-5 py-3.5 text-slate-500 font-medium">{idx + 1}</td>
                                        <td className="px-5 py-3.5 font-semibold text-slate-800">{item.examTitle || 'Test'}</td>
                                        <td className="px-5 py-3.5 text-slate-500 text-xs">
                                            {new Date(item.date || item.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            {', '}
                                            {new Date(item.date || item.submittedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-blue-500' : 'bg-red-500'}`}>
                                                    {pct}
                                                </span>
                                                <span className="font-bold text-slate-800">{pct}%</span>
                                                <span className="text-xs text-slate-400">{item.score} / {item.totalMarks}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className={`flex items-center gap-1 text-xs font-bold ${item.passed || item.isPassed ? 'text-emerald-600' : 'text-red-600'}`}>
                                                <CheckCircle className="w-3.5 h-3.5" />
                                                {item.passed || item.isPassed ? 'Completed' : 'Failed'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <Link href={`/student/exams/${item.examId || item._id}/result?attemptId=${item._id}`} className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors inline-block">
                                                <Eye className="w-3 h-3" /> View Report
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                                        <BarChart3 className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                                        No test results yet. Complete some tests to see analytics!
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
