'use client';

/**
 * ThemeContext — Industry-level LMS theme resolution
 *
 * Priority chain (highest → lowest):
 *
 *  1. SuperAdmin enforceGlobalTheme = true
 *     → Everyone uses SuperAdmin's globalTheme, no exceptions
 *
 *  2. User belongs to an Institute
 *     a. Institute useGlobalTheme = true
 *        → Use SuperAdmin's role-specific theme (studentTheme / tutorTheme)
 *     b. Institute useGlobalTheme = false
 *        → Use Institute's own studentTheme / tutorTheme
 *
 *  3. User NOT in any Institute (standalone tutor/student)
 *     → Use SuperAdmin's role-specific theme (studentTheme / tutorTheme)
 *
 *  4. Absolute fallback → hardcoded defaults
 */

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import useInstitute from '@/hooks/useInstitute';
import api from '@/lib/axios';

// ─── Hardcoded fallback defaults ─────────────────────────────────────────────
const FALLBACK = {
    student: {
        primary:          '#4338ca',
        secondary:        '#f8fafc',
        accent:           '#6366f1',
        sidebar:          '#1e1b4b',
        background:       '#f8fafc',
        foreground:       '#1e293b',
        sidebarForeground:'#e2e8f0',
        muted:            '#f1f5f9',
        border:           '#e2e8f0',
        font:             "'DM Sans', sans-serif",
        fontSize:         '14',
        radius:           '1rem',
    },
    tutor: {
        primary:          '#f97316',
        secondary:        '#fff7ed',
        accent:           '#fb923c',
        sidebar:          '#0f172a',
        background:       '#fff7ed',
        foreground:       '#1e293b',
        sidebarForeground:'#e2e8f0',
        muted:            '#fff7ed',
        border:           '#fed7aa',
        font:             "'DM Sans', sans-serif",
        fontSize:         '14',
        radius:           '1rem',
    },
    global: {
        primary:          '#4338ca',
        secondary:        '#f8fafc',
        accent:           '#6366f1',
        sidebar:          '#1e1b4b',
        background:       '#f8fafc',
        foreground:       '#1e293b',
        sidebarForeground:'#e2e8f0',
        muted:            '#f1f5f9',
        border:           '#e2e8f0',
        font:             "'DM Sans', sans-serif",
        fontSize:         '14',
        radius:           '1rem',
    },
};

const DARK_OVERRIDES = {
    background:       '#0f172a',
    foreground:       '#f8fafc',
    secondary:        '#1e293b',
    muted:            '#1e293b',
    border:           '#334155',
    sidebarForeground:'#cbd5e1',
};

// ─── Convert API theme object → CSS variable map ─────────────────────────────
function apiThemeToVars(apiTheme, fallbackKey = 'global') {
    if (!apiTheme) return { ...FALLBACK[fallbackKey] };
    return {
        primary:          apiTheme.primaryColor   || FALLBACK[fallbackKey].primary,
        secondary:        apiTheme.secondaryColor || FALLBACK[fallbackKey].secondary,
        accent:           apiTheme.accentColor    || FALLBACK[fallbackKey].accent,
        sidebar:          apiTheme.sidebarColor   || FALLBACK[fallbackKey].sidebar,
        background:       apiTheme.secondaryColor || FALLBACK[fallbackKey].background,
        foreground:       FALLBACK[fallbackKey].foreground,
        sidebarForeground:FALLBACK[fallbackKey].sidebarForeground,
        muted:            apiTheme.secondaryColor || FALLBACK[fallbackKey].muted,
        border:           FALLBACK[fallbackKey].border,
        font:             apiTheme.fontFamily     || FALLBACK[fallbackKey].font,
        fontSize:         String(apiTheme.fontSize || FALLBACK[fallbackKey].fontSize),
        radius:           '1rem',
    };
}

