import { useState, useEffect } from 'react';
import api from '@/lib/axios';

const INSTITUTE_CACHE_KEY = 'sapience_institute_cache';
const INSTITUTE_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export default function useInstitute() {
    const [institute, setInstitute] = useState(() => {
        // ── Read from cache synchronously on first render ─────────────────────
        // ThemeContext reads this SAME cache key before React's first paint
        // via resolveThemeSync() — this is what eliminates the theme flash.
        if (typeof window === 'undefined') return null;
        try {
            const raw = localStorage.getItem(INSTITUTE_CACHE_KEY);
            if (!raw) return null;
            const { data, ts } = JSON.parse(raw);
            if (Date.now() - ts > INSTITUTE_CACHE_TTL) return null;
            return data;
        } catch { return null; }
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // ── Skip if no token (unauthenticated pages like /login) ──────────────
        const token = typeof window !== 'undefined'
            ? localStorage.getItem('token')
            : null;

        if (!token) {
            setLoading(false);
            return;
        }

        const fetchInstitute = async () => {
            try {
                const response = await api.get('/user-institute/me');
                if (response.data?.success) {
                    const data = response.data.institute;
                    setInstitute(data);
                    // ── Write fresh data to cache ─────────────────────────────
                    // Next page load will read this synchronously → zero flash
                    try {
                        localStorage.setItem(INSTITUTE_CACHE_KEY, JSON.stringify({
                            data,
                            ts: Date.now(),
                        }));
                    } catch {}
                }
            } catch {
                // Silently ignore — not being in an institute is valid
            } finally {
                setLoading(false);
            }
        };

        fetchInstitute();
    }, []);

    return { institute, loading };
}