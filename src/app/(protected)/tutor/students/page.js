'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import {
    MdSearch, MdMail, MdMenuBook, MdCalendarToday, MdPerson,
    MdBlock, MdCheckCircle, MdPeople, MdHourglassEmpty
} from 'react-icons/md';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useConfirm } from '@/components/providers/ConfirmProvider';
import { C, T, S, R } from '@/constants/studentTokens';
import StatCard from '@/components/StatCard';

const onFocusHandler = e => {
    e.target.style.borderColor = C.btnPrimary;
    e.target.style.boxShadow = `0 0 0 3px ${C.btnPrimary}15`;
    e.target.style.backgroundColor = C.cardBg;
};
const onBlurHandler = e => {
    e.target.style.borderColor = C.cardBorder;
    e.target.style.boxShadow = 'none';
    e.target.style.backgroundColor = C.innerBg;
};

const baseInputStyle = {
    backgroundColor: C.innerBg,
    border: `1px solid ${C.cardBorder}`,
    borderRadius: '10px',
    color: C.heading,
    fontFamily: T.fontFamily,
    fontSize: T.size.base,
    fontWeight: T.weight.semibold,
    outline: 'none',
    width: '100%',
    height: '44px',
    padding: '10px 16px',
    transition: 'all 0.2s ease',
};

