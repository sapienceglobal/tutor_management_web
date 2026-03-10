'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export function ThemeToggle() {
    const { mode, toggleMode } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <div className="w-9 h-9 rounded-lg bg-slate-100 animate-pulse" />
        );
    }

    return (
        <button
            onClick={toggleMode}
            className="w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 transition-colors flex items-center justify-center group"
            title={mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        >
            {mode === 'light' ? (
                <Moon className="w-4 h-4 text-slate-600 group-hover:text-slate-800 transition-colors" />
            ) : (
                <Sun className="w-4 h-4 text-slate-300 group-hover:text-slate-100 transition-colors" />
            )}
        </button>
    );
}
