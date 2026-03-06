'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, X, GraduationCap } from 'lucide-react';
import { studentNavItems } from '@/config/studentNav';
import { useSettings } from '@/components/providers/SettingsProvider';
import useInstitute from '@/hooks/useInstitute';

// ─── Name truncation (same util as Sidebar) ──────────────────────────────────
function truncateName(name, maxLen = 18) {
    if (!name || name.length <= maxLen) return name;
    const words = name.trim().split(/\s+/);
    if (words.length >= 3) return words.slice(0, 2).join(' ') + ' ' + words[2].slice(0, 3) + '.';
    if (words.length === 2) return words[0] + ' ' + words[1].slice(0, maxLen - words[0].length - 1) + '.';
    return name.slice(0, maxLen - 1) + '…';
}

export function StudentSidebar({ isOpen, setIsOpen, isCollapsed, setIsCollapsed }) {
    const pathname = usePathname();
    const [expandedMenu, setExpandedMenu] = useState(null);
    const [isHovering, setIsHovering] = useState(false);
    const [mounted, setMounted] = useState(false);
    const { settings } = useSettings();
    const { institute } = useInstitute();

    const toggleSubmenu = (title) => {
        setExpandedMenu(expandedMenu === title ? null : title);
    };

    const showFull = !isCollapsed || isHovering;
    const activePath = mounted ? pathname : '';

    useEffect(() => { setMounted(true); }, []);

    // Auto-expand section with active page
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

    const rawName = institute?.name || settings?.siteName || 'SapienceLMS';
    const displayName = truncateName(rawName, 20);

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
                    background: 'linear-gradient(180deg, #1e1b4b 0%, #17144a 60%, #130f3f 100%)',
                    boxShadow: '2px 0 24px 0 rgba(0,0,0,0.18)',
                }}
            >
                {/* ── Logo / Brand ───────────────────────────────────────── */}
                <div className="h-[64px] flex items-center px-4 border-b border-white/[0.07] flex-shrink-0 overflow-hidden">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {/* Logo */}
                        <div className="w-9 h-9 flex-shrink-0">
                            {institute?.logo ? (
                                <img
                                    src={institute.logo}
                                    alt="Logo"
                                    className="w-9 h-9 object-contain rounded-xl"
                                />
                            ) : (
                                <div className="w-9 h-9 bg-indigo-500/25 border border-indigo-500/20 rounded-xl flex items-center justify-center">
                                    <GraduationCap className="w-5 h-5 text-indigo-300" />
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
                            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-indigo-400/80 mt-0.5 truncate">
                                Learning Portal
                            </span>
                        </div>
                    </div>

                    {/* Mobile close */}
                    {showFull && (
                        <button
                            onClick={() => setIsOpen(false)}
                            className="ml-2 lg:hidden p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/10 transition-all flex-shrink-0"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>

                {/* ── Navigation ─────────────────────────────────────────── */}
                <div className="flex-1 overflow-y-auto py-3 px-2.5 custom-scrollbar">
                    <nav className="space-y-5">

                        {/* Direct links (e.g. Dashboard) */}
                        <div className="space-y-0.5">
                            {studentNavItems.filter(item => item.type !== 'section').map((item) => {
                                const isActive = activePath === item.href || activePath.startsWith(item.href + '/');
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setIsOpen(false)}
                                        title={!showFull ? item.title : ''}
                                        className={`group flex items-center px-2.5 py-2.5 text-sm font-medium rounded-xl transition-all duration-150
                                            ${isActive
                                                ? 'bg-indigo-500/25 text-white shadow-sm'
                                                : 'text-indigo-200/80 hover:bg-white/[0.06] hover:text-white'
                                            }
                                            ${!showFull ? 'justify-center' : ''}
                                        `}
                                    >
                                        <Icon className={`w-[18px] h-[18px] flex-shrink-0 transition-colors duration-150
                                            ${isActive ? 'text-indigo-300' : 'text-indigo-400/70 group-hover:text-indigo-300'}
                                            ${showFull ? 'mr-3' : ''}
                                        `} />
                                        {showFull && <span className="truncate">{item.title}</span>}
                                        {isActive && showFull && (
                                            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                                        )}
                                    </Link>
                                );
                            })}
                        </div>

                        {/* Section groups */}
                        {studentNavItems.filter(item => item.type === 'section').map((section, idx) => (
                            <div key={idx}>
                                <div className="mx-1 border-t border-white/[0.06]" />

                                {showFull && (
                                    <h3 className="px-2.5 pt-3 pb-1.5 text-[10px] font-bold text-indigo-400/50 uppercase tracking-[0.14em]">
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

                                        return (
                                            <div key={child.title}>
                                                {hasSubmenu ? (
                                                    <button
                                                        onClick={() => showFull && toggleSubmenu(child.title)}
                                                        title={!showFull ? child.title : ''}
                                                        className={`group flex items-center w-full px-2.5 py-2.5 text-sm font-medium rounded-xl transition-all duration-150
                                                            ${isActive || isExpanded
                                                                ? 'bg-white/[0.07] text-white'
                                                                : 'text-indigo-200/80 hover:bg-white/[0.06] hover:text-white'
                                                            }
                                                            ${!showFull ? 'justify-center' : ''}
                                                        `}
                                                    >
                                                        <Icon className={`w-[18px] h-[18px] flex-shrink-0 transition-colors duration-150
                                                            ${isActive ? 'text-indigo-300' : 'text-indigo-400/70 group-hover:text-indigo-300'}
                                                            ${showFull ? 'mr-3' : ''}
                                                        `} />
                                                        {showFull && (
                                                            <>
                                                                <span className="flex-1 text-left truncate">{child.title}</span>
                                                                <ChevronRight className={`w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200 text-indigo-400/50
                                                                    ${isExpanded ? 'rotate-90 !text-indigo-400' : ''}
                                                                `} />
                                                            </>
                                                        )}
                                                    </button>
                                                ) : (
                                                    <Link
                                                        href={child.href}
                                                        onClick={() => setIsOpen(false)}
                                                        title={!showFull ? child.title : ''}
                                                        className={`group flex items-center px-2.5 py-2.5 text-sm font-medium rounded-xl transition-all duration-150
                                                            ${isActive
                                                                ? 'bg-indigo-500/25 text-white'
                                                                : 'text-indigo-200/80 hover:bg-white/[0.06] hover:text-white'
                                                            }
                                                            ${!showFull ? 'justify-center' : ''}
                                                        `}
                                                    >
                                                        <Icon className={`w-[18px] h-[18px] flex-shrink-0 transition-colors duration-150
                                                            ${isActive ? 'text-indigo-300' : 'text-indigo-400/70 group-hover:text-indigo-300'}
                                                            ${showFull ? 'mr-3' : ''}
                                                        `} />
                                                        {showFull && <span className="truncate">{child.title}</span>}
                                                        {isActive && showFull && (
                                                            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                                                        )}
                                                    </Link>
                                                )}

                                                {/* Submenu — CSS-only smooth slide */}
                                                <div className={`overflow-hidden transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]
                                                    ${hasSubmenu && isExpanded && showFull ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
                                                `}>
                                                    <div className="ml-[30px] mt-1 mb-1 space-y-0.5 border-l-2 border-indigo-500/20 pl-3">
                                                        {child.submenu?.map((sub) => {
                                                            const subActive = activePath === sub.href || activePath.startsWith(sub.href + '/');
                                                            return (
                                                                <Link
                                                                    key={sub.title}
                                                                    href={sub.href}
                                                                    onClick={() => setIsOpen(false)}
                                                                    className={`flex items-center gap-2 px-3 py-2 text-[13px] rounded-lg transition-all duration-150
                                                                        ${subActive
                                                                            ? 'text-indigo-300 font-semibold bg-indigo-500/15'
                                                                            : 'text-indigo-300/50 hover:text-indigo-200 hover:bg-white/[0.05]'
                                                                        }
                                                                    `}
                                                                >
                                                                    {subActive && <span className="w-1 h-1 rounded-full bg-indigo-400 flex-shrink-0" />}
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