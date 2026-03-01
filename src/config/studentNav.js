import {
    LayoutDashboard,
    BookOpen,
    FileText,
    ClipboardList,
    BarChart3,
    Brain,
    Video,
    Users,
    Calendar,
    CreditCard,
    Award,
    User,
    Settings,
    GraduationCap,
    Heart,
    Search,
} from 'lucide-react';

export const studentNavItems = [
    {
        title: "Dashboard",
        href: "/student/dashboard",
        icon: LayoutDashboard,
        type: "link"
    },
    {
        title: "LEARNING",
        type: "section",
        children: [
            {
                title: "Courses",
                icon: BookOpen,
                submenu: [
                    { title: "My Courses", href: "/student/courses" },
                    { title: "My Wishlist", href: "/student/wishlist" },
                ]
            },
            {
                title: "Assignments",
                icon: ClipboardList,
                href: "/student/assignments",
                type: "link"
            },
            {
                title: "Tests",
                icon: FileText,
                submenu: [
                    { title: "My Exams", href: "/student/exams" },
                    { title: "Exam History", href: "/student/history" },
                    { title: "Practice Sets", href: "/student/practice-sets" },
                ]
            },
            {
                title: "Live Classes",
                icon: Video,
                href: "/student/live-classes",
                type: "link"
            },
            {
                title: "AI Tutor",
                icon: Brain,
                href: "/student/ai-tutor",
                type: "link"
            },
        ]
    },
    {
        title: "SCHEDULE",
        type: "section",
        children: [
            {
                title: "Batches",
                icon: Users,
                href: "/student/batches",
                type: "link"
            },
            {
                title: "Upcoming Exams",
                icon: Calendar,
                href: "/student/upcoming-exams",
                type: "link"
            },
            {
                title: "Leave Requests",
                icon: FileText,
                href: "/student/leaves",
                type: "link"
            },
        ]
    },
    {
        title: "REPORTS",
        type: "section",
        children: [
            {
                title: "Results & Analytics",
                icon: BarChart3,
                href: "/student/ai-analytics",
                type: "link"
            },
            {
                title: "Find a Tutor",
                icon: Search,
                href: "/student/tutors",
                type: "link"
            },
        ]
    },
    {
        title: "ACCOUNT",
        type: "section",
        children: [
            {
                title: "Payments",
                icon: CreditCard,
                href: "/student/payments",
                type: "link"
            },
            {
                title: "Certificates",
                icon: Award,
                href: "/student/profile/certificates",
                type: "link"
            },
            {
                title: "Profile",
                icon: User,
                href: "/student/profile",
                type: "link"
            },
            {
                title: "Settings",
                icon: Settings,
                href: "/student/profile/settings",
                type: "link"
            },
        ]
    }
];
