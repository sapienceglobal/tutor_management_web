import {
    MdDashboard,
    MdMenuBook,
    MdCalendarMonth,
    MdArticle,
    MdLibraryBooks,
    MdLocalOffer,
    MdPeople,
    MdReport,
    MdEventAvailable,
    MdStar,
    MdAssignment,
    MdSchedule,
    MdBarChart,
    MdAccountBalanceWallet,
    MdAutoAwesome,
    MdCampaign,
    MdForum,
    MdChat,
    MdWorkspacePremium,
    MdSettings
} from 'react-icons/md';

export const tutorNavItems = [
    // ── Top-level direct link ──────────────────────────────────────────────
    {
        title: "Dashboard",
        href: "/tutor/dashboard",
        icon: MdDashboard,
        type: "link",
    },

    // ── COURSES & CLASSES ──────────────────────────────────────────────────
    {
        title: "COURSES & CLASSES",
        type: "section",
        children: [
            {
                title: "My Courses",
                icon: MdMenuBook,
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
                icon: MdCalendarMonth,
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
                icon: MdArticle,
                submenu: [
                    { title: "All Quizzes & Exams", href: "/tutor/quizzes" },
                    { title: "Re-evaluation Requests", href: "/tutor/quizzes/re-evaluations" },
                ],
            },
            {
                title: "Question Bank",
                icon: MdLibraryBooks,
                submenu: [
                    { title: "All Questions", href: "/tutor/questions" },
                    { title: "AI Bulk Generator", href: "/tutor/questions/ai-generator", badge: "Premium", featureGate: "aiAssessment" },
                ],
            },
            {
                title: "Taxonomy",
                icon: MdLocalOffer,
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
                icon: MdPeople,
                href: "/tutor/students",
                type: "link",
            },
            {
                title: "At-Risk Students",
                icon: MdReport,
                href: "/tutor/students/at-risk",
                type: "link",
            },
            {
                title: "Leave Requests",
                icon: MdEventAvailable,
                href: "/tutor/leaves",
                type: "link",
            },
            {
                title: "Reviews",
                icon: MdStar,
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
                icon: MdAssignment,
                href: "/tutor/reports",
                type: "link",
            },
            {
                title: "Student Performance",
                icon: MdPeople,
                href: "/tutor/students/performance",
                type: "link",
            },
            {
                title: "Attendance Reports",
                icon: MdSchedule,
                href: "/tutor/reports/attendance",
                type: "link",
            },
            {
                title: "Analytics",
                icon: MdBarChart,
                href: "/tutor/analytics",
                type: "link",
            },
            {
                title: "Earnings & Payouts",
                icon: MdAccountBalanceWallet,
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
                icon: MdAutoAwesome,
                href: "/tutor/ai-buddy",  
                type: "link",
                badge: "Premium",
                featureGate: "aiAssistant", 
            },
            {
                title: "Announcements",
                icon: MdCampaign,
                href: "/tutor/announcements",
                type: "link",
            },
            {
                title: "Discussion Forum",
                icon: MdForum,
                href: "/tutor/discussions",
                type: "link",
            },
            {
                title: "Messages",
                icon: MdChat,
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
                title: "Subscription",
                icon: MdWorkspacePremium,
                href: "/tutor/subscription",
                type: "link",
            },
            {
                title: "Settings",
                icon: MdSettings,
                href: "/tutor/settings",
                type: "link",
            },
        ],
    },
];
