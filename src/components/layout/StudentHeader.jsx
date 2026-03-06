'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Bell,
    Search,
    Menu,
    ChevronDown,
    LogOut,
    User,
    Settings,
    PanelLeftClose,
    PanelLeftOpen,
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

export function StudentHeader({ user, institute, onLogout, onMenuClick, onSidebarCollapse, isSidebarCollapsed }) {
    const [searchTerm, setSearchTerm] = useState('');
    const router = useRouter();

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            router.push(`/student/courses?search=${encodeURIComponent(searchTerm)}`);
        }
    };

    return (
        <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200 shadow-sm font-sans">
            <div className="h-14 flex items-center justify-between px-4 lg:px-6 gap-4">
                {/* Left: Menu + Title */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={onMenuClick}
                        className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors lg:hidden"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                    <button
                        onClick={onSidebarCollapse}
                        className="hidden lg:flex p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                        title={isSidebarCollapsed ? 'Open sidebar' : 'Close sidebar'}
                    >
                        {isSidebarCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
                    </button>
                    <h1 className="text-lg font-bold text-slate-800 hidden sm:block">Student Panel</h1>
                </div>

                {/* Center: Search */}
                <form onSubmit={handleSearch} className="flex-1 max-w-lg hidden md:block">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search courses, tests..."
                            className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </form>

                {/* Right: Actions */}
                <div className="flex items-center gap-3">
                    {/* Notifications */}
                    <Link href="/student/dashboard" className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                    </Link>

                    {/* User Profile */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-slate-100 transition-colors" suppressHydrationWarning>
                                <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-indigo-200">
                                    <img
                                        src={user?.profileImage || "/default-avatar.png"}
                                        alt="User"
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                                <span className="text-sm font-semibold text-slate-700 hidden sm:block max-w-[120px] truncate">
                                    {user?.name || 'Student'}
                                </span>
                                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 bg-white shadow-xl border border-slate-200">
                            <DropdownMenuLabel>
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-semibold text-slate-800">{user?.name || 'Student'}</p>
                                    <p className="text-xs text-slate-500 truncate">{user?.email || 'student@example.com'}</p>
                                    {institute && (
                                        <div className="flex items-center gap-2">
                                            {institute.logo && (
                                                <img 
                                                    src={institute.logo} 
                                                    alt="Institute Logo" 
                                                    className="w-4 h-4 rounded object-cover"
                                                />
                                            )}
                                            <p className="text-xs text-indigo-600 font-medium">
                                                {institute.name}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild className="cursor-pointer">
                                <Link href="/student/profile" className="flex items-center">
                                    <User className="mr-2 h-4 w-4 text-slate-500" /> Profile
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className="cursor-pointer">
                                <Link href="/student/profile/settings" className="flex items-center">
                                    <Settings className="mr-2 h-4 w-4 text-slate-500" /> Settings
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600 cursor-pointer focus:text-red-700 focus:bg-red-50" onClick={onLogout}>
                                <LogOut className="mr-2 h-4 w-4" /> Log out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
