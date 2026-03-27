'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Map, Users, Sparkles, ChevronDown, Loader2,
    Clock, Target, BookOpen, CheckCircle2, Circle,
    Zap, Brain, Calendar, Trash2, ArrowRight,
    TrendingUp, BarChart2, RefreshCw, AlertTriangle,
    Play, PenLine, RotateCcw, Coffee, ClipboardList,
    Star, Award, ChevronRight
} from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { C, T, S, R } from '@/constants/tutorTokens';

// ─── Teal/Emerald palette (Student Intelligence — study plan) ─────────────────
const G = {
    primary:  '#059669',
    light:    '#10B981',
    soft:     'rgba(5,150,105,0.08)',
    border:   'rgba(5,150,105,0.14)',
    gradient: 'linear-gradient(135deg,#064E3B 0%,#059669 55%,#10B981 100%)',
    pageBg:   '#ECFDF5',
    accent:   '#6366F1',
    accentSoft:'rgba(99,102,241,0.08)',
    warn:     '#F59E0B',
    warnSoft: 'rgba(245,158,11,0.10)',
    red:      '#EF4444',
    redSoft:  'rgba(239,68,68,0.08)',
};

// ─── Activity type config ────────────────────────────────────────────────────
const ACTIVITY_CONFIG = {
    study:    { icon: BookOpen,      color: '#6366F1', bg: 'rgba(99,102,241,0.10)',  label: 'Study'    },
    practice: { icon: PenLine,       color: '#F59E0B', bg: 'rgba(245,158,11,0.10)', label: 'Practice' },
    revision: { icon: RotateCcw,     color: '#3B82F6', bg: 'rgba(59,130,246,0.10)', label: 'Revision' },
    quiz:     { icon: ClipboardList, color: '#8B5CF6', bg: 'rgba(139,92,246,0.10)', label: 'Quiz'     },
    break:    { icon: Coffee,        color: '#94A3B8', bg: 'rgba(148,163,184,0.10)', label: 'Break'   },
};

const RISK_CONFIG = {
    critical: { color: '#EF4444', bg: 'rgba(239,68,68,0.10)', label: 'Critical' },
    high:     { color: '#F97316', bg: 'rgba(249,115,22,0.10)', label: 'High Risk' },
    medium:   { color: '#F59E0B', bg: 'rgba(245,158,11,0.10)', label: 'Medium Risk' },
    low:      { color: '#10B981', bg: 'rgba(16,185,129,0.10)', label: 'Low Risk' },
    unknown:  { color: '#94A3B8', bg: 'rgba(148,163,184,0.10)', label: 'No Data' },
};

const DIFFICULTY_OPTIONS = [
    { value: 'easy',      label: 'Easy',      desc: 'Light pace, fundamentals focus' },
    { value: 'moderate',  label: 'Moderate',  desc: 'Balanced — recommended'         },
    { value: 'intensive', label: 'Intensive', desc: 'Fast-paced, exam prep mode'     },
];

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skel({ h = 10, w = '100%', r = 12 }) {
    return <div className="animate-pulse" style={{ height: h, width: w, borderRadius: r, backgroundColor: 'rgba(5,150,105,0.08)' }} />;
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ src, name, size = 36 }) {
    const initials = (name || 'S').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    return src ? (
        <img src={src} alt={name} style={{ width: size, height: size, borderRadius: 999, objectFit: 'cover', flexShrink: 0 }} />
    ) : (
        <div style={{ width: size, height: size, borderRadius: 999, background: G.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontFamily: T.fontFamily, fontSize: size * 0.33, fontWeight: T.weight.black, color: '#fff' }}>{initials}</span>
        </div>
    );
}

