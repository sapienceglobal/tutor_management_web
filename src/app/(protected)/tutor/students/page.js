'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { Input } from '@/components/ui/input';
import {
    Select, SelectContent, SelectItem,
    SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    Search, Mail, BookOpen, Calendar, User,
    ShieldBan, ShieldCheck, Users, Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useConfirm } from '@/components/providers/ConfirmProvider';

export default function TutorStudentsPage() {
    const [students, setStudents]         = useState([]);
    const [loading, setLoading]           = useState(true);
    const [searchTerm, setSearchTerm]     = useState('');
    const [courseFilter, setCourseFilter] = useState('all');
    const [courses, setCourses]           = useState([]);
    const [blockingId, setBlockingId]     = useState(null);
    const { confirmDialog }               = useConfirm();

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [coursesRes, studentsRes] = await Promise.all([
                api.get('/courses/my-courses'),
                api.get('/tutor/dashboard/students'),
            ]);
            if (coursesRes.data.success)  setCourses(coursesRes.data.courses);
            if (studentsRes.data.success) setStudents(studentsRes.data.students);
            else setStudents([]);
        } catch { setStudents([]); }
        finally { setLoading(false); }
    };

    const handleBlockStudent = async (studentId, studentName, isBlocked) => {
        const action = isBlocked ? 'unblock' : 'block';
        const ok = await confirmDialog(
            `${isBlocked ? 'Unblock' : 'Block'} Student`,
            `Are you sure you want to ${action} ${studentName}? ${!isBlocked ? 'This student will no longer see you as a tutor anywhere.' : 'This student will be able to see you again.'}`,
            { variant: isBlocked ? 'default' : 'destructive' }
        );
        if (!ok) return;
        try {
            setBlockingId(studentId);
            await api.post(`/tutor/dashboard/students/${studentId}/${action}`);
            toast.success(`Student ${action}ed successfully`);
            setStudents(prev => prev.map(s =>
                s._id === studentId ? { ...s, isBlockedByTutor: !isBlocked } : s
            ));
        } catch (error) {
            toast.error(error.response?.data?.message || `Failed to ${action} student`);
        } finally { setBlockingId(null); }
    };

    const filtered = students.filter(s => {
        const matchSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchCourse = courseFilter === 'all' ||
            s.enrolledCourses?.some(c => c.courseId === courseFilter);
        return matchSearch && matchCourse;
    });

    const totalStudents   = students.length;
    const activeStudents  = students.filter(s => s.lastActive && new Date(s.lastActive) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length;
    const blockedStudents = students.filter(s => s.isBlockedByTutor).length;

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
                <Loader2 className="w-7 h-7 animate-spin" style={{ color: 'var(--theme-primary)' }} />
                <p className="text-sm text-slate-400">Loading students...</p>
            </div>
        );
    }

    return (
        <div className="space-y-5" style={{ fontFamily: "var(--theme-font, 'DM Sans', sans-serif)" }}>

            {/* ── Header ────────────────────────────────────────────────────── */}
            <div className="bg-white rounded-xl border border-slate-100 px-5 py-4">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 12%, white)', border: '1px solid color-mix(in srgb, var(--theme-primary) 20%, white)' }}>
                        <Users className="w-4 h-4" style={{ color: 'var(--theme-primary)' }} />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-slate-800">My Students</h1>
                        <p className="text-xs text-slate-400">Manage and monitor student progress across your courses</p>
                    </div>
                </div>
            </div>

            {/* ── Stats ─────────────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Students',  value: totalStudents,   sub: 'Across all courses',      icon: User,      color: 'text-blue-500',    bg: 'bg-blue-50' },
                    { label: 'Active Learners', value: activeStudents,  sub: 'Active in last 7 days',   icon: Users,     color: 'text-emerald-500', bg: 'bg-emerald-50' },
                    { label: 'Courses',         value: courses.length,  sub: 'Active courses',          icon: BookOpen,  color: 'text-amber-500',   bg: 'bg-amber-50' },
                    { label: 'Blocked',         value: blockedStudents, sub: 'Students blocked by you', icon: ShieldBan, color: 'text-red-500',     bg: 'bg-red-50' },
                ].map(({ label, value, sub, icon: Icon, color, bg }) => (
                    <div key={label} className="bg-white rounded-xl border border-slate-100 p-5 hover:shadow-sm transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-semibold text-slate-500">{label}</p>
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${bg}`}>
                                <Icon className={`w-4 h-4 ${color}`} />
                            </div>
                        </div>
                        <p className="text-2xl font-black text-slate-800">{value}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
                    </div>
                ))}
            </div>

            {/* ── Filters ───────────────────────────────────────────────────── */}
            <div className="bg-white rounded-xl border border-slate-100 p-3 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input placeholder="Search by name or email..."
                        className="pl-9 h-9 border-slate-200 text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <Select value={courseFilter} onValueChange={setCourseFilter}>
                    <SelectTrigger className="w-full sm:w-52 h-9 border-slate-200 text-sm">
                        <SelectValue placeholder="Filter by Course" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Courses</SelectItem>
                        {courses.map(course => (
                            <SelectItem key={course._id} value={course._id}>{course.title}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* ── Table ─────────────────────────────────────────────────────── */}
            <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                {/* Head */}
                <div className="grid grid-cols-[2fr_2fr_1fr_1fr_80px_100px] gap-4 px-5 py-3 border-b border-slate-100 bg-slate-50/60">
                    {['Student', 'Enrolled Courses', 'Joined', 'Progress', 'Status', 'Actions'].map(h => (
                        <span key={h} className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{h}</span>
                    ))}
                </div>

                {filtered.length > 0 ? (
                    <div className="divide-y divide-slate-50">
                        {filtered.map(student => (
                            <div key={student._id}
                                className={`grid grid-cols-[2fr_2fr_1fr_1fr_80px_100px] gap-4 px-5 py-4 items-center transition-colors
                                    ${student.isBlockedByTutor ? 'bg-red-50/30' : 'hover:bg-slate-50/40'}`}>

                                {/* Student */}
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0
                                        ${student.isBlockedByTutor ? 'bg-red-100 text-red-600' : 'text-white'}`}
                                        style={!student.isBlockedByTutor ? { background: 'linear-gradient(135deg, var(--theme-sidebar), var(--theme-primary))' } : {}}>
                                        {student.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-slate-800 truncate">{student.name}</p>
                                        <p className="text-[11px] text-slate-400 flex items-center gap-1 truncate">
                                            <Mail className="w-3 h-3 flex-shrink-0" /> {student.email}
                                        </p>
                                    </div>
                                </div>

                                {/* Courses */}
                                <div className="flex flex-wrap gap-1">
                                    {student.enrolledCourses?.length > 0
                                        ? student.enrolledCourses.map((ec, idx) => (
                                            <span key={idx} className="text-[10px] px-2 py-0.5 rounded-full font-semibold border"
                                                style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 8%, white)', color: 'var(--theme-primary)', borderColor: 'color-mix(in srgb, var(--theme-primary) 20%, white)' }}>
                                                {ec.title}
                                            </span>
                                        ))
                                        : <span className="text-xs text-slate-400">None</span>}
                                </div>

                                {/* Joined */}
                                <div className="flex items-center gap-1 text-xs text-slate-500">
                                    <Calendar className="w-3 h-3 flex-shrink-0" />
                                    {format(new Date(student.joinedAt || Date.now()), 'MMM d, yyyy')}
                                </div>

                                {/* Progress */}
                                <div>
                                    <span className="text-[10px] font-bold text-slate-600">{student.averageProgress || 0}%</span>
                                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mt-1">
                                        <div className="h-full rounded-full transition-all"
                                            style={{ width: `${student.averageProgress || 0}%`, backgroundColor: 'var(--theme-primary)' }} />
                                    </div>
                                </div>

                                {/* Status */}
                                <div>
                                    {student.isBlockedByTutor
                                        ? <span className="text-[10px] px-2 py-1 rounded-full font-bold bg-red-50 text-red-600 border border-red-200">Blocked</span>
                                        : <span className="text-[10px] px-2 py-1 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Active</span>}
                                </div>

                                {/* Action */}
                                <div>
                                    <button
                                        disabled={blockingId === student._id}
                                        onClick={() => handleBlockStudent(student._id, student.name, student.isBlockedByTutor)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors disabled:opacity-50
                                            ${student.isBlockedByTutor
                                                ? 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                                : 'border-red-200 text-red-600 hover:bg-red-50'}`}>
                                        {blockingId === student._id
                                            ? <Loader2 className="w-3 h-3 animate-spin" />
                                            : student.isBlockedByTutor
                                                ? <><ShieldCheck className="w-3 h-3" /> Unblock</>
                                                : <><ShieldBan className="w-3 h-3" /> Block</>}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-14">
                        <div className="mx-auto w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
                            style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 8%, white)' }}>
                            <Users className="w-6 h-6" style={{ color: 'var(--theme-primary)' }} />
                        </div>
                        <p className="text-sm font-semibold text-slate-600 mb-1">
                            {students.length === 0 ? 'No students found.' : 'No matching students.'}
                        </p>
                        <p className="text-xs text-slate-400">
                            {searchTerm || courseFilter !== 'all' ? 'Try adjusting your search or filter.' : 'Students will appear here once they enroll.'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}