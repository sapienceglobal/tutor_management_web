import { Search, Bell, Mail, Grid, Maximize, Moon, Sun, User, LogOut, Menu, PanelLeftClose, PanelLeftOpen, ChevronDown, Settings } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { useTheme } from '@/contexts/ThemeContext';

export function Header({ onMenuClick, onSidebarCollapse, isSidebarCollapsed, institute }) {
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

    const roleLabel = {
        superadmin: 'Super Admin',
        admin:      'Admin',
        tutor:      'Tutor',
        student:    'Student',
    }[userRole] || userRole;

    // Role-aware dropdown destinations
    const profilePath   = userRole === 'tutor' ? '/tutor/settings'   : '/admin/profile';
    const settingsPath  = userRole === 'tutor' ? '/tutor/settings'   : '/admin/settings';
    const dashboardPath = userRole === 'tutor'
        ? '/tutor/dashboard'
        : userRole === 'superadmin'
            ? '/superadmin/dashboard'
            : '/admin/dashboard';

    return (
        <header className="h-[60px] bg-white/95 backdrop-blur-sm border-b border-slate-200/70 flex items-center px-4 lg:px-5 sticky top-0 z-40 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] gap-3">

            {/* Left */}
            <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={onMenuClick}
                    className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors lg:hidden">
                    <Menu className="w-5 h-5" />
                </button>
                <button onClick={onSidebarCollapse}
                    title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    className="hidden lg:flex p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 rounded-lg transition-colors">
                    {isSidebarCollapsed
                        ? <PanelLeftOpen  className="w-[18px] h-[18px]" />
                        : <PanelLeftClose className="w-[18px] h-[18px]" />}
                </button>
            </div>

            {/* Search */}
            <div className="hidden md:flex items-center relative flex-shrink-0">
                <input
                    type="text"
                    placeholder="Search courses, tests..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-56 lg:w-72 h-9 pl-4 pr-9 bg-slate-50 border border-slate-200 rounded-xl text-sm
                        text-slate-700 placeholder:text-slate-400 focus:outline-none focus:bg-white
                        focus:border-[var(--theme-primary)]/40 focus:ring-2 focus:ring-[var(--theme-primary)]/10
                        transition-all"
                />
                <Search className="absolute right-3 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            {/* Right */}
            <div className="flex items-center gap-1 ml-auto">

                <button onClick={handleFullscreen} title="Toggle fullscreen"
                    className="hidden lg:flex items-center justify-center w-9 h-9 text-slate-500 hover:bg-slate-100 hover:text-slate-700 rounded-lg transition-colors">
                    <Maximize className="w-[17px] h-[17px]" />
                </button>

                <button className="hidden lg:flex items-center gap-1.5 px-2.5 h-9 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                    <img src="https://flagcdn.com/w20/us.png" alt="English" className="w-4 h-3 object-cover rounded-sm" />
                    <span className="text-[13px] font-medium">EN</span>
                </button>

                {mounted && isDarkModeAllowed && (
                    <button onClick={toggleMode}
                        title={isDarkMode ? 'Light mode' : 'Dark mode'}
                        className="flex items-center justify-center w-9 h-9 text-slate-500 hover:bg-slate-100 hover:text-slate-700 rounded-lg transition-colors">
                        {isDarkMode ? <Sun className="w-[17px] h-[17px]" /> : <Moon className="w-[17px] h-[17px]" />}
                    </button>
                )}

                {/* Mail */}
                <div className="relative hidden sm:block">
                    <button className="flex items-center justify-center w-9 h-9 text-slate-500 hover:bg-slate-100 hover:text-slate-700 rounded-lg transition-colors">
                        <Mail className="w-[17px] h-[17px]" />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full border-[1.5px] border-white"
                            style={{ backgroundColor: 'var(--theme-primary)' }} />
                    </button>
                </div>

                {/* Bell */}
                <div className="relative">
                    <button className="flex items-center justify-center w-9 h-9 text-slate-500 hover:bg-slate-100 hover:text-slate-700 rounded-lg transition-colors">
                        <Bell className="w-[17px] h-[17px]" />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full border-[1.5px] border-white"
                            style={{ backgroundColor: 'var(--theme-primary)' }} />
                    </button>
                </div>

                <button className="hidden lg:flex items-center justify-center w-9 h-9 text-slate-500 hover:bg-slate-100 hover:text-slate-700 rounded-lg transition-colors">
                    <Grid className="w-[17px] h-[17px]" />
                </button>

                <div className="w-px h-6 bg-slate-200 mx-1 hidden sm:block" />

                {/* Profile Dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setIsProfileOpen(v => !v)}
                        className="flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-xl hover:bg-slate-100 transition-colors group"
                    >
                        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0"
                            style={{ boxShadow: '0 0 0 2px color-mix(in srgb, var(--theme-primary) 35%, white)' }}>
                            <img
                                src={user?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=random`}
                                alt="Profile" className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="hidden sm:flex flex-col items-start min-w-0" suppressHydrationWarning>
                            <span className="text-[13px] font-semibold text-slate-700 max-w-[100px] truncate leading-tight">
                                {user?.name || 'Admin'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium leading-tight capitalize">
                                {roleLabel}
                            </span>
                        </div>
                        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 hidden sm:block transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isProfileOpen && (
                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200/80 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                            {/* Info block */}
                            <div className="px-3 py-2.5 border-b border-slate-100">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0"
                                        style={{ boxShadow: '0 0 0 2px color-mix(in srgb, var(--theme-primary) 25%, white)' }}>
                                        <img
                                            src={user?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=random`}
                                            alt="" className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-slate-800 truncate">{user?.name}</p>
                                        <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                                        {institute ? (
                                            <div className="flex items-center gap-1 mt-0.5">
                                                {institute.logo && (
                                                    <img src={institute.logo} alt="" className="w-3.5 h-3.5 rounded object-cover" />
                                                )}
                                                <p className="text-[10px] font-semibold truncate"
                                                    style={{ color: 'var(--theme-primary)' }}>
                                                    {institute.name}
                                                </p>
                                            </div>
                                        ) : (
                                            <p className="text-[10px] text-slate-400 mt-0.5">No institute assigned</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="py-1 px-1">
                                <button
                                    onClick={() => { router.push(profilePath); setIsProfileOpen(false); }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-colors">
                                    <User className="w-4 h-4 text-slate-400" /> Profile
                                </button>
                                <button
                                    onClick={() => { router.push(settingsPath); setIsProfileOpen(false); }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-colors">
                                    <Settings className="w-4 h-4 text-slate-400" /> Settings
                                </button>
                                <button
                                    onClick={() => { router.push(dashboardPath); setIsProfileOpen(false); }}
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
