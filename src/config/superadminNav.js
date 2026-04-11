import {
    LayoutDashboard,
    Building2,
    Users,
    GraduationCap,
    BookOpen,
    Layers,
    MonitorPlay,
    ClipboardCheck,
    FileText,
    Wallet,
    MessageSquare,
    Cpu,
    BarChart3,
    Network,
    Activity,
    ShieldCheck
} from 'lucide-react';

export const superadminNavItems = [
    {
        title: 'Dashboard',
        href: '/superadmin',
        icon: LayoutDashboard,
        type: 'link'
    },
    {
        title: 'Institutes',
        href: '/superadmin/institutes',
        icon: Building2,
        type: 'link'
    },
    {
        title: 'Instructors',
        href: '/superadmin/instructors', // Replace with your actual route
        icon: Users,
        type: 'link'
    },
    {
        title: 'Students',
        href: '/superadmin/students', // Replace with your actual route
        icon: GraduationCap,
        type: 'link'
    },
    {
        title: 'Courses',
        href: '/superadmin/courses', // Replace with your actual route
        icon: BookOpen,
        type: 'link'
    },
    {
        title: 'Batches',
        href: '/superadmin/batches', // Replace with your actual route
        icon: Layers,
        type: 'link'
    },
    {
        title: 'Live Classes',
        href: '/superadmin/live-classes', // Replace with your actual route
        icon: MonitorPlay,
        type: 'link'
    },
    {
        title: 'Attendance',
        href: '/superadmin/attendance', // Replace with your actual route
        icon: ClipboardCheck,
        type: 'link'
    },
    {
        title: 'Exams & Assessments',
        href: '/superadmin/exams', // Replace with your actual route
        icon: FileText,
        type: 'link'
    },
    {
        title: 'Assignments',
        href: '/superadmin/assignments', // Replace with your actual route
        icon: FileText, // You can choose a different icon if preferred
        type: 'link'
    },
    {
        title: 'Finance',
        type: 'section', // Has submenu arrow in image
        icon: Wallet,
        children: [
             { title: 'Overview', href: '/superadmin/finance', icon: Wallet },
             // Add other finance sub-links here
        ]
    },
    {
        title: 'Communication',
        type: 'section', // Has submenu arrow in image
        icon: MessageSquare,
        children: [
             { title: 'Messages', href: '/superadmin/communication', icon: MessageSquare },
             // Add other comm sub-links here
        ]
    },
    {
        title: 'AI Coordinator',
        type: 'section', // Has submenu arrow in image
        icon: Cpu,
        children: [
             { title: 'Settings', href: '/superadmin/ai', icon: Cpu },
        ]
    },
    {
        title: 'Reports & Analytics',
        href: '/superadmin/activity', // Replaced Platform Activity with this
        icon: BarChart3,
        type: 'link'
    },
    {
        title: 'Integrations',
        type: 'section', // Has submenu arrow in image
        icon: Network,
        children: [
             { title: 'All Integrations', href: '/superadmin/integrations', icon: Network },
        ]
    },
    {
        title: 'System Monitoring',
        href: '/superadmin/monitoring', // Replace with your actual route
        icon: Activity,
        type: 'link'
    },
    {
        title: 'Audit & Security',
        type: 'section', // Has submenu arrow in image
        icon: ShieldCheck,
        children: [
             { title: 'Logs', href: '/superadmin/security', icon: ShieldCheck },
        ]
    }
];