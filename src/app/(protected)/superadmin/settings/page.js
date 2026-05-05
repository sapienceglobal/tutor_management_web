'use client';

import { useState, useEffect } from 'react';
import {
    MdSave, MdHourglassEmpty, MdPalette, MdPublic, MdEmail, MdLocationOn, MdPhone,
    MdTextFields, MdWbSunny, MdBusiness, MdSchool, MdPeople, MdAutoAwesome, MdCheckCircle,
    MdSecurity
} from 'react-icons/md';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { C, T, S, R, pageStyle } from '@/constants/studentTokens';
// Future ke liye comment kiya gaya hai
// import { useTheme } from '@/contexts/ThemeContext';

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
    primaryColor: '#6B4DF1',
    secondaryColor: '#F8F6FC',
    accentColor: '#8B5CF6',
    sidebarColor: '#27225B',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '14',
};

// ─── Base Input Style ─────────────────────────────────────────────────────────
const baseInputStyle = {
    backgroundColor: C.cardBg,
    border: `1px solid ${C.cardBorder}`,
    borderRadius: '10px',
    color: C.heading,
    fontFamily: T.fontFamily,
    fontSize: T.size.base,
    fontWeight: T.weight.semibold,
    outline: 'none',
    width: '100%',
    padding: '12px 16px',
    transition: 'all 0.2s ease',
};

// ─── UI Atoms ────────────────────────────────────────────────────────────────
function Card({ children, className = '' }) {
    return (
        <div className={`overflow-hidden ${className}`} style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
            {children}
        </div>
    );
}

function SectionHeader({ icon: Icon, title, desc }) {
    return (
        <div className="flex flex-col mb-4">
            <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center rounded-lg shrink-0"
                    style={{ width: 40, height: 40, backgroundColor: C.iconBg }}>
                    <Icon style={{ width: 16, height: 16, color: C.iconColor }} />
                </div>
                <h2 style={{ fontFamily: T.fontFamily, fontSize: T.size.xl, fontWeight: T.weight.semibold, color: C.heading, margin: 0 }}>
                    {title}
                </h2>
            </div>
            {desc && <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.medium, color: C.textMuted, margin: 0, marginTop: '4px', marginLeft: '50px' }}>{desc}</p>}
        </div>
    );
}

function Toggle({ checked, onChange, label, desc }) {
    return (
        <div className="flex items-center justify-between p-4 transition-all cursor-pointer"
            style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, borderRadius: '10px' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = C.innerBg}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = C.cardBg}
            onClick={onChange}>
            <div>
                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>{label}</p>
                {desc && <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.medium, color: C.textMuted, margin: 0, marginTop: '4px' }}>{desc}</p>}
            </div>
            <button type="button"
                style={{
                    position: 'relative', width: 44, height: 24, borderRadius: '9999px',
                    transition: 'background-color 0.2s', border: 'none', cursor: 'pointer',
                    backgroundColor: checked ? C.success : '#D1D5DB', flexShrink: 0, marginLeft: '16px'
                }}>
                <div style={{
                    position: 'absolute', top: 2, left: checked ? 22 : 2, width: 20, height: 20,
                    backgroundColor: '#ffffff', borderRadius: '50%', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                }} />
            </button>
        </div>
    );
}

function FieldLabel({ children }) {
    return <label style={{ display: 'block', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, marginBottom: '6px' }}>{children}</label>;
}

function TextInput({ name, value, onChange, type = 'text', placeholder = '', className = '' }) {
    return (
        <input type={type} name={name} value={value || ''} onChange={onChange} placeholder={placeholder} style={baseInputStyle} className={className} />
    );
}