// ─── Day Card ─────────────────────────────────────────────────────────────────
function DayCard({ day, index, isActive, onClick }) {
    const totalTopics = day.topics?.length || 0;
    const studyTopics = day.topics?.filter(t => t.type !== 'break').length || 0;

    return (
        <div onClick={onClick}
            className="p-3 rounded-xl cursor-pointer transition-all"
            style={{
                backgroundColor: isActive ? G.soft : '#fff',
                border:          isActive ? `1.5px solid ${G.primary}` : `1px solid ${G.border}`,
                boxShadow:       isActive ? `0 0 0 3px ${G.primary}15` : S.card,
            }}
            onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = G.soft; }}
            onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = '#fff'; }}>
            <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                        style={{ background: isActive ? G.gradient : G.soft }}>
                        <span style={{ fontFamily: T.fontFamily, fontSize: '9px', fontWeight: T.weight.black, color: isActive ? '#fff' : G.primary }}>
                            {index + 1}
                        </span>
                    </div>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: '#1E293B' }}>{day.day}</p>
                </div>
                <span style={{ fontFamily: T.fontFamily, fontSize: '9px', color: '#94A3B8' }}>{day.date}</span>
            </div>
            <p className="truncate" style={{ fontFamily: T.fontFamily, fontSize: '10px', color: G.primary, fontWeight: T.weight.semibold, marginBottom: 4 }}>
                {day.focus || 'Study Session'}
            </p>
            <div className="flex items-center gap-2">
                <span style={{ fontFamily: T.fontFamily, fontSize: '9px', color: '#64748B' }}>{studyTopics} tasks</span>
                <span style={{ fontFamily: T.fontFamily, fontSize: '9px', color: '#94A3B8' }}>·</span>
                <span style={{ fontFamily: T.fontFamily, fontSize: '9px', color: '#64748B' }}>{day.totalMinutes} mins</span>
            </div>
        </div>
    );
}

