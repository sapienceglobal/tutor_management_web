'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Zap,
    Clock,
    ArrowRight,
    Star,
    Trophy,
    Target,
    Activity,
    BrainCircuit
} from 'lucide-react';
import api from '@/lib/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { getAudienceDisplay, getAudienceScope } from '@/lib/audienceDisplay';

export default function StudentPracticeSetsPage() {
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');

    useEffect(() => {
        const fetchExams = async () => {
            try {
                const res = await api.get('/exams/student/all');
                if (res.data.success) {
                    // Filter for practice sets
                    setExams(res.data.exams.filter(e => e.type === 'practice'));
                }
            } catch (error) {
                console.error('Failed to load exams', error);
            } finally {
                setLoading(false);
            }
        };
        fetchExams();
    }, []);

    const filteredExams = useMemo(() => {
        return exams.filter(e => {
            const scope = getAudienceScope(e);
            if (activeTab === 'institute') return scope === 'institute' || scope === 'batch' || scope === 'private';
            if (activeTab === 'global') return scope === 'global';
            return true;
        });
    }, [exams, activeTab]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-medium animate-pulse">Loading practice sets...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <div className="max-w-7xl mx-auto p-6 lg:p-8 space-y-8">
                {/* Premium Header */}
                <div className="relative overflow-hidden bg-white/60 backdrop-blur-3xl rounded-[2.5rem] p-8 lg:p-12 border border-white/50 shadow-xl shadow-teal-100/50">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-teal-500/10 via-emerald-500/10 to-green-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 text-teal-600 text-xs font-bold uppercase tracking-wider mb-4 border border-teal-100">
                            <BrainCircuit className="w-3 h-3" />
                            Skill Building
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight leading-tight">
                            Sharpen Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-600">Skills</span>
                        </h1>
                        <p className="text-slate-600 text-lg lg:text-xl max-w-2xl leading-relaxed">
                            Unlimited practice to master your subjects. Learn from mistakes with immediate feedback.
                        </p>
                    </div>
                </div>

                {/* Scope Filter Tabs */}
                {exams.length > 0 && (
                    <div className="flex justify-end mb-4">
                        <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
                            {[
                                { id: 'all', label: 'All Practice Sets' },
                                { id: 'institute', label: 'My Institute' },
                                { id: 'global', label: 'Global' }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                                        activeTab === tab.id
                                            ? 'bg-white text-teal-600 shadow-sm'
                                            : 'text-slate-600 hover:text-slate-900 bg-transparent'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {filteredExams.length === 0 ? (
                    <div className="bg-white rounded-[2rem] border-2 border-dashed border-slate-200 p-12 text-center shadow-sm">
                        <div className="mx-auto h-24 w-24 bg-teal-50 rounded-full flex items-center justify-center mb-6 animate-pulse">
                            <Zap className="h-10 w-10 text-teal-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">No Practice Sets Available</h2>
                        <p className="text-slate-500 max-w-md mx-auto mt-2 mb-8">
                            {activeTab === 'all'
                                ? "There are no practice sets available for you right now."
                                : `No practice sets match the selected filter: ${activeTab === 'institute' ? 'My Institute' : 'Global'}.`}
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {filteredExams.map((exam, index) => (
                            <motion.div
                                key={exam._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-slate-100/60 hover:shadow-xl hover:border-teal-100 transition-all duration-300 flex flex-col h-full group relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-teal-50 to-transparent rounded-bl-[4rem] -mr-8 -mt-8 opacity-50 group-hover:from-emerald-50 transition-colors"></div>

                                    <div className="relative mb-6">
                                        <div className="flex justify-between items-start mb-4 flex-wrap gap-2">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wide text-slate-500 bg-slate-50 border-slate-200 py-1 px-2.5 rounded-full">
                                                    {exam.courseTitle || 'General Practice'}
                                                </Badge>
                                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] uppercase tracking-wider font-extrabold ${getAudienceDisplay(exam).badgeClass}`}>
                                                    {getAudienceDisplay(exam).label}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-0.5 text-amber-400">
                                                <Star className="w-3.5 h-3.5 fill-current" />
                                                <Star className="w-3.5 h-3.5 fill-current" />
                                                <Star className="w-3.5 h-3.5 fill-current" />
                                            </div>
                                        </div>

                                        <h3 className="font-bold text-xl text-slate-800 mb-2 line-clamp-2 group-hover:text-teal-600 transition-colors leading-tight min-h-[3.5rem]">
                                            {exam.title}
                                        </h3>

                                        <div className="flex items-center gap-4 text-sm text-slate-500 mt-4">
                                            <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                                                <Clock className="w-4 h-4 text-slate-400" />
                                                <span className="font-medium">{exam.duration}m</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                                                <Activity className="w-4 h-4 text-slate-400" />
                                                <span className="font-medium">{exam.totalQuestions} Qs</span>
                                            </div>
                                        </div>

                                        {exam.myAttemptCount > 0 && (
                                            <div className="mt-4 flex items-center gap-2 text-xs font-bold text-teal-600 bg-teal-50 p-2.5 rounded-xl border border-teal-100">
                                                <Trophy className="w-3.5 h-3.5" />
                                                <span>You've practiced {exam.myAttemptCount} times</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-auto pt-6 border-t border-slate-50">
                                        <Link href={`/student/exams/${exam._id}`} className="block w-full">
                                            <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-xl h-12 font-semibold shadow-lg shadow-teal-200 hover:shadow-teal-300 transition-all group-hover:scale-[1.02]">
                                                Start Practice
                                                <ArrowRight className="w-4 h-4 ml-2" />
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
