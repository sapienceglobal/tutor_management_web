import {
    LayoutDashboard,
    Users,
    GraduationCap,
    BookOpen,
    Settings,
    DollarSign,
    Shield,
    BarChart3
} from 'lucide-react';

export const adminNavItems = [
    {
        title: "Admin Dashboard",
        href: "/admin/dashboard",
        icon: LayoutDashboard,
        type: "link"
    },
    {
        title: "PLATFORM",
        type: "section",
        children: [
            {
                title: "Stats Overview",
                icon: BarChart3,
                href: "/admin/stats",
                type: "link"
            },
            {
                title: "Financials",
                icon: DollarSign,
                href: "/admin/earnings",
                type: "link"
            }
        ]
    },
    {
        title: "MANAGEMENT",
        type: "section",
        children: [
            {
                title: "Tutors",
                icon: GraduationCap,
                href: "/admin/tutors",
                type: "link"
            },
            {
                title: "Students",
                icon: Users,
                href: "/admin/students",
                type: "link"
            },
            {
                title: "Courses",
                icon: BookOpen,
                href: "/admin/courses",
                type: "link"
            }
        ]
    },
    {
        title: "SYSTEM",
        type: "section",
        children: [
            {
                title: "Settings",
                icon: Settings,
                href: "/admin/settings",
                type: "link"
            },
            {
                title: "Security & Logs",
                icon: Shield,
                href: "/admin/security",
                type: "link"
            }
        ]
    }
];