// ─── Score Bar ─────────────────────────────────────────────────────────────────
function ScoreBar({ score }) {
    const color = score >= 80 ? C.success : score >= 50 ? C.warning : C.danger;
    return (
        <div className="flex items-center gap-3 w-full">
            <div className="flex-1 overflow-hidden" style={{ height: 6, borderRadius: '10px', backgroundColor: C.innerBg, maxWidth: 100 }}>
                <div style={{ width: `${score}%`, height: '100%', backgroundColor: color, borderRadius: '10px' }} />
            </div>
            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color, minWidth: 36 }}>
                {score}%
            </span>
        </div>
    );
}

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

    // ─── Loading State ────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: C.pageBg }}>
                <div className="flex flex-col items-center gap-3">
                    <div className="relative w-12 h-12">
                        <div className="w-12 h-12 rounded-full border-[3px] animate-spin"
                            style={{ borderColor: `${C.btnPrimary}30`, borderTopColor: C.btnPrimary }} />
                    </div>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.semibold, color: C.text }}>
                        Loading students...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen p-6 md:p-8" style={{ backgroundColor: C.pageBg, fontFamily: T.fontFamily }}>
            
            {/* ── Header ────────────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 style={{ color: C.heading, fontSize: T.size['2xl'], fontWeight: T.weight.bold, margin: '0 0 4px 0' }}>All Students</h1>
                    <p style={{ color: C.textMuted, fontSize: T.size.base, fontWeight: T.weight.semibold, margin: 0 }}>Manage and track your students' progress</p>
                </div>
            </div>

            {/* ── Stats ─────────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard 
                    label="Total Students" value={totalStudents} subtext="Across all courses" 
                    icon={MdPerson} iconBg={C.innerBg} iconColor={C.btnPrimary} 
                />
                <StatCard 
                    label="Active Learners" value={activeStudents} subtext="Active in last 7 days" 
                    icon={MdPeople} iconBg={C.successBg} iconColor={C.success} 
                />
                <StatCard 
                    label="Courses" value={courses.length} subtext="Active courses" 
                    icon={MdMenuBook} iconBg={C.warningBg} iconColor={C.warning} 
                />
                <StatCard 
                    label="Blocked" value={blockedStudents} subtext="Blocked by you" 
                    icon={MdBlock} iconBg={C.dangerBg} iconColor={C.danger} 
                />
            </div>

            {/* ── Filters ───────────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6 p-5" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                <div className="relative flex-1">
                    <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 transition-colors" style={{ width: 18, height: 18, color: C.textMuted }} />
                    <input 
                        placeholder="Search students by name, email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ ...baseInputStyle, paddingLeft: '36px' }}
                        onFocus={onFocusHandler} onBlur={onBlurHandler}
                    />
                </div>
                <div className="relative w-full sm:max-w-[250px]">
                    <select 
                        value={courseFilter} 
                        onChange={(e) => setCourseFilter(e.target.value)}
                        style={{ ...baseInputStyle, appearance: 'none', cursor: 'pointer' }}
                        onFocus={onFocusHandler} onBlur={onBlurHandler}
                    >
                        <option value="all">All Courses</option>
                        {courses.map(course => (
                            <option key={course._id} value={course._id}>{course.title}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* ── Table Area ────────────────────────────────────────────────── */}
            <div className="overflow-hidden" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                <div className="w-full overflow-x-auto p-4 custom-scrollbar">
                    <div className="min-w-[900px]">
                        
                        {/* Head */}
                        <div className="grid grid-cols-[2.5fr_2fr_1fr_1.5fr_1fr_120px] gap-4 px-4 py-3 mb-2" style={{ borderBottom: `1px solid ${C.cardBorder}`, backgroundColor: C.innerBox }}>
                            {['Student', 'Enrolled Courses', 'Joined', 'Progress', 'Status', 'Action'].map(h => (
                                <span key={h} style={{ fontSize: '10px', fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</span>
                            ))}
                        </div>

                        {filtered.length > 0 ? (
                            <div className="flex flex-col gap-2 pb-2">
                                {filtered.map(student => (
                                    <div key={student._id} className="grid grid-cols-[2.5fr_2fr_1fr_1.5fr_1fr_120px] gap-4 px-4 py-4 items-center transition-colors hover:bg-slate-50"
                                        style={{ backgroundColor: C.innerBg, borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}>

                                        {/* Student */}
                                        <div className="flex items-center gap-3 min-w-0 pr-2">
                                            <div className="flex items-center justify-center shrink-0"
                                                style={{ 
                                                    width: '40px', height: '40px', borderRadius: R.full, 
                                                    background: student.isBlockedByTutor ? C.dangerBg : C.iconBg,
                                                    color: student.isBlockedByTutor ? C.danger : C.btnPrimary,
                                                    fontSize: T.size.lg, fontWeight: T.weight.bold,
                                                    border: student.isBlockedByTutor ? `1px solid ${C.dangerBorder}` : `1px solid ${C.cardBorder}`
                                                }}>
                                                {student.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="truncate" style={{ fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 2px 0' }}>{student.name}</p>
                                                <p className="flex items-center gap-1.5 truncate" style={{ fontSize: T.size.xs, fontWeight: T.weight.semibold, color: C.textMuted, margin: 0 }}>
                                                    <MdMail style={{ width: 12, height: 12 }} /> {student.email}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Courses */}
                                        <div className="flex flex-wrap gap-1.5 pr-2">
                                            {student.enrolledCourses?.length > 0
                                                ? student.enrolledCourses.map((ec, idx) => (
                                                    <span key={idx} className="truncate max-w-full"
                                                        style={{ 
                                                            fontSize: '10px', fontWeight: T.weight.bold, color: C.heading, 
                                                            backgroundColor: C.cardBg, padding: '4px 8px', borderRadius: '8px',
                                                            border: `1px solid ${C.cardBorder}`
                                                        }}>
                                                        {ec.title}
                                                    </span>
                                                ))
                                                : <span style={{ fontSize: T.size.xs, color: C.textMuted, fontWeight: T.weight.semibold }}>None</span>}
                                        </div>

                                        {/* Joined */}
                                        <div className="flex items-center gap-1.5" style={{ fontSize: T.size.sm, fontWeight: T.weight.semibold, color: C.text }}>
                                            <MdCalendarToday style={{ width: 14, height: 14, color: C.textMuted }} />
                                            {format(new Date(student.joinedAt || Date.now()), 'MMM d, yyyy')}
                                        </div>

                                        {/* Progress */}
                                        <div className="pr-4">
                                            <ScoreBar score={student.averageProgress || 0} />
                                        </div>

                                        {/* Status */}
                                        <div>
                                            {student.isBlockedByTutor ? (
                                                <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: T.weight.bold, color: C.danger, backgroundColor: C.dangerBg, border: `1px solid ${C.dangerBorder}`, padding: '4px 8px', borderRadius: '8px' }}>Blocked</span>
                                            ) : (
                                                <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: T.weight.bold, color: C.success, backgroundColor: C.successBg, border: `1px solid ${C.successBorder}`, padding: '4px 8px', borderRadius: '8px' }}>Active</span>
                                            )}
                                        </div>

                                        {/* Action */}
                                        <div className="flex justify-end">
                                            <button
                                                disabled={blockingId === student._id}
                                                onClick={() => handleBlockStudent(student._id, student.name, student.isBlockedByTutor)}
                                                className="flex items-center justify-center gap-1.5 cursor-pointer transition-opacity hover:opacity-80 disabled:opacity-50 border-none"
                                                style={{ 
                                                    backgroundColor: student.isBlockedByTutor ? C.successBg : C.dangerBg, 
                                                    color: student.isBlockedByTutor ? C.success : C.danger,
                                                    border: `1px solid ${student.isBlockedByTutor ? C.successBorder : C.dangerBorder}`,
                                                    padding: '8px 12px', borderRadius: '10px', fontSize: T.size.xs, fontWeight: T.weight.bold, fontFamily: T.fontFamily
                                                }}>
                                                {blockingId === student._id ? (
                                                    <MdHourglassEmpty style={{ width: 14, height: 14 }} className="animate-spin" />
                                                ) : student.isBlockedByTutor ? (
                                                    <><MdCheckCircle style={{ width: 14, height: 14 }} /> Unblock</>
                                                ) : (
                                                    <><MdBlock style={{ width: 14, height: 14 }} /> Block</>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            /* ── Empty State ──────────────────────────────────────────────── */
                            <div className="p-14 text-center border border-dashed mx-4 mb-4 mt-2" style={{ backgroundColor: C.cardBg, borderColor: C.cardBorder, borderRadius: R['2xl'] }}>
                                <div className="flex items-center justify-center mx-auto mb-4" style={{ width: 56, height: 56, backgroundColor: C.innerBg, borderRadius: '10px' }}>
                                    <MdPeople style={{ width: 28, height: 28, color: C.textMuted }} />
                                </div>
                                <p style={{ fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 4px 0' }}>
                                    {students.length === 0 ? 'No students found.' : 'No matching students.'}
                                </p>
                                <p style={{ fontSize: T.size.base, fontWeight: T.weight.semibold, color: C.textMuted, margin: 0 }}>
                                    {searchTerm || courseFilter !== 'all' ? 'Try adjusting your search or filter.' : 'Students will appear here once they enroll.'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}