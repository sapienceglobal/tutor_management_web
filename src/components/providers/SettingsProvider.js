'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import api from '@/lib/axios';

const SettingsContext = createContext({});

export function SettingsProvider({ children }) {
    const [settings, setSettings] = useState({
        siteName: '',
        footerText: '',
        primaryColor: '#4f46e5',
        contactEmail: '',
        supportEmail: '',
        supportPhone: '',
        contactAddress: '',
        facebookLink: '',
        twitterLink: '',
        instagramLink: '',
        linkedinLink: '',
        youtubeLink: '',
    });
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await api.get('/cms/settings');
            if (res.data.success && res.data.settings) {
                setSettings(prev => ({ ...prev, ...res.data.settings }));

                // Apply primary color as CSS variable
                if (res.data.settings.primaryColor) {
                    document.documentElement.style.setProperty('--primary-brand', res.data.settings.primaryColor);
                }
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        } finally {
            setLoaded(true);
        }
    };

    return (
        <SettingsContext.Provider value={{ settings, loaded }}>
            {children}
        </SettingsContext.Provider>
    );
}

export const useSettings = () => useContext(SettingsContext);
