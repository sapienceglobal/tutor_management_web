'use client';

import { useState, useEffect } from 'react';
import {
    Save, Loader2, Globe, Shield, Wrench, Palette,
    GraduationCap, Users, CheckCircle, Sparkles,
    RefreshCw, Lock
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '@/lib/axios';

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

// ─── UI Atoms ───────────────────────────────────────────────────────────────
function Card({ children, className = '' }) {
    return (
        <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm p-6 ${className}`}>
            {children}
        </div>
    );
}

function SectionHeader({ icon: Icon, color, title, desc }) {
    return (
        <div className="flex items-center gap-3 mb-6">
            <div className={`p-2 rounded-xl ${color}`}><Icon className="w-5 h-5" /></div>
            <div>
                <h2 className="text-base font-black text-slate-800">{title}</h2>
                {desc && <p className="text-xs text-slate-500 font-medium">{desc}</p>}
            </div>
        </div>
    );
}

function Toggle({ checked, onChange, label, desc }) {
    return (
        <div className="flex items-center justify-between p-4 border border-slate-200 rounded-2xl bg-white hover:bg-slate-50 transition-colors">
            <div>
                <p className="text-sm font-bold text-slate-800">{label}</p>
                {desc && <p className="text-xs text-slate-500 font-medium mt-0.5">{desc}</p>}
            </div>
            <button type="button" onClick={onChange}
                className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ml-4 ${checked ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
        </div>
    );
}

// ─── Read-only color swatch ─────────────────────────────────────────────────
function ColorSwatch({ label, value }) {
    return (
        <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.06em] mb-1.5">{label}</label>
            <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl border border-slate-200 shrink-0" style={{ background: value || '#eee' }} />
                <div className="flex-1 px-3 py-2 border border-slate-100 rounded-xl font-mono text-sm text-slate-400 bg-slate-50 uppercase select-none">
                    {value || '—'}
                </div>
                <Lock className="w-3.5 h-3.5 text-slate-300 shrink-0" />
            </div>
        </div>
    );
}

// ─── Editable color field ────────────────────────────────────────────────────
function ColorField({ label, name, value, onChange }) {
    return (
        <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-[0.06em] mb-1.5">{label}</label>
            <div className="flex items-center gap-2">
                <input type="color" name={name} value={value || '#000000'} onChange={onChange}
                    className="w-9 h-9 rounded-xl border border-slate-200 cursor-pointer p-0.5 bg-white shrink-0" />
                <input type="text" name={name} value={value || ''} onChange={onChange} maxLength={7}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 font-mono text-sm text-slate-700 bg-white uppercase" />
            </div>
        </div>
    );
}

// ─── Mini Preview ────────────────────────────────────────────────────────────
function ThemePreview({ primary, secondary, sidebar, accent, readonly = false }) {
    return (
        <div className={`rounded-xl overflow-hidden border shadow-sm mb-4 ${readonly ? 'border-slate-100' : 'border-slate-200'}`}>
            <div className={`text-[10px] font-black uppercase tracking-[0.08em] px-3 py-1.5 border-b flex items-center gap-1.5
                ${readonly ? 'bg-slate-50 border-slate-100 text-slate-300' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                {readonly && <Lock className="w-2.5 h-2.5" />}
                {readonly ? 'Set by SuperAdmin' : 'Live Preview'}
            </div>
            <div className="flex h-14">
                <div className="w-10 flex flex-col items-center py-2 gap-1.5" style={{ background: sidebar || '#1e1b4b' }}>
                    {[0, 1, 2].map(i => (
                        <div key={i} className={`w-5 h-1 rounded-full ${i === 0 ? 'opacity-100' : 'opacity-30'}`}
                            style={{ background: accent || '#6366f1' }} />
                    ))}
                </div>
                <div className="flex-1 px-3 py-2 flex items-center gap-2" style={{ background: secondary || '#f8fafc' }}>
                    <div className="flex-1 space-y-1">
                        <div className="h-2 w-20 rounded-full" style={{ background: primary || '#4f46e5', opacity: 0.8 }} />
                        <div className="h-1.5 w-12 rounded-full bg-slate-200" />
                    </div>
                    <div className="px-2 py-0.5 rounded-lg text-[9px] font-black text-white"
                        style={{ background: primary || '#4f46e5' }}>Btn</div>
                </div>
            </div>
        </div>
    );
}

// ─── Global Theme — Read-only display ───────────────────────────────────────
function GlobalThemePanel({ theme }) {
    if (!theme) return (
        <div className="text-center py-10 space-y-2">
            <Lock className="w-7 h-7 mx-auto text-slate-200" />
            <p className="text-sm text-slate-400 font-medium">SuperAdmin hasn't configured a global theme yet.</p>
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
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.06em] mb-1.5">Font</label>
                    <div className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm text-slate-400 flex items-center justify-between">
                        <span>{FONTS.find(f => f.value === theme.fontFamily)?.label || theme.fontFamily || '—'}</span>
                        <Lock className="w-3 h-3 text-slate-300" />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.06em] mb-1.5">Size</label>
                    <div className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm text-slate-400 font-mono flex items-center justify-between">
                        <span>{theme.fontSize || '—'}px</span>
                        <Lock className="w-3 h-3 text-slate-300" />
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
                <div className="w-5 h-5 rounded-md flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg,#6366f1,#0ea5e9)' }}>
                    <Sparkles className="w-3 h-3 text-white" />
                </div>
                <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.07em]">
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
                        className="relative group text-left rounded-xl border transition-all duration-200 overflow-hidden"
                        style={{
                            borderColor: hoveredIdx === i ? p.primaryColor : '#e2e8f0',
                            boxShadow: hoveredIdx === i
                                ? `0 4px 16px ${p.primaryColor}30`
                                : '0 1px 3px rgba(0,0,0,0.06)',
                            transform: hoveredIdx === i ? 'translateY(-1px)' : 'none',
                        }}
                    >
                        {/* Color bar */}
                        <div className="flex h-[6px] w-full">
                            {p.preview.map((c, ci) => (
                                <div key={ci} className="flex-1" style={{ background: c }} />
                            ))}
                        </div>
                        {/* Content */}
                        <div className="p-2.5">
                            <div className="flex items-center justify-between mb-0.5">
                                <span className="text-[11px] font-black text-slate-700 leading-tight">
                                    {p.name}
                                </span>
                                <div className="w-4 h-4 rounded-full border-2 border-white shadow-sm transition-transform group-hover:scale-110"
                                    style={{ background: p.primaryColor }} />
                            </div>
                            <p className="text-[9.5px] text-slate-400 leading-tight line-clamp-2">
                                {p.desc}
                            </p>
                        </div>
                        {/* Apply overlay on hover */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ background: `${p.primaryColor}15` }}>
                            <span className="text-[10px] font-black px-2 py-1 rounded-lg text-white"
                                style={{ background: p.primaryColor }}>
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
                <div className="flex-1 h-px bg-slate-100" />
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.06em]">or customize manually</span>
                <div className="flex-1 h-px bg-slate-100" />
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
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-[0.06em] mb-1.5">Font Family</label>
                    <select name="fontFamily" value={get('fontFamily')} onChange={handle}
                        className="w-full h-9 px-3 border border-slate-200 rounded-xl text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30">
                        {FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-[0.06em] mb-1.5">Font Size (px)</label>
                    <input type="number" name="fontSize" value={get('fontSize')} onChange={handle}
                        min="12" max="20" placeholder="14"
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 bg-white" />
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
        // When true → backend should use SuperAdmin's global theme for this institute's users
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
                // SuperAdmin global theme — read-only reference for institute admin
                api.get('/settings/global-theme').catch(() => ({ data: null })),
            ]);

            if (settingsRes.data?.success) setSettings(settingsRes.data.settings);

            // ── Parse global theme response ───────────────────────────────────
            // API returns: { theme: { globalTheme:{colors}, studentTheme:{colors}, tutorTheme:{colors},
            //                         allowInstituteBranding, enforceGlobalTheme, enableDarkMode } }
            const gt = globalRes.data?.theme || null;
            if (gt) {
                // gt.globalTheme has the actual color fields (primaryColor etc.)
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

    // Toggle ON  → marks institute to use SuperAdmin's global theme (backend enforces)
    // Toggle OFF → institute uses its own student/tutor themes
    // If enforceGlobalTheme=true from SuperAdmin → cannot turn OFF
    const handleUseGlobalToggle = (checked) => {
        // SuperAdmin has enforced global theme — institute cannot override
        if (globalMeta.enforceGlobalTheme && !checked) return;
        setInstituteData(prev => ({
            ...prev,
            useGlobalTheme: checked,
            // When turning ON: visually preview what global looks like
            ...(checked && globalTheme ? {
                studentTheme: { ...globalTheme },
                tutorTheme: { ...globalTheme },
            } : {}),
        }));
    };

    // Copy global theme into one role (individual sync)
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
            // ── Clear institute cache so students/tutors get fresh theme ──────
            // Without this, the old theme persists until cache TTL expires
            localStorage.removeItem('sapience_institute_cache');
            toast.success('Settings saved successfully!');
        } catch {
            toast.error('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const tabs = [
        { key: 'general', label: 'General', icon: Globe },
        { key: 'theme', label: 'Theme & Branding', icon: Palette },
        { key: 'system', label: 'System', icon: Wrench },
        { key: 'financial', label: 'Financial', icon: Shield },
    ];

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-24">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-slate-900">Platform Settings</h1>
                    <p className="text-sm text-slate-500 font-medium mt-0.5">Configure your institute's preferences</p>
                </div>
                <button onClick={handleSave} disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black rounded-xl transition-colors shadow-sm disabled:opacity-60">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Changes
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-slate-100 rounded-2xl w-fit">
                {tabs.map(t => (
                    <button key={t.key} onClick={() => setActiveTab(t.key)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black transition-all
                            ${activeTab === t.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                        <t.icon className="w-4 h-4" />
                        <span className="hidden sm:inline">{t.label}</span>
                    </button>
                ))}
            </div>

            {/* ── GENERAL ──────────────────────────────────────────────────── */}
            {activeTab === 'general' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Card>
                        <SectionHeader icon={Globe} color="bg-indigo-100 text-indigo-600"
                            title="Institute Information" desc="Basic info about your institute" />
                        <div className="space-y-4">
                            {[
                                { label: 'Institute Name', name: 'name', type: 'text' },
                                { label: 'Contact Email', name: 'contactEmail', type: 'email' },
                                { label: 'Logo URL', name: 'logo', type: 'url', placeholder: 'https://…' },
                            ].map(f => (
                                <div key={f.name}>
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-[0.06em] mb-1.5">{f.label}</label>
                                    <input type={f.type} name={f.name} value={instituteData[f.name] || ''}
                                        onChange={handleInstituteChange} placeholder={f.placeholder || ''}
                                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 bg-white" />
                                </div>
                            ))}
                            {instituteData.logo && (
                                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex justify-center">
                                    <img src={instituteData.logo} alt="Logo" className="h-10 object-contain" />
                                </div>
                            )}
                        </div>
                    </Card>

                    <Card>
                        <SectionHeader icon={Globe} color="bg-blue-100 text-blue-600"
                            title="Platform Preferences" desc="Language and publishing" />
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-[0.06em] mb-1.5">Default Language</label>
                                <select name="defaultLanguage" value={settings.defaultLanguage} onChange={handleSettingsChange}
                                    className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30">
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
                <div className="space-y-5">

                    {/* ── SuperAdmin enforcement banners ──────────────────── */}
                    {globalMeta.enforceGlobalTheme && (
                        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl">
                            <Lock className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                            <p className="text-sm text-red-800 font-medium leading-relaxed">
                                <span className="font-black">SuperAdmin has enforced Global Theme</span> — all institute customization is disabled. Contact SuperAdmin to change.
                            </p>
                        </div>
                    )}
                    {!globalMeta.enforceGlobalTheme && !globalMeta.allowInstituteBranding && (
                        <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-2xl">
                            <Lock className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                            <p className="text-sm text-orange-800 font-medium leading-relaxed">
                                <span className="font-black">Custom Branding is disabled by SuperAdmin</span> — you cannot customize themes. Contact SuperAdmin to enable.
                            </p>
                        </div>
                    )}
                    {!globalMeta.enforceGlobalTheme && globalMeta.allowInstituteBranding && (
                        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                            <Lock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                            <p className="text-sm text-amber-800 font-medium leading-relaxed">
                                <span className="font-black">Global Theme is controlled by SuperAdmin</span> — shown for reference only.
                                Customize <span className="font-black">Student</span> and <span className="font-black">Tutor</span> panels independently,
                                or enable the toggle below to inherit the global theme.
                            </p>
                        </div>
                    )}

                    {/* Use Global Theme toggle */}
                    <Card>
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center shrink-0">
                                    <Sparkles className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-sm font-black text-slate-800">Use Global Theme for All Roles</p>
                                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                                        Student &amp; Tutor panels will inherit SuperAdmin's global theme automatically
                                        {globalMeta.enforceGlobalTheme && <span className="ml-1 text-red-500 font-black">(Enforced by SuperAdmin)</span>}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                disabled={globalMeta.enforceGlobalTheme || !globalMeta.allowInstituteBranding}
                                onClick={() => handleUseGlobalToggle(!instituteData.useGlobalTheme)}
                                className={`relative w-12 h-6 rounded-full transition-colors shrink-0
                                    ${(globalMeta.enforceGlobalTheme || !globalMeta.allowInstituteBranding) ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
                                    ${(instituteData.useGlobalTheme || globalMeta.enforceGlobalTheme) ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform
                                    ${(instituteData.useGlobalTheme || globalMeta.enforceGlobalTheme) ? 'translate-x-6' : 'translate-x-0.5'}`} />
                            </button>
                        </div>
                        {(instituteData.useGlobalTheme || globalMeta.enforceGlobalTheme) && (
                            <div className="mt-4 flex items-center gap-2 px-3 py-2 bg-indigo-50 border border-indigo-100 rounded-xl">
                                <CheckCircle className="w-4 h-4 text-indigo-500 shrink-0" />
                                <p className="text-xs font-bold text-indigo-700">
                                    Both Student &amp; Tutor panels are using SuperAdmin's global theme. Custom editing is disabled.
                                </p>
                            </div>
                        )}
                    </Card>

                    {/* 3 columns: Global (locked) | Student | Tutor */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                        {/* ── Global — READ ONLY ── */}
                        <Card className="bg-slate-50 border-dashed border-slate-300">
                            <div className="flex items-center gap-2.5 mb-5">
                                <div className="w-8 h-8 bg-slate-200 rounded-xl flex items-center justify-center">
                                    <Globe className="w-4 h-4 text-slate-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-black text-slate-600">Global Theme</p>
                                    <p className="text-[11px] text-slate-400 font-medium">SuperAdmin · Read-only</p>
                                </div>
                                <span className="flex items-center gap-1 text-[10px] font-black text-slate-400 bg-white border border-slate-200 px-2 py-0.5 rounded-full shrink-0">
                                    <Lock className="w-2.5 h-2.5" /> Locked
                                </span>
                            </div>
                            <GlobalThemePanel theme={globalTheme} />
                        </Card>

                        {/* ── Student — locked if enforced OR branding disabled ── */}
                        <Card className={`transition-opacity duration-200
                            ${(instituteData.useGlobalTheme || globalMeta.enforceGlobalTheme || !globalMeta.allowInstituteBranding)
                                ? 'opacity-40 pointer-events-none select-none' : 'ring-2 ring-indigo-100'}`}>
                            <div className="flex items-center gap-2.5 mb-5">
                                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center">
                                    <GraduationCap className="w-4 h-4 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-black text-slate-800">Student Theme</p>
                                    <p className="text-[11px] text-slate-400 font-medium">Student panel only</p>
                                </div>
                                {globalTheme && !instituteData.useGlobalTheme && globalMeta.allowInstituteBranding && !globalMeta.enforceGlobalTheme && (
                                    <button type="button" onClick={() => syncRoleToGlobal('studentTheme')}
                                        className="flex items-center gap-1 text-[10px] font-black text-slate-400 hover:text-indigo-600 px-2 py-1 bg-slate-50 hover:bg-indigo-50 rounded-lg border border-slate-200 transition-colors shrink-0">
                                        <RefreshCw className="w-3 h-3" /> Sync Global
                                    </button>
                                )}
                            </div>
                            <EditableThemePanel prefix="studentTheme" data={instituteData} onChange={handleInstituteChange} />
                        </Card>

                        {/* ── Tutor — locked if enforced OR branding disabled ── */}
                        <Card className={`transition-opacity duration-200
                            ${(instituteData.useGlobalTheme || globalMeta.enforceGlobalTheme || !globalMeta.allowInstituteBranding)
                                ? 'opacity-40 pointer-events-none select-none' : 'ring-2 ring-orange-100'}`}>
                            <div className="flex items-center gap-2.5 mb-5">
                                <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center">
                                    <Users className="w-4 h-4 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-black text-slate-800">Tutor Theme</p>
                                    <p className="text-[11px] text-slate-400 font-medium">Tutor panel only</p>
                                </div>
                                {globalTheme && !instituteData.useGlobalTheme && globalMeta.allowInstituteBranding && !globalMeta.enforceGlobalTheme && (
                                    <button type="button" onClick={() => syncRoleToGlobal('tutorTheme')}
                                        className="flex items-center gap-1 text-[10px] font-black text-slate-400 hover:text-orange-600 px-2 py-1 bg-slate-50 hover:bg-orange-50 rounded-lg border border-slate-200 transition-colors shrink-0">
                                        <RefreshCw className="w-3 h-3" /> Sync Global
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
                    <SectionHeader icon={Wrench} color="bg-amber-100 text-amber-600"
                        title="System Controls" desc="Platform-level access and feature toggles" />
                    <div className="grid sm:grid-cols-2 gap-3">
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
                    <SectionHeader icon={Shield} color="bg-emerald-100 text-emerald-600"
                        title="Financial & Security" desc="Revenue sharing and billing" />
                    <div className="max-w-xs space-y-4">
                        <div>
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-[0.06em] mb-1.5">Platform Commission (%)</label>
                            <p className="text-xs text-slate-400 font-medium mb-2">Percentage cut from tutor/institute sales</p>
                            <input type="number" name="platformCommission" value={settings.platformCommission}
                                onChange={handleSettingsChange} min="0" max="100"
                                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 bg-white" />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-[0.06em] mb-1.5">Support Phone</label>
                            <input type="tel" name="supportPhone" value={settings.supportPhone || ''}
                                onChange={handleSettingsChange} placeholder="+91 98765 43210"
                                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 bg-white" />
                        </div>
                    </div>
                </Card>
            )}

            {/* Sticky save button */}
            <div className="fixed bottom-6 right-6 z-50">
                <button onClick={handleSave} disabled={saving}
                    className="flex items-center gap-2.5 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-300/40 transition-all hover:scale-105 disabled:opacity-60 disabled:scale-100 text-sm">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save All Changes
                </button>
            </div>
        </div>
    );
}