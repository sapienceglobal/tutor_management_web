'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MdChevronRight, MdClose, MdSchool } from 'react-icons/md';
import { tutorNavItems } from '@/config/tutorNav';
import { useSettings } from '@/components/providers/SettingsProvider';
import useInstitute from '@/hooks/useInstitute';
import { useTenant } from '@/components/providers/TenantProvider';
import { C, T } from '@/constants/tutorTokens';
import FeatureGate from '@/components/FeatureGate';

// ─── Sidebar-specific color constants (Exact match with StudentSidebar) ──────
const SB = {
    bg: 'rgb(253,252,255)',           // darker lavender — creates contrast vs page #DCD7F6
    activeBg: '#5A72D4',              // active item background
    activeText: '#ffffff',            // active item text + icon
    inactiveText: '#242661',          // inactive item text
    hoverBg: 'rgba(90,114,212,0.12)', // Subtle hover for inactive
    sectionLabel: 'rgba(36,38,97,0.45)',
    divider: 'rgba(71,72,170,0.15)',
};

function truncateName(name, maxLen = 18) {
    if (!name || name.length <= maxLen) return name;
    const words = name.trim().split(/\s+/);
    if (words.length >= 3) return words.slice(0, 2).join(' ') + ' ' + words[2].slice(0, 3) + '.';
    if (words.length === 2) return words[0] + ' ' + words[1].slice(0, maxLen - words[0].length - 1) + '.';
    return name.slice(0, maxLen - 1) + '…';
}

