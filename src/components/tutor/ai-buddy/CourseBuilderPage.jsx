'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Hammer, Sparkles, Loader2, ChevronDown, MoreHorizontal,
    Check, BookOpen, Brain, Clock, Users, Zap,
    Lightbulb, ChevronRight, Trash2, RefreshCw,
    BarChart2, Share2, FileText, Play, ClipboardList,
    Star, Award, Target, GraduationCap, Globe
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
    green:    '#10B981',
    orange:   '#F97316',
    yellow:   '#F59E0B',
    red:      '#EF4444',
    teal:     '#0891B2',
    indigo:   '#6366F1',
};

const SUBJECTS = [
    { label: 'Math',      icon: '📊', color: P.indigo  },
    { label: 'Physics',   icon: '⚛️',  color: P.teal   },
    { label: 'Biology',   icon: '🌿',  color: P.green  },
    { label: 'Chemistry', icon: '🧪',  color: P.orange },
    { label: 'History',   icon: '📚',  color: P.yellow },
    { label: 'Geography', icon: '🌍',  color: P.primary},
    { label: 'English',   icon: '✍️',  color: P.red    },
];

const GRADE_LEVELS = ['6th Grade', '7th Grade', '8th Grade', '9th Grade', '10th Grade', '11th Grade', '12th Grade', 'College'];

const DIFFICULTY_OPTIONS = [
    { value: 'easy',     label: '🌱 Easy (Beginner-friendly)'              },
    { value: 'balanced', label: '⚖️ Balanced (Mixed Difficulty)'            },
    { value: 'focused',  label: '🎯 Focused (Deep dive into specific topics)'},
    { value: 'advanced', label: '🚀 Advanced (Expert level)'                },
];

const SECTION_OPTIONS = [
    { key: 'visualLessons',        label: 'Visual Lessons',         icon: Play         },
    { key: 'practiceQuizzes',      label: 'Practice Quizzes',       icon: ClipboardList},
    { key: 'flashcards',           label: 'Flashcards',             icon: Star         },
    { key: 'assignments',          label: 'Assignments',            icon: FileText     },
    { key: 'conceptSummaries',     label: 'Concept Summaries',      icon: BookOpen     },
    { key: 'formativeAssessments', label: 'Formative Assessments',  icon: Award        },
    { key: 'includeAIChatbot',     label: 'Include AI Chatbot',     icon: Brain        },
];

const QUICK_TEMPLATES = [
    { title: 'Algebra Fundamentals',     grade: 'Grade 9', subject: 'Math',         color: P.orange  },
    { title: 'Introduction To Biology',  grade: 'Grade 7', subject: 'Science',      color: P.green   },
    { title: 'Writing Composition',      grade: 'Grade 8', subject: 'Language Arts', color: P.indigo  },
    { title: 'World War II History',     grade: 'Advanced', subject: 'History',      color: P.yellow  },
];

const LESSON_TYPE_CFG = {
    video:      { icon: Play,         color: P.primary },
    reading:    { icon: BookOpen,     color: P.teal    },
    quiz:       { icon: ClipboardList,color: P.orange  },
    assignment: { icon: FileText,     color: P.indigo  },
    flashcard:  { icon: Star,         color: P.yellow  },
    summary:    { icon: Target,       color: P.green   },
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skel({ h = 10, w = '100%', r = 10 }) {
    return <div className="animate-pulse" style={{ height: h, width: w, borderRadius: r, backgroundColor: P.soft }} />;
}

// ─── Checkbox ─────────────────────────────────────────────────────────────────
function Checkbox({ checked, onChange, label, icon: Icon, color }) {
    return (
        <div onClick={() => onChange(!checked)}
            className="flex items-center gap-2 cursor-pointer group">
            <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-all"
                style={{ backgroundColor: checked ? P.primary : 'transparent', border: `1.5px solid ${checked ? P.primary : '#CBD5E1'}` }}>
                {checked && <Check className="w-2.5 h-2.5 text-white" />}
            </div>
            {Icon && <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: checked ? color || P.primary : '#94A3B8' }} />}
            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.medium, color: checked ? '#334155' : '#64748B' }}>
                {label}
            </span>
        </div>
    );
}

