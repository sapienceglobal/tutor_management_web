'use client';

import { Wrench } from 'lucide-react';
import Link from 'next/link';

export default function MaintenancePage() {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full text-center space-y-8">
                <div className="flex justify-center">
                    <div className="relative">
                        <div className="absolute inset-0 bg-indigo-200 blur-[30px] rounded-full opacity-50"></div>
                        <div className="relative bg-white p-6 rounded-3xl shadow-xl border border-indigo-100/50">
                            <Wrench className="w-16 h-16 text-indigo-600 mb-4 mx-auto animate-bounce" />
                            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Under Maintenance</h2>
                            <p className="text-slate-600 mt-2 leading-relaxed">
                                We are currently upgrading the platform to serve you better. We'll be back online shortly. Thank you for your patience!
                            </p>
                        </div>
                    </div>
                </div>

                <div className="pt-8">
                    <Link href="/login" className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
                        Admin Login
                    </Link>
                </div>
            </div>
        </div>
    );
}
