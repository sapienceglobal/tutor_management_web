'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    MdAutoAwesome, MdSettings, MdNotifications, MdLock,
    MdHourglassEmpty, MdLogout, MdPhotoCamera, MdEmojiEvents,
    MdPeople, MdSave
} from 'react-icons/md';
import Cookies from 'js-cookie';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { C, T, S, R } from '@/constants/studentTokens';

const TABS = [
    { id: 'profile',       label: 'Public Profile',  icon: MdAutoAwesome },
    { id: 'account',       label: 'Account',         icon: MdSettings },
    { id: 'notifications', label: 'Notifications',    icon: MdNotifications },
    { id: 'security',      label: 'Security',         icon: MdLock },
];

// Focus Handlers
const onFocusHandler = e => {
    e.target.style.borderColor = C.btnPrimary;
    e.target.style.boxShadow = `0 0 0 3px ${C.btnPrimary}30`;
};
const onBlurHandler = e => {
    e.target.style.borderColor = C.cardBorder;
    e.target.style.boxShadow = 'none';
};

const baseInputStyle = {
    backgroundColor: C.innerBg,
    border: `1.5px solid ${C.cardBorder}`,
    borderRadius: '10px',
    color: C.heading,
    fontFamily: T.fontFamily,
    fontSize: T.size.sm,
    fontWeight: T.weight.semibold,
    outline: 'none',
    width: '100%',
    padding: '12px 16px',
    transition: 'all 0.2s ease',
};

