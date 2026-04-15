'use client';

import { useState, useEffect } from 'react';
import {
    Save, Loader2, Palette, Globe, Mail, MapPin, Phone,
    Type, Sun, Building, GraduationCap, Users, Sparkles, CheckCircle,
    Shield
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
    primaryColor: '#6B4DF1',
    secondaryColor: '#F8F6FC',
    accentColor: '#8B5CF6',
    sidebarColor: '#27225B',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '14',
};

const softShadow = '0px 8px 30px -10px rgba(112, 128, 176, 0.12)';

// ─── UI Atoms ────────────────────────────────────────────────────────────────
function Card({ children, className = '' }) {
    return (
        <div className={`bg-white rounded-[24px] border border-[#E9DFFC]/80 overflow-hidden ${className}`} style={{ boxShadow: softShadow }}>
            {children}
        </div>
    );
}

function CardHead({ icon: Icon, color, title, desc }) {
    return (
        <div className="flex items-center gap-4 px-6 py-5 border-b border-[#F4F0FD] bg-[#FDFBFF]">
            <div className={`p-2.5 rounded-xl ${color}`}><Icon className="w-5 h-5" /></div>
            <div>
                <h2 className="text-[16px] font-black text-[#27225B] m-0">{title}</h2>
                {desc && <p className="text-[12px] text-[#7D8DA6] font-medium m-0 mt-0.5">{desc}</p>}
            </div>
        </div>
    );
}

