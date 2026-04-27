import { 
    MdDashboard, 
    MdMenuBook, 
    MdAssignment, 
    MdArticle, 
    MdVideocam, 
    MdAutoAwesome, 
    MdChat, 
    MdPeople, 
    MdBarChart, 
    MdSearch, 
    MdCreditCard, 
    MdWorkspacePremium, 
    MdPerson, 
    MdSettings 
} from 'react-icons/md';

export const studentNavItems = [
    {
        title: "Dashboard",
        href: "/student/dashboard",
        icon: MdDashboard,
        type: "link"
    },
    {
        title: "LEARNING",
        type: "section",
        children: [
            {
                title: "Courses",
                icon: MdMenuBook,
                submenu: [
                    { title: "My Courses", href: "/student/courses" },
                    { title: "Explore Courses", href: "/student/courses?tab=discover" },
                    { title: "My Wishlist", href: "/student/wishlist" },
                ]
            },
            {
                title: "Assignments",
                icon: MdAssignment,
                href: "/student/assignments",
                type: "link"
            },
            {
                title: "Tests",
                icon: MdArticle,
                submenu: [
                    { title: "My Exams", href: "/student/exams" },
                    { title: "Upcoming Exams", href: "/student/upcoming-exams" },
                    { title: "Exam History", href: "/student/history" },
                    { title: "Practice Sets", href: "/student/practice-sets" },
                ]
            },
            {
                title: "Live Classes",
                icon: MdVideocam,
                href: "/student/live-classes",
                type: "link"
            },
            {
                title: "AI Buddy",
                icon: MdAutoAwesome,
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
                icon: MdChat,
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
                icon: MdPeople,
                href: "/student/batches",
                type: "link"
            },
            {
                title: "Leave Requests",
                icon: MdArticle,
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
                icon: MdBarChart,
                href: "/student/ai-analytics",
                type: "link"
            },
            {
                title: "Find a Tutor",
                icon: MdSearch,
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
                icon: MdCreditCard,
                href: "/student/payments",
                type: "link"
            },
            {
                title: "Certificates",
                icon: MdWorkspacePremium,
                href: "/student/profile/certificates",
                type: "link"
            },
            {
                title: "Profile",
                icon: MdPerson,
                href: "/student/profile",
                type: "link"
            },
            {
                title: "Settings",
                icon: MdSettings,
                href: "/student/profile/settings",
                type: "link"
            },
        ]
    }
];