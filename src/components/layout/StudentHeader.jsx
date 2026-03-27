'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Bell, Search, Menu, ChevronDown, LogOut, User,
    Settings, PanelLeftClose, PanelLeftOpen, Sun, Moon,
} from 'lucide-react';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import NotificationPanel from '@/components/layout/NotificationPanel';
import api from '@/lib/axios';
import { useTheme } from '@/contexts/ThemeContext';

export function StudentHeader({ user, institute, onLogout, onMenuClick, onSidebarCollapse, isSidebarCollapsed }) {
    const [searchTerm, setSearchTerm]   = useState('');
    const [showNotifs, setShowNotifs]   = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [mounted, setMounted]         = useState(false);
    const router = useRouter();

    const { toggleMode, isDarkMode, isDarkModeAllowed } = useTheme();

    useEffect(() => {
        setMounted(true);
        fetchUnreadCount();
    }, []);

    const fetchUnreadCount = async () => {
        try {
            const res = await api.get('/notifications/unread-count');
            if (res.data?.count !== undefined) setUnreadCount(res.data.count);
        } catch (_) {}
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchTerm.trim()) router.push(`/student/courses?search=${encodeURIComponent(searchTerm)}`);
    };

    return (
        <>
            <header className="sticky top-0 z-40 w-full bg-[#f1eefa] backdrop-blur-sm border-b border-slate-200/70 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
                <div className="h-[60px] flex items-center justify-between px-4 lg:px-5 gap-3">

                    <div className="flex items-center gap-2 flex-shrink-0">
                        <button onClick={onMenuClick}
                            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors lg:hidden">
                            <Menu className="w-5 h-5" />
                        </button>
                        <button onClick={onSidebarCollapse}
                            title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                            className="hidden lg:flex p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                            {isSidebarCollapsed ? <PanelLeftOpen className="w-[18px] h-[18px]" /> : <PanelLeftClose className="w-[18px] h-[18px]" />}
                        </button>
                        <h1 className="text-[15px] font-bold text-slate-800 hidden sm:block tracking-tight">Student Panel</h1>
                    </div>

                    <form onSubmit={handleSearch} className="flex-1 max-w-[420px] hidden md:block">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[var(--theme-primary)] transition-colors" />
                            <input type="text" placeholder="Search courses, tests..."
                                value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                className="w-full h-9 pl-9 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400
                                    focus:outline-none focus:bg-white focus:border-[var(--theme-primary)]/30 focus:ring-2 focus:ring-[var(--theme-primary)]/10 transition-all" />
                        </div>
                    </form>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                        {/* Dark mode toggle — only after mount + only when SuperAdmin allows */}
                        {mounted && isDarkModeAllowed && (
                            <button onClick={toggleMode}
                                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                                title={isDarkMode ? 'Light mode' : 'Dark mode'}>
                                {isDarkMode ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
                            </button>
                        )}

                        {/* Notifications */}
                        <button onClick={() => setShowNotifs(!showNotifs)}
                            className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                            <Bell className="w-[18px] h-[18px]" />
                            {unreadCount > 0 && (
                                <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 border-[1.5px] border-white">
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            )}
                        </button>

                        <div className="w-px h-6 bg-slate-200 mx-1 hidden sm:block" />

                        {/* Profile dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button suppressHydrationWarning
                                    className="flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-xl hover:bg-slate-100 transition-colors group">
                                    <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-[var(--theme-primary)]/80 flex-shrink-0">
                                        <img src={user?.profileImage || '/default-avatar.svg'} alt="User" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="hidden sm:flex flex-col items-start min-w-0">
                                        <span className="text-[13px] font-semibold text-slate-700 max-w-[100px] truncate leading-tight">{user?.name || 'Student'}</span>
                                        <span className="text-[10px] text-slate-400 font-medium leading-tight">Student</span>
                                    </div>
                                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block group-hover:text-slate-600 transition-colors" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 bg-white shadow-xl border border-slate-200 rounded-2xl py-1.5 mt-1">
                                <DropdownMenuLabel className="px-3 py-2">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-[var(--theme-primary)] flex-shrink-0">
                                            <img src={user?.profileImage || '/default-avatar.svg'} alt="" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-slate-800 truncate">{user?.name || 'Student'}</p>
                                            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                                            {institute && (
                                                <div className="flex items-center gap-1 mt-0.5">
                                                    {institute.logo && <img src={institute.logo} alt="" className="w-3.5 h-3.5 rounded object-cover" />}
                                                    <p className="text-[10px] text-[var(--theme-primary)] font-semibold truncate">{institute.name}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-slate-100" />
                                <DropdownMenuItem asChild className="cursor-pointer mx-1 rounded-lg focus:bg-slate-50">
                                    <Link href="/student/profile" className="flex items-center gap-2 text-slate-600">
                                        <User className="w-4 h-4 text-slate-400" /> Profile
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild className="cursor-pointer mx-1 rounded-lg focus:bg-slate-50">
                                    <Link href="/student/profile/settings" className="flex items-center gap-2 text-slate-600">
                                        <Settings className="w-4 h-4 text-slate-400" /> Settings
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-slate-100" />
                                <DropdownMenuItem onClick={onLogout}
                                    className="cursor-pointer mx-1 rounded-lg text-red-600 focus:text-red-600 focus:bg-red-50 gap-2">
                                    <LogOut className="w-4 h-4" /> Log out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </header>

            {showNotifs && (
                <NotificationPanel onClose={() => { setShowNotifs(false); fetchUnreadCount(); }} />
            )}
        </>
    );
}
