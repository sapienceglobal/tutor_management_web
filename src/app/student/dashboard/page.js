'use client';

import { useEffect, useState } from 'react';
import { BookOpen, Award, Clock, TrendingUp, Target, Zap, Calendar, ArrowUpRight, Trophy, PlayCircle, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { EnrolledCourseCard } from '@/components/student/EnrolledCourseCard';
import { Card, CardContent } from '@/components/ui/card';

export default function StudentDashboard() {
    const [enrollments, setEnrollments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        completedCourses: 0,
        inProgress: 0,
        totalLearningHours: 0
    });
    const [history, setHistory] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch Enrollments
                const enrollRes = await api.get('/enrollments/my-enrollments');
                if (enrollRes.data.success) {
                    const data = enrollRes.data.enrollments;
                    setEnrollments(data);

                    const completed = data.filter(e => e.progress?.percentage === 100).length;
                    setStats(prev => ({
                        ...prev,
                        completedCourses: completed,
                        inProgress: data.length - completed
                    }));
                }

                try {
                    // Fetch Recent History
                    const historyRes = await api.get('/exams/student/history-all');
                    if (historyRes.data.success) {
                        setHistory(historyRes.data.attempts.slice(0, 3));
                    }
                } catch (historyError) {
                    console.warn('Failed to fetch history:', historyError);
                }

            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-600 font-medium">Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
            <div className="max-w-7xl mx-auto p-6 lg:p-8 space-y-8">
                {/* Hero Header */}
                <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl shadow-2xl p-8 lg:p-12">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30"></div>
                    <div className="relative">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                            <div>
                                <h1 className="text-4xl lg:text-5xl font-bold text-white mb-3">
                                    Welcome back! 👋
                                </h1>
                                <p className="text-indigo-100 text-lg lg:text-xl">
                                    Continue your learning journey and achieve your goals
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <Button
                                    asChild
                                    size="lg"
                                    className="bg-white text-indigo-600 hover:bg-indigo-50 shadow-xl hover:shadow-2xl transition-all duration-200"
                                >
                                    <Link href="/student/tutors" className="flex items-center gap-2">
                                        <Calendar className="w-5 h-5" />
                                        Book a Tutor
                                    </Link>
                                </Button>
                                <Button
                                    asChild
                                    size="lg"
                                    variant="outline"
                                    className="bg-white/10 backdrop-blur-sm text-white border-white/30 hover:bg-white/20 shadow-lg"
                                >
                                    <Link href="/student/courses" className="flex items-center gap-2">
                                        <BookOpen className="w-5 h-5" />
                                        Browse Courses
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* In Progress */}
                    <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600"></div>
                        <CardContent className="relative p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl group-hover:scale-110 transition-transform duration-300">
                                    <PlayCircle className="w-7 h-7 text-white" />
                                </div>
                                <div className="p-2 bg-white/10 backdrop-blur-sm rounded-lg">
                                    <TrendingUp className="w-5 h-5 text-white/80" />
                                </div>
                            </div>
                            <h3 className="text-5xl font-bold text-white mb-2">{stats.inProgress}</h3>
                            <p className="text-blue-100 font-medium">Courses in Progress</p>
                            <div className="mt-4 pt-4 border-t border-white/20">
                                <p className="text-blue-50 text-sm">Keep learning to reach your goals</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Completed */}
                    <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-emerald-600"></div>
                        <CardContent className="relative p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl group-hover:scale-110 transition-transform duration-300">
                                    <Trophy className="w-7 h-7 text-white" />
                                </div>
                                <div className="p-2 bg-white/10 backdrop-blur-sm rounded-lg">
                                    <CheckCircle className="w-5 h-5 text-white/80" />
                                </div>
                            </div>
                            <h3 className="text-5xl font-bold text-white mb-2">{stats.completedCourses}</h3>
                            <p className="text-emerald-100 font-medium">Completed Courses</p>
                            <div className="mt-4 pt-4 border-t border-white/20">
                                <p className="text-emerald-50 text-sm">Great job on finishing!</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Total Courses */}
                    <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-purple-600"></div>
                        <CardContent className="relative p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl group-hover:scale-110 transition-transform duration-300">
                                    <BookOpen className="w-7 h-7 text-white" />
                                </div>
                                <div className="p-2 bg-white/10 backdrop-blur-sm rounded-lg">
                                    <Target className="w-5 h-5 text-white/80" />
                                </div>
                            </div>
                            <h3 className="text-5xl font-bold text-white mb-2">{enrollments.length}</h3>
                            <p className="text-purple-100 font-medium">Total Enrollments</p>
                            <div className="mt-4 pt-4 border-t border-white/20">
                                <p className="text-purple-50 text-sm">Your learning library</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Activity - Exam History */}
                {history.length > 0 && (
                    <Card className="border-0 shadow-lg">
                        <div className="p-6 border-b bg-gradient-to-r from-slate-50 to-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">Recent Activity</h2>
                                    <p className="text-sm text-slate-600 mt-1">Your latest exam attempts</p>
                                </div>
                                <Link href="/student/history">
                                    <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
                                        View All
                                        <ArrowUpRight className="w-4 h-4 ml-1" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                        <CardContent className="p-6">
                            <div className="grid gap-4 md:grid-cols-3">
                                {history.map((attempt, idx) => (
                                    <div
                                        key={idx}
                                        className="p-4 bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all duration-200"
                                    >
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className={`p-2 rounded-lg ${attempt.score >= 70 ? 'bg-emerald-100' : 'bg-amber-100'
                                                }`}>
                                                <Award className={`w-5 h-5 ${attempt.score >= 70 ? 'text-emerald-600' : 'text-amber-600'
                                                    }`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-slate-900 truncate">
                                                    {attempt.examId?.title || 'Exam'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-slate-600">Score</span>
                                                <span className={`text-lg font-bold ${attempt.score >= 70 ? 'text-emerald-600' : 'text-amber-600'
                                                    }`}>
                                                    {attempt.score}%
                                                </span>
                                            </div>
                                            <div className="w-full bg-slate-200 rounded-full h-2">
                                                <div
                                                    className={`h-2 rounded-full transition-all duration-500 ${attempt.score >= 70 ? 'bg-emerald-600' : 'bg-amber-600'
                                                        }`}
                                                    style={{ width: `${attempt.score}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* My Learning Section */}
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900">My Learning</h2>
                            <p className="text-slate-600 mt-1">Continue where you left off</p>
                        </div>
                        <Link href="/student/appointments">
                            <Button
                                variant="outline"
                                className="bg-white hover:bg-slate-50 border-slate-200 shadow-sm hover:shadow transition-all duration-200"
                            >
                                <Calendar className="w-4 h-4 mr-2" />
                                My Appointments
                            </Button>
                        </Link>
                    </div>

                    {enrollments.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {enrollments.map(enrollment => (
                                <EnrolledCourseCard
                                    key={enrollment._id}
                                    course={enrollment}
                                />
                            ))}
                        </div>
                    ) : (
                        <Card className="border-2 border-dashed border-slate-300 bg-white shadow-lg hover:shadow-xl transition-all duration-300">
                            <CardContent className="p-12">
                                <div className="text-center max-w-md mx-auto">
                                    <div className="relative mx-auto w-24 h-24 mb-6">
                                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full animate-pulse"></div>
                                        <div className="relative w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                                            <BookOpen className="h-12 w-12 text-white" />
                                        </div>
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-900 mb-3">Start Your Learning Journey</h3>
                                    <p className="text-slate-600 mb-8 leading-relaxed">
                                        You haven't enrolled in any courses yet. Explore our extensive catalog and discover your next skill!
                                    </p>
                                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                        <Button
                                            size="lg"
                                            asChild
                                            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all duration-200"
                                        >
                                            <Link href="/student/courses" className="flex items-center gap-2">
                                                <BookOpen className="w-5 h-5" />
                                                Browse Courses
                                            </Link>
                                        </Button>
                                        <Button
                                            size="lg"
                                            variant="outline"
                                            asChild
                                            className="border-2 border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300"
                                        >
                                            <Link href="/student/tutors" className="flex items-center gap-2">
                                                <Calendar className="w-5 h-5" />
                                                Find a Tutor
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Link href="/student/courses" className="group">
                        <Card className="border-0 shadow-md hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-indigo-50">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                                        <BookOpen className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">All Courses</h3>
                                        <p className="text-xs text-slate-600 mt-0.5">Explore catalog</p>
                                    </div>
                                    <ArrowUpRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/student/tutors" className="group">
                        <Card className="border-0 shadow-md hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-purple-50">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                                        <Calendar className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-slate-900 group-hover:text-purple-600 transition-colors">Book Tutor</h3>
                                        <p className="text-xs text-slate-600 mt-0.5">Schedule sessions</p>
                                    </div>
                                    <ArrowUpRight className="w-5 h-5 text-slate-400 group-hover:text-purple-600 transition-colors" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/student/history" className="group">
                        <Card className="border-0 shadow-md hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-emerald-50">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                                        <Award className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors">Exam History</h3>
                                        <p className="text-xs text-slate-600 mt-0.5">View your results</p>
                                    </div>
                                    <ArrowUpRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/student/achievements" className="group">
                        <Card className="border-0 shadow-md hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-amber-50">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                                        <Trophy className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-slate-900 group-hover:text-amber-600 transition-colors">Achievements</h3>
                                        <p className="text-xs text-slate-600 mt-0.5">View progress</p>
                                    </div>
                                    <ArrowUpRight className="w-5 h-5 text-slate-400 group-hover:text-amber-600 transition-colors" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                </div>
            </div>
        </div>
    );
}