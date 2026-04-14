'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, X, GraduationCap } from 'lucide-react';
import { tutorNavItems } from '@/config/tutorNav';
import { useSettings } from '@/components/providers/SettingsProvider';
import useInstitute from '@/hooks/useInstitute';
import { useTenant } from '@/components/providers/TenantProvider';
import { C, T } from '@/constants/tutorTokens';
import FeatureGate from '@/components/FeatureGate';

// ─── Name truncation util ─────────────────────────────────────────────────────
function truncateName(name, maxLen = 18) {
    if (!name || name.length <= maxLen) return name;
    const words = name.trim().split(/\s+/);
    if (words.length >= 3) return words.slice(0, 2).join(' ') + ' ' + words[2].slice(0, 3) + '.';
    if (words.length === 2) return words[0] + ' ' + words[1].slice(0, maxLen - words[0].length - 1) + '.';
    return name.slice(0, maxLen - 1) + '…';
}

// ─── Sidebar-specific tokens (New Colors retained) ─────────────────────────
const SB = {
    bg: '#E9DFFC',                          
    activeBg: '#8C68F2',                    
    activeText: '#ffffff',                  
    activeIcon: '#ffffff',                  
    inactiveText: '#4A3E68',                
    inactiveIcon: '#7551E6',                
    hoverBg: 'rgba(140,104,242,0.12)',
    hoverText: '#5B21B6',
    sectionLabel: 'rgba(59, 46, 126, 0.5)',
    divider: 'rgba(109,40,217,0.08)',
    subActive: { color: '#8C68F2', fontWeight: T.weight.semibold, backgroundColor: 'rgba(140,104,242,0.15)' },
    subInactive: { color: '#6D4EEA' },
    subHoverBg: 'rgba(140,104,242,0.08)',
    subBorderLeft: 'rgba(140,104,242,0.3)',
    logoBg: 'rgba(140,104,242,0.2)',
    logoIcon: '#6C4BDF',
    closeBtn: '#7C3AED',
    chevron: (active) => active ? '#8C68F2' : 'rgba(109,40,217,0.4)',
};

