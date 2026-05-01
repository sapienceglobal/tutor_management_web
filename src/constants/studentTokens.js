/**
 * studentTokens.js — Single Source of Truth for ALL Student UI
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
 *  ─── INDUSTRY RULE ───────────────────────────────────────────────────────────
 *  NEVER hardcode colors, font sizes, border radii, or shadows in page files.
 *  ALWAYS import { C, T, S, R, cx, pageStyle } from '@/constants/studentTokens'
 *  and use these tokens. This file is the ONE place to change anything visual.
 *
 * ─── IMPORTS ─────────────────────────────────────────────────────────────────
 *  import { C, T, S, R, cx, pageStyle } from '@/constants/studentTokens';
 */

// ─── C — Colors ───────────────────────────────────────────────────────────────
export const C = {

    // ── Admin-controlled — via ThemeContext CSS vars ───────────────────────
    btnPrimary:  '#7573E8',              // 'var(--theme-primary)' — hardcoded to avoid flash
    darkCard:    'var(--theme-sidebar)', // #3D3B8E default — dark hero cards, AI section
    chartLine:   'var(--theme-accent)',  // #5E9D9D default — chart lines, progress bars

    gradientBtn:   'rgb(79, 70, 229)',
    btnPrimaryText: '#ffffff',
    darkCardText:   '#ffffff',
    darkCardMuted:  'rgba(255,255,255,0.50)',

    // ── Page Backgrounds ───────────────────────────────────────────────────
    // Change ONE value here → every page that uses C.pageBg / C.outerCard etc. updates.
    pageBg:     '#f2eeff',   // overall page canvas (layout.js background)
    pageBgAlt:  '#dfdaf3',   // deeper purple-tinted pages (exams, live-classes, assignments)

    // ── Surface / Card Backgrounds ─────────────────────────────────────────
    // These three are the "layer cake" of the student panel design:
    //   outerCard sits on pageBg/pageBgAlt
    //   innerBox   sits inside outerCard
    //   surfaceWhite is pure white for inputs, selected rows, etc.
    cardBg:       'white',   // primary white card background (dashboard stat cards)
    outerCard:    '#ffffff',   // off-white lavender card (exams header, form sections)
    innerBox:     '#ffffff',   // deeper lavender inner surfaces (table headers, form inner)
    surfaceWhite: '#ffffff',   // pure white (inputs, active state rows)
    innerBg:      '#f5f5f5', // translucent lavender (hover rows, progress tracks)

    // ── Borders ───────────────────────────────────────────────────────────
    cardBorder: 'rgba(98,103,233,0.12)',

    // ── Text ──────────────────────────────────────────────────────────────
    heading:    '#151656',   // main headings (H1, H2, section titles)
    headingDark:'#1E1B4B',   // alternate dark heading (used in exam cards, labels on white)
    text:       '#28285E',   // body text
    textSlate:  '#475569',   // neutral slate (stat card labels — professional, not purple)
    textMuted:  'rgba(40,40,94,0.55)', // muted body text
    textFaint:  '#94A3B8',   // very muted / placeholder (Tailwind slate-400)

    statLabel:  '#373867',   // stat card labels: "Enrolled Courses", "Upcoming Exams"
    statValue:  '#1D225E',   // stat card big numbers

    // ── Icon Pills ────────────────────────────────────────────────────────
    iconBg:    '#6267E9',    // default icon pill background
    iconColor: '#ffffff',    // icon always white inside pill

    // ── Secondary Button (View All, Previous/Next) ────────────────────────
    btnViewAllBg:   '#f8f8f8',
    btnViewAllText: '#171D74',

    // ── Semantic Colors — do NOT change ───────────────────────────────────
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

    fontFamily:     'var(--font-nunito), sans-serif', // admin-controlled via CSS var
    fontFamilyMono: "'JetBrains Mono', monospace",

    // Type scale — change here → every page updates immediately
    size: {
        xs:    '11px',  // badges, tags, fine print
        sm:    '12px',  // secondary labels, buttons, inputs
        base:  '13px',  // body text default
        md:    '14px',  // primary labels, card sub-text
        lg:    '16px',  // card titles, section sub-headings
        xl:    '18px',  // section headings (SectionHeader)
        '2xl': '22px',  // page sub-headings, quick stat values
        stat:  '26px',  // StatCard big number (dashboard + all pages)
        '3xl': '28px',  // hero numbers (score, rank)
        '4xl': '36px',  // very large display numbers
    },

    weight: {
        regular:  400,
        medium:   500,
        semibold: 600,
        bold:     700,
        black:    900,  // used for all major numbers and headings
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
        wider:  '0.08em',  // used for uppercase labels
        widest: '0.14em',
    },
};

// ─── S — Shadows ──────────────────────────────────────────────────────────────
export const S = {
    card:       'rgba(149,157,165,0.18) 0px 8px 24px',    // standard card shadow
    cardHover:  'rgba(149,157,165,0.28) 0px 12px 32px',   // elevated on hover
    statHover:  '0 8px 20px rgba(0,0,0,0.06)',            // StatCard white card hover
    aiHover:    '0 8px 30px rgba(99,102,241,0.30)',        // AI StatCard hover
    btn:        '0 4px 14px rgba(117,115,232,0.30)',       // primary gradient button
    btnDark:    '0 4px 14px rgba(61,59,142,0.35)',         // dark button
    active:     '0 2px 8px rgba(98,103,233,0.20)',         // active/selected state
    aiBtn:      '0 4px 14px rgba(79,70,229,0.40)',         // AI "Start Plan" button
};

