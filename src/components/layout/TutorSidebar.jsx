'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, X, GraduationCap } from 'lucide-react';
import { tutorNavItems } from '@/config/tutorNav';
import { useSettings } from '@/components/providers/SettingsProvider';
import useInstitute from '@/hooks/useInstitute';
import { useTenant } from '@/components/providers/TenantProvider';
import Cookies from 'js-cookie';

// ─── Name truncation util ────────────────────────────────────────────────────
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

    const { tenant } = useTenant() || { tenant: null };
    const { settings } = useSettings();
    const { institute } = useInstitute();

    useEffect(() => { setMounted(true); }, []);

    const showFull = !isCollapsed || isHovering;

    // ── Guard ALL client-only values behind `mounted` ────────────────────
    // This ensures server HTML and initial client render are identical,
    // preventing hydration mismatches for logo, name, and active path.
    const activePath = mounted ? pathname : '';
    const rawName = mounted ? (institute?.name || tenant?.name || settings?.siteName || 'Sapience LMS') : 'Sapience LMS';
    const displayName = mounted ? truncateName(rawName, 20) : 'Sapience LMS';
    const instituteLogo = mounted ? institute?.logo : null;

    // Auto-expand the section that contains the active page
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

    const toggleSubmenu = (title) => {
        setExpandedMenu(expandedMenu === title ? null : title);
    };

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
                    background: 'var(--theme-sidebar)',
                    boxShadow: '2px 0 24px 0 rgba(0,0,0,0.18)',
                }}
            >
                {/* ── Logo / Brand ──────────────────────────────────────── */}
                <div className="h-[64px] flex items-center px-4 border-b border-white/[0.07] flex-shrink-0 overflow-hidden">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {/* Logo — server renders fallback div, client swaps in img after mount */}
                        <div className="w-9 h-9 flex-shrink-0">
                            {instituteLogo ? (
                                <img
                                    src={instituteLogo}
                                    alt="Logo"
                                    className="w-9 h-9 object-contain rounded-xl"
                                />
                            ) : (
                                <div
                                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                                    style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 25%, transparent)' }}
                                >
                                    <GraduationCap className="w-5 h-5" style={{ color: 'var(--theme-primary)' }} />
                                </div>
                            )}
                        </div>

                        {/* Name + subtitle */}
                        <div
                            className={`flex flex-col min-w-0 leading-tight overflow-hidden transition-all duration-300
                                ${showFull ? 'opacity-100 w-auto max-w-[140px]' : 'opacity-0 w-0 pointer-events-none'}`}
                            title={rawName !== displayName ? rawName : undefined}
                        >
                            <span className="text-[14px] font-bold text-white truncate leading-snug">
                                {displayName}
                            </span>
                            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] mt-0.5 truncate"
                                style={{ color: 'color-mix(in srgb, var(--theme-primary) 80%, white)' }}>
                                Educator Dashboard
                            </span>
                        </div>
                    </div>

                    {/* Mobile close */}
                    {showFull && (
                        <button
                            onClick={() => setIsOpen(false)}
                            className="ml-2 lg:hidden p-1.5 rounded-lg transition-all flex-shrink-0"
                            style={{ color: 'rgba(255,255,255,0.35)' }}
                            onMouseEnter={e => { e.currentTarget.style.color = 'white'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; }}
                            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>

                {/* ── Navigation ────────────────────────────────────────── */}
                <div className="flex-1 overflow-y-auto py-3 px-2.5 custom-scrollbar">
                    <nav className="space-y-5">

                        {/* Direct (non-section) links at top level */}
                        <div className="space-y-0.5">
                            {tutorNavItems.filter(item => item.type !== 'section').map((item) => {
                                const isActive = activePath === item.href || activePath.startsWith(item.href + '/');
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setIsOpen(false)}
                                        title={!showFull ? item.title : ''}
                                        className={`group flex items-center px-2.5 py-2.5 text-sm font-medium rounded-xl transition-all duration-150
                                            ${!showFull ? 'justify-center' : ''}
                                        `}
                                        style={isActive
                                            ? { backgroundColor: 'color-mix(in srgb, var(--theme-primary) 22%, transparent)', color: 'white' }
                                            : { color: 'rgba(255,255,255,0.7)' }
                                        }
                                        onMouseEnter={e => { if (!isActive) { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'white'; } }}
                                        onMouseLeave={e => { if (!isActive) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; } }}
                                    >
                                        <Icon
                                            className={`w-[18px] h-[18px] flex-shrink-0 transition-colors duration-150 ${showFull ? 'mr-3' : ''}`}
                                            style={{ color: isActive ? 'var(--theme-primary)' : undefined }}
                                        />
                                        {showFull && <span className="truncate">{item.title}</span>}
                                        {isActive && showFull && (
                                            <span className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0"
                                                style={{ backgroundColor: 'var(--theme-primary)' }} />
                                        )}
                                    </Link>
                                );
                            })}
                        </div>

                        {/* Section groups */}
                        {tutorNavItems.filter(item => item.type === 'section').map((section, idx) => (
                            <div key={idx}>
                                <div className="mx-1 border-t border-white/[0.06]" />

                                {showFull && (
                                    <h3 className="px-2.5 pt-3 pb-1.5 text-[10px] font-bold uppercase tracking-[0.14em]"
                                        style={{ color: 'color-mix(in srgb, var(--theme-primary) 55%, rgba(255,255,255,0.3))' }}>
                                        {section.title}
                                    </h3>
                                )}

                                <div className="space-y-0.5">
                                    {section.children.map((child) => {
                                        const Icon = child.icon;
                                        const hasSubmenu = child.submenu?.length > 0;
                                        const isExpanded = expandedMenu === child.title;
                                        const isSubmenuActive = hasSubmenu && child.submenu.some(sub =>
                                            activePath === sub.href || activePath.startsWith(sub.href + '/')
                                        );
                                        const isChildActive = activePath === child.href || activePath.startsWith(child.href + '/');
                                        const isActive = isChildActive || isSubmenuActive;

                                        const activeLinkStyle = { backgroundColor: 'color-mix(in srgb, var(--theme-primary) 22%, transparent)', color: 'white' };
                                        const inactiveLinkStyle = { color: 'rgba(255,255,255,0.7)' };
                                        const expandedBtnStyle = { backgroundColor: 'rgba(255,255,255,0.06)', color: 'white' };

                                        return (
                                            <div key={child.title}>
                                                {/* ── Submenu trigger ─────────────────── */}
                                                {hasSubmenu ? (
                                                    <button
                                                        onClick={() => showFull && toggleSubmenu(child.title)}
                                                        title={!showFull ? child.title : ''}
                                                        className={`group flex items-center w-full px-2.5 py-2.5 text-sm font-medium rounded-xl transition-all duration-150
                                                            ${!showFull ? 'justify-center' : ''}
                                                        `}
                                                        style={isActive || isExpanded ? expandedBtnStyle : inactiveLinkStyle}
                                                        onMouseEnter={e => { if (!isActive && !isExpanded) { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'white'; } }}
                                                        onMouseLeave={e => { if (!isActive && !isExpanded) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; } }}
                                                    >
                                                        <Icon
                                                            className={`w-[18px] h-[18px] flex-shrink-0 transition-colors duration-150 ${showFull ? 'mr-3' : ''}`}
                                                            style={{ color: isActive || isExpanded ? 'var(--theme-primary)' : undefined }}
                                                        />
                                                        {showFull && (
                                                            <>
                                                                <span className="flex-1 text-left truncate">{child.title}</span>
                                                                <ChevronRight
                                                                    className={`w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                                                                    style={{ color: isExpanded ? 'var(--theme-primary)' : 'rgba(255,255,255,0.3)' }}
                                                                />
                                                            </>
                                                        )}
                                                    </button>
                                                ) : (
                                                    /* ── Direct link ─────────────────── */
                                                    <Link
                                                        href={child.href}
                                                        onClick={() => setIsOpen(false)}
                                                        title={!showFull ? child.title : ''}
                                                        className={`group flex items-center px-2.5 py-2.5 text-sm font-medium rounded-xl transition-all duration-150
                                                            ${!showFull ? 'justify-center' : ''}
                                                        `}
                                                        style={isActive ? activeLinkStyle : inactiveLinkStyle}
                                                        onMouseEnter={e => { if (!isActive) { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'white'; } }}
                                                        onMouseLeave={e => { if (!isActive) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; } }}
                                                    >
                                                        <Icon
                                                            className={`w-[18px] h-[18px] flex-shrink-0 transition-colors duration-150 ${showFull ? 'mr-3' : ''}`}
                                                            style={{ color: isActive ? 'var(--theme-primary)' : undefined }}
                                                        />
                                                        {showFull && <span className="truncate">{child.title}</span>}
                                                        {isActive && showFull && (
                                                            <span className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0"
                                                                style={{ backgroundColor: 'var(--theme-primary)' }} />
                                                        )}
                                                    </Link>
                                                )}

                                                {/* ── Submenu slide-down ───────────── */}
                                                <div className={`overflow-hidden transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]
                                                    ${hasSubmenu && isExpanded && showFull ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
                                                `}>
                                                    <div className="ml-[30px] mt-1 mb-1 space-y-0.5 pl-3"
                                                        style={{ borderLeft: '2px solid color-mix(in srgb, var(--theme-primary) 25%, transparent)' }}>
                                                        {child.submenu?.map((sub) => {
                                                            const subActive = activePath === sub.href || activePath.startsWith(sub.href + '/');
                                                            return (
                                                                <Link
                                                                    key={sub.title}
                                                                    href={sub.href}
                                                                    onClick={() => setIsOpen(false)}
                                                                    className="flex items-center gap-2 px-3 py-2 text-[13px] rounded-lg transition-all duration-150"
                                                                    style={subActive
                                                                        ? { color: 'var(--theme-primary)', fontWeight: 600, backgroundColor: 'color-mix(in srgb, var(--theme-primary) 15%, transparent)' }
                                                                        : { color: 'rgba(255,255,255,0.5)' }
                                                                    }
                                                                    onMouseEnter={e => { if (!subActive) { e.currentTarget.style.color = 'var(--theme-primary)'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'; } }}
                                                                    onMouseLeave={e => { if (!subActive) { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.backgroundColor = 'transparent'; } }}
                                                                >
                                                                    {subActive && (
                                                                        <span className="w-1 h-1 rounded-full flex-shrink-0"
                                                                            style={{ backgroundColor: 'var(--theme-primary)' }} />
                                                                    )}
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