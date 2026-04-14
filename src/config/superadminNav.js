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
    ShieldCheck,
    CreditCard,   // Subscriptions ke liye
    Receipt       // Subscription Plans ke liye
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
        href: '/superadmin/instructors',
        icon: Users,
        type: 'link'
    },
    {
        title: 'Students',
        href: '/superadmin/students',
        icon: GraduationCap,
        type: 'link'
    },
    {
        title: 'Courses',
        href: '/superadmin/courses',
        icon: BookOpen,
        type: 'link'
    },
    {
        title: 'Batches',
        href: '/superadmin/batches',
        icon: Layers,
        type: 'link'
    },
    {
        title: 'Live Classes',
        href: '/superadmin/live-classes',
        icon: MonitorPlay,
        type: 'link'
    },
    {
        title: 'Attendance',
        href: '/superadmin/attendance',
        icon: ClipboardCheck,
        type: 'link'
    },
    {
        title: 'Exams & Assessments',
        href: '/superadmin/exams',
        icon: FileText,
        type: 'link'
    },
    {
        title: 'Assignments',
        href: '/superadmin/assignments',
        icon: FileText,
        type: 'link'
    },
    
    // ---- NAYI HEADING (SECTION) NEECHE KI SIDE ----
    {
        title: 'Subscription & Billing',
        type: 'section', 
        icon: CreditCard,
        children: [
             { 
                 title: 'Total Subscriptions', 
                 href: '/superadmin/subscriptions', 
                 icon: CreditCard 
             },
             { 
                 title: 'Subscription Plans', 
                 href: '/superadmin/subscription-plans', // Apne folder structure ke hisaab se route check kar lena
                 icon: Receipt 
             }
        ]
    },
    // ------------------------------------------------
    
    {
        title: 'Finance',
        type: 'section',
        icon: Wallet,
        children: [
             { title: 'Overview', href: '/superadmin/finance', icon: Wallet },
        ]
    },
    {
        title: 'Communication',
        type: 'section',
        icon: MessageSquare,
        children: [
             { title: 'Messages', href: '/superadmin/communication', icon: MessageSquare },
        ]
    },
    {
        title: 'AI Coordinator',
        type: 'section',
        icon: Cpu,
        children: [
             { title: 'Settings', href: '/superadmin/ai', icon: Cpu },
        ]
    },
    {
        title: 'Reports & Analytics',
        href: '/superadmin/activity',
        icon: BarChart3,
        type: 'link'
    },
    {
        title: 'Integrations',
        type: 'section',
        icon: Network,
        children: [
             { title: 'All Integrations', href: '/superadmin/integrations', icon: Network },
        ]
    },
    {
        title: 'System Monitoring',
        href: '/superadmin/monitoring',
        icon: Activity,
        type: 'link'
    },
    {
        title: 'Audit & Security',
        type: 'section',
        icon: ShieldCheck,
        children: [
             { title: 'Logs', href: '/superadmin/security', icon: ShieldCheck },
        ]
    },
];