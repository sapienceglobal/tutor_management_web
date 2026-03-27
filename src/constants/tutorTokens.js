/**
 * tutorTokens.js — Single Source of Truth for Tutor UI
 *
 * ─── HOW IT WORKS ────────────────────────────────────────────────────────────
 *
 *  ThemeContext reads admin settings → sets CSS variables on <html>:
 *    --theme-primary    → tutor primaryColor
 *    --theme-background → tutor secondaryColor
 *    --theme-sidebar    → tutor sidebarColor
 *    --theme-accent     → tutor accentColor
 *    --theme-foreground → derived from sidebar
 *    --theme-font       → font family from admin settings
 *
 *  C maps:
 *    Admin-controlled colors → var(--theme-*)   (auto-update when admin changes)
 *    Design-specific tokens  → hardcoded hex    (not brand colors, just UI decisions)
 *
 *  Same structure as studentTokens.js — only role-specific defaults differ.
 *
 * ─── IMPORTS ─────────────────────────────────────────────────────────────────
 *  import { C, T, S, R, cx, pageStyle } from '@/constants/tutorTokens';
 */

// ─── C — Colors ───────────────────────────────────────────────────────────────
export const C = {

    // ── Admin-controlled — via ThemeContext CSS vars ───────────────────────
    pageBg: '#dfdaf3',   // hardcoded — no CSS var flash on load
    btnPrimary: '#7573E8',   // #7573E8

    darkCard: '#3D3B8E',         // dark hero cards, banner sections
    chartLine: '#5E9D9D',          // chart lines, analytics

    gradientBtn: 'linear-gradient(135deg, #3D3B8E, #7573E8)',

    btnPrimaryText: '#ffffff',
    darkCardText: '#ffffff',
    darkCardMuted: 'rgba(255,255,255,0.50)',

    // ── Design tokens — hardcoded (UI decisions, not brand colors) ─────────

    // Text
    heading: '#151656',
    text: '#28285E',
    statLabel: '#373867',
    statValue: '#1D225E',

    // Surfaces
    cardBg: '#EAE8FA',
    surfaceWhite: '#ffffff',
    innerBg: 'rgba(220,215,246,0.55)',

    // Borders
    cardBorder: 'rgba(98,103,233,0.12)',

    // Icon pills
    iconBg: '#6267E9',
    iconColor: '#ffffff',

    // Secondary button (View All, Previous/Next)
    btnViewAllBg: '#D3D3F1',
    btnViewAllText: '#171D74',

    // Text aliases
    textMuted: 'rgba(40,40,94,0.55)',

    // Semantic — never change
    success: '#10B981',
    successBg: 'rgba(16,185,129,0.08)',
    successBorder: 'rgba(16,185,129,0.20)',
    warning: '#F59E0B',
    warningBg: 'rgba(245,158,11,0.08)',
    warningBorder: 'rgba(245,158,11,0.20)',
    danger: '#F43F5E',
    dangerBg: 'rgba(244,63,94,0.08)',
    dangerBorder: 'rgba(244,63,94,0.20)',
};

// Shared color effects for tutor pages. These mirror the old theme-var mixes
// but are now locked to tutor tokens so admin theme changes do not leak in.
export const FX = {
    primary04: 'color-mix(in srgb, #7573E8 4%, white)',
    primary05: 'color-mix(in srgb, #7573E8 5%, white)',
    primary06: 'color-mix(in srgb, #7573E8 6%, white)',
    primary07: 'color-mix(in srgb, #7573E8 7%, white)',
    primary08: 'color-mix(in srgb, #7573E8 8%, white)',
    primary10: 'color-mix(in srgb, #7573E8 10%, white)',
    primary15White: 'color-mix(in srgb, #7573E8 15%, white)',
    primary12: 'color-mix(in srgb, #7573E8 12%, white)',
    primary15: 'color-mix(in srgb, #7573E8 15%, transparent)',
    primary20: 'color-mix(in srgb, #7573E8 20%, white)',
    primary25: 'color-mix(in srgb, #7573E8 25%, white)',
    primary25Transparent: 'color-mix(in srgb, #7573E8 25%, transparent)',
    primary40: 'color-mix(in srgb, #7573E8 40%, white)',
    primary60Transparent: 'color-mix(in srgb, #7573E8 60%, transparent)',
    inputFocus: {
        borderColor: C.btnPrimary,
        boxShadow: '0 0 0 3px rgba(117,115,232,0.10)',
        outline: 'none',
    },
};

// ─── T — Typography ───────────────────────────────────────────────────────────
export const T = {

    fontFamily: 'var(--theme-font, "DM Sans", sans-serif)',
    fontFamilyMono: "'JetBrains Mono', monospace",

    size: {
        xs: '11px',
        sm: '12px',
        base: '13px',
        md: '14px',
        lg: '16px',
        xl: '18px',
        '2xl': '22px',
        '3xl': '28px',
    },

    weight: {
        regular: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
        black: 900,
    },

    leading: {
        tight: 1.2,
        snug: 1.35,
        normal: 1.5,
        relaxed: 1.65,
    },

    tracking: {
        tight: '-0.01em',
        normal: '0',
        wide: '0.04em',
        wider: '0.08em',
        widest: '0.14em',
    },
};

