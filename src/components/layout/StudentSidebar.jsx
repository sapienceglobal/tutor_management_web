'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, X, GraduationCap } from 'lucide-react';
import { studentNavItems } from '@/config/studentNav';
import { useSettings } from '@/components/providers/SettingsProvider';
import useInstitute from '@/hooks/useInstitute';
import { C, T, R } from '@/constants/studentTokens';

// ─── Sidebar-specific color constants ────────────────────────────────────────
// These are intentionally separate from C because the sidebar has its own
// dark background with specific active/inactive/hover states.
const SB = {
    bg:           '#C5BFEA',          // darker lavender — creates contrast vs page #DCD7F6
    activeBg:     '#5A72D4',          // active item background
    activeText:   '#ffffff',          // active item text + icon
    inactiveText: '#242661',          // inactive item text
    iconPillBg:   '#4748AA',          // icon pill background (always)
    iconColor:    '#ffffff',          // icon always white
    hoverBg:      'rgba(90,114,212,0.14)',
    sectionLabel: 'rgba(36,38,97,0.38)',
    divider:      'rgba(71,72,170,0.15)',
    activeIconPillBg: 'rgba(255,255,255,0.22)', // icon pill when item is active
};

function truncateName(name, maxLen = 18) {
    if (!name || name.length <= maxLen) return name;
    const words = name.trim().split(/\s+/);
    if (words.length >= 3) return words.slice(0, 2).join(' ') + ' ' + words[2].slice(0, 3) + '.';
    if (words.length === 2) return words[0] + ' ' + words[1].slice(0, maxLen - words[0].length - 1) + '.';
    return name.slice(0, maxLen - 1) + '…';
}

// ─── Icon Pill ────────────────────────────────────────────────────────────────
function IconPill({ icon: Icon, isActive, size = 18 }) {
    return (
        <div className="flex items-center justify-center rounded-lg flex-shrink-0"
            style={{
                width: 32,
                height: 32,
                backgroundColor: isActive ? SB.activeIconPillBg : SB.iconPillBg,
                transition: 'background-color 0.15s',
            }}>
            <Icon style={{ width: size, height: size, color: SB.iconColor }} />
        </div>
    );
}

