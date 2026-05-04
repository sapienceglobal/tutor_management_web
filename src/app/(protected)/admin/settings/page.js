'use client';

import { useState, useEffect } from 'react';
import {
    MdSave, MdHourglassEmpty, MdPublic, MdShield, MdBuild, MdPalette,
    MdSchool, MdPeople, MdCheckCircle, MdAutoAwesome,
    MdRefresh, MdLock, MdMemory, MdCreditCard, MdCalendarMonth
} from 'react-icons/md';
import { toast } from 'react-hot-toast';
import api from '@/lib/axios';
import { C, T, S, R, pageStyle } from '@/constants/studentTokens';

// ─── Constants ──────────────────────────────────────────────────────────────
const FONTS = [
    { value: "Inter, sans-serif", label: "Inter" },
    { value: "'DM Sans', sans-serif", label: "DM Sans" },
    { value: "Poppins, sans-serif", label: "Poppins" },
    { value: "Montserrat, sans-serif", label: "Montserrat" },
    { value: "Roboto, sans-serif", label: "Roboto" },
    { value: "Open Sans, sans-serif", label: "Open Sans" },
    { value: "Lato, sans-serif", label: "Lato" },
    { value: "system-ui, sans-serif", label: "System UI" },
];

const inputStyle = {
    width: '100%',
    padding: '10px 16px',
    backgroundColor: C.surfaceWhite,
    border: `1px solid ${C.cardBorder}`,
    borderRadius: '10px',
    color: C.heading,
    fontFamily: T.fontFamily,
    fontSize: T.size.base,
    fontWeight: T.weight.semibold,
    outline: 'none',
    transition: 'all 0.2s ease',
};

// ─── UI Atoms ───────────────────────────────────────────────────────────────
function Card({ children, className = '', style = {} }) {
    return (
        <div className={className} style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], boxShadow: S.card, border: `1px solid ${C.cardBorder}`, padding: 24, ...style }}>
            {children}
        </div>
    );
}

function SectionHeader({ icon: Icon, color, title, desc }) {
    return (
        <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center shrink-0" style={{ width: 40, height: 40, backgroundColor: C.iconBg, borderRadius: '10px' }}>
                <Icon style={{ width: 16, height: 16, color: C.iconColor }} />
            </div>
            <div>
                <h2 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>{title}</h2>
                {desc && <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.textMuted, margin: '2px 0 0 0' }}>{desc}</p>}
            </div>
        </div>
    );
}

function Toggle({ checked, onChange, label, desc }) {
    return (
        <div className="flex items-center justify-between p-4 transition-colors group cursor-pointer" onClick={onChange} style={{ backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, borderRadius: '12px' }}
             onMouseEnter={e => e.currentTarget.style.backgroundColor = C.innerBg}
             onMouseLeave={e => e.currentTarget.style.backgroundColor = C.surfaceWhite}>
            <div>
                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>{label}</p>
                {desc && <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.medium, color: C.textMuted, margin: '2px 0 0 0' }}>{desc}</p>}
            </div>
            <div className="relative shrink-0 ml-4" style={{ width: 44, height: 24, borderRadius: R.full, backgroundColor: checked ? C.btnPrimary : C.cardBorder, transition: 'background-color 0.2s' }}>
                <div className="absolute top-0.5" style={{ width: 20, height: 20, borderRadius: R.full, backgroundColor: '#ffffff', boxShadow: S.card, transition: 'transform 0.2s', transform: checked ? 'translateX(22px)' : 'translateX(2px)' }} />
            </div>
        </div>
    );
}

// ─── Read-only color swatch ─────────────────────────────────────────────────
function ColorSwatch({ label, value }) {
    return (
        <div>
            <label style={{ display: 'block', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, marginBottom: 6 }}>{label}</label>
            <div className="flex items-center gap-2">
                <div className="shrink-0" style={{ width: 36, height: 36, borderRadius: '10px', backgroundColor: value || '#eee', border: `1px solid ${C.cardBorder}` }} />
                <div className="flex-1 flex items-center select-none" style={{ ...inputStyle, fontFamily: T.fontFamilyMono, fontSize: T.size.sm, color: C.textMuted, backgroundColor: C.innerBg }}>
                    {value || '—'}
                </div>
                <MdLock style={{ width: 14, height: 14, color: C.textMuted, shrink: 0 }} />
            </div>
        </div>
    );
}

