'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import useInstitute from '@/hooks/useInstitute';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    const { institute } = useInstitute();
    const [theme, setTheme] = useState({
        primary: '#4f46e5',
        secondary: '#f8fafc'
    });

    useEffect(() => {
        // Clear any existing theme first
        const root = document.documentElement;
        root.style.removeProperty('--primary-color');
        root.style.removeProperty('--secondary-color');
        
        if (institute?.brandColors) {
            setTheme({
                primary: institute.brandColors.primary || '#4f46e5',
                secondary: institute.brandColors.secondary || '#f8fafc'
            });
            
            // Apply CSS custom properties for current user
            root.style.setProperty('--primary-color', institute.brandColors.primary || '#4f46e5');
            root.style.setProperty('--secondary-color', institute.brandColors.secondary || '#f8fafc');
        } else {
            // Reset to default theme
            root.style.setProperty('--primary-color', '#4f46e5');
            root.style.setProperty('--secondary-color', '#f8fafc');
        }
    }, [institute]);

    return (
        <ThemeContext.Provider value={{ theme, institute }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
