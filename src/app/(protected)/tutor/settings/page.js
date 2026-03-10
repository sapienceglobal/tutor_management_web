'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    User, Mail, Phone, Lock, Bell, Shield, LogOut,
    Save, Loader2, Camera, MapPin, Globe, Briefcase,
    Award, TrendingUp, Star, CheckCircle,
    Sparkles, Settings as SettingsIcon, Trash2
} from 'lucide-react';
import Cookies from 'js-cookie';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';

const TABS = [
    { id: 'profile',       label: 'Public Profile',  icon: Sparkles },
    { id: 'account',       label: 'Account',          icon: SettingsIcon },
    { id: 'notifications', label: 'Notifications',    icon: Bell },
    { id: 'security',      label: 'Security',         icon: Lock },
];

const inp = "w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[var(--theme-primary)] focus:ring-2 focus:ring-[var(--theme-primary)]/10 transition-colors bg-white";

export default function TutorSettingsPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('profile');
    const [user, setUser]           = useState(null);
    const [loading, setLoading]     = useState(true);
    const [saving, setSaving]       = useState(false);

    const [formData, setFormData] = useState({
        name: '', phone: '', bio: '', title: '', location: '', website: ''
    });

    const [notifications, setNotifications] = useState({
        enrollment: true, reviews: true, summary: false, promotions: false
    });

    useEffect(() => { fetchProfile(); }, []);

    const fetchProfile = async () => {
        try {
            const userRes = await api.get('/auth/me');
            let userData = {};
            if (userRes.data.success) {
                userData = userRes.data.user;
                localStorage.setItem('user', JSON.stringify(userData));
                setUser(userData);
            }
            let tutorData = {};
            if (userData.role === 'tutor') {
                try {
                    const tutorRes = await api.get('/tutors/profile');
                    if (tutorRes.data.success) {
                        tutorData = tutorRes.data.tutor;
                        userData.tutorId = tutorData._id;
                        userData.tutor   = tutorData;
                        setUser(prev => ({ ...prev, tutorId: tutorData._id, tutor: tutorData }));
                    }
                } catch { /* new tutor */ }
            }
            setFormData({
                name: userData.name || '', phone: userData.phone || '',
                bio: tutorData.bio || '', title: tutorData.title || '',
                location: tutorData.location || '', website: tutorData.website || '',
            });
        } catch { toast.error('Failed to load profile'); }
        finally { setLoading(false); }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const p1 = api.patch('/auth/profile', { name: formData.name, phone: formData.phone });
            let p2   = Promise.resolve();
            if (user?.role === 'tutor' && user?.tutorId) {
                p2 = api.patch(`/tutors/${user.tutorId}`, {
                    bio: formData.bio, title: formData.title,
                    location: formData.location, website: formData.website,
                });
            }
            await Promise.all([p1, p2]);
            const updated = { ...user, name: formData.name, phone: formData.phone };
            setUser(updated);
            localStorage.setItem('user', JSON.stringify(updated));
            toast.success('Profile updated successfully!');
        } catch { toast.error('Failed to update profile.'); }
        finally { setSaving(false); }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        Cookies.remove('token');
        Cookies.remove('user_role');
        router.push('/login');
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3"
                style={{ fontFamily: "var(--theme-font, 'DM Sans', sans-serif)" }}>
                <Loader2 className="w-7 h-7 animate-spin" style={{ color: 'var(--theme-primary)' }} />
                <p className="text-sm text-slate-400">Loading settings...</p>
            </div>
        );
    }

    return (
        <div className="space-y-5" style={{ fontFamily: "var(--theme-font, 'DM Sans', sans-serif)" }}>

            {/* ── Page Header ─────────────────────────────────────────── */}
            <div className="bg-white rounded-xl border border-slate-100 px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 12%, white)', border: '1px solid color-mix(in srgb, var(--theme-primary) 20%, white)' }}>
                        <SettingsIcon className="w-4 h-4" style={{ color: 'var(--theme-primary)' }} />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-slate-800">Account Settings</h1>
                        <p className="text-xs text-slate-400">Manage your profile, notifications and security</p>
                    </div>
                </div>
                <button onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors">
                    <LogOut className="w-4 h-4" /> Sign Out
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

                {/* ── LEFT SIDEBAR ──────────────────────────────────── */}
                <div className="lg:col-span-4 space-y-4">

                    {/* Profile Card */}
                    <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                        <div className="h-20 relative" style={{ backgroundColor: 'var(--theme-sidebar)' }}>
                            <div className="absolute -top-6 -right-6 w-36 h-36 rounded-full blur-3xl opacity-20"
                                style={{ backgroundColor: 'var(--theme-primary)' }} />
                        </div>
                        <div className="px-5 pb-5 -mt-10 flex flex-col items-center text-center">
                            <div className="relative mb-3">
                                <div className="w-[72px] h-[72px] rounded-2xl border-4 border-white shadow-lg overflow-hidden"
                                    style={{ background: 'linear-gradient(135deg, var(--theme-sidebar), var(--theme-primary))' }}>
                                    {user?.profileImage
                                        ? <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
                                        : <div className="w-full h-full flex items-center justify-center">
                                            <User className="w-8 h-8 text-white" />
                                          </div>}
                                </div>
                                <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center text-white shadow"
                                    style={{ backgroundColor: 'var(--theme-primary)' }}>
                                    <Camera className="w-3.5 h-3.5" />
                                </button>
                            </div>
                            <h2 className="text-base font-bold text-slate-900">{user?.name}</h2>
                            <p className="text-xs text-slate-500 mt-0.5">{user?.email}</p>
                            <span className="mt-2 text-[10px] px-3 py-1 rounded-full font-bold text-white"
                                style={{ background: 'linear-gradient(135deg, var(--theme-sidebar), var(--theme-primary))' }}>
                                Professional Tutor
                            </span>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="bg-white rounded-xl border border-slate-100 p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <TrendingUp className="w-4 h-4" style={{ color: 'var(--theme-primary)' }} />
                            <h3 className="text-sm font-bold text-slate-800">Quick Stats</h3>
                        </div>
                        <div className="space-y-2.5">
                            {[
                                { label: 'Courses Created', value: user?.tutor?.courseCount  || 0,   icon: Award, color: 'text-blue-500',    bg: 'bg-blue-50' },
                                { label: 'Total Students',  value: user?.tutor?.studentsCount || 0,  icon: User,  color: 'text-emerald-600', bg: 'bg-emerald-50' },
                                { label: 'Avg Rating',      value: user?.tutor?.rating?.toFixed(1) || '0.0', icon: Star, color: 'text-amber-500', bg: 'bg-amber-50' },
                            ].map(({ label, value, icon: Icon, color, bg }) => (
                                <div key={label} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                                    <div className="flex items-center gap-2.5">
                                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${bg}`}>
                                            <Icon className={`w-3.5 h-3.5 ${color}`} />
                                        </div>
                                        <span className="text-xs font-medium text-slate-600">{label}</span>
                                    </div>
                                    <span className={`text-sm font-black ${color}`}>{value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Account Status */}
                    <div className="bg-white rounded-xl border border-slate-100 p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <Shield className="w-4 h-4 text-emerald-500" />
                            <h3 className="text-sm font-bold text-slate-800">Account Status</h3>
                        </div>
                        <div className="space-y-3 text-xs">
                            <div className="flex items-center justify-between">
                                <span className="text-slate-500">Plan</span>
                                <span className="font-bold" style={{ color: 'var(--theme-primary)' }}>Pro Tutor</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-slate-500">Member Since</span>
                                <span className="font-bold text-slate-700">Jan 2024</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-slate-500">Verification</span>
                                <span className="font-bold text-emerald-600 flex items-center gap-1">
                                    <CheckCircle className="w-3.5 h-3.5" /> Verified
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── RIGHT MAIN ────────────────────────────────────── */}
                <div className="lg:col-span-8 space-y-4">

                    {/* Tab Nav */}
                    <div className="bg-white rounded-xl border border-slate-100 flex overflow-x-auto">
                        {TABS.map(({ id, label, icon: Icon }) => (
                            <button key={id} onClick={() => setActiveTab(id)}
                                className="flex items-center gap-1.5 px-5 py-3.5 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors flex-1 justify-center"
                                style={activeTab === id
                                    ? { borderColor: 'var(--theme-primary)', color: 'var(--theme-primary)' }
                                    : { borderColor: 'transparent', color: '#94a3b8' }}>
                                <Icon className="w-4 h-4" /> {label}
                            </button>
                        ))}
                    </div>

                    {/* ── PUBLIC PROFILE ──────────────────────────── */}
                    {activeTab === 'profile' && (
                        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                                <h2 className="text-sm font-bold text-slate-800">Basic Information</h2>
                                <p className="text-xs text-slate-400 mt-0.5">Displayed publicly on your profile page.</p>
                            </div>
                            <div className="p-6 space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-500">Full Name</label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                            <input className={`${inp} pl-9`} value={formData.name}
                                                onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-500">Professional Title</label>
                                        <div className="relative">
                                            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                            <input className={`${inp} pl-9`} placeholder="e.g. Senior Math Instructor"
                                                value={formData.title}
                                                onChange={e => setFormData({ ...formData, title: e.target.value })} />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500">Bio</label>
                                    <textarea rows={4} placeholder="Write a short bio about your teaching experience..."
                                        className={`${inp} resize-none`} value={formData.bio}
                                        onChange={e => setFormData({ ...formData, bio: e.target.value })} />
                                    <p className="text-[11px] text-slate-400">Max 500 characters</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-500">Location</label>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                            <input className={`${inp} pl-9`} placeholder="City, Country"
                                                value={formData.location}
                                                onChange={e => setFormData({ ...formData, location: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-slate-500">Website</label>
                                        <div className="relative">
                                            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                            <input className={`${inp} pl-9`} placeholder="https://..."
                                                value={formData.website}
                                                onChange={e => setFormData({ ...formData, website: e.target.value })} />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-end pt-2 border-t border-slate-100">
                                    <button onClick={handleSave} disabled={saving}
                                        className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition-opacity disabled:opacity-60"
                                        style={{ backgroundColor: 'var(--theme-primary)' }}>
                                        {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : <><Save className="w-4 h-4" />Save Changes</>}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── ACCOUNT ─────────────────────────────────── */}
                    {activeTab === 'account' && (
                        <div className="space-y-4">
                            <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                                    <h2 className="text-sm font-bold text-slate-800">Contact Information</h2>
                                    <p className="text-xs text-slate-400 mt-0.5">Manage how we contact you</p>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-slate-500">Email Address</label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                <input disabled value={user?.email || ''}
                                                    className="w-full px-3.5 py-2.5 pl-9 text-sm border border-slate-200 rounded-xl bg-slate-100 text-slate-400 cursor-not-allowed" />
                                            </div>
                                            <p className="text-[11px] text-slate-400">Email cannot be changed</p>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-slate-500">Phone Number</label>
                                            <div className="relative">
                                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                <input className={`${inp} pl-9`} value={formData.phone}
                                                    onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex justify-end pt-2 border-t border-slate-100">
                                        <button onClick={handleSave} disabled={saving}
                                            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition-opacity disabled:opacity-60"
                                            style={{ backgroundColor: 'var(--theme-primary)' }}>
                                            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                                            Update Contact Info
                                        </button>
                                    </div>
                                </div>
                            </div>
                            {/* Danger Zone */}
                            <div className="bg-white rounded-xl border-2 border-red-200 overflow-hidden">
                                <div className="px-6 py-4 border-b border-red-100 bg-red-50/50 flex items-center gap-2">
                                    <Trash2 className="w-4 h-4 text-red-500" />
                                    <h2 className="text-sm font-bold text-red-700">Danger Zone</h2>
                                </div>
                                <div className="p-6 flex items-center justify-between gap-6">
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-800">Delete Account</h4>
                                        <p className="text-xs text-slate-500 mt-0.5">Permanently remove your account and all data. This cannot be undone.</p>
                                    </div>
                                    <button className="px-4 py-2 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors flex-shrink-0">
                                        Delete Account
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── NOTIFICATIONS ───────────────────────────── */}
                    {activeTab === 'notifications' && (
                        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                                <h2 className="text-sm font-bold text-slate-800">Email Notifications</h2>
                                <p className="text-xs text-slate-400 mt-0.5">Choose what updates you want to receive</p>
                            </div>
                            <div className="divide-y divide-slate-50">
                                {[
                                    { key: 'enrollment', label: 'New student enrollment', desc: 'When a student enrolls in your course', icon: User },
                                    { key: 'reviews',    label: 'Course review received',  desc: 'When a student leaves a review',       icon: Star },
                                    { key: 'summary',    label: 'Daily summary',           desc: 'Daily digest of your course activity', icon: TrendingUp },
                                    { key: 'promotions', label: 'Promotional offers',      desc: 'Platform offers and announcements',    icon: Sparkles },
                                ].map(({ key, label, desc, icon: Icon }) => (
                                    <div key={key} className="flex items-center justify-between px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                                                style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 10%, white)' }}>
                                                <Icon className="w-4 h-4" style={{ color: 'var(--theme-primary)' }} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-700">{label}</p>
                                                <p className="text-[11px] text-slate-400">{desc}</p>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                                            <input type="checkbox" className="sr-only peer"
                                                checked={notifications[key]}
                                                onChange={() => setNotifications(n => ({ ...n, [key]: !n[key] }))} />
                                            <div className="w-10 h-5 bg-slate-200 rounded-full peer transition-colors
                                                peer-checked:bg-[var(--theme-primary)]
                                                after:content-[''] after:absolute after:top-[2px] after:left-[2px]
                                                after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all
                                                peer-checked:after:translate-x-5 after:border after:border-slate-200" />
                                        </label>
                                    </div>
                                ))}
                            </div>
                            <div className="px-6 py-4 border-t border-slate-100">
                                <button className="px-5 py-2.5 text-sm font-semibold text-white rounded-xl"
                                    style={{ backgroundColor: 'var(--theme-primary)' }}>
                                    Save Preferences
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── SECURITY ────────────────────────────────── */}
                    {activeTab === 'security' && (
                        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                                <h2 className="text-sm font-bold text-slate-800">Change Password</h2>
                                <p className="text-xs text-slate-400 mt-0.5">Keep your account secure with a strong password</p>
                            </div>
                            <div className="p-6">
                                <SecuritySettings hasPassword={user?.hasPassword} />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function SecuritySettings({ hasPassword }) {
    const [loading, setLoading]     = useState(false);
    const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

    const pinp = "w-full px-3.5 py-2.5 pl-10 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[var(--theme-primary)] focus:ring-2 focus:ring-[var(--theme-primary)]/10 transition-colors";

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (passwords.newPassword !== passwords.confirmPassword) { toast.error("New passwords don't match"); return; }
        if (passwords.newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
        setLoading(true);
        try {
            if (hasPassword) {
                await api.post('/auth/change-password', { currentPassword: passwords.currentPassword, newPassword: passwords.newPassword });
                toast.success('Password changed successfully');
            } else {
                await api.post('/auth/set-password', { newPassword: passwords.newPassword });
                toast.success('Password set successfully');
                window.location.reload();
            }
            setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) { toast.error(error.response?.data?.message || 'Failed to update password'); }
        finally { setLoading(false); }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
            {hasPassword && (
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">Current Password</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input type="password" required className={pinp}
                            value={passwords.currentPassword}
                            onChange={e => setPasswords(p => ({ ...p, currentPassword: e.target.value }))} />
                    </div>
                </div>
            )}
            <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">{hasPassword ? 'New Password' : 'Create Password'}</label>
                <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input type="password" required placeholder="Min 6 characters" className={pinp}
                        value={passwords.newPassword}
                        onChange={e => setPasswords(p => ({ ...p, newPassword: e.target.value }))} />
                </div>
            </div>
            <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Confirm Password</label>
                <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input type="password" required className={pinp}
                        value={passwords.confirmPassword}
                        onChange={e => setPasswords(p => ({ ...p, confirmPassword: e.target.value }))} />
                </div>
            </div>
            <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white rounded-xl transition-opacity disabled:opacity-60"
                style={{ backgroundColor: 'var(--theme-primary)' }}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {hasPassword ? 'Update Password' : 'Set Password'}
            </button>
        </form>
    );
}