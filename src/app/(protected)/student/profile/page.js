'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import {
    User, Loader2, Camera, Pencil, Lock,
    ChevronRight, BookOpen, CheckCircle, Award, Shield,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// ── Reusable themed Toggle ───────────────────────────────────────────────────
const Toggle = ({ checked, onToggle }) => (
    <button type="button" onClick={onToggle}
        className="w-11 h-6 rounded-full transition-colors relative shrink-0"
        style={{ backgroundColor: checked ? 'var(--theme-primary)' : 'color-mix(in srgb, var(--theme-foreground) 15%, transparent)' }}>
        <span className={`block w-5 h-5 rounded-full bg-white shadow absolute top-0.5 transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
);

export default function StudentProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [enrollments, setEnrollments] = useState([]);
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editForm, setEditForm] = useState({ name: '', phone: '', dateOfBirth: '', gender: '' });
    const [notifSettings, setNotifSettings] = useState({ email: true, push: true, sms: false });
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
    const [sessions, setSessions] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) { router.push('/login'); return; }
                const [meRes, enrollRes, batchesRes] = await Promise.all([
                    api.get('/auth/me'),
                    api.get('/enrollments/my-enrollments').catch(() => ({ data: { enrollments: [] } })),
                    api.get('/batches/my').catch(() => ({ data: { batches: [] } })),
                ]);
                if (meRes.data.success) {
                    const u = meRes.data.user;
                    setUser(u);
                    setEditForm({ name: u.name || '', phone: u.phone || '', dateOfBirth: u.dateOfBirth || '', gender: u.gender || '' });
                    setNotifSettings({
                        email: u.notificationSettings?.email !== false,
                        push: u.notificationSettings?.push !== false,
                        sms: u.notificationSettings?.sms === true,
                    });
                }
                if (enrollRes.data?.enrollments) setEnrollments(enrollRes.data.enrollments);
                if (batchesRes.data?.batches) setBatches(batchesRes.data.batches);
                const sessionsRes = await api.get('/auth/sessions').catch(() => ({ data: { sessions: [] } }));
                if (sessionsRes.data?.sessions) setSessions(sessionsRes.data.sessions);
            } catch {
                const stored = localStorage.getItem('user');
                if (stored) setUser(JSON.parse(stored));
            } finally { setLoading(false); }
        };
        fetchData();
    }, [router]);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            let imageUrl = user.profileImage;
            const fileInput = document.getElementById('profile-image-input');
            if (fileInput?.files?.[0]) {
                const fd = new FormData();
                fd.append('image', fileInput.files[0]);
                const up = await api.post('/upload/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                if (up.data.success) imageUrl = up.data.imageUrl;
            }
            const res = await api.patch('/auth/profile', { ...editForm, profileImage: imageUrl });
            if (res.data.success) {
                setUser(res.data.user);
                localStorage.setItem('user', JSON.stringify(res.data.user));
                toast.success('Profile updated');
            }
        } catch (err) { toast.error(err.response?.data?.message || 'Update failed'); }
        finally { setSaving(false); }
    };

    const handleNotificationToggle = async (key, value) => {
        const next = { ...notifSettings, [key]: value };
        setNotifSettings(next);
        try { await api.patch('/auth/notification-settings', next); }
        catch { setNotifSettings(notifSettings); }
    };

    const studentId      = user?._id ? `SAP-STU-${String(user._id).slice(-4)}` : '—';
    const firstEnrollment = enrollments[0];
    const firstBatch      = batches[0];
    const enrolledCourseName = firstEnrollment?.courseId?.title || '—';
    const batchName          = firstBatch?.name || '—';
    const instructorName     = firstBatch?.tutorId?.userId?.name || firstEnrollment?.courseId?.tutorId?.userId?.name || '—';
    const joinDate = firstEnrollment?.enrolledAt
        ? new Date(firstEnrollment.enrolledAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
        : (user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '—');
    const completedCourses  = enrollments.filter(e => e.progress?.percentage >= 100).length;
    const profileCompletion = [user?.name, user?.email, user?.phone, user?.profileImage].filter(Boolean).length * 25;

    const cardStyle = { backgroundColor: 'var(--theme-background)', borderColor: 'var(--theme-border)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' };
    const inputStyle = { backgroundColor: 'color-mix(in srgb, var(--theme-foreground) 4%, var(--theme-background))', borderColor: 'var(--theme-border)', color: 'var(--theme-foreground)' };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-10 h-10 rounded-full border-[3px] animate-spin"
                style={{ borderColor: 'color-mix(in srgb, var(--theme-primary) 20%, transparent)', borderTopColor: 'var(--theme-primary)' }} />
        </div>
    );
    if (!user) return null;

    return (
        <div className="space-y-6">
            {/* Page title */}
            <div>
                <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--theme-foreground)' }}>My Profile</h1>
                <p className="text-sm mt-0.5" style={{ color: 'var(--theme-foreground)', opacity: 0.45 }}>
                    Manage your personal information and account settings
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* ── Left column ──────────────────────────────────────────── */}
                <div className="lg:col-span-2 space-y-5">

                    {/* ── Profile Header ─────────────────────────────────── */}
                    <div className="rounded-2xl border p-6" style={cardStyle}>
                        <div className="flex flex-col sm:flex-row sm:items-start gap-5">
                            {/* Avatar */}
                            <div className="relative shrink-0">
                                <div className="w-24 h-24 rounded-2xl overflow-hidden border-2"
                                    style={{ borderColor: 'var(--theme-border)', backgroundColor: 'color-mix(in srgb, var(--theme-primary) 8%, var(--theme-background))' }}>
                                    {user.profileImage ? (
                                        <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <User className="w-10 h-10" style={{ color: 'var(--theme-primary)', opacity: 0.4 }} />
                                        </div>
                                    )}
                                </div>
                                <label className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer"
                                    style={{ backgroundColor: 'var(--theme-primary)' }}>
                                    <Camera className="w-4 h-4 text-white" />
                                    <input id="profile-image-input" type="file" accept="image/*" className="hidden"
                                        onChange={e => {
                                            if (e.target.files?.[0]) {
                                                const r = new FileReader();
                                                r.onloadend = () => setUser(p => ({ ...p, profileImage: r.result }));
                                                r.readAsDataURL(e.target.files[0]);
                                            }
                                        }} />
                                </label>
                            </div>

                            {/* Details */}
                            <div className="flex-1 min-w-0">
                                <h2 className="text-xl font-black" style={{ color: 'var(--theme-foreground)' }}>{user.name || 'Student'}</h2>
                                <p className="text-sm mt-0.5" style={{ color: 'var(--theme-foreground)', opacity: 0.42 }}>
                                    ID: {studentId}
                                </p>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full"
                                        style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 10%, transparent)', color: 'var(--theme-primary)' }}>
                                        Student
                                    </span>
                                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full"
                                        style={{ backgroundColor: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                                        Active
                                    </span>
                                </div>
                                <p className="text-xs mt-2" style={{ color: 'var(--theme-foreground)', opacity: 0.38 }}>Joined {joinDate}</p>
                                <div className="flex flex-wrap gap-2 mt-4">
                                    {[
                                        { icon: Pencil, label: 'Edit Profile',      href: '/student/profile' },
                                        { icon: Lock,   label: 'Change Password',   href: '/student/profile/change-password' },
                                    ].map(({ icon: Icon, label, href }) => (
                                        <Link key={href} href={href}>
                                            <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all"
                                                style={{ borderColor: 'var(--theme-border)', color: 'var(--theme-foreground)', backgroundColor: 'transparent' }}
                                                onMouseEnter={e => { e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--theme-primary) 40%, transparent)'; e.currentTarget.style.color = 'var(--theme-primary)'; }}
                                                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--theme-border)'; e.currentTarget.style.color = 'var(--theme-foreground)'; }}>
                                                <Icon className="w-3.5 h-3.5" /> {label}
                                            </button>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Personal Info Form ─────────────────────────────── */}
                    <div className="rounded-2xl border overflow-hidden" style={cardStyle}>
                        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--theme-border)' }}>
                            <h2 className="font-black text-sm" style={{ color: 'var(--theme-foreground)' }}>Personal Information</h2>
                            <button className="text-xs font-semibold" style={{ color: 'var(--theme-primary)' }}>Edit Details</button>
                        </div>
                        <form onSubmit={handleUpdateProfile} className="p-5 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    { label: 'Full Name',        key: 'name',        type: 'text' },
                                    { label: 'Email Address',    key: null,          type: 'email',  value: user.email, disabled: true },
                                    { label: 'Phone Number',     key: 'phone',       type: 'text' },
                                    { label: 'Date of Birth',    key: 'dateOfBirth', type: 'date' },
                                    { label: 'Gender',           key: 'gender',      type: 'text',   placeholder: 'Male / Female / Other' },
                                ].map(field => (
                                    <div key={field.label}>
                                        <label className="block text-[10px] font-black uppercase tracking-wider mb-1.5"
                                            style={{ color: 'var(--theme-foreground)', opacity: 0.35 }}>
                                            {field.label}
                                        </label>
                                        <input
                                            type={field.type}
                                            value={field.disabled ? (field.value || '') : (editForm[field.key] || '')}
                                            onChange={field.disabled ? undefined : e => setEditForm(p => ({ ...p, [field.key]: e.target.value }))}
                                            placeholder={field.placeholder}
                                            disabled={field.disabled}
                                            className="w-full px-3 py-2.5 rounded-xl border text-sm disabled:opacity-50"
                                            style={inputStyle}
                                        />
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-end pt-1">
                                <button type="submit" disabled={saving}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
                                    style={{ backgroundColor: 'var(--theme-primary)' }}
                                    onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; }}
                                    onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}>
                                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* ── Academic Info ──────────────────────────────────── */}
                    <div className="rounded-2xl border overflow-hidden" style={cardStyle}>
                        <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--theme-border)' }}>
                            <h2 className="font-black text-sm" style={{ color: 'var(--theme-foreground)' }}>Academic Information</h2>
                        </div>
                        <div className="p-5">
                            {[
                                { label: 'Student ID',      value: studentId          },
                                { label: 'Enrolled Course', value: enrolledCourseName },
                                { label: 'Batch Name',      value: batchName          },
                                { label: 'Instructor',      value: instructorName     },
                                { label: 'Joined',          value: joinDate           },
                            ].map((row, i, arr) => (
                                <div key={row.label}
                                    className="flex items-center justify-between py-2.5 text-sm"
                                    style={{ borderBottom: i < arr.length - 1 ? `1px solid var(--theme-border)` : 'none' }}>
                                    <span style={{ color: 'var(--theme-foreground)', opacity: 0.42 }}>{row.label}</span>
                                    <span className="font-semibold" style={{ color: 'var(--theme-foreground)' }}>{row.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── Notification Settings ──────────────────────────── */}
                    <div className="rounded-2xl border overflow-hidden" style={cardStyle}>
                        <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--theme-border)' }}>
                            <h2 className="font-black text-sm" style={{ color: 'var(--theme-foreground)' }}>Notification Settings</h2>
                        </div>
                        <div className="p-5 space-y-4">
                            {[
                                { key: 'email', label: 'Email Notifications'    },
                                { key: 'sms',   label: 'SMS Notifications'      },
                                { key: 'push',  label: 'Exam Reminders'         },
                            ].map(item => (
                                <div key={item.key} className="flex items-center justify-between">
                                    <span className="text-sm font-medium" style={{ color: 'var(--theme-foreground)' }}>{item.label}</span>
                                    <Toggle checked={notifSettings[item.key]} onToggle={() => handleNotificationToggle(item.key, !notifSettings[item.key])} />
                                </div>
                            ))}
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium" style={{ color: 'var(--theme-foreground)' }}>AI Study Recommendations</span>
                                <Toggle checked={true} onToggle={() => {}} />
                            </div>
                        </div>
                    </div>

                    {/* ── Security Settings ──────────────────────────────── */}
                    <div className="rounded-2xl border overflow-hidden" style={cardStyle}>
                        <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--theme-border)' }}>
                            <h2 className="font-black text-sm" style={{ color: 'var(--theme-foreground)' }}>Security Settings</h2>
                        </div>
                        <div className="p-5 space-y-2">
                            <Link href="/student/profile/change-password"
                                className="flex items-center justify-between px-3 py-2.5 rounded-xl transition-all"
                                style={{ color: 'var(--theme-foreground)' }}
                                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--theme-primary) 6%, transparent)'; e.currentTarget.style.color = 'var(--theme-primary)'; }}
                                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--theme-foreground)'; }}>
                                <span className="flex items-center gap-2 text-sm font-medium">
                                    <Lock className="w-4 h-4" /> Change Password
                                </span>
                                <ChevronRight className="w-4 h-4 opacity-35" />
                            </Link>
                            <div className="flex items-center justify-between px-3 py-2.5">
                                <span className="text-sm font-medium" style={{ color: 'var(--theme-foreground)' }}>Two-Factor Authentication</span>
                                <Toggle checked={twoFactorEnabled} onToggle={() => setTwoFactorEnabled(v => !v)} />
                            </div>
                            <div className="px-3 pt-3 border-t" style={{ borderColor: 'var(--theme-border)' }}>
                                <p className="text-[10px] font-black uppercase tracking-wider mb-2" style={{ color: 'var(--theme-foreground)', opacity: 0.32 }}>
                                    Recent Sessions
                                </p>
                                <ul className="space-y-1.5">
                                    {(sessions.length > 0 ? sessions.slice(0, 3) : [{ browser: 'Chrome', device: 'Windows', lastActive: null }])
                                        .map((s, i) => (
                                            <li key={i} className="text-xs" style={{ color: 'var(--theme-foreground)', opacity: 0.45 }}>
                                                {s.browser || 'Browser'} on {s.device || 'Device'} —{' '}
                                                {s.lastActive ? new Date(s.lastActive).toLocaleString() : 'Today'}
                                            </li>
                                        ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Right Sidebar ─────────────────────────────────────── */}
                <div className="space-y-5">
                    {/* Quick Stats */}
                    <div className="rounded-2xl border p-5" style={cardStyle}>
                        <h2 className="font-black text-sm mb-4" style={{ color: 'var(--theme-foreground)' }}>Quick Stats</h2>
                        <ul className="space-y-3">
                            {[
                                { icon: BookOpen,    label: 'Enrolled Courses', value: enrollments.length },
                                { icon: CheckCircle, label: 'Tests Completed',  value: '—'               },
                                { icon: Award,       label: 'Certificates',     value: completedCourses  },
                                { icon: Shield,      label: 'Payment Status',   value: 'Clear'           },
                            ].map(stat => (
                                <li key={stat.label} className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                                        style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 10%, transparent)' }}>
                                        <stat.icon className="w-5 h-5" style={{ color: 'var(--theme-primary)', opacity: 0.75 }} />
                                    </div>
                                    <div>
                                        <p className="text-[11px]" style={{ color: 'var(--theme-foreground)', opacity: 0.38 }}>{stat.label}</p>
                                        <p className="text-base font-black" style={{ color: 'var(--theme-foreground)' }}>{stat.value}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Profile Completion */}
                    <div className="rounded-2xl border p-5" style={cardStyle}>
                        <h2 className="font-black text-sm mb-4" style={{ color: 'var(--theme-foreground)' }}>Profile Completion</h2>
                        <div className="flex flex-col items-center">
                            <div className="relative w-28 h-28">
                                <svg className="w-28 h-28 -rotate-90" viewBox="0 0 36 36">
                                    <path strokeWidth="3" fill="none"
                                        style={{ stroke: 'color-mix(in srgb, var(--theme-foreground) 8%, transparent)' }}
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                    <path strokeWidth="3" strokeLinecap="round" fill="none"
                                        style={{ stroke: 'var(--theme-primary)' }}
                                        strokeDasharray={`${Math.min(100, profileCompletion)}, 100`}
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                </svg>
                                <span className="absolute inset-0 flex items-center justify-center text-xl font-black"
                                    style={{ color: 'var(--theme-foreground)' }}>
                                    {Math.min(100, profileCompletion)}%
                                </span>
                            </div>
                            <p className="text-xs mt-3 text-center" style={{ color: 'var(--theme-foreground)', opacity: 0.38 }}>
                                {profileCompletion < 100 ? 'Add more details to complete your profile' : '🎉 Profile is complete!'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}