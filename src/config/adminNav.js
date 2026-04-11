import {
    LayoutDashboard,
    Users,
    GraduationCap,
    BookOpen,
    Settings,
    DollarSign,
    Shield,
    BarChart3,
    Tags,
    CreditCard,
    Activity,
    Mail,
    Building2,
    Crown
} from 'lucide-react';

export const adminNavItems = [
    {
        title: "Admin Dashboard",
        href: "/admin/dashboard",
        icon: LayoutDashboard,
        type: "link"
    },
    {
        title: "PLATFORM",
        type: "section",
        children: [
            {
                title: "Stats Overview",
                icon: BarChart3,
                href: "/admin/stats",
                type: "link"
            },
            {
                title: "Earnings Overview",
                icon: DollarSign,
                href: "/admin/earnings",
                type: "link"
            },
            {
                title: "Payout Requests",
                icon: CreditCard,
                href: "/admin/payouts",
                type: "link"
            }
        ]
    },
    {
        title: "MANAGEMENT",
        type: "section",
        children: [
            {
                title: "Invite Management",
                icon: Mail,
                href: "/admin/invites",
                type: "link"
            },
            {
                title: "Tutors",
                icon: GraduationCap,
                href: "/admin/tutors",
                type: "link"
            },
            {
                title: "Leave Requests",
                icon: BookOpen,
                href: "/admin/leaves",
                type: "link"
            },
            {
                title: "Students",
                icon: Users,
                href: "/admin/students",
                type: "link"
            },
            {
                title: "Courses",
                icon: BookOpen,
                href: "/admin/courses",
                type: "link"
            },
            {
                title: "Batches",
                icon: Users,
                href: "/admin/batches",
                type: "link"
            },
            {
                title: "Categories",
                icon: Tags,
                href: "/admin/categories",
                type: "link"
            },
            {
                title: "Branches",
                icon: Building2,
                href: "/admin/branches",
                type: "link"
            },
            {
                title: "Fee Collection",
                icon: DollarSign,
                href: "/admin/fees",
                type: "link"
            }
        ]
    },
    {
        title: "SYSTEM",
        type: "section",
        children: [
            {
                title: "Settings",
                icon: Settings,
                href: "/admin/settings",
                type: "link"
            },
            {
                title: "Subscription",
                icon: Crown,
                href: "/admin/subscription",
                type: "link"
            },
            {
                title: "Security & Logs",
                icon: Shield,
                href: "/admin/security",
                type: "link"
            }
        ]
    }
];
