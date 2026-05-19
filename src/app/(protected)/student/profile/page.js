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
import { C, T, S, R, cx } from '@/constants/studentTokens';

export default function StudentProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [enrollments, setEnrollments] = useState([]);
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editForm, setEditForm] = useState({ name: '', phone: '', dateOfBirth: '', gender: '' });

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
                }
                if (enrollRes.data?.enrollments) setEnrollments(enrollRes.data.enrollments);
                if (batchesRes.data?.batches) setBatches(batchesRes.data.batches);
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

    const cardStyle = { backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, borderRadius: R['2xl'], boxShadow: S.card };
    const inputStyle = { backgroundColor: C.innerBg, border: `1px solid ${C.cardBorder}`, color: C.heading, borderRadius: '10px', outline: 'none' };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-10 h-10 rounded-full border-[3px] animate-spin"
                style={{ borderColor: `${C.btnPrimary}30`, borderTopColor: C.btnPrimary }} />
        </div>
    );
    if (!user) return null;

    return (
        <div className="space-y-6" style={{ fontFamily: T.fontFamily }}>
            {/* Page title */}
            <div>
                <h1 style={{ color: C.heading, fontSize: T.size['2xl'], fontWeight: T.weight.bold, margin: 0 }}>My Profile</h1>
                <p style={{ color: C.text, fontSize: T.size.sm, margin: '4px 0 0 0', fontWeight: T.weight.medium }}>
                    Manage your personal information and account settings
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* ── Left column ──────────────────────────────────────────── */}
                <div className="lg:col-span-2 space-y-5">

                    {/* ── Profile Header ─────────────────────────────────── */}
                    <div className="p-6" style={cardStyle}>
                        <div className="flex flex-col sm:flex-row sm:items-start gap-5">
                            {/* Avatar */}
                            <div className="relative shrink-0">
                                <div className="w-24 h-24 rounded-2xl overflow-hidden"
                                    style={{ border: `2px solid ${C.cardBorder}`, backgroundColor: C.innerBg }}>
                                    {user.profileImage ? (
                                        <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <User className="w-10 h-10" style={{ color: C.btnPrimary, opacity: 0.4 }} />
                                        </div>
                                    )}
                                </div>
                                <label className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer transition-transform hover:scale-105"
                                    style={{ backgroundColor: C.btnPrimary }}>
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
                                <h2 style={{ color: C.heading, fontSize: T.size.xl, fontWeight: T.weight.bold, margin: 0 }}>{user.name || 'Student'}</h2>
                                <p style={{ color: C.text, fontSize: T.size.sm, margin: '4px 0 0 0', fontWeight: T.weight.medium }}>
                                    ID: {studentId}
                                </p>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    <span className="px-2.5 py-0.5 rounded-full"
                                        style={{ backgroundColor: C.innerBg, color: C.btnPrimary, fontSize: T.size.xs, fontWeight: T.weight.bold }}>
                                        Student
                                    </span>
                                    <span className="px-2.5 py-0.5 rounded-full"
                                        style={{ backgroundColor: C.successBg, color: C.success, fontSize: T.size.xs, fontWeight: T.weight.bold, border: `1px solid ${C.successBorder}` }}>
                                        Active
                                    </span>
                                </div>
                                <p style={{ color: C.text, fontSize: T.size.xs, margin: '8px 0 0 0', fontWeight: T.weight.medium }}>Joined {joinDate}</p>
                                <div className="flex flex-wrap gap-2 mt-4">
                                    {[
                                        { icon: Pencil, label: 'Edit Profile',      href: '/student/profile' },
                                        { icon: Lock,   label: 'Change Password',   href: '/student/profile/change-password' },
                                    ].map(({ icon: Icon, label, href }) => (
                                        <Link key={href} href={href} style={{ textDecoration: 'none' }}>
                                            <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all cursor-pointer"
                                                style={{ border: `1px solid ${C.cardBorder}`, color: C.heading, backgroundColor: 'transparent', fontSize: T.size.xs, fontWeight: T.weight.semibold }}
                                                onMouseEnter={e => { e.currentTarget.style.borderColor = C.btnPrimary; e.currentTarget.style.color = C.btnPrimary; }}
                                                onMouseLeave={e => { e.currentTarget.style.borderColor = C.cardBorder; e.currentTarget.style.color = C.heading; }}>
                                                <Icon className="w-3.5 h-3.5" /> {label}
                                            </button>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Personal Info Form ─────────────────────────────── */}
                    <div className="overflow-hidden" style={cardStyle}>
                        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.cardBorder}`, backgroundColor: 'transparent' }}>
                            <h2 style={{ color: C.heading, fontSize: T.size.sm, fontWeight: T.weight.bold, margin: 0 }}>Personal Information</h2>
                            <button className="cursor-pointer border-none bg-transparent" style={{ color: C.btnPrimary, fontSize: T.size.xs, fontWeight: T.weight.semibold }}>Edit Details</button>
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
                                        <label style={{ display: 'block', color: C.text, fontSize: '10px', fontWeight: T.weight.bold, textTransform: 'uppercase', letterSpacing: T.tracking.wider, marginBottom: '6px' }}>
                                            {field.label}
                                        </label>
                                        <input
                                            type={field.type}
                                            value={field.disabled ? (field.value || '') : (editForm[field.key] || '')}
                                            onChange={field.disabled ? undefined : e => setEditForm(p => ({ ...p, [field.key]: e.target.value }))}
                                            placeholder={field.placeholder}
                                            disabled={field.disabled}
                                            className="w-full px-3 py-2.5 transition-colors disabled:opacity-60"
                                            style={{ ...inputStyle, fontSize: T.size.sm, fontWeight: T.weight.medium }}
                                            onFocus={e => { e.currentTarget.style.borderColor = C.btnPrimary; }}
                                            onBlur={e => { e.currentTarget.style.borderColor = C.cardBorder; }}
                                        />
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-end pt-1">
                                <button type="submit" disabled={saving}
                                    className="flex items-center gap-2 px-5 py-2.5 transition-all disabled:opacity-50 cursor-pointer border-none"
                                    style={{ background: C.gradientBtn, color: '#fff', borderRadius: '10px', fontSize: T.size.sm, fontWeight: T.weight.bold, boxShadow: S.btn }}
                                    onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; }}
                                    onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}>
                                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* ── Academic Info ──────────────────────────────────── */}
                    <div className="overflow-hidden" style={cardStyle}>
                        <div className="px-5 py-4" style={{ borderBottom: `1px solid ${C.cardBorder}`, backgroundColor: 'transparent' }}>
                            <h2 style={{ color: C.heading, fontSize: T.size.sm, fontWeight: T.weight.bold, margin: 0 }}>Academic Information</h2>
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
                                    className="flex items-center justify-between py-2.5"
                                    style={{ borderBottom: i < arr.length - 1 ? `1px solid ${C.cardBorder}` : 'none' }}>
                                    <span style={{ color: C.text, fontSize: T.size.sm, fontWeight: T.weight.medium }}>{row.label}</span>
                                    <span style={{ color: C.heading, fontSize: T.size.sm, fontWeight: T.weight.semibold }}>{row.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                {/* ── Right Sidebar ─────────────────────────────────────── */}
                <div className="space-y-5">
                    {/* Quick Stats */}
                    <div className="p-5" style={cardStyle}>
                        <h2 style={{ color: C.heading, fontSize: T.size.sm, fontWeight: T.weight.bold, margin: '0 0 16px 0' }}>Quick Stats</h2>
                        <ul className="space-y-3 m-0 p-0" style={{ listStyle: 'none' }}>
                            {[
                                { icon: BookOpen,    label: 'Enrolled Courses', value: enrollments.length },
                                { icon: CheckCircle, label: 'Tests Completed',  value: '—'               },
                                { icon: Award,       label: 'Certificates',     value: completedCourses  },
                                { icon: Shield,      label: 'Payment Status',   value: 'Clear'           },
                            ].map(stat => (
                                <li key={stat.label} className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                                        style={{ backgroundColor: C.innerBg }}>
                                        <stat.icon className="w-5 h-5" style={{ color: C.btnPrimary }} />
                                    </div>
                                    <div>
                                        <p style={{ color: C.text, fontSize: '11px', margin: 0, fontWeight: T.weight.medium }}>{stat.label}</p>
                                        <p style={{ color: C.heading, fontSize: T.size.base, margin: 0, fontWeight: T.weight.bold }}>{stat.value}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Profile Completion */}
                    <div className="p-5" style={cardStyle}>
                        <h2 style={{ color: C.heading, fontSize: T.size.sm, fontWeight: T.weight.bold, margin: '0 0 16px 0' }}>Profile Completion</h2>
                        <div className="flex flex-col items-center">
                            <div className="relative w-28 h-28">
                                <svg className="w-28 h-28 -rotate-90" viewBox="0 0 36 36">
                                    <path strokeWidth="3" fill="none"
                                        style={{ stroke: C.cardBorder }}
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                    <path strokeWidth="3" strokeLinecap="round" fill="none"
                                        style={{ stroke: C.btnPrimary }}
                                        strokeDasharray={`${Math.min(100, profileCompletion)}, 100`}
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                </svg>
                                <span className="absolute inset-0 flex items-center justify-center"
                                    style={{ color: C.heading, fontSize: T.size.xl, fontWeight: T.weight.bold }}>
                                    {Math.min(100, profileCompletion)}%
                                </span>
                            </div>
                            <p className="text-center" style={{ color: C.text, fontSize: T.size.xs, margin: '12px 0 0 0', fontWeight: T.weight.medium }}>
                                {profileCompletion < 100 ? 'Add more details to complete your profile' : '🎉 Profile is complete!'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}