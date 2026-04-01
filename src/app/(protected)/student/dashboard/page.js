'use client';

import { useEffect, useState } from 'react';
import {
    BookOpen, TrendingUp, ArrowRight, PlayCircle, FileText,
    Sparkles, BarChart3, Users, Brain, ChevronRight,
    Award, Video, CheckCircle2, Folder, ClipboardList, User, Zap, Flame,
    Loader2
} from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { C, T, S, cx, pageStyle } from '@/constants/studentTokens';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(date) {
    if (!date) return '';
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

// ─── FallbackImage ────────────────────────────────────────────────────────────
function FallbackImage({ src, alt, className }) {
    const defaultImg = 'https://images.unsplash.com/photo-1546374823-74e2d36d4bd2?auto=format&fit=crop&q=80&w=600';
    const [imgSrc, setImgSrc] = useState(src || defaultImg);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        setImgSrc(src || defaultImg);
        setHasError(false);
    }, [src]);

    if (hasError) {
        return (
            <div className={`flex items-center justify-center bg-slate-100 ${className}`}>
                <BookOpen className="w-6 h-6 text-slate-400" />
            </div>
        );
    }

    return (
        <img 
            src={imgSrc} alt={alt} className={className}
            onError={() => {
                if (imgSrc !== defaultImg) setImgSrc(defaultImg);
                else setHasError(true);
            }}
        />
    );
}

