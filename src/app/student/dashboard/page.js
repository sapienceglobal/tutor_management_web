'use client';

import { useEffect, useState } from 'react';
import {
    BookOpen, Clock, TrendingUp, Calendar, ArrowRight,
    PlayCircle, FileText, Sparkles, BarChart3, Users,
    Brain, ChevronDown, ChevronUp, Award, Video
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { toast } from 'react-hot-toast';

export default function StudentDashboard() {
    const [enrollments, setEnrollments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        enrolledCourses: 0,
        completedCourses: 0,
        inProgress: 0,
    });
    const [history, setHistory] = useState([]);
    const [upcomingExams, setUpcomingExams] = useState([]);
    const [liveClassCount, setLiveClassCount] = useState(0);
    const [user, setUser] = useState({ name: 'Student' });
    const [activityData, setActivityData] = useState([]);
    const [batches, setBatches] = useState([]);

    // Collapsible right panels
    const [aiOpen, setAiOpen] = useState(true);
    const [announcementsOpen, setAnnouncementsOpen] = useState(true);
    const [batchPanelOpen, setBatchPanelOpen] = useState(true);

    const router = useRouter();

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // User Info
                try {
                    const userRes = await api.get('/auth/me');
                    if (userRes.data.success) setUser(userRes.data.user);
                } catch (err) { console.warn(err); }

                // Enrollments
                try {
                    const enrollRes = await api.get('/enrollments/my-enrollments');
                    if (enrollRes.data.success) {
                        const data = enrollRes.data.enrollments;
                        setEnrollments(data);
                        const completed = data.filter(e => e.progress?.percentage === 100).length;
                        setStats({
                            enrolledCourses: data.length,
                            completedCourses: completed,
                            inProgress: data.length - completed,
                        });
                    }
                } catch (err) { console.warn(err); }

                // Upcoming Exams
                try {
                    const examsRes = await api.get('/exams/student/all');
                    if (examsRes.data.success) {
                        const now = new Date();
                        const upcoming = examsRes.data.exams.filter(e =>
                            e.isScheduled && new Date(e.startDate) > now
                        ).sort((a, b) => new Date(a.startDate) - new Date(b.startDate)).slice(0, 5);
                        setUpcomingExams(upcoming);
                    }
                } catch (err) { console.warn(err); }

                // Live Classes count
                try {
                    const liveRes = await api.get('/live-classes/student');
                    if (liveRes.data.success) {
                        setLiveClassCount(liveRes.data.liveClasses?.length || 0);
                    }
                } catch (err) { console.warn(err); }

                // History
                try {
                    const historyRes = await api.get('/exams/student/history-all');
                    if (historyRes.data.success) {
                        setHistory(historyRes.data.attempts.slice(0, 6));
                    }
                } catch (err) { console.warn(err); }

                // Activity Data for chart
                try {
                    const activityRes = await api.get('/student/dashboard/activity');
                    if (activityRes.data.success) {
                        setActivityData(activityRes.data.activity);
                    }
                } catch (err) {
                    // Fallback chart data
                    setActivityData([
                        { month: 'Jan', score: 45 }, { month: 'Feb', score: 52 },
                        { month: 'Mar', score: 58 }, { month: 'Apr', score: 65 },
                        { month: 'May', score: 60 }, { month: 'Jun', score: 72 },
                        { month: 'Jul', score: 68 }, { month: 'Aug', score: 75 },
                        { month: 'Sep', score: 80 }, { month: 'Oct', score: 78 },
                        { month: 'Nov', score: 82 }, { month: 'Dec', score: 85 },
                    ]);
                }

                // Batches
                try {
                    const batchRes = await api.get('/batches/student/my-batches');
                    if (batchRes.data.success) {
                        setBatches(batchRes.data.batches?.slice(0, 4) || []);
                    }
                } catch (err) { console.warn(err); }

            } catch (error) {
                console.error('Dashboard load error:', error);
                toast.error("Failed to load dashboard data");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Calculate average score from history
    const avgScore = history.length > 0
        ? Math.round(history.reduce((acc, h) => acc + (h.totalMarks > 0 ? (h.score / h.totalMarks) * 100 : 0), 0) / history.length)
        : 0;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="w-14 h-14 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" />
                        </div>
                    </div>
                    <p className="text-slate-500 font-medium text-sm">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 font-sans">
            {/* Welcome Section */}
            <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full overflow-hidden border-3 border-indigo-200 shadow-md flex-shrink-0">
                    <img
                        src={user?.profileImage || "/default-avatar.png"}
                        alt={user?.name}
                        className="w-full h-full object-cover"
                    />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">
                        Welcome back, <span className="text-indigo-600">{user?.name?.split(' ')[0] || 'Student'}</span>
                    </h1>
                    <p className="text-sm text-slate-500">Here's what's happening with your learning today.</p>
                </div>
            </div>

            {/* Stat Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Enrolled Courses */}
                <Link href="/student/courses" className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all group">
                    <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-medium">Enrolled Courses</p>
                            <p className="text-2xl font-bold text-slate-800 mt-0.5">{stats.enrolledCourses}</p>
                            <div className="flex items-center gap-1 mt-1 text-indigo-600 text-xs font-semibold group-hover:underline">
                                View All <ArrowRight className="w-3 h-3" />
                            </div>
                        </div>
                    </div>
                </Link>

                {/* Upcoming Exams */}
                <Link href="/student/exams" className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all group">
                    <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-medium">Upcoming Exams</p>
                            <p className="text-2xl font-bold text-slate-800 mt-0.5">{upcomingExams.length}</p>
                            <div className="flex items-center gap-1 mt-1 text-emerald-600 text-xs font-semibold group-hover:underline">
                                View All <ArrowRight className="w-3 h-3" />
                            </div>
                        </div>
                    </div>
                </Link>

                {/* Live Classes */}
                <Link href="/student/live-classes" className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all group">
                    <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <Video className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-medium">Live Classes</p>
                            <p className="text-2xl font-bold text-slate-800 mt-0.5">{liveClassCount}</p>
                            <div className="flex items-center gap-1 mt-1 text-blue-600 text-xs font-semibold group-hover:underline">
                                View All <ArrowRight className="w-3 h-3" />
                            </div>
                        </div>
                    </div>
                </Link>

                {/* AI Recommendations */}
                <Link href="/student/ai-analytics" className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl p-5 shadow-sm hover:shadow-md transition-all group text-white">
                    <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                            <Brain className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-xs text-indigo-200 font-medium">AI Recommendations</p>
                            <button className="mt-2 px-4 py-1.5 bg-emerald-400 hover:bg-emerald-300 text-white text-xs font-bold rounded-lg transition-colors">
                                Start AI Study Plan
                            </button>
                        </div>
                    </div>
                </Link>
            </div>

            {/* Main Content Grid: Left + Right Sidebar */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* LEFT: Performance + Batch Details (2/3 width) */}
                <div className="xl:col-span-2 space-y-6">

                    {/* Performance Overview */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
                        <h2 className="text-lg font-bold text-slate-800 mb-4">Performance Overview</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Chart */}
                            <div className="md:col-span-2 h-56">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={activityData}>
                                        <defs>
                                            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                                        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} domain={[0, 100]} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 14px rgba(0,0,0,0.1)' }}
                                        />
                                        <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2.5} fill="url(#colorScore)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Score Summary */}
                            <div className="flex flex-col items-center justify-center bg-slate-50 rounded-xl p-4">
                                <div className="w-20 h-20 rounded-full border-4 border-indigo-500 flex items-center justify-center mb-3">
                                    <span className="text-2xl font-black text-slate-800">{avgScore}%</span>
                                </div>
                                <p className="text-sm font-bold text-slate-700">Score</p>
                                <div className="flex items-center gap-1 mt-1 text-xs text-emerald-600 font-semibold">
                                    <TrendingUp className="w-3.5 h-3.5" />
                                    This Month
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Batch Details */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-slate-800">Batch Details</h2>
                            <Link href="/student/batches" className="text-xs font-semibold text-indigo-600 hover:underline">View All</Link>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Left: Course Progress */}
                            <div className="space-y-3">
                                {enrollments.slice(0, 4).map((enrollment, i) => {
                                    const progress = enrollment.progress?.percentage || 0;
                                    const colors = ['bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-blue-500'];
                                    return (
                                        <Link key={enrollment._id} href={`/student/courses/${enrollment.courseId?._id}`} className="block">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-sm font-semibold text-slate-700 truncate max-w-[70%]">
                                                    {enrollment.courseId?.title || 'Course'}
                                                </span>
                                                <span className="text-sm font-bold text-slate-800">{progress}%</span>
                                            </div>
                                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                                <div className={`h-full ${colors[i % 4]} rounded-full transition-all duration-500`} style={{ width: `${progress}%` }}></div>
                                            </div>
                                        </Link>
                                    );
                                })}
                                {enrollments.length === 0 && (
                                    <p className="text-sm text-slate-400 italic">No enrolled courses yet.</p>
                                )}
                            </div>

                            {/* Right: Upcoming Tests */}
                            <div className="space-y-3">
                                {upcomingExams.slice(0, 4).map(exam => (
                                    <div key={exam._id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center">
                                                <FileText className="w-4 h-4 text-indigo-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-700 line-clamp-1">{exam.title}</p>
                                                <p className="text-xs text-slate-400">
                                                    {new Date(exam.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                </p>
                                            </div>
                                        </div>
                                        <Link
                                            href={`/student/exams/${exam._id}`}
                                            className="px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors"
                                        >
                                            Attempt
                                        </Link>
                                    </div>
                                ))}
                                {upcomingExams.length === 0 && (
                                    <p className="text-sm text-slate-400 italic">No upcoming exams.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Recent Results */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-slate-800">Recent Results</h2>
                            <Link href="/student/history" className="text-xs font-semibold text-indigo-600 hover:underline">View All</Link>
                        </div>
                        <div className="space-y-3">
                            {history.length > 0 ? history.slice(0, 4).map(attempt => (
                                <div key={attempt._id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold ${attempt.isPassed ? 'bg-emerald-500' : 'bg-red-500'}`}>
                                            {attempt.totalMarks > 0 ? Math.round((attempt.score / attempt.totalMarks) * 100) : 0}%
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-700 line-clamp-1">{attempt.examId?.title || 'Exam'}</p>
                                            <p className="text-xs text-slate-400">{new Date(attempt.submittedAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${attempt.isPassed ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                        {attempt.isPassed ? 'PASSED' : 'FAILED'}
                                    </span>
                                </div>
                            )) : (
                                <p className="text-sm text-slate-400 italic">No exam results yet.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDEBAR PANELS (1/3 width) */}
                <div className="space-y-4">

                    {/* AI Recommendations Panel */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                        <button
                            onClick={() => setAiOpen(!aiOpen)}
                            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <Brain className="w-5 h-5 text-indigo-600" />
                                <span className="text-sm font-bold text-slate-800">AI Recommendations</span>
                            </div>
                            {aiOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                        </button>
                        {aiOpen && (
                            <div className="px-4 pb-4 space-y-3">
                                <div className="flex items-center gap-3 p-2 bg-indigo-50 rounded-lg">
                                    <BookOpen className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                                    <span className="text-sm text-slate-700">Continue your enrolled courses</span>
                                </div>
                                <div className="flex items-center gap-3 p-2 bg-purple-50 rounded-lg">
                                    <FileText className="w-4 h-4 text-purple-500 flex-shrink-0" />
                                    <span className="text-sm text-slate-700">Practice upcoming exam topics</span>
                                </div>
                                <Link
                                    href="/student/ai-analytics"
                                    className="block w-full text-center py-2.5 bg-emerald-500 text-white text-sm font-bold rounded-lg hover:bg-emerald-600 transition-colors"
                                >
                                    Start AI Study Plan
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Instructor Announcements */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                        <button
                            onClick={() => setAnnouncementsOpen(!announcementsOpen)}
                            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <Users className="w-5 h-5 text-indigo-600" />
                                <span className="text-sm font-bold text-slate-800">Instructor Announcements</span>
                            </div>
                            {announcementsOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                        </button>
                        {announcementsOpen && (
                            <div className="px-4 pb-4 space-y-3">
                                {upcomingExams.length > 0 ? upcomingExams.slice(0, 3).map(exam => (
                                    <div key={exam._id} className="flex items-start gap-3 p-2 bg-slate-50 rounded-lg">
                                        <FileText className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                                        <p className="text-xs text-slate-600 leading-relaxed">
                                            <span className="font-semibold text-slate-800">{exam.title}</span> scheduled on {new Date(exam.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </p>
                                    </div>
                                )) : (
                                    <p className="text-xs text-slate-400 italic px-2">No announcements at this time.</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Quick Links Panel */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                        <button
                            onClick={() => setBatchPanelOpen(!batchPanelOpen)}
                            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-indigo-600" />
                                <span className="text-sm font-bold text-slate-800">Quick Links</span>
                            </div>
                            {batchPanelOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                        </button>
                        {batchPanelOpen && (
                            <div className="px-4 pb-4 space-y-1">
                                {[
                                    { label: 'My Batches', href: '/student/batches', icon: Users },
                                    { label: 'Results & Analytics', href: '/student/history', icon: BarChart3 },
                                    { label: 'Certificates', href: '/student/profile/certificates', icon: Award },
                                    { label: 'Profile', href: '/student/profile', icon: Users },
                                ].map(link => (
                                    <Link
                                        key={link.label}
                                        href={link.href}
                                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                                    >
                                        <link.icon className="w-4 h-4 text-slate-400" />
                                        {link.label}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}