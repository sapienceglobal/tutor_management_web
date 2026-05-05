'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MdChevronRight, MdClose, MdSchool } from 'react-icons/md';
import { tutorNavItems } from '@/config/tutorNav';
import { adminNavItems } from '@/config/adminNav';
import { superadminNavItems } from '@/config/superadminNav';
import Cookies from 'js-cookie';
import { useSettings } from '@/components/providers/SettingsProvider';
import useInstitute from '@/hooks/useInstitute';
import { useTenant } from '@/components/providers/TenantProvider';
import { C, T, S } from '@/constants/studentTokens';

// ─── Role config ────────────────────────────────────────────────────────────
const roleConfig = {
    superadmin: { subtitle: 'Platform Management' },
    admin:      { subtitle: 'Institute Portal' },
    tutor:      { subtitle: 'Educator Dashboard' },
    student:    { subtitle: 'Learning Portal' },
};

function truncateName(name, maxLen = 18) {
    if (!name || name.length <= maxLen) return name;
    const words = name.trim().split(/\s+/);
    if (words.length >= 3) return words.slice(0, 2).join(' ') + ' ' + words[2].slice(0, 3) + '.';
    if (words.length === 2) return words[0] + ' ' + words[1].slice(0, maxLen - words[0].length - 1) + '.';
    return name.slice(0, maxLen - 1) + '…';
}

