'use client';

/**
 * ThemeContext — Industry-level LMS theme resolution
 *
 * Priority chain (highest → lowest):
 *  1. SuperAdmin enforceGlobalTheme = true → Everyone uses globalTheme
 *  2. User in Institute + useGlobalTheme   → SA's studentTheme / tutorTheme
 *  3. User in Institute                    → Institute's own themes
 *  4. No Institute                         → SA's studentTheme / tutorTheme
 *  5. Absolute fallback                    → FALLBACK constants below
 *
 * ─── FALLBACK COLORS ─────────────────────────────────────────────────────────
 * These are the default colors shown when no admin theme is configured.
 * They match the student design spec exactly.
 * studentTokens.js reads these via CSS vars — so changing here updates all pages.
 */

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import useInstitute from '@/hooks/useInstitute';
import api from '@/lib/axios';

// ─── Hardcoded fallback defaults ──────────────────────────────────────────────
const FALLBACK = {
    student: {
        // ── Brand colors (match studentTokens design spec) ─────────────────
        primary:           '#7573E8',   // C.btnPrimary, C.iconBg area
        secondary:         '#DCD7F6',   // C.pageBg — page background
        accent:            '#5E9D9D',   // C.chartLine — chart/analytics
        sidebar:           '#3D3B8E',   // C.darkCard — dark hero sections

        // ── Derived (not set by admin, but needed for CSS vars) ────────────
        background:        '#DCD7F6',   // same as secondary
        foreground:        '#151656',   // C.heading — all headings
        sidebarForeground: '#ffffff',
        muted:             '#DCD7F6',
        border:            'rgba(98,103,233,0.12)',

        // ── Typography ────────────────────────────────────────────────────
        font:     "'DM Sans', sans-serif",
        fontSize: '14',
        radius:   '1rem',
    },
    tutor: {
        primary:           '#f97316',
        secondary:         '#fff7ed',
        accent:            '#fb923c',
        sidebar:           '#0f172a',
        background:        '#fff7ed',
        foreground:        '#1e293b',
        sidebarForeground: '#e2e8f0',
        muted:             '#fff7ed',
        border:            '#fed7aa',
        font:              "'DM Sans', sans-serif",
        fontSize:          '14',
        radius:            '1rem',
    },
    global: {
        // ── Neutral admin/default colors — DO NOT use student colors here ──
        // Admin & SuperAdmin always use this fallback.
        // Student colors are in FALLBACK.student only.
        primary:           '#4338ca',
        secondary:         '#f8fafc',
        accent:            '#6366f1',
        sidebar:           '#1e1b4b',
        background:        '#f8fafc',
        foreground:        '#1e293b',
        sidebarForeground: '#e2e8f0',
        muted:             '#f1f5f9',
        border:            '#e2e8f0',
        font:              "'DM Sans', sans-serif",
        fontSize:          '14',
        radius:            '1rem',
    },
};

const DARK_OVERRIDES = {
    background:        '#0f172a',
    foreground:        '#f8fafc',
    secondary:         '#1e293b',
    muted:             '#1e293b',
    border:            '#334155',
    sidebarForeground: '#cbd5e1',
};

// ─── Convert API theme object → CSS variable map ──────────────────────────────
// SuperAdmin stores: primaryColor, secondaryColor, sidebarColor, accentColor
// We derive all CSS vars from these 4.
function apiThemeToVars(apiTheme, fallbackKey = 'global') {
    const fb = FALLBACK[fallbackKey] || FALLBACK.global;
    if (!apiTheme) return { ...fb };

    const primary    = apiTheme.primaryColor   || fb.primary;
    const secondary  = apiTheme.secondaryColor || fb.secondary;
    const sidebar    = apiTheme.sidebarColor   || fb.sidebar;
    const accent     = apiTheme.accentColor    || fb.accent;

    return {
        primary,
        secondary,
        accent,
        sidebar,
        background:        secondary,
        foreground:        fb.foreground,   // keep design spec foreground
        sidebarForeground: '#ffffff',
        muted:             secondary,
        border:            fb.border,
        font:              apiTheme.fontFamily || fb.font,
        fontSize:          String(apiTheme.fontSize || fb.fontSize),
        radius:            '1rem',
    };
}