// ─── Color Field ─────────────────────────────────────────────────────────────
function ColorField({ label, name, value, onChange }) {
    return (
        <div>
            <FieldLabel>{label}</FieldLabel>
            <div className="flex items-center gap-2">
                <div className="relative shrink-0 cursor-pointer overflow-hidden" style={{ width: 48, height: 48, borderRadius: '10px', border: `1px solid ${C.cardBorder}`, boxShadow: S.cardHover }}>
                    <input type="color" name={name} value={value || '#000000'} onChange={onChange}
                        style={{ position: 'absolute', top: -8, left: -8, width: 64, height: 64, cursor: 'pointer', border: 'none', background: 'transparent' }} />
                </div>
                <input type="text" name={name} value={value || ''} onChange={onChange} maxLength={7}
                    style={{ ...baseInputStyle, fontFamily: T.fontFamilyMono, textTransform: 'uppercase' }} />
            </div>
        </div>
    );
}

// ─── Mini Preview ─────────────────────────────────────────────────────────────
function ThemePreview({ primary, secondary, sidebar, accent }) {
    return (
        <div className="overflow-hidden mb-6" style={{ borderRadius: '10px', border: `1px solid ${C.cardBorder}`, backgroundColor: '#ffffff', boxShadow: S.cardHover }}>
            <div className="flex items-center justify-between" style={{ padding: '8px 16px', backgroundColor: C.innerBg, borderBottom: `1px solid ${C.cardBorder}` }}>
                <span style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.black, textTransform: 'uppercase', letterSpacing: T.tracking.wider, color: C.textFaint }}>Live Component Preview</span>
                <div className="flex gap-1.5">
                    <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#F87171' }}></div>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#FBBF24' }}></div>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#34D399' }}></div>
                </div>
            </div>
            <div className="flex h-20">
                <div className="w-14 flex flex-col items-center py-3 gap-2" style={{ background: sidebar || '#27225B' }}>
                    <div className="w-6 h-6 rounded-md bg-white/10 mb-2"></div>
                    {[0, 1, 2].map(i => (
                        <div key={i} className={`w-6 h-1.5 rounded-full ${i === 0 ? 'opacity-100' : 'opacity-40'}`}
                            style={{ background: accent || '#6B4DF1' }} />
                    ))}
                </div>
                <div className="flex-1 p-4 flex items-center gap-4" style={{ background: secondary || '#F8F6FC' }}>
                    <div className="flex-1 space-y-2">
                        <div className="h-3 w-32 rounded-full" style={{ background: primary || '#6B4DF1', opacity: 0.9 }} />
                        <div className="h-2 w-20 rounded-full" style={{ backgroundColor: '#E2E8F0' }} />
                    </div>
                    <div className="px-4 py-1.5 rounded-lg text-[10px] font-black text-white shadow-sm"
                        style={{ background: primary || '#6B4DF1' }}>Action</div>
                </div>
            </div>
        </div>
    );
}

