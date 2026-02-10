'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { GraduationCap, Sparkles } from 'lucide-react';

export function Sidebar({ items }) {
    const pathname = usePathname();

    return (
        <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 z-50 border-r bg-gradient-to-b from-white via-slate-50 to-white">
            {/* Logo Section */}
            <div className="flex h-16 items-center px-6 border-b bg-white shadow-sm">
                <Link className="flex items-center gap-3 font-semibold group" href="/">
                    <div className="relative">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 shadow-lg group-hover:shadow-xl transition-all duration-200 group-hover:scale-105">
                            <GraduationCap className="h-6 w-6 text-white" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white animate-pulse"></div>
                    </div>
                    <div>
                        <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            TutorHub
                        </span>
                        <p className="text-[10px] text-slate-500 font-medium">Learning Platform</p>
                    </div>
                </Link>
            </div>

            {/* Navigation */}
            <div className="flex-1 py-6 px-4 overflow-y-auto">
                <nav className="space-y-1">
                    {items.map((item, index) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

                        return (
                            <Link
                                key={index}
                                href={item.href}
                                className={cn(
                                    "group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                                    isActive
                                        ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30"
                                        : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                                )}
                            >
                                <div className={cn(
                                    "flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200",
                                    isActive
                                        ? "bg-white/20 shadow-inner"
                                        : "bg-slate-100 group-hover:bg-slate-200"
                                )}>
                                    <Icon className={cn(
                                        "h-5 w-5 transition-all duration-200",
                                        isActive
                                            ? "text-white"
                                            : "text-slate-600 group-hover:text-slate-900"
                                    )} />
                                </div>
                                <span className="flex-1">{item.title}</span>
                                {isActive && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-white shadow-lg"></div>
                                )}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Footer Section */}
            <div className="p-4 border-t bg-gradient-to-r from-indigo-50 to-purple-50">
                <div className="p-4 bg-white rounded-xl shadow-sm border border-indigo-100">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg">
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs font-bold text-slate-900">Upgrade to Pro</p>
                            <p className="text-[10px] text-slate-600">Get unlimited access</p>
                        </div>
                    </div>
                    <button className="w-full py-2 px-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
                        Upgrade Now
                    </button>
                </div>
            </div>
        </div>
    );

}