// ─── Chart Tooltip ────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
        return (
            <div className="rounded-xl px-3 py-2 shadow-xl"
                style={{ backgroundColor: '#1E1B4B', fontFamily: T.fontFamily, border: '1px solid rgba(255,255,255,0.1)' }}>
                <p style={{ fontSize: T.size.xs, fontWeight: T.weight.medium, color: 'rgba(255,255,255,0.7)', marginBottom: 2 }}>{label}</p>
                <p style={{ fontSize: T.size.lg, fontWeight: T.weight.black, color: '#ffffff' }}>{payload[0].value}%</p>
            </div>
        );
    }
    return null;
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function StudentDashboard() {
    const [enrollments, setEnrollments]           = useState([]);
    const [loading, setLoading]                   = useState(true);
    const [stats, setStats]                       = useState({ enrolledCourses: 0, completedCourses: 0, inProgress: 0 });
    const [history, setHistory]                   = useState([]);
    const [upcomingExams, setUpcomingExams]        = useState([]);
    const [liveClassCount, setLiveClassCount]     = useState(0);
    const [user, setUser]                         = useState({ name: 'Student' });
    const [activityData, setActivityData]         = useState([]);
    const [batches, setBatches]                   = useState([]);
    const [myInstitutes, setMyInstitutes]         = useState([]);
    const [currentInstitute, setCurrentInstitute] = useState(null);
    const [activeTab, setActiveTab]               = useState('institute');
    const router = useRouter();

    useEffect(() => {
        const fetchInitialConfig = async () => {
            try {
                try {
                    const institutesRes = await api.get('/membership/my-institutes');
                    if (institutesRes.data?.success) {
                        setMyInstitutes(institutesRes.data.institutes || []);
                        setCurrentInstitute(institutesRes.data.currentInstitute);
                        if (!institutesRes.data.currentInstitute) setActiveTab('global');
                    }
                } catch { setActiveTab('global'); }
                try {
                    const userRes = await api.get('/auth/me');
                    if (userRes.data.success) setUser(userRes.data.user);
                } catch {}
            } catch (err) { console.error('Initial load error:', err); }
        };
        fetchInitialConfig();
    }, []);

    useEffect(() => {
        const fetchContextData = async () => {
            setLoading(true);
            try {
                const s = `?scope=${activeTab}`;
                try {
                    const enrollRes = await api.get(`/enrollments/my-enrollments${s}`);
                    if (enrollRes.data.success) {
                        const data = enrollRes.data.enrollments;
                        setEnrollments(data);
                        const completed = data.filter(e => e.progress?.percentage === 100).length;
                        setStats({ enrolledCourses: data.length, completedCourses: completed, inProgress: data.length - completed });
                    }
                } catch {}
                try {
                    const examsRes = await api.get(`/exams/student/all${s}`);
                    if (examsRes.data.success) {
                        const now = new Date();
                        setUpcomingExams(examsRes.data.exams
                            .filter(e => e.isScheduled && new Date(e.startDate) > now)
                            .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
                            .slice(0, 5));
                    }
                } catch {}
                try {
                    const liveRes = await api.get(`/live-classes/student${s}`);
                    if (liveRes.data.success) setLiveClassCount(liveRes.data.liveClasses?.length || 0);
                } catch {}
                try {
                    const historyRes = await api.get(`/exams/student/history-all${s}`);
                    if (historyRes.data.success) setHistory(historyRes.data.attempts.slice(0, 6));
                } catch {}
                try {
                    const activityRes = await api.get(`/student/dashboard/activity${s}`);
                    if (activityRes.data.success) setActivityData(activityRes.data.activity);
                } catch { setActivityData([]); }
                try {
                    const batchRes = await api.get(`/batches/student/my-batches${s}`);
                    if (batchRes.data.success) setBatches(batchRes.data.batches?.slice(0, 4) || []);
                } catch {}
            } catch (err) {
                console.error('Dashboard load error:', err);
                toast.error('Failed to load dashboard data');
            } finally { setLoading(false); }
        };
        fetchContextData();
    }, [activeTab]);

    const avgScore = history.length > 0
        ? Math.round(history.reduce((acc, h) => acc + (h.totalMarks > 0 ? (h.score / h.totalMarks) * 100 : 0), 0) / history.length)
        : 0;

    const progressColors = ['#4F46E5', '#059669', '#EA580C', '#DB2777'];

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: C.pageBg }}>
            <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: C.btnPrimary }} />
                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.text, opacity: 0.7 }}>
                    Loading your workspace...
                </p>
            </div>
        </div>
    );

    const inProgressCourses = enrollments
        .filter(e => e.progress?.percentage > 0 && e.progress?.percentage < 100)
        .sort((a, b) => new Date(b.lastAccessedAt || b.updatedAt) - new Date(a.lastAccessedAt || a.updatedAt))
        .slice(0, 4);

    return (
        <div className="space-y-6 p-6 min-h-screen" style={{ fontFamily: T.fontFamily, backgroundColor: C.pageBg }}>

            {/* ── Gamified Hero Header ──────────────────────────────────────────── */}
            <div className="relative rounded-3xl p-6 md:p-8 overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6"
                style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                {/* Decorative Background Blob */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 pointer-events-none" />
                
                <div className="relative flex items-center gap-5 z-10">
                    <div className="relative shrink-0">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg" style={{ border: `2px solid ${C.cardBg}`, boxShadow: `0 0 0 3px ${C.btnPrimary}` }}>
                            <img src={user?.profileImage || '/default-avatar.png'} alt={user?.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-emerald-500 border-2 border-white rounded-full w-5 h-5" />
                    </div>
                    <div>
                        <p style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.text, opacity: 0.6, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' }}>
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short' })}
                        </p>
                        <h1 style={{ fontSize: T.size['3xl'], fontWeight: T.weight.black, color: C.heading, lineHeight: 1.1 }}>
                            Welcome back, <span style={{ color: C.btnPrimary }}>{user?.name?.split(' ')[0] || 'Learner'}</span> 👋
                        </h1>
                        <p style={{ fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.text, opacity: 0.7, marginTop: '4px' }}>
                            {currentInstitute ? `Studying at ${currentInstitute.name}` : 'Independent Global Learner'}
                        </p>
                    </div>
                </div>

                <div className="relative z-10 flex items-center gap-3">
                    {/* Gamification Stats */}
                    <div className="flex items-center gap-4 bg-slate-50/80 px-4 py-2.5 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                                <Flame className="w-4 h-4 text-orange-500" />
                            </div>
                            <div>
                                <p style={{ fontSize: '10px', fontWeight: T.weight.bold, color: C.text, opacity: 0.6, textTransform: 'uppercase', lineHeight: 1 }}>Streak</p>
                                <p style={{ fontSize: T.size.sm, fontWeight: T.weight.black, color: C.heading, lineHeight: 1.2 }}>3 Days</p>
                            </div>
                        </div>
                        <div className="w-px h-8 bg-slate-200" />
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                                <Zap className="w-4 h-4 text-indigo-500" />
                            </div>
                            <div>
                                <p style={{ fontSize: '10px', fontWeight: T.weight.bold, color: C.text, opacity: 0.6, textTransform: 'uppercase', lineHeight: 1 }}>XP Earned</p>
                                <p style={{ fontSize: T.size.sm, fontWeight: T.weight.black, color: C.heading, lineHeight: 1.2 }}>1,250</p>
                            </div>
                        </div>
                    </div>
                    
                    {/* Institute Switcher */}
                    {myInstitutes.length > 0 && (
                        <div className="flex items-center bg-slate-100 p-1 rounded-xl shrink-0 border border-slate-200">
                            {['institute', 'global'].map(tab => (
                                <button key={tab} onClick={() => setActiveTab(tab)}
                                    className="px-4 py-2 rounded-lg capitalize transition-all duration-200"
                                    style={activeTab === tab
                                        ? { backgroundColor: C.btnPrimary, color: '#fff', fontSize: T.size.sm, fontWeight: T.weight.bold, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }
                                        : { color: C.text, opacity: 0.7, fontSize: T.size.sm, fontWeight: T.weight.semibold }}>
                                    {tab === 'institute' ? 'My Institute' : 'Global'}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── BENTO GRID LAYOUT ─────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* LEFT COLUMN (Span 8) */}
                <div className="lg:col-span-8 space-y-6">
                    
                    {/* 1. Quick Stats Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                            { icon: Folder, value: stats.enrolledCourses, label: "Enrolled Courses", link: "/student/courses" },
                            { icon: ClipboardList, value: upcomingExams.length, label: "Upcoming Exams", link: "/student/exams" },
                            { icon: Video, value: liveClassCount, label: "Live Classes", link: "/student/live-classes" }
                        ].map((stat, i) => (
                            <Link key={i} href={stat.link} className="group p-5 rounded-3xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg flex flex-col justify-between"
                                style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, boxShadow: S.card, minHeight: '130px' }}>
                                <div className="flex items-start justify-between mb-2">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110" style={{ backgroundColor: C.iconBg }}>
                                        <stat.icon className="w-5 h-5" style={{ color: C.btnPrimary }} />
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ArrowRight className="w-4 h-4 text-slate-400" />
                                    </div>
                                </div>
                                <div>
                                    <p style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.text, opacity: 0.6, textTransform: 'uppercase' }}>{stat.label}</p>
                                    <p style={{ fontSize: T.size['3xl'], fontWeight: T.weight.black, color: C.heading, lineHeight: 1 }}>{stat.value}</p>
                                </div>
                            </Link>
                        ))}
                    </div>

                    {/* 2. Continue Learning Bento */}
                    {inProgressCourses.length > 0 && (
                        <div className="p-6 rounded-3xl" style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center">
                                        <PlayCircle className="w-4 h-4 text-indigo-600" />
                                    </div>
                                    <h2 style={{ fontSize: T.size.lg, fontWeight: T.weight.black, color: C.heading }}>Continue Learning</h2>
                                </div>
                                <Link href="/student/courses" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                                    View All <ChevronRight className="w-3 h-3" />
                                </Link>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {inProgressCourses.map((enrollment, i) => {
                                    const course = enrollment.courseId;
                                    const pct = enrollment.progress?.percentage || 0;
                                    const barColor = progressColors[i % progressColors.length];
                                    
                                    return (
                                        <Link key={enrollment._id} href={`/student/courses/${course?._id}`} className="group p-4 rounded-2xl transition-all hover:bg-slate-50"
                                            style={{ border: `1px solid ${C.cardBorder}` }}>
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-slate-200 shadow-sm">
                                                    <FallbackImage src={course?.thumbnail} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="truncate" style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>{course?.title}</h3>
                                                    <p style={{ fontSize: '11px', color: C.textMuted, fontWeight: T.weight.medium, marginTop: '2px' }}>
                                                        Last active: {timeAgo(enrollment.lastAccessedAt || enrollment.updatedAt)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex justify-between items-center mb-2">
                                                    <span style={{ fontSize: '11px', fontWeight: T.weight.bold, color: C.textMuted }}>{pct}% Completed</span>
                                                    <span style={{ fontSize: '11px', fontWeight: T.weight.black, color: barColor }} className="group-hover:translate-x-1 transition-transform">Resume →</span>
                                                </div>
                                                <div className="w-full h-2.5 rounded-full overflow-hidden bg-slate-100">
                                                    <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, backgroundColor: barColor }} />
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* 3. Performance Chart Bento */}
                    <div className="p-6 rounded-3xl flex flex-col md:flex-row gap-6" style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-6">
                                <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center">
                                    <BarChart3 className="w-4 h-4 text-blue-600" />
                                </div>
                                <h2 style={{ fontSize: T.size.lg, fontWeight: T.weight.black, color: C.heading }}>Performance Activity</h2>
                            </div>
                            <div className="h-48 w-full">
                                {activityData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={activityData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor={C.btnPrimary} stopOpacity={0.4} />
                                                    <stop offset="100%" stopColor={C.btnPrimary} stopOpacity={0.0} />
                                                </linearGradient>
                                            </defs>
                                            <XAxis dataKey="month" tick={{ fontSize: 10, fill: C.textMuted, fontWeight: 700 }} tickLine={false} axisLine={false} />
                                            <YAxis tick={{ fontSize: 10, fill: C.textMuted, fontWeight: 700 }} tickLine={false} axisLine={false} domain={[0, 100]} />
                                            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(0,0,0,0.05)', strokeWidth: 2 }} />
                                            <Area type="monotone" dataKey="score" stroke={C.btnPrimary} strokeWidth={3} fill="url(#chartGrad)" activeDot={{ r: 6, fill: C.btnPrimary, strokeWidth: 0 }} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-2xl">
                                        <TrendingUp size={24} color={C.textMuted} className="opacity-30 mb-2" />
                                        <p style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.textMuted }}>No activity data yet</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Combined Score Circular Card */}
                        <div className="shrink-0 w-full md:w-48 bg-slate-50 rounded-2xl p-5 flex flex-col items-center justify-center border border-slate-100">
                            <h3 style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Average Score</h3>
                            <div className="relative w-28 h-28 flex items-center justify-center rounded-full bg-white shadow-sm" style={{ border: `6px solid ${avgScore >= 70 ? '#10B981' : avgScore >= 40 ? '#F59E0B' : '#EF4444'}` }}>
                                <div className="absolute inset-2 rounded-full border border-slate-100 flex flex-col items-center justify-center">
                                    <span style={{ fontSize: T.size['2xl'], fontWeight: T.weight.black, color: C.heading, lineHeight: 1 }}>{avgScore}%</span>
                                </div>
                            </div>
                            <p className="mt-4 flex items-center gap-1.5" style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.btnPrimary }}>
                                <Award size={14} /> View History
                            </p>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN (Span 4) - Side Panels & AI */}
                <div className="lg:col-span-4 space-y-6">
                    
                    {/* 4. AI Magic Study Plan Card */}
                    <div className="relative rounded-3xl p-6 overflow-hidden transition-transform hover:-translate-y-1 shadow-lg"
                        style={{ background: 'linear-gradient(135deg, #1E1B4B 0%, #4338CA 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full mix-blend-overlay filter blur-3xl opacity-20 pointer-events-none" />
                        
                        <div className="relative z-10">
                            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center mb-4 border border-white/20 shadow-inner">
                                <Sparkles className="w-6 h-6 text-amber-300" />
                            </div>
                            <h2 style={{ fontSize: T.size.lg, fontWeight: T.weight.black, color: '#fff', marginBottom: '8px' }}>AI Study Buddy</h2>
                            <p style={{ fontSize: T.size.sm, color: 'rgba(255,255,255,0.7)', fontWeight: T.weight.medium, marginBottom: '24px', lineHeight: 1.5 }}>
                                Generate personalized quizzes, analyze your weak topics, and build a custom learning path.
                            </p>
                            
                            <Link href="/student/ai-analytics" className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-white text-indigo-900 transition-all hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-[1.02]"
                                style={{ fontSize: T.size.sm, fontWeight: T.weight.black }}>
                                <Brain className="w-4 h-4" /> Start AI Plan Now
                            </Link>
                        </div>
                    </div>

                    {/* 5. Instructor Announcements */}
                    <div className="p-5 rounded-3xl" style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center">
                                <Users className="w-4 h-4 text-amber-600" />
                            </div>
                            <h2 style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading }}>Announcements</h2>
                        </div>
                        
                        <div className="space-y-3">
                            {upcomingExams.length > 0 ? upcomingExams.slice(0, 3).map(exam => (
                                <div key={exam._id} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center shrink-0 mt-0.5">
                                        <FileText size={14} className="text-slate-400" />
                                    </div>
                                    <div>
                                        <p style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, lineHeight: 1.3, marginBottom: '4px' }}>
                                            {exam.title}
                                        </p>
                                        <p style={{ fontSize: '11px', fontWeight: T.weight.semibold, color: C.btnPrimary }}>
                                            Scheduled: {new Date(exam.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </p>
                                    </div>
                                </div>
                            )) : (
                                <div className="py-6 text-center">
                                    <p style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.textMuted }}>No new announcements.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 6. Quick Links Bento */}
                    <div className="p-5 rounded-3xl" style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                        <h2 style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Quick Actions</h2>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { label: 'My Batches', href: '/student/batches', icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                                { label: 'Reports',    href: '/student/history', icon: BarChart3, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                                { label: 'Profile',    href: '/student/profile', icon: User, color: 'text-orange-600', bg: 'bg-orange-50' },
                                { label: 'Support',    href: '/student/support', icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50' }
                            ].map(link => (
                                <Link key={link.label} href={link.href} className="p-3 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-colors flex flex-col items-center justify-center text-center gap-2">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${link.bg}`}>
                                        <link.icon size={16} className={link.color} />
                                    </div>
                                    <span style={{ fontSize: '11px', fontWeight: T.weight.bold, color: C.heading }}>{link.label}</span>
                                </Link>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}