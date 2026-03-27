// ─── Student brand color palette ─────────────────────────────────────────────
// Single source of truth — import this in every student page for consistency.
// When superadmin updates theme, only this file + ThemeContext need to change.

export const B = {
    pageBg:         '#DCD7F6',   // Layout bg (set in StudentLayout)
    btnPrimary:     '#7573E8',   // Primary buttons, links, highlights
    btnPrimaryText: '#ffffff',
    btnViewAllBg:   '#D3D3F1',   // Secondary / ghost button bg
    btnViewAllText: '#171D74',   // Secondary button text
    statLabel:      '#373867',   // Stat card labels
    statValue:      '#1D225E',   // Stat card numbers
    heading:        '#151656',   // Section headings
    text:           '#28285E',   // Body text
    iconBg:         '#6267E9',   // Icon pill background
    iconColor:      '#ffffff',   // Icon color (always white)
    chartLine:      '#5E9D9D',   // Chart lines / score circle
    cardBg:         '#EAE8FA',   // Card / panel background
    cardBorder:     'rgba(98,103,233,0.12)',
    innerBg:        'rgba(220,215,246,0.55)', // Inner rows / hover states
    darkCard:       '#3D3B8E',   // AI card, sidebar panels, dark hero sections
    gradientBtn:    'linear-gradient(135deg, #3D3B8E, #7573E8)', // Gradient buttons
};