import {
    LayoutDashboard,
    Building2,
    Users,
    BookOpen,
    Layers,
    MonitorPlay,
    ClipboardCheck,
    FileText,
    Wallet,
    MessageSquare,
    Headset,
    Settings,
    BrainCircuit,
    CreditCard,   
    Receipt,      
    LayoutTemplate, 
    Network,
    Activity,
    ShieldCheck,
    IndianRupee,
    ShieldAlert,
    Radar,
    ListTree
} from 'lucide-react';

export const superadminNavItems = [
    // ─── CORE OPERATIONS ───
    {
        title: 'Dashboard',
        href: '/superadmin',
        icon: LayoutDashboard,
        type: 'link'
    },
    {
        title: 'Institutes (Tenants)',
        href: '/superadmin/institutes',
        icon: Building2,
        type: 'link'
    },
    {
        title: 'Global Users',
        href: '/superadmin/users', 
        icon: Users,
        type: 'link'
    },

    // ─── SAAS & REVENUE ───
    {
        title: 'Subscription & Billing',
        type: 'section', 
        icon: CreditCard,
        children: [
             { title: 'Total Subscriptions', href: '/superadmin/subscriptions', icon: CreditCard },
             { title: 'Subscription Plans', href: '/superadmin/subscription-plans', icon: Receipt }
        ]
    },
    {
        title: 'Finance & Payouts',
        type: 'section',
        icon: Wallet,
        children: [
             { title: 'Revenue Overview', href: '/superadmin/finance', icon: Wallet },
             { title: 'Tutor Settlements', href: '/superadmin/payouts', icon: IndianRupee },
        ]
    },

    // ─── PLATFORM RADAR (GOD VIEWS) ───
    {
        title: 'Platform Radar',
        type: 'section',
        icon: Radar,
        children: [
             { title: 'Live Classes', href: '/superadmin/live-classes', icon: MonitorPlay },
             { title: 'Active Courses', href: '/superadmin/courses', icon: BookOpen },
             { title: 'Global Batches', href: '/superadmin/batches', icon: Layers },
             { title: 'Exams & Proctoring', href: '/superadmin/exams', icon: FileText },
             { title: 'Assignments', href: '/superadmin/assignments', icon: FileText },
             { title: 'Attendance Stats', href: '/superadmin/attendance', icon: ClipboardCheck },
        ]
    },

    // ─── TRUST, SAFETY & SYSTEM ───
    {
        title: 'Trust & Security',
        type: 'section',
        icon: ShieldCheck,
        children: [
             { title: 'Abuse Reports', href: '/superadmin/reports', icon: ShieldAlert },
             { title: 'Audit Logs (Tech)', href: '/superadmin/security', icon: ShieldCheck },
             // 👇 Yahan tumhara Activity Route map kiya hai ekdam clear naam ke sath!
             { title: 'Activity Timeline', href: '/superadmin/activity', icon: ListTree } 
        ]
    },

    // ─── GROWTH & MARKETING ───
    {
        title: 'Website & CMS',
        type: 'section',
        icon: LayoutTemplate,
        children: [
             { title: 'Pages', href: '/superadmin/cms/pages', icon: LayoutTemplate },
             { title: 'Blogs', href: '/superadmin/cms/blogs', icon: FileText }
        ]
    },
    {
        title: 'CRM & Leads',
        href: '/superadmin/crm',
        icon: Headset,
        type: 'link'
    },
    {
        title: 'Communication',
        href: '/superadmin/communication',
        icon: MessageSquare,
        type: 'link'
    },

    // ─── CONFIGURATION ───
    {
        title: 'AI Coordinator',
        href: '/superadmin/ai-coordinator',
        icon: BrainCircuit,
        type: 'link'
    },
    {
        title: 'API Integrations',
        href: '/superadmin/integrations',
        icon: Network,
        type: 'link'
    },
    {
        title: 'Platform Settings',
        href: '/superadmin/settings',
        icon: Settings,
        type: 'link'
    }
];