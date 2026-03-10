'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import StatsCard from '@/components/widgets/StatsCard';
import AnalyticsChart from '@/components/widgets/AnalyticsChart';
import TopItemsWidget from '@/components/widgets/TopItemsWidget';
import FeedbackWidget from '@/components/widgets/FeedbackWidget';
import QuickLinksWidget from '@/components/widgets/QuickLinksWidget';
import DataTable from '@/components/widgets/DataTable';
import { toast } from 'react-hot-toast';
import { useConfirm } from '@/components/providers/ConfirmProvider';
import { UpcomingExamsWidget } from '@/components/calendar/UpcomingExamsWidget';
import { Loader2, ShieldAlert, LayoutDashboard } from 'lucide-react';
import useInstitute from '@/hooks/useInstitute';

export default function TutorDashboard() {
    const [stats, setStats]   = useState(null);
    const [loading, setLoading] = useState(true);
    const institute             = useInstitute();
    const router                = useRouter();
    const { confirmDialog }     = useConfirm();

    useEffect(() => { fetchDashboardData(); }, []);

    const fetchDashboardData = async () => {
        try {
            const response = await api.get('/tutors/stats');
            setStats(response.data?.stats);
        } catch { /* silent */ }
        finally { setLoading(false); }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
                <Loader2 className="w-7 h-7 animate-spin" style={{ color: 'var(--theme-primary)' }} />
                <p className="text-sm text-slate-400">Loading dashboard...</p>
            </div>
        );
    }

    const formatTrend = (val) => val === null ? 'New' : `${Math.abs(val).toFixed(1)}%`;
    const trendUp     = (val) => val === null || val >= 0;

    const statsData = [
        { title: 'Total Students', value: stats?.totalStudents?.toLocaleString() || '0',              subtext: 'vs last week',  trend: formatTrend(stats?.trends?.students), trendUp: trendUp(stats?.trends?.students) },
        { title: 'Active Courses',  value: stats?.activeCourses?.toLocaleString() || '0',             subtext: 'vs last month', trend: formatTrend(stats?.trends?.courses),  trendUp: trendUp(stats?.trends?.courses) },
        { title: 'Total Earnings',  value: `₹${stats?.totalEarnings?.toLocaleString() || '0'}`,       subtext: 'vs last week',  trend: formatTrend(stats?.trends?.earnings), trendUp: trendUp(stats?.trends?.earnings) },
        { title: 'Avg. Rating',     value: `${(Number(stats?.avgRating) || 0).toFixed(1)} / 5`,       subtext: 'vs last month', trend: formatTrend(stats?.trends?.reviews),  trendUp: trendUp(stats?.trends?.reviews) },
    ];

    const totalReviews = stats?.totalReviews || 1;
    const ratingsData = [
        { label: '5 Star', value: Math.round(((stats?.ratingsDistribution?.[5] || 0) / totalReviews) * 100), color: 'bg-emerald-500' },
        { label: '4 Star', value: Math.round(((stats?.ratingsDistribution?.[4] || 0) / totalReviews) * 100), color: 'bg-blue-500' },
        { label: '3 Star', value: Math.round(((stats?.ratingsDistribution?.[3] || 0) / totalReviews) * 100), color: 'bg-yellow-500' },
        { label: '2 Star', value: Math.round(((stats?.ratingsDistribution?.[2] || 0) / totalReviews) * 100), color: 'bg-orange-500' },
        { label: '1 Star', value: Math.round(((stats?.ratingsDistribution?.[1] || 0) / totalReviews) * 100), color: 'bg-red-500' },
    ];

    const handleViewEnrollment = (row) => {
        if (row.studentId) router.push(`/tutor/students/${row.studentId}`);
        else toast.error('Student details not available');
    };

    const handleDeleteEnrollment = async (row) => {
        const ok = await confirmDialog('Remove Enrollment', 'Are you sure you want to remove this enrollment?', { variant: 'destructive' });
        if (!ok) return;
        try {
            const res = await api.delete(`/enrollments/tutor/${row.originalId}`);
            if (res.data.success) { toast.success('Enrollment removed'); fetchDashboardData(); }
        } catch { toast.error('Failed to remove enrollment'); }
    };

    const recentEnrollments = stats?.recentEnrollments?.map(enrollment => ({
        id:         `#ENR-${enrollment._id.slice(-4)}`,
        originalId: enrollment._id,
        studentId:  enrollment.studentId,
        category:   enrollment.courseTitle,
        date:       new Date(enrollment.enrolledAt).toLocaleDateString(),
        views:      enrollment.studentName,
        price:      `₹${enrollment.price}`,
        dueDate:    'Paid',
        action:     'view',
    })) || [];

    return (
        <div className="space-y-5" style={{ fontFamily: "var(--theme-font, 'DM Sans', sans-serif)" }}>

            {/* ── Header ────────────────────────────────────────────────────── */}
            <div className="bg-white rounded-xl border border-slate-100 px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 12%, white)', border: '1px solid color-mix(in srgb, var(--theme-primary) 20%, white)' }}>
                        <LayoutDashboard className="w-4 h-4" style={{ color: 'var(--theme-primary)' }} />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-slate-800">Tutor Dashboard</h1>
                        {institute?.institute?.name && (
                            <p className="text-xs text-slate-400">
                                {institute.institute.name}
                            </p>
                        )}
                    </div>
                </div>
                {/* Breadcrumb */}
                <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400">
                    <span>tutor</span>
                    <span>/</span>
                    <span style={{ color: 'var(--theme-primary)' }} className="font-semibold">dashboard</span>
                </div>
            </div>

            {/* ── Verification banner ───────────────────────────────────────── */}
            {stats && !stats.isVerified && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
                    <ShieldAlert className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                        <h4 className="text-sm font-bold text-amber-800 mb-0.5">Profile pending verification</h4>
                        <p className="text-xs text-amber-700 leading-relaxed">
                            Your profile is currently under review by an administrator. You will not appear in public search results until verified. You can still create and manage courses in the meantime.
                        </p>
                    </div>
                </div>
            )}

            {/* ── Stats cards ───────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statsData.map((stat, i) => (
                    <StatsCard key={i} {...stat} />
                ))}
            </div>

            {/* ── Charts ────────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                    <AnalyticsChart data={stats?.monthlyData} />
                </div>
                <div>
                    <TopItemsWidget title="Top Performing Courses" data={stats?.topCourses} />
                </div>
            </div>

            {/* ── Ratings + Quick Links ─────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1 space-y-4">
                    <UpcomingExamsWidget isTutor={true} />
                    <FeedbackWidget title="Ratings Overview" data={ratingsData} />
                </div>
                <div className="md:col-span-2">
                    <QuickLinksWidget stats={stats} />
                </div>
            </div>

            {/* ── Recent Enrollments ────────────────────────────────────────── */}
            <div>
                <h3 className="text-sm font-bold text-slate-700 mb-3">Recent Enrollments</h3>
                <DataTable
                    data={recentEnrollments}
                    onView={handleViewEnrollment}
                    onDelete={handleDeleteEnrollment}
                />
            </div>
        </div>
    );
}