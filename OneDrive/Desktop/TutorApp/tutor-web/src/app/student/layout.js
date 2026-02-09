'use client';

import { LayoutDashboard, BookOpen, PlayCircle, History, UserCircle, Video } from 'lucide-react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

const studentNavItems = [
    {
        title: "Dashboard",
        href: "/student/dashboard",
        icon: LayoutDashboard,
    },
    {
        title: "Browse Courses",
        href: "/student/courses",
        icon: BookOpen,
    },
    {
        title: "My Learning",
        href: "/student/learning",
        icon: PlayCircle,
    },
    {
        title: "Live Classes",
        href: "/student/live-classes",
        icon: Video,
    },
    {
        title: "Quiz History",
        href: "/student/history",
        icon: History,
    },
    {
        title: "Profile",
        href: "/student/profile",
        icon: UserCircle,
    },
];

export default function StudentLayout({ children }) {
    return (
        <div className="min-h-screen bg-gray-50/50">
            <Sidebar items={studentNavItems} />
            <div className="lg:pl-64 flex flex-col min-h-screen">
                <Header />
                <main className="flex-1 p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
