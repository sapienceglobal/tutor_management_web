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
    Compass,
    MessageSquare,
    Sparkles,
    HelpCircle,
    BookMarked,
    ScrollText,
    Target,
    CalendarCheck,
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
                    { title: "Explore Courses", href: "/student/courses?tab=discover" },
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
                    { title: "Upcoming Exams", href: "/student/upcoming-exams" },
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
                title: "AI Buddy",
                icon: Sparkles,
                submenu: [
                    { title: "AI Tutor Chat", href: "/student/ai-tutor" },
                    { title: "Doubt Solver", href: "/student/ai-buddy/doubt-solver" },
                    { title: "Shared Notes", href: "/student/ai-buddy/shared-notes" },
                    { title: "Lecture Summaries", href: "/student/ai-buddy/lecture-summaries" },
                    { title: "Study Plans", href: "/student/ai-buddy/study-plans" },
                    { title: "My Weak Areas", href: "/student/ai-buddy/weak-topics" },
                ]
            },
            {
                title: "Messages",
                icon: MessageSquare,
                href: "/student/messages",
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
                title: "Reports & Analytics", 
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
