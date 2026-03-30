'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';

import AnalyticsChart from '@/components/widgets/AnalyticsChart';
import TopItemsWidget from '@/components/widgets/TopItemsWidget';
import FeedbackWidget from '@/components/widgets/FeedbackWidget';
import QuickLinksWidget from '@/components/widgets/QuickLinksWidget';
import DataTable from '@/components/widgets/DataTable';
import { toast } from 'react-hot-toast';
import { useConfirm } from '@/components/providers/ConfirmProvider';
import { UpcomingExamsWidget } from '@/components/calendar/UpcomingExamsWidget';
import {
    Loader2,
    ShieldAlert,
    Users,
    BookOpen,
    Wallet,
    Star,
    ClipboardCheck,
    CalendarClock,
    Bell,
    ArrowRight,
    Plus,
    Sparkles,
    CircleAlert,
    FileQuestion,
    LineChart
} from 'lucide-react';
import useInstitute from '@/hooks/useInstitute';
import { C, T, S, R } from '@/constants/tutorTokens';

function IconPill({ icon: Icon, bg, color }) {
    return (
        <div
            className="flex items-center justify-center shrink-0"
            style={{ width: 44, height: 44, backgroundColor: bg, borderRadius: R.xl }}
        >
            <Icon size={22} color={color} />
        </div>
    );
}

function TutorStatCard({ icon: Icon, title, value, subtext, trend, trendUp, color, bg }) {
    return (
        <div
            className="p-5 flex flex-col justify-between h-full transition-transform hover:-translate-y-0.5"
            style={{
                backgroundColor: '#EAE8FA', // OUTER CARD
                border: `1px solid ${C.cardBorder}`,
                borderRadius: R['2xl'],
                boxShadow: S.card,
                minHeight: '140px'
            }}
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <IconPill icon={Icon} bg={bg} color={color} />
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>
                        {title}
                    </p>
                </div>
                <div className="flex flex-col items-end">
                    <span
                        className="px-2.5 py-1"
                        style={{
                            backgroundColor: trendUp ? C.successBg : C.dangerBg,
                            color: trendUp ? C.success : C.danger,
                            borderRadius: R.full,
                            fontSize: '11px',
                            fontWeight: T.weight.black,
                            border: `1px solid ${trendUp ? C.successBorder : C.dangerBorder}`
                        }}
                    >
                        {trendUp ? '+' : ''}{trend}
                    </span>
                </div>
            </div>
            
            <div className="flex items-end justify-between mt-auto">
                <p style={{ fontFamily: T.fontFamily, fontSize: T.size['3xl'], fontWeight: T.weight.black, color: C.heading, margin: 0, lineHeight: 1 }}>
                    {value}
                </p>
                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, margin: '0 0 2px 0' }}>
                    {subtext}
                </p>
            </div>
        </div>
    );
}

function ActionQueueCard({ icon: Icon, title, value, hint, ctaLabel, onClick }) {
    return (
        <div
            className="p-5 flex flex-col gap-3 transition-transform hover:-translate-y-0.5 h-full"
            style={{ backgroundColor: '#EAE8FA', border: `1px solid ${C.cardBorder}`, borderRadius: R['2xl'], boxShadow: S.card }}
        >
            <div className="flex items-start gap-4">
                <IconPill icon={Icon} bg="#E3DFF8" color={C.btnPrimary} />
                <div className="flex-1 min-w-0">
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 4px 0' }}>
                        {title}
                    </p>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.black, color: C.btnPrimary, margin: '0 0 4px 0' }}>
                        {value}
                    </p>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.medium, color: C.textMuted, margin: 0 }}>
                        {hint}
                    </p>
                </div>
            </div>
            <div className="mt-auto pt-2">
                <button
                    onClick={onClick}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 cursor-pointer border-none transition-opacity hover:opacity-80"
                    style={{
                        backgroundColor: '#E3DFF8', // INNER BOX for button
                        color: C.btnPrimary,
                        borderRadius: R.xl,
                        fontSize: T.size.sm,
                        fontWeight: T.weight.black,
                        fontFamily: T.fontFamily,
                    }}
                >
                    {ctaLabel} <ArrowRight size={16} />
                </button>
            </div>
        </div>
    );
}