export function TutorSidebar({ isOpen, setIsOpen, isCollapsed, setIsCollapsed }) {
    const pathname = usePathname();
    const [expandedMenu, setExpandedMenu] = useState(null);
    const [isHovering, setIsHovering] = useState(false);
    const [mounted, setMounted] = useState(false);

    const { tenant } = useTenant() || { tenant: null };
    const { settings } = useSettings();
    const { institute } = useInstitute();

    useEffect(() => { setMounted(true); }, []);

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
                    if (child.submenu?.some(sub =>
                        activePath === sub.href || activePath.startsWith(sub.href + '/')
                    )) {
                        setExpandedMenu(child.title);
                    }
                });
            }
        });
    }, [activePath, mounted]);

    const toggleSubmenu = (title) => setExpandedMenu(expandedMenu === title ? null : title);

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
                    boxShadow: '2px 0 20px 0 rgba(140,104,242,0.1)',
                }}>

                {/* ── Logo / Brand (Height fixed to 64px to match your header) ── */}
                <div className="h-[64px] flex items-center px-4 flex-shrink-0 overflow-hidden"
                     style={{ borderBottom: `1px solid ${SB.divider}` }}>
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="w-9 h-9 flex-shrink-0">
                            {instituteLogo ? (
                                <img src={instituteLogo} alt="Logo" className="w-9 h-9 object-contain rounded-xl" />
                            ) : (
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                                    style={{ backgroundColor: SB.logoBg }}>
                                    <GraduationCap className="w-5 h-5" style={{ color: SB.logoIcon }} />
                                </div>
                            )}
                        </div>

                        <div className={`flex flex-col min-w-0 leading-tight overflow-hidden transition-all duration-300
                            ${showFull ? 'opacity-100 w-auto max-w-[140px]' : 'opacity-0 w-0 pointer-events-none'}`}
                            title={rawName !== displayName ? rawName : undefined}>
                            <span style={{
                                fontFamily: T.fontFamily,
                                fontSize: '15px',
                                fontWeight: T.weight.bold,
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
                                color: SB.sectionLabel,
                                textTransform: 'uppercase',
                            }} className="truncate mt-0.5">
                                Educator
                            </span>
                        </div>
                    </div>

                    {showFull && (
                        <button onClick={() => setIsOpen(false)}
                            className="ml-2 lg:hidden p-1.5 rounded-lg transition-all flex-shrink-0"
                            style={{ color: SB.closeBtn }}
                            onMouseEnter={e => { e.currentTarget.style.color = '#ffffff'; e.currentTarget.style.backgroundColor = SB.hoverBg; }}
                            onMouseLeave={e => { e.currentTarget.style.color = SB.closeBtn; e.currentTarget.style.backgroundColor = 'transparent'; }}>
                            <X size={16} />
                        </button>
                    )}
                </div>

                {/* ── Navigation ────────────────────────────────────────── */}
                <div className="flex-1 overflow-y-auto py-4 px-2.5 custom-scrollbar">
                    <nav className="space-y-4">

                        {/* Direct (non-section) links */}
                        <div className="space-y-1">
                            {tutorNavItems.filter(item => item.type !== 'section').map(item => {
                                const isActive = activePath === item.href || activePath.startsWith(item.href + '/');
                                const Icon = item.icon;
                                return (
                                    <Link key={item.href} href={item.href}
                                        onClick={() => setIsOpen(false)}
                                        title={!showFull ? item.title : ''}
                                        className={`group flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 ${!showFull ? 'justify-center px-0' : ''}`}
                                        style={isActive
                                            ? { backgroundColor: SB.activeBg, color: SB.activeText, fontFamily: T.fontFamily, fontSize: '14.5px', fontWeight: 500 }
                                            : { color: SB.inactiveText, fontFamily: T.fontFamily, fontSize: '14.5px', fontWeight: 500 }}
                                        onMouseEnter={e => { if (!isActive) { e.currentTarget.style.backgroundColor = SB.hoverBg; e.currentTarget.style.color = SB.hoverText; } }}
                                        onMouseLeave={e => { if (!isActive) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = SB.inactiveText; } }}>
                                        
                                        <Icon className={`w-[20px] h-[20px] flex-shrink-0 transition-colors duration-200 ${showFull ? 'mr-3' : ''}`}
                                            style={{ color: isActive ? SB.activeIcon : SB.inactiveIcon }} />
                                        
                                        {showFull && <span className="truncate">{item.title}</span>}
                                    </Link>
                                );
                            })}
                        </div>

                        {/* Section groups */}
                        {tutorNavItems.filter(item => item.type === 'section').map((section, idx) => (
                            <div key={idx}>
                                {showFull && (
                                    <h3 className="px-3 pt-2 pb-1.5 truncate"
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

                              <div className="space-y-1">
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

                                        const baseClass = `group flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 ${!showFull ? 'justify-center px-0' : ''}`;
                                        const sharedStyle = { ...linkStyle, fontFamily: T.fontFamily, fontSize: '14.5px', fontWeight: 500 };

                                        // 🌟 STEP 1: UI Element ko ek variable me store kar lo
                                        const NavElement = hasSubmenu ? (
                                            <button onClick={() => showFull && toggleSubmenu(child.title)}
                                                title={!showFull ? child.title : ''}
                                                className={`w-full ${baseClass}`}
                                                style={sharedStyle}
                                                onMouseEnter={e => { if (!isOpenOrActive) { e.currentTarget.style.backgroundColor = SB.hoverBg; e.currentTarget.style.color = SB.hoverText; } }}
                                                onMouseLeave={e => { if (!isOpenOrActive) { e.currentTarget.style.backgroundColor = isExpanded ? SB.hoverBg : 'transparent'; e.currentTarget.style.color = isExpanded ? SB.hoverText : SB.inactiveText; } }}>
                                                
                                                <Icon className={`w-[20px] h-[20px] flex-shrink-0 transition-colors duration-200 ${showFull ? 'mr-3' : ''}`}
                                                    style={{ color: isOpenOrActive ? (isActive ? SB.activeIcon : SB.inactiveIcon) : SB.inactiveIcon }} />
                                                
                                                {showFull && (
                                                    <>
                                                        <span className="flex-1 text-left truncate">{child.title}</span>
                                                        {child.badge === 'Premium' && (
                                                            <span className="mr-2 text-[9px] font-black tracking-widest uppercase bg-gradient-to-r from-purple-400 to-pink-500 text-white px-1.5 py-0.5 rounded-md shadow-sm">Pro</span>
                                                        )}
                                                        <ChevronRight
                                                            className={`w-[16px] h-[16px] flex-shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                                                            style={{ color: SB.chevron(isExpanded) }} />
                                                    </>
                                                )}
                                            </button>
                                        ) : (
                                            <Link href={child.href}
                                                onClick={() => setIsOpen(false)}
                                                title={!showFull ? child.title : ''}
                                                className={baseClass}
                                                style={sharedStyle}
                                                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.backgroundColor = SB.hoverBg; e.currentTarget.style.color = SB.hoverText; } }}
                                                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = SB.inactiveText; } }}>
                                                
                                                <Icon className={`w-[20px] h-[20px] flex-shrink-0 transition-colors duration-200 ${showFull ? 'mr-3' : ''}`}
                                                    style={{ color: isActive ? SB.activeIcon : SB.inactiveIcon }} />
                                                
                                                {showFull && (
                                                    <div className="flex items-center justify-between flex-1 truncate">
                                                        <span className="truncate">{child.title}</span>
                                                        {child.badge === 'Premium' && (
                                                            <span className="text-[9px] font-black tracking-widest uppercase bg-gradient-to-r from-purple-400 to-pink-500 text-white px-1.5 py-0.5 rounded-md shadow-sm">Pro</span>
                                                        )}
                                                    </div>
                                                )}
                                            </Link>
                                        );

                                        return (
                                            <div key={child.title}>
                                                {/* 🌟 STEP 2: Agar featureGate hai, toh wrap kardo, warna normal dikhao */}
                                                {child.featureGate ? (
                                                    <FeatureGate featureName={child.featureGate} mode="lock" className="block w-full">
                                                        {NavElement}
                                                    </FeatureGate>
                                                ) : (
                                                    NavElement
                                                )}

                                                {/* Submenu rendering (waisa hi rahega) */}
                                                {hasSubmenu && (
                                                    <div className={`overflow-hidden transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]
                                                        ${isExpanded && showFull ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                                                        <div className="ml-[30px] mt-1.5 mb-1.5 space-y-0.5 pl-3"
                                                            style={{ borderLeft: `2px solid ${SB.subBorderLeft}` }}>
                                                            {child.submenu?.map(sub => {
                                                                const subActive = activePath === sub.href || activePath.startsWith(sub.href + '/');
                                                                return (
                                                                    <Link key={sub.title} href={sub.href}
                                                                        onClick={() => setIsOpen(false)}
                                                                        className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-150"
                                                                        style={{ ...(subActive ? SB.subActive : SB.subInactive), fontFamily: T.fontFamily, fontSize: '13px' }}
                                                                        onMouseEnter={e => { if (!subActive) { e.currentTarget.style.color = SB.hoverText; e.currentTarget.style.backgroundColor = SB.subHoverBg; } }}
                                                                        onMouseLeave={e => { if (!subActive) { e.currentTarget.style.color = SB.subInactive.color; e.currentTarget.style.backgroundColor = 'transparent'; } }}>
                                                                        {sub.title}
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
            </aside >
        </>
    );
}