export default function TutorSettingsPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('profile');
    const [user, setUser]           = useState(null);
    const [loading, setLoading]     = useState(true);
    const [saving, setSaving]       = useState(false);
    const [savingNotifications, setSavingNotifications] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);

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
            if (userRes.data?.success) {
                userData = userRes.data.user;
                setUser(userData);
            }
            let tutorData = {};
            if (userData.role === 'tutor') {
                try {
                    const tutorRes = await api.get('/tutors/profile');
                    if (tutorRes.data?.success) {
                        tutorData = tutorRes.data.tutor;
                        setUser(prev => ({ ...prev, tutorId: tutorData._id, tutor: tutorData }));
                    }
                } catch { /* new tutor */ }
            }
            setFormData({
                name: userData.name || '', phone: userData.phone || '',
                bio: tutorData.bio || '', title: tutorData.title || '',
                location: tutorData.location || '', website: tutorData.website || '',
            });

            setNotifications(tutorData.notificationPreferences || {
                enrollment: userData.notificationSettings?.email !== false,
                reviews: userData.notificationSettings?.push !== false,
                summary: userData.notificationSettings?.sms === true,
                promotions: false,
            });
        } catch { toast.error('Failed to load profile'); }
        finally { setLoading(false); }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const p1 = api.patch('/auth/profile', { name: formData.name, phone: formData.phone });
            let p2 = Promise.resolve(null);
            if (user?.role === 'tutor' && user?.tutorId) {
                p2 = api.patch(`/tutors/${user.tutorId}`, {
                    bio: formData.bio, title: formData.title,
                    location: formData.location, website: formData.website,
                });
            }
            const [userRes, tutorRes] = await Promise.all([p1, p2]);
            const updated = {
                ...user,
                ...(userRes.data?.user || {}),
                ...(tutorRes?.data?.tutor ? { tutor: tutorRes.data.tutor } : {}),
            };
            setUser(updated);
            localStorage.setItem('user', JSON.stringify(updated));
            toast.success('Profile updated successfully!');
        } catch { toast.error('Failed to update profile.'); }
        finally { setSaving(false); }
    };

    const handleSaveNotifications = async () => {
        setSavingNotifications(true);
        try {
            if (user?.role === 'tutor' && user?.tutorId) {
                await api.patch(`/tutors/${user.tutorId}`, { notificationPreferences: notifications });
            } else {
                await api.patch('/auth/notification-settings', {
                    email: notifications.enrollment || notifications.reviews,
                    push: notifications.summary,
                    sms: notifications.promotions,
                });
            }
            toast.success('Notification preferences saved');
        } catch { toast.error('Failed to save preferences'); }
        finally { setSavingNotifications(false); }
    };

    const handleProfileImageUpload = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setUploadingImage(true);
        try {
            const uploadData = new FormData();
            uploadData.append('image', file);
            const uploadRes = await api.post('/upload/image', uploadData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            const profileRes = await api.patch('/auth/profile-image', {
                profileImage: uploadRes.data.imageUrl,
                cloudinaryId: uploadRes.data.cloudinaryId,
            });
            setUser(prev => ({ ...prev, profileImage: uploadRes.data.imageUrl }));
            toast.success('Profile photo updated');
        } catch { toast.error('Upload failed'); }
        finally { setUploadingImage(false); }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        Cookies.remove('token');
        router.push('/login');
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-3 w-full" style={{ backgroundColor: C.pageBg, fontFamily: T.fontFamily }}>
                <MdHourglassEmpty className="animate-spin" style={{ color: C.btnPrimary, width: '28px', height: '28px' }} />
                <p style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.bold }}>Loading settings...</p>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen space-y-6" style={{ backgroundColor: C.pageBg, fontFamily: T.fontFamily, color: C.text }}>

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 flex items-center justify-center shrink-0" style={{ backgroundColor: C.iconBg, borderRadius: '10px' }}>
                        <MdSettings size={24} color={C.iconColor} />
                    </div>
                    <div>
                        <h1 style={{ color: C.heading, fontSize: T.size.xl, fontWeight: T.weight.black, margin: '0 0 2px 0' }}>Account Settings</h1>
                        <p style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.medium, margin: 0 }}>Manage your profile, notifications and security</p>
                    </div>
                </div>
                <button onClick={handleLogout} className="flex items-center justify-center gap-2 h-11 px-6 cursor-pointer border-none transition-opacity hover:opacity-80 shadow-sm w-full sm:w-auto"
                    style={{ backgroundColor: C.dangerBg, color: C.danger, borderRadius: '10px', fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily, border: `1px solid ${C.dangerBorder}` }}>
                    <MdLogout size={18} /> Sign Out
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* ── Left Sidebar ──────────────────────────────────── */}
                <div className="lg:col-span-4 space-y-6 animate-in fade-in duration-500 delay-100">
                    <div className="overflow-hidden" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                        <div className="h-24 relative" style={{ backgroundColor: C.innerBg }} />
                        <div className="px-6 pb-6 relative">
                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full border-4 shadow-md overflow-hidden flex items-center justify-center text-white font-black text-3xl"
                                style={{ background: C.gradientBtn, borderColor: C.cardBg }}>
                                {user?.profileImage
                                    ? <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
                                    : user?.name?.charAt(0)?.toUpperCase()
                                }
                                <button className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer border-none"
                                    onClick={() => document.getElementById('image-upload').click()} disabled={uploadingImage}>
                                    <MdPhotoCamera size={28} color="#fff" />
                                </button>
                                <input id="image-upload" type="file" className="hidden" accept="image/*" onChange={handleProfileImageUpload} />
                            </div>
                            <div className="h-14" />
                            <div className="text-center">
                                <h2 style={{ fontSize: T.size.lg, fontWeight: T.weight.black, color: C.heading, margin: '0 0 4px 0' }}>{user?.name}</h2>
                                <p style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, margin: '0 0 20px 0' }}>{user?.email}</p>
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center justify-between p-3.5 transition-colors hover:bg-white/40" style={{ backgroundColor: C.innerBg, borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}>
                                        <div className="flex items-center gap-2"><MdEmojiEvents size={18} color={C.btnPrimary} /><span style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>Courses</span></div>
                                        <span style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading }}>{user?.tutor?.courseCount || 0}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3.5 transition-colors hover:bg-white/40" style={{ backgroundColor: C.innerBg, borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}>
                                        <div className="flex items-center gap-2"><MdPeople size={18} color={C.btnPrimary} /><span style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>Learners</span></div>
                                        <span style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading }}>{user?.tutor?.studentsCount || 0}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Desktop Tab List */}
                    <div className="hidden lg:flex flex-col gap-2 p-2" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                        {TABS.map(tab => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className="flex items-center gap-3 h-12 px-5 cursor-pointer border-none transition-all"
                                style={{
                                    backgroundColor: activeTab === tab.id ? C.btnPrimary : 'transparent',
                                    color: activeTab === tab.id ? '#ffffff' : C.textMuted,
                                    borderRadius: '10px', boxShadow: activeTab === tab.id ? S.card : 'none',
                                    fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily
                                }}>
                                <tab.icon size={18} /> {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Right Main ────────────────────────────────────── */}
                <div className="lg:col-span-8 animate-in fade-in duration-500 delay-200">
                    
                    {/* Public Profile Tab */}
                    {activeTab === 'profile' && (
                        <div className="p-6 space-y-6" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                            <div className="pb-4 border-b" style={{ borderColor: C.cardBorder }}>
                                <h2 style={{ fontSize: T.size.lg, fontWeight: T.weight.black, color: C.heading, margin: '0 0 4px 0' }}>Public Profile</h2>
                                <p style={{ fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.textMuted, margin: 0 }}>Information visible to students on your profile page.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', letterSpacing: T.tracking.wider }}>Full Name</label>
                                    <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={{...baseInputStyle, backgroundColor: C.surfaceWhite}} onFocus={onFocusHandler} onBlur={onBlurHandler} />
                                </div>
                                <div className="space-y-2">
                                    <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', letterSpacing: T.tracking.wider }}>Professional Title</label>
                                    <input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Senior Math Instructor" style={{...baseInputStyle, backgroundColor: C.surfaceWhite}} onFocus={onFocusHandler} onBlur={onBlurHandler} />
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', letterSpacing: T.tracking.wider }}>Biography</label>
                                    <textarea rows={4} value={formData.bio} onChange={e => setFormData({ ...formData, bio: e.target.value })} 
                                        style={{ ...baseInputStyle, resize: 'none', minHeight: '120px', backgroundColor: C.surfaceWhite }} placeholder="Share your experience and teaching style..." onFocus={onFocusHandler} onBlur={onBlurHandler} />
                                </div>
                                <div className="space-y-2">
                                    <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', letterSpacing: T.tracking.wider }}>Location</label>
                                    <input value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} placeholder="City, Country" style={{...baseInputStyle, backgroundColor: C.surfaceWhite}} onFocus={onFocusHandler} onBlur={onBlurHandler} />
                                </div>
                                <div className="space-y-2">
                                    <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', letterSpacing: T.tracking.wider }}>Website</label>
                                    <input value={formData.website} onChange={e => setFormData({ ...formData, website: e.target.value })} placeholder="https://..." style={{...baseInputStyle, backgroundColor: C.surfaceWhite}} onFocus={onFocusHandler} onBlur={onBlurHandler} />
                                </div>
                            </div>
                            
                            <div className="flex justify-end pt-4 mt-2" style={{ borderTop: `1px solid ${C.cardBorder}` }}>
                                <button onClick={handleSave} disabled={saving} className="flex items-center justify-center gap-2 h-12 px-8 cursor-pointer border-none transition-opacity hover:opacity-90 disabled:opacity-50 shadow-md w-full sm:w-auto"
                                    style={{ background: C.gradientBtn, color: '#ffffff', borderRadius: '10px', fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily, boxShadow: S.btn }}>
                                    {saving ? <MdHourglassEmpty size={18} className="animate-spin" /> : <MdSave size={18} />} Save Changes
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Account Tab */}
                    {activeTab === 'account' && (
                        <div className="space-y-6">
                            <div className="p-6 space-y-6" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                                <h2 style={{ fontSize: T.size.lg, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>Contact Information</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', letterSpacing: T.tracking.wider }}>Email Address</label>
                                        <input disabled value={user?.email || ''} style={{ ...baseInputStyle, cursor: 'not-allowed', opacity: 0.6, backgroundColor: C.innerBg }} />
                                    </div>
                                    <div className="space-y-2">
                                        <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', letterSpacing: T.tracking.wider }}>Phone Number</label>
                                        <input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} style={{...baseInputStyle, backgroundColor: C.surfaceWhite}} onFocus={onFocusHandler} onBlur={onBlurHandler} />
                                    </div>
                                </div>
                                <div className="flex justify-end mt-4 pt-6" style={{ borderTop: `1px solid ${C.cardBorder}` }}>
                                    <button onClick={handleSave} disabled={saving} className="h-11 px-6 cursor-pointer border-none transition-colors hover:opacity-80 shadow-sm w-full sm:w-auto"
                                        style={{ backgroundColor: C.innerBg, color: C.btnPrimary, borderRadius: '10px', fontSize: T.size.sm, fontWeight: T.weight.bold, border: `1px solid ${C.cardBorder}` }}
                                        onMouseEnter={e => e.currentTarget.style.backgroundColor = C.btnViewAllBg}
                                        onMouseLeave={e => e.currentTarget.style.backgroundColor = C.innerBg}>
                                        Update Contact
                                    </button>
                                </div>
                            </div>

                            <div className="p-6" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `2px dashed ${C.dangerBorder}` }}>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                        <h3 style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.danger, margin: '0 0 6px 0' }}>Delete Account</h3>
                                        <p style={{ fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.textMuted, margin: 0 }}>Once you delete your account, there is no going back. Please be certain.</p>
                                    </div>
                                    <button className="px-6 h-11 cursor-pointer border-none transition-opacity hover:opacity-80 shrink-0 shadow-sm w-full sm:w-auto"
                                        style={{ backgroundColor: C.dangerBg, color: C.danger, borderRadius: '10px', fontSize: T.size.sm, fontWeight: T.weight.bold, border: `1px solid ${C.dangerBorder}` }}>
                                        Delete Forever
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Notifications Tab */}
                    {activeTab === 'notifications' && (
                        <div className="p-6 space-y-6" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                            <div className="pb-4 border-b" style={{ borderColor: C.cardBorder }}>
                                <h2 style={{ fontSize: T.size.lg, fontWeight: T.weight.black, color: C.heading, margin: '0 0 4px 0' }}>Notification Preferences</h2>
                                <p style={{ fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.textMuted, margin: 0 }}>Control how you receive updates and alerts.</p>
                            </div>
                            <div className="space-y-3">
                                {[
                                    { key: 'enrollment', label: 'New Enrollments', desc: 'Alert when a student joins your course' },
                                    { key: 'reviews',     label: 'New Reviews',     desc: 'Notification for student feedback' },
                                    { key: 'summary',     label: 'Daily Summary',   desc: 'A daily digest of all activities' },
                                    { key: 'promotions',  label: 'Promotional',     desc: 'Platform offers and news' },
                                ].map(item => (
                                    <div key={item.key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 transition-colors hover:bg-white/40" style={{ backgroundColor: C.innerBg, borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}>
                                        <div>
                                            <p style={{ fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 4px 0' }}>{item.label}</p>
                                            <p style={{ fontSize: T.size.sm, color: C.textMuted, margin: 0, fontWeight: T.weight.medium }}>{item.desc}</p>
                                        </div>
                                        <button type="button" onClick={() => setNotifications(n => ({ ...n, [item.key]: !n[item.key] }))}
                                            style={{
                                                position: 'relative', display: 'inline-flex', height: '28px', width: '52px', cursor: 'pointer', border: 'none', flexShrink: 0,
                                                borderRadius: R.full, backgroundColor: notifications[item.key] ? C.btnPrimary : C.textMuted, transition: 'all 0.3s'
                                            }}>
                                            <span style={{
                                                position: 'absolute', top: '3px', left: notifications[item.key] ? '27px' : '3px',
                                                height: '22px', width: '22px', borderRadius: '50%', backgroundColor: '#fff', transition: 'all 0.3s', boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                            }} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-end pt-4 mt-2" style={{ borderTop: `1px solid ${C.cardBorder}` }}>
                                <button onClick={handleSaveNotifications} disabled={savingNotifications} className="flex items-center justify-center gap-2 h-12 px-8 cursor-pointer border-none transition-opacity hover:opacity-90 shadow-md w-full sm:w-auto"
                                    style={{ background: C.gradientBtn, color: '#ffffff', borderRadius: '10px', fontSize: T.size.sm, fontWeight: T.weight.bold, boxShadow: S.btn }}>
                                    {savingNotifications ? <MdHourglassEmpty size={18} className="animate-spin" /> : <MdSave size={18} />} Save Preferences
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Security Tab */}
                    {activeTab === 'security' && (
                        <div className="p-6 space-y-6" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                            <div className="pb-4 border-b" style={{ borderColor: C.cardBorder }}>
                                <h2 style={{ fontSize: T.size.lg, fontWeight: T.weight.black, color: C.heading, margin: '0 0 4px 0' }}>Security Settings</h2>
                                <p style={{ fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.textMuted, margin: 0 }}>Secure your account with a strong password.</p>
                            </div>
                            <div className="max-w-md">
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
    const [loading,     setLoading]     = useState(false);
    const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (passwords.newPassword !== passwords.confirmPassword) { toast.error("New passwords don't match"); return; }
        setLoading(true);
        try {
            if (hasPassword) {
                await api.post('/auth/change-password', { currentPassword: passwords.currentPassword, newPassword: passwords.newPassword });
                toast.success('Password updated!');
            } else {
                await api.post('/auth/set-password', { newPassword: passwords.newPassword });
                toast.success('Password set!');
            }
            setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) { toast.error(error.response?.data?.message || 'Update failed'); }
        finally { setLoading(false); }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {hasPassword && (
                <div className="space-y-2">
                    <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', letterSpacing: T.tracking.wider }}>Current Password</label>
                    <input type="password" required value={passwords.currentPassword} onChange={e => setPasswords(p => ({ ...p, currentPassword: e.target.value }))} style={{...baseInputStyle, backgroundColor: C.surfaceWhite}} onFocus={onFocusHandler} onBlur={onBlurHandler} />
                </div>
            )}
            <div className="space-y-2">
                <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', letterSpacing: T.tracking.wider }}>{hasPassword ? 'New Password' : 'Create Password'}</label>
                <input type="password" required minLength={6} value={passwords.newPassword} onChange={e => setPasswords(p => ({ ...p, newPassword: e.target.value }))} style={{...baseInputStyle, backgroundColor: C.surfaceWhite}} onFocus={onFocusHandler} onBlur={onBlurHandler} />
            </div>
            <div className="space-y-2">
                <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', letterSpacing: T.tracking.wider }}>Confirm Password</label>
                <input type="password" required value={passwords.confirmPassword} onChange={e => setPasswords(p => ({ ...p, confirmPassword: e.target.value }))} style={{...baseInputStyle, backgroundColor: C.surfaceWhite}} onFocus={onFocusHandler} onBlur={onBlurHandler} />
            </div>
            <div className="pt-2">
                <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 h-12 cursor-pointer border-none transition-opacity hover:opacity-90 shadow-md"
                    style={{ background: C.gradientBtn, color: '#ffffff', borderRadius: '10px', fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily, boxShadow: S.btn }}>
                    {loading ? <MdHourglassEmpty size={18} className="animate-spin" /> : <MdSave size={18} />} 
                    {hasPassword ? 'Update Password' : 'Set Password'}
                </button>
            </div>
        </form>
    );
}