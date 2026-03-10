'use client';

import { useState, useEffect } from 'react';
import {
    Save, Loader2, Palette, Globe, Mail, MapPin, Phone,
    Type, Sun, Building, GraduationCap, Users, Sparkles, CheckCircle
} from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { useTheme } from '@/contexts/ThemeContext';

// ─── Constants ───────────────────────────────────────────────────────────────
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

const DEFAULT_THEME = {
    primaryColor: '#4338ca',
    secondaryColor: '#f8fafc',
    accentColor: '#6366f1',
    sidebarColor: '#1e1b4b',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '14',
};

// ─── UI Atoms ────────────────────────────────────────────────────────────────
function Card({ children, className = '' }) {
    return (
        <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm ${className}`}>
            {children}
        </div>
    );
}

function CardHead({ icon: Icon, color, title, desc }) {
    return (
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100 bg-slate-50/60 rounded-t-2xl">
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

function FieldLabel({ children }) {
    return <label className="block text-xs font-black text-slate-500 uppercase tracking-[0.06em] mb-1.5">{children}</label>;
}

function TextInput({ name, value, onChange, type = 'text', placeholder = '', className = '' }) {
    return (
        <input type={type} name={name} value={value || ''} onChange={onChange} placeholder={placeholder}
            className={`w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700
                focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 bg-white ${className}`} />
    );
}

// ─── Color Field ─────────────────────────────────────────────────────────────
function ColorField({ label, name, value, onChange }) {
    return (
        <div>
            <FieldLabel>{label}</FieldLabel>
            <div className="flex items-center gap-2">
                <input type="color" name={name} value={value || '#000000'} onChange={onChange}
                    className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer p-0.5 bg-white shrink-0" />
                <input type="text" name={name} value={value || ''} onChange={onChange} maxLength={7}
                    className="flex-1 px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 font-mono text-sm text-slate-700 bg-white uppercase" />
            </div>
        </div>
    );
}

// ─── Mini Preview ─────────────────────────────────────────────────────────────
function ThemePreview({ primary, secondary, sidebar, accent }) {
    return (
        <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm mb-4">
            <div className="text-[10px] font-black uppercase tracking-[0.08em] text-slate-400 px-3 py-1.5 bg-slate-50 border-b border-slate-100">
                Live Preview
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

// ─── Theme Panel (reusable for Global / Student / Tutor) ─────────────────────
function ThemePanel({ prefix, data, onChange }) {
    const get = (key) => data?.[prefix]?.[key] ?? '';
    const handle = (e) =>
        onChange({ target: { name: `${prefix}.${e.target.name}`, value: e.target.value } });

    return (
        <div className="space-y-4 p-6">
            <ThemePreview
                primary={get('primaryColor')} secondary={get('secondaryColor')}
                sidebar={get('sidebarColor')} accent={get('accentColor')} />

            <div className="grid grid-cols-2 gap-3">
                <ColorField label="Primary" name="primaryColor" value={get('primaryColor')} onChange={handle} />
                <ColorField label="Secondary" name="secondaryColor" value={get('secondaryColor')} onChange={handle} />
                <ColorField label="Sidebar" name="sidebarColor" value={get('sidebarColor')} onChange={handle} />
                <ColorField label="Accent" name="accentColor" value={get('accentColor')} onChange={handle} />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div>
                    <FieldLabel>Font Family</FieldLabel>
                    <select name="fontFamily" value={get('fontFamily')} onChange={handle}
                        className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30">
                        {FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                    </select>
                </div>
                <div>
                    <FieldLabel>Font Size (px)</FieldLabel>
                    <input type="number" name="fontSize" value={get('fontSize')} onChange={handle}
                        min="12" max="20" placeholder="14"
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl font-mono text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 bg-white" />
                </div>
            </div>
        </div>
    );
}

// ─── Tab Button ───────────────────────────────────────────────────────────────
function ThemeTab({ active, onClick, icon: Icon, iconBg, label, sublabel }) {
    return (
        <button type="button" onClick={onClick}
            className={`flex items-center gap-3 px-5 py-3.5 rounded-xl text-left transition-all border
                ${active
                    ? 'bg-white border-indigo-200 shadow-sm ring-1 ring-indigo-100'
                    : 'bg-transparent border-transparent hover:bg-slate-50'}`}>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
                <Icon className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
                <p className={`text-sm font-black truncate ${active ? 'text-slate-900' : 'text-slate-500'}`}>{label}</p>
                <p className="text-[11px] text-slate-400 font-medium truncate">{sublabel}</p>
            </div>
            {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />}
        </button>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function GlobalSettingsPage() {
    const { refreshGlobalTheme } = useTheme();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeThemeTab, setActiveThemeTab] = useState('global');

    const [settings, setSettings] = useState({
        // Basic
        siteName: '',
        supportEmail: '',
        supportPhone: '',
        facebookLink: '',
        twitterLink: '',
        footerText: '',
        contactEmail: '',
        contactAddress: '',
        // Theme mode
        enableDarkMode: true,
        maintenanceMode: false,
        // Branding permissions
        allowInstituteBranding: true,
        enforceGlobalTheme: false,
        // 3 separate theme objects
        globalTheme: { ...DEFAULT_THEME },
        studentTheme: { ...DEFAULT_THEME },
        tutorTheme: {
            ...DEFAULT_THEME,
            primaryColor: '#f97316',
            secondaryColor: '#fff7ed',
            accentColor: '#fb923c',
            sidebarColor: '#0f172a',
        },
    });

    useEffect(() => { fetchSettings(); }, []);

    const fetchSettings = async () => {
        try {
            const res = await api.get('/superadmin/settings');
            if (res.data.success && res.data.settings) {
                const s = res.data.settings;
                setSettings(prev => ({
                    ...prev,
                    siteName: s.siteName || '',
                    supportEmail: s.supportEmail || '',
                    supportPhone: s.supportPhone || '',
                    facebookLink: s.facebookLink || '',
                    twitterLink: s.twitterLink || '',
                    footerText: s.footerText || '',
                    contactEmail: s.contactEmail || '',
                    contactAddress: s.contactAddress || '',
                    enableDarkMode: s.enableDarkMode ?? true,
                    maintenanceMode: s.maintenanceMode || false,
                    allowInstituteBranding: s.allowInstituteBranding ?? true,
                    enforceGlobalTheme: s.enforceGlobalTheme ?? false,
                    globalTheme: s.globalTheme || prev.globalTheme,
                    studentTheme: s.studentTheme || prev.studentTheme,
                    tutorTheme: s.tutorTheme || prev.tutorTheme,
                }));
            }
        } catch {
            toast.error('Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const val = type === 'checkbox' ? checked : value;

        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setSettings(prev => ({ ...prev, [parent]: { ...prev[parent], [child]: val } }));
        } else {
            setSettings(prev => ({ ...prev, [name]: val }));
        }
    };

    // Copy global theme into student or tutor
    const syncToGlobal = (target) => {
        setSettings(prev => ({ ...prev, [target]: { ...prev.globalTheme } }));
        toast.success(`${target === 'studentTheme' ? 'Student' : 'Tutor'} theme synced from Global!`);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await api.put('/superadmin/settings', settings);
            if (res.data.success) {
                // ── Clear ALL theme caches so everyone gets fresh theme ───────
                localStorage.removeItem('sapience_global_theme_v2');   // ThemeContext global cache
                localStorage.removeItem('global-theme-settings');       // legacy cache
                localStorage.removeItem('sapience_institute_cache');    // institute cache (students/tutors)

                // Write fresh data so any component reading the old key also gets update
                localStorage.setItem('global-theme-settings', JSON.stringify({
                    globalTheme: settings.globalTheme,
                    studentTheme: settings.studentTheme,
                    tutorTheme: settings.tutorTheme,
                    allowInstituteBranding: settings.allowInstituteBranding,
                    enforceGlobalTheme: settings.enforceGlobalTheme,
                    enableDarkMode: settings.enableDarkMode,
                }));

                // ── Force ThemeContext in-memory state to re-fetch ────────────
                refreshGlobalTheme();

                toast.success('Global settings saved successfully!');
            }
        } catch {
            toast.error('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex h-64 items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
    );

    const themeTabs = [
        {
            key: 'global',
            label: 'Global Theme',
            sublabel: 'Default for all institutes',
            icon: Globe,
            iconBg: 'bg-slate-600',
        },
        {
            key: 'student',
            label: 'Student Theme',
            sublabel: 'Default student panel colors',
            icon: GraduationCap,
            iconBg: 'bg-gradient-to-br from-indigo-500 to-blue-600',
        },
        {
            key: 'tutor',
            label: 'Tutor Theme',
            sublabel: 'Default tutor panel colors',
            icon: Users,
            iconBg: 'bg-gradient-to-br from-orange-400 to-orange-600',
        },
    ];

    return (
        <div className="max-w-5xl mx-auto pb-24 space-y-6" style={{ fontFamily: 'inherit' }}>

            {/* Header */}
            <div className="flex items-center justify-between pt-2">
                <div>
                    <h1 className="text-2xl font-black text-slate-900">Global Settings</h1>
                    <p className="text-sm text-slate-500 font-medium mt-0.5">
                        Platform-wide configuration, branding, and default themes
                    </p>
                </div>
                <button type="button" onClick={handleSave} disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black rounded-xl transition-colors shadow-sm disabled:opacity-60">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Settings
                </button>
            </div>

            {/* ── THEME & BRANDING ─────────────────────────────────────────── */}
            <Card>
                <CardHead icon={Palette} color="bg-pink-100 text-pink-600"
                    title="Theme & Branding"
                    desc="Set default themes for each role. Institute admins can override unless enforced." />

                {/* Info banner */}
                <div className="mx-6 mt-5 flex items-start gap-3 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
                    <Sparkles className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-indigo-800 font-medium leading-relaxed">
                        Set <span className="font-black">Student</span> and <span className="font-black">Tutor</span> themes independently,
                        or define a <span className="font-black">Global Theme</span> as the base fallback.
                        Institute admins will see Global Theme as read-only reference and can customize their own Student/Tutor panels.
                    </p>
                </div>

                {/* Theme tab selector + panel */}
                <div className="flex gap-0 mt-5 mx-6 mb-0">
                    {/* Left: tab buttons */}
                    <div className="w-52 shrink-0 flex flex-col gap-1.5 pr-4 border-r border-slate-100 py-2">
                        {themeTabs.map(t => (
                            <ThemeTab key={t.key}
                                active={activeThemeTab === t.key}
                                onClick={() => setActiveThemeTab(t.key)}
                                icon={t.icon} iconBg={t.iconBg}
                                label={t.label} sublabel={t.sublabel} />
                        ))}

                        {/* Sync buttons */}
                        <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.06em] px-1">Quick Actions</p>
                            <button type="button" onClick={() => syncToGlobal('studentTheme')}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-black text-slate-500 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 rounded-xl border border-slate-200 transition-colors">
                                <GraduationCap className="w-3.5 h-3.5" />
                                Copy Global → Student
                            </button>
                            <button type="button" onClick={() => syncToGlobal('tutorTheme')}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-black text-slate-500 hover:text-orange-600 bg-slate-50 hover:bg-orange-50 rounded-xl border border-slate-200 transition-colors">
                                <Users className="w-3.5 h-3.5" />
                                Copy Global → Tutor
                            </button>
                        </div>
                    </div>

                    {/* Right: active theme panel */}
                    <div className="flex-1 min-w-0">
                        {activeThemeTab === 'global' && (
                            <div>
                                <div className="px-6 pt-3 pb-1">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 bg-slate-600 rounded-lg flex items-center justify-center">
                                            <Globe className="w-3.5 h-3.5 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-slate-800">Global Theme</p>
                                            <p className="text-[11px] text-slate-400 font-medium">
                                                Shown as read-only reference to institute admins
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <ThemePanel prefix="globalTheme" data={settings} onChange={handleChange} />
                            </div>
                        )}
                        {activeThemeTab === 'student' && (
                            <div>
                                <div className="px-6 pt-3 pb-1">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg flex items-center justify-center">
                                            <GraduationCap className="w-3.5 h-3.5 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-slate-800">Student Theme</p>
                                            <p className="text-[11px] text-slate-400 font-medium">
                                                Default student panel theme — institute admins can override
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <ThemePanel prefix="studentTheme" data={settings} onChange={handleChange} />
                            </div>
                        )}
                        {activeThemeTab === 'tutor' && (
                            <div>
                                <div className="px-6 pt-3 pb-1">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center">
                                            <Users className="w-3.5 h-3.5 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-slate-800">Tutor Theme</p>
                                            <p className="text-[11px] text-slate-400 font-medium">
                                                Default tutor panel theme — institute admins can override
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <ThemePanel prefix="tutorTheme" data={settings} onChange={handleChange} />
                            </div>
                        )}
                    </div>
                </div>

                {/* Theme mode + branding permissions */}
                <div className="mx-6 mt-2 mb-6 space-y-5">
                    {/* Dark mode */}
                    <div className="pt-5 border-t border-slate-100">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-[0.06em] mb-3 flex items-center gap-2">
                            <Sun className="w-3.5 h-3.5" /> Theme Mode
                        </p>
                        <div className="max-w-xs">
                            <select name="enableDarkMode"
                                value={settings.enableDarkMode ? 'enabled' : 'disabled'}
                                onChange={(e) => setSettings(prev => ({ ...prev, enableDarkMode: e.target.value === 'enabled' }))}
                                className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30">
                                <option value="enabled">Light &amp; Dark Mode Enabled</option>
                                <option value="disabled">Light Mode Only</option>
                            </select>
                        </div>
                    </div>

                    {/* Branding Permissions */}
                    <div className="pt-5 border-t border-slate-100">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-[0.06em] mb-3 flex items-center gap-2">
                            <Building className="w-3.5 h-3.5" /> Institute Branding Permissions
                        </p>
                        <div className="grid sm:grid-cols-2 gap-3">
                            <Toggle
                                checked={settings.allowInstituteBranding}
                                onChange={() => setSettings(prev => ({ ...prev, allowInstituteBranding: !prev.allowInstituteBranding }))}
                                label="Allow Institute Custom Branding"
                                desc="Institutes can customize their own colors and logos" />
                            <Toggle
                                checked={settings.enforceGlobalTheme}
                                onChange={() => setSettings(prev => ({ ...prev, enforceGlobalTheme: !prev.enforceGlobalTheme }))}
                                label="Enforce Global Theme"
                                desc="Override all institute settings with global theme" />
                        </div>
                        {settings.enforceGlobalTheme && (
                            <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-100 rounded-xl">
                                <CheckCircle className="w-4 h-4 text-amber-500 shrink-0" />
                                <p className="text-xs font-bold text-amber-700">
                                    Global theme is being enforced — all institute customizations are overridden.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </Card>

            {/* ── BASIC SETTINGS ────────────────────────────────────────────── */}
            <Card>
                <CardHead icon={Globe} color="bg-indigo-100 text-indigo-600"
                    title="Basic Settings"
                    desc="Site information and public contact details" />
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                        <FieldLabel>Site Name</FieldLabel>
                        <TextInput name="siteName" value={settings.siteName} onChange={handleChange} placeholder="Sapience LMS" />
                    </div>
                    <div>
                        <FieldLabel>Public Contact Email</FieldLabel>
                        <TextInput name="contactEmail" value={settings.contactEmail} onChange={handleChange} placeholder="hello@example.com" />
                    </div>
                    <div>
                        <FieldLabel>Support Phone</FieldLabel>
                        <TextInput name="supportPhone" value={settings.supportPhone} onChange={handleChange} placeholder="+91 98765 43210" />
                    </div>
                    <div>
                        <FieldLabel>Facebook Link</FieldLabel>
                        <TextInput name="facebookLink" value={settings.facebookLink} onChange={handleChange} placeholder="https://facebook.com/yourpage" />
                    </div>
                    <div>
                        <FieldLabel>Twitter / X Link</FieldLabel>
                        <TextInput name="twitterLink" value={settings.twitterLink} onChange={handleChange} placeholder="https://x.com/yourhandle" />
                    </div>
                    <div>
                        <FieldLabel>Office Address</FieldLabel>
                        <TextInput name="contactAddress" value={settings.contactAddress} onChange={handleChange} placeholder="123 Education St, City" />
                    </div>
                    <div className="md:col-span-2">
                        <FieldLabel>Global Footer Text</FieldLabel>
                        <TextInput name="footerText" value={settings.footerText} onChange={handleChange} placeholder="© 2025 Sapience LMS. All rights reserved." />
                    </div>
                </div>
            </Card>

            {/* ── SYSTEM CONTROLS ──────────────────────────────────────────── */}
            <Card>
                <CardHead icon={Building} color="bg-amber-100 text-amber-600"
                    title="System Controls"
                    desc="Platform-wide access and state controls" />
                <div className="p-6">
                    <Toggle
                        checked={settings.maintenanceMode}
                        onChange={() => setSettings(prev => ({ ...prev, maintenanceMode: !prev.maintenanceMode }))}
                        label="Maintenance Mode"
                        desc="Disable access to all non-superadmin users platform-wide" />
                </div>
            </Card>

            {/* Sticky save */}
            <div className="fixed bottom-6 right-6 z-50">
                <button type="button" onClick={handleSave} disabled={saving}
                    className="flex items-center gap-2.5 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-300/40 transition-all hover:scale-105 disabled:opacity-60 disabled:scale-100 text-sm">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save All Settings
                </button>
            </div>
        </div>
    );
}