// ─── Read role from cookie ─────────────────────────────────────────────────────
function getUserRole() {
    if (typeof window === 'undefined') return 'student';
    const cookieRole = document.cookie
        .split('; ')
        .find(row => row.startsWith('user_role='))
        ?.split('=')[1];
    if (cookieRole) return cookieRole;
    return localStorage.getItem('userRole') || 'student';
}

// ─── Cache helpers ─────────────────────────────────────────────────────────────
const CACHE_KEY = 'sapience_global_theme_v2';
const CACHE_TTL = 5 * 60 * 1000;

function readCache() {
    if (typeof window === 'undefined') return null;
    try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (!raw) return null;
        const { data, ts } = JSON.parse(raw);
        if (Date.now() - ts > CACHE_TTL) return null;
        return data;
    } catch { return null; }
}

function writeCache(data) {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
    } catch {}
}

// ─── Apply theme vars to DOM ───────────────────────────────────────────────────
function applyThemeToDom(vars, mode) {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;

    const cssMap = {
        primary:           '--theme-primary',
        secondary:         '--theme-secondary',
        accent:            '--theme-accent',
        sidebar:           '--theme-sidebar',
        background:        '--theme-background',
        foreground:        '--theme-foreground',
        sidebarForeground: '--theme-sidebar-foreground',
        muted:             '--theme-muted',
        border:            '--theme-border',
        font:              '--theme-font',
        radius:            '--theme-radius',
    };

    Object.entries(cssMap).forEach(([key, cssVar]) => {
        if (vars[key]) root.style.setProperty(cssVar, vars[key]);
    });

    if (vars.fontSize) root.style.fontSize = `${vars.fontSize}px`;
    if (vars.font)     document.body.style.fontFamily = vars.font;

    // Legacy compat
    root.style.setProperty('--primary-color',   vars.primary   || '');
    root.style.setProperty('--secondary-color', vars.secondary || '');

    root.classList.remove('light', 'dark');
    root.classList.add(mode || 'light');
}

// ─── Sync resolver (no async — prevents flash on load) ────────────────────────
function resolveThemeSync() {
    if (typeof window === 'undefined') return { ...FALLBACK.global };

    const role = getUserRole();
    if (role === 'admin' || role === 'superadmin') return { ...FALLBACK.global };

    const isStudent = role === 'student';
    const roleKey   = isStudent ? 'student' : 'tutor';
    const globalData = readCache();

    let institute = null;
    try {
        const raw = localStorage.getItem('sapience_institute_cache');
        if (raw) {
            const { data, ts } = JSON.parse(raw);
            if (Date.now() - ts < 10 * 60 * 1000) institute = data;
        }
    } catch {}

    let resolved;
    if (globalData?.enforceGlobalTheme) {
        resolved = apiThemeToVars(globalData.globalTheme, 'global');
    } else if (institute) {
        if (institute.themeSettings?.useGlobalTheme) {
            const saTheme = isStudent ? globalData?.studentTheme : globalData?.tutorTheme;
            resolved = apiThemeToVars(saTheme || (isStudent ? institute.studentTheme : institute.tutorTheme), roleKey);
        } else {
            resolved = apiThemeToVars(isStudent ? institute.studentTheme : institute.tutorTheme, roleKey);
        }
    } else if (globalData) {
        resolved = apiThemeToVars(isStudent ? globalData.studentTheme : globalData.tutorTheme, roleKey);
    } else {
        resolved = { ...FALLBACK[roleKey] };
    }

    const mode = localStorage.getItem('theme-mode') || 'light';
    if (mode === 'dark') resolved = { ...resolved, ...DARK_OVERRIDES };
    return resolved;
}

