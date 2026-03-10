'use client';

import { useState, useEffect } from 'react';
import { fetchPlatformStats } from '@/services/superadminService';
import { Building2, Users, GraduationCap, MonitorPlay } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SuperadminDashboard() {
    const [stats, setStats] = useState({
        totalInstitutes: 0,
        activeInstitutes: 0,
        totalUsers: 0,
        totalTutors: 0,
        totalStudents: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadStats = async () => {
            try {
                const data = await fetchPlatformStats();
                if (data.success) {
                    setStats(data.stats);
                }
            } catch (error) {
                toast.error('Failed to load platform stats');
            } finally {
                setLoading(false);
            }
        };

        loadStats();
    }, []);

    const statCards = [
        {
            title: 'Total Institutes',
            value: stats.totalInstitutes,
            subtext: `${stats.activeInstitutes} Active`,
            icon: Building2,
            colors: 'bg-blue-50 text-blue-600'
        },
        {
            title: 'Total Tutors',
            value: stats.totalTutors,
            subtext: 'Across all institutes',
            icon: MonitorPlay,
            colors: 'bg-green-50 text-green-600'
        },
        {
            title: 'Total Students',
            value: stats.totalStudents,
            subtext: 'Across all institutes',
            icon: GraduationCap,
            colors: 'bg-purple-50 text-purple-600'
        },
        {
            title: 'Platform Users',
            value: stats.totalUsers,
            subtext: 'Excluding superadmins',
            icon: Users,
            colors: 'bg-orange-50 text-orange-600'
        }
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-800">Platform Overview</h1>
                    <p className="text-slate-500 mt-1">Monitor all institutes and user activity across the Sapience LMS ecosystem.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((card, index) => (
                    <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">{card.title}</p>
                                <h3 className="text-3xl font-bold text-slate-800 mt-2">{card.value}</h3>
                                <p className="text-sm text-slate-400 mt-1">{card.subtext}</p>
                            </div>
                            <div className={`p-4 rounded-xl ${card.colors}`}>
                                <card.icon className="w-6 h-6" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Actions / Getting Started */}
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-8 text-white shadow-lg">
                <h2 className="text-2xl font-bold mb-2">Welcome to Sapience Super Admin</h2>
                <p className="text-indigo-100 mb-6 max-w-2xl">
                    You have global access to manage institutes, configure SaaS plans, and monitor overall platform health.
                </p>
                <div className="flex gap-4">
                    <a href="/superadmin/institutes" className="px-6 py-2.5 bg-white text-indigo-600 hover:bg-indigo-50 font-medium rounded-lg transition-colors">
                        Manage Institutes
                    </a>
                </div>
            </div>
        </div>
    );
}
