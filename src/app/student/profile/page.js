'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import {
    User,
    Mail,
    Phone,
    Loader2,
    Camera,
    Pencil,
    Lock,
    Settings,
    ChevronRight,
    BookOpen,
    CheckCircle,
    Award,
    Bell,
    Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'react-hot-toast';
import Cookies from 'js-cookie';

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
                if (!token) {
                    router.push('/login');
                    return;
                }
                const [meRes, enrollRes, batchesRes] = await Promise.all([
                    api.get('/auth/me'),
                    api.get('/enrollments/my-enrollments').catch(() => ({ data: { enrollments: [] } })),
                    api.get('/batches/my').catch(() => ({ data: { batches: [] } })),
                ]);
                if (meRes.data.success) {
                    const u = meRes.data.user;
                    setUser(u);
                    setEditForm({
                        name: u.name || '',
                        phone: u.phone || '',
                        dateOfBirth: u.dateOfBirth || '',
                        gender: u.gender || '',
                    });
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
            } catch (error) {
                console.error('Error fetching profile:', error);
                const stored = localStorage.getItem('user');
                if (stored) setUser(JSON.parse(stored));
            } finally {
                setLoading(false);
            }
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
                const formData = new FormData();
                formData.append('image', fileInput.files[0]);
                const uploadRes = await api.post('/upload/image', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                if (uploadRes.data.success) imageUrl = uploadRes.data.imageUrl;
            }
            const res = await api.patch('/auth/profile', { ...editForm, profileImage: imageUrl });
            if (res.data.success) {
                setUser(res.data.user);
                localStorage.setItem('user', JSON.stringify(res.data.user));
                toast.success('Profile updated');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Update failed');
        } finally {
            setSaving(false);
        }
    };

    const handleNotificationToggle = async (key, value) => {
        const next = { ...notifSettings, [key]: value };
        setNotifSettings(next);
        try {
            await api.patch('/auth/notification-settings', {
                email: next.email,
                push: next.push,
                sms: next.sms,
            });
        } catch (e) {
            setNotifSettings(notifSettings);
        }
    };

    const studentId = user?._id ? `SAP-STU-${String(user._id).slice(-4)}` : '—';
    const firstEnrollment = enrollments[0];
    const enrolledCourseName = firstEnrollment?.courseId?.title || '—';
    const firstBatch = batches[0];
    const batchName = firstBatch?.name || '—';
    const instructorName = firstBatch?.tutorId?.userId?.name || firstEnrollment?.courseId?.tutorId?.userId?.name || '—';
    const joinDate = firstEnrollment?.enrolledAt
        ? new Date(firstEnrollment.enrolledAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
        : (user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '—');

    const completedCourses = enrollments.filter((e) => e.progress?.percentage >= 100).length;
    const certificatesCount = completedCourses;
    const profileCompletion = [
        user?.name,
        user?.email,
        user?.phone,
        user?.profileImage,
    ].filter(Boolean).length * 25;

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f0f2f8]">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }
    if (!user) return null;

    return (
        <div className="min-h-screen bg-[#f0f2f8]">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
                {/* Breadcrumbs */}
                <nav className="text-sm text-slate-600 mb-6">
                    <Link href="/student/dashboard" className="hover:text-indigo-600">Dashboard</Link>
                    <span className="mx-2">/</span>
                    <span className="text-slate-900 font-medium">Profile</span>
                </nav>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Profile Header */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                            <div className="flex flex-col sm:flex-row sm:items-start gap-6">
                                <div className="relative shrink-0">
                                    <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-slate-200 bg-slate-100">
                                        {user.profileImage ? (
                                            <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <User className="w-12 h-12 text-slate-400" />
                                            </div>
                                        )}
                                    </div>
                                    <label className="absolute bottom-0 right-0 p-2 bg-indigo-600 text-white rounded-full cursor-pointer hover:bg-indigo-700">
                                        <Camera className="w-4 h-4" />
                                        <input
                                            id="profile-image-input"
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => {
                                                if (e.target.files?.[0]) {
                                                    const r = new FileReader();
                                                    r.onloadend = () => setUser((p) => ({ ...p, profileImage: r.result }));
                                                    r.readAsDataURL(e.target.files[0]);
                                                }
                                            }}
                                        />
                                    </label>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h1 className="text-xl font-bold text-slate-900">{user.name || 'Student'}</h1>
                                    <p className="text-slate-500 text-sm mt-1">Student ID: {studentId}</p>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-medium rounded">Course</span>
                                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded">Active</span>
                                    </div>
                                    <p className="text-slate-500 text-sm mt-2">Join date: {joinDate}</p>
                                    <div className="flex flex-wrap gap-2 mt-4">
                                        <Link href="/student/profile">
                                            <Button variant="outline" size="sm" className="gap-1">
                                                <Pencil className="w-4 h-4" />
                                                Edit Profile
                                            </Button>
                                        </Link>
                                        <Link href="/student/profile/change-password">
                                            <Button variant="outline" size="sm" className="gap-1">
                                                <Lock className="w-4 h-4" />
                                                Change Password
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Personal Information */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                                <h2 className="font-bold text-slate-900">Personal Information</h2>
                                <Button variant="ghost" size="sm" className="text-indigo-600">Edit Details</Button>
                            </div>
                            <form onSubmit={handleUpdateProfile} className="p-6 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-slate-600">Full Name</Label>
                                        <Input value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} className="mt-1 bg-slate-50" />
                                    </div>
                                    <div>
                                        <Label className="text-slate-600">Email Address</Label>
                                        <Input value={user.email} disabled className="mt-1 bg-slate-50" />
                                    </div>
                                    <div>
                                        <Label className="text-slate-600">Phone Number</Label>
                                        <Input value={editForm.phone} onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))} className="mt-1 bg-slate-50" />
                                    </div>
                                    <div>
                                        <Label className="text-slate-600">Date of Birth</Label>
                                        <Input type="date" value={editForm.dateOfBirth} onChange={(e) => setEditForm((p) => ({ ...p, dateOfBirth: e.target.value }))} className="mt-1 bg-slate-50" />
                                    </div>
                                    <div>
                                        <Label className="text-slate-600">Gender</Label>
                                        <Input value={editForm.gender} onChange={(e) => setEditForm((p) => ({ ...p, gender: e.target.value }))} placeholder="Male / Female / Other" className="mt-1 bg-slate-50" />
                                    </div>
                                </div>
                                <div className="pt-2 flex justify-end">
                                    <Button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                                    </Button>
                                </div>
                            </form>
                        </div>

                        {/* Academic Information */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                                <h2 className="font-bold text-slate-900">Academic Information</h2>
                                <Button variant="ghost" size="sm" className="text-indigo-600">Edit Details</Button>
                            </div>
                            <div className="p-6 space-y-3 text-sm">
                                <div className="flex justify-between py-2 border-b border-slate-100">
                                    <span className="text-slate-500">Student ID</span>
                                    <span className="font-medium text-slate-800">{studentId}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-slate-100">
                                    <span className="text-slate-500">Enrolled Course</span>
                                    <span className="font-medium text-slate-800">{enrolledCourseName}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-slate-100">
                                    <span className="text-slate-500">Batch Name</span>
                                    <span className="font-medium text-slate-800">{batchName}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-slate-100">
                                    <span className="text-slate-500">Instructor Name</span>
                                    <span className="font-medium text-slate-800">{instructorName}</span>
                                </div>
                                <div className="flex justify-between py-2">
                                    <span className="text-slate-500">Enrollment Date</span>
                                    <span className="font-medium text-slate-800">{joinDate}</span>
                                </div>
                            </div>
                        </div>

                        {/* Account Settings */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                                <h2 className="font-bold text-slate-900">Account Settings</h2>
                                <Button variant="ghost" size="sm" className="text-indigo-600">Edit Update Filter</Button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-700">Email Notifications</span>
                                    <button type="button" onClick={() => handleNotificationToggle('email', !notifSettings.email)} className={`w-11 h-6 rounded-full transition-colors ${notifSettings.email ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                                        <span className={`block w-5 h-5 rounded-full bg-white shadow transform transition-transform ${notifSettings.email ? 'translate-x-6' : 'translate-x-0.5'}`} />
                                    </button>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-700">SMS Notifications</span>
                                    <button type="button" onClick={() => handleNotificationToggle('sms', !notifSettings.sms)} className={`w-11 h-6 rounded-full transition-colors ${notifSettings.sms ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                                        <span className={`block w-5 h-5 rounded-full bg-white shadow transform transition-transform ${notifSettings.sms ? 'translate-x-6' : 'translate-x-0.5'}`} />
                                    </button>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-700">Exam Reminders</span>
                                    <button type="button" onClick={() => handleNotificationToggle('push', !notifSettings.push)} className={`w-11 h-6 rounded-full transition-colors ${notifSettings.push ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                                        <span className={`block w-5 h-5 rounded-full bg-white shadow transform transition-transform ${notifSettings.push ? 'translate-x-6' : 'translate-x-0.5'}`} />
                                    </button>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-700">AI Study Recommendations</span>
                                    <button type="button" className="w-11 h-6 rounded-full bg-indigo-600">
                                        <span className="block w-5 h-5 rounded-full bg-white shadow translate-x-6" />
                                    </button>
                                </div>
                                <div className="flex items-center justify-between pt-2">
                                    <span className="text-slate-700">Dark Mode</span>
                                    <button type="button" className="w-11 h-6 rounded-full bg-slate-200">
                                        <span className="block w-5 h-5 rounded-full bg-white shadow translate-x-0.5" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Security Settings */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <h2 className="px-6 py-4 border-b border-slate-100 font-bold text-slate-900">Security Settings</h2>
                            <div className="p-6 space-y-4">
                                <Link href="/student/profile/change-password" className="flex items-center justify-between py-2 text-slate-700 hover:text-indigo-600">
                                    <span className="flex items-center gap-2">
                                        <Lock className="w-4 h-4" />
                                        Change Password
                                    </span>
                                    <ChevronRight className="w-4 h-4" />
                                </Link>
                                <div className="flex items-center justify-between py-2">
                                    <span className="text-slate-700">Two-Factor Authentication</span>
                                    <button
                                        type="button"
                                        onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                                        className={`w-11 h-6 rounded-full transition-colors ${twoFactorEnabled ? 'bg-indigo-600' : 'bg-slate-200'}`}
                                    >
                                        <span className={`block w-5 h-5 rounded-full bg-white shadow transform transition-transform ${twoFactorEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
                                    </button>
                                </div>
                                <div className="pt-4 border-t border-slate-100">
                                    <p className="text-sm font-semibold text-slate-700 mb-2">Last Login</p>
                                    <ul className="space-y-2 text-sm text-slate-600">
                                        {sessions.length > 0 ? (
                                            sessions.slice(0, 3).map((s, i) => (
                                                <li key={i}>
                                                    {s.browser || 'Browser'} on {s.device || 'Device'} — {s.lastActive ? new Date(s.lastActive).toLocaleString() : '—'}
                                                </li>
                                            ))
                                        ) : (
                                            <li>Chrome on Windows — Today</li>
                                        )}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Sidebar: Quick Stats + Profile Completion */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-bold text-slate-900">Quick Stats</h2>
                                <Settings className="w-4 h-4 text-slate-400" />
                            </div>
                            <ul className="space-y-4">
                                <li className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                                        <BookOpen className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Courses Enrolled</p>
                                        <p className="font-bold text-slate-800">{enrollments.length}</p>
                                    </div>
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Tests Completed</p>
                                        <p className="font-bold text-slate-800">—</p>
                                    </div>
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                                        <Award className="w-5 h-5 text-amber-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Certificates Earned</p>
                                        <p className="font-bold text-slate-800">{certificatesCount}</p>
                                    </div>
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                                        <CheckCircle className="w-5 h-5 text-slate-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Payments Status</p>
                                        <p className="font-bold text-slate-800">Clear</p>
                                    </div>
                                </li>
                            </ul>
                        </div>
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-bold text-slate-900">Profile Completion</h2>
                                <Settings className="w-4 h-4 text-slate-400" />
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="relative w-28 h-28">
                                    <svg className="w-28 h-28 -rotate-90" viewBox="0 0 36 36">
                                        <path className="text-slate-100 stroke-current" strokeWidth="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                        <path className="text-indigo-500 stroke-current" strokeWidth="3" strokeDasharray={`${profileCompletion}, 100`} fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                    </svg>
                                    <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-slate-800">{Math.min(100, profileCompletion)}%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