export function Sidebar({ isOpen, setIsOpen, isCollapsed, setIsCollapsed }) {
    const pathname = usePathname();
    const [expandedMenu, setExpandedMenu] = useState(null);
    const [role, setRole] = useState(null);
    const [isHovering, setIsHovering] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [isHydrated, setIsHydrated] = useState(false);

    const { tenant } = useTenant() || { tenant: null };
    const { settings } = useSettings();
    const { institute } = useInstitute();

    useEffect(() => {
        setMounted(true);
        setIsHydrated(true);
        const userRole = Cookies.get('user_role');
        if (userRole) setRole(userRole);
    }, []);

    const activePath = mounted ? pathname : '';

    // ─── BUG FIX: Bulletproof Active Path Logic ───
    // Get all registered hrefs for the current role
    const allCurrentHrefs = useMemo(() => {
        if (!mounted || !role) return [];
        let items = tutorNavItems;
        if (role === 'admin') items = adminNavItems;
        if (role === 'superadmin') items = superadminNavItems;

        const getHrefs = (navArray) => {
            let hrefs = [];
            navArray.forEach(item => {
                if (item.href) hrefs.push(item.href);
                if (item.children) hrefs.push(...getHrefs(item.children));
                if (item.submenu) hrefs.push(...getHrefs(item.submenu));
            });
            return hrefs;
        };
        return getHrefs(items);
    }, [mounted, role]);

    const isItemActive = (href) => {
        if (!href || !mounted) return false;
        
        // Exact match ALWAYS wins
        if (activePath === href) return true;

        // Root Dashboard paths should NEVER trigger sub-highlights
        if (['/superadmin', '/admin', '/tutor', '/student'].includes(href)) {
            return activePath === href;
        }

        // Longest Match Logic for sub-routes (Fixes the double highlight issue)
        if (activePath.startsWith(href + '/')) {
            const matchingHrefs = allCurrentHrefs.filter(h => activePath === h || activePath.startsWith(h + '/'));
            const longestMatch = matchingHrefs.reduce((a, b) => a.length > b.length ? a : b, "");
            return href === longestMatch;
        }

        return false;
    };

    useEffect(() => {
        if (!mounted || !role) return;
        let currentNavItems = tutorNavItems;
        if (role === 'admin') currentNavItems = adminNavItems;
        if (role === 'superadmin') currentNavItems = superadminNavItems;

        currentNavItems.forEach(section => {
            if (section.type === 'section') {
                section.children?.forEach(child => {
                    if (child.submenu?.some(sub => isItemActive(sub.href))) {
                        setExpandedMenu(child.title);
                    }
                });
            }
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activePath, mounted, role]); 

    if (!role) return null;

    let navItems = tutorNavItems;
    if (role === 'admin') navItems = adminNavItems;
    if (role === 'superadmin') navItems = superadminNavItems;

    const toggleSubmenu = (title) => setExpandedMenu(expandedMenu === title ? null : title);
    const showFull = !isCollapsed || isHovering;

    const rawName = mounted 
        ? (role === 'superadmin' ? (settings?.siteName || 'SapienceLMS') : (institute?.name || tenant?.name || settings?.siteName || 'SapienceLMS')) 
        : 'SapienceLMS';
    const displayName = mounted ? truncateName(rawName, 20) : 'SapienceLMS';
    const cfg = roleConfig[role] || roleConfig.admin;
    const instituteLogo = mounted ? institute?.logo : null;

    // ─── Token-based Link Styles ────────────────────────────────────────────
    const activeLinkStyle = {
        backgroundColor: C.btnPrimary,
        color: '#ffffff',
        borderRadius: '10px',
        boxShadow: S.btn,
        fontFamily: T.fontFamily,
        fontSize: '15px',
        fontWeight: T.weight.bold,
    };

    const inactiveLinkStyle = {
        backgroundColor: 'transparent',
        color: C.text,
        borderRadius: '10px',
        fontFamily: T.fontFamily,
        fontSize: '15px',
        fontWeight: T.weight.semibold,
        opacity: 0.85,
    };

    const expandedBtnStyle = {
        backgroundColor: C.innerBg,
        color: C.heading,
        borderRadius: '10px',
        fontFamily: T.fontFamily,
        fontSize: '15px',
        fontWeight: T.weight.bold, 
    };

    const onEnterInactive = (e) => {
        e.currentTarget.style.backgroundColor = C.innerBg;
        e.currentTarget.style.opacity = '1';
    };
    const onLeaveInactive = (e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
        e.currentTarget.style.opacity = '0.85';
    };
    const onEnterExpanded = (e) => { e.currentTarget.style.backgroundColor = C.btnViewAllBg; };
    const onLeaveExpanded = (e) => { e.currentTarget.style.backgroundColor = C.innerBg; };

    return (
        <>
            {/* Mobile Backdrop */}
            <div
                className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300
                    ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setIsOpen(false)}
            />

            {/* Sidebar */}
            <aside
                onMouseEnter={() => isCollapsed && setIsHovering(true)}
                onMouseLeave={() => isCollapsed && setIsHovering(false)}
                className={`fixed top-0 left-0 z-50 h-screen flex flex-col
                    ${isHydrated ? 'transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]' : ''}
                    ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                    ${showFull ? 'w-[256px]' : 'w-[72px]'} 
                `}
                style={{
                    backgroundColor: C.cardBg,
                    boxShadow: S.card,
                    borderRight: `1px solid ${C.cardBorder}`
                }}>

                {/* ── Logo / Brand ── */}
                <div className="h-[72px] flex items-center px-4 flex-shrink-0 overflow-hidden"
                     style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 flex-shrink-0">
                            {instituteLogo ? (
                                <img src={instituteLogo} alt="Logo" className="w-10 h-10 object-contain rounded-xl shadow-sm bg-white" />
                            ) : (
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
                                    style={{ backgroundColor: C.btnPrimary }}>
                                    <MdSchool style={{ width: 24, height: 24, color: '#ffffff' }} />
                                </div>
                            )}
                        </div>

                        <div className={`flex flex-col min-w-0 leading-tight overflow-hidden transition-all duration-300
                            ${showFull ? 'opacity-100 w-auto max-w-[140px]' : 'opacity-0 w-0 pointer-events-none'}`}
                            title={rawName !== displayName ? rawName : undefined}>
                            <span style={{
                                fontFamily: T.fontFamily,
                                fontSize: T.size.base,
                                fontWeight: T.weight.bold,
                                color: C.heading,
                                lineHeight: T.leading.snug,
                            }} className="truncate">
                                {displayName}
                            </span>
                            <span style={{
                                fontFamily: T.fontFamily,
                                fontSize: T.size.xs,
                                fontWeight: T.weight.bold,
                                letterSpacing: T.tracking.wider,
                                color: C.textMuted,
                                textTransform: 'uppercase',
                            }} className="truncate mt-0.5">
                                {cfg.subtitle}
                            </span>
                        </div>
                    </div>

                    {showFull && (
                        <button onClick={() => setIsOpen(false)}
                            className="ml-2 lg:hidden p-1.5 rounded-lg transition-all flex-shrink-0 cursor-pointer border-none bg-transparent"
                            style={{ color: C.textMuted }}
                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.innerBg; e.currentTarget.style.color = C.heading; }}
                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = C.textMuted; }}>
                            <MdClose style={{ width: 18, height: 18 }} />
                        </button>
                    )}
                </div>

                {/* ── Navigation ────────────────────────────────────────── */}
                <div className="flex-1 overflow-y-auto py-4 px-3 custom-scrollbar">
                    <nav className="space-y-2">

                        {/* Direct (non-section) links */}
                        <div className="space-y-1">
                            {navItems.filter(item => item.type !== 'section').map(item => {
                                const isActive = isItemActive(item.href);
                                const Icon = item.icon;
                                return (
                                    <div key={item.href}>
                                        <Link href={item.href}
                                            onClick={() => setIsOpen(false)}
                                            title={!showFull ? item.title : ''}
                                            className={`group flex items-center gap-3.5 px-3 py-2.5 transition-all duration-150 text-decoration-none ${!showFull ? 'justify-center' : ''}`}
                                            style={isActive ? activeLinkStyle : inactiveLinkStyle}
                                            onMouseEnter={e => { if (!isActive) onEnterInactive(e); }}
                                            onMouseLeave={e => { if (!isActive) onLeaveInactive(e); }}>
                                            
                                            <Icon className="shrink-0" style={{ width: 22, height: 22, color: isActive ? '#ffffff' : C.btnPrimary, opacity: 1 }} />
                                            
                                            {showFull && <span className="truncate">{item.title}</span>}
                                        </Link>

                                        <div style={{ height: '1px', backgroundColor: C.cardBorder, margin: '6px 12px' }} />
                                    </div>
                                );
                            })}
                        </div>

                        {/* Section groups */}
                        {navItems.filter(item => item.type === 'section').map((section, idx) => (
                            <div key={idx}>
                                {showFull ? (
                                    <h3 className="px-3 pt-4 pb-2 truncate"
                                        style={{
                                            fontFamily: T.fontFamily,
                                            fontSize: T.size.xs,
                                            fontWeight: T.weight.bold,
                                            letterSpacing: T.tracking.wider,
                                            textTransform: 'uppercase',
                                            color: C.textFaint,
                                            margin: 0
                                        }}>
                                        {section.title}
                                    </h3>
                                ) : (
                                    <div className="mx-2 my-4" style={{ borderTop: `1px solid ${C.cardBorder}` }} />
                                )}

                                <div className="space-y-1">
                                    {section.children.map(child => {
                                        const Icon = child.icon;
                                        const hasSubmenu = child.submenu?.length > 0;
                                        const isExpanded = expandedMenu === child.title;
                                        const isSubActive = hasSubmenu && child.submenu.some(sub => isItemActive(sub.href));
                                        const isActive = isItemActive(child.href) || isSubActive;

                                        return (
                                            <div key={child.title}>
                                                {hasSubmenu ? (
                                                    <button onClick={() => showFull && toggleSubmenu(child.title)}
                                                        title={!showFull ? child.title : ''}
                                                        className={`group flex items-center gap-3.5 w-full px-3 py-2 cursor-pointer border-none transition-all duration-150 ${!showFull ? 'justify-center' : ''}`}
                                                        style={isActive ? activeLinkStyle : isExpanded ? expandedBtnStyle : inactiveLinkStyle}
                                                        onMouseEnter={e => { if (isActive) return; isExpanded ? onEnterExpanded(e) : onEnterInactive(e); }}
                                                        onMouseLeave={e => { if (isActive) return; isExpanded ? onLeaveExpanded(e) : onLeaveInactive(e); }}>
                                                        
                                                        <Icon className="shrink-0" style={{ width: 22, height: 22, color: isActive ? '#ffffff' : C.btnPrimary, opacity: 1 }} />
                                                        
                                                        {showFull && (
                                                            <>
                                                                <span className="flex-1 text-left truncate">{child.title}</span>
                                                                <MdChevronRight
                                                                    className={`flex-shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                                                                    style={{ width: 20, height: 20, color: isActive ? 'rgba(255,255,255,0.70)' : C.textMuted }} />
                                                            </>
                                                        )}
                                                    </button>
                                                ) : (
                                                    <Link href={child.href}
                                                        onClick={() => setIsOpen(false)}
                                                        title={!showFull ? child.title : ''}
                                                        className={`group flex items-center gap-3.5 px-3 py-2.5 transition-all duration-150 text-decoration-none ${!showFull ? 'justify-center' : ''}`}
                                                        style={isActive ? activeLinkStyle : inactiveLinkStyle}
                                                        onMouseEnter={e => { if (!isActive) onEnterInactive(e); }}
                                                        onMouseLeave={e => { if (!isActive) onLeaveInactive(e); }}>
                                                        
                                                        <Icon className="shrink-0" style={{ width: 22, height: 22, color: isActive ? '#ffffff' : C.btnPrimary, opacity: 1 }} />
                                                        
                                                        {showFull && <span className="truncate">{child.title}</span>}
                                                    </Link>
                                                )}

                                                {/* Submenu */}
                                                <div className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
                                                    ${hasSubmenu && isExpanded && showFull ? 'max-h-96 opacity-100 mt-1 mb-2' : 'max-h-0 opacity-0'}`}>
                                                    <div className="ml-[22px] space-y-1 pl-4" style={{ borderLeft: `1px solid ${C.cardBorder}` }}>
                                                        {child.submenu?.map(sub => {
                                                            const subActive = isItemActive(sub.href);
                                                            return (
                                                                <Link key={sub.title} href={sub.href}
                                                                    onClick={() => setIsOpen(false)}
                                                                    className="flex items-center gap-2.5 px-3 py-2 transition-all duration-150 relative text-decoration-none"
                                                                    style={subActive
                                                                        ? {
                                                                            backgroundColor: 'transparent',
                                                                            color: C.btnPrimary,
                                                                            fontWeight: T.weight.bold,
                                                                            fontFamily: T.fontFamily,
                                                                            fontSize: '13px' 
                                                                        }
                                                                        : {
                                                                            backgroundColor: 'transparent',
                                                                            color: C.textMuted,
                                                                            opacity: 0.85,
                                                                            fontFamily: T.fontFamily,
                                                                            fontSize: '13px', 
                                                                            fontWeight: T.weight.semibold
                                                                        }
                                                                    }
                                                                    onMouseEnter={e => {
                                                                        if (!subActive) {
                                                                            e.currentTarget.style.backgroundColor = 'transparent';
                                                                            e.currentTarget.style.color = C.heading;
                                                                            e.currentTarget.style.opacity = '1';
                                                                        }
                                                                    }}
                                                                    onMouseLeave={e => {
                                                                        if (!subActive) {
                                                                            e.currentTarget.style.backgroundColor = 'transparent';
                                                                            e.currentTarget.style.color = C.textMuted;
                                                                            e.currentTarget.style.opacity = '0.85';
                                                                        }
                                                                    }}>
                                                                    <span className="truncate">{sub.title}</span>
                                                                </Link>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                {/* Separator Line */}
                                                <div style={{ height: '1px', backgroundColor: C.cardBorder, margin: '6px 12px' }} />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </nav>
                </div>
            </aside>
        </>
    );
}