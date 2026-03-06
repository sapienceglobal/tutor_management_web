'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
    BarChart3, CheckCircle, Clock, TrendingUp, Eye, Sparkles, Brain,
    Calendar, Target, BookOpen, Award, Zap, TrendingDown, AlertCircle
} from 'lucide-react';
import api from '@/lib/axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, LineChart, Line, Area, AreaChart } from 'recharts';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

export default function ResultsAnalyticsPage() {
    const [attempts, setAttempts] = useState([]);
    const [allExams, setAllExams] = useState([]);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('analytics');
    const [studyPlan, setStudyPlan] = useState(null);
    const [generatingPlan, setGeneratingPlan] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [historyRes, examsRes, coursesRes] = await Promise.all([
                    api.get('/exams/student/history-all'),
                    api.get('/exams/student/all'),
                    api.get('/enrollments/my-enrollments')
                ]);
                if (historyRes.data.success) setAttempts(historyRes.data.attempts || []);
                if (examsRes.data.success) setAllExams(examsRes.data.exams || []);
                if (coursesRes.data.success) {
                    const enrolledCourses = (coursesRes.data.enrollments || []).map(e => e.courseId);
                    setCourses(enrolledCourses);
                }
            } catch (error) {
                console.error('Error fetching analytics:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Generate AI Study Plan
    const generateStudyPlan = async () => {
        setGeneratingPlan(true);
        try {
            const response = await api.post('/ai/generate-study-plan', {
                performanceData: attempts,
                courses: courses,
                goals: ['improve_scores', 'complete_courses', 'master_weak_areas']
            });
            
            if (response.data.success) {
                setStudyPlan(response.data.studyPlan);
                setActiveTab('study-plan');
                toast.success('AI Study Plan Generated Successfully! 🎯');
            }
        } catch (error) {
            console.error('Error generating study plan:', error);
            toast.error('Failed to generate AI study plan');
        } finally {
            setGeneratingPlan(false);
        }
    };

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
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-800">AI Learning Hub</h1>
                <Button 
                    onClick={generateStudyPlan}
                    disabled={generatingPlan}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                >
                    {generatingPlan ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            Generating Plan...
                        </>
                    ) : (
                        <>
                            <Brain className="w-4 h-4 mr-2" />
                            Generate AI Study Plan
                        </>
                    )}
                </Button>
            </div>

            <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg">
                {['analytics', 'study-plan'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 px-4 py-2 rounded-md font-medium transition-all ${
                            activeTab === tab
                                ? 'bg-white text-indigo-600 shadow-sm'
                                : 'text-slate-600 hover:text-slate-800'
                        }`}
                    >
                        {tab === 'analytics' ? ' Analytics' : ' AI Study Plan'}
                    </button>
                ))}
            </div>

            {activeTab === 'analytics' && (
                <>
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

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                                <div className="h-55 flex items-center justify-center text-sm text-slate-400">No data yet</div>
                            )}
                        </div>

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
                                <div className="h-45 flex items-center justify-center text-sm text-slate-400">No data yet</div>
                            )}
                        </div>
                    </div>
                </>
            )}

            {activeTab === 'study-plan' && (
                <div className="space-y-6">
                    {studyPlan ? (
                        <>
                            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
                                <div className="flex items-center gap-3 mb-4">
                                    <Brain className="w-8 h-8 text-indigo-600" />
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-800">Your AI Study Plan</h2>
                                        <p className="text-sm text-slate-600">Personalized learning path based on your performance</p>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    {[
                                        { label: 'Study Duration', value: studyPlan.duration || '4 weeks', icon: Calendar },
                                        { label: 'Daily Goal', value: studyPlan.dailyGoal || '2 hours', icon: Target },
                                        { label: 'Focus Areas', value: studyPlan.focusAreas?.length || 3, icon: BookOpen },
                                        { label: 'Expected Improvement', value: studyPlan.expectedImprovement || '+15%', icon: TrendingUp },
                                    ].map((stat, i) => (
                                        <div key={i} className="bg-white rounded-lg p-3 text-center">
                                            <stat.icon className="w-5 h-5 text-indigo-600 mx-auto mb-1" />
                                            <p className="text-xs text-slate-500">{stat.label}</p>
                                            <p className="text-sm font-bold text-slate-800">{stat.value}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                                <div className="px-5 py-4 border-b border-slate-100">
                                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                        <Calendar className="w-5 h-5 text-indigo-600" />
                                        Weekly Schedule
                                    </h3>
                                </div>
                                <div className="p-5 space-y-3">
                                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, i) => (
                                        <div key={day} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                            <span className="font-medium text-slate-700">{day}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-indigo-600 font-medium">
                                                    {studyPlan.weeklySchedule?.[day] || 'Study & Practice'}
                                                </span>
                                                <Zap className="w-4 h-4 text-yellow-500" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                                <div className="px-5 py-4 border-b border-slate-100">
                                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                        <Target className="w-5 h-5 text-indigo-600" />
                                        Focus Areas
                                    </h3>
                                </div>
                                <div className="p-5">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {(studyPlan.focusAreas || [
                                            { area: 'Mathematics', priority: 'High', reason: 'Improve problem-solving speed' },
                                            { area: 'Science', priority: 'Medium', reason: 'Strengthen fundamentals' },
                                            { area: 'Language', priority: 'Low', reason: 'Maintain current level' },
                                            { area: 'Logic & Reasoning', priority: 'High', reason: 'Boost analytical skills' }
                                        ]).map((focus, i) => (
                                            <div key={i} className="border border-slate-200 rounded-lg p-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h4 className="font-semibold text-slate-800">{focus.area}</h4>
                                                    <span className={`px-2 py-1 text-xs font-bold rounded ${
                                                        focus.priority === 'High' ? 'bg-red-100 text-red-700' :
                                                        focus.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-green-100 text-green-700'
                                                    }`}>
                                                        {focus.priority} Priority
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-600">{focus.reason}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-100">
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                                    <Award className="w-5 h-5 text-emerald-600" />
                                    Recommended Actions
                                </h3>
                                <div className="space-y-3">
                                    {(studyPlan.recommendations || [
                                        'Complete 2 practice tests daily',
                                        'Review weak areas for 30 minutes',
                                        'Focus on time management during tests',
                                        'Take breaks between study sessions'
                                    ]).map((action, i) => (
                                        <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-lg">
                                            <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                                            <span className="text-sm text-slate-700">{action}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-16 bg-slate-50 rounded-xl">
                            <Brain className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                            <h3 className="text-xl font-bold text-slate-800 mb-2">No Study Plan Yet</h3>
                            <p className="text-slate-600 mb-6 max-w-md mx-auto">
                                Generate your personalized AI study plan to get targeted recommendations and improve your learning efficiency.
                            </p>
                            <Button 
                                onClick={generateStudyPlan}
                                disabled={generatingPlan}
                                className="bg-indigo-600 hover:bg-indigo-700"
                            >
                                {generatingPlan ? 'Generating...' : 'Generate AI Study Plan'}
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