export function StudentSidebar({ isOpen, setIsOpen, isCollapsed, setIsCollapsed }) {
    const pathname = usePathname();
    const [expandedMenu, setExpandedMenu] = useState(null);
    const [isHovering, setIsHovering]     = useState(false);
    const [mounted, setMounted]           = useState(false);
    const { settings }                    = useSettings();
    const { institute }                   = useInstitute();

    useEffect(() => { setMounted(true); }, []);

    const toggleSubmenu = (title) => setExpandedMenu(expandedMenu === title ? null : title);
    const showFull = !isCollapsed || isHovering;

    const activePath    = mounted ? pathname : '';
    const rawName       = mounted ? (institute?.name || settings?.siteName || 'SapienceLMS') : 'SapienceLMS';
    const displayName   = mounted ? truncateName(rawName, 20) : 'SapienceLMS';
    const instituteLogo = mounted ? institute?.logo : null;

    useEffect(() => {
        if (!mounted) return;
        studentNavItems.forEach(section => {
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
        borderRadius: R.xl,
        boxShadow: '0 4px 12px rgba(90,114,212,0.35)',
        fontFamily: T.fontFamily,
        fontSize: T.size.sm,
        fontWeight: T.weight.semibold,
    };
    const inactiveLinkStyle = {
        backgroundColor: 'transparent',
        color: SB.inactiveText,
        borderRadius: R.xl,
        fontFamily: T.fontFamily,
        fontSize: T.size.sm,
        fontWeight: T.weight.semibold,
    };
    const expandedBtnStyle = {
        backgroundColor: SB.hoverBg,
        color: SB.inactiveText,
        borderRadius: R.xl,
        fontFamily: T.fontFamily,
        fontSize: T.size.sm,
        fontWeight: T.weight.semibold,
    };

    const onEnterInactive = (e) => {
        e.currentTarget.style.backgroundColor = SB.hoverBg;
        e.currentTarget.style.color = SB.inactiveText;
    };
    const onLeaveInactive = (e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
        e.currentTarget.style.color = SB.inactiveText;
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
                    transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
                    ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                    ${showFull ? 'w-64' : 'w-[72px]'}
                `}
                style={{
                    backgroundColor: SB.bg,
                    boxShadow: '4px 0 16px rgba(71,72,170,0.18)',
                }}
            >
                {/* ── Logo ─────────────────────────────────────────────── */}
                <div className="h-[64px] flex items-center px-4 flex-shrink-0 overflow-hidden"
                    style={{ borderBottom: `1px solid ${SB.divider}` }}>
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="w-9 h-9 flex-shrink-0">
                            {instituteLogo ? (
                                <img src={instituteLogo} alt="Logo" className="w-9 h-9 object-contain rounded-xl" />
                            ) : (
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                                    style={{ backgroundColor: SB.iconPillBg }}>
                                    <GraduationCap className="w-5 h-5" style={{ color: SB.iconColor }} />
                                </div>
                            )}
                        </div>
                        <div className={`flex flex-col min-w-0 leading-tight overflow-hidden transition-all duration-300
                            ${showFull ? 'opacity-100 w-auto max-w-[140px]' : 'opacity-0 w-0 pointer-events-none'}`}
                            title={rawName !== displayName ? rawName : undefined}>
                            <span style={{
                                fontFamily: T.fontFamily,
                                fontSize: T.size.md,
                                fontWeight: T.weight.black,
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
                                color: 'rgba(36,38,97,0.45)',
                                textTransform: 'uppercase',
                            }} className="truncate mt-0.5">
                                Learning Portal
                            </span>
                        </div>
                    </div>

                    {showFull && (
                        <button onClick={() => setIsOpen(false)}
                            className="ml-2 lg:hidden p-1.5 rounded-lg transition-all flex-shrink-0"
                            style={{ color: 'rgba(36,38,97,0.45)' }}
                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = SB.hoverBg; e.currentTarget.style.color = SB.inactiveText; }}
                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'rgba(36,38,97,0.45)'; }}>
                            <X size={16} />
                        </button>
                    )}
                </div>

                {/* ── Navigation ────────────────────────────────────────── */}
                <div className="flex-1 overflow-y-auto py-3 px-2.5 custom-scrollbar">
                    <nav className="space-y-5">

                        {/* Direct links */}
                        <div className="space-y-0.5">
                            {studentNavItems.filter(item => item.type !== 'section').map((item) => {
                                const isActive = activePath === item.href || activePath.startsWith(item.href + '/');
                                const Icon = item.icon;
                                return (
                                    <Link key={item.href} href={item.href}
                                        onClick={() => setIsOpen(false)}
                                        title={!showFull ? item.title : ''}
                                        className={`group flex items-center gap-3 px-2 py-1.5 transition-all duration-150 ${!showFull ? 'justify-center' : ''}`}
                                        style={isActive ? activeLinkStyle : inactiveLinkStyle}
                                        onMouseEnter={e => { if (!isActive) onEnterInactive(e); }}
                                        onMouseLeave={e => { if (!isActive) onLeaveInactive(e); }}>
                                        <IconPill icon={Icon} isActive={isActive} />
                                        {showFull && <span className="truncate">{item.title}</span>}
                                    </Link>
                                );
                            })}
                        </div>

                        {/* Section groups */}
                        {studentNavItems.filter(item => item.type === 'section').map((section, idx) => (
                            <div key={idx}>
                                <div className="mx-1" style={{ borderTop: `1px solid ${SB.divider}` }} />

                                {showFull && (
                                    <h3 className="px-2 pt-3 pb-1.5 truncate"
                                        style={{
                                            fontFamily: T.fontFamily,
                                            fontSize: '10px',
                                            fontWeight: T.weight.black,
                                            letterSpacing: T.tracking.widest,
                                            textTransform: 'uppercase',
                                            color: SB.sectionLabel,
                                        }}>
                                        {section.title}
                                    </h3>
                                )}

                                <div className="space-y-0.5">
                                    {section.children.map((child) => {
                                        const Icon = child.icon;
                                        const hasSubmenu      = child.submenu?.length > 0;
                                        const isExpanded      = expandedMenu === child.title;
                                        const isSubmenuActive = hasSubmenu && child.submenu.some(sub =>
                                            activePath === sub.href || activePath.startsWith(sub.href + '/'));
                                        const isActive = (activePath === child.href || activePath.startsWith(child.href + '/')) || isSubmenuActive;

                                        return (
                                            <div key={child.title}>
                                                {hasSubmenu ? (
                                                    <button
                                                        onClick={() => showFull && toggleSubmenu(child.title)}
                                                        title={!showFull ? child.title : ''}
                                                        className={`group flex items-center gap-3 w-full px-2 py-1.5 transition-all duration-150 ${!showFull ? 'justify-center' : ''}`}
                                                        style={isActive ? activeLinkStyle : isExpanded ? expandedBtnStyle : inactiveLinkStyle}
                                                        onMouseEnter={e => { if (isActive) return; isExpanded ? onEnterExpanded(e) : onEnterInactive(e); }}
                                                        onMouseLeave={e => { if (isActive) return; isExpanded ? onLeaveExpanded(e) : onLeaveInactive(e); }}>
                                                        <IconPill icon={Icon} isActive={isActive} />
                                                        {showFull && (
                                                            <>
                                                                <span className="flex-1 text-left truncate">{child.title}</span>
                                                                <ChevronRight
                                                                    className={`w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                                                                    style={{ color: isActive ? 'rgba(255,255,255,0.60)' : 'rgba(36,38,97,0.30)' }} />
                                                            </>
                                                        )}
                                                    </button>
                                                ) : (
                                                    <Link href={child.href}
                                                        onClick={() => setIsOpen(false)}
                                                        title={!showFull ? child.title : ''}
                                                        className={`group flex items-center gap-3 px-2 py-1.5 transition-all duration-150 ${!showFull ? 'justify-center' : ''}`}
                                                        style={isActive ? activeLinkStyle : inactiveLinkStyle}
                                                        onMouseEnter={e => { if (!isActive) onEnterInactive(e); }}
                                                        onMouseLeave={e => { if (!isActive) onLeaveInactive(e); }}>
                                                        <IconPill icon={Icon} isActive={isActive} />
                                                        {showFull && <span className="truncate">{child.title}</span>}
                                                    </Link>
                                                )}

                                                {/* Submenu */}
                                                <div className={`overflow-hidden transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]
                                                    ${hasSubmenu && isExpanded && showFull ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                                                    <div className="ml-[44px] mt-1 mb-1 space-y-0.5 pl-3"
                                                        style={{ borderLeft: `2px solid rgba(71,72,170,0.20)` }}>
                                                        {child.submenu?.map((sub) => {
                                                            const subActive = activePath === sub.href || activePath.startsWith(sub.href + '/');
                                                            return (
                                                                <Link key={sub.title} href={sub.href}
                                                                    onClick={() => setIsOpen(false)}
                                                                    className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-150"
                                                                    style={subActive
                                                                        ? { backgroundColor: SB.activeBg, color: SB.activeText, fontWeight: T.weight.semibold, fontFamily: T.fontFamily, fontSize: T.size.sm, boxShadow: '0 2px 8px rgba(90,114,212,0.30)' }
                                                                        : { color: SB.inactiveText, opacity: 0.75, fontFamily: T.fontFamily, fontSize: T.size.sm }
                                                                    }
                                                                    onMouseEnter={e => { if (!subActive) { e.currentTarget.style.backgroundColor = SB.hoverBg; e.currentTarget.style.opacity = '1'; } }}
                                                                    onMouseLeave={e => { if (!subActive) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.opacity = '0.75'; } }}>
                                                                    {subActive && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: SB.activeText }} />}
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
            </aside>
        </>
    );
}