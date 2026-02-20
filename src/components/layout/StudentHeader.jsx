'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Bell,
    Search,
    Menu,
    X,
    ChevronDown,
    LogOut,
    User,
    Settings,
    BookOpen,
    LayoutDashboard,
    FileQuestion,
    GraduationCap,
    Brain
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export function StudentHeader({ user, onLogout }) {
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const navItems = [
        { label: 'Dashboard', href: '/student/dashboard', icon: LayoutDashboard },
        { label: 'Find a Tutor', href: '/student/tutors', icon: Search },
        {
            label: 'Learning',
            href: '#',
            icon: BookOpen,
            children: [
                { label: 'My Courses', href: '/student/courses' },
                { label: 'Live Classes', href: '/student/live-classes' },
                { label: 'My Wishlist', href: '/student/wishlist' },
            ]
        },
        {
            label: 'Exams',
            href: '#',
            icon: FileQuestion,
            children: [
                { label: 'My Exams', href: '/student/exams' },
                { label: 'Practice Sets', href: '/student/practice' },
                { label: 'Exam Results', href: '/student/results' }
            ]
        },
        {
            label: 'My Activity',
            href: '#',
            icon: User,
            children: [
                { label: 'Appointments', href: '/student/appointments' },
                { label: 'Payments', href: '/student/payments' },
            ]
        },
    ];

    return (
        <header className="sticky top-0 z-50 w-full bg-[#0F172A] text-white border-b border-indigo-900 shadow-lg font-sans">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                {/* Logo Section */}
                <Link href="/student/dashboard" className="flex items-center gap-2 group">
                    <div className="relative">
                        <div className="absolute inset-0 bg-orange-500 blur-lg opacity-20 group-hover:opacity-40 transition-opacity rounded-full"></div>
                        <Brain className="w-8 h-8 text-orange-500 relative z-10" />
                    </div>
                    <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-300">
                        YaadKaro
                    </span>
                </Link>

                {/* Desktop Navigation */}
                {/* Desktop Navigation */}
                <nav className="hidden lg:flex items-center gap-2">
                    {navItems.map((item, idx) => (
                        <div key={idx} className="relative group/nav">
                            {item.children ? (
                                <button className={cn(
                                    "flex items-center gap-1 px-4 py-3 text-sm font-semibold rounded-md transition-all duration-200",
                                    "text-slate-200 hover:text-white hover:bg-white/5 active:scale-95 group-hover/nav:text-orange-500"
                                )}>
                                    {/* Removed Icon for Bizdire look */}
                                    {item.label}
                                    <ChevronDown className="w-3 h-3 opacity-70 group-hover/nav:rotate-180 transition-transform duration-300" />
                                </button>
                            ) : (
                                <Link
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-1 px-4 py-3 text-sm font-semibold rounded-md transition-all duration-200",
                                        pathname === item.href
                                            ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                                            : "text-slate-200 hover:text-white hover:bg-white/5"
                                    )}
                                >
                                    {/* Removed Icon for Bizdire look */}
                                    {item.label}
                                </Link>
                            )}

                            {/* Dropdown for children (Bizdire Style: White, Sharp/Rounded, Shadow) */}
                            {item.children && (
                                <div className="absolute top-full left-0 pt-2 opacity-0 invisible group-hover/nav:opacity-100 group-hover/nav:visible transition-all duration-200 transform translate-y-4 group-hover/nav:translate-y-0 z-50 min-w-[220px]">
                                    <div className="bg-white rounded-lg shadow-xl shadow-slate-900/20 border-t-4 border-orange-500 overflow-hidden py-2">
                                        {item.children.map((child, cIdx) => (
                                            <Link
                                                key={cIdx}
                                                href={child.href}
                                                className="flex items-center justify-between px-6 py-3 text-sm text-slate-600 hover:text-orange-600 hover:bg-orange-50 transition-colors border-b border-slate-50 last:border-none group/item"
                                            >
                                                <span className="font-medium">{child.label}</span>
                                                <span className="opacity-0 group-hover/item:opacity-100 transform -translate-x-2 group-hover/item:translate-x-0 transition-all duration-200 text-orange-500">→</span>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </nav>

                {/* Right Actions */}
                <div className="flex items-center gap-4">
                    {/* Search (Desktop) */}
                    <div className="hidden md:flex relative">
                        <input
                            type="text"
                            placeholder="Search courses..."
                            className="bg-slate-800/50 border border-slate-700 text-sm rounded-full pl-4 pr-10 py-1.5 text-slate-200 focus:outline-none focus:border-orange-500 w-48 transition-all focus:w-64"
                        />
                        <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                    </div>

                    {/* Notifications */}
                    <button className="relative p-2 text-slate-300 hover:text-white transition-colors">
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full border border-[#0F172A]"></span>
                    </button>

                    {/* User Profile */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-9 w-9 rounded-full overflow-hidden border border-slate-600 p-0 hover:border-orange-500 transition-colors" suppressHydrationWarning>
                                <img
                                    src={user?.profileImage || "/default-avatar.png"}
                                    alt="User"
                                    className="h-full w-full object-cover"
                                />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 bg-[#1e293b] border-indigo-900 text-slate-200">
                            <DropdownMenuLabel>
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium text-white">{user?.name || 'Student'}</p>
                                    <p className="text-xs text-slate-400 truncate">{user?.email || 'student@example.com'}</p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-slate-700" />
                            <DropdownMenuItem asChild className="focus:bg-indigo-600 focus:text-white cursor-pointer">
                                <Link href="/student/profile" className="flex items-center">
                                    <User className="mr-2 h-4 w-4" /> Profile
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className="focus:bg-indigo-600 focus:text-white cursor-pointer">
                                <Link href="/student/settings" className="flex items-center">
                                    <Settings className="mr-2 h-4 w-4" /> Settings
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-slate-700" />
                            <DropdownMenuItem className="text-red-400 focus:bg-red-900/30 focus:text-red-300 cursor-pointer" onClick={onLogout}>
                                <LogOut className="mr-2 h-4 w-4" /> Log out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Mobile Menu Toggle */}
                    <button
                        className="lg:hidden p-2 text-slate-300 hover:text-white"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile Navigation */}
            {isMobileMenuOpen && (
                <div className="lg:hidden bg-[#0F172A] border-b border-indigo-900 absolute w-full left-0 z-50 animate-slide-in">
                    <div className="container mx-auto px-4 py-4 space-y-2">
                        {navItems.map((item, idx) => (
                            <div key={idx}>
                                {item.children ? (
                                    <div className="space-y-2">
                                        <div className="px-4 py-2 text-sm font-bold text-slate-400 uppercase tracking-wider">
                                            {item.label}
                                        </div>
                                        <div className="pl-4 space-y-1 border-l border-slate-700 ml-4">
                                            {item.children.map((child, cIdx) => (
                                                <Link
                                                    key={cIdx}
                                                    href={child.href}
                                                    className="block px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-lg"
                                                    onClick={() => setIsMobileMenuOpen(false)}
                                                >
                                                    {child.label}
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <Link
                                        href={item.href}
                                        className={cn(
                                            "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                                            pathname === item.href
                                                ? "text-white bg-indigo-600"
                                                : "text-slate-300 hover:text-white hover:bg-white/5"
                                        )}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        <item.icon className="w-5 h-5" />
                                        {item.label}
                                    </Link>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </header>
    );
}
