'use client';

import { LayoutDashboard, BookOpen, Users, BarChart3, Settings, FileQuestion, Calendar, Video } from 'lucide-react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

const tutorNavItems = [
    {
        title: "Dashboard",
        href: "/tutor/dashboard",
        icon: LayoutDashboard,
    },
    {
        title: "My Courses",
        href: "/tutor/courses",
        icon: BookOpen,
    },
    {
        title: "Live Classes",
        href: "/tutor/live-classes",
        icon: Video,
    },
    {
        title: "Appointments",
        href: "/tutor/appointments",
        icon: Calendar,
    },
    {
        title: "Exams & Quizzes",
        href: "/tutor/exams",
        icon: FileQuestion,
    },
    {
        title: "Students",
        href: "/tutor/students",
        icon: Users,
    },
    {
        title: "Analytics",
        href: "/tutor/analytics",
        icon: BarChart3,
    },
    {
        title: "Settings",
        href: "/tutor/settings",
        icon: Settings,
    },
];

export default function TutorLayout({ children }) {
    return (
        <div className="min-h-screen bg-gray-50/50">
            <Sidebar items={tutorNavItems} />
            <div className="lg:pl-64 flex flex-col min-h-screen">
                <Header />
                <main className="flex-1 p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
