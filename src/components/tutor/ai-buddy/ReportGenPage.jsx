'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    FileText, Users, Sparkles, Loader2, ChevronDown,
    MoreHorizontal, Check, X, BarChart2, Clock,
    Lightbulb, RefreshCw, Trash2, ChevronRight,
    BookOpen, Brain, Award, TrendingUp, Download,
    Share2, Eye, ToggleLeft, ToggleRight, Zap
} from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { C, T, S, R } from '@/constants/tutorTokens';

// ─── Purple palette ───────────────────────────────────────────────────────────
const P = {
    primary:  '#7C3AED',
    light:    '#8B5CF6',
    soft:     'rgba(124,58,237,0.08)',
    border:   'rgba(124,58,237,0.14)',
    gradient: 'linear-gradient(135deg,#5B21B6 0%,#7C3AED 60%,#8B5CF6 100%)',
    pageBg:   '#F5F3FF',
    red:      '#EF4444',
    orange:   '#F97316',
    green:    '#10B981',
    yellow:   '#F59E0B',
    teal:     '#0891B2',
    indigo:   '#6366F1',
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skel({ h = 10, w = '100%', r = 10 }) {
    return <div className="animate-pulse" style={{ height: h, width: w, borderRadius: r, backgroundColor: P.soft }} />;
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ src, name, size = 36 }) {
    const initials = (name || 'S').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    if (src) return <img src={src} alt={name} style={{ width: size, height: size, borderRadius: 999, objectFit: 'cover', flexShrink: 0 }} />;
    return (
        <div style={{ width: size, height: size, borderRadius: 999, background: P.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontFamily: T.fontFamily, fontSize: size * 0.33, fontWeight: T.weight.black, color: '#fff' }}>{initials}</span>
        </div>
    );
}

// ─── Skill bar ────────────────────────────────────────────────────────────────
function SkillBar({ topic, score, color }) {
    return (
        <div className="flex items-center gap-3 mb-2">
            <p className="truncate" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#475569', minWidth: 120, maxWidth: 130 }}>{topic}</p>
            <div className="flex-1 rounded-full overflow-hidden" style={{ height: 8, backgroundColor: color + '20' }}>
                <div style={{ width: `${score}%`, height: '100%', backgroundColor: color, borderRadius: 999, transition: 'width 0.8s ease' }} />
            </div>
            <span style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.black, color, minWidth: 32, textAlign: 'right' }}>{score}%</span>
        </div>
    );
}

// ─── Toggle switch ────────────────────────────────────────────────────────────
function Toggle({ value, onChange }) {
    return (
        <div onClick={() => onChange(!value)}
            className="cursor-pointer transition-all"
            style={{ width: 44, height: 24, borderRadius: 12, backgroundColor: value ? P.primary : '#CBD5E1', position: 'relative', flexShrink: 0 }}>
            <div style={{
                width: 18, height: 18, borderRadius: 9, backgroundColor: '#fff',
                position: 'absolute', top: 3, left: value ? 23 : 3,
                transition: 'left 0.2s ease',
                boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
            }} />
        </div>
    );
}

