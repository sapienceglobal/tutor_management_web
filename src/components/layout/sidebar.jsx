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
import { superadminNavItems } from '@/config/superadminNav';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { useTenant } from '@/components/providers/TenantProvider';
import { useSettings } from '@/components/providers/SettingsProvider';
import useInstitute from '@/hooks/useInstitute';

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

// ─── Default SVG logo ────────────────────────────────────────────────────────
function DefaultLogo({ className = '' }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

export function Sidebar({ isOpen, setIsOpen, isCollapsed, setIsCollapsed }) {
    const pathname = usePathname();
    const [expandedMenu, setExpandedMenu] = useState(null);
    const [role, setRole] = useState(null);
    const [isHovering, setIsHovering] = useState(false);

    const { tenant } = useTenant() || { tenant: null };
    const { settings } = useSettings();
    const { institute } = useInstitute();

    useEffect(() => {
        const userRole = Cookies.get('user_role');
        if (userRole) setRole(userRole);
    }, []);

    if (!role) return null;

    let navItems = tutorNavItems;
    if (role === 'admin') navItems = adminNavItems;
    if (role === 'superadmin') navItems = superadminNavItems;

    const toggleSubmenu = (title) => {
        setExpandedMenu(expandedMenu === title ? null : title);
    };

    const showFull = !isCollapsed || isHovering;

    // ── Brand name logic ──────────────────────────────────────────────────
    const rawName = role === 'superadmin'
        ? (settings?.siteName || 'Sapience LMS')
        : (institute?.name || tenant?.name || settings?.siteName || 'TutorApp');
    const displayName = truncateName(rawName, 20);
    const cfg = roleConfig[role] || roleConfig.tutor;

    return (
        <>
            {/* Mobile Backdrop */}
            <div
                className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setIsOpen(false)}
            />

            {/* Sidebar */}
            <aside
                onMouseEnter={() => isCollapsed && setIsHovering(true)}
                onMouseLeave={() => isCollapsed && setIsHovering(false)}
                className={`fixed top-0 left-0 z-50 h-screen bg-white border-r border-slate-200/80 flex flex-col
                    transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
                    ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                    ${showFull ? 'w-64' : 'w-[72px]'}
                    shadow-[1px_0_20px_0_rgba(0,0,0,0.04)]
                `}
            >
                {/* ── Logo / Brand ───────────────────────────────────────── */}
                <div className="h-[64px] flex items-center px-4 border-b border-slate-100 flex-shrink-0 overflow-hidden">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {/* Logo */}
                        <div className={`flex-shrink-0 transition-all duration-300 ${showFull ? 'w-9 h-9' : 'w-9 h-9'}`}>
                            {institute?.logo ? (
                                <img
                                    src={institute.logo}
                                    alt="Logo"
                                    className="w-9 h-9 object-contain rounded-lg"
                                />
                            ) : (
                                <div className="w-9 h-9 bg-orange-50 border border-orange-100 rounded-lg flex items-center justify-center">
                                    <DefaultLogo className="w-5 h-5 text-orange-500" />
                                </div>
                            )}
                        </div>

                        {/* Name + subtitle */}
                        <div
                            className={`flex flex-col min-w-0 leading-tight overflow-hidden transition-all duration-300
                                ${showFull ? 'opacity-100 w-auto max-w-[140px]' : 'opacity-0 w-0 pointer-events-none'}`}
                            title={rawName !== displayName ? rawName : undefined}
                        >
                            <span className="text-[14px] font-bold text-slate-800 truncate leading-snug">
                                {displayName}
                            </span>
                            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-orange-400 mt-0.5 truncate">
                                {cfg.subtitle}
                            </span>
                        </div>
                    </div>

                    {/* Mobile close */}
                    {showFull && (
                        <button
                            onClick={() => setIsOpen(false)}
                            className="ml-2 lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors flex-shrink-0"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>

                {/* ── Navigation ─────────────────────────────────────────── */}
                <div className="flex-1 overflow-y-auto py-3 px-2.5 custom-scrollbar">
                    <nav className="space-y-5">

                        {/* Direct (non-section) links */}
                        <div className="space-y-0.5">
                            {navItems.filter(item => item.type !== 'section').map((item) => {
                                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        title={!showFull ? item.title : ''}
                                        className={`group flex items-center px-2.5 py-2.5 text-sm font-medium rounded-lg transition-all duration-150
                                            ${isActive
                                                ? 'bg-orange-50 text-orange-600'
                                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                            }
                                            ${!showFull ? 'justify-center' : ''}
                                        `}
                                    >
                                        <Icon className={`w-[18px] h-[18px] flex-shrink-0 transition-colors duration-150
                                            ${isActive ? 'text-orange-500' : 'text-slate-400 group-hover:text-slate-500'}
                                            ${showFull ? 'mr-3' : ''}
                                        `} />
                                        {showFull && (
                                            <span className="truncate transition-all duration-200">{item.title}</span>
                                        )}
                                        {isActive && (
                                            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" />
                                        )}
                                    </Link>
                                );
                            })}
                        </div>

                        {/* Section groups */}
                        {navItems.filter(item => item.type === 'section').map((section, idx) => (
                            <div key={idx}>
                                <div className="my-1 mx-1 border-t border-slate-100" />

                                {showFull && (
                                    <h3 className="px-2.5 pt-3 pb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.14em]">
                                        {section.title}
                                    </h3>
                                )}

                                <div className="space-y-0.5">
                                    {section.children.map((child) => {
                                        const Icon = child.icon;
                                        const hasSubmenu = child.submenu?.length > 0;
                                        const isExpanded = expandedMenu === child.title;
                                        const isSubmenuActive = hasSubmenu && child.submenu.some(sub =>
                                            pathname === sub.href || pathname.startsWith(sub.href + '/')
                                        );
                                        const isChildActive = pathname === child.href || pathname.startsWith(child.href + '/');
                                        const isActive = isChildActive || isSubmenuActive;

                                        return (
                                            <div key={child.title}>
                                                {hasSubmenu ? (
                                                    <button
                                                        onClick={() => showFull && toggleSubmenu(child.title)}
                                                        title={!showFull ? child.title : ''}
                                                        className={`group flex items-center w-full px-2.5 py-2.5 text-sm font-medium rounded-lg transition-all duration-150
                                                            ${isActive || isExpanded
                                                                ? 'bg-slate-50 text-slate-800'
                                                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                                            }
                                                            ${!showFull ? 'justify-center' : ''}
                                                        `}
                                                    >
                                                        <Icon className={`w-[18px] h-[18px] flex-shrink-0 transition-colors duration-150
                                                            ${isActive || isExpanded ? 'text-orange-500' : 'text-slate-400 group-hover:text-slate-500'}
                                                            ${showFull ? 'mr-3' : ''}
                                                        `} />
                                                        {showFull && (
                                                            <>
                                                                <span className="flex-1 text-left truncate">{child.title}</span>
                                                                <ChevronRight className={`w-3.5 h-3.5 text-slate-400 flex-shrink-0 transition-transform duration-200
                                                                    ${isExpanded ? 'rotate-90 text-orange-400' : ''}
                                                                `} />
                                                            </>
                                                        )}
                                                    </button>
                                                ) : (
                                                    <Link
                                                        href={child.href}
                                                        title={!showFull ? child.title : ''}
                                                        className={`group flex items-center px-2.5 py-2.5 text-sm font-medium rounded-lg transition-all duration-150
                                                            ${isActive
                                                                ? 'bg-orange-50 text-orange-600'
                                                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                                            }
                                                            ${!showFull ? 'justify-center' : ''}
                                                        `}
                                                    >
                                                        <Icon className={`w-[18px] h-[18px] flex-shrink-0 transition-colors duration-150
                                                            ${isActive ? 'text-orange-500' : 'text-slate-400 group-hover:text-slate-500'}
                                                            ${showFull ? 'mr-3' : ''}
                                                        `} />
                                                        {showFull && <span className="truncate">{child.title}</span>}
                                                        {isActive && showFull && (
                                                            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" />
                                                        )}
                                                    </Link>
                                                )}

                                                {/* Submenu — smooth slide */}
                                                <div className={`overflow-hidden transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]
                                                    ${hasSubmenu && isExpanded && showFull ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
                                                `}>
                                                    <div className="ml-[30px] mt-1 mb-1 space-y-0.5 border-l-2 border-slate-100 pl-3">
                                                        {child.submenu?.map((sub) => {
                                                            const subActive = pathname === sub.href || pathname.startsWith(sub.href + '/');
                                                            return (
                                                                <Link
                                                                    key={sub.title}
                                                                    href={sub.href}
                                                                    className={`flex items-center gap-2 px-3 py-2 text-[13px] rounded-md transition-all duration-150
                                                                        ${subActive
                                                                            ? 'text-orange-600 font-semibold bg-orange-50/70'
                                                                            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                                                                        }
                                                                    `}
                                                                >
                                                                    {subActive && <span className="w-1 h-1 rounded-full bg-orange-400 flex-shrink-0" />}
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