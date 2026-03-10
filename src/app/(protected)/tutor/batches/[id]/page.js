'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Users, Search, Plus, Trash2, Mail, CheckCircle2, Megaphone, BarChart3, Loader2, Send, TrendingUp } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';

export default function BatchDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const { id } = params;

    const [batch, setBatch] = useState(null);
    const [loading, setLoading] = useState(true);
    const [allStudents, setAllStudents] = useState([]); // Master list of students to add
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddingMode, setIsAddingMode] = useState(false);
    const [activeTab, setActiveTab] = useState('students'); // students | announcements | analytics
    const [announcementForm, setAnnouncementForm] = useState({ title: '', message: '' });
    const [postingAnnouncement, setPostingAnnouncement] = useState(false);
    const [analytics, setAnalytics] = useState(null);
    const [loadingAnalytics, setLoadingAnalytics] = useState(false);

    useEffect(() => {
        if (id) {
            fetchBatchDetails();
        }
    }, [id]);

    const fetchBatchDetails = async () => {
        try {
            const res = await api.get(`/batches/${id}`);
            if (res.data.success) {
                setBatch(res.data.batch);
            }
        } catch (error) {
            console.error('Fetch batch details error:', error);
            toast.error('Failed to load batch details');
            router.push('/tutor/batches');
        } finally {
            setLoading(false);
        }
    };

    const fetchEligibleStudents = async () => {
        try {
            // Ideally an endpoint that gets students NOT in the batch, or all students for this course
            // For now, let's fetch all students and filter locally
            const res = await api.get('/tutors/students'); // or the relevant endpoint to get your students
            if (res.data.success) {
                // filter out people already in batch
                const enrolledIds = batch.students.map(s => s._id);
                const eligible = res.data.data.filter(s => !enrolledIds.includes(s._id));
                setAllStudents(eligible);
                setIsAddingMode(true);
            }
        } catch (error) {
            console.error('Fetch students error:', error);
            toast.error('Failed to load eligible students');
        }
    };

    const handleAddStudent = async (studentId) => {
        try {
            const newStudentsList = [...batch.students.map(s => s._id), studentId];
            const res = await api.put(`/batches/${id}/students`, { studentIds: newStudentsList });
            if (res.data.success) {
                toast.success('Student added to batch');
                fetchBatchDetails(); // Refresh local data
                setIsAddingMode(false);
            }
        } catch (error) {
            console.error('Add student error:', error);
            toast.error('Failed to add student');
        }
    };

    const handleRemoveStudent = async (studentId) => {
        if (!confirm('Remove this student from the batch?')) return;

        try {
            const newStudentsList = batch.students.filter(s => s._id !== studentId).map(s => s._id);
            const res = await api.put(`/batches/${id}/students`, { studentIds: newStudentsList });
            if (res.data.success) {
                toast.success('Student removed from batch');
                fetchBatchDetails();
            }
        } catch (error) {
            console.error('Remove student error:', error);
            toast.error('Failed to remove student');
        }
    };

    const handlePostAnnouncement = async () => {
        if (!announcementForm.title.trim() || !announcementForm.message.trim()) {
            return toast.error('Title and message are required');
        }
        setPostingAnnouncement(true);
        try {
            const res = await api.post(`/batches/${id}/announcements`, announcementForm);
            if (res.data.success) {
                toast.success('Announcement posted!');
                setAnnouncementForm({ title: '', message: '' });
                fetchBatchDetails();
            }
        } catch (error) {
            toast.error('Failed to post announcement');
        } finally {
            setPostingAnnouncement(false);
        }
    };

    const fetchAnalytics = async () => {
        if (analytics) return; // Already loaded
        setLoadingAnalytics(true);
        try {
            const res = await api.get(`/batches/${id}/analytics`);
            if (res.data.success) {
                setAnalytics(res.data.analytics);
            }
        } catch (error) {
            toast.error('Failed to load analytics');
        } finally {
            setLoadingAnalytics(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-24">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!batch) return null;

    const filteredStudents = allStudents.filter(s =>
        s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" className="p-2" onClick={() => router.back()}>
                    <ArrowLeft className="w-5 h-5 text-slate-500" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">{batch.name}</h1>
                    <p className="text-slate-500 text-sm mt-1">{batch.courseId?.title} • {batch.scheduleDescription}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Stats */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                                <Users className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500">Total Enrolled</p>
                                <p className="text-2xl font-bold text-slate-900">{batch.students.length}</p>
                            </div>
                        </div>
                        <Link href={`/tutor/batches/${id}/attendance`} className="block w-full">
                            <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm mt-4">
                                <CheckCircle2 className="w-4 h-4 mr-2" /> Daily Attendance Log
                            </Button>
                        </Link>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
                        <h3 className="font-semibold text-slate-800">Batch Details</h3>
                        <div className="text-sm text-slate-600 space-y-2">
                            <div className="flex justify-between py-1 border-b border-slate-50">
                                <span className="text-slate-400">Status</span>
                                <span className="font-medium capitalize text-slate-800">{batch.status}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-50">
                                <span className="text-slate-400">Start Date</span>
                                <span className="font-medium text-slate-800">{new Date(batch.startDate).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between py-1">
                                <span className="text-slate-400">End Date</span>
                                <span className="font-medium text-slate-800">{batch.endDate ? new Date(batch.endDate).toLocaleDateString() : 'Ongoing'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Tabs Content */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Tab Buttons */}
                    <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                        {[{ key: 'students', label: 'Students', icon: Users }, { key: 'announcements', label: 'Announcements', icon: Megaphone }, { key: 'analytics', label: 'Analytics', icon: BarChart3 }].map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => { setActiveTab(tab.key); if (tab.key === 'analytics') fetchAnalytics(); }}
                                className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${activeTab === tab.key ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-600 hover:text-slate-900'}`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Students Tab */}
                    {activeTab === 'students' && (
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
                            <div className="p-4 md:p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <Users className="w-5 h-5 text-indigo-500" /> Enrolled Students
                                </h2>

                                {!isAddingMode ? (
                                    <Button onClick={fetchEligibleStudents} variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100">
                                        <Plus className="w-4 h-4 mr-2" /> Add Students
                                    </Button>
                                ) : (
                                    <Button onClick={() => setIsAddingMode(false)} variant="ghost" className="text-slate-500">
                                        Cancel Adding
                                    </Button>
                                )}
                            </div>

                            {isAddingMode && (
                                <div className="p-4 bg-slate-50 border-b border-slate-200">
                                    <div className="relative">
                                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Search students to add..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div className="mt-4 max-h-64 overflow-y-auto space-y-2">
                                        {filteredStudents.length === 0 ? (
                                            <p className="text-sm text-slate-500 text-center py-4">No eligible students found.</p>
                                        ) : (
                                            filteredStudents.map(student => (
                                                <div key={student._id} className="flex justify-between items-center p-3 bg-white rounded-lg border border-slate-200">
                                                    <div className="flex items-center gap-3">
                                                        <img src={student.profileImage || `https://ui-avatars.com/api/?name=${student.name}`} alt="" className="w-8 h-8 rounded-full" />
                                                        <div>
                                                            <p className="text-sm font-medium text-slate-800">{student.name}</p>
                                                            <p className="text-xs text-slate-500">{student.email}</p>
                                                        </div>
                                                    </div>
                                                    <Button size="sm" onClick={() => handleAddStudent(student._id)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                                        Add
                                                    </Button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="flex-1 overflow-auto p-4 md:p-6">
                                {batch.students.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-3 py-10">
                                        <Users className="w-12 h-12 opacity-20" />
                                        <p>No students enrolled in this batch yet.</p>
                                        <Button onClick={fetchEligibleStudents} variant="outline" className="mt-2">
                                            Enroll Students
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {batch.students.map((student, idx) => (
                                            <div key={student._id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-indigo-100 bg-white transition-colors group">
                                                <div className="flex items-center gap-4">
                                                    <div className="relative">
                                                        <img
                                                            src={student.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=E0E7FF&color=4F46E5`}
                                                            alt={student.name}
                                                            className="w-10 h-10 rounded-full border border-slate-200"
                                                        />
                                                        <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-slate-800 text-white text-[10px] font-bold rounded-full flex items-center justify-center border border-white">
                                                            {idx + 1}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <h3 className="text-sm font-bold text-slate-800">{student.name}</h3>
                                                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                                                            <Mail className="w-3 h-3" />
                                                            {student.email}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-600" onClick={() => handleRemoveStudent(student._id)}>
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Announcements Tab */}
                    {activeTab === 'announcements' && (
                        <div className="space-y-4">
                            {/* Post New Announcement */}
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    <Megaphone className="w-5 h-5 text-amber-500" />
                                    Post New Announcement
                                </h3>
                                <Input
                                    placeholder="Announcement Title"
                                    value={announcementForm.title}
                                    onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                                />
                                <Textarea
                                    placeholder="Announcement message..."
                                    value={announcementForm.message}
                                    onChange={(e) => setAnnouncementForm({ ...announcementForm, message: e.target.value })}
                                    className="h-24"
                                />
                                <Button
                                    onClick={handlePostAnnouncement}
                                    disabled={postingAnnouncement}
                                    className="bg-amber-600 hover:bg-amber-700 text-white"
                                >
                                    {postingAnnouncement ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                                    Post Announcement
                                </Button>
                            </div>

                            {/* Announcement History */}
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="p-4 border-b bg-slate-50">
                                    <h3 className="font-semibold text-slate-700">Previous Announcements</h3>
                                </div>
                                {batch.announcements && batch.announcements.length > 0 ? (
                                    <div className="divide-y">
                                        {[...batch.announcements].reverse().map((ann, idx) => (
                                            <div key={idx} className="p-4 hover:bg-slate-50">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h4 className="font-bold text-slate-800">{ann.title}</h4>
                                                    <span className="text-xs text-slate-400">{new Date(ann.createdAt).toLocaleDateString()}</span>
                                                </div>
                                                <p className="text-sm text-slate-600">{ann.message}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-8 text-center text-slate-400">
                                        <Megaphone className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                        <p>No announcements posted yet.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Analytics Tab */}
                    {activeTab === 'analytics' && (
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                            {loadingAnalytics ? (
                                <div className="flex items-center justify-center py-16">
                                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                                </div>
                            ) : analytics ? (
                                <div className="space-y-6">
                                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5 text-indigo-500" />
                                        Batch Performance Analytics
                                    </h3>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {[
                                            { label: 'Students', value: analytics.totalStudents, color: 'bg-indigo-50 text-indigo-700' },
                                            { label: 'Avg Score', value: `${analytics.avgScore}%`, color: 'bg-emerald-50 text-emerald-700' },
                                            { label: 'Pass Rate', value: `${analytics.passRate}%`, color: 'bg-blue-50 text-blue-700' },
                                            { label: 'Total Exams', value: analytics.totalExamResults, color: 'bg-purple-50 text-purple-700' },
                                        ].map((stat, i) => (
                                            <div key={i} className={`p-4 rounded-xl ${stat.color}`}>
                                                <p className="text-xs font-semibold uppercase tracking-wider opacity-70">{stat.label}</p>
                                                <p className="text-2xl font-bold mt-1">{stat.value}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Student Performance Table */}
                                    {analytics.studentSummary && analytics.studentSummary.length > 0 && (
                                        <div>
                                            <h4 className="font-semibold text-slate-700 mb-3">Per-Student Summary</h4>
                                            <table className="w-full text-sm">
                                                <thead className="bg-slate-50">
                                                    <tr>
                                                        <th className="text-left px-4 py-2 text-slate-600">#</th>
                                                        <th className="text-left px-4 py-2 text-slate-600">Student</th>
                                                        <th className="text-right px-4 py-2 text-slate-600">Exams</th>
                                                        <th className="text-right px-4 py-2 text-slate-600">Avg Score</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y">
                                                    {analytics.studentSummary.map((s, idx) => (
                                                        <tr key={idx} className="hover:bg-slate-50">
                                                            <td className="px-4 py-3 text-slate-500">{idx + 1}</td>
                                                            <td className="px-4 py-3">
                                                                <p className="font-medium text-slate-800">{s.student.name}</p>
                                                                <p className="text-xs text-slate-400">{s.student.email}</p>
                                                            </td>
                                                            <td className="px-4 py-3 text-right text-slate-700">{s.examsTaken}</td>
                                                            <td className="px-4 py-3 text-right">
                                                                <span className={`font-bold ${s.avgScore >= 60 ? 'text-emerald-600' : s.avgScore >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                                                                    {s.avgScore}%
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-16 text-slate-400">
                                    <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                    <p>No analytics data available.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
