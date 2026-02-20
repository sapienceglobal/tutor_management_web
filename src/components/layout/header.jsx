import { Search, Bell, Mail, Grid, Maximize, Moon, User, LogOut, Menu } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

export function Header({ onMenuClick, onSidebarCollapse, isSidebarCollapsed }) {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        }
    }, []);

    const handleLogout = () => {
        Cookies.remove('token');
        Cookies.remove('user_role');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
    };

    return (
        <header className="h-16 bg-white border-b border-[#E5E7EB] flex items-center px-6 sticky top-0 z-40">
            {/* Left: Only Hamburger */}
            <div className="flex items-center">
                {/* Mobile Menu Button */}
                <button
                    onClick={onMenuClick}
                    className="p-2 text-[#6B7280] hover:bg-slate-50 rounded-lg lg:hidden transition-colors"
                >
                    <Menu className="w-6 h-6" />
                </button>

                {/* Desktop Sidebar Collapse Toggle */}
                <button
                    onClick={onSidebarCollapse}
                    className="hidden lg:flex p-2 text-[#6B7280] hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                    title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    <Menu className="w-6 h-6" />
                </button>
            </div>

            {/* Right: Search + All Icons */}
            <div className="flex items-center gap-3 ml-auto">
                {/* Search Bar */}
                <div className="hidden md:flex items-center relative">
                    <input
                        type="text"
                        placeholder="Search..."
                        className="w-64 h-10 pl-4 pr-10 bg-white border border-[#E5E7EB] rounded-lg text-sm text-[#1F2937] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                    <Search className="absolute right-3 w-4 h-4 text-[#9CA3AF] pointer-events-none" />
                </div>

                {/* Fullscreen */}
                <button className="hidden lg:flex items-center justify-center w-10 h-10 hover:bg-slate-50 rounded-lg transition-colors">
                    <svg className="w-5 h-5 text-[#6B7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                </button>

                {/* Language */}
                <button className="hidden lg:flex items-center gap-2 px-3 h-10 hover:bg-slate-50 rounded-lg transition-colors">
                    <img 
                        src="https://flagcdn.com/w20/us.png" 
                        alt="English" 
                        className="w-5 h-4 object-cover rounded-sm"
                    />
                    <span className="text-sm text-[#1F2937] font-medium">English</span>
                </button>

                {/* Dark Mode */}
                <button className="flex items-center justify-center w-10 h-10 hover:bg-slate-50 rounded-lg transition-colors">
                    <Moon className="w-5 h-5 text-[#6B7280]" />
                </button>

                {/* Notifications */}
                <div className="relative">
                    <button className="flex items-center justify-center w-10 h-10 hover:bg-slate-50 rounded-lg transition-colors relative">
                        <Bell className="w-5 h-5 text-[#6B7280]" />
                        <span className="absolute top-2 right-2 w-2 h-2 bg-[#FF9F43] rounded-full border-2 border-white"></span>
                    </button>
                </div>

                {/* Messages */}
                <div className="relative hidden sm:block">
                    <button className="flex items-center justify-center w-10 h-10 hover:bg-slate-50 rounded-lg transition-colors relative">
                        <Mail className="w-5 h-5 text-[#6B7280]" />
                        <span className="absolute top-2 right-2 w-2 h-2 bg-[#FF9F43] rounded-full border-2 border-white"></span>
                    </button>
                </div>

                {/* Apps Grid */}
                <button className="hidden lg:flex items-center justify-center w-10 h-10 hover:bg-slate-50 rounded-lg transition-colors">
                    <Grid className="w-5 h-5 text-[#6B7280]" />
                </button>

                {/* Profile Dropdown */}
                <div className="relative ml-2">
                    <button
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className="flex items-center gap-2 focus:outline-none"
                    >
                        <img
                            src={user?.profileImage || `https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=random`}
                            alt="Profile"
                            className="w-10 h-10 rounded-full border-2 border-slate-100 object-cover"
                        />
                    </button>

                    {/* Dropdown Menu */}
                    {isProfileOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-1 animate-in fade-in slide-in-from-top-2 z-50">
                            <div className="px-4 py-2 border-b border-slate-100">
                                <p className="text-sm font-semibold text-slate-800 truncate">{user?.name}</p>
                                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                            </div>
                            <button className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2">
                                <User className="w-4 h-4" /> Profile
                            </button>
                            <button className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2">
                                <Grid className="w-4 h-4" /> Dashboard
                            </button>
                            <div className="border-t border-slate-100 my-1"></div>
                            <button
                                onClick={handleLogout}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                                <LogOut className="w-4 h-4" /> Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}