// ─── Topic Activity Row ────────────────────────────────────────────────────────
function TopicRow({ topic }) {
    const cfg   = ACTIVITY_CONFIG[topic.type] || ACTIVITY_CONFIG.study;
    const Icon  = cfg.icon;

    return (
        <div className="flex items-start gap-3 p-3 rounded-xl transition-all hover:translate-x-0.5"
            style={{ backgroundColor: '#fff', border: `1px solid ${G.border}`, boxShadow: '0 1px 4px rgba(5,150,105,0.06)' }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: cfg.bg }}>
                <Icon className="w-4 h-4" style={{ color: cfg.color }} />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                    <p className="truncate" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: '#1E293B' }}>
                        {topic.title}
                    </p>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: cfg.bg, fontFamily: T.fontFamily, fontSize: '9px', fontWeight: T.weight.bold, color: cfg.color }}>
                            {cfg.label}
                        </span>
                        <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: G.soft }}>
                            <Clock className="w-2.5 h-2.5" style={{ color: G.primary }} />
                            <span style={{ fontFamily: T.fontFamily, fontSize: '9px', fontWeight: T.weight.bold, color: G.primary }}>{topic.duration}</span>
                        </span>
                    </div>
                </div>
                {topic.description && (
                    <p style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#64748B', lineHeight: 1.5, marginTop: 3 }}>
                        {topic.description}
                    </p>
                )}
                {topic.resources?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                        {topic.resources.map((r, i) => (
                            <span key={i} className="px-1.5 py-0.5 rounded"
                                style={{ backgroundColor: 'rgba(99,102,241,0.08)', fontFamily: T.fontFamily, fontSize: '9px', color: '#6366F1' }}>
                                📎 {r.length > 30 ? r.slice(0, 30) + '…' : r}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── History Plan Card ────────────────────────────────────────────────────────
function HistoryCard({ plan, onDelete }) {
    return (
        <div className="p-3 rounded-xl transition-all"
            style={{ backgroundColor: '#fff', border: `1px solid ${G.border}`, boxShadow: S.card }}>
            <div className="flex items-start gap-2.5">
                <Avatar src={plan.studentAvatar} name={plan.studentName} size={32} />
                <div className="flex-1 min-w-0">
                    <p className="truncate" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: '#1E293B' }}>
                        {plan.studentName}
                    </p>
                    <p className="truncate" style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#94A3B8' }}>{plan.title}</p>
                </div>
                <button onClick={() => onDelete(plan._id)}
                    className="p-1 rounded-lg hover:opacity-70 transition-opacity flex-shrink-0">
                    <Trash2 className="w-3.5 h-3.5" style={{ color: '#CBD5E1' }} />
                </button>
            </div>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span style={{ fontFamily: T.fontFamily, fontSize: '9px', color: '#64748B' }}>{plan.totalDays}d plan</span>
                <span style={{ fontFamily: T.fontFamily, fontSize: '9px', color: '#94A3B8' }}>·</span>
                <span style={{ fontFamily: T.fontFamily, fontSize: '9px', color: '#64748B' }}>{plan.totalStudyHours}h study</span>
                <span className="ml-auto" style={{ fontFamily: T.fontFamily, fontSize: '9px', color: '#94A3B8' }}>{plan.timeAgo}</span>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function StudyPlanPage() {
    // Students & courses
    const [loadingStudents, setLoadingStudents] = useState(true);
    const [students, setStudents]               = useState([]);
    const [courses, setCourses]                 = useState([]);
    const [filterCourse, setFilterCourse]       = useState('');

    // Form state
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [selectedTopics, setSelectedTopics]   = useState([]);
    const [durationWeeks, setDurationWeeks]     = useState(2);
    const [hoursPerDay, setHoursPerDay]         = useState(2);
    const [difficulty, setDifficulty]           = useState('moderate');

    // Plan state
    const [generating, setGenerating]           = useState(false);
    const [plan, setPlan]                       = useState(null);
    const [activeDay, setActiveDay]             = useState(null);

    // History
    const [history, setHistory]                 = useState([]);
    const [loadingHistory, setLoadingHistory]   = useState(true);

    // ── Fetch students ────────────────────────────────────────────────
    const fetchStudents = useCallback(async (cId = '') => {
        setLoadingStudents(true);
        try {
            const params = cId ? `?courseId=${cId}` : '';
            const res = await api.get(`/ai/study-plan/students${params}`);
            if (res.data?.success) {
                setStudents(res.data.students || []);
                setCourses(res.data.courses   || []);
            }
        } catch {
            toast.error('Failed to load students');
        } finally {
            setLoadingStudents(false);
        }
    }, []);

    // ── Fetch history ─────────────────────────────────────────────────
    const fetchHistory = useCallback(async () => {
        setLoadingHistory(true);
        try {
            const res = await api.get('/ai/study-plans?limit=8');
            if (res.data?.success) setHistory(res.data.plans || []);
        } catch { /* silent */ }
        finally { setLoadingHistory(false); }
    }, []);

    useEffect(() => {
        fetchStudents();
        fetchHistory();
    }, [fetchStudents, fetchHistory]);

    // ── Select student → pre-fill weak topics ─────────────────────────
    const handleSelectStudent = (student) => {
        setSelectedStudent(student);
        setSelectedTopics(student.weakTopics || []);
        setPlan(null);
        setActiveDay(null);
    };

    // ── Toggle topic chip ─────────────────────────────────────────────
    const toggleTopic = (topic) => {
        setSelectedTopics(prev =>
            prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
        );
    };

    // ── Generate plan ─────────────────────────────────────────────────
    const handleGenerate = async () => {
        if (!selectedStudent) return toast.error('Please select a student');
        if (!selectedTopics.length) return toast.error('Select at least one weak topic');

        setGenerating(true);
        setPlan(null);
        setActiveDay(null);

        try {
            const res = await api.post('/ai/study-plan/generate', {
                studentId:    selectedStudent._id,
                weakTopics:   selectedTopics,
                durationWeeks,
                hoursPerDay,
                difficulty,
                courseId:     selectedStudent.courseId || undefined,
            });

            if (res.data?.success) {
                setPlan(res.data.plan);
                setActiveDay(res.data.plan.weeklyPlan?.[0] || null);
                toast.success('Study plan generated!');
                fetchHistory();
            } else {
                toast.error('Failed to generate plan');
            }
        } catch (err) {
            toast.error(err?.response?.data?.message || 'AI failed. Please retry.');
        } finally {
            setGenerating(false);
        }
    };

    // ── Delete plan ───────────────────────────────────────────────────
    const handleDelete = async (planId) => {
        try {
            await api.delete(`/ai/study-plans/${planId}`);
            setHistory(prev => prev.filter(p => p._id !== planId));
            toast.success('Plan deleted');
        } catch {
            toast.error('Failed to delete plan');
        }
    };

    // ── Course filter ─────────────────────────────────────────────────
    const handleCourseFilter = (cId) => {
        setFilterCourse(cId);
        setSelectedStudent(null);
        setSelectedTopics([]);
        setPlan(null);
        fetchStudents(cId);
    };

    const riskCfg = (r) => RISK_CONFIG[r] || RISK_CONFIG.unknown;

    // ─────────────────────────────────────────────────────────────────
    return (
        <div className="flex gap-4 h-full p-4" style={{ fontFamily: T.fontFamily, backgroundColor: G.pageBg }}>

            {/* ── LEFT PANEL — Student selector ───────────────────────────── */}
            <div className="flex flex-col gap-3 w-[272px] flex-shrink-0 overflow-y-auto custom-scrollbar">

                {/* Header */}
                <div className="rounded-2xl p-4 flex-shrink-0 relative overflow-hidden"
                    style={{ background: G.gradient, boxShadow: `0 6px 24px ${G.primary}40` }}>
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="absolute rounded-full"
                            style={{ width: i % 2 === 0 ? 3 : 2, height: i % 2 === 0 ? 3 : 2, backgroundColor: 'rgba(255,255,255,0.40)', left: `${10 + i * 15}%`, top: `${18 + (i % 3) * 28}%` }} />
                    ))}
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)' }}>
                            <Map className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.md, fontWeight: T.weight.black, color: '#fff' }}>Study Plan</p>
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: 'rgba(255,255,255,0.75)' }}>AI-generated per student</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 mt-3">
                        <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: '#6EE7B7' }} />
                        <span style={{ fontFamily: T.fontFamily, fontSize: '10px', color: 'rgba(255,255,255,0.80)', fontWeight: T.weight.semibold }}>
                            Groq AI · Personalized Plans
                        </span>
                    </div>
                </div>

                {/* Course filter */}
                <div className="rounded-2xl p-4 flex-shrink-0"
                    style={{ backgroundColor: '#fff', border: `1px solid ${G.border}`, boxShadow: S.card }}>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                        Filter by Course
                    </p>
                    <div className="relative">
                        <select value={filterCourse} onChange={e => handleCourseFilter(e.target.value)}
                            className="w-full appearance-none px-3 py-2 rounded-xl pr-7 outline-none"
                            style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#334155', border: `1px solid ${G.border}`, backgroundColor: G.soft }}>
                            <option value="">All Courses</option>
                            {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
                        </select>
                        <ChevronDown className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#94A3B8' }} />
                    </div>
                </div>

                {/* Students list */}
                <div className="rounded-2xl p-4 flex-shrink-0"
                    style={{ backgroundColor: '#fff', border: `1px solid ${G.border}`, boxShadow: S.card }}>
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" style={{ color: G.primary }} />
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: '#1E293B' }}>Select Student</p>
                        </div>
                        <button onClick={() => fetchStudents(filterCourse)} className="p-1 rounded-lg hover:opacity-70">
                            <RefreshCw className="w-3.5 h-3.5" style={{ color: G.primary }} />
                        </button>
                    </div>

                    {loadingStudents ? (
                        <div className="space-y-2.5">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="flex items-center gap-2.5">
                                    <Skel h={36} w={36} r={999} />
                                    <div className="flex-1 space-y-1.5"><Skel h={9} /><Skel h={7} w="70%" /></div>
                                </div>
                            ))}
                        </div>
                    ) : students.length === 0 ? (
                        <div className="text-center py-6">
                            <Users className="w-8 h-8 mx-auto mb-2" style={{ color: `${G.primary}40` }} />
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#CBD5E1' }}>
                                No students found.<br />Enroll students to your courses first.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar">
                            {students.map(student => {
                                const rc       = riskCfg(student.riskLevel);
                                const isActive = selectedStudent?._id?.toString() === student._id?.toString();
                                return (
                                    <div key={student._id} onClick={() => handleSelectStudent(student)}
                                        className="flex items-center gap-2.5 p-2.5 rounded-xl cursor-pointer transition-all"
                                        style={{
                                            backgroundColor: isActive ? G.soft : 'transparent',
                                            border:          isActive ? `1.5px solid ${G.primary}` : '1px solid transparent',
                                        }}
                                        onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = G.soft; }}
                                        onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}>
                                        <Avatar src={student.avatar} name={student.name} size={34} />
                                        <div className="flex-1 min-w-0">
                                            <p className="truncate" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: '#1E293B' }}>
                                                {student.name}
                                            </p>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <span className="px-1.5 py-0.5 rounded-full"
                                                    style={{ backgroundColor: rc.bg, fontFamily: T.fontFamily, fontSize: '9px', fontWeight: T.weight.bold, color: rc.color }}>
                                                    {rc.label}
                                                </span>
                                                {student.avgScore != null && (
                                                    <span style={{ fontFamily: T.fontFamily, fontSize: '9px', color: '#94A3B8' }}>{student.avgScore}% avg</span>
                                                )}
                                            </div>
                                        </div>
                                        {isActive && <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: G.primary }} />}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Plan history */}
                <div className="rounded-2xl p-4 flex-shrink-0"
                    style={{ backgroundColor: '#fff', border: `1px solid ${G.border}`, boxShadow: S.card }}>
                    <div className="flex items-center gap-2 mb-3">
                        <Calendar className="w-4 h-4" style={{ color: G.primary }} />
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: '#1E293B' }}>Recent Plans</p>
                        <span style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#94A3B8', marginLeft: 'auto' }}>{history.length}</span>
                    </div>
                    {loadingHistory ? (
                        <div className="space-y-2"><Skel h={60} /><Skel h={60} /></div>
                    ) : history.length === 0 ? (
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#CBD5E1', textAlign: 'center', padding: '12px 0' }}>
                            No plans generated yet
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {history.map(p => (
                                <HistoryCard key={p._id} plan={p} onDelete={handleDelete} />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── CENTER PANEL — Config + Plan ─────────────────────────────── */}
            <div className="flex-1 flex flex-col gap-4 min-w-0 overflow-y-auto custom-scrollbar">

                {/* Config card */}
                <div className="rounded-2xl overflow-hidden flex-shrink-0"
                    style={{ backgroundColor: '#fff', border: `1px solid ${G.border}`, boxShadow: S.card }}>

                    {/* Header bar */}
                    <div className="flex items-center gap-3 px-5 py-3.5"
                        style={{ background: `linear-gradient(135deg,${G.soft},rgba(255,255,255,0))`, borderBottom: `1px solid ${G.border}` }}>
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                            style={{ background: G.gradient }}>
                            <Brain className="w-4.5 h-4.5 text-white" style={{ width: 18, height: 18 }} />
                        </div>
                        <div className="flex-1">
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.black, color: '#1E293B' }}>
                                {selectedStudent ? `Plan for ${selectedStudent.name}` : 'Configure Study Plan'}
                            </p>
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#94A3B8' }}>
                                {selectedStudent ? (selectedStudent.course || 'All Courses') : 'Select a student from the left panel'}
                            </p>
                        </div>
                        {selectedStudent && (
                            <span className="px-2.5 py-1 rounded-full"
                                style={{ backgroundColor: riskCfg(selectedStudent.riskLevel).bg, fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.black, color: riskCfg(selectedStudent.riskLevel).color }}>
                                {riskCfg(selectedStudent.riskLevel).label}
                            </span>
                        )}
                    </div>

                    {/* Config body */}
                    {!selectedStudent ? (
                        /* Empty prompt */
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                                style={{ background: G.gradient, boxShadow: `0 8px 24px ${G.primary}30` }}>
                                <Map className="w-8 h-8 text-white" />
                            </div>
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.md, fontWeight: T.weight.black, color: '#1E293B', marginBottom: 6 }}>
                                Select a Student to Begin
                            </p>
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#94A3B8', maxWidth: 300, textAlign: 'center', lineHeight: 1.6 }}>
                                Choose a student from the left panel. Their weak topics will be pre-filled automatically based on quiz performance.
                            </p>
                        </div>
                    ) : (
                        <div className="p-5 grid grid-cols-2 gap-4">
                            {/* Weak topics */}
                            <div className="col-span-2">
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                                    Weak Topics to Cover
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {selectedStudent.weakTopics?.length > 0 ? (
                                        selectedStudent.weakTopics.map(topic => (
                                            <button key={topic} onClick={() => toggleTopic(topic)}
                                                className="px-3 py-1.5 rounded-full transition-all text-left"
                                                style={{
                                                    fontFamily:      T.fontFamily,
                                                    fontSize:        T.size.xs,
                                                    fontWeight:      T.weight.semibold,
                                                    color:           selectedTopics.includes(topic) ? '#fff' : G.primary,
                                                    backgroundColor: selectedTopics.includes(topic) ? G.primary : G.soft,
                                                    border:          `1px solid ${G.primary}30`,
                                                }}>
                                                {selectedTopics.includes(topic) ? '✓ ' : ''}{topic}
                                            </button>
                                        ))
                                    ) : (
                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#94A3B8' }}>
                                            No weak topics detected — student may not have taken quizzes yet.
                                        </p>
                                    )}
                                </div>
                                {selectedTopics.length === 0 && selectedStudent.weakTopics?.length > 0 && (
                                    <p style={{ fontFamily: T.fontFamily, fontSize: '10px', color: G.warn, marginTop: 6 }}>
                                        ⚠ Select at least one topic to generate a plan
                                    </p>
                                )}
                            </div>

                            {/* Duration */}
                            <div>
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                                    Duration
                                </p>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4].map(w => (
                                        <button key={w} onClick={() => setDurationWeeks(w)}
                                            className="flex-1 py-2 rounded-xl transition-all"
                                            style={{
                                                fontFamily:      T.fontFamily,
                                                fontSize:        T.size.xs,
                                                fontWeight:      T.weight.bold,
                                                color:           durationWeeks === w ? '#fff' : G.primary,
                                                backgroundColor: durationWeeks === w ? G.primary : G.soft,
                                                border:          `1px solid ${G.primary}25`,
                                            }}>
                                            {w}W
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Hours/day */}
                            <div>
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                                    Hours / Day
                                </p>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4].map(h => (
                                        <button key={h} onClick={() => setHoursPerDay(h)}
                                            className="flex-1 py-2 rounded-xl transition-all"
                                            style={{
                                                fontFamily:      T.fontFamily,
                                                fontSize:        T.size.xs,
                                                fontWeight:      T.weight.bold,
                                                color:           hoursPerDay === h ? '#fff' : G.primary,
                                                backgroundColor: hoursPerDay === h ? G.primary : G.soft,
                                                border:          `1px solid ${G.primary}25`,
                                            }}>
                                            {h}h
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Difficulty */}
                            <div className="col-span-2">
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                                    Intensity
                                </p>
                                <div className="flex gap-2">
                                    {DIFFICULTY_OPTIONS.map(opt => (
                                        <button key={opt.value} onClick={() => setDifficulty(opt.value)}
                                            className="flex-1 py-2.5 px-3 rounded-xl transition-all text-left"
                                            style={{
                                                backgroundColor: difficulty === opt.value ? G.primary : G.soft,
                                                border:          `1px solid ${difficulty === opt.value ? G.primary : G.primary + '25'}`,
                                            }}>
                                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: difficulty === opt.value ? '#fff' : G.primary }}>
                                                {opt.label}
                                            </p>
                                            <p style={{ fontFamily: T.fontFamily, fontSize: '9px', color: difficulty === opt.value ? 'rgba(255,255,255,0.75)' : '#94A3B8', marginTop: 1 }}>
                                                {opt.desc}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Generate button */}
                            <div className="col-span-2">
                                <button onClick={handleGenerate}
                                    disabled={generating || !selectedTopics.length}
                                    className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl transition-all disabled:opacity-50 hover:opacity-90"
                                    style={{ background: G.gradient, boxShadow: `0 4px 16px ${G.primary}40` }}>
                                    {generating
                                        ? <Loader2 className="w-5 h-5 text-white animate-spin" />
                                        : <Sparkles className="w-5 h-5 text-white" />}
                                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.black, color: '#fff' }}>
                                        {generating ? 'AI is crafting the plan…' : 'Generate Study Plan'}
                                    </span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Generating loader */}
                {generating && (
                    <div className="flex flex-col items-center justify-center py-12 rounded-2xl"
                        style={{ backgroundColor: '#fff', border: `1px solid ${G.border}`, boxShadow: S.card }}>
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                            style={{ background: G.gradient, boxShadow: `0 8px 24px ${G.primary}35` }}>
                            <Sparkles className="w-8 h-8 text-white animate-pulse" />
                        </div>
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.md, fontWeight: T.weight.black, color: '#1E293B', marginBottom: 4 }}>
                            AI is crafting the study plan…
                        </p>
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#94A3B8' }}>
                            Powered by Groq · usually 5–10s
                        </p>
                        <div className="flex items-center gap-1.5 mt-4">
                            {[0, 1, 2].map(i => (
                                <span key={i} className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: G.primary, animation: `sp-bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                            ))}
                            <style>{`@keyframes sp-bounce{0%,80%,100%{transform:translateY(0);opacity:.4}40%{transform:translateY(-6px);opacity:1}}`}</style>
                        </div>
                    </div>
                )}

                {/* Plan day list */}
                {plan && !generating && (
                    <div className="rounded-2xl overflow-hidden flex-shrink-0"
                        style={{ backgroundColor: '#fff', border: `1px solid ${G.border}`, boxShadow: S.card }}>
                        <div className="px-5 py-3.5 flex items-center gap-3"
                            style={{ borderBottom: `1px solid ${G.border}`, background: `linear-gradient(135deg,${G.soft},rgba(255,255,255,0))` }}>
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                                style={{ background: G.gradient }}>
                                <Calendar className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#1E293B' }}>{plan.title}</p>
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#94A3B8' }}>
                                    {plan.totalDays} days · {plan.totalStudyHours}h study · {plan.topicsCount} sessions
                                </p>
                            </div>
                        </div>
                        <div className="p-4 grid grid-cols-4 gap-2 max-h-48 overflow-y-auto custom-scrollbar">
                            {(plan.weeklyPlan || []).map((day, i) => (
                                <DayCard key={i} day={day} index={i}
                                    isActive={activeDay?.day === day.day && activeDay?.date === day.date}
                                    onClick={() => setActiveDay(day)} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Active day sessions */}
                {activeDay && !generating && (
                    <div className="rounded-2xl overflow-hidden flex-shrink-0"
                        style={{ backgroundColor: '#fff', border: `1px solid ${G.border}`, boxShadow: S.card }}>
                        <div className="px-5 py-3.5 flex items-center gap-3"
                            style={{ borderBottom: `1px solid ${G.border}` }}>
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                                style={{ backgroundColor: G.soft }}>
                                <Play className="w-4 h-4" style={{ color: G.primary }} />
                            </div>
                            <div>
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#1E293B' }}>
                                    {activeDay.day} — {activeDay.date}
                                </p>
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: G.primary, fontWeight: T.weight.semibold }}>
                                    {activeDay.focus} · {activeDay.totalMinutes} mins
                                </p>
                            </div>
                        </div>
                        <div className="p-4 space-y-2.5">
                            {(activeDay.topics || []).map((topic, i) => (
                                <TopicRow key={i} topic={topic} />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ── RIGHT PANEL — Plan insights ──────────────────────────────── */}
            <div className="flex flex-col gap-3 w-[240px] flex-shrink-0 overflow-y-auto custom-scrollbar">

                {/* Plan summary */}
                {plan ? (
                    <>
                        {/* Goal */}
                        <div className="rounded-2xl overflow-hidden flex-shrink-0"
                            style={{ backgroundColor: '#fff', border: `1px solid ${G.border}`, boxShadow: S.card }}>
                            <div className="px-4 py-3"
                                style={{ background: G.gradient }}>
                                <p style={{ fontFamily: T.fontFamily, fontSize: '10px', color: 'rgba(255,255,255,0.70)', fontWeight: T.weight.bold, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Student Goal</p>
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#fff', lineHeight: 1.5, marginTop: 4 }}>
                                    {plan.goal}
                                </p>
                            </div>
                            <div className="p-4 space-y-2.5">
                                {[
                                    { label: 'Duration',    value: `${plan.durationWeeks} Week${plan.durationWeeks > 1 ? 's' : ''}`, icon: Calendar,    color: '#6366F1' },
                                    { label: 'Daily Hours', value: `${plan.hoursPerDay}h / day`,          icon: Clock,       color: G.primary  },
                                    { label: 'Sessions',    value: `${plan.topicsCount} total`,            icon: BookOpen,    color: '#F59E0B'  },
                                    { label: 'Est. Improvement', value: plan.estimatedScore ? `+${plan.estimatedScore}%` : 'N/A', icon: TrendingUp, color: G.light },
                                ].map(item => {
                                    const Icon = item.icon;
                                    return (
                                        <div key={item.label} className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5">
                                                <Icon className="w-3.5 h-3.5" style={{ color: item.color }} />
                                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#64748B' }}>{item.label}</span>
                                            </div>
                                            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.black, color: item.color }}>{item.value}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Milestones */}
                        {plan.keyMilestones?.length > 0 && (
                            <div className="rounded-2xl p-4 flex-shrink-0"
                                style={{ backgroundColor: '#fff', border: `1px solid ${G.border}`, boxShadow: S.card }}>
                                <div className="flex items-center gap-2 mb-3">
                                    <Award className="w-4 h-4" style={{ color: G.primary }} />
                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: '#1E293B' }}>Key Milestones</p>
                                </div>
                                {plan.keyMilestones.map((m, i) => (
                                    <div key={i} className="flex items-start gap-2 mb-2 last:mb-0">
                                        <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                                            style={{ background: G.gradient }}>
                                            <span style={{ fontFamily: T.fontFamily, fontSize: '8px', fontWeight: T.weight.black, color: '#fff' }}>{i + 1}</span>
                                        </div>
                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#475569', lineHeight: 1.5 }}>{m}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Topics covered */}
                        <div className="rounded-2xl p-4 flex-shrink-0"
                            style={{ backgroundColor: '#fff', border: `1px solid ${G.border}`, boxShadow: S.card }}>
                            <div className="flex items-center gap-2 mb-3">
                                <Target className="w-4 h-4" style={{ color: G.primary }} />
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: '#1E293B' }}>Topics Covered</p>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {plan.weakTopics?.map(t => (
                                    <span key={t} className="px-2 py-1 rounded-full"
                                        style={{ backgroundColor: G.soft, border: `1px solid ${G.border}`, fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.semibold, color: G.primary }}>
                                        {t.length > 18 ? t.slice(0, 18) + '…' : t}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </>
                ) : (
                    /* No plan yet */
                    <div className="rounded-2xl p-5 flex-shrink-0 text-center"
                        style={{ backgroundColor: '#fff', border: `1px solid ${G.border}`, boxShadow: S.card }}>
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                            style={{ background: G.gradient }}>
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: '#1E293B', marginBottom: 4 }}>
                            Plan Insights
                        </p>
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#94A3B8', lineHeight: 1.5 }}>
                            Generate a study plan to see milestones, session breakdown & AI insights here.
                        </p>
                    </div>
                )}

                {/* How it works */}
                <div className="rounded-2xl p-4 flex-shrink-0"
                    style={{ backgroundColor: '#fff', border: `1px solid ${G.border}`, boxShadow: S.card }}>
                    <div className="flex items-center gap-2 mb-3">
                        <Zap className="w-4 h-4" style={{ color: G.primary }} />
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: '#1E293B' }}>How it Works</p>
                    </div>
                    {[
                        { step: '1', text: 'Select an at-risk student',         color: G.primary  },
                        { step: '2', text: 'Review & adjust weak topics',        color: '#6366F1'  },
                        { step: '3', text: 'Set duration & intensity',           color: '#F59E0B'  },
                        { step: '4', text: 'AI generates a day-by-day plan',    color: G.light    },
                    ].map(item => (
                        <div key={item.step} className="flex items-start gap-2.5 mb-2.5 last:mb-0">
                            <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                                style={{ backgroundColor: item.color, marginTop: 1 }}>
                                <span style={{ fontFamily: T.fontFamily, fontSize: '9px', fontWeight: T.weight.black, color: '#fff' }}>{item.step}</span>
                            </div>
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#64748B', lineHeight: 1.5 }}>{item.text}</p>
                        </div>
                    ))}
                </div>

                {/* Groq badge */}
                <div className="rounded-2xl p-4 flex-shrink-0"
                    style={{ background: `linear-gradient(135deg,${G.soft},rgba(99,102,241,0.06))`, border: `1px solid ${G.border}` }}>
                    <div className="flex items-center gap-2 mb-1">
                        <Brain className="w-4 h-4" style={{ color: G.primary }} />
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.black, color: G.primary }}>Powered by Groq AI</p>
                    </div>
                    <p style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#64748B', lineHeight: 1.5 }}>
                        Personalized plans using <strong>llama-3.3-70b-versatile</strong> based on real quiz performance.
                    </p>
                    <div className="flex items-center gap-1.5 mt-2">
                        <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: G.primary }} />
                        <span style={{ fontFamily: T.fontFamily, fontSize: '10px', color: G.primary, fontWeight: T.weight.semibold }}>Online · Fast Response</span>
                    </div>
                </div>
            </div>
        </div>
    );
}