export default function TutorDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const institute = useInstitute();
    const router = useRouter();
    const { confirmDialog } = useConfirm();

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const res = await api.get('/tutors/stats');
            setStats(res.data?.stats);
        } catch {
            // silent
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-3 w-full" style={{ backgroundColor: '#dfdaf3', fontFamily: T.fontFamily }}>
                <Loader2 className="animate-spin" style={{ color: C.btnPrimary, width: '28px', height: '28px' }} />
                <p style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.bold }}>Loading dashboard...</p>
            </div>
        );
    }

    const formatTrend = (val) => (val === null ? 'New' : `${Math.abs(val).toFixed(1)}%`);
    const trendUp = (val) => val === null || val >= 0;

    const statsData = [
        {
            title: 'Total Students',
            icon: Users,
            value: stats?.totalStudents?.toLocaleString() || '0',
            subtext: 'vs last week',
            trend: formatTrend(stats?.trends?.students),
            trendUp: trendUp(stats?.trends?.students),
            color: '#7573E8', bg: '#E3DFF8'
        },
        {
            title: 'Active Courses',
            icon: BookOpen,
            value: stats?.activeCourses?.toLocaleString() || '0',
            subtext: 'vs last month',
            trend: formatTrend(stats?.trends?.courses),
            trendUp: trendUp(stats?.trends?.courses),
            color: '#F59E0B', bg: 'rgba(245,158,11,0.15)'
        },
        {
            title: 'Total Earnings',
            icon: Wallet,
            value: `₹${stats?.totalEarnings?.toLocaleString() || '0'}`,
            subtext: 'vs last week',
            trend: formatTrend(stats?.trends?.earnings),
            trendUp: trendUp(stats?.trends?.earnings),
            color: '#10B981', bg: 'rgba(16,185,129,0.15)'
        },
        {
            title: 'Avg. Rating',
            icon: Star,
            value: `${(Number(stats?.avgRating) || 0).toFixed(1)} / 5`,
            subtext: 'vs last month',
            trend: formatTrend(stats?.trends?.reviews),
            trendUp: trendUp(stats?.trends?.reviews),
            color: '#F43F5E', bg: 'rgba(244,63,94,0.15)'
        },
    ];

    const totalReviews = stats?.totalReviews || 1;
    const ratingsData = [
        { label: '5 Star', value: Math.round(((stats?.ratingsDistribution?.[5] || 0) / totalReviews) * 100), color: 'bg-emerald-500' },
        { label: '4 Star', value: Math.round(((stats?.ratingsDistribution?.[4] || 0) / totalReviews) * 100), color: 'bg-blue-500' },
        { label: '3 Star', value: Math.round(((stats?.ratingsDistribution?.[3] || 0) / totalReviews) * 100), color: 'bg-yellow-500' },
        { label: '2 Star', value: Math.round(((stats?.ratingsDistribution?.[2] || 0) / totalReviews) * 100), color: 'bg-orange-500' },
        { label: '1 Star', value: Math.round(((stats?.ratingsDistribution?.[1] || 0) / totalReviews) * 100), color: 'bg-red-500' },
    ];

    const queueData = [
        {
            title: 'Pending Assignments',
            icon: ClipboardCheck,
            value: stats?.pendingAssignmentReviews?.toLocaleString() || '0',
            hint: 'Submissions waiting for review',
            ctaLabel: 'Review Assignments',
            onClick: () => router.push('/tutor/assignments'),
        },
        {
            title: 'Upcoming Classes',
            icon: CalendarClock,
            value: stats?.upcomingClassesCount?.toLocaleString() || '0',
            hint: 'Scheduled sessions in queue',
            ctaLabel: 'Open Live Classes',
            onClick: () => router.push('/tutor/live-classes'),
        },
        {
            title: 'Unread Notifications',
            icon: Bell,
            value: stats?.unreadNotificationsCount?.toLocaleString() || '0',
            hint: 'Latest alerts and actions',
            ctaLabel: 'Open Notifications',
            onClick: () => router.push('/tutor/announcements?tab=notifications'),
        },
    ];

    const handleViewEnrollment = (row) => {
        if (row.studentId) router.push(`/tutor/students/${row.studentId}`);
        else toast.error('Student details not available');
    };

    const handleDeleteEnrollment = async (row) => {
        const ok = await confirmDialog('Remove Enrollment', 'Are you sure you want to remove this enrollment?', {
            variant: 'destructive',
        });
        if (!ok) return;
        try {
            const res = await api.delete(`/enrollments/tutor/${row.originalId}`);
            if (res.data.success) {
                toast.success('Enrollment removed');
                fetchDashboardData();
            }
        } catch {
            toast.error('Failed to remove enrollment');
        }
    };

    const recentEnrollments =
        stats?.recentEnrollments?.map((enrollment) => ({
            id: `#ENR-${enrollment._id.slice(-4)}`,
            originalId: enrollment._id,
            studentId: enrollment.studentId,
            category: enrollment.courseTitle,
            date: new Date(enrollment.enrolledAt).toLocaleDateString(),
            views: enrollment.studentName,
            price: `₹${enrollment.price}`,
            dueDate: 'Paid',
            action: 'view',
        })) || [];

    return (
        <div className="w-full min-h-screen p-6" style={{ backgroundColor: '#dfdaf3', fontFamily: T.fontFamily, color: C.text }}>
            
            {/* ── Premium Header with Create Button ───────────────────────── */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 shadow-sm" style={{ border: `2px solid #EAE8FA`, backgroundColor: '#E3DFF8' }}>
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=TutorProfile" alt="avatar" className="w-full h-full object-cover" />
                    </div>
                    <div>
                        <h1 style={{ color: C.heading, fontSize: T.size['2xl'], fontWeight: T.weight.black, margin: '0 0 4px 0' }}>
                            Welcome back, Tutor 👋
                        </h1>
                        <p style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.medium, margin: 0 }}>
                            {institute?.institute?.name || "Let's build smarter learning today with AI-powered teaching"}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => router.push('/tutor/courses/create')}
                    className="flex items-center justify-center h-11 px-6 gap-2 cursor-pointer border-none transition-transform hover:-translate-y-0.5 shadow-md"
                    style={{ background: C.gradientBtn, color: '#ffffff', borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}
                >
                    <Plus size={18} /> Create Course
                </button>
            </div>

            {stats && !stats.isVerified && (
                <div className="p-4 rounded-xl flex items-start gap-3 mb-6" style={{ backgroundColor: C.warningBg, border: `1px solid ${C.warningBorder}` }}>
                    <ShieldAlert size={20} color={C.warning} className="shrink-0 mt-0.5" />
                    <div>
                        <h4 style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 4px 0' }}>Profile pending verification</h4>
                        <p style={{ fontSize: T.size.xs, color: C.text, margin: 0, lineHeight: 1.5 }}>
                            Your profile is currently under review by an administrator. You will not appear in public search results until verified. You can still create and manage courses in the meantime.
                        </p>
                    </div>
                </div>
            )}

            {/* ── Top Stats Row ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {statsData.map((stat, index) => (
                    <TutorStatCard key={index} {...stat} />
                ))}
            </div>

            {/* ── Middle Section: Action Queue & AI Buddy ─────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
                {/* Action Queue */}
                <div className="lg:col-span-3">
                    <h3 style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading, margin: '0 0 16px 0' }}>
                        Action Queue
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100%-36px)]">
                        {queueData.map((item) => (
                            <ActionQueueCard key={item.title} {...item} />
                        ))}
                    </div>
                </div>

                {/* AI Buddy Section */}
                <div className="lg:col-span-1">
                    <h3 style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading, margin: '0 0 16px 0' }}>
                        AI Assistant
                    </h3>
                    <div className="p-5 flex flex-col h-[calc(100%-36px)] transition-transform hover:-translate-y-0.5" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-10 h-10 flex items-center justify-center shrink-0" style={{ backgroundColor: '#E3DFF8', borderRadius: R.xl }}>
                                <Sparkles size={20} color={C.btnPrimary} />
                            </div>
                            <h3 style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>AI Buddy</h3>
                        </div>

                        <div className="space-y-3 mb-6">
                            <div className="flex items-center gap-3 p-3" style={{ backgroundColor: '#E3DFF8', borderRadius: R.xl }}>
                                <CircleAlert size={16} color={C.danger} className="shrink-0" />
                                <span className="truncate" style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.heading }}>Identify At-Risk Students</span>
                            </div>
                            <div className="flex items-center gap-3 p-3" style={{ backgroundColor: '#E3DFF8', borderRadius: R.xl }}>
                                <FileQuestion size={16} color={C.btnPrimary} className="shrink-0" />
                                <span className="truncate" style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.heading }}>Generate AI Quizzes</span>
                            </div>
                             <div className="flex items-center gap-3 p-3" style={{ backgroundColor: '#E3DFF8', borderRadius: R.xl }}>
                                <LineChart size={16} color={C.warning} className="shrink-0" />
                                <span className="truncate" style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.heading }}>Analyze Engagement</span>
                            </div>
                        </div>

                        <div className="mt-auto">
                            <button
                                onClick={() => router.push('/tutor/ai-buddy')}
                                className="w-full flex items-center justify-center h-11 border-none cursor-pointer transition-opacity hover:opacity-90 shadow-sm"
                                style={{ background: C.gradientBtn, color: '#fff', borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}
                            >
                                Open AI Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Charts & Top Items ──────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="lg:col-span-2">
                    <div style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, padding: '16px', boxShadow: S.card }}>
                        <AnalyticsChart data={stats?.monthlyData} isTutor={true} />
                    </div>
                </div>
                <div>
                    <div style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, padding: '16px', boxShadow: S.card, height: '100%' }}>
                        <TopItemsWidget title="Top Performing Courses" data={stats?.topCourses} isTutor={true} />
                    </div>
                </div>
            </div>

            {/* ── Bottom Widgets ──────────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="md:col-span-1 space-y-6">
                    <div style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, padding: '16px', boxShadow: S.card }}>
                        <UpcomingExamsWidget isTutor={true} />
                    </div>
                    <div style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, padding: '16px', boxShadow: S.card }}>
                        <FeedbackWidget title="Ratings Overview" data={ratingsData} isTutor={true} />
                    </div>
                </div>
                <div className="md:col-span-2">
                    <div style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, padding: '16px', boxShadow: S.card, height: '100%' }}>
                        <QuickLinksWidget stats={stats} isTutor={true} />
                    </div>
                </div>
            </div>

            {/* ── Enrollments Table ───────────────────────────────────────── */}
            <div>
                <h3 style={{ fontSize: T.size.lg, fontWeight: T.weight.black, color: C.heading, margin: '0 0 16px 0' }}>
                    Recent Enrollments
                </h3>
                <div style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, padding: '16px', boxShadow: S.card }}>
                    <DataTable data={recentEnrollments} onView={handleViewEnrollment} onDelete={handleDeleteEnrollment} isTutor={true} />
                </div>
            </div>
        </div>
    );
}