// ─── Editable color field ────────────────────────────────────────────────────
function ColorField({ label, name, value, onChange }) {
    return (
        <div>
            <label style={{ display: 'block', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, marginBottom: 6 }}>{label}</label>
            <div className="flex items-center gap-2">
                <input type="color" name={name} value={value || '#000000'} onChange={onChange}
                    className="shrink-0 cursor-pointer p-0.5" style={{ width: 36, height: 36, borderRadius: '10px', backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}` }} />
                <input type="text" name={name} value={value || ''} onChange={onChange} maxLength={7}
                    style={{ ...inputStyle, fontFamily: T.fontFamilyMono, fontSize: T.size.sm, textTransform: 'uppercase' }}
                    onFocus={e => { e.target.style.borderColor = C.btnPrimary; e.target.style.boxShadow = `0 0 0 3px ${C.btnPrimary}15`; }}
                    onBlur={e => { e.target.style.borderColor = C.cardBorder; e.target.style.boxShadow = 'none'; }} />
            </div>
        </div>
    );
}

// ─── Mini Preview ────────────────────────────────────────────────────────────
function ThemePreview({ primary, secondary, sidebar, accent, readonly = false }) {
    return (
        <div className="overflow-hidden mb-4" style={{ borderRadius: '12px', border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
            <div className="flex items-center gap-1.5" style={{ padding: '6px 12px', backgroundColor: C.innerBg, borderBottom: `1px solid ${C.cardBorder}` }}>
                {readonly && <MdLock style={{ width: 10, height: 10, color: C.textMuted }} />}
                <span style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider }}>
                    {readonly ? 'Set by SuperAdmin' : 'Live Preview'}
                </span>
            </div>
            <div className="flex" style={{ height: 56 }}>
                <div className="flex flex-col items-center py-2 gap-1.5 shrink-0" style={{ width: 40, backgroundColor: sidebar || '#1e1b4b' }}>
                    {[0, 1, 2].map(i => (
                        <div key={i} style={{ width: 20, height: 4, borderRadius: R.full, backgroundColor: accent || '#6366f1', opacity: i === 0 ? 1 : 0.3 }} />
                    ))}
                </div>
                <div className="flex-1 flex items-center gap-2" style={{ padding: '8px 12px', backgroundColor: secondary || '#f8fafc' }}>
                    <div className="flex-1 flex flex-col gap-1.5">
                        <div style={{ height: 8, width: 80, borderRadius: R.full, backgroundColor: primary || '#4f46e5', opacity: 0.8 }} />
                        <div style={{ height: 6, width: 48, borderRadius: R.full, backgroundColor: C.cardBorder }} />
                    </div>
                    <div className="flex items-center justify-center shrink-0" style={{ padding: '2px 8px', borderRadius: '6px', backgroundColor: primary || '#4f46e5' }}>
                        <span style={{ fontFamily: T.fontFamily, fontSize: '9px', fontWeight: T.weight.bold, color: '#ffffff' }}>Btn</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Global Theme — Read-only display ───────────────────────────────────────
function GlobalThemePanel({ theme }) {
    if (!theme) return (
        <div className="text-center py-10 flex flex-col items-center gap-2">
            <MdLock style={{ width: 28, height: 28, color: C.cardBorder }} />
            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.textMuted, margin: 0 }}>SuperAdmin hasn't configured a global theme yet.</p>
        </div>
    );
    return (
        <div className="space-y-3">
            <ThemePreview primary={theme.primaryColor} secondary={theme.secondaryColor}
                sidebar={theme.sidebarColor} accent={theme.accentColor} readonly />
            <div className="grid grid-cols-2 gap-3">
                <ColorSwatch label="Primary" value={theme.primaryColor} />
                <ColorSwatch label="Secondary" value={theme.secondaryColor} />
                <ColorSwatch label="Sidebar" value={theme.sidebarColor} />
                <ColorSwatch label="Accent" value={theme.accentColor} />
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label style={{ display: 'block', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, marginBottom: 6 }}>Font</label>
                    <div className="flex items-center justify-between" style={{ ...inputStyle, backgroundColor: C.innerBg, color: C.textMuted }}>
                        <span>{FONTS.find(f => f.value === theme.fontFamily)?.label || theme.fontFamily || '—'}</span>
                        <MdLock style={{ width: 12, height: 12, color: C.textMuted }} />
                    </div>
                </div>
                <div>
                    <label style={{ display: 'block', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, marginBottom: 6 }}>Size</label>
                    <div className="flex items-center justify-between" style={{ ...inputStyle, fontFamily: T.fontFamilyMono, backgroundColor: C.innerBg, color: C.textMuted }}>
                        <span>{theme.fontSize || '—'}px</span>
                        <MdLock style={{ width: 12, height: 12, color: C.textMuted }} />
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Editable Theme Panel (Student / Tutor) ──────────────────────────────────
// ─── Industry-Level LMS Theme Presets ───────────────────────────────────────
const STUDENT_PRESETS = [
    {
        name: 'Ocean Pro',
        desc: 'Calm & focused — best for long study sessions',
        primaryColor: '#2563eb',
        secondaryColor: '#f0f7ff',
        sidebarColor: '#1e3a5f',
        accentColor: '#0ea5e9',
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '14',
        preview: ['#2563eb', '#1e3a5f', '#0ea5e9'],
    },
    {
        name: 'Scholar Violet',
        desc: 'Premium academic feel — trusted by top EdTech platforms',
        primaryColor: '#7c3aed',
        secondaryColor: '#faf5ff',
        sidebarColor: '#2e1065',
        accentColor: '#a855f7',
        fontFamily: 'Poppins, sans-serif',
        fontSize: '14',
        preview: ['#7c3aed', '#2e1065', '#a855f7'],
    },
    {
        name: 'Forest Academy',
        desc: 'Growth-oriented — fresh & motivating for learners',
        primaryColor: '#059669',
        secondaryColor: '#f0fdf4',
        sidebarColor: '#064e3b',
        accentColor: '#34d399',
        fontFamily: 'Inter, sans-serif',
        fontSize: '14',
        preview: ['#059669', '#064e3b', '#34d399'],
    },
    {
        name: 'Midnight Dark',
        desc: 'Modern dark-first — popular with tech & coding courses',
        primaryColor: '#6366f1',
        secondaryColor: '#1e1b4b',
        sidebarColor: '#0f0d1f',
        accentColor: '#818cf8',
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '14',
        preview: ['#6366f1', '#0f0d1f', '#818cf8'],
    },
    {
        name: 'Sunrise Energy',
        desc: 'Warm & energetic — great for competitive exam prep',
        primaryColor: '#f59e0b',
        secondaryColor: '#fffbeb',
        sidebarColor: '#78350f',
        accentColor: '#f97316',
        fontFamily: 'Montserrat, sans-serif',
        fontSize: '15',
        preview: ['#f59e0b', '#78350f', '#f97316'],
    },
    {
        name: 'Rose Premium',
        desc: 'Elegant & modern — top choice for language & arts',
        primaryColor: '#e11d48',
        secondaryColor: '#fff1f2',
        sidebarColor: '#4c0519',
        accentColor: '#fb7185',
        fontFamily: 'Poppins, sans-serif',
        fontSize: '14',
        preview: ['#e11d48', '#4c0519', '#fb7185'],
    },
];

const TUTOR_PRESETS = [
    {
        name: 'Navy Authority',
        desc: 'Authoritative & trustworthy — #1 for instructor panels',
        primaryColor: '#1d4ed8',
        secondaryColor: '#eff6ff',
        sidebarColor: '#1e3a5f',
        accentColor: '#3b82f6',
        fontFamily: 'Inter, sans-serif',
        fontSize: '14',
        preview: ['#1d4ed8', '#1e3a5f', '#3b82f6'],
    },
    {
        name: 'Emerald Expert',
        desc: 'Professional & calm — ideal for science & medical tutors',
        primaryColor: '#047857',
        secondaryColor: '#ecfdf5',
        sidebarColor: '#022c22',
        accentColor: '#10b981',
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '14',
        preview: ['#047857', '#022c22', '#10b981'],
    },
    {
        name: 'Slate Pro',
        desc: 'Ultra-modern minimal — used by premium coaching brands',
        primaryColor: '#334155',
        secondaryColor: '#f8fafc',
        sidebarColor: '#0f172a',
        accentColor: '#64748b',
        fontFamily: 'Poppins, sans-serif',
        fontSize: '14',
        preview: ['#334155', '#0f172a', '#64748b'],
    },
    {
        name: 'Indigo Classic',
        desc: 'Timeless & reliable — inspired by Coursera, Udemy',
        primaryColor: '#4338ca',
        secondaryColor: '#eef2ff',
        sidebarColor: '#1e1b4b',
        accentColor: '#6366f1',
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '14',
        preview: ['#4338ca', '#1e1b4b', '#6366f1'],
    },
    {
        name: 'Crimson Leader',
        desc: 'Bold & confident — management, law & leadership courses',
        primaryColor: '#b91c1c',
        secondaryColor: '#fff5f5',
        sidebarColor: '#450a0a',
        accentColor: '#ef4444',
        fontFamily: 'Montserrat, sans-serif',
        fontSize: '14',
        preview: ['#b91c1c', '#450a0a', '#ef4444'],
    },
    {
        name: 'Teal Innovator',
        desc: 'Creative & fresh — design, tech & startup-style platforms',
        primaryColor: '#0d9488',
        secondaryColor: '#f0fdfa',
        sidebarColor: '#042f2e',
        accentColor: '#2dd4bf',
        fontFamily: 'Inter, sans-serif',
        fontSize: '14',
        preview: ['#0d9488', '#042f2e', '#2dd4bf'],
    },
];

// ─── Preset Picker UI ────────────────────────────────────────────────────────
function PresetPicker({ presets, onApply }) {
    const [hoveredIdx, setHoveredIdx] = useState(null);
    return (
        <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center justify-center shrink-0"
                    style={{ width: 20, height: 20, borderRadius: '6px', background: C.gradientBtn }}>
                    <MdAutoAwesome style={{ width: 12, height: 12, color: '#ffffff' }} />
                </div>
                <span style={{ fontFamily: T.fontFamily, fontSize: '11px', fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider }}>
                    Recommended Presets
                </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
                {presets.map((p, i) => (
                    <button
                        key={p.name}
                        type="button"
                        onClick={() => onApply(p)}
                        onMouseEnter={() => setHoveredIdx(i)}
                        onMouseLeave={() => setHoveredIdx(null)}
                        className="relative group text-left cursor-pointer transition-all duration-200 overflow-hidden"
                        style={{
                            borderRadius: '12px',
                            border: `1px solid ${hoveredIdx === i ? p.primaryColor : C.cardBorder}`,
                            backgroundColor: C.surfaceWhite,
                            boxShadow: hoveredIdx === i ? `0 4px 16px ${p.primaryColor}30` : S.card,
                            transform: hoveredIdx === i ? 'translateY(-1px)' : 'none',
                        }}
                    >
                        {/* Color bar */}
                        <div className="flex w-full" style={{ height: 6 }}>
                            {p.preview.map((c, ci) => (
                                <div key={ci} className="flex-1" style={{ background: c }} />
                            ))}
                        </div>
                        {/* Content */}
                        <div className="p-2.5">
                            <div className="flex items-center justify-between mb-0.5">
                                <span style={{ fontFamily: T.fontFamily, fontSize: '11px', fontWeight: T.weight.bold, color: C.heading, lineHeight: 1.2 }}>
                                    {p.name}
                                </span>
                                <div className="shrink-0 transition-transform group-hover:scale-110"
                                    style={{ width: 16, height: 16, borderRadius: R.full, border: '2px solid #ffffff', background: p.primaryColor, boxShadow: S.card }} />
                            </div>
                            <p className="line-clamp-2" style={{ fontFamily: T.fontFamily, fontSize: '9px', fontWeight: T.weight.medium, color: C.textMuted, lineHeight: 1.2, margin: 0 }}>
                                {p.desc}
                            </p>
                        </div>
                        {/* Apply overlay on hover */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ background: `${p.primaryColor}15` }}>
                            <span style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: '#ffffff', background: p.primaryColor, padding: '4px 8px', borderRadius: '8px' }}>
                                Apply
                            </span>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}

function EditableThemePanel({ prefix, data, onChange }) {
    const get = (key) => data?.[prefix]?.[key] ?? '';
    const handle = (e) =>
        onChange({ target: { name: `${prefix}.${e.target.name}`, value: e.target.value } });

    const presets = prefix === 'studentTheme' ? STUDENT_PRESETS : TUTOR_PRESETS;

    const applyPreset = (preset) => {
        ['primaryColor', 'secondaryColor', 'sidebarColor', 'accentColor', 'fontFamily', 'fontSize']
            .forEach(field => {
                onChange({ target: { name: `${prefix}.${field}`, value: preset[field] } });
            });
    };

    return (
        <div className="space-y-3">
            {/* ── Preset Picker ── */}
            <PresetPicker presets={presets} onApply={applyPreset} />

            {/* ── Divider ── */}
            <div className="flex items-center gap-2">
                <div className="flex-1" style={{ height: 1, backgroundColor: C.cardBorder }} />
                <span style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', letterSpacing: T.tracking.wider }}>or customize manually</span>
                <div className="flex-1" style={{ height: 1, backgroundColor: C.cardBorder }} />
            </div>

            {/* ── Live Preview + Manual Fields ── */}
            <ThemePreview primary={get('primaryColor')} secondary={get('secondaryColor')}
                sidebar={get('sidebarColor')} accent={get('accentColor')} />
            <div className="grid grid-cols-2 gap-3">
                <ColorField label="Primary" name="primaryColor" value={get('primaryColor')} onChange={handle} />
                <ColorField label="Secondary" name="secondaryColor" value={get('secondaryColor')} onChange={handle} />
                <ColorField label="Sidebar" name="sidebarColor" value={get('sidebarColor')} onChange={handle} />
                <ColorField label="Accent" name="accentColor" value={get('accentColor')} onChange={handle} />
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label style={{ display: 'block', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, marginBottom: 6 }}>Font Family</label>
                    <select name="fontFamily" value={get('fontFamily')} onChange={handle}
                        style={{ ...inputStyle, padding: '10px 16px', cursor: 'pointer' }}
                        onFocus={e => { e.target.style.borderColor = C.btnPrimary; e.target.style.boxShadow = `0 0 0 3px ${C.btnPrimary}15`; }}
                        onBlur={e => { e.target.style.borderColor = C.cardBorder; e.target.style.boxShadow = 'none'; }}>
                        {FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                    </select>
                </div>
                <div>
                    <label style={{ display: 'block', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, marginBottom: 6 }}>Font Size (px)</label>
                    <input type="number" name="fontSize" value={get('fontSize')} onChange={handle}
                        min="12" max="20" placeholder="14"
                        style={{ ...inputStyle, fontFamily: T.fontFamilyMono }}
                        onFocus={e => { e.target.style.borderColor = C.btnPrimary; e.target.style.boxShadow = `0 0 0 3px ${C.btnPrimary}15`; }}
                        onBlur={e => { e.target.style.borderColor = C.cardBorder; e.target.style.boxShadow = 'none'; }} />
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function AdminSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('general');

    // SuperAdmin's global theme colors — READ-ONLY reference
    const [globalTheme, setGlobalTheme] = useState(null);
    // SuperAdmin's enforcement flags (allowInstituteBranding, enforceGlobalTheme, enableDarkMode)
    const [globalMeta, setGlobalMeta] = useState({
        allowInstituteBranding: true,
        enforceGlobalTheme: false,
        enableDarkMode: true,
    });

    const [instituteData, setInstituteData] = useState({
        name: '',
        contactEmail: '',
        logo: '',
        allowGlobalPublishingByInstituteTutors: false,
        useGlobalTheme: false,
        studentTheme: {
            primaryColor: '#4338ca',
            secondaryColor: '#f8fafc',
            accentColor: '#6366f1',
            sidebarColor: '#1e1b4b',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '14',
        },
        tutorTheme: {
            primaryColor: '#f97316',
            secondaryColor: '#fff7ed',
            accentColor: '#fb923c',
            sidebarColor: '#0f172a',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '14',
        },
    });

    const [settings, setSettings] = useState({
        allowRegistration: true,
        defaultLanguage: 'English',
        autoApproveCourses: false,
        autoApproveTutors: false,
        allowGuestBrowsing: true,
        platformCommission: 10,
        supportPhone: '',
    });

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        try {
            const [settingsRes, instituteRes, globalRes] = await Promise.all([
                api.get('/admin/settings'),
                api.get('/user-institute/me'),
                api.get('/settings/global-theme').catch(() => ({ data: null })),
            ]);

            if (settingsRes.data?.success) setSettings(settingsRes.data.settings);

            const gt = globalRes.data?.theme || null;
            if (gt) {
                setGlobalTheme(gt.globalTheme || null);
                setGlobalMeta({
                    allowInstituteBranding: gt.allowInstituteBranding !== false,
                    enforceGlobalTheme: gt.enforceGlobalTheme || false,
                    enableDarkMode: gt.enableDarkMode !== false,
                });
            }

            if (instituteRes.data?.success && instituteRes.data.institute) {
                const inst = instituteRes.data.institute;
                setInstituteData(prev => ({
                    ...prev,
                    name: inst.name || '',
                    contactEmail: inst.contactEmail || '',
                    logo: inst.logo || '',
                    useGlobalTheme: inst.themeSettings?.useGlobalTheme ?? false,
                    allowGlobalPublishingByInstituteTutors: Boolean(
                        inst.features?.allowGlobalPublishingByInstituteTutors
                    ),
                    studentTheme: inst.studentTheme || prev.studentTheme,
                    tutorTheme: inst.tutorTheme || prev.tutorTheme,
                }));
            }
        } catch {
            toast.error('Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSettingsChange = (e) => {
        const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setSettings(prev => ({ ...prev, [e.target.name]: val }));
    };

    const handleInstituteChange = (e) => {
        const { name, value, type, checked } = e.target;
        const val = type === 'checkbox' ? checked : value;
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setInstituteData(prev => ({ ...prev, [parent]: { ...prev[parent], [child]: val } }));
        } else {
            setInstituteData(prev => ({ ...prev, [name]: val }));
        }
    };

    const handleUseGlobalToggle = (checked) => {
        if (globalMeta.enforceGlobalTheme && !checked) return;
        setInstituteData(prev => ({
            ...prev,
            useGlobalTheme: checked,
            ...(checked && globalTheme ? {
                studentTheme: { ...globalTheme },
                tutorTheme: { ...globalTheme },
            } : {}),
        }));
    };

    const syncRoleToGlobal = (role) => {
        if (!globalTheme) { toast.error('Global theme not set by SuperAdmin yet'); return; }
        setInstituteData(prev => ({ ...prev, [role]: { ...globalTheme } }));
        toast.success(`${role === 'studentTheme' ? 'Student' : 'Tutor'} theme synced to global!`);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await Promise.all([
                api.put('/admin/settings', settings),
                api.put('/user-institute/me', {
                    name: instituteData.name,
                    contactEmail: instituteData.contactEmail,
                    logo: instituteData.logo,
                    allowGlobalPublishingByInstituteTutors: instituteData.allowGlobalPublishingByInstituteTutors,
                    themeSettings: { useGlobalTheme: instituteData.useGlobalTheme },
                    studentTheme: instituteData.studentTheme,
                    tutorTheme: instituteData.tutorTheme,
                }),
            ]);
            localStorage.removeItem('sapience_institute_cache');
            toast.success('Settings saved successfully!');
        } catch {
            toast.error('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const tabs = [
        { key: 'general', label: 'General', icon: MdPublic },
        { key: 'theme', label: 'Theme & Branding', icon: MdPalette },
        { key: 'system', label: 'System', icon: MdBuild },
        { key: 'financial', label: 'Financial', icon: MdShield },
    ];

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: C.pageBg }}>
            <div className="flex flex-col items-center gap-3">
                <div className="relative w-12 h-12">
                    <div className="w-12 h-12 rounded-full border-[3px] animate-spin"
                        style={{ borderColor: `${C.btnPrimary}30`, borderTopColor: C.btnPrimary }} />
                </div>
            </div>
        </div>
    );

    return (
        <div className="w-full mx-auto space-y-6 min-h-screen" style={{ ...pageStyle, backgroundColor: C.pageBg, paddingBottom: 100 }}>

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>Platform Settings</h1>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.textMuted, margin: '4px 0 0 0' }}>Configure your institute's preferences</p>
                </div>
                <button onClick={handleSave} disabled={saving}
                    className="flex items-center gap-2 transition-opacity cursor-pointer border-none disabled:opacity-60"
                    style={{ padding: '12px 24px', backgroundColor: C.btnPrimary, color: '#ffffff', borderRadius: '10px', fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, boxShadow: S.btn }}>
                    {saving ? <MdHourglassEmpty className="w-4 h-4 animate-spin" /> : <MdSave className="w-4 h-4" />}
                    Save Changes
                </button>
            </div>

            {/* Tabs */}
            <div className="flex p-1 w-fit overflow-x-auto" style={{ backgroundColor: C.innerBg, border: `1px solid ${C.cardBorder}`, borderRadius: '12px' }}>
                {tabs.map(t => (
                    <button key={t.key} onClick={() => setActiveTab(t.key)}
                        className="flex items-center gap-2 transition-all cursor-pointer border-none whitespace-nowrap"
                        style={{
                            padding: '8px 20px',
                            borderRadius: '10px',
                            fontFamily: T.fontFamily,
                            fontSize: T.size.base,
                            fontWeight: T.weight.bold,
                            backgroundColor: activeTab === t.key ? C.surfaceWhite : 'transparent',
                            color: activeTab === t.key ? C.heading : C.textMuted,
                            boxShadow: activeTab === t.key ? S.active : 'none'
                        }}>
                        <t.icon style={{ width: 16, height: 16 }} />
                        <span className="hidden sm:inline">{t.label}</span>
                    </button>
                ))}
            </div>

            {/* ── GENERAL ──────────────────────────────────────────────────── */}
            {activeTab === 'general' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <SectionHeader icon={MdPublic} title="Institute Information" desc="Basic info about your institute" />
                        <div className="space-y-4">
                            {[
                                { label: 'Institute Name', name: 'name', type: 'text' },
                                { label: 'Contact Email', name: 'contactEmail', type: 'email' },
                                { label: 'Logo URL', name: 'logo', type: 'url', placeholder: 'https://…' },
                            ].map(f => (
                                <div key={f.name}>
                                    <label style={{ display: 'block', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, marginBottom: 6 }}>{f.label}</label>
                                    <input type={f.type} name={f.name} value={instituteData[f.name] || ''}
                                        onChange={handleInstituteChange} placeholder={f.placeholder || ''}
                                        style={inputStyle}
                                        onFocus={e => { e.target.style.borderColor = C.btnPrimary; e.target.style.boxShadow = `0 0 0 3px ${C.btnPrimary}15`; }}
                                        onBlur={e => { e.target.style.borderColor = C.cardBorder; e.target.style.boxShadow = 'none'; }} />
                                </div>
                            ))}
                            {instituteData.logo && (
                                <div className="flex justify-center items-center" style={{ padding: 12, backgroundColor: C.innerBg, border: `1px solid ${C.cardBorder}`, borderRadius: '10px' }}>
                                    <img src={instituteData.logo} alt="Logo" style={{ height: 40, objectFit: 'contain' }} />
                                </div>
                            )}
                        </div>
                    </Card>

                    <Card>
                        <SectionHeader icon={MdPublic} title="Platform Preferences" desc="Language and publishing" />
                        <div className="space-y-4">
                            <div>
                                <label style={{ display: 'block', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, marginBottom: 6 }}>Default Language</label>
                                <select name="defaultLanguage" value={settings.defaultLanguage} onChange={handleSettingsChange}
                                    style={{ ...inputStyle, cursor: 'pointer' }}
                                    onFocus={e => { e.target.style.borderColor = C.btnPrimary; e.target.style.boxShadow = `0 0 0 3px ${C.btnPrimary}15`; }}
                                    onBlur={e => { e.target.style.borderColor = C.cardBorder; e.target.style.boxShadow = 'none'; }}>
                                    {['English', 'Hindi', 'Spanish', 'French'].map(l => <option key={l}>{l}</option>)}
                                </select>
                            </div>
                            <Toggle
                                checked={instituteData.allowGlobalPublishingByInstituteTutors}
                                onChange={() => handleInstituteChange({
                                    target: {
                                        name: 'allowGlobalPublishingByInstituteTutors', type: 'checkbox',
                                        checked: !instituteData.allowGlobalPublishingByInstituteTutors
                                    }
                                })}
                                label="Global Publishing by Tutors"
                                desc="Institute tutors can publish global content" />
                        </div>
                    </Card>
                </div>
            )}

            {/* ── THEME ────────────────────────────────────────────────────── */}
            {activeTab === 'theme' && (
                <div className="space-y-6">

                    {/* ── SuperAdmin enforcement banners ──────────────────── */}
                    {globalMeta.enforceGlobalTheme && (
                        <div className="flex items-start gap-3 p-4" style={{ backgroundColor: C.dangerBg, border: `1px solid ${C.dangerBorder}`, borderRadius: '12px' }}>
                            <MdLock style={{ width: 16, height: 16, color: C.danger, shrink: 0, marginTop: 2 }} />
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.danger, lineHeight: 1.5, margin: 0 }}>
                                <span style={{ fontWeight: T.weight.bold }}>SuperAdmin has enforced Global Theme</span> — all institute customization is disabled. Contact SuperAdmin to change.
                            </p>
                        </div>
                    )}
                    {!globalMeta.enforceGlobalTheme && !globalMeta.allowInstituteBranding && (
                        <div className="flex items-start gap-3 p-4" style={{ backgroundColor: C.warningBg, border: `1px solid ${C.warningBorder}`, borderRadius: '12px' }}>
                            <MdLock style={{ width: 16, height: 16, color: C.warning, shrink: 0, marginTop: 2 }} />
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.warning, lineHeight: 1.5, margin: 0 }}>
                                <span style={{ fontWeight: T.weight.bold }}>Custom Branding is disabled by SuperAdmin</span> — you cannot customize themes. Contact SuperAdmin to enable.
                            </p>
                        </div>
                    )}
                    {!globalMeta.enforceGlobalTheme && globalMeta.allowInstituteBranding && (
                        <div className="flex items-start gap-3 p-4" style={{ backgroundColor: C.warningBg, border: `1px solid ${C.warningBorder}`, borderRadius: '12px' }}>
                            <MdLock style={{ width: 16, height: 16, color: C.warning, shrink: 0, marginTop: 2 }} />
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.warning, lineHeight: 1.5, margin: 0 }}>
                                <span style={{ fontWeight: T.weight.bold }}>Global Theme is controlled by SuperAdmin</span> — shown for reference only.
                                Customize <span style={{ fontWeight: T.weight.bold }}>Student</span> and <span style={{ fontWeight: T.weight.bold }}>Tutor</span> panels independently,
                                or enable the toggle below to inherit the global theme.
                            </p>
                        </div>
                    )}

                    {/* Use Global Theme toggle */}
                    <Card>
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center shrink-0" style={{ width: 40, height: 40, borderRadius: '10px', background: C.gradientBtn }}>
                                    <MdAutoAwesome style={{ width: 20, height: 20, color: '#ffffff' }} />
                                </div>
                                <div>
                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>Use Global Theme for All Roles</p>
                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.medium, color: C.textMuted, margin: '2px 0 0 0' }}>
                                        Student &amp; Tutor panels will inherit SuperAdmin's global theme automatically
                                        {globalMeta.enforceGlobalTheme && <span style={{ marginLeft: 4, color: C.danger, fontWeight: T.weight.bold }}>(Enforced by SuperAdmin)</span>}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                disabled={globalMeta.enforceGlobalTheme || !globalMeta.allowInstituteBranding}
                                onClick={() => handleUseGlobalToggle(!instituteData.useGlobalTheme)}
                                className="relative shrink-0 border-none transition-colors"
                                style={{
                                    width: 44, height: 24, borderRadius: R.full,
                                    cursor: (globalMeta.enforceGlobalTheme || !globalMeta.allowInstituteBranding) ? 'not-allowed' : 'pointer',
                                    opacity: (globalMeta.enforceGlobalTheme || !globalMeta.allowInstituteBranding) ? 0.6 : 1,
                                    backgroundColor: (instituteData.useGlobalTheme || globalMeta.enforceGlobalTheme) ? C.btnPrimary : C.cardBorder
                                }}>
                                <div className="absolute top-0.5 transition-transform"
                                    style={{
                                        width: 20, height: 20, borderRadius: R.full, backgroundColor: '#ffffff', boxShadow: S.card,
                                        transform: (instituteData.useGlobalTheme || globalMeta.enforceGlobalTheme) ? 'translateX(22px)' : 'translateX(2px)'
                                    }} />
                            </button>
                        </div>
                        {(instituteData.useGlobalTheme || globalMeta.enforceGlobalTheme) && (
                            <div className="mt-4 flex items-center gap-2 p-3" style={{ backgroundColor: C.btnViewAllBg, border: `1px solid ${C.cardBorder}`, borderRadius: '10px' }}>
                                <MdCheckCircle style={{ width: 16, height: 16, color: C.btnPrimary, shrink: 0 }} />
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.btnPrimary, margin: 0 }}>
                                    Both Student &amp; Tutor panels are using SuperAdmin's global theme. Custom editing is disabled.
                                </p>
                            </div>
                        )}
                    </Card>

                    {/* 3 columns: Global (locked) | Student | Tutor */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* ── Global — READ ONLY ── */}
                        <Card style={{ backgroundColor: C.innerBg, borderStyle: 'dashed' }}>
                            <div className="flex items-center gap-2.5 mb-5">
                                <div className="flex items-center justify-center shrink-0" style={{ width: 36, height: 36, borderRadius: '10px', backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}` }}>
                                    <MdPublic style={{ width: 16, height: 16, color: C.textMuted }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>Global Theme</p>
                                    <p style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.medium, color: C.textMuted, margin: 0 }}>SuperAdmin · Read-only</p>
                                </div>
                                <span className="flex items-center gap-1 shrink-0" style={{ padding: '2px 8px', borderRadius: R.full, backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted }}>
                                    <MdLock style={{ width: 10, height: 10 }} /> Locked
                                </span>
                            </div>
                            <GlobalThemePanel theme={globalTheme} />
                        </Card>

                        {/* ── Student — locked if enforced OR branding disabled ── */}
                        <Card style={{ opacity: (instituteData.useGlobalTheme || globalMeta.enforceGlobalTheme || !globalMeta.allowInstituteBranding) ? 0.5 : 1, pointerEvents: (instituteData.useGlobalTheme || globalMeta.enforceGlobalTheme || !globalMeta.allowInstituteBranding) ? 'none' : 'auto', userSelect: (instituteData.useGlobalTheme || globalMeta.enforceGlobalTheme || !globalMeta.allowInstituteBranding) ? 'none' : 'auto' }}>
                            <div className="flex items-center gap-2.5 mb-5">
                                <div className="flex items-center justify-center shrink-0" style={{ width: 36, height: 36, borderRadius: '10px', backgroundColor: C.btnViewAllBg }}>
                                    <MdSchool style={{ width: 16, height: 16, color: C.btnPrimary }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>Student Theme</p>
                                    <p style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.medium, color: C.textMuted, margin: 0 }}>Student panel only</p>
                                </div>
                                {globalTheme && !instituteData.useGlobalTheme && globalMeta.allowInstituteBranding && !globalMeta.enforceGlobalTheme && (
                                    <button type="button" onClick={() => syncRoleToGlobal('studentTheme')}
                                        className="flex items-center gap-1 transition-colors cursor-pointer border-none shrink-0"
                                        style={{ padding: '4px 8px', borderRadius: '8px', backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted }}
                                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.btnViewAllBg; e.currentTarget.style.color = C.btnPrimary; }}
                                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = C.surfaceWhite; e.currentTarget.style.color = C.textMuted; }}>
                                        <MdRefresh style={{ width: 12, height: 12 }} /> Sync Global
                                    </button>
                                )}
                            </div>
                            <EditableThemePanel prefix="studentTheme" data={instituteData} onChange={handleInstituteChange} />
                        </Card>

                        {/* ── Tutor — locked if enforced OR branding disabled ── */}
                        <Card style={{ opacity: (instituteData.useGlobalTheme || globalMeta.enforceGlobalTheme || !globalMeta.allowInstituteBranding) ? 0.5 : 1, pointerEvents: (instituteData.useGlobalTheme || globalMeta.enforceGlobalTheme || !globalMeta.allowInstituteBranding) ? 'none' : 'auto', userSelect: (instituteData.useGlobalTheme || globalMeta.enforceGlobalTheme || !globalMeta.allowInstituteBranding) ? 'none' : 'auto' }}>
                            <div className="flex items-center gap-2.5 mb-5">
                                <div className="flex items-center justify-center shrink-0" style={{ width: 36, height: 36, borderRadius: '10px', backgroundColor: C.warningBg }}>
                                    <MdPeople style={{ width: 16, height: 16, color: C.warning }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>Tutor Theme</p>
                                    <p style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.medium, color: C.textMuted, margin: 0 }}>Tutor panel only</p>
                                </div>
                                {globalTheme && !instituteData.useGlobalTheme && globalMeta.allowInstituteBranding && !globalMeta.enforceGlobalTheme && (
                                    <button type="button" onClick={() => syncRoleToGlobal('tutorTheme')}
                                        className="flex items-center gap-1 transition-colors cursor-pointer border-none shrink-0"
                                        style={{ padding: '4px 8px', borderRadius: '8px', backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted }}
                                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.warningBg; e.currentTarget.style.color = C.warning; }}
                                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = C.surfaceWhite; e.currentTarget.style.color = C.textMuted; }}>
                                        <MdRefresh style={{ width: 12, height: 12 }} /> Sync Global
                                    </button>
                                )}
                            </div>
                            <EditableThemePanel prefix="tutorTheme" data={instituteData} onChange={handleInstituteChange} />
                        </Card>
                    </div>
                </div>
            )}

            {/* ── SYSTEM ───────────────────────────────────────────────────── */}
            {activeTab === 'system' && (
                <Card>
                    <SectionHeader icon={MdBuild} title="System Controls" desc="Platform-level access and feature toggles" />
                    <div className="grid sm:grid-cols-2 gap-4">
                        {[
                            { name: 'allowRegistration', label: 'Allow Registration', desc: 'Enable new user signups' },
                            { name: 'autoApproveCourses', label: 'Auto-Approve Courses', desc: 'Publish tutor courses without review' },
                            { name: 'autoApproveTutors', label: 'Auto-Approve Tutors', desc: 'Approve tutor profiles automatically' },
                            { name: 'allowGuestBrowsing', label: 'Allow Guest Browsing', desc: 'Public users can browse published courses' },
                        ].map(t => (
                            <Toggle key={t.name}
                                checked={settings[t.name] || false}
                                onChange={() => handleSettingsChange({
                                    target: { name: t.name, type: 'checkbox', checked: !settings[t.name] }
                                })}
                                label={t.label} desc={t.desc} />
                        ))}
                    </div>
                </Card>
            )}

            {/* ── FINANCIAL ────────────────────────────────────────────────── */}
            {activeTab === 'financial' && (
                <Card>
                    <SectionHeader icon={MdShield} title="Financial & Security" desc="Revenue sharing and billing" />
                    <div className="max-w-xs space-y-5">
                        <div>
                            <label style={{ display: 'block', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, marginBottom: 4 }}>Platform Commission (%)</label>
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.medium, color: C.textMuted, margin: '0 0 8px 0' }}>Percentage cut from tutor/institute sales</p>
                            <input type="number" name="platformCommission" value={settings.platformCommission}
                                onChange={handleSettingsChange} min="0" max="100"
                                style={{ ...inputStyle, fontFamily: T.fontFamilyMono }}
                                onFocus={e => { e.target.style.borderColor = C.btnPrimary; e.target.style.boxShadow = `0 0 0 3px ${C.btnPrimary}15`; }}
                                onBlur={e => { e.target.style.borderColor = C.cardBorder; e.target.style.boxShadow = 'none'; }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, marginBottom: 4 }}>Support Phone</label>
                            <input type="tel" name="supportPhone" value={settings.supportPhone || ''}
                                onChange={handleSettingsChange} placeholder="+91 98765 43210"
                                style={inputStyle}
                                onFocus={e => { e.target.style.borderColor = C.btnPrimary; e.target.style.boxShadow = `0 0 0 3px ${C.btnPrimary}15`; }}
                                onBlur={e => { e.target.style.borderColor = C.cardBorder; e.target.style.boxShadow = 'none'; }} />
                        </div>
                    </div>
                </Card>
            )}

        </div>
       
    );
}