export function TutorSidebar({ isOpen, setIsOpen, isCollapsed, setIsCollapsed }) {
    const pathname = usePathname();
    const [expandedMenu, setExpandedMenu] = useState(null);
    const [isHovering, setIsHovering] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [isHydrated, setIsHydrated] = useState(false);

    const { tenant } = useTenant() || { tenant: null };
    const { settings } = useSettings();
    const { institute } = useInstitute();

    useEffect(() => {
        setMounted(true);
        setIsHydrated(true);
    }, []);

    const toggleSubmenu = (title) => setExpandedMenu(expandedMenu === title ? null : title);
    const showFull = !isCollapsed || isHovering;

    const activePath = mounted ? pathname : '';
    const rawName = mounted ? (institute?.name || tenant?.name || settings?.siteName || 'Sapience LMS') : 'Sapience LMS';
    const displayName = mounted ? truncateName(rawName, 20) : 'Sapience LMS';
    const instituteLogo = mounted ? institute?.logo : null;

    useEffect(() => {
        if (!mounted) return;
        tutorNavItems.forEach(section => {
            if (section.type === 'section') {
                section.children?.forEach(child => {
                    if (child.submenu?.some(sub => activePath === sub.href || activePath.startsWith(sub.href + '/'))) {
                        setExpandedMenu(child.title);
                    }
                });
            }
        });
    }, [activePath, mounted]);

    // ── Item style helpers ────────────────────────────────────────────────────
    const activeLinkStyle = {
        backgroundColor: SB.activeBg,
        color: SB.activeText,
        borderRadius: '10px',
        boxShadow: '0 4px 12px rgba(90,114,212,0.35)',
        fontFamily: T.fontFamily,
        fontSize: '15px',
        fontWeight: T.weight.bold,
    };

    const inactiveLinkStyle = {
        backgroundColor: 'transparent',
        color: SB.inactiveText,
        borderRadius: '10px',
        fontFamily: T.fontFamily,
        fontSize: '15px',
        fontWeight: T.weight.semibold,
        opacity: 0.85,
    };

    const expandedBtnStyle = {
        backgroundColor: SB.hoverBg,
        color: SB.inactiveText,
        borderRadius: '10px',
        fontFamily: T.fontFamily,
        fontSize: '15px',
        fontWeight: T.weight.bold,
    };

    const onEnterInactive = (e) => {
        e.currentTarget.style.backgroundColor = SB.hoverBg;
        e.currentTarget.style.opacity = '1';
    };
    const onLeaveInactive = (e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
        e.currentTarget.style.opacity = '0.85';
    };
    const onEnterExpanded = (e) => { e.currentTarget.style.backgroundColor = 'rgba(90,114,212,0.20)'; };
    const onLeaveExpanded = (e) => { e.currentTarget.style.backgroundColor = SB.hoverBg; };

    return (
        <>
            {/* Mobile backdrop */}
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
                    backgroundColor: SB.bg,
                    boxShadow: '4px 0 16px rgba(71,72,170,0.18)',
                }}
            >
                {/* ── Logo ─────────────────────────────────────────────── */}
                <div className="h-[72px] flex items-center px-4 flex-shrink-0 overflow-hidden"
                    style={{ borderBottom: `1px solid ${SB.divider}` }}>
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 flex-shrink-0">
                            {instituteLogo ? (
                                <img src={instituteLogo} alt="Logo" className="w-10 h-10 object-contain rounded-xl shadow-sm bg-white" />
                            ) : (
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
                                    style={{ backgroundColor: SB.activeBg }}>
                                    <MdSchool className="w-6 h-6" style={{ color: '#ffffff' }} />
                                </div>
                            )}
                        </div>
                        <div className={`flex flex-col min-w-0 leading-tight overflow-hidden transition-all duration-300
                            ${showFull ? 'opacity-100 w-auto max-w-[140px]' : 'opacity-0 w-0 pointer-events-none'}`}
                            title={rawName !== displayName ? rawName : undefined}>
                            <span style={{
                                fontFamily: T.fontFamily,
                                fontSize: T.size.md,
                                fontWeight: T.weight.bold, // Fixed black to bold
                                color: SB.inactiveText,
                                lineHeight: T.leading.snug,
                            }} className="truncate">
                                {displayName}
                            </span>
                            <span style={{
                                fontFamily: T.fontFamily,
                                fontSize: '10px',
                                fontWeight: T.weight.bold,
                                letterSpacing: T.tracking.widest,
                                color: 'rgba(36,38,97,0.5)',
                                textTransform: 'uppercase',
                            }} className="truncate mt-0.5">
                                Educator
                            </span>
                        </div>
                    </div>

                    {showFull && (
                        <button onClick={() => setIsOpen(false)}
                            className="ml-2 lg:hidden p-1.5 rounded-lg transition-all flex-shrink-0 border-none cursor-pointer bg-transparent"
                            style={{ color: 'rgba(36,38,97,0.5)' }}
                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = SB.hoverBg; e.currentTarget.style.color = SB.inactiveText; }}
                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'rgba(36,38,97,0.5)'; }}>
                            <MdClose size={18} />
                        </button>
                    )}
                </div>

                {/* ── Navigation ────────────────────────────────────────── */}
                <div className="flex-1 overflow-y-auto py-4 px-3 custom-scrollbar">
                    <nav className="space-y-2">

                        {/* Direct links */}
                        <div className="space-y-1">
                            {tutorNavItems.filter(item => item.type !== 'section').map((item) => {
                                const isActive = activePath === item.href || activePath.startsWith(item.href + '/');
                                const Icon = item.icon;
                                return (
                                    <div key={item.href}>
                                        <Link href={item.href}
                                            onClick={() => setIsOpen(false)}
                                            title={!showFull ? item.title : ''}
                                            className={`group flex items-center gap-3.5 px-3 py-2.5 transition-all duration-150 text-decoration-none ${!showFull ? 'justify-center px-0' : ''}`}
                                            style={isActive ? activeLinkStyle : inactiveLinkStyle}
                                            onMouseEnter={e => { if (!isActive) onEnterInactive(e); }}
                                            onMouseLeave={e => { if (!isActive) onLeaveInactive(e); }}>

                                            <Icon className="w-6 h-6 shrink-0" style={{ color: isActive ? '#fff' : 'rgb(98, 103, 233)', opacity: 1 }} />
                                            {showFull && <span className="truncate">{item.title}</span>}
                                        </Link>

                                        {/* Separator Line exactly as student sidebar */}
                                        <div style={{ height: '1px', backgroundColor: SB.divider, margin: '6px 12px' }} />
                                    </div>
                                );
                            })}
                        </div>

                        {/* Section groups */}
                        {tutorNavItems.filter(item => item.type === 'section').map((section, idx) => (
                            <div key={idx}>
                                {showFull ? (
                                    <h3 className="px-3 pt-4 pb-2 truncate"
                                        style={{
                                            fontFamily: T.fontFamily,
                                            fontSize: '11px',
                                            fontWeight: T.weight.bold,
                                            letterSpacing: '1px',
                                            textTransform: 'uppercase',
                                            color: SB.sectionLabel,
                                            margin: 0
                                        }}>
                                        {section.title}
                                    </h3>
                                ) : (
                                    <div className="mx-2 my-4" style={{ borderTop: `1px solid ${SB.divider}` }} />
                                )}

                                <div className="space-y-1">
                                    {section.children.map((child) => {
                                        const Icon = child.icon;
                                        const hasSubmenu = child.submenu?.length > 0;
                                        const isExpanded = expandedMenu === child.title;
                                        const isSubmenuActive = hasSubmenu && child.submenu.some(sub => activePath === sub.href || activePath.startsWith(sub.href + '/'));
                                        const isActive = (activePath === child.href || activePath.startsWith(child.href + '/')) || isSubmenuActive;

                                        const NavElement = hasSubmenu ? (
                                            <button
                                                onClick={() => showFull && toggleSubmenu(child.title)}
                                                title={!showFull ? child.title : ''}
                                                className={`group flex items-center gap-3.5 w-full px-3 py-2 cursor-pointer border-none transition-all duration-150 ${!showFull ? 'justify-center px-0' : ''}`}
                                                style={isActive ? activeLinkStyle : isExpanded ? expandedBtnStyle : inactiveLinkStyle}
                                                onMouseEnter={e => { if (isActive) return; isExpanded ? onEnterExpanded(e) : onEnterInactive(e); }}
                                                onMouseLeave={e => { if (isActive) return; isExpanded ? onLeaveExpanded(e) : onLeaveInactive(e); }}>

                                                <Icon className="w-6 h-6 shrink-0" style={{ color: isActive ? '#fff' : 'rgb(98, 103, 233)', opacity: 1 }} />

                                                {showFull && (
                                                    <div className="flex items-center justify-between flex-1 truncate">
                                                        <span className="truncate">{child.title}</span>
                                                        {child.badge === 'Premium' && (
                                                            <span className="ml-2 text-[9px] font-bold tracking-widest uppercase bg-gradient-to-r from-purple-400 to-pink-500 text-white px-1.5 py-0.5 rounded-md shadow-sm">Pro</span>
                                                        )}
                                                        <MdChevronRight
                                                            className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                                                            style={{ color: isActive ? 'rgba(255,255,255,0.70)' : 'rgba(36,38,97,0.40)' }} />
                                                    </div>
                                                )}
                                            </button>
                                        ) : (
                                            <Link href={child.href}
                                                onClick={() => setIsOpen(false)}
                                                title={!showFull ? child.title : ''}
                                                className={`group flex items-center gap-3.5 px-3 py-2.5 transition-all duration-150 text-decoration-none ${!showFull ? 'justify-center px-0' : ''}`}
                                                style={isActive ? activeLinkStyle : inactiveLinkStyle}
                                                onMouseEnter={e => { if (!isActive) onEnterInactive(e); }}
                                                onMouseLeave={e => { if (!isActive) onLeaveInactive(e); }}>

                                                <Icon className="w-6 h-6 shrink-0" style={{ color: isActive ? '#fff' : 'rgb(98, 103, 233)', opacity: 1 }} />
                                                
                                                {showFull && (
                                                    <div className="flex items-center justify-between flex-1 truncate">
                                                        <span className="truncate">{child.title}</span>
                                                        {child.badge === 'Premium' && (
                                                            <span className="ml-2 text-[9px] font-bold tracking-widest uppercase bg-gradient-to-r from-purple-400 to-pink-500 text-white px-1.5 py-0.5 rounded-md shadow-sm">Pro</span>
                                                        )}
                                                    </div>
                                                )}
                                            </Link>
                                        );

                                        return (
                                            <div key={child.title}>
                                                {child.featureGate ? (
                                                    <FeatureGate featureName={child.featureGate} mode="lock" className="block w-full">
                                                        {NavElement}
                                                    </FeatureGate>
                                                ) : (
                                                    NavElement
                                                )}

                                                {/* Submenu EXACTLY like student */}
                                                {hasSubmenu && (
                                                    <div className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
                                                        ${isExpanded && showFull ? 'max-h-96 opacity-100 mt-1 mb-2' : 'max-h-0 opacity-0'}`}>
                                                        <div className="ml-[22px] space-y-1 pl-4" style={{ borderLeft: '1px solid #cde6ff' }}>
                                                            {child.submenu?.map((sub) => {
                                                                const subActive = activePath === sub.href || activePath.startsWith(sub.href + '/');
                                                                return (
                                                                    <Link key={sub.title} href={sub.href}
                                                                        onClick={() => setIsOpen(false)}
                                                                        className="flex items-center gap-2.5 px-3 py-2 transition-all duration-150 relative text-decoration-none"
                                                                        style={subActive
                                                                            ? {
                                                                                backgroundColor: 'transparent',
                                                                                color: SB.activeBg, fontWeight: T.weight.bold,
                                                                                fontFamily: T.fontFamily, fontSize: '13px'
                                                                            }
                                                                            : {
                                                                                backgroundColor: 'transparent',
                                                                                color: SB.inactiveText, opacity: 0.75,
                                                                                fontFamily: T.fontFamily, fontSize: '13px',
                                                                                fontWeight: T.weight.semibold
                                                                            }}
                                                                        onMouseEnter={e => {
                                                                            if (!subActive) {
                                                                                e.currentTarget.style.backgroundColor = 'transparent';
                                                                                e.currentTarget.style.color = SB.activeBg;
                                                                                e.currentTarget.style.opacity = '1';
                                                                            }
                                                                        }}
                                                                        onMouseLeave={e => {
                                                                            if (!subActive) {
                                                                                e.currentTarget.style.backgroundColor = 'transparent';
                                                                                e.currentTarget.style.color = SB.inactiveText;  
                                                                                e.currentTarget.style.opacity = '0.75';
                                                                            }
                                                                        }}>
                                                                        <span className="truncate">{sub.title}</span>
                                                                    </Link>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
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