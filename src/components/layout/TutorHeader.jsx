'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import {
    MdSearch, MdNotifications, MdMail, MdGridView, MdFullscreen,
    MdPerson, MdLogout, MdMenu, MdChevronLeft, MdChevronRight,
    MdKeyboardArrowDown, MdSettings
} from 'react-icons/md';
import { C, T } from '@/constants/tutorTokens';

// ─── Image Resolver for VPS/Hostinger Bug ─────────────────────────────────────
const resolveImageUrl = (path) => {
    if (!path) return "/default-avatar.svg";
    if (path.startsWith("http")) return path; 
    
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    const baseUrl = apiUrl.replace(/\/api\/?$/, ""); 
    
    return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
};

export function TutorHeader({ onMenuClick, onSidebarCollapse, isSidebarCollapsed, institute }) {
    const router = useRouter();
    const [user, setUser]                   = useState(null);
    const [userRole, setUserRole]           = useState('');
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [mounted, setMounted]             = useState(false);
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
        admin: 'Admin',
        tutor: 'Tutor',
        student: 'Student',
    }[userRole] || userRole;

    return (
        <header
            className="h-[60px] backdrop-blur-sm flex items-center px-4 lg:px-5 sticky top-0 z-40 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)] gap-3"
            style={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderBottom: `1px solid ${C.cardBorder}`,
                fontFamily: T.fontFamily,
            }}>

            <div className="flex items-center gap-1 flex-shrink-0">
                <button
                    onClick={onMenuClick}
                    className="p-2 transition-colors lg:hidden border-none cursor-pointer"
                    style={{ backgroundColor: 'transparent', color: C.textMuted, borderRadius: '10px' }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.innerBg; e.currentTarget.style.color = C.heading; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = C.textMuted; }}>
                    <MdMenu style={{ width: 20, height: 20 }} />
                </button>
                <button
                    onClick={onSidebarCollapse}
                    title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    className="hidden lg:flex p-2 transition-colors border-none cursor-pointer"
                    style={{ backgroundColor: 'transparent', color: C.textMuted, borderRadius: '10px' }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.innerBg; e.currentTarget.style.color = C.heading; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = C.textMuted; }}>
                    {isSidebarCollapsed
                        ? <MdChevronRight style={{ width: 20, height: 20 }} />
                        : <MdChevronLeft style={{ width: 20, height: 20 }} />}
                </button>
            </div>

            <div className="hidden md:flex items-center relative flex-shrink-0">
                <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 transition-colors" 
                    style={{ width: 18, height: 18, color: C.textMuted }} />
                <input
                    type="text"
                    placeholder="Search courses, tests..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    onFocus={e => { e.target.style.borderColor = C.btnPrimary; e.target.style.boxShadow = `0 0 0 3px ${C.btnPrimary}15`; e.target.style.backgroundColor = C.cardBg; }}
                    onBlur={e => { e.target.style.borderColor = C.cardBorder; e.target.style.boxShadow = 'none'; e.target.style.backgroundColor = C.innerBg; }}
                    style={{
                        width: '100%',
                        minWidth: '240px',
                        height: '38px',
                        paddingLeft: '36px',
                        paddingRight: '16px',
                        backgroundColor: C.innerBg,
                        border: `1px solid ${C.cardBorder}`,
                        borderRadius: '10px',
                        color: C.heading,
                        fontFamily: T.fontFamily,
                        fontSize: T.size.base,
                        fontWeight: T.weight.semibold,
                        outline: 'none',
                        transition: 'all 0.2s ease'
                    }}
                />
            </div>

            <div className="flex items-center gap-1.5 ml-auto">
                <button
                    onClick={handleFullscreen}
                    title="Toggle fullscreen"
                    className="hidden lg:flex items-center justify-center w-9 h-9 transition-colors border-none cursor-pointer"
                    style={{ backgroundColor: 'transparent', color: C.textMuted, borderRadius: '10px' }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.innerBg; e.currentTarget.style.color = C.heading; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = C.textMuted; }}>
                    <MdFullscreen style={{ width: 20, height: 20 }} />
                </button>

                <button className="hidden lg:flex items-center justify-center gap-1.5 px-2.5 h-9 transition-colors border-none cursor-pointer"
                    style={{ backgroundColor: 'transparent', color: C.textMuted, borderRadius: '10px' }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.innerBg; e.currentTarget.style.color = C.heading; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = C.textMuted; }}>
                    <img src="https://flagcdn.com/w20/us.png" alt="English" className="w-4 h-3 object-cover rounded-sm" />
                    <span style={{ fontSize: '13px', fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>EN</span>
                </button>

                <div className="relative hidden sm:block">
                    <button className="flex items-center justify-center w-9 h-9 transition-colors border-none cursor-pointer"
                        style={{ backgroundColor: 'transparent', color: C.textMuted, borderRadius: '10px' }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.innerBg; e.currentTarget.style.color = C.heading; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = C.textMuted; }}>
                        <MdMail style={{ width: 18, height: 18 }} />
                        <span
                            className="absolute top-1.5 right-1.5 w-2 h-2 border-[1.5px] border-white"
                            style={{ backgroundColor: C.btnPrimary, borderRadius: '10px' }}
                        />
                    </button>
                </div>

                <div className="relative">
                    <button className="flex items-center justify-center w-9 h-9 transition-colors border-none cursor-pointer"
                        style={{ backgroundColor: 'transparent', color: C.textMuted, borderRadius: '10px' }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.innerBg; e.currentTarget.style.color = C.heading; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = C.textMuted; }}>
                        <MdNotifications style={{ width: 18, height: 18 }} />
                        <span
                            className="absolute top-1.5 right-1.5 w-2 h-2 border-[1.5px] border-white"
                            style={{ backgroundColor: C.btnPrimary, borderRadius: '10px' }}
                        />
                    </button>
                </div>

                <button className="hidden lg:flex items-center justify-center w-9 h-9 transition-colors border-none cursor-pointer"
                    style={{ backgroundColor: 'transparent', color: C.textMuted, borderRadius: '10px' }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.innerBg; e.currentTarget.style.color = C.heading; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = C.textMuted; }}>
                    <MdGridView style={{ width: 18, height: 18 }} />
                </button>

                <div className="w-px h-6 mx-1 hidden sm:block" style={{ backgroundColor: C.cardBorder }} />

                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setIsProfileOpen(v => !v)}
                        className="flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 transition-colors border-none cursor-pointer group"
                        style={{ backgroundColor: 'transparent', borderRadius: '10px' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = C.innerBg}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <div
                            className="w-8 h-8 overflow-hidden flex-shrink-0"
                            style={{ borderRadius: '10px', border: `2px solid ${C.btnPrimary}80` }}>
                            <img
                                src={resolveImageUrl(user?.profileImage)}
                                alt="Profile"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="hidden sm:flex flex-col items-start min-w-0" suppressHydrationWarning>
                            <span
                                className="max-w-[100px] truncate leading-tight"
                                style={{ color: C.heading, fontFamily: T.fontFamily, fontSize: '13px', fontWeight: T.weight.bold }}>
                                {user?.name || 'Tutor'}
                            </span>
                            <span
                                className="leading-tight capitalize"
                                style={{ color: C.textMuted, fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.semibold }}>
                                {roleLabel}
                            </span>
                        </div>
                        <MdKeyboardArrowDown 
                            className={`hidden sm:block transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} 
                            style={{ width: 16, height: 16, color: C.textMuted }} 
                        />
                    </button>

                    {isProfileOpen && (
                        <div
                            className="absolute right-0 mt-2 w-56 shadow-xl py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                            style={{
                                backgroundColor: C.cardBg,
                                borderColor: C.cardBorder,
                                borderWidth: '1px',
                                borderStyle: 'solid',
                                borderRadius: '24px',
                                fontFamily: T.fontFamily,
                            }}>
                            <div className="px-4 py-3 border-b" style={{ borderBottomColor: C.cardBorder }}>
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-10 h-10 overflow-hidden flex-shrink-0"
                                        style={{ borderRadius: '10px', border: `2px solid ${C.btnPrimary}` }}>
                                        <img
                                            src={resolveImageUrl(user?.profileImage)}
                                            alt=""
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="truncate" style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 2px 0' }}>
                                            {user?.name || 'Tutor'}
                                        </p>
                                        <p className="truncate" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted, margin: 0 }}>
                                            {user?.email}
                                        </p>
                                        {institute ? (
                                            <div className="flex items-center gap-1 mt-1">
                                                {institute.logo && (
                                                    <img src={resolveImageUrl(institute.logo)} alt="" className="w-3.5 h-3.5 rounded object-cover" />
                                                )}
                                                <p className="truncate" style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: C.btnPrimary, margin: 0 }}>
                                                    {institute.name}
                                                </p>
                                            </div>
                                        ) : (
                                            <p className="mt-0.5" style={{ fontFamily: T.fontFamily, fontSize: '10px', color: C.textMuted, margin: 0 }}>
                                                No institute assigned
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="py-1 px-1">
                                <button
                                    onClick={() => { router.push('/tutor/settings'); setIsProfileOpen(false); }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 transition-colors border-none cursor-pointer"
                                    style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.semibold, color: C.text, backgroundColor: 'transparent', borderRadius: '10px' }}
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = C.innerBg}
                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                    <MdPerson style={{ width: 18, height: 18, color: C.textMuted }} /> Profile
                                </button>
                                <button
                                    onClick={() => { router.push('/tutor/settings'); setIsProfileOpen(false); }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 transition-colors border-none cursor-pointer"
                                    style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.semibold, color: C.text, backgroundColor: 'transparent', borderRadius: '10px' }}
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = C.innerBg}
                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                    <MdSettings style={{ width: 18, height: 18, color: C.textMuted }} /> Settings
                                </button>
                                <button
                                    onClick={() => { router.push('/tutor/dashboard'); setIsProfileOpen(false); }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 transition-colors border-none cursor-pointer"
                                    style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.semibold, color: C.text, backgroundColor: 'transparent', borderRadius: '10px' }}
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = C.innerBg}
                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                    <MdGridView style={{ width: 18, height: 18, color: C.textMuted }} /> Dashboard
                                </button>
                                
                                <div style={{ height: '1px', backgroundColor: C.cardBorder, margin: '4px 0' }} />
                                
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 transition-colors border-none cursor-pointer"
                                    style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.danger, backgroundColor: 'transparent', borderRadius: '10px' }}
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = C.dangerBg}
                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                    <MdLogout style={{ width: 18, height: 18 }} /> Logout
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}