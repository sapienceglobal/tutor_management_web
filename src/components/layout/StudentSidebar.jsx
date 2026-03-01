'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, X, GraduationCap } from 'lucide-react';
import { studentNavItems } from '@/config/studentNav';
import { useSettings } from '@/components/providers/SettingsProvider';

export function StudentSidebar({ isOpen, setIsOpen, isCollapsed, setIsCollapsed }) {
    const pathname = usePathname();
    const [expandedMenu, setExpandedMenu] = useState(null);
    const [isHovering, setIsHovering] = useState(false);
    const { settings } = useSettings();

    const toggleSubmenu = (title) => {
        setExpandedMenu(expandedMenu === title ? null : title);
    };

    const showFull = !isCollapsed || isHovering;

    // Auto-expand the section containing the active page
    useEffect(() => {
        studentNavItems.forEach(section => {
            if (section.type === 'section') {
                section.children?.forEach(child => {
                    if (child.submenu) {
                        const isActive = child.submenu.some(sub => pathname === sub.href || pathname.startsWith(sub.href));
                        if (isActive) setExpandedMenu(child.title);
                    }
                });
            }
        });
    }, [pathname]);

    return (
        <>
            {/* Mobile Backdrop */}
            <div
                className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setIsOpen(false)}
            />

            {/* Sidebar */}
            <aside
                onMouseEnter={() => isCollapsed && setIsHovering(true)}
                onMouseLeave={() => isCollapsed && setIsHovering(false)}
                className={`fixed top-0 left-0 z-50 h-screen transition-all duration-300 ease-in-out
                    ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                    ${showFull ? 'w-64' : 'w-20'}
                `}
                style={{ background: 'linear-gradient(180deg, #1e1b4b 0%, #1a1647 100%)' }}
            >
                {/* Logo Area */}
                <div className="h-16 flex items-center px-5 border-b border-white/10 overflow-hidden">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 flex-shrink-0 bg-indigo-500/30 rounded-xl flex items-center justify-center">
                            <GraduationCap className="w-5 h-5 text-indigo-300" />
                        </div>
                        {showFull && (
                            <span className="text-lg font-bold text-white tracking-tight whitespace-nowrap">
                                {settings.siteName || 'SapienceLMS'}
                            </span>
                        )}
                    </div>
                    {showFull && (
                        <button
                            onClick={() => setIsOpen(false)}
                            className="ml-auto lg:hidden text-white/50 hover:text-white"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>

                {/* Navigation */}
                <div className="h-[calc(100vh-64px)] overflow-y-auto py-4 px-3 custom-scrollbar">
                    <nav className="space-y-5">
                        {/* Direct Links (Dashboard) */}
                        <div className="space-y-1">
                            {studentNavItems.filter(item => item.type !== 'section').map((item) => {
                                const isActive = pathname === item.href;
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setIsOpen(false)}
                                        title={!showFull ? item.title : ''}
                                        className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 group
                                            ${isActive
                                                ? 'bg-indigo-500/30 text-white shadow-lg shadow-indigo-500/10'
                                                : 'text-indigo-200 hover:bg-white/5 hover:text-white'
                                            }
                                            ${!showFull && 'justify-center'}`}
                                    >
                                        <Icon className={`w-5 h-5 ${showFull ? 'mr-3' : ''} flex-shrink-0
                                            ${isActive ? 'text-indigo-300' : 'text-indigo-400 group-hover:text-indigo-300'}`}
                                        />
                                        {showFull && <span className="truncate">{item.title}</span>}
                                    </Link>
                                );
                            })}
                        </div>

                        {/* Section Links */}
                        {studentNavItems.filter(item => item.type === 'section').map((section, idx) => (
                            <div key={idx}>
                                <div className="my-3 border-t border-white/5"></div>

                                {showFull && (
                                    <h3 className="px-3 text-[10px] font-bold text-indigo-400/60 uppercase tracking-[0.15em] mb-2">
                                        {section.title}
                                    </h3>
                                )}
                                <div className="space-y-0.5">
                                    {section.children.map((child) => {
                                        const Icon = child.icon;
                                        const hasSubmenu = child.submenu && child.submenu.length > 0;
                                        const isExpanded = expandedMenu === child.title;
                                        const isSubmenuActive = hasSubmenu && child.submenu.some(sub => pathname === sub.href || pathname.startsWith(sub.href));
                                        const isChildActive = pathname === child.href || pathname.startsWith(child.href + '/');
                                        const isActive = isChildActive || isSubmenuActive;

                                        return (
                                            <div key={child.title}>
                                                {hasSubmenu ? (
                                                    <button
                                                        onClick={() => showFull && toggleSubmenu(child.title)}
                                                        title={!showFull ? child.title : ''}
                                                        className={`flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 group
                                                            ${isActive || isExpanded
                                                                ? 'text-white bg-white/5'
                                                                : 'text-indigo-200 hover:bg-white/5 hover:text-white'
                                                            }
                                                            ${!showFull && 'justify-center'}`}
                                                    >
                                                        <Icon className={`w-5 h-5 ${showFull ? 'mr-3' : ''} flex-shrink-0
                                                            ${isActive ? 'text-indigo-300' : 'text-indigo-400 group-hover:text-indigo-300'}`}
                                                        />
                                                        {showFull && (
                                                            <>
                                                                <span className="flex-1 text-left truncate">{child.title}</span>
                                                                <ChevronRight className={`w-4 h-4 text-indigo-400 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                                                            </>
                                                        )}
                                                    </button>
                                                ) : (
                                                    <Link
                                                        href={child.href}
                                                        onClick={() => setIsOpen(false)}
                                                        title={!showFull ? child.title : ''}
                                                        className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 group
                                                            ${isActive
                                                                ? 'bg-indigo-500/30 text-white'
                                                                : 'text-indigo-200 hover:bg-white/5 hover:text-white'
                                                            }
                                                            ${!showFull && 'justify-center'}`}
                                                    >
                                                        <Icon className={`w-5 h-5 ${showFull ? 'mr-3' : ''} flex-shrink-0
                                                            ${isActive ? 'text-indigo-300' : 'text-indigo-400 group-hover:text-indigo-300'}`}
                                                        />
                                                        {showFull && <span className="truncate">{child.title}</span>}
                                                    </Link>
                                                )}

                                                {/* Submenu */}
                                                {hasSubmenu && isExpanded && showFull && (
                                                    <div className="ml-8 mt-1 space-y-0.5 border-l-2 border-indigo-500/20 pl-3">
                                                        {child.submenu.map((sub) => (
                                                            <Link
                                                                key={sub.title}
                                                                href={sub.href}
                                                                onClick={() => setIsOpen(false)}
                                                                className={`block px-3 py-2 text-sm rounded-lg transition-colors
                                                                    ${pathname === sub.href || pathname.startsWith(sub.href + '/')
                                                                        ? 'text-indigo-300 font-semibold bg-indigo-500/10'
                                                                        : 'text-indigo-300/60 hover:text-indigo-200 hover:bg-white/5'
                                                                    }`}
                                                            >
                                                                {sub.title}
                                                            </Link>
                                                        ))}
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
