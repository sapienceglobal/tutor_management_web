'use client';

import { useEffect, useState } from 'react';
import {
    BookOpen, Clock, TrendingUp, Calendar, ArrowRight,
    PlayCircle, FileText, Sparkles, BarChart3, Users,
    Brain, ChevronDown, ChevronUp, Award, Video,
    Flame, Target, CheckCircle2, Star, Folder, Edit3,
    ClipboardList, User
} from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';
import { Progress } from '@/components/ui/progress';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { toast } from 'react-hot-toast';
import useInstitute from '@/hooks/useInstitute';
import { useRouter } from 'next/navigation';

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

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Redesigned Stat card matching screenshot */
function StatCard({ icon: Icon, value, label, href, iconBg, iconColor, isAI }) {
    const cardContent = (
        <div className={`relative rounded-2xl p-4 overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer
            ${isAI
                ? 'bg-[var(--theme-sidebar)] text-white shadow-md'
                : 'bg-white border border-slate-200/80 shadow-sm'}`}
            style={{ minHeight: '120px' }}>

            {/* Background decoration - subtle curve/wave */}
            {!isAI && (
                <div className="absolute right-0 bottom-0 w-24 h-16 opacity-10 pointer-events-none">
                    <svg viewBox="0 0 96 64" fill="none" className="w-full h-full">
                        <path d="M96 64 C70 64 60 20 0 30 L0 64 Z" fill="var(--theme-primary)" />
                    </svg>
                </div>
            )}

            <div className="relative flex flex-col h-full">
                {/* Top row: icon + label */}
                <div className="flex items-start gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isAI ? 'bg-amber-400/30' : iconBg}`}>
                        <Icon className={`w-5 h-5 ${isAI ? 'text-amber-300' : iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                        {isAI ? (
                            <p className="text-sm font-bold text-white leading-tight">{label}</p>
                        ) : (
                            <>
                                <p className="text-xs font-semibold text-slate-500 leading-tight">{label}</p>
                                <p className="text-3xl font-black text-slate-800 leading-tight mt-0.5">{value}</p>
                            </>
                        )}
                    </div>
                </div>

                {/* AI card CTA */}
                {isAI && (
                    <div className="mt-auto">
                        {/* Styled as span — outer card is already a Link, no nested <a> */}
                        <span className="block w-full py-2 px-3 bg-[var(--theme-primary)] hover:bg-[var(--theme-primary)]/90 text-white text-xs font-bold rounded-xl transition-colors mt-2 text-center">
                            Start AI Study Plan
                        </span>
                    </div>
                )}

                {/* View All button — span only, outer card Link handles navigation */}
                {!isAI && href && (
                    <div className="mt-auto pt-2">
                        {/* Using span instead of Link to avoid nested <a> inside the wrapping Link */}
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50 transition-colors">
                            View All <ArrowRight className="w-3 h-3" />
                        </span>
                    </div>
                )}
            </div>
        </div>
    );

    // Wrap entire card in Link (no inner Links to avoid nested <a>)
    // Both normal and AI cards wrapped in Link if href provided
    return href ? <Link href={href}>{cardContent}</Link> : cardContent;
}

/** Section header */
function SectionHeader({ icon: Icon, title, linkHref, linkLabel = 'View All' }) {
    return (
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[var(--theme-primary)]/20 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-[var(--theme-primary)]" />
                </div>
                <h2 className="text-base font-bold text-slate-800">{title}</h2>
            </div>
            {linkHref && (
                <Link href={linkHref} className="flex items-center gap-1 text-xs font-semibold text-[var(--theme-primary)] hover:text-[var(--theme-primary)] transition-colors">
                    {linkLabel} <ArrowRight className="w-3 h-3" />
                </Link>
            )}
        </div>
    );
}

/** Collapsible sidebar panel */
function SidePanel({ icon: Icon, title, open, onToggle, children }) {
    return (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <button onClick={onToggle}
                className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-slate-50/80 transition-colors">
                <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[var(--theme-primary)]/20 flex items-center justify-center">
                        <Icon className="w-4 h-4 text-[var(--theme-primary)]" />
                    </div>
                    <span className="text-sm font-bold text-slate-800">{title}</span>
                </div>
                {open
                    ? <ChevronUp className="w-4 h-4 text-slate-400" />
                    : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>
            {open && <div className="px-4 pb-4">{children}</div>}
        </div>
    );
}

// ─── Custom Tooltip for chart ─────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
        return (
            <div className="bg-[var(--theme-sidebar)] text-white text-xs rounded-xl px-3 py-2 shadow-xl">
                <p className="text-[var(--theme-primary)]/70 font-medium mb-0.5">{label}</p>
                <p className="font-bold text-lg">{payload[0].value}%</p>
            </div>
        );
    }
    return null;
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function StudentDashboard() {
    const [enrollments, setEnrollments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ enrolledCourses: 0, completedCourses: 0, inProgress: 0 });
    const [history, setHistory] = useState([]);
    const [upcomingExams, setUpcomingExams] = useState([]);
    const [liveClassCount, setLiveClassCount] = useState(0);
    const [user, setUser] = useState({ name: 'Student' });
    const [activityData, setActivityData] = useState([]);
    const [batches, setBatches] = useState([]);
    const institute = useInstitute();

    const [myInstitutes, setMyInstitutes] = useState([]);
    const [currentInstitute, setCurrentInstitute] = useState(null);
    const [activeTab, setActiveTab] = useState('institute');

    const [aiOpen, setAiOpen] = useState(true);
    const [announcementsOpen, setAnnouncementsOpen] = useState(true);
    const [batchPanelOpen, setBatchPanelOpen] = useState(true);

    const router = useRouter();

    // ── Fetch: initial config ────────────────────────────────────────────────
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
                } catch { }
            } catch (error) { console.error('Initial load error:', error); }
        };
        fetchInitialConfig();
    }, []);

    // ── Fetch: context data ──────────────────────────────────────────────────
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
                } catch { }

                try {
                    const examsRes = await api.get(`/exams/student/all${s}`);
                    if (examsRes.data.success) {
                        const now = new Date();
                        const upcoming = examsRes.data.exams
                            .filter(e => e.isScheduled && new Date(e.startDate) > now)
                            .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
                            .slice(0, 5);
                        setUpcomingExams(upcoming);
                    }
                } catch { }

                try {
                    const liveRes = await api.get(`/live-classes/student${s}`);
                    if (liveRes.data.success) setLiveClassCount(liveRes.data.liveClasses?.length || 0);
                } catch { }

                try {
                    const historyRes = await api.get(`/exams/student/history-all${s}`);
                    if (historyRes.data.success) setHistory(historyRes.data.attempts.slice(0, 6));
                } catch { }

                try {
                    const activityRes = await api.get(`/student/dashboard/activity${s}`);
                    if (activityRes.data.success) setActivityData(activityRes.data.activity);
                } catch { setActivityData([]); }

                try {
                    const batchRes = await api.get(`/batches/student/my-batches${s}`);
                    if (batchRes.data.success) setBatches(batchRes.data.batches?.slice(0, 4) || []);
                } catch { }

            } catch (error) {
                console.error('Dashboard load error:', error);
                toast.error('Failed to load dashboard data');
            } finally { setLoading(false); }
        };
        fetchContextData();
    }, [activeTab]);

    const avgScore = history.length > 0
        ? Math.round(history.reduce((acc, h) => acc + (h.totalMarks > 0 ? (h.score / h.totalMarks) * 100 : 0), 0) / history.length)
        : 0;

    // ── Loading state ────────────────────────────────────────────────────────
    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-3">
                <div className="relative w-12 h-12">
                    <div className="w-12 h-12 rounded-full border-[3px] border-[var(--theme-primary)]/30 border-t-[var(--theme-primary)] animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-[var(--theme-primary)] animate-pulse" />
                    </div>
                </div>
                <p className="text-sm text-slate-400 font-medium">Loading your dashboard…</p>
            </div>
        </div>
    );

    const inProgressCourses = enrollments
        .filter(e => e.progress?.percentage > 0 && e.progress?.percentage < 100)
        .sort((a, b) => new Date(b.lastAccessedAt || b.updatedAt) - new Date(a.lastAccessedAt || a.updatedAt))
        .slice(0, 3);

    return (
        /* Overall page background - soft lavender tint matching screenshot */
        <div className="space-y-5 pb-8 min-h-screen" style={{
            fontFamily: "var(--theme-font, 'DM Sans', sans-serif)",

        }}>

            {/* ── Welcome Header ────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="relative shrink-0">
                        <div className="w-14 h-14 rounded-2xl overflow-hidden ring-2 ring-[var(--theme-primary)] ring-offset-2 shadow-md">
                            <img
                                src={user?.profileImage || '/default-avatar.png'}
                                alt={user?.name}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        {/* Online dot */}
                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-[0.08em] mb-0.5">
                            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </p>
                        <h1 className="text-2xl font-black text-slate-900 leading-tight">
                            Hello, <span className="text-[var(--theme-primary)]">{user?.name?.split(' ')[0] || 'Student'}</span> 👋
                        </h1>
                        <p className="text-sm text-slate-400 mt-0.5">
                            {currentInstitute ? `Student at ${currentInstitute.name}` : 'Independent Learner · Global'}
                        </p>
                    </div>
                </div>

                {/* Institute / Global Switcher */}
                {myInstitutes.length > 0 && (
                    <div className="flex items-center gap-1 bg-white/70 rounded-xl p-1 self-start sm:self-auto shadow-sm">
                        <button onClick={() => setActiveTab('institute')}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150
                                ${activeTab === 'institute' ? 'bg-[var(--theme-sidebar)] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                            My Institute
                        </button>
                        <button onClick={() => setActiveTab('global')}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150
                                ${activeTab === 'global' ? 'bg-[var(--theme-sidebar)] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                            Global
                        </button>
                    </div>
                )}
            </div>

            {/* ── Institute Banner ──────────────────────────────────────────── */}
            {currentInstitute && activeTab === 'institute' && (
                <div className="relative rounded-2xl overflow-hidden"
                    style={{ background: 'linear-gradient(135deg, var(--theme-sidebar) 0%, var(--theme-sidebar) 50%, var(--theme-sidebar) 100%)' }}>
                    <div className="absolute inset-0 opacity-[0.06]"
                        style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                    <div className="relative flex items-center justify-between px-5 py-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                                <BookOpen className="w-5 h-5 text-[var(--theme-primary)]/70" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-sm">{currentInstitute.name}</h3>
                                <p className="text-[var(--theme-primary)]/70 text-xs">Access your institute courses &amp; resources</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 bg-white/15 text-[var(--theme-primary)]/70 text-[11px] font-bold rounded-full capitalize">
                                {currentInstitute.roleInInstitute}
                            </span>
                            <span className="px-2.5 py-1 bg-emerald-500/30 text-emerald-200 text-[11px] font-bold rounded-full capitalize">
                                {currentInstitute.status}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Stat Cards ────────────────────────────────────────────────── */}
            {/* Layout matches screenshot: 4 cards in a row, 3 normal + 1 AI dark card */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={Folder}
                    value={stats.enrolledCourses}
                    label="Enrolled Courses"
                    href="/student/courses"
                    iconBg="bg-[var(--theme-primary)]/15"
                    iconColor="text-[var(--theme-primary)]"
                />
                <StatCard
                    icon={ClipboardList}
                    value={upcomingExams.length}
                    label="Upcoming Exams"
                    href="/student/exams"
                    iconBg="bg-[var(--theme-primary)]/15"
                    iconColor="text-[var(--theme-primary)]"
                />
                <StatCard
                    icon={Video}
                    value={liveClassCount}
                    label="Live Classes"
                    href="/student/live-classes"
                    iconBg="bg-[var(--theme-primary)]/15"
                    iconColor="text-[var(--theme-primary)]"
                />
                {/* AI card - dark themed */}
                <StatCard
                    icon={Brain}
                    value={`${avgScore}%`}
                    label="AI Recommendations"
                    href="/student/ai-analytics"
                    isAI
                />
            </div>

            {/* ── Continue Learning ─────────────────────────────────────────── */}
            {inProgressCourses.length > 0 && (
                <div>
                    <SectionHeader icon={PlayCircle} title="Continue Learning" linkHref="/student/courses" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {inProgressCourses.map(enrollment => {
                            const course = enrollment.courseId;
                            const pct = enrollment.progress?.percentage || 0;
                            return (
                                <Link key={enrollment._id} href={`/student/courses/${course?._id}`}
                                    className="group bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--theme-sidebar)] to-[var(--theme-primary)] flex items-center justify-center overflow-hidden shrink-0">
                                            {course?.thumbnail
                                                ? <img src={course.thumbnail} alt="" className="w-full h-full object-cover" />
                                                : <BookOpen className="w-5 h-5 text-white" />}
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="text-sm font-bold text-slate-800 truncate group-hover:text-[var(--theme-primary)] transition-colors">
                                                {course?.title}
                                            </h3>
                                            <p className="text-[11px] text-slate-400 mt-0.5">{timeAgo(enrollment.lastAccessedAt || enrollment.updatedAt)}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-[11px] font-semibold mb-1.5">
                                            <span className="text-slate-500">{pct}% complete</span>
                                            <span className="text-[var(--theme-primary)] group-hover:underline">Resume →</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-[var(--theme-primary)] to-[var(--theme-accent)] rounded-full transition-all duration-700"
                                                style={{ width: `${pct}%` }} />
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── Main Grid: Left + Right ───────────────────────────────────── */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

                {/* ── LEFT 2/3 ──────────────────────────────────────────────── */}
                <div className="xl:col-span-2 space-y-5">

                    {/* Performance Card */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
                        <SectionHeader icon={TrendingUp} title="Performance Overview" />

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Chart - left 2/3 */}
                            <div className="md:col-span-2 h-52">
                                {activityData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={activityData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="var(--theme-primary)" stopOpacity={0.25} />
                                                    <stop offset="100%" stopColor="var(--theme-primary)" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                                            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} domain={[0, 100]} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Area type="monotone" dataKey="score" stroke="var(--theme-primary)" strokeWidth={2.5}
                                                fill="url(#grad)" dot={{ r: 3, fill: 'var(--theme-primary)', strokeWidth: 0 }}
                                                activeDot={{ r: 5, fill: 'var(--theme-primary)' }} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full gap-2">
                                        <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center">
                                            <TrendingUp className="w-6 h-6 text-slate-300" />
                                        </div>
                                        <p className="text-sm font-semibold text-slate-400">No activity yet</p>
                                        <p className="text-xs text-slate-300 text-center">Complete exams to see your performance trend</p>
                                    </div>
                                )}
                            </div>

                            {/* Score display - right 1/3 - matches screenshot: checkmark icon + "Score 78%" + "This Month ▶ 23%" */}
                            <div className="flex flex-col items-center justify-center bg-slate-50/80 rounded-2xl p-4 gap-2 border border-slate-100">
                                {/* Checkmark circle icon */}
                                <div className="w-12 h-12 rounded-full border-[3px] border-[var(--theme-primary)] flex items-center justify-center mb-1">
                                    <CheckCircle2 className="w-6 h-6 text-[var(--theme-primary)]" />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-semibold text-slate-600">Score</p>
                                    <p className="text-3xl font-black text-slate-800">{avgScore}%</p>
                                    <p className="text-xs text-emerald-500 font-semibold flex items-center gap-1 justify-center mt-1">
                                        <TrendingUp className="w-3 h-3" /> This Month
                                        {/* PLACEHOLDER - growth % not available in current code */}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Batch Details - redesigned to match screenshot */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
                        <SectionHeader icon={Users} title="Batch Details" linkHref="/student/batches" />

                        {/* Batch name header row - PLACEHOLDER if no batch data */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:divide-x divide-slate-100">

                            {/* Left: Batch info + course progress bars */}
                            <div className="pr-0 md:pr-6">
                                {/* Batch label */}
                                <p className="text-xs font-bold text-[var(--theme-primary)] mb-3 uppercase tracking-wide">
                                    {batches[0]?.name || 'Batch A, Advanced Science' /* PLACEHOLDER */}
                                </p>

                                {/* Instructor row - PLACEHOLDER (no instructor data in current code) */}
                                {batches[0] ? (
                                    <div className="flex items-center gap-3 mb-4 p-2.5 bg-slate-50 rounded-xl">
                                        <div className="w-9 h-9 rounded-full bg-[var(--theme-primary)]/20 overflow-hidden shrink-0">
                                            {batches[0]?.instructorImage
                                                ? <img src={batches[0].instructorImage} alt="" className="w-full h-full object-cover" />
                                                : <User className="w-5 h-5 text-[var(--theme-primary)] m-auto mt-2" />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-700">{batches[0]?.name || 'Batch A'}</p>
                                            <p className="text-xs text-slate-400">{batches[0]?.instructorName || ''}</p>
                                        </div>
                                        {/* Progress badge */}
                                        <span className="ml-auto text-xs font-black text-white bg-[var(--theme-primary)] px-2.5 py-1 rounded-lg shrink-0">
                                            {enrollments[0]?.progress?.percentage || 0}%
                                        </span>
                                    </div>
                                ) : null}

                                {/* Course progress bars */}
                                <div className="space-y-3.5">
                                    {enrollments.slice(0, 4).length > 0 ? enrollments.slice(0, 4).map((enrollment, i) => {
                                        const pct = enrollment.progress?.percentage || 0;
                                        const barColors = [
                                            'from-[var(--theme-primary)] to-[var(--theme-accent)]',
                                            'from-emerald-500 to-teal-400',
                                            'from-emerald-500 to-teal-400',
                                            'from-[var(--theme-primary)] to-[var(--theme-primary)]/70'
                                        ];
                                        return (
                                            <Link key={enrollment._id} href={`/student/courses/${enrollment.courseId?._id}`} className="block group">
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <span className="text-sm font-semibold text-slate-700 truncate max-w-[68%] group-hover:text-[var(--theme-primary)] transition-colors">
                                                        {enrollment.courseId?.title || 'Course'}
                                                    </span>
                                                    <span className="text-xs font-black text-white bg-[var(--theme-primary)]/80 px-2 py-0.5 rounded-lg shrink-0 ml-2">
                                                        {pct}%
                                                    </span>
                                                </div>
                                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                                    <div className={`h-full bg-gradient-to-r ${barColors[i % 4]} rounded-full transition-all duration-700`}
                                                        style={{ width: `${pct}%` }} />
                                                </div>
                                            </Link>
                                        );
                                    }) : <p className="text-sm text-slate-400 italic">No enrolled courses yet.</p>}
                                </div>
                            </div>

                            {/* Right: Upcoming exams list */}
                            <div className="pl-0 md:pl-6 mt-4 md:mt-0">
                                {/* Batch label for exams column */}
                                <p className="text-xs font-bold text-[var(--theme-primary)] mb-3 uppercase tracking-wide">
                                    {batches[0]?.name || 'Batch A, Advanced Science' /* PLACEHOLDER */}
                                </p>

                                <div className="space-y-2.5">
                                    {upcomingExams.slice(0, 4).length > 0 ? upcomingExams.slice(0, 4).map(exam => (
                                        <div key={exam._id} className="flex items-center justify-between p-3 bg-slate-50/80 rounded-xl hover:bg-[var(--theme-primary)]/5 transition-colors border border-slate-100">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div className="w-8 h-8 bg-[var(--theme-primary)]/15 rounded-lg flex items-center justify-center shrink-0">
                                                    <FileText className="w-4 h-4 text-[var(--theme-primary)]" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-slate-700 truncate">{exam.title}</p>
                                                    <p className="text-[11px] text-slate-400 mt-0.5">
                                                        Batch in {Math.ceil((new Date(exam.startDate) - new Date()) / (1000 * 60 * 60 * 24))} days
                                                    </p>
                                                </div>
                                            </div>
                                            <Link href={`/student/exams/${exam._id}`}
                                                className="px-3 py-1.5 bg-[var(--theme-primary)] hover:bg-[var(--theme-primary)]/90 text-white text-xs font-bold rounded-lg transition-colors shrink-0 ml-2">
                                                Attempt
                                            </Link>
                                        </div>
                                    )) : <p className="text-sm text-slate-400 italic">No upcoming exams.</p>}
                                </div>
                            </div>
                        </div>

                        {/* Pagination row - PLACEHOLDER - no pagination logic in current code */}
                        <div className="flex items-center justify-center gap-2 mt-5 pt-4 border-t border-slate-100">
                            <button className="px-3 py-1.5 text-xs font-semibold text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1">
                                ‹ Previous
                            </button>
                            {[1, 2, 3].map(n => (
                                <button key={n} className={`w-8 h-8 text-xs font-bold rounded-lg transition-colors
                                    ${n === 1 ? 'bg-[var(--theme-primary)] text-white' : 'text-slate-500 border border-slate-200 hover:bg-slate-50'}`}>
                                    {n}
                                </button>
                            ))}
                            <button className="px-3 py-1.5 text-xs font-semibold text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1">
                                Next ›
                            </button>
                        </div>
                    </div>

                    {/* Recent Results */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
                        <SectionHeader icon={Award} title="Recent Results" linkHref="/student/history" />
                        <div className="space-y-3">
                            {history.length > 0 ? history.slice(0, 4).map(attempt => {
                                const scorePct = attempt.totalMarks > 0 ? Math.round((attempt.score / attempt.totalMarks) * 100) : 0;
                                return (
                                    <div key={attempt._id}
                                        className="flex items-center justify-between p-3.5 bg-slate-50/80 rounded-xl hover:bg-slate-100/70 transition-colors border border-slate-100">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center text-white text-xs font-black shrink-0
                                                ${attempt.isPassed
                                                    ? 'bg-gradient-to-br from-emerald-500 to-teal-500'
                                                    : 'bg-gradient-to-br from-red-500 to-rose-500'}`}>
                                                {scorePct}%
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-slate-700 truncate">{attempt.examId?.title || 'Exam'}</p>
                                                <p className="text-[11px] text-slate-400 mt-0.5">{new Date(attempt.submittedAt).toLocaleDateString('en-IN')}</p>
                                            </div>
                                        </div>
                                        <span className={`shrink-0 ml-2 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide
                                            ${attempt.isPassed ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                            {attempt.isPassed ? 'PASSED' : 'FAILED'}
                                        </span>
                                    </div>
                                );
                            }) : (
                                <div className="flex flex-col items-center gap-2 py-8">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center">
                                        <FileText className="w-5 h-5 text-slate-300" />
                                    </div>
                                    <p className="text-sm text-slate-400">No exam results yet</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── RIGHT SIDEBAR ─────────────────────────────────────────── */}
                <div className="space-y-4">

                    {/* AI Recommendations */}
                    <SidePanel icon={Brain} title="AI Recommendations" open={aiOpen} onToggle={() => setAiOpen(v => !v)}>
                        <div className="space-y-2.5">
                            {/* PLACEHOLDER items - no AI recommendation data in current code */}
                            <div className="flex items-center gap-2.5 p-3 bg-[var(--theme-primary)]/10 rounded-xl border border-[var(--theme-primary)]/15">
                                <div className="w-7 h-7 bg-[var(--theme-primary)]/20 rounded-lg flex items-center justify-center shrink-0">
                                    <BookOpen className="w-3.5 h-3.5 text-[var(--theme-primary)]" />
                                </div>
                                <span className="text-xs text-slate-700 font-medium">Continue your enrolled courses</span>
                            </div>
                            <div className="flex items-center gap-2.5 p-3 bg-[var(--theme-primary)]/10 rounded-xl border border-[var(--theme-primary)]/15">
                                <div className="w-7 h-7 bg-[var(--theme-primary)]/20 rounded-lg flex items-center justify-center shrink-0">
                                    <FileText className="w-3.5 h-3.5 text-[var(--theme-primary)]" />
                                </div>
                                <span className="text-xs text-slate-700 font-medium">Practice upcoming exam topics</span>
                            </div>
                            <Link href="/student/ai-analytics"
                                className="flex items-center justify-center gap-2 w-full py-3 bg-[var(--theme-primary)] hover:bg-[var(--theme-primary)]/90 text-white text-sm font-bold rounded-xl transition-all mt-1 shadow-sm shadow-[var(--theme-primary)]/30">
                                <Sparkles className="w-4 h-4" />
                                Start AI Study Plan
                            </Link>
                        </div>
                    </SidePanel>

                    {/* Instructor Announcements */}
                    <SidePanel icon={Users} title="Instructor Announcements" open={announcementsOpen} onToggle={() => setAnnouncementsOpen(v => !v)}>
                        <div className="space-y-2.5">
                            {upcomingExams.length > 0 ? upcomingExams.slice(0, 3).map(exam => (
                                <div key={exam._id} className="flex items-start gap-2.5 p-3 bg-[var(--theme-primary)]/8 rounded-xl border border-[var(--theme-primary)]/10">
                                    <div className="w-7 h-7 bg-[var(--theme-primary)]/15 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                                        <FileText className="w-3.5 h-3.5 text-[var(--theme-primary)]" />
                                    </div>
                                    <p className="text-xs text-slate-600 leading-relaxed">
                                        <span className="font-bold text-slate-800">{exam.title}</span>{' '}
                                        scheduled on{' '}
                                        <span className="text-[var(--theme-primary)] font-semibold">
                                            {new Date(exam.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </span>
                                    </p>
                                </div>
                            )) : (
                                <p className="text-xs text-slate-400 italic">No announcements at this time.</p>
                            )}
                        </div>
                    </SidePanel>

                    {/* Batch Details Quick Links - matching screenshot "Batch Details" panel */}
                    <SidePanel icon={BarChart3} title="Batch Details" open={batchPanelOpen} onToggle={() => setBatchPanelOpen(v => !v)}>
                        <div className="space-y-0.5">
                            {[
                                { label: 'My Batches', href: '/student/batches', icon: Users },
                                { label: 'Batch Reportrties', href: '/student/history', icon: BarChart3 },
                                { label: 'Profile', href: '/student/profile', icon: User },
                            ].map(link => (
                                <Link key={link.label} href={link.href}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-600 hover:bg-[var(--theme-primary)]/10 hover:text-[var(--theme-primary)] transition-colors group">
                                    <div className="w-7 h-7 bg-[var(--theme-primary)]/10 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-[var(--theme-primary)]/20 transition-colors">
                                        <link.icon className="w-3.5 h-3.5 text-[var(--theme-primary)]" />
                                    </div>
                                    {link.label}
                                    <ArrowRight className="w-3 h-3 text-slate-300 group-hover:text-[var(--theme-primary)]/70 ml-auto transition-colors" />
                                </Link>
                            ))}
                        </div>
                    </SidePanel>
                </div>
            </div>
        </div>
    );
}