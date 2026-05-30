import {
    MdDashboard,
    MdPeople,
    MdSchool,
    MdMenuBook,
    MdSettings,
    MdAttachMoney,
    MdSecurity,
    MdBarChart,
    MdLocalOffer,
    MdCreditCard,
    MdEmail,
    MdBusiness,
    MdWorkspacePremium
} from 'react-icons/md';

export const adminNavItems = [
    {
        title: "Admin Dashboard",
        href: "/admin/dashboard",
        icon: MdDashboard,
        type: "link"
    },
    {
        title: "PLATFORM",
        type: "section",
        children: [
            {
                title: "Stats Overview",
                icon: MdBarChart,
                href: "/admin/stats",
                type: "link"
            },
            {
                title: "Earnings Overview",
                icon: MdAttachMoney,
                href: "/admin/earnings",
                type: "link"
            },
            {
                title: "Payout Requests",
                icon: MdCreditCard,
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
                icon: MdEmail,
                href: "/admin/invites",
                type: "link"
            },
            {
                title: "Tutors",
                icon: MdSchool,
                href: "/admin/tutors",
                type: "link"
            },
            {
                title: "Leave Requests",
                icon: MdMenuBook,
                href: "/admin/leaves",
                type: "link"
            },
            {
                title: "Students",
                icon: MdPeople,
                href: "/admin/students",
                type: "link"
            },
            {
                title: "Courses",
                icon: MdMenuBook,
                href: "/admin/courses",
                type: "link"
            },
            {
                title: "Batches",
                icon: MdPeople,
                href: "/admin/batches",
                type: "link"
            },
            {
                title: "Categories",
                icon: MdLocalOffer,
                href: "/admin/categories",
                type: "link"
            },
            {
                title: "Branches",
                icon: MdBusiness,
                href: "/admin/branches",
                type: "link"
            },
            {
                title: "Fee Collection",
                icon: MdAttachMoney,
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
                icon: MdSettings,
                href: "/admin/settings",
                type: "link"
            },
            {
                title: "Subscription",
                icon: MdWorkspacePremium,
                href: "/admin/subscription",
                type: "link"
            },
            {
                title: "Security & Logs",
                icon: MdSecurity,
                href: "/admin/security",
                type: "link"
            }
        ]
    }
];
