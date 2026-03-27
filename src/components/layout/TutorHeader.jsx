'use client';

import { Search, Bell, Mail, Grid, Maximize, Moon, Sun, User, LogOut, Menu, PanelLeftClose, PanelLeftOpen, ChevronDown, Settings } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { useTheme } from '@/contexts/ThemeContext';
import { C, T } from '@/constants/tutorTokens';

export function TutorHeader({ onMenuClick, onSidebarCollapse, isSidebarCollapsed, institute }) {
    const router = useRouter();
    const [user, setUser]                   = useState(null);
    const [userRole, setUserRole]           = useState('');
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [mounted, setMounted]             = useState(false);
    const { toggleMode, isDarkMode, isDarkModeAllowed } = useTheme();
    const [searchTerm, setSearchTerm]       = useState('');
    const dropdownRef = useRef(null);

    useEffect(() => {
        setMounted(true);
        const userData = localStorage.getItem('user');
        if (userData) setUser(JSON.parse(userData));
        setUserRole(Cookies.get('user_role') || '');
    }, []);

    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target))
                setIsProfileOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleLogout = () => {
        Cookies.remove('token');
        Cookies.remove('user_role');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
    };

    const handleFullscreen = () => {
        if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
        else document.exitFullscreen?.();
    };

    const setSearchFocus = (target, focused) => {
        target.style.backgroundColor = focused ? C.surfaceWhite : '#F8FAFC';
        target.style.borderColor = focused ? 'rgba(117,115,232,0.35)' : C.cardBorder;
        target.style.boxShadow = focused ? '0 0 0 3px rgba(117,115,232,0.12)' : 'none';
    };

    const roleLabel = {
        superadmin: 'Super Admin',
        admin: 'Admin',
        tutor: 'Tutor',
        student: 'Student',
    }[userRole] || userRole;

    return (
        <header
            className="h-[60px] backdrop-blur-sm border-b flex items-center px-4 lg:px-5 sticky top-0 z-40 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] gap-3"
            style={{
                backgroundColor: 'rgba(255,255,255,0.92)',
                borderBottomColor: C.cardBorder,
                fontFamily: T.fontFamily,
            }}>

            <div className="flex items-center gap-1 flex-shrink-0">
                <button
                    onClick={onMenuClick}
                    className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors lg:hidden">
                    <Menu className="w-5 h-5" />
                </button>
                <button
                    onClick={onSidebarCollapse}
                    title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    className="hidden lg:flex p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 rounded-lg transition-colors">
                    {isSidebarCollapsed
                        ? <PanelLeftOpen className="w-[18px] h-[18px]" />
                        : <PanelLeftClose className="w-[18px] h-[18px]" />}
                </button>
            </div>

            <div className="hidden md:flex items-center relative flex-shrink-0">
                <input
                    type="text"
                    placeholder="Search courses, tests..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    onFocus={e => setSearchFocus(e.currentTarget, true)}
                    onBlur={e => setSearchFocus(e.currentTarget, false)}
                    className="w-56 lg:w-72 h-9 pl-4 pr-9 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none transition-all"
                    style={{
                        backgroundColor: '#F8FAFC',
                        border: `1px solid ${C.cardBorder}`,
                        color: C.text,
                        fontFamily: T.fontFamily,
                    }}
                />
                <Search
                    className="absolute right-3 w-4 h-4 pointer-events-none"
                    style={{ color: C.textMuted }}
                />
            </div>

            <div className="flex items-center gap-1 ml-auto">
                <button
                    onClick={handleFullscreen}
                    title="Toggle fullscreen"
                    className="hidden lg:flex items-center justify-center w-9 h-9 text-slate-500 hover:bg-slate-100 hover:text-slate-700 rounded-lg transition-colors">
                    <Maximize className="w-[17px] h-[17px]" />
                </button>

                <button className="hidden lg:flex items-center gap-1.5 px-2.5 h-9 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                    <img src="https://flagcdn.com/w20/us.png" alt="English" className="w-4 h-3 object-cover rounded-sm" />
                    <span className="text-[13px] font-medium">EN</span>
                </button>

                {mounted && isDarkModeAllowed && (
                    <button
                        onClick={toggleMode}
                        title={isDarkMode ? 'Light mode' : 'Dark mode'}
                        className="flex items-center justify-center w-9 h-9 text-slate-500 hover:bg-slate-100 hover:text-slate-700 rounded-lg transition-colors">
                        {isDarkMode ? <Sun className="w-[17px] h-[17px]" /> : <Moon className="w-[17px] h-[17px]" />}
                    </button>
                )}

                <div className="relative hidden sm:block">
                    <button className="flex items-center justify-center w-9 h-9 text-slate-500 hover:bg-slate-100 hover:text-slate-700 rounded-lg transition-colors">
                        <Mail className="w-[17px] h-[17px]" />
                        <span
                            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full border-[1.5px] border-white"
                            style={{ backgroundColor: C.btnPrimary }}
                        />
                    </button>
                </div>

                <div className="relative">
                    <button className="flex items-center justify-center w-9 h-9 text-slate-500 hover:bg-slate-100 hover:text-slate-700 rounded-lg transition-colors">
                        <Bell className="w-[17px] h-[17px]" />
                        <span
                            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full border-[1.5px] border-white"
                            style={{ backgroundColor: C.btnPrimary }}
                        />
                    </button>
                </div>

                <button className="hidden lg:flex items-center justify-center w-9 h-9 text-slate-500 hover:bg-slate-100 hover:text-slate-700 rounded-lg transition-colors">
                    <Grid className="w-[17px] h-[17px]" />
                </button>

                <div className="w-px h-6 bg-slate-200 mx-1 hidden sm:block" />

                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setIsProfileOpen(v => !v)}
                        className="flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-xl hover:bg-slate-100 transition-colors group">
                        <div
                            className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0"
                            style={{ boxShadow: '0 0 0 2px rgba(117,115,232,0.30)' }}>
                            <img
                                src={user?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=random`}
                                alt="Profile"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="hidden sm:flex flex-col items-start min-w-0" suppressHydrationWarning>
                            <span
                                className="text-[13px] font-semibold max-w-[100px] truncate leading-tight"
                                style={{ color: C.heading }}>
                                {user?.name || 'Tutor'}
                            </span>
                            <span
                                className="text-[10px] font-medium leading-tight capitalize"
                                style={{ color: C.textMuted }}>
                                {roleLabel}
                            </span>
                        </div>
                        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 hidden sm:block transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isProfileOpen && (
                        <div
                            className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                            style={{
                                borderColor: C.cardBorder,
                                fontFamily: T.fontFamily,
                            }}>
                            <div
                                className="px-3 py-2.5 border-b"
                                style={{ borderBottomColor: 'rgba(98,103,233,0.10)' }}>
                                <div className="flex items-center gap-2.5">
                                    <div
                                        className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0"
                                        style={{ boxShadow: '0 0 0 2px rgba(117,115,232,0.22)' }}>
                                        <img
                                            src={user?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=random`}
                                            alt=""
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold truncate" style={{ color: C.heading }}>
                                            {user?.name}
                                        </p>
                                        <p className="text-xs truncate" style={{ color: C.textMuted }}>
                                            {user?.email}
                                        </p>
                                        {institute ? (
                                            <div className="flex items-center gap-1 mt-0.5">
                                                {institute.logo && (
                                                    <img src={institute.logo} alt="" className="w-3.5 h-3.5 rounded object-cover" />
                                                )}
                                                <p className="text-[10px] font-semibold truncate" style={{ color: C.btnPrimary }}>
                                                    {institute.name}
                                                </p>
                                            </div>
                                        ) : (
                                            <p className="text-[10px] mt-0.5" style={{ color: C.textMuted }}>
                                                No institute assigned
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="py-1 px-1">
                                <button
                                    onClick={() => { router.push('/tutor/settings'); setIsProfileOpen(false); }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-colors">
                                    <User className="w-4 h-4 text-slate-400" /> Profile
                                </button>
                                <button
                                    onClick={() => { router.push('/tutor/settings'); setIsProfileOpen(false); }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-colors">
                                    <Settings className="w-4 h-4 text-slate-400" /> Settings
                                </button>
                                <button
                                    onClick={() => { router.push('/tutor/dashboard'); setIsProfileOpen(false); }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-colors">
                                    <Grid className="w-4 h-4 text-slate-400" /> Dashboard
                                </button>
                                <div className="border-t border-slate-100 my-1" />
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                                    <LogOut className="w-4 h-4" /> Logout
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