// ─── S — Shadows ──────────────────────────────────────────────────────────────
export const S = {
    card: '0 2px 12px rgba(98,103,233,0.08)',
    cardHover: '0 4px 20px rgba(98,103,233,0.14)',
    btn: '0 4px 14px rgba(117,115,232,0.30)',
    btnDark: '0 4px 14px rgba(61,59,142,0.35)',
    active: '0 2px 8px rgba(98,103,233,0.20)',
};

// ─── R — Border Radius ────────────────────────────────────────────────────────
export const R = {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    '2xl': '24px',
    full: '9999px',
};

// ─── cx — Style builder helpers ───────────────────────────────────────────────
export const cx = {

    card: (extra = {}) => ({
        backgroundColor: C.cardBg,
        border: `1px solid ${C.cardBorder}`,
        boxShadow: S.card,
        borderRadius: R['2xl'],
        ...extra,
    }),

    surface: (extra = {}) => ({
        backgroundColor: C.surfaceWhite,
        border: `1px solid ${C.cardBorder}`,
        boxShadow: S.card,
        borderRadius: R['2xl'],
        ...extra,
    }),

    inner: (extra = {}) => ({
        backgroundColor: C.innerBg,
        borderRadius: R.lg,
        ...extra,
    }),

    btn: (extra = {}) => ({
        background: C.gradientBtn,
        color: '#ffffff',
        fontFamily: T.fontFamily,
        fontSize: T.size.sm,
        fontWeight: T.weight.black,
        borderRadius: R.xl,
        boxShadow: S.btn,
        cursor: 'pointer',
        ...extra,
    }),

    btnSecondary: (extra = {}) => ({
        backgroundColor: C.btnViewAllBg,
        color: C.btnViewAllText,
        fontFamily: T.fontFamily,
        fontSize: T.size.sm,
        fontWeight: T.weight.bold,
        borderRadius: R.xl,
        border: `1px solid ${C.cardBorder}`,
        cursor: 'pointer',
        ...extra,
    }),

    darkCard: (extra = {}) => ({
        backgroundColor: C.darkCard,
        borderRadius: R['2xl'],
        border: `1px solid ${C.cardBorder}`,
        ...extra,
    }),

    iconPill: (size = 40, bg, extra = {}) => ({
        width: size,
        height: size,
        backgroundColor: bg || C.iconBg,
        borderRadius: R.lg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        ...extra,
    }),

    heading: (extra = {}) => ({
        color: C.heading,
        fontFamily: T.fontFamily,
        fontSize: T.size['2xl'],
        fontWeight: T.weight.black,
        lineHeight: T.leading.tight,
        ...extra,
    }),

    sectionTitle: (extra = {}) => ({
        color: C.heading,
        fontFamily: T.fontFamily,
        fontSize: T.size.lg,
        fontWeight: T.weight.black,
        lineHeight: T.leading.snug,
        ...extra,
    }),

    body: (extra = {}) => ({
        color: C.text,
        fontFamily: T.fontFamily,
        fontSize: T.size.base,
        fontWeight: T.weight.medium,
        lineHeight: T.leading.normal,
        ...extra,
    }),

    caption: (extra = {}) => ({
        color: C.textMuted,
        fontFamily: T.fontFamily,
        fontSize: T.size.xs,
        fontWeight: T.weight.semibold,
        lineHeight: T.leading.normal,
        ...extra,
    }),

    label: (extra = {}) => ({
        color: C.statLabel,
        fontFamily: T.fontFamily,
        fontSize: T.size.xs,
        fontWeight: T.weight.semibold,
        textTransform: 'uppercase',
        letterSpacing: T.tracking.wider,
        lineHeight: T.leading.tight,
        ...extra,
    }),

    statValue: (extra = {}) => ({
        color: C.statValue,
        fontFamily: T.fontFamily,
        fontSize: T.size['3xl'],
        fontWeight: T.weight.black,
        lineHeight: T.leading.tight,
        ...extra,
    }),

    input: (extra = {}) => ({
        backgroundColor: C.surfaceWhite,
        border: `1.5px solid ${C.cardBorder}`,
        borderRadius: R.xl,
        color: C.heading,
        fontFamily: T.fontFamily,
        fontSize: T.size.base,
        fontWeight: T.weight.medium,
        outline: 'none',
        ...extra,
    }),

    inputFocus: {
        borderColor: '#7573E8',
        boxShadow: '0 0 0 3px rgba(117,115,232,0.15)',
        outline: 'none',
    },

    pageActive: (extra = {}) => ({
        background: C.gradientBtn,
        color: '#ffffff',
        fontFamily: T.fontFamily,
        fontWeight: T.weight.black,
        borderRadius: R.lg,
        ...extra,
    }),

    pageInactive: (extra = {}) => ({
        backgroundColor: C.btnViewAllBg,
        color: C.btnViewAllText,
        fontFamily: T.fontFamily,
        fontWeight: T.weight.bold,
        borderRadius: R.lg,
        ...extra,
    }),
};

// ─── pageStyle — apply to every page's outermost div ─────────────────────────
export const pageStyle = {
    fontFamily: T.fontFamily,
    fontSize: T.size.base,
    color: C.text,
};