// ─── Theme Panel ──────────────────────────────────────────────────────────────
function ThemePanel({ prefix, data, onChange }) {
    const get = (key) => data?.[prefix]?.[key] ?? '';
    const handle = (e) =>
        onChange({ target: { name: `${prefix}.${e.target.name}`, value: e.target.value } });

    return (
        <div className="space-y-4 p-6" style={{ backgroundColor: C.cardBg, borderRadius: '0 0 10px 10px' }}>
            <ThemePreview
                primary={get('primaryColor')} secondary={get('secondaryColor')}
                sidebar={get('sidebarColor')} accent={get('accentColor')} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <ColorField label="Primary Color" name="primaryColor" value={get('primaryColor')} onChange={handle} />
                <ColorField label="Secondary Bg" name="secondaryColor" value={get('secondaryColor')} onChange={handle} />
                <ColorField label="Sidebar Bg" name="sidebarColor" value={get('sidebarColor')} onChange={handle} />
                <ColorField label="Accent Highlights" name="accentColor" value={get('accentColor')} onChange={handle} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4 mt-4" style={{ borderTop: `1px solid ${C.cardBorder}` }}>
                <div>
                    <FieldLabel>Typography (Font Family)</FieldLabel>
                    <select name="fontFamily" value={get('fontFamily')} onChange={handle} style={{ ...baseInputStyle, cursor: 'pointer' }}>
                        {FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                    </select>
                </div>
                <div>
                    <FieldLabel>Base Font Size (px)</FieldLabel>
                    <input type="number" name="fontSize" value={get('fontSize')} onChange={handle}
                        min="12" max="20" placeholder="14"
                        style={{ ...baseInputStyle, fontFamily: T.fontFamilyMono }} />
                </div>
            </div>
        </div>
    );
}

// ─── Tab Button ───────────────────────────────────────────────────────────────
function ThemeTab({ active, onClick, icon: Icon, label, sublabel }) {
    return (
        <button type="button" onClick={onClick}
            className="flex items-center gap-3.5 text-left transition-all w-full cursor-pointer"
            style={{
                padding: '12px 16px',
                borderRadius: '10px',
                backgroundColor: active ? C.innerBg : 'transparent',
                border: active ? `1px solid ${C.cardBorder}` : '1px solid transparent',
            }}>
            <div className="flex items-center justify-center shrink-0" style={{ width: 36, height: 36, borderRadius: '10px', backgroundColor: active ? C.btnPrimary : C.iconBg }}>
                <Icon style={{ width: 16, height: 16, color: active ? '#ffffff' : C.iconColor }} />
            </div>
            <div className="min-w-0 flex-1">
                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: active ? C.btnPrimary : C.heading, margin: 0 }} className="truncate">{label}</p>
                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.medium, color: C.textMuted, margin: 0, marginTop: '2px' }} className="truncate">{sublabel}</p>
            </div>
        </button>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function GlobalSettingsPage() {
    // Future ke liye comment kiya gaya hai
    // const { refreshGlobalTheme } = useTheme();
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeThemeTab, setActiveThemeTab] = useState('global');

    const [settings, setSettings] = useState({
        siteName: '', supportEmail: '', supportPhone: '', facebookLink: '',
        twitterLink: '', footerText: '', contactEmail: '', contactAddress: '',
        enableDarkMode: true, maintenanceMode: false, allowInstituteBranding: true,
        enforceGlobalTheme: false,
        globalTheme: { ...DEFAULT_THEME },
        studentTheme: { ...DEFAULT_THEME },
        tutorTheme: {
            ...DEFAULT_THEME,
            primaryColor: '#FC8730', secondaryColor: '#FFF7ED',
            accentColor: '#FDBA74', sidebarColor: '#27225B',
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
                    siteName: s.siteName || '', supportEmail: s.supportEmail || '',
                    supportPhone: s.supportPhone || '', facebookLink: s.facebookLink || '',
                    twitterLink: s.twitterLink || '', footerText: s.footerText || '',
                    contactEmail: s.contactEmail || '', contactAddress: s.contactAddress || '',
                    enableDarkMode: s.enableDarkMode ?? true, maintenanceMode: s.maintenanceMode || false,
                    allowInstituteBranding: s.allowInstituteBranding ?? true, enforceGlobalTheme: s.enforceGlobalTheme ?? false,
                    globalTheme: s.globalTheme || prev.globalTheme, studentTheme: s.studentTheme || prev.studentTheme,
                    tutorTheme: s.tutorTheme || prev.tutorTheme,
                }));
            }
        } catch { toast.error('Failed to load settings'); } 
        finally { setLoading(false); }
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

    const syncToGlobal = (target) => {
        setSettings(prev => ({ ...prev, [target]: { ...prev.globalTheme } }));
        toast.success(`${target === 'studentTheme' ? 'Student' : 'Tutor'} theme synced from Global!`);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await api.put('/superadmin/settings', settings);
            if (res.data.success) {
                localStorage.removeItem('sapience_global_theme_v2'); 
                localStorage.removeItem('global-theme-settings'); 
                localStorage.removeItem('sapience_institute_cache'); 
                localStorage.setItem('global-theme-settings', JSON.stringify({
                    globalTheme: settings.globalTheme, studentTheme: settings.studentTheme,
                    tutorTheme: settings.tutorTheme, allowInstituteBranding: settings.allowInstituteBranding,
                    enforceGlobalTheme: settings.enforceGlobalTheme, enableDarkMode: settings.enableDarkMode,
                }));
                
                // Future ke liye comment kiya gaya hai
                // refreshGlobalTheme();
                
                toast.success('Global settings saved successfully!');
            }
        } catch { toast.error('Failed to save settings'); } 
        finally { setSaving(false); }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: C.pageBg }}>
                <div className="flex flex-col items-center gap-3">
                    <div className="relative w-12 h-12">
                        <div className="w-12 h-12 rounded-full border-[3px] animate-spin"
                            style={{ borderColor: `${C.btnPrimary}30`, borderTopColor: C.btnPrimary }} />
                    </div>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.text }}>
                        Loading settings...
                    </p>
                </div>
            </div>
        );
    }

    const themeTabs = [
        { key: 'global', label: 'Global Theme', sublabel: 'Default for all institutes', icon: MdPublic },
        { key: 'student', label: 'Student Theme', sublabel: 'Default student panel', icon: MdSchool },
        { key: 'tutor', label: 'Tutor Theme', sublabel: 'Default tutor panel', icon: MdPeople },
    ];

    return (
        <div className="min-h-screen space-y-6 pb-24" style={{ backgroundColor: C.pageBg, ...pageStyle }}>

            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.black, color: C.heading, margin: 0 }}>Platform Settings</h1>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.textMuted, margin: 0, marginTop: 4 }}>Configure global branding, themes, and system operations.</p>
                </div>
                <button type="button" onClick={handleSave} disabled={saving}
                    className="flex items-center justify-center gap-2 transition-opacity"
                    style={{
                        background: saving ? C.cardBorder : C.gradientBtn,
                        color: '#ffffff',
                        fontFamily: T.fontFamily,
                        fontSize: T.size.base,
                        fontWeight: T.weight.bold,
                        borderRadius: '10px',
                        border: 'none',
                        padding: '12px 24px',
                        cursor: saving ? 'not-allowed' : 'pointer',
                        boxShadow: saving ? 'none' : S.btn
                    }}
                >
                    {saving ? <MdHourglassEmpty style={{ width: 18, height: 18 }} className="animate-spin" /> : <MdSave style={{ width: 18, height: 18 }} />}
                    Save All Changes
                </button>
            </div>

            {/* ── THEME & BRANDING ── */}
            <Card>
                <div className="p-6">
                    <SectionHeader icon={MdPalette} title="Theme & Custom Branding" desc="Set default themes for each role across the platform." />

                    <div className="flex items-start gap-3 p-4 mb-6" style={{ backgroundColor: C.innerBg, border: `1px solid ${C.cardBorder}`, borderRadius: '10px' }}>
                        <MdAutoAwesome style={{ width: 20, height: 20, color: C.btnPrimary, flexShrink: 0, marginTop: '2px' }} />
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.text, lineHeight: T.leading.relaxed, margin: 0 }}>
                            Set <span style={{ fontWeight: T.weight.black, color: C.heading }}>Student</span> and <span style={{ fontWeight: T.weight.black, color: C.heading }}>Tutor</span> themes independently. Institute admins will see the Global Theme as a fallback but can customize their own panels (unless enforced).
                        </p>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-0 overflow-hidden" style={{ border: `1px solid ${C.cardBorder}`, borderRadius: '10px', backgroundColor: C.cardBg }}>
                        {/* Left: Tabs */}
                        <div className="w-full lg:w-64 shrink-0 flex flex-col gap-2 p-4 border-b lg:border-b-0 lg:border-r" style={{ borderColor: C.cardBorder, backgroundColor: C.innerBg }}>
                            {themeTabs.map(t => (
                                <ThemeTab key={t.key} active={activeThemeTab === t.key} onClick={() => setActiveThemeTab(t.key)}
                                    icon={t.icon} label={t.label} sublabel={t.sublabel} />
                            ))}

                            <div className="mt-4 pt-4 space-y-2" style={{ borderTop: `1px solid ${C.cardBorder}` }}>
                                <p style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.black, color: C.textMuted, textTransform: 'uppercase', letterSpacing: T.tracking.wider, padding: '0 8px', marginBottom: '8px' }}>Quick Sync Actions</p>
                                <button type="button" onClick={() => syncToGlobal('studentTheme')} className="w-full flex items-center gap-2 transition-colors cursor-pointer"
                                    style={{ padding: '10px 12px', fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.btnViewAllText, backgroundColor: C.btnViewAllBg, borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}>
                                    <MdSchool style={{ width: 14, height: 14 }} /> Copy Global → Student
                                </button>
                                <button type="button" onClick={() => syncToGlobal('tutorTheme')} className="w-full flex items-center gap-2 transition-colors cursor-pointer"
                                    style={{ padding: '10px 12px', fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.btnViewAllText, backgroundColor: C.btnViewAllBg, borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}>
                                    <MdPeople style={{ width: 14, height: 14 }} /> Copy Global → Tutor
                                </button>
                            </div>
                        </div>

                        {/* Right: Panel */}
                        <div className="flex-1 min-w-0" style={{ backgroundColor: C.cardBg }}>
                            {activeThemeTab === 'global' && (
                                <div>
                                    <div className="px-6 pt-5 pb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center justify-center shrink-0" style={{ width: 32, height: 32, backgroundColor: C.innerBg, borderRadius: '10px' }}><MdPublic style={{ width: 16, height: 16, color: C.btnPrimary }} /></div>
                                            <div>
                                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>Global Base Theme</p>
                                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.medium, color: C.textMuted, margin: 0 }}>Platform default reference styling</p>
                                            </div>
                                        </div>
                                    </div>
                                    <ThemePanel prefix="globalTheme" data={settings} onChange={handleChange} />
                                </div>
                            )}
                            {activeThemeTab === 'student' && (
                                <div>
                                    <div className="px-6 pt-5 pb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center justify-center shrink-0" style={{ width: 32, height: 32, backgroundColor: C.innerBg, borderRadius: '10px' }}><MdSchool style={{ width: 16, height: 16, color: C.btnPrimary }} /></div>
                                            <div>
                                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>Student Portal Theme</p>
                                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.medium, color: C.textMuted, margin: 0 }}>Default UI for learners</p>
                                            </div>
                                        </div>
                                    </div>
                                    <ThemePanel prefix="studentTheme" data={settings} onChange={handleChange} />
                                </div>
                            )}
                            {activeThemeTab === 'tutor' && (
                                <div>
                                    <div className="px-6 pt-5 pb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center justify-center shrink-0" style={{ width: 32, height: 32, backgroundColor: C.innerBg, borderRadius: '10px' }}><MdPeople style={{ width: 16, height: 16, color: C.btnPrimary }} /></div>
                                            <div>
                                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>Tutor Portal Theme</p>
                                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.medium, color: C.textMuted, margin: 0 }}>Default UI for instructors</p>
                                            </div>
                                        </div>
                                    </div>
                                    <ThemePanel prefix="tutorTheme" data={settings} onChange={handleChange} />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-6 space-y-4">
                        <div className="pt-4" style={{ borderTop: `1px solid ${C.cardBorder}` }}>
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <MdWbSunny style={{ width: 14, height: 14 }}/> Display Mode
                            </p>
                            <select name="enableDarkMode" value={settings.enableDarkMode ? 'enabled' : 'disabled'} onChange={(e) => setSettings(prev => ({ ...prev, enableDarkMode: e.target.value === 'enabled' }))}
                                style={{ ...baseInputStyle, width: '100%', maxWidth: '300px', cursor: 'pointer' }}>
                                <option value="enabled">Light & Dark Mode (Auto/Toggle)</option>
                                <option value="disabled">Force Light Mode Only</option>
                            </select>
                        </div>

                        <div className="pt-4" style={{ borderTop: `1px solid ${C.cardBorder}` }}>
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <MdBusiness style={{ width: 14, height: 14 }}/> Institute Permissions
                            </p>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <Toggle checked={settings.allowInstituteBranding} onChange={() => setSettings(prev => ({ ...prev, allowInstituteBranding: !prev.allowInstituteBranding }))} label="Allow Institute Branding" desc="Let institutes upload custom logos & colors" />
                                <Toggle checked={settings.enforceGlobalTheme} onChange={() => setSettings(prev => ({ ...prev, enforceGlobalTheme: !prev.enforceGlobalTheme }))} label="Enforce Global Theme" desc="Override all local institute customizations" />
                            </div>
                            {settings.enforceGlobalTheme && (
                                <div className="mt-4 flex items-center gap-2" style={{ padding: '12px 16px', backgroundColor: C.warningBg, border: `1px solid ${C.warningBorder}`, borderRadius: '10px' }}>
                                    <MdCheckCircle style={{ width: 16, height: 16, color: C.warning, flexShrink: 0 }} />
                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.warning, margin: 0 }}>Strict Mode Active: Institute admins cannot change colors or logos.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </Card>

            {/* ── BASIC INFO ── */}
            <Card>
                <div className="p-6">
                    <SectionHeader icon={MdPublic} title="Platform Information" desc="Configure public-facing details and metadata." />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                        <div>
                            <FieldLabel>Platform Name</FieldLabel>
                            <TextInput name="siteName" value={settings.siteName} onChange={handleChange} placeholder="e.g. Sapience LMS" />
                        </div>
                        <div>
                            <FieldLabel>Support Email Address</FieldLabel>
                            <TextInput name="contactEmail" value={settings.contactEmail} onChange={handleChange} placeholder="support@domain.com" />
                        </div>
                        <div>
                            <FieldLabel>Support Hotline</FieldLabel>
                            <TextInput name="supportPhone" value={settings.supportPhone} onChange={handleChange} placeholder="+1 (800) 123-4567" />
                        </div>
                        <div>
                            <FieldLabel>Corporate Address</FieldLabel>
                            <TextInput name="contactAddress" value={settings.contactAddress} onChange={handleChange} placeholder="123 Tech Park, Suite 400" />
                        </div>
                        <div>
                            <FieldLabel>Facebook URL</FieldLabel>
                            <TextInput name="facebookLink" value={settings.facebookLink} onChange={handleChange} placeholder="https://facebook.com/..." />
                        </div>
                        <div>
                            <FieldLabel>Twitter / X URL</FieldLabel>
                            <TextInput name="twitterLink" value={settings.twitterLink} onChange={handleChange} placeholder="https://x.com/..." />
                        </div>
                        <div className="md:col-span-2">
                            <FieldLabel>Footer Copyright Text</FieldLabel>
                            <TextInput name="footerText" value={settings.footerText} onChange={handleChange} placeholder="© 2026 Company. All rights reserved." />
                        </div>
                    </div>
                </div>
            </Card>

            {/* ── SYSTEM CONTROLS ── */}
            <Card>
                <div className="p-6">
                    <SectionHeader icon={MdSecurity} title="Danger Zone" desc="Critical system overrides." />
                    <div className="mt-4">
                        <Toggle
                            checked={settings.maintenanceMode}
                            onChange={() => setSettings(prev => ({ ...prev, maintenanceMode: !prev.maintenanceMode }))}
                            label="Enable Maintenance Mode"
                            desc="Locks out all Tutors and Students globally. Only Superadmins can log in." />
                    </div>
                </div>
            </Card>

        </div>
    );
}