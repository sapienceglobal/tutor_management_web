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
    LayoutDashboard,
    Users,
    BookOpen,
    Wallet,
    Star,
    ArrowUp,
    ArrowDown,
    ClipboardCheck,
    CalendarClock,
    Bell,
    Megaphone,
    ArrowRight,
} from 'lucide-react';
import useInstitute from '@/hooks/useInstitute';
import { C, T, S, pageStyle } from '@/constants/tutorTokens';

function IconPill({ icon: Icon, size = 20, bg }) {
    return (
        <div
            className="flex items-center justify-center rounded-xl flex-shrink-0"
            style={{ width: 40, height: 40, backgroundColor: bg || C.iconBg }}
        >
            <Icon style={{ width: size, height: size, color: C.iconColor }} />
        </div>
    );
}

function TutorStatCard({ icon: Icon, title, value, subtext, trend, trendUp }) {
    return (
        <div
            className="relative rounded-2xl p-4 overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            style={{
                backgroundColor: C.cardBg,
                border: `1px solid ${C.cardBorder}`,
                minHeight: 120,
                boxShadow: S.card,
            }}
        >
            <div className="absolute right-0 bottom-0 w-36 h-20 pointer-events-none overflow-hidden rounded-b-2xl">
                <svg viewBox="0 0 144 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                    <path
                        d="M0 55 C30 55 50 30 80 28 C100 26 120 35 144 30 L144 80 L0 80 Z"
                        fill="#CDD5F0"
                        opacity="0.55"
                    />
                    <path
                        d="M0 55 C30 55 50 30 80 28 C100 26 120 35 144 30"
                        stroke="#8095E4"
                        strokeWidth="2"
                        fill="none"
                        opacity="0.85"
                    />
                </svg>
            </div>

            <div className="relative flex flex-col h-full gap-2">
                <div className="flex items-start gap-3">
                    <IconPill icon={Icon} />
                    <div className="flex-1 min-w-0">
                        <p
                            style={{
                                fontFamily: T.fontFamily,
                                fontSize: T.size.xs,
                                fontWeight: T.weight.semibold,
                                color: C.statLabel,
                                textTransform: 'uppercase',
                                letterSpacing: T.tracking.wider,
                                lineHeight: T.leading.tight,
                            }}
                        >
                            {title}
                        </p>
                        <p
                            style={{
                                fontFamily: T.fontFamily,
                                fontSize: T.size['3xl'],
                                fontWeight: T.weight.black,
                                color: C.statValue,
                                lineHeight: T.leading.tight,
                                marginTop: 2,
                            }}
                        >
                            {value}
                        </p>
                    </div>
                </div>

                <div className="mt-auto">
                    <div
                        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg"
                        style={{ backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}` }}
                    >
                        {trendUp ? (
                            <ArrowUp className="w-3 h-3" style={{ color: C.success }} />
                        ) : (
                            <ArrowDown className="w-3 h-3" style={{ color: C.danger }} />
                        )}
                        <span
                            style={{
                                fontFamily: T.fontFamily,
                                fontSize: T.size.xs,
                                fontWeight: T.weight.bold,
                                color: trendUp ? C.success : C.danger,
                            }}
                        >
                            {trend}
                        </span>
                        <span style={{ fontFamily: T.fontFamily, fontSize: '10px', color: C.text, opacity: 0.5 }}>
                            {subtext}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ActionQueueCard({ icon: Icon, title, value, hint, ctaLabel, onClick }) {
    return (
        <div
            className="rounded-2xl p-4 flex flex-col gap-3 transition-all duration-200 hover:-translate-y-0.5"
            style={{ backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}
        >
            <div className="flex items-start gap-3">
                <IconPill icon={Icon} size={18} />
                <div className="min-w-0 flex-1">
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>
                        {title}
                    </p>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.black, color: C.statValue }}>
                        {value}
                    </p>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>
                        {hint}
                    </p>
                </div>
            </div>
            <button
                onClick={onClick}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl transition-colors"
                style={{
                    backgroundColor: C.btnViewAllBg,
                    border: `1px solid ${C.cardBorder}`,
                    color: C.btnViewAllText,
                    fontFamily: T.fontFamily,
                    fontSize: T.size.xs,
                    fontWeight: T.weight.bold,
                }}
            >
                {ctaLabel}
                <ArrowRight className="w-3.5 h-3.5" />
            </button>
        </div>
    );
}

const formatDateTime = (value) => {
    try {
        return new Date(value).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
    } catch {
        return '-';
    }
};

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
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
                <div className="relative w-12 h-12">
                    <div
                        className="w-12 h-12 rounded-full border-[3px] animate-spin"
                        style={{ borderColor: `${C.btnPrimary}30`, borderTopColor: C.btnPrimary }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="w-4 h-4 animate-pulse" style={{ color: C.btnPrimary }} />
                    </div>
                </div>
                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.text, opacity: 0.55 }}>
                    Loading dashboard...
                </p>
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
        },
        {
            title: 'Active Courses',
            icon: BookOpen,
            value: stats?.activeCourses?.toLocaleString() || '0',
            subtext: 'vs last month',
            trend: formatTrend(stats?.trends?.courses),
            trendUp: trendUp(stats?.trends?.courses),
        },
        {
            title: 'Total Earnings',
            icon: Wallet,
            value: `₹${stats?.totalEarnings?.toLocaleString() || '0'}`,
            subtext: 'vs last week',
            trend: formatTrend(stats?.trends?.earnings),
            trendUp: trendUp(stats?.trends?.earnings),
        },
        {
            title: 'Avg. Rating',
            icon: Star,
            value: `${(Number(stats?.avgRating) || 0).toFixed(1)} / 5`,
            subtext: 'vs last month',
            trend: formatTrend(stats?.trends?.reviews),
            trendUp: trendUp(stats?.trends?.reviews),
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
            title: 'Pending Assignment Reviews',
            icon: ClipboardCheck,
            value: stats?.pendingAssignmentReviews?.toLocaleString() || '0',
            hint: 'Submissions waiting for manual review',
            ctaLabel: 'Review Assignments',
            onClick: () => router.push('/tutor/assignments'),
        },
        {
            title: 'Upcoming Live Classes',
            icon: CalendarClock,
            value: stats?.upcomingClassesCount?.toLocaleString() || '0',
            hint: 'Scheduled and live sessions in your queue',
            ctaLabel: 'Open Live Classes',
            onClick: () => router.push('/tutor/live-classes'),
        },
        {
            title: 'Unread Notifications',
            icon: Bell,
            value: stats?.unreadNotificationsCount?.toLocaleString() || '0',
            hint: 'Latest alerts across announcements and actions',
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

    const upcomingClasses = stats?.upcomingClasses || [];
    const recentAnnouncements = stats?.recentAnnouncements || [];

    return (
        <div className="space-y-5" style={pageStyle}>
            <div
                className="rounded-2xl px-5 py-4 flex items-center justify-between"
                style={{ backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}
            >
                <div className="flex items-center gap-2.5">
                    <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${C.btnPrimary}15`, border: `1px solid ${C.btnPrimary}25` }}
                    >
                        <LayoutDashboard className="w-4 h-4" style={{ color: C.btnPrimary }} />
                    </div>
                    <div>
                        <h1 style={{ fontFamily: T.fontFamily, fontSize: T.size.md, fontWeight: T.weight.bold, color: C.heading }}>
                            Tutor Dashboard
                        </h1>
                        {institute?.institute?.name && (
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>
                                {institute.institute.name}
                            </p>
                        )}
                    </div>
                </div>

                <div className="hidden sm:flex items-center gap-1.5" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>
                    <span>tutor</span>
                    <span>/</span>
                    <span style={{ color: C.btnPrimary, fontWeight: T.weight.semibold }}>dashboard</span>
                </div>
            </div>

            {stats && !stats.isVerified && (
                <div className="p-4 rounded-2xl flex items-start gap-3" style={{ backgroundColor: C.warningBg, border: `1px solid ${C.warningBorder}` }}>
                    <ShieldAlert className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: C.warning }} />
                    <div>
                        <h4 style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, marginBottom: 2 }}>
                            Profile pending verification
                        </h4>
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.text, lineHeight: T.leading.relaxed }}>
                            Your profile is currently under review by an administrator. You will not appear in public search results until verified.
                            You can still create and manage courses in the meantime.
                        </p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statsData.map((stat, index) => (
                    <TutorStatCard key={index} {...stat} />
                ))}
            </div>

            <div>
                <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, marginBottom: 12 }}>
                    Action Queue
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {queueData.map((item) => (
                        <ActionQueueCard key={item.title} {...item} />
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                    <AnalyticsChart data={stats?.monthlyData} isTutor={true} />
                </div>
                <div>
                    <TopItemsWidget title="Top Performing Courses" data={stats?.topCourses} isTutor={true} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-2xl p-4" style={{ backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                    <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2.5">
                            <IconPill icon={CalendarClock} size={16} />
                            <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>
                                Upcoming Classes
                            </h3>
                        </div>
                        <button
                            onClick={() => router.push('/tutor/live-classes')}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg"
                            style={{ backgroundColor: C.btnViewAllBg, color: C.btnViewAllText, fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold }}
                        >
                            View All
                        </button>
                    </div>

                    {upcomingClasses.length === 0 ? (
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>
                            No upcoming classes scheduled.
                        </p>
                    ) : (
                        <div className="space-y-2.5">
                            {upcomingClasses.map((item) => (
                                <div key={item._id} className="p-3 rounded-xl" style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}` }}>
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <p className="truncate" style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>
                                                {item.title}
                                            </p>
                                            <p className="truncate" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted, marginTop: 2 }}>
                                                {item.courseTitle || 'Live Class'}
                                            </p>
                                        </div>
                                        <span
                                            className="px-2 py-1 rounded-full capitalize"
                                            style={{
                                                backgroundColor: item.status === 'live' ? C.successBg : C.warningBg,
                                                color: item.status === 'live' ? C.success : C.warning,
                                                fontFamily: T.fontFamily,
                                                fontSize: '10px',
                                                fontWeight: T.weight.bold,
                                            }}
                                        >
                                            {item.status}
                                        </span>
                                    </div>
                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.text, marginTop: 6 }}>
                                        {formatDateTime(item.dateTime)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="rounded-2xl p-4" style={{ backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                    <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2.5">
                            <IconPill icon={Megaphone} size={16} />
                            <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>
                                Recent Announcements
                            </h3>
                        </div>
                        <button
                            onClick={() => router.push('/tutor/announcements')}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg"
                            style={{ backgroundColor: C.btnViewAllBg, color: C.btnViewAllText, fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold }}
                        >
                            View All
                        </button>
                    </div>

                    {recentAnnouncements.length === 0 ? (
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>
                            No recent announcements found.
                        </p>
                    ) : (
                        <div className="space-y-2.5">
                            {recentAnnouncements.map((item, index) => (
                                <div
                                    key={`${item.sourceType}-${item.sourceId}-${item.createdAt}-${index}`}
                                    className="p-3 rounded-xl"
                                    style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}` }}
                                >
                                    <p className="truncate" style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>
                                        {item.title}
                                    </p>
                                    <p
                                        className="line-clamp-2"
                                        style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.text, marginTop: 4, lineHeight: T.leading.relaxed }}
                                    >
                                        {item.message}
                                    </p>
                                    <div className="flex items-center justify-between gap-2 mt-2">
                                        <p className="truncate" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>
                                            {item.sourceType === 'batch' && item.courseTitle ? `${item.sourceTitle} · ${item.courseTitle}` : item.sourceTitle}
                                        </p>
                                        <button
                                            onClick={() =>
                                                router.push(item.sourceType === 'course' ? `/tutor/courses/${item.sourceId}` : `/tutor/batches/${item.sourceId}`)
                                            }
                                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg"
                                            style={{
                                                backgroundColor: C.surfaceWhite,
                                                border: `1px solid ${C.cardBorder}`,
                                                color: C.btnPrimary,
                                                fontFamily: T.fontFamily,
                                                fontSize: '10px',
                                                fontWeight: T.weight.bold,
                                            }}
                                        >
                                            Open Source
                                            <ArrowRight className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1 space-y-4">
                    <UpcomingExamsWidget isTutor={true} />
                    <FeedbackWidget title="Ratings Overview" data={ratingsData} isTutor={true} />
                </div>
                <div className="md:col-span-2">
                    <QuickLinksWidget stats={stats} isTutor={true} />
                </div>
            </div>

            <div>
                <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, marginBottom: 12 }}>
                    Recent Enrollments
                </h3>
                <DataTable data={recentEnrollments} onView={handleViewEnrollment} onDelete={handleDeleteEnrollment} isTutor={true} />
            </div>
        </div>
    );
}