// ─── Read role from cookie (set by backend, tamper-evident) ─────────────────
// We use 'user_role' cookie which is set at login alongside JWT token.
// Even if someone tampers this cookie, the WORST outcome is wrong CSS colors —
// all actual data access is protected by backend JWT + authorize middleware.
// localStorage.userRole is kept as fallback for compatibility.
function getUserRole() {
    if (typeof window === 'undefined') return 'student';
    // Try cookie first (more reliable — set by login, cleared on logout)
    const cookieRole = document.cookie
        .split('; ')
        .find(row => row.startsWith('user_role='))
        ?.split('=')[1];
    if (cookieRole) return cookieRole;
    // Fallback to localStorage
    return localStorage.getItem('userRole') || 'student';
}
const CACHE_KEY   = 'sapience_global_theme_v2';
const CACHE_TTL   = 5 * 60 * 1000; // 5 minutes

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

// ─── Synchronous theme resolver (runs before React paint) ───────────────────
// Reads localStorage cache + institute data to compute theme vars WITHOUT
// any async calls — eliminates the flash of wrong theme on page load.
function resolveThemeSync() {
    if (typeof window === 'undefined') return { ...FALLBACK.global };

    const role = getUserRole();
    if (role === 'admin' || role === 'superadmin') return { ...FALLBACK.global };

    const isStudent = role === 'student';
    const roleKey   = isStudent ? 'student' : 'tutor';

    // Try to read cached global data
    const globalData = readCache();

    // Try to read cached institute data
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
        resolved = { ...FALLBACK[roleKey] || FALLBACK.global };
    }

    const mode = localStorage.getItem('theme-mode') || 'light';
    if (mode === 'dark') resolved = { ...resolved, ...DARK_OVERRIDES };
    return resolved;
}

