import {
    LayoutDashboard,
    Building2,
    Settings,
    Users,
    Activity,
    Users2,
    FileText,
    LayoutTemplate,
} from 'lucide-react';

export const superadminNavItems = [
    {
        title: 'Overview',
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
        title: 'All Users',
        href: '/superadmin/users',
        icon: Users,
        type: 'link'
    },
    {
        title: 'Platform Activity',
        href: '/superadmin/activity',
        icon: Activity,
        type: 'link'
    },
    {
        title: 'CRM & MARKETING',
        type: 'section',
        children: [
            { title: 'CRM & Leads', icon: Users2, href: '/superadmin/crm' },
        ]
    },
    {
        title: 'CMS',
        type: 'section',
        children: [
            { title: 'Dynamic Pages', href: '/superadmin/cms/pages', icon: FileText },
            { title: 'Blog Manager', href: '/superadmin/cms/blogs', icon: FileText },
        ]
    },
    {
        title: 'Global Settings',
        href: '/superadmin/settings',
        icon: Settings,
        type: 'link'
    }
];
