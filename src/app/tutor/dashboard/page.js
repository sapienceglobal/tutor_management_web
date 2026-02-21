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
import { Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useConfirm } from '@/components/providers/ConfirmProvider';

export default function TutorDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const { confirmDialog } = useConfirm();

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const response = await api.get('/tutors/stats');
            setStats(response.data?.stats);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-100px)]">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    const formatTrend = (val) => {
        if (val === null) return 'New';
        return `${Math.abs(val).toFixed(1)}%`;
    };

    const statsData = [
        {
            title: 'Total Students',
            value: stats?.totalStudents?.toLocaleString() || '0',
            subtext: 'in Last week',
            trend: `${formatTrend(stats?.trends?.students)} increase`,
            trendUp: (stats?.trends?.students === null) || (stats?.trends?.students >= 0)
        },
        {
            title: 'Active Courses',
            value: stats?.activeCourses?.toLocaleString() || '0',
            subtext: 'than 1 yrs ago',
            trend: `${formatTrend(stats?.trends?.courses)} less`,
            trendUp: (stats?.trends?.courses === null) || (stats?.trends?.courses >= 0)
        },
        {
            title: 'Total Earnings',
            value: `$${stats?.totalEarnings?.toLocaleString() || '0'}`,
            subtext: 'than last week',
            trend: `${formatTrend(stats?.trends?.earnings)} lead less`,
            trendUp: (stats?.trends?.earnings === null) || (stats?.trends?.earnings >= 0)
        },
        {
            title: 'Avg. Rating',
            value: `${stats?.avgRating || '0.0'}%`,
            subtext: 'last month',
            trend: `${formatTrend(stats?.trends?.reviews)} increase`,
            trendUp: (stats?.trends?.reviews === null) || (stats?.trends?.reviews >= 0)
        }
    ];

    const totalReviews = stats?.totalReviews || 1;
    const ratingsData = [
        { label: '5 Star', value: Math.round(((stats?.ratingsDistribution?.[5] || 0) / totalReviews) * 100), color: 'bg-green-500' },
        { label: '4 Star', value: Math.round(((stats?.ratingsDistribution?.[4] || 0) / totalReviews) * 100), color: 'bg-blue-500' },
        { label: '3 Star', value: Math.round(((stats?.ratingsDistribution?.[3] || 0) / totalReviews) * 100), color: 'bg-yellow-500' },
        { label: '2 Star', value: Math.round(((stats?.ratingsDistribution?.[2] || 0) / totalReviews) * 100), color: 'bg-orange-500' },
        { label: '1 Star', value: Math.round(((stats?.ratingsDistribution?.[1] || 0) / totalReviews) * 100), color: 'bg-red-500' },
    ];

    const handleViewEnrollment = (row) => {
        if (row.studentId) {
            router.push(`/tutor/students/${row.studentId}`);
        } else {
            toast.error('Student details not available');
        }
    };

    const handleDeleteEnrollment = async (row) => {
        const isConfirmed = await confirmDialog("Remove Enrollment", "Are you sure you want to remove this enrollment?", { variant: 'destructive' });
        if (!isConfirmed) return;

        try {
            const res = await api.delete(`/enrollments/tutor/${row.originalId}`);
            if (res.data.success) {
                toast.success('Enrollment removed');
                fetchDashboardData();
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to remove enrollment');
        }
    };

    const recentEnrollments = stats?.recentEnrollments?.map(enrollment => ({
        id: `#ENR-${enrollment._id.slice(-4)}`,
        originalId: enrollment._id,
        studentId: enrollment.studentId,
        category: enrollment.courseTitle,
        date: new Date(enrollment.enrolledAt).toLocaleDateString(),
        views: enrollment.studentName,
        price: `$${enrollment.price}`,
        dueDate: 'Paid',
        action: 'view'
    })) || [];

    return (
        <div className="space-y-6">
            {/* Bizdire-style Header */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-[#2C3E50]">Tutor Dashboard</h1>
                    <div className="text-sm text-[#7D8DA6]">
                        <span className="text-[#7D8DA6]">tutor</span>
                        <span className="mx-2">/</span>
                        <span className="text-[#FF9F43]">dashboard </span>
                    </div>
                </div>
            </div>

            {/* Stats Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statsData.map((stat, index) => (
                    <StatsCard key={index} {...stat} />
                ))}
            </div>

            {/* Charts Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <AnalyticsChart data={stats?.monthlyData} />
                </div>
                <div>
                    <TopItemsWidget title="Top Performing Courses" data={stats?.topCourses} />
                </div>
            </div>

            {/* Ratings & Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                    <FeedbackWidget title="Ratings Overview" data={ratingsData} />
                </div>
                <div className="md:col-span-2">
                    <QuickLinksWidget stats={stats} />
                </div>
            </div>

            {/* Recent Enrollments Table */}
            <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Recent Enrollments</h3>
                <DataTable
                    data={recentEnrollments}
                    onView={handleViewEnrollment}
                    onDelete={handleDeleteEnrollment}
                />
            </div>
        </div>
    );
}