'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    BookOpen, Award, Clock, TrendingUp, Target, Zap, Calendar,
    ArrowUpRight, Trophy, PlayCircle, CheckCircle, FileText,
    Sparkles, MoreHorizontal, Bell, Search, Star, User
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { toast } from 'react-hot-toast';

export default function StudentDashboard() {
    const [enrollments, setEnrollments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        completedCourses: 0,
        inProgress: 0,
        totalLearningHours: 124
    });
    const [history, setHistory] = useState([]);
    const [upcomingExams, setUpcomingExams] = useState([]);
    const [upcomingAppointments, setUpcomingAppointments] = useState([]);
    const [user, setUser] = useState({ name: 'Student' });
    const [activityData, setActivityData] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const router = useRouter();

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            router.push(`/student/courses?search=${encodeURIComponent(searchTerm)}`);
        }
    };

    const handleViewStats = () => {
        router.push('/student/profile'); // Or /student/stats if it existed
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Get User Info
                try {
                    const userRes = await api.get('/auth/me');
                    if (userRes.data.success) {
                        setUser(userRes.data.user);
                    }
                } catch (err) {
                    console.warn("Failed to fetch user info:", err);
                }

                // Fetch Enrollments
                const enrollRes = await api.get('/enrollments/my-enrollments');
                if (enrollRes.data.success) {
                    const data = enrollRes.data.enrollments;
                    setEnrollments(data);

                    // Simple stats calculation
                    const completed = data.filter(e => e.progress?.percentage === 100).length;
                    setStats(prev => ({
                        ...prev,
                        completedCourses: completed,
                        inProgress: data.length - completed
                    }));
                }

                // Fetch History
                try {
                    const historyRes = await api.get('/exams/student/history-all');
                    if (historyRes.data.success) {
                        setHistory(historyRes.data.attempts.slice(0, 4));
                    }
                } catch (err) { console.warn(err); }

                // Fetch Upcoming Exams
                try {
                    const examsRes = await api.get('/exams/student/all');
                    if (examsRes.data.success) {
                        const now = new Date();
                        const upcoming = examsRes.data.exams.filter(e =>
                            e.isScheduled &&
                            new Date(e.startDate) > now
                        ).sort((a, b) => new Date(a.startDate) - new Date(b.startDate)).slice(0, 3);
                        setUpcomingExams(upcoming);
                    }
                } catch (err) { console.warn(err); }

                // Fetch Upcoming Appointments
                try {
                    const appointmentsRes = await api.get('/appointments');
                    if (appointmentsRes.data.success) {
                        const now = new Date();
                        const upcoming = appointmentsRes.data.appointments
                            .filter(apt =>
                                apt.status === 'confirmed' &&
                                new Date(apt.dateTime) > now
                            )
                            .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime))
                            .slice(0, 3);
                        setUpcomingAppointments(upcoming);
                    }
                } catch (err) { console.warn('Failed to fetch appointments:', err); }

                // Fetch Activity Data
                try {
                    const activityRes = await api.get('/student/dashboard/activity');
                    if (activityRes.data.success) {
                        setActivityData(activityRes.data.activity);
                    } else {
                        // Fallback or empty state if API exists but returns no data or specific structure
                        setActivityData([]);
                    }
                } catch (err) {
                    console.warn("Activity API not ready:", err);
                    setActivityData([]);
                }

            } catch (error) {
                console.error('Dashboard load error:', error);
                toast.error("Failed to load dashboard data");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1 }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50/50 backdrop-blur-3xl">
                <div className="flex flex-col items-center gap-6">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-indigo-600 animate-pulse" />
                        </div>
                    </div>
                    <p className="text-slate-500 font-medium tracking-wide animate-pulse">Designing your experience...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans overflow-hidden">
            {/* 1. Hero Section (Bizdire Style) */}
            <div
                data-scroll-section
                className="relative bg-[#0F172A] pt-12 pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden"
            >
                <div
                    data-scroll
                    data-scroll-speed="-2"
                    className="absolute inset-0 opacity-10 bg-[url('/grid-pattern.svg')]"
                ></div>
                <div
                    data-scroll
                    data-scroll-speed="2"
                    className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"
                ></div>

                <div className="relative max-w-4xl mx-auto text-center z-10">
                    <motion.h1
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight mb-6"
                        data-scroll
                        data-scroll-speed="1"
                    >
                        Welcome Back, <span className="text-orange-500">{user?.name?.split(' ')[0] || 'Student'}</span>!
                    </motion.h1>
                    <motion.p
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="text-lg text-slate-300 mb-10 max-w-2xl mx-auto"
                        data-scroll
                        data-scroll-speed="1"
                    >
                        Explore the biggest library of courses, track your progress, and achieve your goals with YaadKaro.
                    </motion.p>

                    {/* Search Bar (Bizdire Style) */}
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white/10 backdrop-blur-sm p-2 rounded-2xl md:rounded-full border border-white/20 max-w-3xl mx-auto shadow-2xl relative z-20"
                        data-scroll
                        data-scroll-speed="2"
                    >
                        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-2">
                            <div className="flex-1 relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="What do you want to learn today?"
                                    className="w-full h-12 md:h-14 pl-12 pr-4 rounded-xl md:rounded-l-full md:rounded-r-none bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="w-full md:w-48 relative border-t md:border-t-0 md:border-l border-white/20">
                                <select className="w-full h-12 md:h-14 pl-4 pr-10 rounded-xl md:rounded-none bg-white text-slate-700 focus:outline-none appearance-none cursor-pointer">
                                    <option>All Categories</option>
                                    <option>Development</option>
                                    <option>Business</option>
                                    <option>Design</option>
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <code className="text-[10px] text-slate-400">▼</code>
                                </div>
                            </div>
                            <Button type="submit" className="h-12 md:h-14 px-8 rounded-xl md:rounded-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg shadow-lg shadow-orange-500/20 transition-all hover:scale-105">
                                Search Now
                            </Button>
                        </form>
                    </motion.div>
                </div>
            </div>

            {/* 2. Stats & Overview (Overlapping Cards) */}
            <div
                data-scroll-section
                className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-20"
            >
                <div
                    data-scroll
                    data-scroll-speed="3"
                    className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6"
                >
                    {/* Stat Card 1 */}
                    <motion.div
                        className="bg-white p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 text-center flex flex-col items-center group cursor-pointer"
                        whileHover={{ y: -5 }}
                    >
                        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                            <BookOpen className="w-10 h-10 text-blue-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-1">In Progress</h3>
                        <p className="text-slate-500 text-sm mb-4">{stats.inProgress} Active Courses</p>
                        <span className="text-3xl font-black text-slate-800 group-hover:text-blue-600 transition-colors">{stats.inProgress}</span>
                    </motion.div>

                    {/* Stat Card 2 */}
                    <motion.div
                        className="bg-white p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 text-center flex flex-col items-center group cursor-pointer"
                        whileHover={{ y: -5 }}
                    >
                        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                            <Trophy className="w-10 h-10 text-emerald-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-1">Completed</h3>
                        <p className="text-slate-500 text-sm mb-4">{stats.completedCourses} Certificates</p>
                        <span className="text-3xl font-black text-slate-800 group-hover:text-emerald-600 transition-colors">{stats.completedCourses}</span>
                    </motion.div>

                    {/* Stat Card 3 */}
                    <motion.div
                        className="bg-white p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 text-center flex flex-col items-center group cursor-pointer"
                        whileHover={{ y: -5 }}
                    >
                        <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                            <Clock className="w-10 h-10 text-purple-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-1">Learning Time</h3>
                        <p className="text-slate-500 text-sm mb-4">Total Hours Spent</p>
                        <span className="text-3xl font-black text-slate-800 group-hover:text-purple-600 transition-colors">{stats.totalLearningHours}h</span>
                    </motion.div>

                    {/* Stat Card 4 (Action) */}
                    <div className="hidden lg:flex bg-orange-500 p-8 rounded-3xl shadow-xl shadow-orange-500/30 text-center flex-col items-center justify-center text-white cursor-pointer hover:bg-orange-600 transition-colors">
                        <TrendingUp className="w-16 h-16 mb-4" />
                        <h3 className="text-2xl font-bold mb-2">My Report</h3>
                        <p className="opacity-90 text-sm mb-6">View detailed analytics</p>
                        <Button onClick={handleViewStats} variant="secondary" className="bg-white text-orange-600 hover:bg-orange-50 border-none font-bold">
                            View Stats
                        </Button>
                    </div>
                </div>
            </div>

            {/* 3. Main Content Grid */}
            <div data-scroll-section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">

                {/* Latest Listings (Courses) */}
                <section data-scroll data-scroll-speed="1">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Latest Courses</h2>
                        <div className="w-24 h-1 bg-orange-500 mx-auto mt-4 rounded-full"></div>
                        <p className="text-slate-500 mt-4 max-w-2xl mx-auto">Continue where you left off or discover something new.</p>
                    </div>

                    {enrollments.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {enrollments.map((enrollment, i) => (
                                <motion.div
                                    key={enrollment._id}
                                    variants={item}
                                    className="bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group border border-slate-100 flex flex-col"
                                >
                                    <div className="h-48 bg-slate-200 relative overflow-hidden">
                                        <div className={`absolute inset-0 bg-gradient-to-br ${i % 3 === 0 ? 'from-blue-500 to-indigo-600' :
                                            i % 3 === 1 ? 'from-purple-500 to-pink-600' :
                                                'from-emerald-500 to-teal-600'
                                            }`}></div>
                                        <div className="absolute top-4 left-4">
                                            <span className="bg-white/20 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-lg border border-white/20">
                                                Module 2
                                            </span>
                                        </div>
                                        <div className="absolute bottom-4 right-4">
                                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-indigo-600 shadow-lg group-hover:scale-110 transition-transform">
                                                {i % 3 === 0 ? <Zap className="w-5 h-5 fill-current" /> : <BookOpen className="w-5 h-5" />}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 flex-1 flex flex-col">
                                        <h3 className="font-bold text-xl text-slate-900 mb-2 line-clamp-1 group-hover:text-orange-500 transition-colors">
                                            {enrollment.courseId?.title || "Untitled Course"}
                                        </h3>
                                        <div className="flex items-center gap-2 text-slate-500 text-sm mb-6">
                                            <User className="w-4 h-4" />
                                            <span>{enrollment.courseId?.tutorId?.userId?.name || "Tutor Name"}</span>
                                        </div>

                                        <div className="mt-auto">
                                            <div className="flex justify-between text-xs font-bold mb-2">
                                                <span className="text-slate-400">PROGRESS</span>
                                                <span className="text-slate-800">{enrollment.progress?.percentage || 0}%</span>
                                            </div>
                                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-orange-500 rounded-full transition-all duration-1000"
                                                    style={{ width: `${enrollment.progress?.percentage || 0}%` }}
                                                ></div>
                                            </div>
                                            <Button className="w-full mt-6 bg-[#0F172A] hover:bg-slate-800 text-white font-bold h-12 rounded-xl" asChild>
                                                <Link href={`/student/courses/${enrollment.courseId?._id}`}>Continue Learning</Link>
                                            </Button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <BookOpen className="w-10 h-10 text-slate-300" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-700 mb-2">Start Your Journey</h3>
                            <p className="text-slate-500 mb-8">You haven't enrolled in any courses yet.</p>
                            <Button className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 h-12 rounded-xl" asChild>
                                <Link href="/student/courses">Browse Catalog</Link>
                            </Button>
                        </div>
                    )}
                </section>

                {/* Grid: Upcoming & History */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Upcoming Schedule */}
                    <section
                        data-scroll
                        data-scroll-speed="2"
                        className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="font-bold text-2xl text-slate-900">Upcoming Schedule</h3>
                            <Link href="/student/appointments" className="text-sm font-bold text-orange-500 hover:text-orange-600">View All</Link>
                        </div>
                        <div className="space-y-4">
                            {/* Show Appointments First */}
                            {upcomingAppointments.length > 0 && upcomingAppointments.map(apt => (
                                <Link 
                                    key={apt._id} 
                                    href="/student/appointments"
                                    className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl hover:from-purple-100 hover:to-indigo-100 transition-all cursor-pointer group border border-purple-100"
                                >
                                    <div className="w-16 h-16 bg-white rounded-xl shadow-sm flex flex-col items-center justify-center border border-purple-200">
                                        <span className="text-xs font-bold text-purple-600 uppercase">{new Date(apt.dateTime).toLocaleDateString('en-US', { month: 'short' })}</span>
                                        <span className="text-xl font-black text-slate-800">{new Date(apt.dateTime).getDate()}</span>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-bold text-slate-800 group-hover:text-purple-600 transition-colors">{apt.tutorId?.userId?.name || 'Tutor Session'}</h4>
                                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-semibold">Class</span>
                                        </div>
                                        <p className="text-sm text-slate-600 flex items-center gap-1 mt-1">
                                            <Clock className="w-3.5 h-3.5" />
                                            {new Date(apt.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            {apt.tutorId?.categoryId?.name && <span className="ml-2 text-purple-600">• {apt.tutorId.categoryId.name}</span>}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                            
                            {/* Then Show Exams */}
                            {upcomingExams.length > 0 && upcomingExams.map(exam => (
                                <div key={exam._id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors cursor-pointer group">
                                    <div className="w-16 h-16 bg-white rounded-xl shadow-sm flex flex-col items-center justify-center border border-slate-200">
                                        <span className="text-xs font-bold text-slate-400 uppercase">{new Date(exam.startDate).toLocaleDateString('en-US', { month: 'short' })}</span>
                                        <span className="text-xl font-black text-slate-800">{new Date(exam.startDate).getDate()}</span>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-bold text-slate-800 group-hover:text-orange-500 transition-colors">{exam.title}</h4>
                                            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-semibold">Exam</span>
                                        </div>
                                        <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                                            <Clock className="w-3.5 h-3.5" />
                                            {new Date(exam.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            
                            {/* Empty State */}
                            {upcomingAppointments.length === 0 && upcomingExams.length === 0 && (
                                <p className="text-slate-500 italic">No upcoming schedule.</p>
                            )}
                        </div>
                    </section>

                    {/* Recent History */}
                    <section
                        data-scroll
                        data-scroll-speed="3"
                        className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="font-bold text-2xl text-slate-900">Recent Results</h3>
                            <Link href="/student/history" className="text-sm font-bold text-orange-500 hover:text-orange-600">View All</Link>
                        </div>
                        <div className="space-y-4">
                            {history.length > 0 ? history.map(attempt => (
                                <div key={attempt._id} className="flex items-center justify-between p-4 border border-slate-100 rounded-2xl">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${attempt.isPassed ? 'bg-emerald-500' : 'bg-red-500'
                                            }`}>
                                            {attempt.score >= 0 ? Math.round((attempt.score / attempt.totalMarks) * 100) : 0}%
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800 line-clamp-1">{attempt.examId?.title || "Exam"}</h4>
                                            <p className="text-xs text-slate-500">{new Date(attempt.submittedAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${attempt.isPassed ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                        {attempt.isPassed ? 'PASSED' : 'FAILED'}
                                    </span>
                                </div>
                            )) : (
                                <p className="text-slate-500 italic">No history available yet.</p>
                            )}
                        </div>
                    </section>
                </div>

            </div>
        </div>
    );
}