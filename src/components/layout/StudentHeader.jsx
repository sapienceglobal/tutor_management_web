'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    MdNotifications, MdSearch, MdMenu, MdKeyboardArrowDown, MdLogout, MdPerson,
    MdSettings, MdChevronLeft, MdChevronRight, MdClose
} from 'react-icons/md';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import NotificationPanel from '@/components/layout/NotificationPanel';
import api from '@/lib/axios';
import { C, T ,R} from '@/constants/studentTokens';

// ─── Image Resolver for VPS/Hostinger Bug ─────────────────────────────────────
const resolveImageUrl = (path) => {
    if (!path) return "/default-avatar.svg";
    if (path.startsWith("http")) return path; 
    
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    const baseUrl = apiUrl.replace(/\/api\/?$/, ""); 
    
    return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
};

export function StudentHeader({ user, institute, onLogout, onMenuClick, onSidebarCollapse, isSidebarCollapsed }) {
    const [searchTerm, setSearchTerm]   = useState('');
    const [showNotifs, setShowNotifs]   = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [mounted, setMounted]         = useState(false);
    
    // Real-time Search Engine State
    const [searchResults, setSearchResults] = useState({ courses: [], tutors: [], exams: [] });
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const searchContainerRef = useRef(null);

    const router = useRouter();

    useEffect(() => {
        setMounted(true);
        fetchUnreadCount();
    }, []);

    // ─── Click Outside Handler for Search Dropdown ───
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
                setShowResults(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // ─── Debounced Real-time Search Hook ───
    useEffect(() => {
        if (!searchTerm.trim()) {
            setSearchResults({ courses: [], tutors: [], exams: [] });
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            setIsSearching(true);
            try {
                const [coursesRes, tutorsRes, examsRes] = await Promise.all([
                    api.get(`/courses?search=${encodeURIComponent(searchTerm)}`),
                    api.get(`/tutors?search=${encodeURIComponent(searchTerm)}`),
                    api.get(`/exams/student/all?search=${encodeURIComponent(searchTerm)}`)
                ]);
                
                const courses = coursesRes.data?.success ? (coursesRes.data.courses || []) : [];
                const tutors = tutorsRes.data?.success ? (tutorsRes.data.tutors || []) : [];
                const exams = examsRes.data?.success ? (examsRes.data.exams || []) : [];

                setSearchResults({ courses, tutors, exams });
            } catch (err) {
                console.error("Error searching in StudentHeader:", err);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    const fetchUnreadCount = async () => {
        try {
            const res = await api.get('/notifications/unread-count');
            if (res.data?.count !== undefined) setUnreadCount(res.data.count);
        } catch (_) {}
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            setShowResults(false);
            router.push(`/student/courses?search=${encodeURIComponent(searchTerm)}`);
        }
    };

    return (
        <>
            <header className="sticky top-0 z-40 w-full backdrop-blur-sm shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderBottom: `1px solid ${C.cardBorder}` }}>
                <div className="h-[60px] flex items-center justify-between px-4 lg:px-5 gap-3">

                    <div className="flex items-center gap-2 flex-shrink-0">
                        <button onClick={onMenuClick}
                            className="p-2 transition-colors lg:hidden border-none cursor-pointer"
                            style={{ backgroundColor: 'transparent', color: C.textMuted, borderRadius: '10px' }}
                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.innerBg; e.currentTarget.style.color = C.heading; }}
                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = C.textMuted; }}>
                            <MdMenu style={{ width: 20, height: 20 }} />
                        </button>
                        <button onClick={onSidebarCollapse}
                            title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                            className="hidden lg:flex p-2 transition-colors border-none cursor-pointer"
                            style={{ backgroundColor: 'transparent', color: C.textMuted, borderRadius: '10px' }}
                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.innerBg; e.currentTarget.style.color = C.heading; }}
                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = C.textMuted; }}>
                            {isSidebarCollapsed ? <MdChevronRight style={{ width: 20, height: 20 }} /> : <MdChevronLeft style={{ width: 20, height: 20 }} />}
                        </button>
                        <h1 className="hidden sm:block tracking-tight"
                            style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>
                            Student Panel
                        </h1>
                    </div>

                    {/* Interactive Unified Search Container */}
                    <div ref={searchContainerRef} className="relative flex-grow max-w-[420px] hidden md:block z-50">
                        <form onSubmit={handleSearchSubmit} className="w-full">
                            <div className="relative group">
                                <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 transition-colors" 
                                    style={{ width: 18, height: 18, color: C.textMuted }} />
                                <input type="text" placeholder="Search courses, tutors..."
                                    value={searchTerm} 
                                    onChange={e => {
                                        setSearchTerm(e.target.value);
                                        setShowResults(true);
                                    }}
                                    onFocus={() => setShowResults(true)}
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
                                    onFocus={e => { e.target.style.borderColor = C.btnPrimary; e.target.style.boxShadow = `0 0 0 3px ${C.btnPrimary}15`; e.target.style.backgroundColor = C.cardBg; setShowResults(true); }}
                                    onBlur={e => { e.target.style.borderColor = C.cardBorder; e.target.style.boxShadow = 'none'; e.target.style.backgroundColor = C.innerBg; }}
                                />
                                {searchTerm && (
                                    <button 
                                        type="button"
                                        onClick={() => { setSearchTerm(''); setSearchResults({ courses: [], tutors: [], exams: [] }); }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 border-none bg-transparent cursor-pointer text-gray-400 hover:text-gray-600 flex items-center justify-center"
                                        style={{ outline: 'none' }}
                                    >
                                        <MdClose style={{ width: 16, height: 16 }} />
                                    </button>
                                )}
                            </div>
                        </form>

                        {/* Dropdown Results Overlay */}
                        {showResults && searchTerm.trim() && (
                            <div
                                className="absolute top-[calc(100%+8px)] left-0 right-0 z-50 overflow-y-auto max-h-[420px] shadow-2xl p-4 transition-all duration-200"
                                style={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.98)',
                                    border: `1px solid ${C.cardBorder}`,
                                    borderRadius: R['2xl'] || '16px',
                                    backdropFilter: 'blur(8px)',
                                }}
                            >
                                {isSearching ? (
                                    <div className="flex flex-col items-center justify-center py-6 gap-2">
                                        <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: `${C.btnPrimary}50`, borderTopColor: C.btnPrimary }}></div>
                                        <span style={{ fontSize: '11px', color: C.textMuted, fontFamily: T.fontFamily, fontWeight: T.weight.semibold }}>Searching...</span>
                                    </div>
                                ) : (searchResults.courses.length === 0 && searchResults.tutors.length === 0 && (!searchResults.exams || searchResults.exams.length === 0)) ? (
                                    <div className="text-center py-6">
                                        <MdSearch className="mx-auto mb-2 text-gray-300" style={{ width: 32, height: 32 }} />
                                        <p style={{ margin: 0, fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading }}>No matches found</p>
                                        <p style={{ margin: '4px 0 0 0', fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>We couldn't find anything matching "{searchTerm}"</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-4">
                                        {/* Matching Courses */}
                                        {searchResults.courses.length > 0 && (
                                            <div>
                                                <div style={{
                                                    fontFamily: T.fontFamily,
                                                    fontSize: '10px',
                                                    fontWeight: T.weight.bold,
                                                    color: C.btnPrimary,
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '1px',
                                                    marginBottom: '8px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px'
                                                }}>
                                                    <span>🎓 Matching Courses</span>
                                                    <span style={{
                                                        backgroundColor: `${C.btnPrimary}15`,
                                                        color: C.btnPrimary,
                                                        padding: '1px 6px',
                                                        borderRadius: '6px',
                                                        fontSize: '9px'
                                                    }}>
                                                        {searchResults.courses.length}
                                                    </span>
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    {searchResults.courses.slice(0, 4).map(course => (
                                                        <Link
                                                            key={course._id}
                                                            href={`/student/courses/${course._id}`}
                                                            onClick={() => setShowResults(false)}
                                                            className="flex items-center gap-3 p-2 transition-all hover:bg-gray-50"
                                                            style={{
                                                                borderRadius: '8px',
                                                                cursor: 'pointer',
                                                                textDecoration: 'none',
                                                                color: 'inherit'
                                                            }}
                                                        >
                                                            <div style={{
                                                                width: '36px',
                                                                height: '36px',
                                                                borderRadius: '6px',
                                                                overflow: 'hidden',
                                                                backgroundColor: '#f3f4f6',
                                                                flexShrink: 0
                                                            }}>
                                                                {course.thumbnail ? (
                                                                    <img src={resolveImageUrl(course.thumbnail)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                                ) : (
                                                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '14px' }}>🎓</div>
                                                                )}
                                                            </div>
                                                            <div style={{ minWidth: 0, flex: 1 }}>
                                                                <p style={{
                                                                    margin: 0,
                                                                    fontFamily: T.fontFamily,
                                                                    fontSize: '13px',
                                                                    fontWeight: T.weight.bold,
                                                                    color: C.heading,
                                                                    whiteSpace: 'nowrap',
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis'
                                                                }}>
                                                                    {course.title}
                                                                </p>
                                                                <p style={{
                                                                    margin: 0,
                                                                    fontFamily: T.fontFamily,
                                                                    fontSize: '10px',
                                                                    color: C.textMuted,
                                                                    whiteSpace: 'nowrap',
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis'
                                                                }}>
                                                                    {course.categoryId?.name || 'Expert Course'}
                                                                </p>
                                                            </div>
                                                        </Link>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Matching Tutors */}
                                        {searchResults.tutors.length > 0 && (
                                            <div>
                                                <div style={{
                                                    fontFamily: T.fontFamily,
                                                    fontSize: '10px',
                                                    fontWeight: T.weight.bold,
                                                    color: C.btnPrimary,
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '1px',
                                                    marginBottom: '8px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px'
                                                }}>
                                                    <span>👨‍🏫 Matching Tutors</span>
                                                    <span style={{
                                                        backgroundColor: `${C.btnPrimary}15`,
                                                        color: C.btnPrimary,
                                                        padding: '1px 6px',
                                                        borderRadius: '6px',
                                                        fontSize: '9px'
                                                    }}>
                                                        {searchResults.tutors.length}
                                                    </span>
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    {searchResults.tutors.slice(0, 4).map(tutor => (
                                                        <Link
                                                            key={tutor._id}
                                                            href={`/student/tutors/${tutor._id}`}
                                                            onClick={() => setShowResults(false)}
                                                            className="flex items-center gap-3 p-2 transition-all hover:bg-gray-50"
                                                            style={{
                                                                borderRadius: '8px',
                                                                cursor: 'pointer',
                                                                textDecoration: 'none',
                                                                color: 'inherit'
                                                            }}
                                                        >
                                                            <div style={{
                                                                width: '36px',
                                                                height: '36px',
                                                                borderRadius: '6px',
                                                                overflow: 'hidden',
                                                                backgroundColor: '#f3f4f6',
                                                                flexShrink: 0
                                                            }}>
                                                                {tutor.userId?.profileImage ? (
                                                                    <img src={resolveImageUrl(tutor.userId.profileImage)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                                ) : (
                                                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '14px' }}>👨‍🏫</div>
                                                                )}
                                                            </div>
                                                            <div style={{ minWidth: 0, flex: 1 }}>
                                                                <p style={{
                                                                    margin: 0,
                                                                    fontFamily: T.fontFamily,
                                                                    fontSize: '13px',
                                                                    fontWeight: T.weight.bold,
                                                                    color: C.heading,
                                                                    whiteSpace: 'nowrap',
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis'
                                                                }}>
                                                                    {tutor.userId?.name || 'Tutor'}
                                                                </p>
                                                                <p style={{
                                                                    margin: 0,
                                                                    fontFamily: T.fontFamily,
                                                                    fontSize: '10px',
                                                                    color: C.textMuted,
                                                                    whiteSpace: 'nowrap',
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis'
                                                                }}>
                                                                    {tutor.categoryId?.name || 'Expert'} • {tutor.experience || 0} yrs exp
                                                                </p>
                                                            </div>
                                                        </Link>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Matching Exams */}
                                        {searchResults.exams && searchResults.exams.length > 0 && (
                                            <div>
                                                <div style={{
                                                    fontFamily: T.fontFamily,
                                                    fontSize: '10px',
                                                    fontWeight: T.weight.bold,
                                                    color: C.btnPrimary,
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '1px',
                                                    marginBottom: '8px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px'
                                                }}>
                                                    <span>📝 Matching Tests</span>
                                                    <span style={{
                                                        backgroundColor: `${C.btnPrimary}15`,
                                                        color: C.btnPrimary,
                                                        padding: '1px 6px',
                                                        borderRadius: '6px',
                                                        fontSize: '9px'
                                                    }}>
                                                        {searchResults.exams.length}
                                                    </span>
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    {searchResults.exams.slice(0, 4).map(exam => (
                                                        <Link
                                                            key={exam._id}
                                                            href={`/student/exams/${exam._id}/take`}
                                                            onClick={() => setShowResults(false)}
                                                            className="flex items-center gap-3 p-2 transition-all hover:bg-gray-50"
                                                            style={{
                                                                borderRadius: '8px',
                                                                cursor: 'pointer',
                                                                textDecoration: 'none',
                                                                color: 'inherit'
                                                            }}
                                                        >
                                                            <div style={{
                                                                width: '36px',
                                                                height: '36px',
                                                                borderRadius: '6px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                backgroundColor: '#fef3c7',
                                                                color: '#d97706',
                                                                fontSize: '18px',
                                                                flexShrink: 0
                                                            }}>
                                                                📝
                                                            </div>
                                                            <div style={{ minWidth: 0, flex: 1 }}>
                                                                <p style={{
                                                                    margin: 0,
                                                                    fontFamily: T.fontFamily,
                                                                    fontSize: '13px',
                                                                    fontWeight: T.weight.bold,
                                                                    color: C.heading,
                                                                    whiteSpace: 'nowrap',
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis'
                                                                }}>
                                                                    {exam.title}
                                                                </p>
                                                                <p style={{
                                                                    margin: 0,
                                                                    fontFamily: T.fontFamily,
                                                                    fontSize: '10px',
                                                                    color: C.textMuted,
                                                                    whiteSpace: 'nowrap',
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis'
                                                                }}>
                                                                    {exam.courseTitle || 'Main Test'} • {exam.duration} mins
                                                                </p>
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

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                        {/* Notifications */}
                        <button onClick={() => setShowNotifs(!showNotifs)}
                            className="relative p-2 transition-colors border-none cursor-pointer"
                            style={{ backgroundColor: 'transparent', color: C.textMuted, borderRadius: '10px' }}
                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.innerBg; e.currentTarget.style.color = C.heading; }}
                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = C.textMuted; }}>
                            
                            <MdNotifications style={{ width: 20, height: 20 }} />
                            {unreadCount > 0 && (
                                <span className="absolute top-1 right-1 min-w-[16px] h-4 text-white flex items-center justify-center px-1"
                                    style={{ backgroundColor: C.danger, fontSize: '9px', fontWeight: T.weight.bold, borderRadius: '10px', border: '1.5px solid white', fontFamily: T.fontFamily }}>
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            )}
                        </button>

                        <div className="w-px h-6 mx-1 hidden sm:block" style={{ backgroundColor: C.cardBorder }} />

                        {/* Profile dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button suppressHydrationWarning
                                    className="flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 transition-colors border-none cursor-pointer"
                                    style={{ backgroundColor: 'transparent', borderRadius: '10px' }}
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = C.innerBg}
                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                    
                                    <div className="w-8 h-8 overflow-hidden flex-shrink-0" style={{ borderRadius: '10px', border: `2px solid ${C.btnPrimary}80` }}>
                                        <img src={resolveImageUrl(user?.profileImage)} alt="User" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="hidden sm:flex flex-col items-start min-w-0">
                                        <span className="max-w-[100px] truncate leading-tight" style={{ fontFamily: T.fontFamily, fontSize: '13px', fontWeight: T.weight.bold, color: C.heading }}>
                                            {user?.name || 'Student'}
                                        </span>
                                        <span className="leading-tight" style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.semibold, color: C.textMuted }}>
                                            Student
                                        </span>
                                    </div>
                                    <MdKeyboardArrowDown className="hidden sm:block transition-colors" style={{ width: 16, height: 16, color: C.textMuted }} />
                                </button>
                            </DropdownMenuTrigger>
                            
                            <DropdownMenuContent align="end" className="w-56 shadow-xl py-1.5 mt-1" style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, borderRadius: R['2xl'] }}>
                                <DropdownMenuLabel className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 overflow-hidden flex-shrink-0" style={{ borderRadius: '10px', border: `2px solid ${C.btnPrimary}` }}>
                                            <img src={resolveImageUrl(user?.profileImage)} alt="" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate" style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 2px 0' }}>
                                                {user?.name || 'Student'}
                                            </p>
                                            <p className="truncate" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted, margin: 0 }}>
                                                {user?.email}
                                            </p>
                                            {institute && (
                                                <div className="flex items-center gap-1 mt-1">
                                                    {institute.logo && <img src={resolveImageUrl(institute.logo)} alt="" className="w-3.5 h-3.5 rounded object-cover" />}
                                                    <p className="truncate" style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: C.btnPrimary, margin: 0 }}>
                                                        {institute.name}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </DropdownMenuLabel>
                                
                                <DropdownMenuSeparator style={{ backgroundColor: C.cardBorder, margin: '4px 0' }} />
                                
                                <DropdownMenuItem asChild className="cursor-pointer mx-2 my-1 outline-none" style={{ borderRadius: '10px' }}>
                                    <Link href="/student/profile" className="flex items-center gap-2 px-2 py-2 text-decoration-none"
                                        style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.semibold, color: C.text }}
                                        onMouseEnter={e => e.currentTarget.style.backgroundColor = C.innerBg}
                                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                        <MdPerson style={{ width: 18, height: 18, color: C.textMuted }} /> Profile
                                    </Link>
                                </DropdownMenuItem>
                                
                                <DropdownMenuItem asChild className="cursor-pointer mx-2 my-1 outline-none" style={{ borderRadius: '10px' }}>
                                    <Link href="/student/profile/settings" className="flex items-center gap-2 px-2 py-2 text-decoration-none"
                                        style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.semibold, color: C.text }}
                                        onMouseEnter={e => e.currentTarget.style.backgroundColor = C.innerBg}
                                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                        <MdSettings style={{ width: 18, height: 18, color: C.textMuted }} /> Settings
                                    </Link>
                                </DropdownMenuItem>
                                
                                <DropdownMenuSeparator style={{ backgroundColor: C.cardBorder, margin: '4px 0' }} />
                                
                                <DropdownMenuItem onClick={onLogout} className="cursor-pointer mx-2 my-1 outline-none" style={{ borderRadius: '10px' }}>
                                    <div className="flex items-center gap-2 px-2 py-2 w-full"
                                        style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.danger }}
                                        onMouseEnter={e => e.currentTarget.style.backgroundColor = C.dangerBg}
                                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                        <MdLogout style={{ width: 18, height: 18 }} /> Log out
                                    </div>
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