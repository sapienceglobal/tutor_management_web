'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, X, GraduationCap } from 'lucide-react';
import { tutorNavItems } from '@/config/tutorNav';
import { adminNavItems } from '@/config/adminNav';
import { superadminNavItems } from '@/config/superadminNav';
import Cookies from 'js-cookie';
import { useSettings } from '@/components/providers/SettingsProvider';
import useInstitute from '@/hooks/useInstitute';
import { useTenant } from '@/components/providers/TenantProvider';
import { T } from '@/constants/tutorTokens';

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

// ─── Sidebar-specific tokens (Matching New Image) ─────────────────────────────
const SB = {
    bg: '#EDE9FA',                          // Light purple background
    activeBg: '#6B4DF1',                    // Solid Purple active tab
    activeText: '#ffffff',                  // White text for active
    activeIcon: '#ffffff',                  // White icon for active
    inactiveText: '#1F2937',                // Dark Gray/Black for inactive text
    inactiveIcon: '#6B4DF1',                // Purple icons for inactive tabs
    hoverBg: '#ffffff',                     // White background on hover (like 'Institute Desk' in image)
    hoverText: '#1F2937',                   // Text stays dark on hover
    sectionLabel: 'rgba(107, 77, 241, 0.6)',// Subtitle text color
    divider: 'rgba(107, 77, 241, 0.1)',
    subActive: { color: '#6B4DF1', fontWeight: 700, backgroundColor: 'rgba(107, 77, 241, 0.1)' },
    subInactive: { color: '#4B5563' },
    subHoverBg: '#ffffff',
    subBorderLeft: 'rgba(107, 77, 241, 0.3)',
    logoBg: '#6B4DF1',
    logoIcon: '#ffffff',
    closeBtn: '#1F2937',
    chevron: (active) => active ? '#ffffff' : '#A0ABC0', // Arrow color
};

