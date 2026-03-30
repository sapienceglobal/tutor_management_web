'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import {
    Search, Mail, BookOpen, Calendar, User,
    ShieldBan, ShieldCheck, Users, Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useConfirm } from '@/components/providers/ConfirmProvider';
import { C, T, S, R } from '@/constants/tutorTokens';

const onFocusHandler = e => {
    e.target.style.borderColor = C.btnPrimary;
    e.target.style.boxShadow = '0 0 0 3px rgba(117,115,232,0.10)';
};
const onBlurHandler = e => {
    e.target.style.borderColor = 'transparent';
    e.target.style.boxShadow = 'none';
};

const baseInputStyle = {
    backgroundColor: '#E3DFF8',
    border: '1.5px solid transparent',
    borderRadius: R.xl,
    color: C.heading,
    fontFamily: T.fontFamily,
    fontSize: T.size.sm,
    fontWeight: T.weight.medium,
    outline: 'none',
    width: '100%',
    padding: '10px 16px',
    transition: 'all 0.2s ease',
};

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
            if (coursesRes?.data?.success)  setCourses(coursesRes.data.courses);
            if (studentsRes?.data?.success) setStudents(studentsRes.data.students);
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
            toast.error(error?.response?.data?.message || `Failed to ${action} student`);
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
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3" style={{ backgroundColor: '#dfdaf3', fontFamily: T.fontFamily }}>
                <Loader2 className="animate-spin" style={{ color: C.btnPrimary, width: '28px', height: '28px' }} />
                <p style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.bold }}>Loading students...</p>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen p-6" style={{ backgroundColor: '#dfdaf3', fontFamily: T.fontFamily }}>
            
            {/* ── Header ────────────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 style={{ color: C.heading, fontSize: T.size['2xl'], fontWeight: T.weight.black, margin: '0 0 4px 0' }}>All Students</h1>
                    <p style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.medium, margin: 0 }}>Students / All Students</p>
                </div>
            </div>

            {/* ── Stats ─────────────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'Total Students',  value: totalStudents,   sub: 'Across all courses',      icon: User,      color: C.btnPrimary, bg: '#E3DFF8' },
                    { label: 'Active Learners', value: activeStudents,  sub: 'Active in last 7 days',   icon: Users,     color: C.success,    bg: C.successBg },
                    { label: 'Courses',         value: courses.length,  sub: 'Active courses',          icon: BookOpen,  color: C.warning,    bg: C.warningBg },
                    { label: 'Blocked',         value: blockedStudents, sub: 'Students blocked by you', icon: ShieldBan, color: C.danger,     bg: C.dangerBg },
                ].map(({ label, value, sub, icon: Icon, color, bg }) => (
                    <div key={label} className="p-5 flex flex-col justify-between" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="flex items-center justify-center shrink-0" style={{ width: '36px', height: '36px', borderRadius: R.md, backgroundColor: bg }}>
                                <Icon size={18} color={color} />
                            </div>
                            <p style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>{label}</p>
                        </div>
                        <div className="flex items-end gap-3 mt-auto">
                            <p style={{ fontSize: T.size['3xl'], fontWeight: T.weight.black, color: C.heading, margin: 0, lineHeight: 1 }}>{value}</p>
                            <p style={{ fontSize: T.size.xs, fontWeight: T.weight.medium, color: C.textMuted, margin: '0 0 4px 0' }}>{sub}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Filters ───────────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={16} color={C.textMuted} />
                    <input 
                        placeholder="Search students by name, email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ ...baseInputStyle, paddingLeft: '36px' }}
                        onFocus={onFocusHandler} onBlur={onBlurHandler}
                    />
                </div>
                <select 
                    value={courseFilter} 
                    onChange={(e) => setCourseFilter(e.target.value)}
                    style={{ ...baseInputStyle, width: '100%', maxWidth: '250px' }}
                    onFocus={onFocusHandler} onBlur={onBlurHandler}
                >
                    <option value="all">All Courses</option>
                    {courses.map(course => (
                        <option key={course._id} value={course._id}>{course.title}</option>
                    ))}
                </select>
            </div>

            {/* ── Table ─────────────────────────────────────────────────────── */}
            <div className="p-5 overflow-x-auto" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                <div className="min-w-[800px]">
                    {/* Head */}
                    <div className="grid grid-cols-[2fr_2fr_1fr_1fr_80px_100px] gap-4 px-4 pb-3 mb-2" style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                        {['Student', 'Enrolled Courses', 'Joined', 'Progress', 'Status', 'Action'].map(h => (
                            <span key={h} style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted }}>{h}</span>
                        ))}
                    </div>

                    {filtered.length > 0 ? (
                        <div className="flex flex-col gap-2">
                            {filtered.map(student => (
                                <div key={student._id} className="grid grid-cols-[2fr_2fr_1fr_1fr_80px_100px] gap-4 px-4 py-3 items-center"
                                    style={{ backgroundColor: '#E3DFF8', borderRadius: R.xl }}>

                                    {/* Student */}
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="flex items-center justify-center shrink-0"
                                            style={{ 
                                                width: '40px', height: '40px', borderRadius: R.full, 
                                                background: student.isBlockedByTutor ? C.dangerBg : C.gradientBtn,
                                                color: student.isBlockedByTutor ? C.danger : '#ffffff',
                                                fontSize: T.size.md, fontWeight: T.weight.bold,
                                                border: student.isBlockedByTutor ? `1px solid ${C.dangerBorder}` : 'none'
                                            }}>
                                            {student.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate" style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 2px 0' }}>{student.name}</p>
                                            <p className="flex items-center gap-1.5 truncate" style={{ fontSize: T.size.xs, fontWeight: T.weight.medium, color: C.textMuted, margin: 0 }}>
                                                <Mail size={12} /> {student.email}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Courses */}
                                    <div className="flex flex-wrap gap-1.5">
                                        {student.enrolledCourses?.length > 0
                                            ? student.enrolledCourses.map((ec, idx) => (
                                                <span key={idx} className="truncate max-w-full"
                                                    style={{ 
                                                        fontSize: '11px', fontWeight: T.weight.bold, color: C.heading, 
                                                        backgroundColor: '#EAE8FA', padding: '4px 8px', borderRadius: R.md,
                                                        border: `1px solid ${C.cardBorder}`
                                                    }}>
                                                    {ec.title}
                                                </span>
                                            ))
                                            : <span style={{ fontSize: T.size.xs, color: C.textMuted }}>None</span>}
                                    </div>

                                    {/* Joined */}
                                    <div className="flex items-center gap-1.5" style={{ fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.textMuted }}>
                                        <Calendar size={14} />
                                        {format(new Date(student.joinedAt || Date.now()), 'MMM d, yyyy')}
                                    </div>

                                    {/* Progress */}
                                    <div className="flex flex-col justify-center">
                                        <span style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 4px 0' }}>{student.averageProgress || 0}%</span>
                                        <div style={{ width: '100%', height: '6px', backgroundColor: '#EAE8FA', borderRadius: R.full, overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: `${student.averageProgress || 0}%`, backgroundColor: C.btnPrimary, borderRadius: R.full, transition: 'width 0.3s ease' }} />
                                        </div>
                                    </div>

                                    {/* Status */}
                                    <div>
                                        {student.isBlockedByTutor ? (
                                            <span style={{ fontSize: '11px', fontWeight: T.weight.bold, color: C.danger, backgroundColor: C.dangerBg, border: `1px solid ${C.dangerBorder}`, padding: '4px 8px', borderRadius: R.md }}>Blocked</span>
                                        ) : (
                                            <span style={{ fontSize: '11px', fontWeight: T.weight.bold, color: C.success, backgroundColor: C.successBg, border: `1px solid ${C.successBorder}`, padding: '4px 8px', borderRadius: R.md }}>Active</span>
                                        )}
                                    </div>

                                    {/* Action */}
                                    <div>
                                        <button
                                            disabled={blockingId === student._id}
                                            onClick={() => handleBlockStudent(student._id, student.name, student.isBlockedByTutor)}
                                            className="flex items-center justify-center gap-1.5 cursor-pointer transition-opacity hover:opacity-70 disabled:opacity-50"
                                            style={{ 
                                                backgroundColor: student.isBlockedByTutor ? C.successBg : C.dangerBg, 
                                                color: student.isBlockedByTutor ? C.success : C.danger,
                                                border: `1px solid ${student.isBlockedByTutor ? C.successBorder : C.dangerBorder}`,
                                                padding: '6px 12px', borderRadius: R.md, fontSize: T.size.xs, fontWeight: T.weight.bold, fontFamily: T.fontFamily
                                            }}>
                                            {blockingId === student._id ? (
                                                <Loader2 size={14} className="animate-spin" />
                                            ) : student.isBlockedByTutor ? (
                                                <><ShieldCheck size={14} /> Unblock</>
                                            ) : (
                                                <><ShieldBan size={14} /> Block</>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 flex flex-col items-center">
                            <div className="flex items-center justify-center mb-4" style={{ width: '64px', height: '64px', backgroundColor: '#E3DFF8', borderRadius: R.xl }}>
                                <Users size={32} color={C.textMuted} />
                            </div>
                            <p style={{ fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 8px 0' }}>
                                {students.length === 0 ? 'No students found.' : 'No matching students.'}
                            </p>
                            <p style={{ fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.textMuted, margin: 0 }}>
                                {searchTerm || courseFilter !== 'all' ? 'Try adjusting your search or filter.' : 'Students will appear here once they enroll.'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}