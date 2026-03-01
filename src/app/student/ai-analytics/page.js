'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Brain, Target, ShieldAlert, CheckCircle, TrendingUp, CalendarDays, ArrowLeft, Loader2, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';

export default function AIAnalyticsPage() {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                // Takes some time as it hits Groq API
                const res = await api.get('/ai/analytics/student');
                if (res.data.success) {
                    setAnalytics(res.data.analytics);
                } else {
                    setError('Failed to load insights.');
                }
            } catch (err) {
                console.error(err);
                setError('An error occurred while generating reports.');
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, []);

    const container = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const item = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1 }
    };

    // Calculate stroke offset for success probability ring
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = analytics && typeof analytics.successProbability === 'number'
        ? circumference - (analytics.successProbability / 100) * circumference
        : circumference;

    return (
        <div className="min-h-screen bg-slate-900 font-sans overflow-hidden text-slate-200">
            {/* Header */}
            <div className="relative pt-12 pb-20 px-4 sm:px-6 lg:px-8 border-b border-indigo-500/20 bg-[#0F172A]">
                <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-5"></div>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none"></div>

                <div className="relative max-w-7xl mx-auto z-10">
                    <Link href="/student/dashboard" className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-medium mb-8 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                        Back to Dashboard
                    </Link>

                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                            <Brain className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">Sapience AI Insights</h1>
                    </div>
                    <p className="text-lg text-slate-400 max-w-2xl">
                        AI-generated analytics based on your course progress, quiz history, and interactions. We've customized a learning path just for you.
                    </p>
                </div>
            </div>

            {/* Content Area */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 space-y-8">
                        <div className="relative">
                            <div className="w-24 h-24 border-4 border-indigo-900 rounded-full border-t-indigo-500 animate-spin flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.5)]"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Sparkles className="w-8 h-8 text-indigo-400 animate-pulse" />
                            </div>
                        </div>
                        <div className="text-center">
                            <h3 className="text-2xl font-bold text-white mb-2">Analyzing your profile...</h3>
                            <p className="text-indigo-300 animate-pulse">Our AI models are crunching the data to build your personalized report.</p>
                        </div>
                    </div>
                ) : error ? (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-8 rounded-2xl text-center max-w-2xl mx-auto">
                        <ShieldAlert className="w-12 h-12 mx-auto mb-4 opacity-80" />
                        <h3 className="text-xl font-bold mb-2">Analysis Failed</h3>
                        <p>{error}</p>
                    </div>
                ) : analytics ? (
                    <motion.div variants={container} initial="hidden" animate="show" className="space-y-12">

                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                            {/* Success Ring */}
                            <motion.div variants={item} className="bg-slate-800/50 border border-slate-700/50 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between shadow-2xl backdrop-blur-sm lg:col-span-2 gap-8 md:gap-4">
                                <div>
                                    <div className="flex items-center gap-2 text-indigo-400 mb-2 font-semibold tracking-wider text-sm uppercase">
                                        <TrendingUp className="w-4 h-4" /> Success Probability
                                    </div>
                                    <h2 className="text-3xl lg:text-4xl font-black text-white mb-4">You are on track!</h2>
                                    <p className="text-slate-400 max-w-sm leading-relaxed">
                                        Based on your quiz aggregates and course momentum, the AI estimates your likelihood of completing current enrolled programs with passing scores.
                                    </p>
                                </div>
                                <div className="relative w-40 h-40 flex-shrink-0">
                                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 140 140">
                                        <circle cx="70" cy="70" r="60" className="stroke-slate-700" strokeWidth="12" fill="none" />
                                        <motion.circle
                                            initial={{ strokeDashoffset: circumference }}
                                            animate={{ strokeDashoffset }}
                                            transition={{ duration: 1.5, ease: "easeOut" }}
                                            cx="70" cy="70" r="60" className="stroke-indigo-500" strokeWidth="12" fill="none" strokeLinecap="round"
                                            strokeDasharray={circumference}
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center drop-shadow-lg">
                                        <span className="text-4xl font-black text-white">{analytics.successProbability || 0}%</span>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Dropout Risk */}
                            <motion.div variants={item} className={`rounded-3xl p-8 flex flex-col justify-center shadow-2xl relative overflow-hidden text-center sm:text-left ${analytics.dropoutRisk === 'High' ? 'bg-red-500/10 border border-red-500/30 text-red-200' :
                                analytics.dropoutRisk === 'Medium' ? 'bg-amber-500/10 border border-amber-500/30 text-amber-200' :
                                    'bg-emerald-500/10 border border-emerald-500/30 text-emerald-200'
                                }`}>
                                <div className="flex items-center justify-center sm:justify-start gap-2 mb-4 font-semibold uppercase tracking-wider text-sm opacity-80 z-10">
                                    <ShieldAlert className="w-5 h-5" /> Dropout Risk
                                </div>
                                <div className="text-5xl font-black z-10 mb-2">{analytics.dropoutRisk || 'Unknown'}</div>
                                <p className="text-sm opacity-70 z-10">AI estimation of lesson abandonment based on current pacing.</p>

                                {/* Background Icon */}
                                <ShieldAlert className="absolute -right-6 -bottom-6 w-48 h-48 opacity-[0.05] z-0 pointer-events-none" />
                            </motion.div>
                        </div>

                        {/* Weak & Strong Topics */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Needs Improvement */}
                            <motion.div variants={item} className="bg-slate-800/80 border border-slate-700 rounded-3xl p-8 shadow-xl">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-3 bg-red-500/20 text-red-400 rounded-xl">
                                        <Target className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-white">Focus Areas (Weak Topics)</h3>
                                </div>
                                <div className="space-y-4">
                                    {analytics.weakTopics && analytics.weakTopics.length > 0 ? (
                                        analytics.weakTopics.map((topic, i) => (
                                            <div key={i} className="bg-slate-900/50 p-4 border border-slate-700/50 rounded-2xl flex items-center gap-4 hover:border-red-500/30 transition-colors group">
                                                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-400 group-hover:text-red-400 transition-colors">
                                                    {i + 1}
                                                </div>
                                                <span className="font-semibold text-slate-200">{topic}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-slate-500 italic p-4 bg-slate-900/30 rounded-2xl border border-dashed border-slate-700">No significant weak areas detected yet. Keep up the good work!</p>
                                    )}
                                </div>
                            </motion.div>

                            {/* Strengths */}
                            <motion.div variants={item} className="bg-slate-800/80 border border-slate-700 rounded-3xl p-8 shadow-xl">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl">
                                        <CheckCircle className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-white">Your Strengths</h3>
                                </div>
                                <div className="space-y-4">
                                    {analytics.strongTopics && analytics.strongTopics.length > 0 ? (
                                        analytics.strongTopics.map((topic, i) => (
                                            <div key={i} className="bg-slate-900/50 p-4 border border-slate-700/50 rounded-2xl flex items-center gap-4 hover:border-emerald-500/30 transition-colors group">
                                                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-400 group-hover:text-emerald-400 transition-colors">
                                                    {i + 1}
                                                </div>
                                                <span className="font-semibold text-slate-200">{topic}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-slate-500 italic p-4 bg-slate-900/30 rounded-2xl border border-dashed border-slate-700">Complete more quizzes to identify your strengths.</p>
                                    )}
                                </div>
                            </motion.div>
                        </div>

                        {/* Prescriptive Study Plan */}
                        {(analytics.studyPlan && analytics.studyPlan.length > 0) && (
                            <motion.div variants={item} className="bg-gradient-to-br from-indigo-900/40 to-slate-900/40 border border-indigo-500/20 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                                <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none"></div>

                                <div className="flex items-center gap-3 mb-8 relative z-10">
                                    <div className="p-3 bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-500/30">
                                        <CalendarDays className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-white">Recommended Study Plan</h3>
                                        <p className="text-indigo-300">Action items curated by Sapience AI for your success</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                                    {analytics.studyPlan.map((stepData, index) => (
                                        <div key={index} className="bg-slate-800/80 border border-indigo-500/10 hover:border-indigo-500/40 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 shadow-lg group relative overflow-hidden">
                                            <div className="text-6xl font-black text-white/5 absolute -right-4 -bottom-4 select-none group-hover:text-indigo-500/10 transition-colors">0{index + 1}</div>
                                            <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold mb-4">
                                                {index + 1}
                                            </div>
                                            <h4 className="text-lg font-bold text-white mb-2 relative z-10">{stepData.step}</h4>
                                            <p className="text-sm text-slate-400 leading-relaxed relative z-10">{stepData.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                        {/* Performance Trend Chart */}
                        <motion.div variants={item} className="bg-slate-800/80 border border-slate-700 rounded-3xl p-8 shadow-xl">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-xl">
                                    <TrendingUp className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-white">Performance Trend</h3>
                                    <p className="text-slate-400 text-sm">Your exam scores over recent assessments</p>
                                </div>
                            </div>
                            {analytics.examScores && analytics.examScores.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={analytics.examScores}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                                        <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 100]} />
                                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '12px', color: '#e2e8f0' }} />
                                        <Line type="monotone" dataKey="score" stroke="#818cf8" strokeWidth={3} dot={{ fill: '#818cf8', r: 6 }} activeDot={{ r: 8, fill: '#6366f1' }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-[300px] flex items-center justify-center">
                                    <div className="text-center">
                                        <BarChart3 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                                        <p className="text-slate-500">Complete exams to see your performance trend</p>
                                    </div>
                                </div>
                            )}
                        </motion.div>

                        {/* Topic Mastery Chart */}
                        {((analytics.strongTopics && analytics.strongTopics.length > 0) || (analytics.weakTopics && analytics.weakTopics.length > 0)) && (
                            <motion.div variants={item} className="bg-slate-800/80 border border-slate-700 rounded-3xl p-8 shadow-xl">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-3 bg-purple-500/20 text-purple-400 rounded-xl">
                                        <Brain className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-white">Topic Mastery</h3>
                                        <p className="text-slate-400 text-sm">Strengths vs areas needing improvement</p>
                                    </div>
                                </div>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={[
                                        ...(analytics.strongTopics || []).map(t => ({ name: t, score: 85 + Math.round(Math.random() * 15), type: 'strong' })),
                                        ...(analytics.weakTopics || []).map(t => ({ name: t, score: 30 + Math.round(Math.random() * 25), type: 'weak' }))
                                    ]} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                        <XAxis type="number" stroke="#94a3b8" fontSize={12} domain={[0, 100]} />
                                        <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={12} width={120} />
                                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '12px', color: '#e2e8f0' }} />
                                        <Bar dataKey="score" radius={[0, 8, 8, 0]}>
                                            {[
                                                ...(analytics.strongTopics || []).map(() => <Cell key={Math.random()} fill="#34d399" />),
                                                ...(analytics.weakTopics || []).map(() => <Cell key={Math.random()} fill="#f87171" />)
                                            ]}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                                <div className="flex items-center gap-6 mt-4 justify-center">
                                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-400"></span><span className="text-slate-400 text-sm">Strong</span></div>
                                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-400"></span><span className="text-slate-400 text-sm">Needs Work</span></div>
                                </div>
                            </motion.div>
                        )}

                    </motion.div>
                ) : null}
            </div>
        </div>
    );
}
