'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    BookOpen,
    Calendar,
    Heart,
    CreditCard,
    FileQuestion,
    Settings,
    LogOut,
    Search,
    User,
    Edit
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export function StudentSidebar({ user, onLogout, className }) {
    const pathname = usePathname();

    const menuItems = [
        { label: 'My Dashboard', href: '/student/dashboard', icon: LayoutDashboard },
        { label: 'Find a Tutor', href: '/student/tutors', icon: Search },
        { label: 'My Appointments', href: '/student/appointments', icon: Calendar }, // Check if exists
        { label: 'My Courses', href: '/student/courses', icon: BookOpen },
        { label: 'My Wishlist', href: '/student/wishlist', icon: Heart },
        { label: 'My Exams', href: '/student/exams', icon: FileQuestion },
        { label: 'Payments', href: '/student/payments', icon: CreditCard }, // Check if exists
        { label: 'Settings', href: '/student/settings', icon: Settings },
    ];

    return (
        <aside className={cn("w-64 bg-white border-r border-slate-200 hidden lg:flex flex-col h-[calc(100vh-64px)] sticky top-16", className)}>
            {/* Profile Card Section (Bizdire Style) */}
            <div className="p-6 border-b border-slate-100 flex flex-col items-center text-center">
                <div className="relative w-24 h-24 mb-4 group">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg">
                        <img
                            src={user?.profileImage || "/default-avatar.png"}
                            alt={user?.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                    </div>
                    <div className="absolute top-1 right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full"></div>
                </div>

                <h3 className="font-bold text-lg text-slate-800 mb-1">{user?.name || 'Student Name'}</h3>
                <p className="text-xs text-slate-500 mb-4">{user?.email || 'student@example.com'}</p>

                <Link
                    href="/student/profile"
                    className="text-orange-500 text-sm font-bold flex items-center gap-1 hover:text-orange-600 transition-colors"
                >
                    <Edit className="w-3 h-3" /> Edit Profile
                </Link>
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1 scrollbar-hide">
                {menuItems.map((item, idx) => (
                    <Link
                        key={idx}
                        href={item.href}
                        className={cn(
                            "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group relative overflow-hidden",
                            pathname === item.href || pathname.startsWith(item.href) && item.href !== '/student/dashboard'
                                ? "text-white bg-indigo-600 shadow-md shadow-indigo-200"
                                : "text-slate-600 hover:bg-slate-50 hover:text-indigo-600"
                        )}
                    >
                        {pathname === item.href && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white/20 rounded-r-full"></div>
                        )}
                        <item.icon className={cn(
                            "w-5 h-5 transition-colors",
                            pathname === item.href ? "text-white" : "text-slate-400 group-hover:text-indigo-600"
                        )} />
                        {item.label}

                        {/* Badge for Wishlist/Notifications (Mock) */}
                        {item.label === 'My Wishlist' && (
                            <span className="ml-auto bg-orange-100 text-orange-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">New</span>
                        )}
                    </Link>
                ))}
            </nav>

            {/* Footer / Logout */}
            <div className="p-4 border-t border-slate-100">
                <button
                    onClick={onLogout}
                    className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                    Logout
                </button>
            </div>
        </aside>
    );
}