// ─── R — Border Radius ────────────────────────────────────────────────────────
export const R = {
    sm:   '8px',    // small tags, pills
    md:   '12px',   // filter tabs, small cards
    lg:   '16px',   // input fields, icon pills
    xl:   '20px',   // standard card radius (StatCard)
    '2xl':'10px',   // large cards, panels
    '3xl':'32px',   // hero cards, course cards
    full: '9999px', // fully rounded (badges, avatars)
};

// ─── cx — Pre-built style objects (copy-paste ready) ─────────────────────────
// Usage: style={cx.card()} or style={cx.card({ padding: '20px' })}
export const cx = {

    // Card container — white background stat cards, panels
    card: (extra = {}) => ({
        backgroundColor: C.cardBg,
        border: `1px solid ${C.cardBorder}`,
        boxShadow: S.card,
        borderRadius: R['2xl'],
        ...extra,
    }),

    // Outer card — lavender tinted section containers (#EAE8FA)
    outerCard: (extra = {}) => ({
        backgroundColor: C.outerCard,
        border: `1px solid ${C.cardBorder}`,
        boxShadow: S.card,
        borderRadius: R['2xl'],
        ...extra,
    }),

    // Inner box — deeper lavender inner surfaces (#E3DFF8)
    innerBox: (extra = {}) => ({
        backgroundColor: C.innerBox,
        borderRadius: R.lg,
        ...extra,
    }),

    // White inner surface (inputs, selected rows)
    surface: (extra = {}) => ({
        backgroundColor: C.surfaceWhite,
        border: `1px solid ${C.cardBorder}`,
        boxShadow: S.card,
        borderRadius: R['2xl'],
        ...extra,
    }),

    // Inner row / translucent hover area
    inner: (extra = {}) => ({
        backgroundColor: C.innerBg,
        borderRadius: R.lg,
        ...extra,
    }),

    // Primary gradient button
    btn: (extra = {}) => ({
        background: C.gradientBtn,
        color: '#ffffff',
        fontFamily: T.fontFamily,
        fontSize: T.size.sm,
        fontWeight: T.weight.black,
        borderRadius: R.xl,
        boxShadow: S.btn,
        border: 'none',
        cursor: 'pointer',
        ...extra,
    }),

    // Secondary button (View All, Prev, Next)
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

    // ── Typography helpers ────────────────────────────────────────────────

    // Page H1
    heading: (extra = {}) => ({
        color: C.heading,
        fontFamily: T.fontFamily,
        fontSize: T.size['2xl'],
        fontWeight: T.weight.black,
        lineHeight: T.leading.tight,
        ...extra,
    }),

    // Section H2 / card title
    sectionTitle: (extra = {}) => ({
        color: C.heading,
        fontFamily: T.fontFamily,
        fontSize: T.size.lg,
        fontWeight: T.weight.black,
        lineHeight: T.leading.snug,
        ...extra,
    }),

    // Standard body text
    body: (extra = {}) => ({
        color: C.text,
        fontFamily: T.fontFamily,
        fontSize: T.size.base,
        fontWeight: T.weight.medium,
        lineHeight: T.leading.normal,
        ...extra,
    }),

    // Muted caption text
    caption: (extra = {}) => ({
        color: C.textMuted,
        fontFamily: T.fontFamily,
        fontSize: T.size.xs,
        fontWeight: T.weight.semibold,
        lineHeight: T.leading.normal,
        ...extra,
    }),

    // UPPERCASE badge/label text (stat card labels, table headers)
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

    // StatCard value number (big number on top of label)
    statValue: (extra = {}) => ({
        color: C.headingDark,
        fontFamily: T.fontFamily,
        fontSize: T.size.stat,
        fontWeight: T.weight.black,
        lineHeight: T.leading.tight,
        ...extra,
    }),

    // Input / select field
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

    // Input focus ring (apply inline on onFocus)
    inputFocus: {
        borderColor: '#7573E8',
        boxShadow: '0 0 0 3px rgba(117,115,232,0.15)',
        outline: 'none',
    },

    // Pagination active button
    pageActive: (extra = {}) => ({
        background: C.gradientBtn,
        color: '#ffffff',
        fontFamily: T.fontFamily,
        fontWeight: T.weight.black,
        borderRadius: R.lg,
        border: 'none',
        cursor: 'pointer',
        ...extra,
    }),

    // Pagination inactive button
    pageInactive: (extra = {}) => ({
        backgroundColor: C.btnViewAllBg,
        color: C.btnViewAllText,
        fontFamily: T.fontFamily,
        fontWeight: T.weight.bold,
        borderRadius: R.lg,
        border: `1px solid ${C.cardBorder}`,
        cursor: 'pointer',
        ...extra,
    }),
};

// ─── pageStyle — apply to every page's outermost div ─────────────────────────
// Usage: <div style={{ ...pageStyle, backgroundColor: C.pageBgAlt }}>
export const pageStyle = {
    fontFamily: T.fontFamily,
    fontSize: T.size.base,
    color: C.text,
};