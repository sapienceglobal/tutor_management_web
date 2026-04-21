import {
    LayoutDashboard,
    FileText,
    BookOpen,
    Library,
    Settings,
    Users,
    ClipboardList,
    DollarSign,
    BrainCircuit,
    Star,
    BarChart2,
    Video,
    CalendarDays,
    CalendarCheck,
    GraduationCap,
    ClipboardCheck,
    Layers,
    Cpu,
    Tag,
    CalendarClock,
    Wallet,
    Megaphone,
    MessageSquare,
    MessageCircle,
    ShieldAlert,
} from 'lucide-react';

export const tutorNavItems = [
    // ── Top-level direct link ──────────────────────────────────────────────
    {
        title: "Dashboard",
        href: "/tutor/dashboard",
        icon: LayoutDashboard,
        type: "link",
    },

    // ── COURSES & CLASSES ──────────────────────────────────────────────────
    {
        title: "COURSES & CLASSES",
        type: "section",
        children: [
            {
                title: "My Courses",
                icon: BookOpen,
                submenu: [
                    { title: "All Courses", href: "/tutor/courses" },
                    { title: "Student Batches", href: "/tutor/batches" },
                    { title: "Live Classes", href: "/tutor/live-classes" },
                    { title: "Assignments", href: "/tutor/assignments" },
                    { title: "Attendance", href: "/tutor/attendance" },
                ],
            },
            {
                title: "Schedule",
                icon: CalendarDays,
                submenu: [
                    { title: "All Bookings", href: "/tutor/appointments" },
                    { title: "Manage Availability", href: "/tutor/appointments/schedule" },
                ],
            },
        ],
    },

    // ── ASSESSMENTS ────────────────────────────────────────────────────────
    {
        title: "ASSESSMENTS",
        type: "section",
        children: [
            {
                title: "Quizzes & Exams",
                icon: FileText,
                submenu: [
                    { title: "All Quizzes & Exams", href: "/tutor/quizzes" },
                    { title: "Re-evaluation Requests", href: "/tutor/quizzes/re-evaluations" },
                ],
            },
            {
                title: "Question Bank",
                icon: Library,
                submenu: [
                    { title: "All Questions", href: "/tutor/questions" },
                    { title: "AI Bulk Generator", href: "/tutor/questions/ai-generator" },
                ],
            },
            {
                title: "Taxonomy",
                icon: Tag,
                submenu: [
                    { title: "Manage Topics", href: "/tutor/taxonomy/topics" },
                    { title: "Manage Skills", href: "/tutor/taxonomy/skills" },
                ],
            },
        ],
    },

    // ── PEOPLE ─────────────────────────────────────────────────────────────
    {
        title: "PEOPLE",
        type: "section",
        children: [
            {
                title: "Students",
                icon: Users,
                href: "/tutor/students",
                type: "link",
            },
            {
                title: "At-Risk Students",
                icon: ShieldAlert,
                href: "/tutor/students/at-risk",
                type: "link",
            },
            {
                title: "Leave Requests",
                icon: CalendarCheck,
                href: "/tutor/leaves",
                type: "link",
            },
            {
                title: "Reviews",
                icon: Star,
                href: "/tutor/reviews",
                type: "link",
            },
        ],
    },

    // ── REPORTS ────────────────────────────────────────────────────────────
    {
        title: "REPORTS",
        type: "section",
        children: [
            {
                title: "Reports Hub",
                icon: FileText,
                href: "/tutor/reports",
                type: "link",
            },
            {
                title: "Student Performance",
                icon: Users,
                href: "/tutor/students/performance",
                type: "link",
            },
            {
                title: "Attendance Reports",
                icon: CalendarClock,
                href: "/tutor/reports/attendance",
                type: "link",
            },
            {
                title: "Analytics",
                icon: BarChart2,
                href: "/tutor/analytics",
                type: "link",
            },
            {
                title: "Earnings & Payouts",
                icon: Wallet,
                href: "/tutor/earnings",
                type: "link",
            },
        ],
    },

    // ── CONFIGURATION ──────────────────────────────────────────────────────
   {
        title: "COMMUNICATION",
        type: "section",
        children: [
           {
                title: "AI Buddy",
                icon: BrainCircuit,
                href: "/tutor/ai-buddy",  
                type: "link",
                badge: "Premium",
                featureGate: "aiAssistant", 
            },
            {
                title: "Announcements",
                icon: Megaphone,
                href: "/tutor/announcements",
                type: "link",
            },
            {
                title: "Discussion Forum",
                icon: MessageCircle,
                href: "/tutor/discussions",
                type: "link",
            },
            {
                title: "Messages",
                icon: MessageSquare,
                href: "/tutor/messages",
                type: "link",
            },
        ],
    },

    {
        title: "CONFIGURATION",
        type: "section",
        children: [
            {
                title: "Settings",
                icon: Settings,
                href: "/tutor/settings",
                type: "link",
            },
        ],
    },
];