// ─── Apply theme vars to DOM immediately (call this synchronously) ───────────
function applyThemeToDom(vars, mode) {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;
    const map = {
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
    Object.entries(map).forEach(([key, cssVar]) => {
        if (vars[key]) root.style.setProperty(cssVar, vars[key]);
    });
    if (vars.fontSize) {
        root.style.fontSize = `${vars.fontSize}px`;
        document.body.style.fontFamily = vars.font || FALLBACK.global.font;
    }
    root.classList.remove('light', 'dark');
    root.classList.add(mode || 'light');
}


const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
    const { institute } = useInstitute();

    const [mode, setMode] = useState(() => {
        if (typeof window === 'undefined') return 'light';
        return localStorage.getItem('theme-mode') || 'light';
    });

    // SuperAdmin's global theme data (fetched once, cached)
    const [globalData, setGlobalData] = useState(() => readCache());

    // ── Initialize SYNCHRONOUSLY from cache — eliminates flash of wrong theme ─
    // resolveThemeSync() reads localStorage without any async calls so the
    // correct theme is applied before the very first React paint.
    const [theme, setTheme] = useState(() => {
        const resolved = resolveThemeSync();
        applyThemeToDom(
            resolved,
            typeof window !== 'undefined' ? (localStorage.getItem('theme-mode') || 'light') : 'light'
        );
        return resolved;
    });

    // ── Fetch SuperAdmin global theme ─────────────────────────────────────────
    // Uses /api/settings/global-theme — accessible to ALL authenticated users
    // (NOT /superadmin/global-theme which requires superadmin role)
    // IMPORTANT: We do NOT short-circuit on cache here.
    // Cache is only used by resolveThemeSync() to prevent the initial flash.
    // The async fetch ALWAYS runs so students/tutors get the latest theme
    // immediately — without waiting for the 5-min cache TTL to expire.
    const fetchGlobalTheme = useCallback(async () => {
        try {
            const res = await api.get('/settings/global-theme');
            if (res.data?.success && res.data?.theme) {
                writeCache(res.data.theme);        // update cache for next page load (flash prevention)
                setGlobalData(res.data.theme);     // update in-memory state → triggers theme re-resolve
            }
        } catch (err) {
            // Fetch failed — fall back to cache so at least something renders
            const cached = readCache();
            if (cached) setGlobalData(cached);
            console.warn('[ThemeProvider] Failed to fetch global theme:', err?.response?.status, err?.message);
        }
    }, []);

    useEffect(() => { fetchGlobalTheme(); }, [fetchGlobalTheme]);

    // ── Resolve theme whenever dependencies change ────────────────────────────
    useEffect(() => {
        const userRole = getUserRole();

        // ── Admin & SuperAdmin: always fixed default, no theming ──────────────
        if (userRole === 'admin' || userRole === 'superadmin') {
            setTheme({ ...FALLBACK.global });
            return;
        }

        const isStudent = userRole === 'student';
        const roleKey   = isStudent ? 'student' : 'tutor';

        let resolved;

        // ── PRIORITY 1: SuperAdmin enforces global ────────────────────────────
        if (globalData?.enforceGlobalTheme) {
            resolved = apiThemeToVars(globalData.globalTheme, 'global');
        }

        // ── PRIORITY 2: User belongs to an institute ──────────────────────────
        else if (institute) {
            if (institute.themeSettings?.useGlobalTheme) {
                // Institute wants global theme — but only if globalData is loaded
                // If globalData is null (fetch failed/pending), fall back to
                // institute's own theme to avoid showing default blue
                const saTheme = isStudent ? globalData?.studentTheme : globalData?.tutorTheme;
                if (saTheme) {
                    resolved = apiThemeToVars(saTheme, roleKey);
                } else {
                    // globalData not yet loaded — use institute's own theme as temp fallback
                    const instTheme = isStudent ? institute.studentTheme : institute.tutorTheme;
                    resolved = apiThemeToVars(instTheme, roleKey);
                }
            } else {
                // Institute uses its own custom theme
                const instTheme = isStudent ? institute.studentTheme : institute.tutorTheme;
                resolved = apiThemeToVars(instTheme, roleKey);
            }
        }

        // ── PRIORITY 3: No institute — use SuperAdmin's role theme ────────────
        else {
            const saTheme = isStudent ? globalData?.studentTheme : globalData?.tutorTheme;
            resolved = apiThemeToVars(saTheme, roleKey);
        }

        // ── Apply dark mode overrides if active ───────────────────────────────
        if (mode === 'dark' && globalData?.enableDarkMode !== false) {
            resolved = { ...resolved, ...DARK_OVERRIDES };
        }

        setTheme(resolved);
    }, [institute, globalData, mode]);

    // ── Apply resolved theme to DOM as CSS custom properties ─────────────────
    useEffect(() => {
        const root = document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(mode);

        // Map our keys → CSS vars
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

        // ── Font size: apply directly to root so all rem/em units scale ───────
        if (theme.fontSize) {
            root.style.fontSize = `${theme.fontSize}px`;
        }

        // ── Font family: apply to body so all text inherits ───────────────────
        if (theme.font) {
            document.body.style.fontFamily = theme.font;
        }

        // Legacy vars for backward compatibility
        root.style.setProperty('--primary-color',   theme.primary);
        root.style.setProperty('--secondary-color', theme.secondary);

    }, [theme, mode]);

    // ── Toggle dark / light ───────────────────────────────────────────────────
    const toggleMode = () => {
        // Respect SuperAdmin's enableDarkMode setting
        if (globalData?.enableDarkMode === false) return;
        const next = mode === 'light' ? 'dark' : 'light';
        setMode(next);
        if (typeof window !== 'undefined') localStorage.setItem('theme-mode', next);
    };

    // ── Force refresh global theme cache (call after SuperAdmin saves) ────────
    const refreshGlobalTheme = () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem(CACHE_KEY);
            localStorage.removeItem('global-theme-settings'); // legacy key
        }
        fetchGlobalTheme();
    };

    const isDarkModeAllowed = globalData?.enableDarkMode !== false;

    const value = {
        theme,
        mode,
        toggleMode,
        setMode,
        refreshGlobalTheme,
        institute,
        isDarkMode:        mode === 'dark',
        isLightMode:       mode === 'light',
        isDarkModeAllowed,           // expose so Header can show/hide toggle
        globalData,
        colors: {
            primary:          theme.primary,
            secondary:        theme.secondary,
            background:       theme.background,
            foreground:       theme.foreground,
            sidebar:          theme.sidebar,
            sidebarForeground:theme.sidebarForeground,
            accent:           theme.accent,
            muted:            theme.muted,
            border:           theme.border,
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