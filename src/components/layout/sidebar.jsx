'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { GraduationCap, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

import Cookies from 'js-cookie';

export function Sidebar({ items }) {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = () => {
        // Clear local storage
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        // Clear cookies for middleware
        Cookies.remove('token');
        Cookies.remove('user_role');

        router.push('/login');
    };

    return (
        <div className="hidden border-r bg-gray-50/40 lg:block dark:bg-gray-800/40 w-64 h-screen fixed left-0 top-0 flex flex-col">
            <div className="flex h-16 items-center px-6 border-b">
                <Link className="flex items-center gap-2 font-semibold" href="#">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <GraduationCap className="h-5 w-5" />
                    </div>
                    <span className="text-xl font-bold text-gray-900">TutorApp</span>
                </Link>
            </div>

            <div className="flex-1 py-6 flex flex-col gap-2 px-4">
                <nav className="grid items-start gap-2 text-sm font-medium">
                    {items.map((item, index) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;

                        return (
                            <Link
                                key={index}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200",
                                    isActive
                                        ? "bg-blue-600 text-white shadow-md shadow-blue-200 font-medium"
                                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                                )}
                            >
                                <Icon className={cn("h-5 w-5", isActive ? "text-white" : "text-slate-500 group-hover:text-slate-900")} />
                                <span>{item.title}</span>
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <div className="p-4 border-t">
                <Button
                    variant="outline"
                    className="w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={handleLogout}
                >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                </Button>
            </div>
        </div>
    );
}