// ─── Recent Course Card ───────────────────────────────────────────────────────
function RecentCourseCard({ course, onDelete }) {
    const colors = [P.orange, P.green, P.teal, P.indigo, P.yellow, P.red, P.primary];
    const color  = colors[course.title.charCodeAt(0) % colors.length];
    const icon   = ['📊','⚛️','🌿','🧪','📚','✍️','🌍'][course.title.charCodeAt(0) % 7];

    return (
        <div className="flex items-center gap-3 py-2.5 px-1 transition-all rounded-xl hover:opacity-80"
            style={{ borderBottom: `1px solid ${P.border}` }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: color + '15' }}>
                <span style={{ fontSize: 18 }}>{icon}</span>
            </div>
            <div className="flex-1 min-w-0">
                <p className="truncate" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: '#1E293B' }}>
                    {course.title}
                </p>
                <p style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#94A3B8' }}>
                    {course.gradeLevel || course.subject || 'Course'} · {course.timeAgo}
                </p>
            </div>
            <button onClick={() => onDelete(course._id)} className="p-1 rounded-lg hover:opacity-70 flex-shrink-0">
                <Trash2 className="w-3 h-3" style={{ color: '#CBD5E1' }} />
            </button>
        </div>
    );
}

// ─── Module card ──────────────────────────────────────────────────────────────
function ModuleCard({ module, index, isActive, onClick }) {
    return (
        <div onClick={onClick}
            className="p-4 rounded-2xl cursor-pointer transition-all hover:-translate-y-0.5"
            style={{
                backgroundColor: isActive ? P.soft : '#fff',
                border:          isActive ? `1.5px solid ${P.primary}` : `1px solid ${P.border}`,
                boxShadow:       isActive ? `0 0 0 3px ${P.primary}15` : S.card,
            }}>
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                        style={{ background: P.gradient }}>
                        <span style={{ fontFamily: T.fontFamily, fontSize: '9px', fontWeight: T.weight.black, color: '#fff' }}>
                            M{module.moduleNumber}
                        </span>
                    </div>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.black, color: '#1E293B' }}>
                        {module.title}
                    </p>
                </div>
                <span style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#94A3B8' }}>{module.duration}</span>
            </div>
            <p style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#64748B', lineHeight: 1.5, marginBottom: 8 }}>
                {module.description}
            </p>
            <div className="flex items-center gap-1.5">
                <span style={{ fontFamily: T.fontFamily, fontSize: '10px', color: P.primary, fontWeight: T.weight.semibold }}>
                    {module.lessons?.length || 0} lessons
                </span>
                {(module.lessons || []).slice(0, 3).map((l, i) => {
                    const cfg  = LESSON_TYPE_CFG[l.type] || LESSON_TYPE_CFG.reading;
                    const Icon = cfg.icon;
                    return (
                        <div key={i} className="w-5 h-5 rounded flex items-center justify-center"
                            style={{ backgroundColor: cfg.color + '15' }}>
                            <Icon className="w-3 h-3" style={{ color: cfg.color }} />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CourseBuilderPage() {
    // Form state
    const [topic, setTopic]           = useState('');
    const [subject, setSubject]       = useState('');
    const [gradeLevel, setGradeLevel] = useState('8th Grade');
    const [difficulty, setDifficulty] = useState('balanced');
    const [sections, setSections]     = useState({
        visualLessons: true, practiceQuizzes: true, flashcards: true,
        assignments: true, conceptSummaries: true, formativeAssessments: true, includeAIChatbot: false,
    });

    // Data
    const [loadingRecent, setLoadingRecent] = useState(true);
    const [recentCourses, setRecentCourses] = useState([]);
    const [stats, setStats]                 = useState(null);

    // Generation
    const [generating, setGenerating] = useState(false);
    const [course, setCourse]         = useState(null);
    const [activeModule, setActiveModule] = useState(null);
    const [activeTab, setActiveTab]   = useState('modules'); // modules | flashcards | quiz

    // ── Fetch recent ─────────────────────────────────────────────────
    const fetchRecent = useCallback(async () => {
        setLoadingRecent(true);
        try {
            const res = await api.get('/ai/course-builder/recent');
            if (res.data?.success) {
                setRecentCourses(res.data.courses || []);
                setStats(res.data.stats);
            }
        } catch { /* silent */ }
        finally { setLoadingRecent(false); }
    }, []);

    useEffect(() => { fetchRecent(); }, [fetchRecent]);

    // ── Generate ──────────────────────────────────────────────────────
    const handleGenerate = async () => {
        if (!topic.trim()) return toast.error('Please enter a course topic');

        setGenerating(true);
        setCourse(null);
        setActiveModule(null);

        try {
            const res = await api.post('/ai/course-builder/generate', {
                topic, subject, gradeLevel, difficulty, sections,
            });

            if (res.data?.success) {
                setCourse(res.data.course);
                setActiveModule(res.data.course.modules?.[0] || null);
                toast.success('Course generated!');
                fetchRecent();
            } else {
                toast.error('Generation failed. Please retry.');
            }
        } catch (err) {
            toast.error(err?.response?.data?.message || 'AI failed. Please retry.');
        } finally {
            setGenerating(false);
        }
    };

    // ── Delete ────────────────────────────────────────────────────────
    const handleDelete = async (id) => {
        try {
            await api.delete(`/ai/course-builder/${id}`);
            setRecentCourses(prev => prev.filter(c => c._id !== id));
            toast.success('Deleted');
        } catch { toast.error('Failed to delete'); }
    };

    // ── Load template ─────────────────────────────────────────────────
    const loadTemplate = (tmpl) => {
        setTopic(tmpl.title);
        setSubject(tmpl.subject);
        toast(`Template loaded: ${tmpl.title}`);
    };

    const toggleSection = (key) => setSections(prev => ({ ...prev, [key]: !prev[key] }));

    // ─────────────────────────────────────────────────────────────────
    return (
        <div className="flex gap-4 h-full p-4 overflow-y-auto custom-scrollbar"
            style={{ fontFamily: T.fontFamily, backgroundColor: P.pageBg }}>

            {/* ── LEFT + CENTER ──────────────────────────────────────────── */}
            <div className="flex-1 flex flex-col gap-4 min-w-0">

                {/* Header */}
                <div className="rounded-2xl p-5 relative overflow-hidden"
                    style={{ background: `linear-gradient(135deg,#EDE9FE 0%,#F5F3FF 70%,#EDE9FE 100%)`, border: `1px solid ${P.border}`, boxShadow: S.card }}>
                    {[...Array(10)].map((_, i) => (
                        <div key={i} className="absolute rounded-full"
                            style={{ width: i % 2 === 0 ? 4 : 2, height: i % 2 === 0 ? 4 : 2, backgroundColor: `rgba(124,58,237,${0.10 + (i % 4) * 0.05})`, left: `${5 + i * 9}%`, top: `${10 + (i % 4) * 22}%` }} />
                    ))}
                    <div className="flex items-start gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-2.5 mb-1">
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                                    style={{ background: P.gradient }}>
                                    <Hammer className="w-4.5 h-4.5 text-white" style={{ width: 18, height: 18 }} />
                                </div>
                                <h1 style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.black, color: '#1E293B' }}>
                                    AI Course Builder
                                </h1>
                            </div>
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: '#64748B', marginLeft: 46 }}>
                                <strong style={{ color: P.primary }}>AI-Powered</strong> tool to create engaging and interactive courses with ease
                            </p>
                        </div>
                        {/* Robot */}
                        <div className="w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0"
                            style={{ background: P.gradient, boxShadow: `0 8px 24px rgba(124,58,237,0.30)` }}>
                            <Brain className="w-10 h-10 text-white" />
                        </div>
                    </div>
                </div>

                {/* Config card */}
                <div className="rounded-2xl p-5"
                    style={{ backgroundColor: '#fff', border: `1px solid ${P.border}`, boxShadow: S.card }}>
                    <div className="grid grid-cols-2 gap-5">

                        {/* LEFT config */}
                        <div className="flex flex-col gap-4">
                            {/* Course Topic */}
                            <div>
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#1E293B', marginBottom: 8 }}>
                                    Course Topic
                                </p>
                                <textarea
                                    value={topic}
                                    onChange={e => setTopic(e.target.value)}
                                    placeholder="Enter course topic or paste text content…"
                                    rows={2}
                                    className="w-full resize-none outline-none px-4 py-3 rounded-xl"
                                    style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: '#334155', border: `1px solid ${P.border}`, backgroundColor: P.soft, lineHeight: 1.6 }}
                                />
                                {/* Subject chips */}
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {SUBJECTS.map(s => (
                                        <button key={s.label} onClick={() => setSubject(prev => prev === s.label ? '' : s.label)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all hover:opacity-80"
                                            style={{
                                                backgroundColor: subject === s.label ? s.color : s.color + '15',
                                                border:          `1px solid ${s.color}30`,
                                                fontFamily:      T.fontFamily,
                                                fontSize:        T.size.xs,
                                                fontWeight:      T.weight.semibold,
                                                color:           subject === s.label ? '#fff' : s.color,
                                            }}>
                                            <span style={{ fontSize: 12 }}>{s.icon}</span>
                                            {s.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Target Grade Level */}
                            <div>
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#1E293B', marginBottom: 8 }}>
                                    Target Grade Level
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {GRADE_LEVELS.slice(0, 5).map(g => (
                                        <button key={g} onClick={() => setGradeLevel(g)}
                                            className="px-3 py-1.5 rounded-xl transition-all"
                                            style={{
                                                fontFamily:      T.fontFamily,
                                                fontSize:        T.size.xs,
                                                fontWeight:      T.weight.semibold,
                                                color:           gradeLevel === g ? '#fff' : '#64748B',
                                                backgroundColor: gradeLevel === g ? P.primary : P.soft,
                                                border:          `1px solid ${gradeLevel === g ? P.primary : P.border}`,
                                            }}>
                                            {g}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Difficulty */}
                            <div>
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#1E293B', marginBottom: 8 }}>
                                    Difficulty Level
                                </p>
                                <div className="relative">
                                    <select value={difficulty} onChange={e => setDifficulty(e.target.value)}
                                        className="w-full appearance-none px-4 py-2.5 rounded-xl pr-8 outline-none"
                                        style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#334155', border: `1px solid ${P.border}`, backgroundColor: P.soft }}>
                                        {DIFFICULTY_OPTIONS.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#94A3B8' }} />
                                </div>
                            </div>

                            {/* Learning Objectives */}
                            <div>
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#1E293B', marginBottom: 10 }}>
                                    Learning Objectives
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                    {SECTION_OPTIONS.slice(0, 6).map(opt => (
                                        <Checkbox key={opt.key}
                                            checked={sections[opt.key]}
                                            onChange={v => setSections(prev => ({ ...prev, [opt.key]: v }))}
                                            label={opt.label}
                                            icon={opt.icon}
                                            color={P.primary} />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* RIGHT config — Report Sections */}
                        <div>
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#1E293B', marginBottom: 10 }}>
                                Report Sections
                            </p>
                            <div className="space-y-2.5 p-4 rounded-2xl"
                                style={{ backgroundColor: P.soft, border: `1px solid ${P.border}` }}>
                                {SECTION_OPTIONS.map(opt => (
                                    <Checkbox key={opt.key}
                                        checked={sections[opt.key]}
                                        onChange={v => setSections(prev => ({ ...prev, [opt.key]: v }))}
                                        label={opt.label}
                                        icon={opt.icon}
                                        color={P.primary} />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Stats bar */}
                    <div className="flex items-center gap-3 mt-5 pt-4"
                        style={{ borderTop: `1px solid ${P.border}` }}>
                        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl flex-1"
                            style={{ backgroundColor: P.soft, border: `1px solid ${P.border}` }}>
                            <GraduationCap className="w-4 h-4" style={{ color: P.primary }} />
                            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#64748B' }}>Courses Generated:</span>
                            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: P.primary }}>
                                {stats ? `${stats.total} Total` : '—'}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl flex-1"
                            style={{ backgroundColor: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.14)' }}>
                            <Clock className="w-4 h-4" style={{ color: P.orange }} />
                            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#64748B' }}>Time Saved:</span>
                            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: P.orange }}>
                                {stats ? `${stats.timeSaved} hrs` : '—'}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl flex-1"
                            style={{ backgroundColor: P.soft, border: `1px solid ${P.border}` }}>
                            <Share2 className="w-4 h-4" style={{ color: P.primary }} />
                            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#64748B' }}>Share:</span>
                            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: P.primary }}>
                                •{stats?.shareCount ?? '—'}
                            </span>
                        </div>
                    </div>

                    {/* Tips */}
                    <div className="mt-4 p-4 rounded-2xl"
                        style={{ backgroundColor: P.soft, border: `1px solid ${P.border}` }}>
                        <div className="flex items-center gap-2 mb-2">
                            <span style={{ fontSize: 16 }}>⚙️</span>
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#1E293B' }}>Tips</p>
                        </div>
                        {[
                            'Set specific target grade levels to ensure the generated content aligns with student capabilities.',
                            'Select "Balanced" for diverse content focus or "Focused" to deeply cover a specific topic.',
                            'Add interactive elements like practice quizzes and flashcards to engage students.',
                        ].map((tip, i) => (
                            <div key={i} className="flex items-start gap-2 mb-1.5 last:mb-0">
                                <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                                    style={{ backgroundColor: P.green }}>
                                    <Check className="w-2.5 h-2.5 text-white" />
                                </div>
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#475569', lineHeight: 1.6 }}>{tip}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Generate button */}
                <button onClick={handleGenerate} disabled={generating || !topic.trim()}
                    className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl transition-all disabled:opacity-50 hover:opacity-90 flex-shrink-0"
                    style={{ background: P.gradient, boxShadow: `0 4px 16px rgba(124,58,237,0.35)` }}>
                    {generating
                        ? <Loader2 className="w-5 h-5 text-white animate-spin" />
                        : <Sparkles className="w-5 h-5 text-white" />}
                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.black, color: '#fff' }}>
                        {generating ? 'AI is building the course…' : 'Generate Course'}
                    </span>
                </button>

                {/* ── Generated Course ── */}
                {generating && (
                    <div className="flex flex-col items-center py-10 rounded-2xl"
                        style={{ backgroundColor: '#fff', border: `1px solid ${P.border}`, boxShadow: S.card }}>
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
                            style={{ background: P.gradient }}>
                            <Sparkles className="w-7 h-7 text-white animate-pulse" />
                        </div>
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.md, fontWeight: T.weight.black, color: '#1E293B', marginBottom: 4 }}>
                            AI is designing your course…
                        </p>
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#94A3B8' }}>Powered by Groq · usually 8–15s</p>
                        <div className="flex gap-1.5 mt-3">
                            {[0,1,2].map(i => (
                                <span key={i} className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: P.primary, animation: `cb-b 1.2s ease-in-out ${i*0.2}s infinite` }} />
                            ))}
                            <style>{`@keyframes cb-b{0%,80%,100%{transform:translateY(0);opacity:.4}40%{transform:translateY(-5px);opacity:1}}`}</style>
                        </div>
                    </div>
                )}

                {course && !generating && (
                    <div className="rounded-2xl overflow-hidden"
                        style={{ backgroundColor: '#fff', border: `1px solid ${P.border}`, boxShadow: S.card }}>
                        {/* Course header */}
                        <div className="p-5" style={{ background: P.gradient }}>
                            <div className="flex items-start justify-between">
                                <div>
                                    <p style={{ fontFamily: T.fontFamily, fontSize: '10px', color: 'rgba(255,255,255,0.70)', fontWeight: T.weight.bold, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                        Generated Course
                                    </p>
                                    <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.xl, fontWeight: T.weight.black, color: '#fff', marginTop: 4, marginBottom: 4 }}>
                                        {course.title}
                                    </h3>
                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5, maxWidth: 400 }}>
                                        {course.description}
                                    </p>
                                </div>
                                <div className="flex flex-col gap-2 flex-shrink-0 ml-4">
                                    {[
                                        { icon: Clock,   value: course.estimatedDuration || '—', label: 'Duration' },
                                        { icon: Users,   value: course.targetAudience    || '—', label: 'Audience' },
                                        { icon: BookOpen,value: `${course.modules?.length || 0} Modules`, label: 'Modules' },
                                    ].map(item => {
                                        const Icon = item.icon;
                                        return (
                                            <div key={item.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
                                                style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
                                                <Icon className="w-3.5 h-3.5 text-white" />
                                                <span style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#fff', fontWeight: T.weight.semibold }}>
                                                    {item.value}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex items-center gap-1 px-5 pt-3"
                            style={{ borderBottom: `1px solid ${P.border}` }}>
                            {['modules', 'flashcards', 'quiz'].map(tab => (
                                <button key={tab} onClick={() => setActiveTab(tab)}
                                    className="px-4 py-2 rounded-t-xl transition-all capitalize"
                                    style={{
                                        fontFamily:      T.fontFamily,
                                        fontSize:        T.size.xs,
                                        fontWeight:      activeTab === tab ? T.weight.bold : T.weight.medium,
                                        color:           activeTab === tab ? P.primary : '#64748B',
                                        backgroundColor: activeTab === tab ? P.soft : 'transparent',
                                        borderBottom:    activeTab === tab ? `2px solid ${P.primary}` : '2px solid transparent',
                                    }}>
                                    {tab === 'modules' ? `📚 ${course.modules?.length || 0} Modules`
                                        : tab === 'flashcards' ? `⭐ ${course.flashcards?.length || 0} Flashcards`
                                        : `📝 ${course.sampleQuiz?.length || 0} Quiz Questions`}
                                </button>
                            ))}
                        </div>

                        <div className="p-5">
                            {/* Modules tab */}
                            {activeTab === 'modules' && (
                                <div className="flex gap-4">
                                    <div className="flex flex-col gap-3 flex-shrink-0" style={{ width: 220 }}>
                                        {(course.modules || []).map((mod, i) => (
                                            <ModuleCard key={i} module={mod} index={i}
                                                isActive={activeModule?.moduleNumber === mod.moduleNumber}
                                                onClick={() => setActiveModule(mod)} />
                                        ))}
                                    </div>
                                    {activeModule && (
                                        <div className="flex-1 min-w-0">
                                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#1E293B', marginBottom: 12 }}>
                                                {activeModule.title} — Lessons
                                            </p>
                                            <div className="space-y-2.5">
                                                {(activeModule.lessons || []).map((lesson, i) => {
                                                    const cfg  = LESSON_TYPE_CFG[lesson.type] || LESSON_TYPE_CFG.reading;
                                                    const Icon = cfg.icon;
                                                    return (
                                                        <div key={i} className="flex items-start gap-3 p-3 rounded-xl"
                                                            style={{ backgroundColor: P.soft, border: `1px solid ${P.border}` }}>
                                                            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                                                style={{ backgroundColor: cfg.color + '15' }}>
                                                                <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2">
                                                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: '#1E293B' }}>
                                                                        L{lesson.lessonNumber}. {lesson.title}
                                                                    </p>
                                                                    <span className="px-1.5 py-0.5 rounded-full"
                                                                        style={{ backgroundColor: cfg.color + '15', fontFamily: T.fontFamily, fontSize: '9px', fontWeight: T.weight.bold, color: cfg.color }}>
                                                                        {lesson.type}
                                                                    </span>
                                                                    <span style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#94A3B8', marginLeft: 'auto' }}>{lesson.duration}</span>
                                                                </div>
                                                                <p style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#64748B', lineHeight: 1.5, marginTop: 2 }}>
                                                                    {lesson.description}
                                                                </p>
                                                                {lesson.keyPoints?.length > 0 && (
                                                                    <div className="flex flex-wrap gap-1 mt-1.5">
                                                                        {lesson.keyPoints.map(kp => (
                                                                            <span key={kp} className="px-2 py-0.5 rounded-full"
                                                                                style={{ backgroundColor: '#fff', border: `1px solid ${P.border}`, fontFamily: T.fontFamily, fontSize: '9px', color: '#64748B' }}>
                                                                                {kp}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Flashcards tab */}
                            {activeTab === 'flashcards' && (
                                <div className="grid grid-cols-2 gap-3">
                                    {(course.flashcards || []).map((fc, i) => (
                                        <div key={i} className="p-4 rounded-2xl"
                                            style={{ background: `linear-gradient(135deg,${P.soft},rgba(255,255,255,0.5))`, border: `1px solid ${P.border}` }}>
                                            <p style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: P.primary, marginBottom: 6 }}>
                                                TERM / QUESTION
                                            </p>
                                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: '#1E293B', marginBottom: 8 }}>
                                                {fc.front}
                                            </p>
                                            <div className="pt-2" style={{ borderTop: `1px dashed ${P.border}` }}>
                                                <p style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: P.green, marginBottom: 4 }}>
                                                    ANSWER / DEFINITION
                                                </p>
                                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#475569', lineHeight: 1.6 }}>
                                                    {fc.back}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Quiz tab */}
                            {activeTab === 'quiz' && (
                                <div className="space-y-4">
                                    {(course.sampleQuiz || []).map((q, i) => (
                                        <div key={i} className="p-4 rounded-2xl"
                                            style={{ backgroundColor: P.soft, border: `1px solid ${P.border}` }}>
                                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.black, color: '#1E293B', marginBottom: 10 }}>
                                                Q{i + 1}. {q.question}
                                            </p>
                                            <div className="grid grid-cols-2 gap-2">
                                                {(q.options || []).map((opt, j) => (
                                                    <div key={j} className="flex items-center gap-2 px-3 py-2 rounded-xl"
                                                        style={{
                                                            backgroundColor: opt === q.correctAnswer ? P.green + '15' : '#fff',
                                                            border: `1px solid ${opt === q.correctAnswer ? P.green + '40' : P.border}`,
                                                        }}>
                                                        <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                                                            style={{ backgroundColor: opt === q.correctAnswer ? P.green : '#E2E8F0' }}>
                                                            <span style={{ fontFamily: T.fontFamily, fontSize: '9px', fontWeight: T.weight.black, color: opt === q.correctAnswer ? '#fff' : '#94A3B8' }}>
                                                                {['A','B','C','D'][j]}
                                                            </span>
                                                        </div>
                                                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: opt === q.correctAnswer ? P.green : '#475569', fontWeight: opt === q.correctAnswer ? T.weight.bold : T.weight.regular }}>
                                                            {opt}
                                                        </span>
                                                        {opt === q.correctAnswer && <Check className="w-3 h-3 ml-auto" style={{ color: P.green }} />}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* ── RIGHT PANEL ───────────────────────────────────────────────── */}
            <div className="flex flex-col gap-4 flex-shrink-0 overflow-y-auto custom-scrollbar" style={{ width: 272 }}>

                {/* Recent Courses */}
                <div className="rounded-2xl overflow-hidden flex-shrink-0"
                    style={{ backgroundColor: '#fff', border: `1px solid ${P.border}`, boxShadow: S.card }}>
                    <div className="flex items-center justify-between px-4 py-3.5"
                        style={{ borderBottom: `1px solid ${P.border}`, background: `linear-gradient(135deg,${P.soft},rgba(255,255,255,0))` }}>
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#1E293B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Recent Courses
                        </p>
                        <button className="p-1 rounded-lg hover:opacity-70">
                            <MoreHorizontal className="w-4 h-4" style={{ color: '#94A3B8' }} />
                        </button>
                    </div>
                    <div className="px-4 py-3">
                        {loadingRecent ? (
                            [...Array(5)].map((_, i) => (
                                <div key={i} className="flex items-center gap-3 py-2.5">
                                    <Skel h={40} w={40} r={12} />
                                    <div className="flex-1 space-y-1.5"><Skel h={9} /><Skel h={7} w="70%" /></div>
                                </div>
                            ))
                        ) : recentCourses.length === 0 ? (
                            <div className="text-center py-6">
                                <BookOpen className="w-8 h-8 mx-auto mb-2" style={{ color: `${P.primary}30` }} />
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#CBD5E1' }}>No courses yet</p>
                            </div>
                        ) : (
                            recentCourses.slice(0, 8).map(c => (
                                <RecentCourseCard key={c._id} course={c} onDelete={handleDelete} />
                            ))
                        )}
                    </div>
                    {recentCourses.length > 0 && (
                        <div className="px-4 pb-3">
                            <button className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl"
                                style={{ backgroundColor: P.soft, border: `1px solid ${P.border}` }}>
                                <span style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: P.primary }}>View All</span>
                                <ChevronRight className="w-3 h-3" style={{ color: P.primary }} />
                            </button>
                        </div>
                    )}
                </div>

                {/* Quick Start Templates */}
                <div className="rounded-2xl overflow-hidden flex-shrink-0"
                    style={{ backgroundColor: '#fff', border: `1px solid ${P.border}`, boxShadow: S.card }}>
                    <div className="flex items-center justify-between px-4 py-3.5"
                        style={{ borderBottom: `1px solid ${P.border}`, background: `linear-gradient(135deg,${P.soft},rgba(255,255,255,0))` }}>
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#1E293B' }}>Quick Start Templates</p>
                        <button className="p-1 rounded-lg hover:opacity-70">
                            <MoreHorizontal className="w-4 h-4" style={{ color: '#94A3B8' }} />
                        </button>
                    </div>
                    <div className="p-4 space-y-2">
                        {QUICK_TEMPLATES.map((tmpl, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 rounded-xl transition-all hover:opacity-80"
                                style={{ backgroundColor: P.soft, border: `1px solid ${P.border}`, cursor: 'pointer' }}
                                onClick={() => loadTemplate(tmpl)}>
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                    style={{ backgroundColor: tmpl.color + '15' }}>
                                    <BookOpen className="w-4.5 h-4.5" style={{ color: tmpl.color, width: 18, height: 18 }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: '#1E293B' }}>
                                        {tmpl.title}
                                    </p>
                                    <p style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#94A3B8' }}>
                                        {tmpl.grade} {tmpl.subject}
                                    </p>
                                </div>
                            </div>
                        ))}
                        <button className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl mt-2 transition-all hover:opacity-80"
                            style={{ background: P.gradient }}>
                            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.black, color: '#fff' }}>Load Template</span>
                            <ChevronRight className="w-3.5 h-3.5 text-white" />
                        </button>
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
                        Complete course structures with modules, lessons, flashcards & quizzes using <strong>llama-3.3-70b-versatile</strong>.
                    </p>
                    <div className="flex items-center gap-1.5 mt-2">
                        <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: P.green }} />
                        <span style={{ fontFamily: T.fontFamily, fontSize: '10px', color: P.green, fontWeight: T.weight.semibold }}>Online · Fast Response</span>
                    </div>
                </div>
            </div>
        </div>
    );
}