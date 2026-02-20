import {
    LayoutDashboard,
    Settings,
    Grid,
    Calendar,
    BarChart3,
    Layers,
    FileText,
    Table,
    Map,
    Flag,
    File,
    ShoppingBag,
    AlertCircle,
    Menu,
    ChevronDown,
    X,
    ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { tutorNavItems } from '@/config/tutorNav';
import { adminNavItems } from '@/config/adminNav';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';

export function Sidebar({ isOpen, setIsOpen, isCollapsed, setIsCollapsed }) {
    const pathname = usePathname();
    const [expandedMenu, setExpandedMenu] = useState(null);
    const [role, setRole] = useState(null);
    const [isHovering, setIsHovering] = useState(false);

    useEffect(() => {
        const userRole = Cookies.get('user_role');
        if (userRole) setRole(userRole);
    }, []);

    if (!role) return null;

    const navItems = role === 'admin' ? adminNavItems : tutorNavItems;

    const toggleSubmenu = (title) => {
        setExpandedMenu(expandedMenu === title ? null : title);
    };

    // Show full sidebar on hover if collapsed
    const showFull = !isCollapsed || isHovering;

    return (
        <>
            {/* Mobile Backdrop */}
            <div
                className={`fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                onClick={() => setIsOpen(false)}
            />

            {/* Sidebar */}
            <aside
                onMouseEnter={() => isCollapsed && setIsHovering(true)}
                onMouseLeave={() => isCollapsed && setIsHovering(false)}
                className={`fixed top-0 left-0 z-50 h-screen bg-white border-r border-slate-200 transition-all duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                    } ${showFull ? 'w-64' : 'w-20'
                    }`}
            >
                {/* Logo Area */}
                <div className="h-16 flex items-center px-6 border-b border-slate-100 overflow-hidden">
                    <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center">
                            <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-indigo-600" stroke="currentColor" strokeWidth="2">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        {showFull && (
                            <span className="text-xl font-bold text-slate-800 tracking-tight whitespace-nowrap">
                                {role === 'admin' ? 'Admin Panel' : 'TutorApp'}
                            </span>
                        )}
                    </div>
                    {showFull && (
                        <button
                            onClick={() => setIsOpen(false)}
                            className="ml-auto lg:hidden text-slate-500"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>

                {/* Navigation */}
                <div className="h-[calc(100vh-64px)] overflow-y-auto py-4 px-3 custom-scrollbar">
                    <nav className="space-y-6">
                        {/* Direct Links */}
                        <div className="space-y-1">
                            {navItems.filter(item => item.type !== 'section').map((item) => {
                                const isActive = pathname === item.href || pathname.startsWith(item.href);
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        title={!showFull ? item.title : ''}
                                        className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors group ${isActive
                                                ? 'text-orange-500 bg-orange-50'
                                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                            } ${!showFull && 'justify-center'}`}
                                    >
                                        <Icon className={`w-5 h-5 ${showFull ? 'mr-3' : ''} flex-shrink-0 ${isActive ? 'text-orange-500' : 'text-slate-400 group-hover:text-slate-600'
                                            }`} />
                                        {showFull && <span className="truncate">{item.title}</span>}
                                    </Link>
                                );
                            })}
                        </div>

                        {/* Section Links */}
                        {navItems.filter(item => item.type === 'section').map((section, idx) => (
                            <div key={idx}>
                                {/* Section Separator Line */}
                                {idx > 0 && <div className="my-4 border-t border-[#F1F5F9]"></div>}

                                {showFull && (
                                    <h3 className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                        {section.title}
                                    </h3>
                                )}
                                <div className="space-y-1">
                                    {section.children.map((child) => {
                                        const Icon = child.icon;
                                        const hasSubmenu = child.submenu && child.submenu.length > 0;
                                        const isExpanded = expandedMenu === child.title;
                                        const isSubmenuActive = hasSubmenu && child.submenu.some(sub => pathname === sub.href);
                                        const isChildActive = pathname === child.href;
                                        const isActive = isChildActive || isSubmenuActive;

                                        return (
                                            <div key={child.title}>
                                                {hasSubmenu ? (
                                                    <button
                                                        onClick={() => showFull && toggleSubmenu(child.title)}
                                                        title={!showFull ? child.title : ''}
                                                        className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors group ${isActive || isExpanded
                                                                ? 'text-slate-800 bg-slate-50'
                                                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                                            } ${!showFull && 'justify-center'}`}
                                                    >
                                                        <Icon className={`w-5 h-5 ${showFull ? 'mr-3' : ''} flex-shrink-0 ${isActive || isExpanded ? 'text-orange-500' : 'text-slate-400 group-hover:text-slate-600'
                                                            }`} />
                                                        {showFull && (
                                                            <>
                                                                <span className="flex-1 text-left truncate">{child.title}</span>
                                                                <ChevronRight
                                                                    className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''
                                                                        }`}
                                                                />
                                                            </>
                                                        )}
                                                    </button>
                                                ) : (
                                                    <Link
                                                        href={child.href}
                                                        title={!showFull ? child.title : ''}
                                                        className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors group ${isActive
                                                                ? 'text-orange-500 bg-orange-50'
                                                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                                            } ${!showFull && 'justify-center'}`}
                                                    >
                                                        <Icon className={`w-5 h-5 ${showFull ? 'mr-3' : ''} flex-shrink-0 ${isActive ? 'text-orange-500' : 'text-slate-400 group-hover:text-slate-600'
                                                            }`} />
                                                        {showFull && <span className="truncate">{child.title}</span>}
                                                    </Link>
                                                )}

                                                {/* Submenu */}
                                                {hasSubmenu && isExpanded && showFull && (
                                                    <div className="ml-9 mt-1 space-y-1 border-l border-slate-200 pl-2 animate-in slide-in-from-top-2 duration-200">
                                                        {child.submenu.map((sub) => (
                                                            <Link
                                                                key={sub.title}
                                                                href={sub.href}
                                                                className={`block px-3 py-2 text-sm rounded-md transition-colors ${pathname === sub.href
                                                                        ? 'text-orange-600 font-medium bg-orange-50/50'
                                                                        : 'text-slate-500 hover:text-orange-500 hover:bg-slate-50'
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