import {
    MdDashboard,
    MdBusiness,
    MdPeople,
    MdMenuBook,
    MdLayers,
    MdVideocam,
    MdAssignmentTurnedIn,
    MdArticle,
    MdAccountBalanceWallet,
    MdMessage,
    MdHeadset,
    MdSettings,
    MdAutoAwesome,
    MdCreditCard,
    MdReceipt,
    MdWeb,
    MdHub,
    MdTimeline,
    MdSecurity,
    MdCurrencyRupee,
    MdGppMaybe,
    MdTrackChanges,
    MdFormatListBulleted,
    MdDns,
    MdBolt
} from 'react-icons/md';

export const superadminNavItems = [
    // ─── CORE OPERATIONS ───
    {
        title: 'Dashboard',
        href: '/superadmin',
        icon: MdDashboard,
        type: 'link'
    },
    {
        title: 'Institutes (Tenants)',
        href: '/superadmin/institutes',
        icon: MdBusiness,
        type: 'link'
    },
    {
        title: 'Global Users',
        href: '/superadmin/users',
        icon: MdPeople,
        type: 'link'
    },

    // ─── SAAS & REVENUE ───
    {
        title: 'Subscription & Billing',
        type: 'section',
        icon: MdCreditCard,
        children: [
            { title: 'Total Subscriptions', href: '/superadmin/subscriptions', icon: MdCreditCard },
            { title: 'Subscription Plans', href: '/superadmin/subscription-plans', icon: MdReceipt }
        ]
    },
    {
        title: 'Finance & Payouts',
        type: 'section',
        icon: MdAccountBalanceWallet,
        children: [
            { title: 'Revenue Overview', href: '/superadmin/finance', icon: MdAccountBalanceWallet },
            { title: 'Tutor Settlements', href: '/superadmin/payouts', icon: MdCurrencyRupee },
        ]
    },

    // ─── PLATFORM RADAR (GOD VIEWS) ───
    {
        title: 'Platform Radar',
        type: 'section',
        icon: MdTrackChanges,
        children: [
            { title: 'Live Classes', href: '/superadmin/live-classes', icon: MdVideocam },
            { title: 'Active Courses', href: '/superadmin/courses', icon: MdMenuBook },
            { title: 'Global Batches', href: '/superadmin/batches', icon: MdLayers },
            { title: 'Exams & Proctoring', href: '/superadmin/exams', icon: MdArticle },
            { title: 'Assignments', href: '/superadmin/assignments', icon: MdArticle },
            { title: 'Attendance Stats', href: '/superadmin/attendance', icon: MdAssignmentTurnedIn },
        ]
    },

    // ─── TRUST, SAFETY & SYSTEM ───
    {
        title: 'Trust & System Health',
        type: 'section',
        icon: MdSecurity,
        children: [
            { title: 'Abuse Reports', href: '/superadmin/reports', icon: MdGppMaybe },
            { title: 'Audit Logs (Tech)', href: '/superadmin/security', icon: MdSecurity },
            { title: 'Activity Timeline', href: '/superadmin/activity', icon: MdFormatListBulleted },
            { title: 'System Monitoring', href: '/superadmin/monitoring', icon: MdDns }
        ]
    },

    // ─── GROWTH & MARKETING ───
    {
        title: 'Website & CMS',
        type: 'section',
        icon: MdWeb,
        children: [
            { title: 'Pages', href: '/superadmin/cms/pages', icon: MdWeb },
            { title: 'Blogs', href: '/superadmin/cms/blogs', icon: MdArticle }
        ]
    },
    {
        title: 'CRM & Leads',
        href: '/superadmin/crm',
        icon: MdHeadset,
        type: 'link'
    },
    {
        title: 'Communication',
        href: '/superadmin/communication',
        icon: MdMessage,
        type: 'link'
    },

    // ─── AI INTELLIGENCE HUB ───
    {
        title: 'AI Intelligence',
        type: 'section',
        icon: MdAutoAwesome,
        children: [
            {
                title: 'Live Chat (God Mode)',
                href: '/superadmin/ai-coordinator',
                icon: MdMessage
            },
            {
                title: 'Daily Briefings',
                href: '/superadmin/ai-coordinator/briefings',
                icon: MdBolt
            }
        ]
    },
    {
        title: 'API Integrations',
        href: '/superadmin/integrations',
        icon: MdHub,
        type: 'link'
    },
    {
        title: 'Platform Settings',
        href: '/superadmin/settings',
        icon: MdSettings,
        type: 'link'
    }
];