// ─── Student selector chip ────────────────────────────────────────────────────
function StudentChip({ student, isSelected, onToggle }) {
    return (
        <div onClick={() => onToggle(student)}
            className="flex items-center gap-2 p-2.5 rounded-xl cursor-pointer transition-all"
            style={{
                backgroundColor: isSelected ? P.soft : 'transparent',
                border:          isSelected ? `1.5px solid ${P.primary}` : '1px solid transparent',
            }}
            onMouseEnter={e => { if (!isSelected) e.currentTarget.style.backgroundColor = P.soft; }}
            onMouseLeave={e => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'; }}>
            <Avatar src={student.avatar} name={student.name} size={28} />
            <div className="flex-1 min-w-0">
                <p className="truncate" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: '#1E293B' }}>{student.name}</p>
                <p className="truncate" style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#94A3B8' }}>
                    {student.level ? `Grade ${student.level}` : ''} {student.course ? `· ${student.course.slice(0, 18)}` : ''}
                </p>
            </div>
            {isSelected ? (
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: P.primary }}>
                    <Check className="w-3 h-3 text-white" />
                </div>
            ) : (
                <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#CBD5E1' }} />
            )}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ReportGenPage() {
    // Data
    const [loading, setLoading]           = useState(true);
    const [students, setStudents]         = useState([]);
    const [courses, setCourses]           = useState([]);
    const [quickSelections, setQuickSelections] = useState([]);
    const [recentReports, setRecentReports]     = useState([]);
    const [stats, setStats]               = useState(null);

    // Form
    const [reportType, setReportType]         = useState('student');
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [selectedCourse, setSelectedCourse]   = useState('');
    const [highlightStrengths, setHighlightStrengths] = useState(true);
    const [filterCourse, setFilterCourse]       = useState('');

    // Generation
    const [generating, setGenerating]   = useState(false);
    const [report, setReport]           = useState(null);
    const [activeStudent, setActiveStudent] = useState(null);

    // ── Fetch ─────────────────────────────────────────────────────────
    const fetchData = useCallback(async (cId = '') => {
        setLoading(true);
        try {
            const params = cId ? `?courseId=${cId}` : '';
            const [studRes, recentRes] = await Promise.all([
                api.get(`/ai/report-gen/students${params}`),
                api.get('/ai/report-gen/recent'),
            ]);
            if (studRes.data?.success) {
                setStudents(studRes.data.students       || []);
                setCourses(studRes.data.courses         || []);
                setQuickSelections(studRes.data.quickSelections || []);
            }
            if (recentRes.data?.success) {
                setRecentReports(recentRes.data.reports || []);
                setStats(recentRes.data.stats);
            }
        } catch {
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    // ── Toggle student ────────────────────────────────────────────────
    const toggleStudent = (student) => {
        const sid = student._id?.toString();
        if (selectedStudents.find(s => s._id?.toString() === sid)) {
            setSelectedStudents(prev => prev.filter(s => s._id?.toString() !== sid));
        } else {
            if (selectedStudents.length >= 5) return toast.error('Max 5 students allowed');
            setSelectedStudents(prev => [...prev, student]);
        }
    };

    // ── Generate ──────────────────────────────────────────────────────
    const handleGenerate = async () => {
        if (reportType === 'student' && selectedStudents.length === 0) return toast.error('Select at least one student');
        if (reportType === 'course'  && !selectedCourse)              return toast.error('Select a course');

        setGenerating(true);
        setReport(null);
        setActiveStudent(null);

        try {
            const res = await api.post('/ai/report-gen/generate', {
                reportType,
                studentIds:        selectedStudents.map(s => s._id),
                courseId:          selectedCourse || undefined,
                highlightStrengths,
            });

            if (res.data?.success) {
                setReport(res.data.report);
                setActiveStudent(res.data.report.students?.[0] || null);
                toast.success('Report generated!');
                fetchData(filterCourse);
            } else {
                toast.error('Generation failed. Please retry.');
            }
        } catch (err) {
            toast.error(err?.response?.data?.message || 'AI failed. Please retry.');
        } finally {
            setGenerating(false);
        }
    };

    // ── Delete report ─────────────────────────────────────────────────
    const handleDelete = async (id) => {
        try {
            await api.delete(`/ai/report-gen/${id}`);
            setRecentReports(prev => prev.filter(r => r._id !== id));
            toast.success('Report deleted');
        } catch {
            toast.error('Failed to delete');
        }
    };

    // ─────────────────────────────────────────────────────────────────
    return (
        <div className="flex gap-4 h-full p-4 overflow-y-auto custom-scrollbar"
            style={{ fontFamily: T.fontFamily, backgroundColor: P.pageBg }}>

            {/* ── LEFT PANEL — Config ───────────────────────────────────── */}
            <div className="flex flex-col gap-4 flex-shrink-0 overflow-y-auto custom-scrollbar" style={{ width: 300 }}>

                {/* Header */}
                <div className="rounded-2xl p-4 flex-shrink-0"
                    style={{ backgroundColor: '#fff', border: `1px solid ${P.border}`, boxShadow: S.card }}>
                    <h2 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.black, color: '#1E293B', marginBottom: 4 }}>
                        Report Details
                    </h2>
                    {/* Report type tabs */}
                    <div className="flex gap-2 mt-3">
                        {['student', 'course'].map(type => (
                            <button key={type} onClick={() => setReportType(type)}
                                className="flex-1 py-2 rounded-xl transition-all capitalize"
                                style={{
                                    fontFamily:      T.fontFamily,
                                    fontSize:        T.size.xs,
                                    fontWeight:      T.weight.bold,
                                    color:           reportType === type ? '#fff' : '#64748B',
                                    backgroundColor: reportType === type ? P.primary : P.soft,
                                    border:          `1px solid ${reportType === type ? P.primary : P.border}`,
                                }}>
                                {type === 'student' ? 'Student Report' : 'Course Report'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Student selector */}
                {reportType === 'student' && (
                    <div className="rounded-2xl p-4 flex-shrink-0"
                        style={{ backgroundColor: '#fff', border: `1px solid ${P.border}`, boxShadow: S.card }}>
                        <div className="flex items-center justify-between mb-3">
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#1E293B' }}>Select Students</p>
                            <span style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#94A3B8' }}>
                                {selectedStudents.length}/5 Selected
                            </span>
                        </div>

                        {/* Course filter */}
                        <div className="relative mb-3">
                            <select value={filterCourse} onChange={e => { setFilterCourse(e.target.value); fetchData(e.target.value); }}
                                className="w-full appearance-none px-3 py-2 rounded-xl pr-7 outline-none"
                                style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#334155', border: `1px solid ${P.border}`, backgroundColor: P.soft }}>
                                <option value="">All Courses</option>
                                {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
                            </select>
                            <ChevronDown className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#94A3B8' }} />
                        </div>

                        {/* Student list */}
                        <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
                            {loading ? (
                                [...Array(4)].map((_, i) => (
                                    <div key={i} className="flex items-center gap-2 p-2">
                                        <Skel h={28} w={28} r={999} />
                                        <div className="flex-1"><Skel h={8} /><Skel h={6} w="70%" /></div>
                                    </div>
                                ))
                            ) : students.length === 0 ? (
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#CBD5E1', textAlign: 'center', padding: '12px 0' }}>
                                    No students found
                                </p>
                            ) : (
                                students.map(s => (
                                    <StudentChip key={s._id} student={s}
                                        isSelected={!!selectedStudents.find(sel => sel._id?.toString() === s._id?.toString())}
                                        onToggle={toggleStudent} />
                                ))
                            )}
                        </div>

                        {/* Selected chips */}
                        {selectedStudents.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-3 pt-3" style={{ borderTop: `1px solid ${P.border}` }}>
                                {selectedStudents.map(s => (
                                    <div key={s._id} className="flex items-center gap-1 px-2 py-1 rounded-full"
                                        style={{ backgroundColor: P.soft, border: `1px solid ${P.border}` }}>
                                        <span style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.semibold, color: P.primary }}>
                                            {s.name.split(' ')[0]}
                                        </span>
                                        <button onClick={() => toggleStudent(s)}>
                                            <X className="w-3 h-3" style={{ color: '#94A3B8' }} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Course selector */}
                {reportType === 'course' && (
                    <div className="rounded-2xl p-4 flex-shrink-0"
                        style={{ backgroundColor: '#fff', border: `1px solid ${P.border}`, boxShadow: S.card }}>
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#1E293B', marginBottom: 10 }}>Select Course</p>
                        <div className="relative">
                            <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}
                                className="w-full appearance-none px-3 py-2.5 rounded-xl pr-7 outline-none"
                                style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#334155', border: `1px solid ${P.border}`, backgroundColor: P.soft }}>
                                <option value="">Choose a course…</option>
                                {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
                            </select>
                            <ChevronDown className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#94A3B8' }} />
                        </div>
                    </div>
                )}

                {/* Highlight strengths toggle */}
                <div className="flex items-center justify-between p-4 rounded-2xl flex-shrink-0"
                    style={{ backgroundColor: '#fff', border: `1px solid ${P.border}`, boxShadow: S.card }}>
                    <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4" style={{ color: P.primary }} />
                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: '#334155' }}>
                            Highlight Strengths & Weaknesses
                        </span>
                    </div>
                    <Toggle value={highlightStrengths} onChange={setHighlightStrengths} />
                </div>

                {/* Report Details */}
                <div className="rounded-2xl p-4 flex-shrink-0"
                    style={{ backgroundColor: '#fff', border: `1px solid ${P.border}`, boxShadow: S.card }}>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#1E293B', marginBottom: 12 }}>Report Details</p>

                    {/* Report type selector */}
                    <div className="flex items-center gap-2 mb-4">
                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#94A3B8' }}>Report Type</span>
                        <div className="flex gap-2 flex-1">
                            {['student', 'course'].map(type => (
                                <button key={type} onClick={() => setReportType(type)}
                                    className="px-3 py-1.5 rounded-xl transition-all flex-1"
                                    style={{
                                        fontFamily:      T.fontFamily,
                                        fontSize:        '10px',
                                        fontWeight:      T.weight.bold,
                                        color:           reportType === type ? '#fff' : '#64748B',
                                        backgroundColor: reportType === type ? P.primary : P.soft,
                                    }}>
                                    {type === 'student' ? 'Student' : 'Course Report'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Selected students display */}
                    {selectedStudents.length > 0 && (
                        <div className="space-y-2 mb-3">
                            <div className="flex items-center justify-between">
                                <span style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#94A3B8' }}>Select Students</span>
                                <span style={{ fontFamily: T.fontFamily, fontSize: '10px', color: P.primary }}>Max {selectedStudents.length} Selected</span>
                            </div>
                            {selectedStudents.map(s => (
                                <div key={s._id} className="flex items-center gap-2 px-3 py-2 rounded-xl"
                                    style={{ backgroundColor: P.soft, border: `1px solid ${P.border}` }}>
                                    <Avatar src={s.avatar} name={s.name} size={24} />
                                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: '#334155', flex: 1 }}>
                                        {s.name} {s.level ? `(Grade ${s.level})` : ''}
                                    </span>
                                    <ChevronDown className="w-3.5 h-3.5" style={{ color: '#94A3B8' }} />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Highlight toggle */}
                    <div className="flex items-center justify-between p-3 rounded-xl mb-3"
                        style={{ backgroundColor: P.soft, border: `1px solid ${P.border}` }}>
                        <div className="flex items-center gap-2">
                            <Zap className="w-3.5 h-3.5" style={{ color: P.primary }} />
                            <span style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.semibold, color: '#334155' }}>Highlight Strengths & Weaknesses</span>
                        </div>
                        <Toggle value={highlightStrengths} onChange={setHighlightStrengths} />
                    </div>
                </div>

                {/* Quick Selection */}
                <div className="rounded-2xl p-4 flex-shrink-0"
                    style={{ backgroundColor: '#fff', border: `1px solid ${P.border}`, boxShadow: S.card }}>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#1E293B', marginBottom: 10 }}>Quick Selection</p>
                    <div className="flex flex-wrap gap-2">
                        {loading ? (
                            [...Array(4)].map((_, i) => <Skel key={i} h={28} w={120} r={8} />)
                        ) : (
                            quickSelections.map((qs, i) => (
                                <button key={i}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all hover:opacity-80"
                                    style={{ backgroundColor: P.soft, border: `1px solid ${P.border}` }}
                                    onClick={() => toast(`Quick select: ${qs.label}`)}>
                                    <div className="w-4 h-4 rounded flex items-center justify-center"
                                        style={{ backgroundColor: [P.primary, P.teal, P.orange, P.green, P.indigo][i % 5] + '20' }}>
                                        <FileText className="w-2.5 h-2.5" style={{ color: [P.primary, P.teal, P.orange, P.green, P.indigo][i % 5] }} />
                                    </div>
                                    <span style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.semibold, color: '#475569' }}>
                                        {qs.label.length > 22 ? qs.label.slice(0, 22) + '…' : qs.label}
                                    </span>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* ── CENTER PANEL ─────────────────────────────────────────────── */}
            <div className="flex-1 flex flex-col gap-4 min-w-0">

                {/* Robot + stats */}
                <div className="rounded-2xl p-5 relative overflow-hidden"
                    style={{ background: `linear-gradient(135deg,#EDE9FE 0%,#F5F3FF 60%,#EDE9FE 100%)`, border: `1px solid ${P.border}`, boxShadow: S.card }}>
                    {[...Array(10)].map((_, i) => (
                        <div key={i} className="absolute rounded-full"
                            style={{ width: i % 2 === 0 ? 4 : 2, height: i % 2 === 0 ? 4 : 2, backgroundColor: `rgba(124,58,237,${0.10 + (i % 4) * 0.05})`, left: `${5 + i * 9}%`, top: `${10 + (i % 4) * 22}%` }} />
                    ))}
                    <div className="flex items-start gap-4">
                        <div className="flex-1">
                            <p style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                                ⠿⠿ Stats: {selectedStudents.length > 0 ? `${selectedStudents.length} Selected` : 'No selection'}
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { label: 'Verified Data',      value: '93%',                                     icon: '?', color: P.primary },
                                    { label: 'Enrolled Students',  value: stats ? `${stats.totalReports}` : '—',     icon: '↑', color: P.green   },
                                    { label: 'Automated',          value: stats ? `${stats.automatedHours} hrs` : '—', icon: '⏰', color: P.orange },
                                    { label: 'Automated Reports',  value: stats ? `${stats.totalReports}` : '—',     icon: '👁', color: P.teal   },
                                ].map(item => (
                                    <div key={item.label} className="p-3 rounded-xl"
                                        style={{ backgroundColor: 'rgba(255,255,255,0.70)', border: `1px solid ${P.border}` }}>
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <span style={{ fontSize: 14 }}>{item.icon}</span>
                                            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xl, fontWeight: T.weight.black, color: item.color }}>{item.value}</span>
                                        </div>
                                        <p style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#94A3B8' }}>{item.label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {/* Robot icon */}
                        <div className="w-24 h-24 rounded-2xl flex items-center justify-center flex-shrink-0"
                            style={{ background: P.gradient, boxShadow: `0 8px 24px rgba(124,58,237,0.30)` }}>
                            <Brain className="w-12 h-12 text-white" />
                        </div>
                    </div>
                </div>

                {/* Summary Preview */}
                <div className="rounded-2xl overflow-hidden flex-shrink-0"
                    style={{ backgroundColor: '#fff', border: `1px solid ${P.border}`, boxShadow: S.card }}>
                    <div className="px-5 py-3.5 flex items-center justify-between"
                        style={{ borderBottom: `1px solid ${P.border}`, background: `linear-gradient(135deg,${P.soft},rgba(255,255,255,0))` }}>
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#1E293B' }}>Summary Preview</p>
                        {report && (
                            <div className="flex gap-2">
                                {(report.students || []).map(s => (
                                    <button key={s.name} onClick={() => setActiveStudent(s)}
                                        className="px-2.5 py-1 rounded-lg transition-all"
                                        style={{
                                            fontFamily:      T.fontFamily,
                                            fontSize:        '10px',
                                            fontWeight:      T.weight.bold,
                                            color:           activeStudent?.name === s.name ? '#fff' : P.primary,
                                            backgroundColor: activeStudent?.name === s.name ? P.primary : P.soft,
                                        }}>
                                        {s.name.split(' ')[0]}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="p-5">
                        {generating ? (
                            <div className="flex flex-col items-center py-8">
                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
                                    style={{ background: P.gradient }}>
                                    <Sparkles className="w-6 h-6 text-white animate-pulse" />
                                </div>
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#1E293B', marginBottom: 4 }}>
                                    AI is generating the report…
                                </p>
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#94A3B8' }}>Usually 5–10s</p>
                                <div className="flex gap-1.5 mt-3">
                                    {[0,1,2].map(i => (
                                        <span key={i} className="w-2 h-2 rounded-full"
                                            style={{ backgroundColor: P.primary, animation: `rg-b 1.2s ease-in-out ${i*0.2}s infinite` }} />
                                    ))}
                                    <style>{`@keyframes rg-b{0%,80%,100%{transform:translateY(0);opacity:.4}40%{transform:translateY(-5px);opacity:1}}`}</style>
                                </div>
                            </div>
                        ) : activeStudent ? (
                            <>
                                <div className="flex items-center gap-3 mb-4">
                                    <Avatar src={activeStudent.avatar} name={activeStudent.name} size={40} />
                                    <div>
                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.black, color: '#1E293B' }}>
                                            {activeStudent.name}
                                        </p>
                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#94A3B8' }}>
                                            Skill Breakdown
                                        </p>
                                    </div>
                                    <div className="ml-auto">
                                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: P.primary }}>
                                            {activeStudent.grade}
                                        </span>
                                        <p style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#94A3B8' }}>Grade</p>
                                    </div>
                                </div>

                                {/* Skill bars */}
                                {(activeStudent.skillBreakdown || []).length > 0 ? (
                                    <div className="mb-4">
                                        {activeStudent.skillBreakdown.map(skill => (
                                            <SkillBar key={skill.topic} topic={skill.topic} score={skill.score} color={skill.color} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-4 text-center mb-4">
                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#CBD5E1' }}>No quiz data for skill breakdown</p>
                                    </div>
                                )}

                                {/* Strengths & weaknesses */}
                                {report?.highlightStrengths && (
                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        {activeStudent.strengths?.length > 0 && (
                                            <div className="p-3 rounded-xl" style={{ backgroundColor: P.soft }}>
                                                <p style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: P.primary, marginBottom: 6 }}>💪 Strengths</p>
                                                {activeStudent.strengths.map((s, i) => (
                                                    <div key={i} className="flex items-start gap-1.5 mb-1">
                                                        <div className="w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: P.green }} />
                                                        <p style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#475569' }}>{s}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {activeStudent.weaknesses?.length > 0 && (
                                            <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(239,68,68,0.06)' }}>
                                                <p style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: P.red, marginBottom: 6 }}>⚠ Areas to Improve</p>
                                                {activeStudent.weaknesses.map((w, i) => (
                                                    <div key={i} className="flex items-start gap-1.5 mb-1">
                                                        <div className="w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: P.red }} />
                                                        <p style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#475569' }}>{w}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Recommendation */}
                                {activeStudent.recommendation && (
                                    <div className="p-3 rounded-xl mb-3"
                                        style={{ backgroundColor: P.soft, border: `1px solid ${P.border}` }}>
                                        <p style={{ fontFamily: T.fontFamily, fontSize: '10px', color: P.primary, fontWeight: T.weight.semibold, marginBottom: 3 }}>AI Recommendation</p>
                                        <p style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#475569', lineHeight: 1.6 }}>{activeStudent.recommendation}</p>
                                    </div>
                                )}

                                <button className="w-full py-2 rounded-xl transition-all hover:opacity-80"
                                    style={{ background: P.gradient }}>
                                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.black, color: '#fff' }}>View Detail</span>
                                </button>
                            </>
                        ) : (
                            <div className="flex flex-col items-center py-8 text-center">
                                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
                                    style={{ background: P.gradient, opacity: 0.8 }}>
                                    <FileText className="w-7 h-7 text-white" />
                                </div>
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: '#1E293B', marginBottom: 4 }}>
                                    Select students & generate a report
                                </p>
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#94A3B8', maxWidth: 260 }}>
                                    Choose up to 5 students from the left panel, then click Generate Report.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Generate Report button */}
                <button onClick={handleGenerate}
                    disabled={generating || (reportType === 'student' && selectedStudents.length === 0) || (reportType === 'course' && !selectedCourse)}
                    className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl transition-all disabled:opacity-50 hover:opacity-90 flex-shrink-0"
                    style={{ background: P.gradient, boxShadow: `0 4px 16px rgba(124,58,237,0.35)` }}>
                    {generating
                        ? <Loader2 className="w-5 h-5 text-white animate-spin" />
                        : <Sparkles className="w-5 h-5 text-white" />}
                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.black, color: '#fff' }}>
                        {generating ? 'Generating Report…' : 'Generate Report'}
                    </span>
                </button>
            </div>

            {/* ── RIGHT PANEL ───────────────────────────────────────────────── */}
            <div className="flex flex-col gap-4 flex-shrink-0 overflow-y-auto custom-scrollbar" style={{ width: 272 }}>

                {/* Recent Reports */}
                <div className="rounded-2xl overflow-hidden flex-shrink-0"
                    style={{ backgroundColor: '#fff', border: `1px solid ${P.border}`, boxShadow: S.card }}>
                    <div className="flex items-center justify-between px-4 py-3.5"
                        style={{ borderBottom: `1px solid ${P.border}`, background: `linear-gradient(135deg,${P.soft},rgba(255,255,255,0))` }}>
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#1E293B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            Recent Reports
                        </p>
                        <button className="p-1 rounded-lg hover:opacity-70">
                            <MoreHorizontal className="w-4 h-4" style={{ color: '#94A3B8' }} />
                        </button>
                    </div>

                    <div className="p-4 space-y-3">
                        {loading ? (
                            [...Array(3)].map((_, i) => (
                                <div key={i} className="flex items-center gap-2.5">
                                    <Skel h={36} w={36} r={999} />
                                    <div className="flex-1 space-y-1.5"><Skel h={9} /><Skel h={7} w="80%" /></div>
                                </div>
                            ))
                        ) : recentReports.length === 0 ? (
                            <div className="text-center py-4">
                                <FileText className="w-8 h-8 mx-auto mb-2" style={{ color: `${P.primary}30` }} />
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#CBD5E1' }}>No reports yet</p>
                            </div>
                        ) : (
                            recentReports.slice(0, 5).map((r, i) => (
                                <div key={r._id} className="flex items-start gap-2.5 pb-3 last:pb-0"
                                    style={{ borderBottom: i < Math.min(recentReports.length, 5) - 1 ? `1px solid ${P.border}` : 'none' }}>
                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                                        style={{ background: P.gradient }}>
                                        <span style={{ fontFamily: T.fontFamily, fontSize: '11px', fontWeight: T.weight.black, color: '#fff' }}>
                                            {(r.studentNames?.[0] || r.courseName || 'R').charAt(0)}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="truncate" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: '#1E293B' }}>
                                            {r.studentNames?.[0] || r.courseName || 'Report'}
                                        </p>
                                        <p className="truncate" style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#94A3B8' }}>{r.title}</p>
                                        <p style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#CBD5E1', marginTop: 1 }}>{r.timeAgo}</p>
                                    </div>
                                    <button onClick={() => handleDelete(r._id)} className="p-1 rounded-lg hover:opacity-70 flex-shrink-0">
                                        <Trash2 className="w-3.5 h-3.5" style={{ color: '#CBD5E1' }} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    {recentReports.length > 0 && (
                        <div className="px-4 pb-3">
                            <button className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl hover:opacity-80"
                                style={{ backgroundColor: P.soft, border: `1px solid ${P.border}` }}>
                                <span style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: P.primary }}>View All</span>
                                <ChevronRight className="w-3 h-3" style={{ color: P.primary }} />
                            </button>
                        </div>
                    )}
                </div>

                {/* Tips */}
                <div className="rounded-2xl overflow-hidden flex-shrink-0"
                    style={{ backgroundColor: '#fff', border: `1px solid ${P.border}`, boxShadow: S.card }}>
                    <div className="flex items-center justify-between px-4 py-3"
                        style={{ borderBottom: `1px solid ${P.border}`, background: `linear-gradient(135deg,${P.soft},rgba(255,255,255,0))` }}>
                        <div className="flex items-center gap-2">
                            <Lightbulb className="w-4 h-4" style={{ color: P.yellow }} />
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#1E293B' }}>Tips for AI Report Generator</p>
                        </div>
                        <button className="p-1 rounded-lg hover:opacity-70">
                            <MoreHorizontal className="w-4 h-4" style={{ color: '#94A3B8' }} />
                        </button>
                    </div>
                    <div className="p-4 space-y-3">
                        {[
                            'For individual reports, select a maximum of 5 students for better accuracy.',
                            'Highlight Strengths & Weaknesses will emphasize the strongest and weakest areas in the report.',
                            'Choose the report sections most relevant to your needs for a focused report generation.',
                        ].map((tip, i) => (
                            <div key={i} className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: P.green }} />
                                <p style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#475569', lineHeight: 1.6 }}>{tip}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Changelog Preview */}
                <div className="rounded-2xl overflow-hidden flex-shrink-0"
                    style={{ backgroundColor: '#fff', border: `1px solid ${P.border}`, boxShadow: S.card }}>
                    <div className="flex items-center gap-2 px-4 py-3"
                        style={{ borderBottom: `1px solid ${P.border}`, background: `linear-gradient(135deg,${P.soft},rgba(255,255,255,0))` }}>
                        <RefreshCw className="w-4 h-4" style={{ color: P.primary }} />
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#1E293B' }}>Changelog · Preview</p>
                    </div>
                    <div className="p-4 space-y-3">
                        {[
                            { text: 'Individual reports select a maximum of 5 students for better accuracy.',      color: P.green  },
                            { text: 'Highlight Strengths & Weaknesses emphasizes strongest and weakest select.', color: P.primary },
                            { text: 'Choose the report sections most relevant to your needs for a focused report.', color: P.green },
                        ].map((item, i) => (
                            <div key={i} className="flex items-start gap-2">
                                <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: item.color }} />
                                <p style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#64748B', lineHeight: 1.5 }}>{item.text}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Groq badge */}
                <div className="rounded-2xl p-4 flex-shrink-0"
                    style={{ background: `linear-gradient(135deg,${P.soft},rgba(99,102,241,0.06))`, border: `1px solid ${P.border}` }}>
                    <div className="flex items-center gap-2 mb-1">
                        <Brain className="w-4 h-4" style={{ color: P.primary }} />
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.black, color: P.primary }}>Powered by Groq AI</p>
                    </div>
                    <p style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#64748B', lineHeight: 1.5 }}>
                        Generates personalized student reports using <strong>llama-3.3-70b-versatile</strong> with real quiz & enrollment data.
                    </p>
                    <div className="flex items-center gap-1.5 mt-2">
                        <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: P.green }} />
                        <span style={{ fontFamily: T.fontFamily, fontSize: '10px', color: P.green, fontWeight: T.weight.semibold }}>Live · Auto-updating</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Missing import fix
function CheckCircle({ className, style }) {
    return (
        <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
    );
}