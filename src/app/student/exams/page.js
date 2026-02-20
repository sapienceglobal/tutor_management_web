'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    FileText,
    Calendar,
    Timer,
    CheckCircle,
    ArrowRight,
    Trophy,
    Search,
    Filter
} from 'lucide-react';
import api from '@/lib/axios';
import { motion, AnimatePresence } from 'framer-motion';

export default function StudentExamsPage() {
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, upcoming, available, completed
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchExams = async () => {
            try {
                const res = await api.get('/student/exams/all');
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

    const filteredExams = exams.filter(exam => {
        const status = getStatus(exam);
        const matchesSearch = exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            exam.courseTitle?.toLowerCase().includes(searchTerm.toLowerCase());

        if (filter === 'all') return matchesSearch;
        return status === filter && matchesSearch;
    });

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-medium animate-pulse">Loading assessments...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <div className="max-w-7xl mx-auto p-6 lg:p-8 space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 mb-2">Exam Portal</h1>
                        <p className="text-slate-600">Access your scheduled assessments and practice tests.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search exams..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-64"
                            />
                        </div>
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                        >
                            <option value="all">All Status</option>
                            <option value="available">Available</option>
                            <option value="upcoming">Upcoming</option>
                            <option value="completed">Completed</option>
                        </select>
                    </div>
                </div>

                {filteredExams.length === 0 ? (
                    <div className="bg-white rounded-[2rem] border-2 border-dashed border-slate-200 p-12 text-center shadow-sm">
                        <div className="mx-auto h-24 w-24 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
                            <FileText className="h-10 w-10 text-indigo-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">No Exams Found</h2>
                        <p className="text-slate-500">Try adjusting your filters or check back later.</p>
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
                    >
                        {filteredExams.map((exam, index) => {
                            const status = getStatus(exam);
                            return (
                                <motion.div
                                    key={exam._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-slate-100 hover:shadow-lg hover:border-indigo-100 transition-all duration-300 flex flex-col h-full group relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-slate-50 to-transparent rounded-bl-[4rem] -mr-8 -mt-8 opacity-50 group-hover:from-indigo-50 transition-colors"></div>

                                        <div className="relative mb-6">
                                            <div className="flex justify-between items-start mb-4">
                                                <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 font-normal">
                                                    {exam.courseTitle || 'General'}
                                                </Badge>
                                                {status === 'completed' && <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100">Completed</Badge>}
                                                {status === 'upcoming' && <Badge className="bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100">Upcoming</Badge>}
                                                {status === 'expired' && <Badge className="bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-100">Expired</Badge>}
                                                {status === 'available' && <Badge className="bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100">Available</Badge>}
                                            </div>

                                            <h3 className="font-exoplore font-bold text-xl text-slate-800 mb-2 line-clamp-2 min-h-[3.5rem] group-hover:text-indigo-600 transition-colors">
                                                {exam.title}
                                            </h3>

                                            <p className="text-sm text-slate-500 mb-4 flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                                                By {exam.tutorName}
                                            </p>

                                            <div className="flex items-center gap-3 text-sm text-slate-500">
                                                <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                                                    <Timer className="w-3.5 h-3.5 text-slate-400" />
                                                    <span className="font-medium">{exam.duration}m</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                                                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                                                    <span className="font-medium">{exam.totalQuestions} Qs</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-auto pt-6 border-t border-slate-50">
                                            {status === 'upcoming' ? (
                                                <Button className="w-full bg-slate-100 text-slate-400 hover:bg-slate-100 cursor-not-allowed rounded-xl" disabled>
                                                    Starts {new Date(exam.startDate).toLocaleDateString()}
                                                </Button>
                                            ) : status === 'expired' ? (
                                                <Button variant="outline" className="w-full rounded-xl" disabled>
                                                    Expired
                                                </Button>
                                            ) : status === 'completed' ? (
                                                <Button variant="outline" className="w-full border-indigo-200 text-indigo-600 hover:bg-indigo-50 rounded-xl" asChild>
                                                    <Link href={`/student/exams/${exam._id}/result`}>
                                                        View Result
                                                    </Link>
                                                </Button>
                                            ) : (
                                                <Link href={`/student/exams/${exam._id}/take`} className="w-full block">
                                                    <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-100 hover:shadow-indigo-200 transition-all">
                                                        Start Exam
                                                        <ArrowRight className="w-4 h-4 ml-2" />
                                                    </Button>
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}
            </div>
        </div>
    );
}
