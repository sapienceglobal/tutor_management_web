/**
 * studentTokens.js — Single Source of Truth for Student UI
 *
 * ─── HOW IT WORKS ────────────────────────────────────────────────────────────
 *
 *  ThemeContext reads admin settings → sets CSS variables on <html>:
 *    --theme-primary    → #7573E8  (admin's primaryColor)
 *    --theme-background → #DCD7F6  (admin's secondaryColor)
 *    --theme-sidebar    → #3D3B8E  (admin's sidebarColor)
 *    --theme-accent     → #5E9D9D  (admin's accentColor)
 *    --theme-foreground → #151656  (derived from sidebar)
 *    --theme-font       → font family from admin settings
 *
 *  C maps:
 *    Admin-controlled colors → var(--theme-*)   (auto-update when admin changes)
 *    Design-specific tokens  → hardcoded hex    (not brand colors, just UI decisions)
 *
 *  When admin changes primary → btnPrimary, iconBg, gradientBtn all update ✅
 *  When admin changes font    → T.fontFamily updates → all pages update ✅
 *
 *  Design tokens (cardBg #EAE8FA, iconBg #6267E9 etc.) stay fixed unless
 *  you deliberately change them here.
 *
 * ─── IMPORTS ─────────────────────────────────────────────────────────────────
 *  import { C, T, S, R, cx, pageStyle } from '@/constants/studentTokens';
 */

// ─── C — Colors ───────────────────────────────────────────────────────────────
export const C = {

    // ── Admin-controlled — via ThemeContext CSS vars ───────────────────────
    // These update automatically when admin changes theme settings.

    pageBg:      '#dfdaf3',   // hardcoded — no CSS var flash on load
     btnPrimary:  '#7573E8',   //  'var(--theme-primary)',         // #7573E8 default
   
    darkCard:    'var(--theme-sidebar)',         // #3D3B8E default — dark hero cards, AI section
    chartLine:   'var(--theme-accent)',          // #5E9D9D default — chart lines

    gradientBtn: 'linear-gradient(135deg, var(--theme-sidebar), var(--theme-primary))',

    btnPrimaryText: '#ffffff',
    darkCardText:   '#ffffff',
    darkCardMuted:  'rgba(255,255,255,0.50)',

    // ── Design tokens — hardcoded (not brand colors, UI decisions) ─────────
    // To change: edit these values here → all pages update immediately.

    // Text
    heading:    '#151656',   // headings: AI Recommendations, Performance Overview etc.
    text:       '#28285E',   // all body text
    statLabel:  '#373867',   // stat card labels: "Enrolled Courses", "Upcoming Exams"
    statValue:  '#1D225E',   // stat card numbers from backend

    // Surfaces
    cardBg:       '#EAE8FA',  // stat cards, panels, performance card bg
    surfaceWhite: '#ffffff',  // pure white inner surfaces
    innerBg:      'rgba(220,215,246,0.55)', // inner rows, hover bg

    // Borders
    cardBorder: 'rgba(98,103,233,0.12)',

    // Icon pills
    iconBg:    '#6267E9',    // icon pill background
    iconColor: '#ffffff',    // icon always white

    // Secondary button (View All, Previous/Next)
    btnViewAllBg:   '#D3D3F1',  // view all button bg
    btnViewAllText: '#171D74',  // view all button text

    // Text aliases for convenience
    textMuted:   'rgba(40,40,94,0.55)',

    // Semantic — never change these
    success:       '#10B981',
    successBg:     'rgba(16,185,129,0.08)',
    successBorder: 'rgba(16,185,129,0.20)',
    warning:       '#F59E0B',
    warningBg:     'rgba(245,158,11,0.08)',
    warningBorder: 'rgba(245,158,11,0.20)',
    danger:        '#F43F5E',
    dangerBg:      'rgba(244,63,94,0.08)',
    dangerBorder:  'rgba(244,63,94,0.20)',
};

// ─── T — Typography ───────────────────────────────────────────────────────────
export const T = {

    // Admin-controlled via --theme-font CSS var
    fontFamily:     'var(--theme-font, "DM Sans", sans-serif)',
    fontFamilyMono: "'JetBrains Mono', monospace",

    // Fixed design scale — change here → all pages update
    size: {
        xs:   '11px',
        sm:   '12px',
        base: '13px',
        md:   '14px',
        lg:   '16px',
        xl:   '18px',
        '2xl':'22px',
        '3xl':'28px',
    },

    weight: {
        regular:  400,
        medium:   500,
        semibold: 600,
        bold:     700,
        black:    900,
    },

    leading: {
        tight:   1.2,
        snug:    1.35,
        normal:  1.5,
        relaxed: 1.65,
    },

    tracking: {
        tight:  '-0.01em',
        normal: '0',
        wide:   '0.04em',
        wider:  '0.08em',
        widest: '0.14em',
    },
};

// ─── S — Shadows ──────────────────────────────────────────────────────────────
export const S = {
    card:      '0 2px 12px rgba(98,103,233,0.08)',
    cardHover: '0 4px 20px rgba(98,103,233,0.14)',
    btn:       '0 4px 14px rgba(117,115,232,0.30)',
    btnDark:   '0 4px 14px rgba(61,59,142,0.35)',
    active:    '0 2px 8px rgba(98,103,233,0.20)',
};

// ─── R — Border Radius ────────────────────────────────────────────────────────
export const R = {
    sm:   '8px',
    md:   '12px',
    lg:   '16px',
    xl:   '20px',
    '2xl':'24px',
    full: '9999px',
};

// ─── cx — Style builder helpers ───────────────────────────────────────────────
export const cx = {

    // Card container (stat cards, panels)
    card: (extra = {}) => ({
        backgroundColor: C.cardBg,
        border: `1px solid ${C.cardBorder}`,
        boxShadow: S.card,
        borderRadius: R['2xl'],
        ...extra,
    }),

    // White inner surface (inside cards)
    surface: (extra = {}) => ({
        backgroundColor: C.surfaceWhite,
        border: `1px solid ${C.cardBorder}`,
        boxShadow: S.card,
        borderRadius: R['2xl'],
        ...extra,
    }),

    // Inner row / hover area
    inner: (extra = {}) => ({
        backgroundColor: C.innerBg,
        borderRadius: R.lg,
        ...extra,
    }),

    // Primary gradient button (Start AI Study Plan, Attempt, Submit etc.)
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

    // Secondary button (View All, Previous, Next)
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

    // Dark hero card (AI section, banners)
    darkCard: (extra = {}) => ({
        backgroundColor: C.darkCard,
        borderRadius: R['2xl'],
        border: `1px solid ${C.cardBorder}`,
        ...extra,
    }),

    // Icon pill container
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

    // Typography helpers
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
        ...extra,
    }),

    inputFocus: {
        borderColor: 'var(--theme-primary)',
        boxShadow: '0 0 0 3px rgba(117,115,232,0.15)',
        outline: 'none',
    },

    // Pagination
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