function Toggle({ checked, onChange, label, desc }) {
    return (
        <div className="flex items-center justify-between p-4 border border-[#E9DFFC] rounded-2xl bg-white hover:border-[#D5C2F6] hover:bg-[#F9F7FC] transition-all cursor-pointer" onClick={onChange}>
            <div>
                <p className="text-[13px] font-black text-[#27225B] m-0">{label}</p>
                {desc && <p className="text-[11px] text-[#7D8DA6] font-medium mt-1 m-0">{desc}</p>}
            </div>
            <button type="button" 
                className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ml-4 border-none cursor-pointer ${checked ? 'bg-[#10B981]' : 'bg-gray-200'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${checked ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
        </div>
    );
}

function FieldLabel({ children }) {
    return <label className="block text-[11px] font-bold text-[#7D8DA6] uppercase tracking-wider mb-1.5">{children}</label>;
}

function TextInput({ name, value, onChange, type = 'text', placeholder = '', className = '' }) {
    return (
        <input type={type} name={name} value={value || ''} onChange={onChange} placeholder={placeholder}
            className={`w-full px-4 py-3 bg-[#F8F6FC] border border-[#E9DFFC] rounded-xl text-[13px] font-semibold text-[#27225B] focus:outline-none focus:ring-2 focus:ring-[#6B4DF1] transition-all placeholder:text-[#A0ABC0] ${className}`} />
    );
}

// ─── Color Field ─────────────────────────────────────────────────────────────
function ColorField({ label, name, value, onChange }) {
    return (
        <div>
            <FieldLabel>{label}</FieldLabel>
            <div className="flex items-center gap-2">
                <div className="relative w-12 h-12 rounded-xl border border-[#E9DFFC] overflow-hidden shrink-0 shadow-sm cursor-pointer">
                    <input type="color" name={name} value={value || '#000000'} onChange={onChange}
                        className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer border-none bg-transparent" />
                </div>
                <input type="text" name={name} value={value || ''} onChange={onChange} maxLength={7}
                    className="flex-1 px-4 py-3 border border-[#E9DFFC] bg-[#F8F6FC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6B4DF1] font-mono text-[13px] font-bold text-[#27225B] uppercase transition-all" />
            </div>
        </div>
    );
}

// ─── Mini Preview ─────────────────────────────────────────────────────────────
function ThemePreview({ primary, secondary, sidebar, accent }) {
    return (
        <div className="rounded-2xl overflow-hidden border border-[#E9DFFC] shadow-sm mb-6 bg-white">
            <div className="text-[10px] font-black uppercase tracking-wider text-[#A0ABC0] px-4 py-2 bg-[#F9F7FC] border-b border-[#E9DFFC] flex items-center justify-between">
                <span>Live Component Preview</span>
                <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-400"></div>
                    <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                    <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
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
                        <div className="h-2 w-20 rounded-full bg-slate-200" />
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
        <div className="space-y-4 p-6 bg-white rounded-br-2xl">
            <ThemePreview
                primary={get('primaryColor')} secondary={get('secondaryColor')}
                sidebar={get('sidebarColor')} accent={get('accentColor')} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <ColorField label="Primary Color" name="primaryColor" value={get('primaryColor')} onChange={handle} />
                <ColorField label="Secondary Bg" name="secondaryColor" value={get('secondaryColor')} onChange={handle} />
                <ColorField label="Sidebar Bg" name="sidebarColor" value={get('sidebarColor')} onChange={handle} />
                <ColorField label="Accent Highlights" name="accentColor" value={get('accentColor')} onChange={handle} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4 border-t border-[#F4F0FD] mt-4">
                <div>
                    <FieldLabel>Typography (Font Family)</FieldLabel>
                    <select name="fontFamily" value={get('fontFamily')} onChange={handle}
                        className="w-full h-[46px] px-4 border border-[#E9DFFC] rounded-xl text-[13px] font-semibold bg-[#F8F6FC] text-[#27225B] focus:outline-none focus:ring-2 focus:ring-[#6B4DF1] outline-none">
                        {FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                    </select>
                </div>
                <div>
                    <FieldLabel>Base Font Size (px)</FieldLabel>
                    <input type="number" name="fontSize" value={get('fontSize')} onChange={handle}
                        min="12" max="20" placeholder="14"
                        className="w-full px-4 py-3 bg-[#F8F6FC] border border-[#E9DFFC] rounded-xl font-mono text-[13px] font-bold text-[#27225B] focus:outline-none focus:ring-2 focus:ring-[#6B4DF1]" />
                </div>
            </div>
        </div>
    );
}

// ─── Tab Button ───────────────────────────────────────────────────────────────
function ThemeTab({ active, onClick, icon: Icon, iconBg, label, sublabel }) {
    return (
        <button type="button" onClick={onClick}
            className={`flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-left transition-all border cursor-pointer w-full
                ${active
                    ? 'bg-white border-[#E9DFFC] shadow-sm ring-1 ring-[#6B4DF1]/20'
                    : 'bg-transparent border-transparent hover:bg-white/50'}`}>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
                <Icon className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0 flex-1">
                <p className={`text-[13px] font-black truncate m-0 ${active ? 'text-[#27225B]' : 'text-[#7D8DA6]'}`}>{label}</p>
                <p className="text-[10px] font-medium text-[#A0ABC0] truncate m-0 mt-0.5">{sublabel}</p>
            </div>
            {active && <div className="ml-auto w-2 h-2 rounded-full bg-[#6B4DF1] shrink-0" />}
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
                refreshGlobalTheme();
                toast.success('Global settings saved successfully!');
            }
        } catch { toast.error('Failed to save settings'); } 
        finally { setSaving(false); }
    };

    if (loading) return <div className="flex h-screen items-center justify-center bg-[#F4EEFD]"><Loader2 className="w-10 h-10 animate-spin text-[#6B4DF1]" /></div>;

    const themeTabs = [
        { key: 'global', label: 'Global Theme', sublabel: 'Default for all institutes', icon: Globe, iconBg: 'bg-[#27225B]' },
        { key: 'student', label: 'Student Theme', sublabel: 'Default student panel', icon: GraduationCap, iconBg: 'bg-[#4ABCA8]' },
        { key: 'tutor', label: 'Tutor Theme', sublabel: 'Default tutor panel', icon: Users, iconBg: 'bg-[#FC8730]' },
    ];

    return (
        <div className="min-h-screen p-6 md:p-8 space-y-6 pb-24" style={{ backgroundColor: '#F4EEFD', fontFamily: "'Inter', sans-serif" }}>

            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                <div>
                    <h1 className="text-[24px] font-black text-[#27225B] m-0">Platform Settings</h1>
                    <p className="text-[13px] font-medium text-[#7D8DA6] m-0 mt-1">Configure global branding, themes, and system operations.</p>
                </div>
                <button type="button" onClick={handleSave} disabled={saving}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-[#6B4DF1] hover:bg-[#5839D6] text-white text-[13px] font-bold rounded-xl transition-all shadow-[0_4px_14px_rgba(107,77,241,0.3)] disabled:opacity-60 border-none cursor-pointer">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save All Changes
                </button>
            </div>

            {/* ── THEME & BRANDING ── */}
            <Card>
                <CardHead icon={Palette} color="bg-[#F4F0FD] text-[#6B4DF1]" title="Theme & Custom Branding" desc="Set default themes for each role across the platform." />

                <div className="m-6 mb-2 flex items-start gap-3 p-4 bg-[#F4F0FD] border border-[#E9DFFC] rounded-2xl">
                    <Sparkles className="w-5 h-5 text-[#6B4DF1] shrink-0 mt-0.5" />
                    <p className="text-[13px] text-[#4A5568] font-medium leading-relaxed m-0">
                        Set <span className="font-black text-[#27225B]">Student</span> and <span className="font-black text-[#27225B]">Tutor</span> themes independently. Institute admins will see the Global Theme as a fallback but can customize their own panels (unless enforced).
                    </p>
                </div>

                <div className="flex flex-col lg:flex-row gap-0 mt-4 mx-6 mb-6 rounded-2xl border border-[#E9DFFC] bg-[#F9F7FC] overflow-hidden">
                    {/* Left: Tabs */}
                    <div className="w-full lg:w-64 shrink-0 flex flex-col gap-2 p-4 border-b lg:border-b-0 lg:border-r border-[#E9DFFC]">
                        {themeTabs.map(t => (
                            <ThemeTab key={t.key} active={activeThemeTab === t.key} onClick={() => setActiveThemeTab(t.key)}
                                icon={t.icon} iconBg={t.iconBg} label={t.label} sublabel={t.sublabel} />
                        ))}

                        <div className="mt-4 pt-4 border-t border-[#E9DFFC] space-y-2">
                            <p className="text-[10px] font-black text-[#A0ABC0] uppercase tracking-wider px-2 mb-2">Quick Sync Actions</p>
                            <button type="button" onClick={() => syncToGlobal('studentTheme')} className="w-full flex items-center gap-2 px-3 py-2.5 text-[12px] font-bold text-[#4ABCA8] hover:bg-white bg-transparent rounded-xl border border-[#A7F3D0] transition-colors cursor-pointer">
                                <GraduationCap size={14} /> Copy Global → Student
                            </button>
                            <button type="button" onClick={() => syncToGlobal('tutorTheme')} className="w-full flex items-center gap-2 px-3 py-2.5 text-[12px] font-bold text-[#FC8730] hover:bg-white bg-transparent rounded-xl border border-[#FDBA74] transition-colors cursor-pointer">
                                <Users size={14} /> Copy Global → Tutor
                            </button>
                        </div>
                    </div>

                    {/* Right: Panel */}
                    <div className="flex-1 min-w-0 bg-white">
                        {activeThemeTab === 'global' && (
                            <div>
                                <div className="px-6 pt-5 pb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-[#27225B] rounded-lg flex items-center justify-center"><Globe size={16} className="text-white" /></div>
                                        <div>
                                            <p className="text-[15px] font-black text-[#27225B] m-0">Global Base Theme</p>
                                            <p className="text-[11px] text-[#7D8DA6] font-medium m-0">Platform default reference styling</p>
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
                                        <div className="w-8 h-8 bg-[#4ABCA8] rounded-lg flex items-center justify-center"><GraduationCap size={16} className="text-white" /></div>
                                        <div>
                                            <p className="text-[15px] font-black text-[#27225B] m-0">Student Portal Theme</p>
                                            <p className="text-[11px] text-[#7D8DA6] font-medium m-0">Default UI for learners</p>
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
                                        <div className="w-8 h-8 bg-[#FC8730] rounded-lg flex items-center justify-center"><Users size={16} className="text-white" /></div>
                                        <div>
                                            <p className="text-[15px] font-black text-[#27225B] m-0">Tutor Portal Theme</p>
                                            <p className="text-[11px] text-[#7D8DA6] font-medium m-0">Default UI for instructors</p>
                                        </div>
                                    </div>
                                </div>
                                <ThemePanel prefix="tutorTheme" data={settings} onChange={handleChange} />
                            </div>
                        )}
                    </div>
                </div>

                <div className="mx-6 mb-6 space-y-4">
                    <div className="pt-4 border-t border-[#F4F0FD]">
                        <p className="text-[11px] font-bold text-[#A0ABC0] uppercase tracking-wider mb-3 flex items-center gap-1.5"><Sun size={14}/> Display Mode</p>
                        <select name="enableDarkMode" value={settings.enableDarkMode ? 'enabled' : 'disabled'} onChange={(e) => setSettings(prev => ({ ...prev, enableDarkMode: e.target.value === 'enabled' }))}
                            className="w-full sm:w-[300px] h-[46px] px-4 border border-[#E9DFFC] rounded-xl text-[13px] font-bold bg-[#F8F6FC] text-[#27225B] focus:outline-none focus:ring-2 focus:ring-[#6B4DF1] outline-none">
                            <option value="enabled">Light & Dark Mode (Auto/Toggle)</option>
                            <option value="disabled">Force Light Mode Only</option>
                        </select>
                    </div>

                    <div className="pt-4 border-t border-[#F4F0FD]">
                        <p className="text-[11px] font-bold text-[#A0ABC0] uppercase tracking-wider mb-3 flex items-center gap-1.5"><Building size={14}/> Institute Permissions</p>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <Toggle checked={settings.allowInstituteBranding} onChange={() => setSettings(prev => ({ ...prev, allowInstituteBranding: !prev.allowInstituteBranding }))} label="Allow Institute Branding" desc="Let institutes upload custom logos & colors" />
                            <Toggle checked={settings.enforceGlobalTheme} onChange={() => setSettings(prev => ({ ...prev, enforceGlobalTheme: !prev.enforceGlobalTheme }))} label="Enforce Global Theme" desc="Override all local institute customizations" />
                        </div>
                        {settings.enforceGlobalTheme && (
                            <div className="mt-3 flex items-center gap-2 px-4 py-3 bg-[#FFF7ED] border border-[#FFEDD5] rounded-xl">
                                <CheckCircle className="w-4 h-4 text-[#EA580C] shrink-0" />
                                <p className="text-[12px] font-bold text-[#C2410C] m-0">Strict Mode Active: Institute admins cannot change colors or logos.</p>
                            </div>
                        )}
                    </div>
                </div>
            </Card>

            {/* ── BASIC INFO ── */}
            <Card>
                <CardHead icon={Globe} color="bg-[#EBF8FF] text-[#3182CE]" title="Platform Information" desc="Configure public-facing details and metadata." />
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
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
            </Card>

            {/* ── SYSTEM CONTROLS ── */}
            <Card>
                <CardHead icon={Shield} color="bg-[#FEE2E2] text-[#E53E3E]" title="Danger Zone" desc="Critical system overrides." />
                <div className="p-6">
                    <Toggle
                        checked={settings.maintenanceMode}
                        onChange={() => setSettings(prev => ({ ...prev, maintenanceMode: !prev.maintenanceMode }))}
                        label="Enable Maintenance Mode"
                        desc="Locks out all Tutors and Students globally. Only Superadmins can log in." />
                </div>
            </Card>

        </div>
    );
}