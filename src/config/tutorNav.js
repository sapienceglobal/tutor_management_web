import {
    LayoutDashboard,
    FileText,       // Manage Tests -> Quizzes/Exams
    BookOpen,       // Manage Learning -> Lessons
    Video,          // Manage Learning -> Videos
    Library,        // Library -> Question Bank
    Settings,       // Configuration
    Users,
    ClipboardList,
    HelpCircle,
    DollarSign
} from 'lucide-react';

export const tutorNavItems = [
    {
        title: "Home Dashboard",
        href: "/tutor/dashboard",
        icon: LayoutDashboard,
        type: "link"
    },
    {
        title: "ACADEMIC",
        type: "section",
        children: [
            {
                title: "Manage Exams",
                icon: FileText,
                submenu: [
                    { title: "All Quizzes & Exams", href: "/tutor/quizzes" },
                    { title: "Quiz Types", href: "/tutor/quiz-types" }, // Placeholder
                ]
            },
            {
                title: "Question Bank",
                icon: Library,
                submenu: [
                    { title: "All Questions", href: "/tutor/questions" },
                    { title: "AI Bulk Generator", href: "/tutor/questions/ai-generator" },
                ]
            },
            {
                title: "Manage Courses",
                icon: BookOpen,
                submenu: [
                    { title: "My Courses", href: "/tutor/courses" },
                    { title: "Student Batches", href: "/tutor/batches" },
                    { title: "Live Classes", href: "/tutor/live-classes" },
                ]
            },
            {
                title: "Schedule",
                icon: ClipboardList,
                submenu: [
                    { title: "All Bookings", href: "/tutor/appointments" },
                    { title: "Manage Availability", href: "/tutor/appointments/schedule" },
                ]
            }
        ]
    },
    {
        title: "PEOPLE",
        type: "section",
        children: [
            {
                title: "Students",
                icon: Users,
                href: "/tutor/students",
                type: "link"
            },
            {
                title: "Leave Requests",
                icon: FileText,
                href: "/tutor/leaves",
                type: "link"
            },
            {
                title: "Reviews",
                icon: HelpCircle, // Using HelpCircle as placeholder for Reviews if Star icon not imported
                href: "/tutor/reviews",
                type: "link"
            }
        ]
    },
    {
        title: "REPORTS",
        type: "section",
        children: [
            {
                title: "Analytics",
                icon: LayoutDashboard, // Reusing icon or need BarChart
                href: "/tutor/analytics",
                type: "link"
            },
            {
                title: "Earnings & Payouts",
                icon: DollarSign,
                href: "/tutor/earnings",
                type: "link"
            }
        ]
    },
    {
        title: "CONFIGURATION",
        type: "section",
        children: [
            {
                title: "Settings",
                icon: Settings,
                href: "/tutor/settings",
                type: "link"
            }
        ]
    }
];