// ─── Context ───────────────────────────────────────────────────────────────────
const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
    const { institute } = useInstitute();

    const [mode, setMode] = useState(() => {
        if (typeof window === 'undefined') return 'light';
        return localStorage.getItem('theme-mode') || 'light';
    });

    const [globalData, setGlobalData] = useState(() => readCache());

    // Sync init — apply correct theme before first paint (no flash)
    const [theme, setTheme] = useState(() => {
        const resolved = resolveThemeSync();
        applyThemeToDom(
            resolved,
            typeof window !== 'undefined' ? (localStorage.getItem('theme-mode') || 'light') : 'light'
        );
        return resolved;
    });

    // Fetch fresh global theme (always — cache only prevents initial flash)
    const fetchGlobalTheme = useCallback(async () => {
        try {
            const res = await api.get('/settings/global-theme');
            if (res.data?.success && res.data?.theme) {
                writeCache(res.data.theme);
                setGlobalData(res.data.theme);
            }
        } catch (err) {
            const cached = readCache();
            if (cached) setGlobalData(cached);
            console.warn('[ThemeProvider] Failed to fetch global theme:', err?.response?.status, err?.message);
        }
    }, []);

    useEffect(() => { fetchGlobalTheme(); }, [fetchGlobalTheme]);

    // Resolve theme whenever deps change
    useEffect(() => {
        const userRole = getUserRole();
        if (userRole === 'admin' || userRole === 'superadmin') {
            setTheme({ ...FALLBACK.global });
            return;
        }

        const isStudent = userRole === 'student';
        const roleKey   = isStudent ? 'student' : 'tutor';
        let resolved;

        if (globalData?.enforceGlobalTheme) {
            resolved = apiThemeToVars(globalData.globalTheme, 'global');
        } else if (institute) {
            if (institute.themeSettings?.useGlobalTheme) {
                const saTheme = isStudent ? globalData?.studentTheme : globalData?.tutorTheme;
                resolved = apiThemeToVars(
                    saTheme || (isStudent ? institute.studentTheme : institute.tutorTheme),
                    roleKey
                );
            } else {
                resolved = apiThemeToVars(
                    isStudent ? institute.studentTheme : institute.tutorTheme,
                    roleKey
                );
            }
        } else {
            const saTheme = isStudent ? globalData?.studentTheme : globalData?.tutorTheme;
            resolved = apiThemeToVars(saTheme, roleKey);
        }

        if (mode === 'dark' && globalData?.enableDarkMode !== false) {
            resolved = { ...resolved, ...DARK_OVERRIDES };
        }

        setTheme(resolved);
    }, [institute, globalData, mode]);

    // Apply CSS vars to DOM
    useEffect(() => {
        const root = document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(mode);

        const cssMap = {
            primary:           '--theme-primary',
            secondary:         '--theme-secondary',
            accent:            '--theme-accent',
            sidebar:           '--theme-sidebar',
            background:        '--theme-background',
            foreground:        '--theme-foreground',
            sidebarForeground: '--theme-sidebar-foreground',
            muted:             '--theme-muted',
            border:            '--theme-border',
            font:              '--theme-font',
            fontSize:          '--theme-font-size',
            radius:            '--theme-radius',
        };

        Object.entries(cssMap).forEach(([key, cssVar]) => {
            if (theme[key]) root.style.setProperty(cssVar, theme[key]);
        });

        if (theme.fontSize) root.style.fontSize = `${theme.fontSize}px`;
        if (theme.font)     document.body.style.fontFamily = theme.font;

        root.style.setProperty('--primary-color',   theme.primary);
        root.style.setProperty('--secondary-color', theme.secondary);
    }, [theme, mode]);

    const toggleMode = () => {
        if (globalData?.enableDarkMode === false) return;
        const next = mode === 'light' ? 'dark' : 'light';
        setMode(next);
        if (typeof window !== 'undefined') localStorage.setItem('theme-mode', next);
    };

    const refreshGlobalTheme = () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem(CACHE_KEY);
            localStorage.removeItem('global-theme-settings');
        }
        fetchGlobalTheme();
    };

    const value = {
        theme,
        mode,
        toggleMode,
        setMode,
        refreshGlobalTheme,
        institute,
        isDarkMode:        mode === 'dark',
        isLightMode:       mode === 'light',
        isDarkModeAllowed: globalData?.enableDarkMode !== false,
        globalData,
        colors: {
            primary:           theme.primary,
            secondary:         theme.secondary,
            background:        theme.background,
            foreground:        theme.foreground,
            sidebar:           theme.sidebar,
            sidebarForeground: theme.sidebarForeground,
            accent:            theme.accent,
            muted:             theme.muted,
            border:            theme.border,
        },
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
    return ctx;
}