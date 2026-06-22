'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import Link from 'next/link';
import api from '@/lib/axios';
import {
    MdSearch, MdNotifications, MdMail, MdGridView, MdFullscreen,
    MdPerson, MdLogout, MdMenu, MdChevronLeft, MdChevronRight,
    MdKeyboardArrowDown, MdSettings, MdClose
} from 'react-icons/md';
import NotificationPanel from '@/components/layout/NotificationPanel';
import { C, T } from '@/constants/tutorTokens';

// ─── Image Resolver for VPS/Hostinger Bug ─────────────────────────────────────
const resolveImageUrl = (path) => {
    if (!path) return "/default-avatar.svg";
    if (path.startsWith("http") || path.startsWith("data:")) return path; 
    
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
    const [searchResults, setSearchResults] = useState({});
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [showNotifs, setShowNotifs]       = useState(false);
    const [unreadCount, setUnreadCount]     = useState(0);
    const dropdownRef = useRef(null);
    const searchContainerRef = useRef(null);

    const fetchUnreadCount = async () => {
        try {
            const res = await api.get('/notifications/unread-count');
            if (res.data?.count !== undefined) setUnreadCount(res.data.count);
        } catch (_) {}
    };

    useEffect(() => {
        setMounted(true);
        const userData = localStorage.getItem('user');
        if (userData) setUser(JSON.parse(userData));
        setUserRole(Cookies.get('user_role') || '');
        fetchUnreadCount();
    }, []);

    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target))
                setIsProfileOpen(false);
        };
        const handleSearchClickOutside = (e) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
                setShowResults(false);
            }
        };
        document.addEventListener('mousedown', handler);
        document.addEventListener('mousedown', handleSearchClickOutside);
        return () => {
            document.removeEventListener('mousedown', handler);
            document.removeEventListener('mousedown', handleSearchClickOutside);
        };
    }, []);

    useEffect(() => {
        if (!searchTerm.trim()) {
            setSearchResults({});
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            setIsSearching(true);
            try {
                const res = await api.get(`/search/unified?q=${encodeURIComponent(searchTerm)}`);
                if (res.data?.success) {
                    setSearchResults(res.data.results || {});
                }
            } catch (err) {
                console.error("Error in Unified TutorHeader Search:", err);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

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
        <>
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

            {/* Search */}
            <div ref={searchContainerRef} className="hidden md:block flex-1 max-w-[420px] ml-4 relative z-50">
                <div className="relative group">
                    <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 transition-colors pointer-events-none" 
                        style={{ width: 18, height: 18, color: C.textMuted }} />
                    <input
                        type="text"
                        placeholder="Search assigned courses, batches..."
                        value={searchTerm}
                        onChange={e => {
                            setSearchTerm(e.target.value);
                            setShowResults(true);
                        }}
                        onFocus={e => { 
                            e.target.style.borderColor = C.btnPrimary; 
                            e.target.style.boxShadow = `0 0 0 3px ${C.btnPrimary}15`; 
                            e.target.style.backgroundColor = C.cardBg; 
                            setShowResults(true); 
                        }}
                        onBlur={e => { 
                            e.target.style.borderColor = C.cardBorder; 
                            e.target.style.boxShadow = 'none'; 
                            e.target.style.backgroundColor = C.innerBg; 
                        }}
                        style={{
                            width: '100%',
                            height: '38px',
                            paddingLeft: '36px',
                            paddingRight: searchTerm ? '36px' : '16px',
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
                    {searchTerm && (
                        <button 
                            type="button"
                            onClick={() => { setSearchTerm(''); setSearchResults({}); }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 border-none bg-transparent cursor-pointer text-gray-400 hover:text-gray-600 flex items-center justify-center"
                            style={{ outline: 'none' }}
                        >
                            <MdClose style={{ width: 16, height: 16 }} />
                        </button>
                    )}
                </div>

                {/* Unified Search Dropdown Overlay */}
                {showResults && searchTerm.trim() && (
                    <div
                        className="absolute top-[calc(100%+8px)] left-0 right-0 z-50 overflow-y-auto max-h-[420px] shadow-2xl p-4 transition-all duration-200"
                        style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.98)',
                            border: `1px solid ${C.cardBorder}`,
                            borderRadius: '16px',
                            backdropFilter: 'blur(8px)',
                        }}
                    >
                        {isSearching ? (
                            <div className="flex flex-col items-center justify-center py-6 gap-2">
                                <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: `${C.btnPrimary}50`, borderTopColor: C.btnPrimary }}></div>
                                <span style={{ fontSize: '11px', color: C.textMuted, fontFamily: T.fontFamily, fontWeight: T.weight.semibold }}>Searching platform...</span>
                            </div>
                        ) : (!searchResults || Object.keys(searchResults).length === 0 || !Object.values(searchResults).some(arr => arr && arr.length > 0)) ? (
                            <div className="text-center py-6">
                                <MdSearch className="mx-auto mb-2 text-gray-300" style={{ width: 32, height: 32 }} />
                                <p style={{ margin: 0, fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading }}>No matches found</p>
                                <p style={{ margin: '4px 0 0 0', fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>No results match "{searchTerm}"</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-4">
                                {/* 1. Courses Category */}
                                {searchResults.courses?.length > 0 && (
                                    <div>
                                        <div style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: C.btnPrimary, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span>🎓 Courses</span>
                                            <span style={{ backgroundColor: `${C.btnPrimary}15`, color: C.btnPrimary, padding: '1px 6px', borderRadius: '6px', fontSize: '9px' }}>{searchResults.courses.length}</span>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            {searchResults.courses.map(course => (
                                                <Link key={course._id} href={`/${userRole}/courses`} onClick={() => setShowResults(false)} className="flex items-center gap-3 p-2 transition-all hover:bg-gray-50 rounded-lg text-decoration-none">
                                                    <div style={{ width: '36px', height: '36px', borderRadius: '6px', overflow: 'hidden', backgroundColor: '#f3f4f6', flexShrink: 0 }}>
                                                        {course.thumbnail ? (
                                                            <img src={resolveImageUrl(course.thumbnail)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        ) : (
                                                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '14px' }}>🎓</div>
                                                        )}
                                                    </div>
                                                    <div style={{ minWidth: 0, flex: 1 }}>
                                                        <p style={{ margin: 0, fontFamily: T.fontFamily, fontSize: '13px', fontWeight: T.weight.bold, color: C.heading }}>{course.title}</p>
                                                        <p style={{ margin: 0, fontFamily: T.fontFamily, fontSize: '10px', color: C.textMuted }}>Course Program</p>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* 2. Students Category */}
                                {searchResults.students?.length > 0 && (
                                    <div>
                                        <div style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: C.btnPrimary, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span>👥 Institute Students</span>
                                            <span style={{ backgroundColor: `${C.btnPrimary}15`, color: C.btnPrimary, padding: '1px 6px', borderRadius: '6px', fontSize: '9px' }}>{searchResults.students.length}</span>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            {searchResults.students.map(s => (
                                                <Link key={s._id} href={`/${userRole}/students`} onClick={() => setShowResults(false)} className="flex items-center gap-3 p-2 transition-all hover:bg-gray-50 rounded-lg text-decoration-none">
                                                    <div style={{ width: '36px', height: '36px', borderRadius: '6px', overflow: 'hidden', backgroundColor: '#f3f4f6', flexShrink: 0 }}>
                                                        <img src={resolveImageUrl(s.profileImage)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    </div>
                                                    <div style={{ minWidth: 0, flex: 1 }}>
                                                        <p style={{ margin: 0, fontFamily: T.fontFamily, fontSize: '13px', fontWeight: T.weight.bold, color: C.heading }}>{s.name}</p>
                                                        <p style={{ margin: 0, fontFamily: T.fontFamily, fontSize: '10px', color: C.textMuted }}>{s.email}</p>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* 3. Batches Category */}
                                {searchResults.batches?.length > 0 && (
                                    <div>
                                        <div style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: C.btnPrimary, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span>📁 Batches</span>
                                            <span style={{ backgroundColor: `${C.btnPrimary}15`, color: C.btnPrimary, padding: '1px 6px', borderRadius: '6px', fontSize: '9px' }}>{searchResults.batches.length}</span>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            {searchResults.batches.map(b => (
                                                <Link key={b._id} href={`/${userRole}/batches`} onClick={() => setShowResults(false)} className="flex items-center gap-3 p-2 transition-all hover:bg-gray-50 rounded-lg text-decoration-none">
                                                    <div style={{ width: '36px', height: '36px', borderRadius: '6px', overflow: 'hidden', backgroundColor: '#f59e0b20', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                        <span style={{ fontSize: '16px' }}>📁</span>
                                                    </div>
                                                    <div style={{ minWidth: 0, flex: 1 }}>
                                                        <p style={{ margin: 0, fontFamily: T.fontFamily, fontSize: '13px', fontWeight: T.weight.bold, color: C.heading }}>{b.name}</p>
                                                        <p style={{ margin: 0, fontFamily: T.fontFamily, fontSize: '10px', color: C.textMuted }}>Status: <span className="capitalize">{b.status}</span></p>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
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
                    <button 
                        onClick={() => setShowNotifs(!showNotifs)}
                        className="flex items-center justify-center w-9 h-9 transition-colors border-none cursor-pointer"
                        style={{ backgroundColor: 'transparent', color: C.textMuted, borderRadius: '10px' }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.innerBg; e.currentTarget.style.color = C.heading; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = C.textMuted; }}>
                        <MdNotifications style={{ width: 18, height: 18 }} />
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 min-w-[16px] h-4 text-white flex items-center justify-center px-1"
                                style={{ backgroundColor: C.danger, fontSize: '9px', fontWeight: T.weight.bold, borderRadius: '10px', border: '1.5px solid white', fontFamily: T.fontFamily }}>
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                        )}
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
        {showNotifs && (
            <NotificationPanel onClose={() => { setShowNotifs(false); fetchUnreadCount(); }} />
        )}
        </>
    );
}    