'use client';

import { PlusCircle, Video, BookOpen, Users, DollarSign, Star, Settings, FileQuestion } from 'lucide-react';
import Link from 'next/link';

export default function QuickLinksWidget({ stats }) {
    const links = [
        {
            title: 'Create Course',
            value: 'New',
            icon: PlusCircle,
            href: '/tutor/courses/create',
            color: 'text-indigo-600',
            bg: 'bg-indigo-50'
        },
        {
            title: 'My Courses',
            value: stats?.activeCourses?.toString() || '0',
            icon: BookOpen,
            href: '/tutor/courses',
            color: 'text-orange-600',
            bg: 'bg-orange-50'
        },
        {
            title: 'My Students',
            value: stats?.totalStudents?.toString() || '0',
            icon: Users,
            href: '/tutor/students',
            color: 'text-blue-600',
            bg: 'bg-blue-50'
        },
        {
            title: 'Create Quiz',
            value: 'Add',
            icon: FileQuestion,
            href: '/tutor/quizzes/create',
            color: 'text-emerald-600',
            bg: 'bg-emerald-50'
        },
        {
            title: 'Live Classes',
            value: 'Schedule',
            icon: Video,
            href: '/tutor/live-classes',
            color: 'text-red-600',
            bg: 'bg-red-50'
        },
        {
            title: 'Earnings',
            value: `$${(stats?.totalEarnings || 0).toLocaleString()}`,
            icon: DollarSign,
            href: '/tutor/earnings',
            color: 'text-green-600',
            bg: 'bg-green-50'
        },
        {
            title: 'Reviews',
            value: stats?.totalReviews?.toString() || '0',
            icon: Star,
            href: '/tutor/reviews',
            color: 'text-yellow-600',
            bg: 'bg-yellow-50'
        },
        {
            title: 'Settings',
            value: 'Profile',
            icon: Settings,
            href: '/tutor/settings',
            color: 'text-slate-600',
            bg: 'bg-slate-50'
        }
    ];

    return (
        <div className="h-full">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Quick Actions & Stats</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 h-full">
                {links.map((link, index) => {
                    const Icon = link.icon;
                    return (
                        <Link
                            key={index}
                            href={link.href}
                            className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-all flex flex-col items-center justify-center gap-3 group"
                        >
                            <div className={`w-12 h-12 rounded-full ${link.bg} flex items-center justify-center transition-transform group-hover:scale-110`}>
                                <Icon className={`w-6 h-6 ${link.color}`} />
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">{link.title}</p>
                                <p className="text-lg font-bold text-slate-800">{link.value}</p>
                            </div>
                        </Link>
                    )
                })}
            </div>
        </div>
    );
}