export function Sidebar({ isOpen, setIsOpen, isCollapsed, setIsCollapsed }) {
    const pathname = usePathname();
    const [expandedMenu, setExpandedMenu] = useState(null);
    const [role, setRole] = useState(null);
    const [isHovering, setIsHovering] = useState(false);
    const [mounted, setMounted] = useState(false);

    const { tenant } = useTenant() || { tenant: null };
    const { settings } = useSettings();
    const { institute } = useInstitute();

    useEffect(() => {
        setMounted(true);
        const userRole = Cookies.get('user_role');
        if (userRole) setRole(userRole);
    }, []);

    // Active path assignment
    const activePath = mounted ? pathname : '';

    // Auto-expand active submenu
    useEffect(() => {
        if (!mounted || !role) return;
        let currentNavItems = tutorNavItems;
        if (role === 'admin') currentNavItems = adminNavItems;
        if (role === 'superadmin') currentNavItems = superadminNavItems;

        currentNavItems.forEach(section => {
            if (section.type === 'section') {
                section.children?.forEach(child => {
                    if (child.submenu?.some(sub => activePath === sub.href || activePath.startsWith(sub.href + '/'))) {
                        setExpandedMenu(child.title);
                    }
                });
            }
        });
    }, [activePath, mounted, role]);

    if (!role) return null;

    // Role-based Nav Items
    let navItems = tutorNavItems;
    if (role === 'admin') navItems = adminNavItems;
    if (role === 'superadmin') navItems = superadminNavItems;

    const toggleSubmenu = (title) => setExpandedMenu(expandedMenu === title ? null : title);
    const showFull = !isCollapsed || isHovering;

    // ── Brand name logic ──────────────────────────────────────────────────
    const rawName = mounted 
        ? (role === 'superadmin' ? (settings?.siteName || 'Sapience LMS') : (institute?.name || tenant?.name || settings?.siteName || 'Sapience LMS')) 
        : 'Sapience LMS';
    const displayName = mounted ? truncateName(rawName, 20) : 'Sapience LMS';
    const cfg = roleConfig[role] || roleConfig.admin;
    const instituteLogo = mounted ? institute?.logo : null;

    return (
        <>
            {/* Mobile Backdrop */}
            <div
                className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300
                    ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setIsOpen(false)}
            />

            {/* Sidebar */}
            <aside
                onMouseEnter={() => isCollapsed && setIsHovering(true)}
                onMouseLeave={() => isCollapsed && setIsHovering(false)}
                className={`fixed top-0 left-0 z-50 h-screen flex flex-col
                    transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
                    ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                    ${showFull ? 'w-64' : 'w-[72px]'} 
                `}
                style={{
                    backgroundColor: SB.bg,
                    boxShadow: '2px 0 20px 0 rgba(107, 77, 241, 0.05)',
                }}>

                {/* ── Logo / Brand ── */}
                <div className="h-[72px] flex items-center px-4 flex-shrink-0 overflow-hidden"
                     style={{ borderBottom: `1px solid ${SB.divider}` }}>
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 flex-shrink-0">
                            {instituteLogo ? (
                                <img src={instituteLogo} alt="Logo" className="w-10 h-10 object-contain rounded-xl" />
                            ) : (
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
                                    style={{ backgroundColor: SB.logoBg }}>
                                    <GraduationCap className="w-6 h-6" style={{ color: SB.logoIcon }} strokeWidth={2.5} />
                                </div>
                            )}
                        </div>

                        <div className={`flex flex-col min-w-0 leading-tight overflow-hidden transition-all duration-300
                            ${showFull ? 'opacity-100 w-auto max-w-[140px]' : 'opacity-0 w-0 pointer-events-none'}`}
                            title={rawName !== displayName ? rawName : undefined}>
                            <span style={{
                                fontFamily: T?.fontFamily || "'Inter', sans-serif",
                                fontSize: '17px',
                                fontWeight: 800,
                                color: SB.activeBg, // Logo text color
                                lineHeight: 1.2,
                            }} className="truncate">
                                {displayName}
                            </span>
                        </div>
                    </div>

                    {showFull && (
                        <button onClick={() => setIsOpen(false)}
                            className="ml-2 lg:hidden p-1.5 rounded-lg transition-all flex-shrink-0 border-none cursor-pointer bg-transparent"
                            style={{ color: SB.closeBtn }}
                            onMouseEnter={e => { e.currentTarget.style.color = '#ffffff'; e.currentTarget.style.backgroundColor = SB.activeBg; }}
                            onMouseLeave={e => { e.currentTarget.style.color = SB.closeBtn; e.currentTarget.style.backgroundColor = 'transparent'; }}>
                            <X size={18} />
                        </button>
                    )}
                </div>

                {/* ── Navigation ────────────────────────────────────────── */}
                <div className="flex-1 overflow-y-auto py-5 px-3 custom-scrollbar">
                    <nav className="space-y-2.5">

                        {/* Direct (non-section) links */}
                        <div className="space-y-1.5">
                            {navItems.filter(item => item.type !== 'section').map(item => {
                                const isActive = activePath === item.href || activePath.startsWith(item.href + '/');
                                const Icon = item.icon;
                                return (
                                    <Link key={item.href} href={item.href}
                                        onClick={() => setIsOpen(false)}
                                        title={!showFull ? item.title : ''}
                                        className={`group flex items-center px-3.5 py-3 rounded-xl transition-all duration-200 no-underline ${!showFull ? 'justify-center px-0' : ''}`}
                                        style={isActive
                                            ? { backgroundColor: SB.activeBg, color: SB.activeText, fontFamily: T?.fontFamily || "'Inter', sans-serif", fontSize: '15px', fontWeight: 600 }
                                            : { color: SB.inactiveText, fontFamily: T?.fontFamily || "'Inter', sans-serif", fontSize: '15px', fontWeight: 600 }}
                                        onMouseEnter={e => { if (!isActive) { e.currentTarget.style.backgroundColor = SB.hoverBg; e.currentTarget.style.color = SB.hoverText; } }}
                                        onMouseLeave={e => { if (!isActive) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = SB.inactiveText; } }}>
                                        
                                        <Icon className={`w-[20px] h-[20px] flex-shrink-0 transition-colors duration-200 ${showFull ? 'mr-3.5' : ''}`}
                                            strokeWidth={2.5}
                                            style={{ color: isActive ? SB.activeIcon : SB.inactiveIcon }} />
                                        
                                        {showFull && <span className="truncate">{item.title}</span>}
                                    </Link>
                                );
                            })}
                        </div>

                        {/* Section groups */}
                        {navItems.filter(item => item.type === 'section').map((section, idx) => (
                            <div key={idx}>
                                {showFull && (
                                    <h3 className="px-3.5 pt-4 pb-2 truncate"
                                        style={{
                                            fontFamily: T?.fontFamily || "'Inter', sans-serif",
                                            fontSize: '11px',
                                            fontWeight: 800,
                                            letterSpacing: '0.1em',
                                            textTransform: 'uppercase',
                                            color: SB.sectionLabel,
                                        }}>
                                        {section.title}
                                    </h3>
                                )}

                                <div className="space-y-1.5">
                                    {section.children.map(child => {
                                        const Icon = child.icon;
                                        const hasSubmenu = child.submenu?.length > 0;
                                        const isExpanded = expandedMenu === child.title;
                                        const isSubActive = hasSubmenu && child.submenu.some(sub =>
                                            activePath === sub.href || activePath.startsWith(sub.href + '/'));
                                        const isActive = (child.href && (activePath === child.href || activePath.startsWith(child.href + '/'))) || isSubActive;
                                        const isOpenOrActive = isActive || isExpanded;

                                        const linkStyle = isActive
                                            ? { backgroundColor: SB.activeBg, color: SB.activeText }
                                            : isExpanded
                                                ? { backgroundColor: SB.hoverBg, color: SB.hoverText }
                                                : { color: SB.inactiveText };

                                        const baseClass = `group flex items-center px-3.5 py-3 rounded-xl transition-all duration-200 border-none cursor-pointer ${!showFull ? 'justify-center px-0' : ''}`;
                                        const sharedStyle = { ...linkStyle, fontFamily: T?.fontFamily || "'Inter', sans-serif", fontSize: '15px', fontWeight: 600 };

                                        return (
                                            <div key={child.title}>
                                                {hasSubmenu ? (
                                                    <button onClick={() => showFull && toggleSubmenu(child.title)}
                                                        title={!showFull ? child.title : ''}
                                                        className={`w-full ${baseClass}`}
                                                        style={sharedStyle}
                                                        onMouseEnter={e => { if (!isOpenOrActive) { e.currentTarget.style.backgroundColor = SB.hoverBg; e.currentTarget.style.color = SB.hoverText; } }}
                                                        onMouseLeave={e => { if (!isOpenOrActive) { e.currentTarget.style.backgroundColor = isExpanded ? SB.hoverBg : 'transparent'; e.currentTarget.style.color = isExpanded ? SB.hoverText : SB.inactiveText; } }}>
                                                        
                                                        <Icon className={`w-[20px] h-[20px] flex-shrink-0 transition-colors duration-200 ${showFull ? 'mr-3.5' : ''}`}
                                                            strokeWidth={2.5}
                                                            style={{ color: isOpenOrActive ? (isActive ? SB.activeIcon : SB.inactiveIcon) : SB.inactiveIcon }} />
                                                        
                                                        {showFull && (
                                                            <>
                                                                <span className="flex-1 text-left truncate">{child.title}</span>
                                                                <ChevronRight
                                                                    className={`w-[16px] h-[16px] flex-shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                                                                    style={{ color: SB.chevron(isExpanded || isActive) }} />
                                                            </>
                                                        )}
                                                    </button>
                                                ) : (
                                                    <Link href={child.href}
                                                        onClick={() => setIsOpen(false)}
                                                        title={!showFull ? child.title : ''}
                                                        className={`${baseClass} no-underline`}
                                                        style={sharedStyle}
                                                        onMouseEnter={e => { if (!isActive) { e.currentTarget.style.backgroundColor = SB.hoverBg; e.currentTarget.style.color = SB.hoverText; } }}
                                                        onMouseLeave={e => { if (!isActive) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = SB.inactiveText; } }}>
                                                        
                                                        <Icon className={`w-[20px] h-[20px] flex-shrink-0 transition-colors duration-200 ${showFull ? 'mr-3.5' : ''}`}
                                                            strokeWidth={2.5}
                                                            style={{ color: isActive ? SB.activeIcon : SB.inactiveIcon }} />
                                                        
                                                        {showFull && <span className="truncate">{child.title}</span>}
                                                    </Link>
                                                )}

                                                {/* Submenu */}
                                                <div className={`overflow-hidden transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]
                                                    ${hasSubmenu && isExpanded && showFull ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                                                    <div className="ml-[30px] mt-2 mb-2 space-y-1 pl-4"
                                                        style={{ borderLeft: `2px solid ${SB.subBorderLeft}` }}>
                                                        {child.submenu?.map(sub => {
                                                            const subActive = activePath === sub.href || activePath.startsWith(sub.href + '/');
                                                            return (
                                                                <Link key={sub.title} href={sub.href}
                                                                    onClick={() => setIsOpen(false)}
                                                                    className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-150 no-underline"
                                                                    style={{ ...(subActive ? SB.subActive : SB.subInactive), fontFamily: T?.fontFamily || "'Inter', sans-serif", fontSize: '13px' }}
                                                                    onMouseEnter={e => { if (!subActive) { e.currentTarget.style.color = SB.hoverText; e.currentTarget.style.backgroundColor = SB.subHoverBg; } }}
                                                                    onMouseLeave={e => { if (!subActive) { e.currentTarget.style.color = SB.subInactive.color; e.currentTarget.style.backgroundColor = 'transparent'; } }}>
                                                                    {sub.title}
                                                                </Link>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </nav>
                </div>
            </aside >
        </>
    );
}