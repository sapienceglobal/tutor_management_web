'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft, Loader2, Save, Pencil, Plus, Trash2, MessageSquare, ChevronRight, Settings,
    Eye, EyeOff, Clock, Calendar
} from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import AudienceSelector from '@/components/shared/AudienceSelector';
import useInstitute from '@/hooks/useInstitute';
import { C, T, S, R } from '@/constants/tutorTokens';

// Focus Handlers
const onFocusHandler = e => {
    e.target.style.borderColor = C.btnPrimary;
    e.target.style.boxShadow = '0 0 0 3px rgba(117,115,232,0.10)';
};
const onBlurHandler = e => {
    e.target.style.borderColor = 'transparent';
    e.target.style.boxShadow = 'none';
};

const baseInputStyle = {
    backgroundColor: C.surfaceWhite,
    border: `1.5px solid transparent`,
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

// Step tab component
const StepTab = ({ step, currentStep, label, icon: Icon, onClick }) => {
    const isActive = currentStep === step;
    return (
        <button onClick={() => onClick(step)}
            className="flex flex-1 items-center justify-center gap-2 px-4 py-2 cursor-pointer border-none transition-all"
            style={{ 
                backgroundColor: isActive ? C.surfaceWhite : 'transparent',
                color: isActive ? C.btnPrimary : C.textMuted,
                borderRadius: R.lg,
                boxShadow: isActive ? S.card : 'none',
                fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily
            }}>
            <Icon size={16} />
            <span className="hidden sm:inline">{label}</span>
        </button>
    );
};

// Custom Switch
const CustomSwitch = ({ checked, onChange }) => {
    return (
        <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
            style={{
                position: 'relative', display: 'inline-flex', height: '24px', width: '44px', flexShrink: 0,
                cursor: 'pointer', alignItems: 'center', borderRadius: R.full, border: '2px solid transparent',
                transition: 'background-color 300ms ease-in-out', backgroundColor: checked ? C.btnPrimary : '#D3D3F1'
            }}>
            <span style={{
                    display: 'inline-block', height: '20px', width: '20px', borderRadius: R.full, backgroundColor: '#ffffff',
                    transition: 'transform 300ms ease-in-out', transform: checked ? 'translateX(20px)' : 'translateX(0px)', boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }} />
        </button>
    );
};

const SettingRow = ({ label, desc, checked, onChange }) => (
    <div className="flex items-center justify-between p-4 mb-3" style={{ backgroundColor: '#E3DFF8', borderRadius: R.xl }}>
        <div>
            <label style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, cursor: 'pointer', display: 'block', margin: '0 0 2px 0' }}>{label}</label>
            {desc && <p style={{ fontSize: T.size.xs, fontWeight: T.weight.medium, color: C.textMuted, margin: 0 }}>{desc}</p>}
        </div>
        <CustomSwitch checked={checked} onChange={onChange} />
    </div>
);

export default function EditExamPage({ params }) {
    const { examId } = use(params);
    const router = useRouter();
    const { institute } = useInstitute();
    const [step, setStep] = useState(2);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [courses, setCourses] = useState([]);
    const [availableBatches, setAvailableBatches] = useState([]);
    const [availableStudents, setAvailableStudents] = useState([]);
    const [examData, setExamData] = useState({
        title: '', courseId: '', duration: 30, passingMarks: 10, passingPercentage: 33,
        description: '', allowRetake: false, maxAttempts: 1, showResultImmediately: true,
        showCorrectAnswers: true, shuffleQuestions: false, shuffleOptions: false,
        startDate: '', endDate: '', questions: [],
        audience: { scope: 'institute', instituteId: null, batchIds: [], studentIds: [] },
    });

    const totalQuestionMarks = (examData.questions || []).reduce((sum, q) => sum + (Number(q.points) || 1), 0);
    const derivedPassingMarks = totalQuestionMarks > 0
        ? Number((((Number(examData.passingPercentage) || 0) / 100) * totalQuestionMarks).toFixed(2))
        : 0;

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [coursesRes, examRes] = await Promise.all([api.get('/courses/my-courses'), api.get(`/exams/${examId}`)]);
                if (coursesRes?.data?.success) setCourses(coursesRes.data.courses);
                if (examRes?.data?.success) {
                    const exam = examRes.data.exam;
                    const formatDate = (d) => d ? new Date(d).toISOString().slice(0, 16) : '';
                    setExamData({
                        ...exam,
                        courseId: exam.courseId._id || exam.courseId,
                        passingPercentage: exam.passingPercentage ?? 33,
                        startDate: formatDate(exam.startDate),
                        endDate: formatDate(exam.endDate),
                        questions: exam.questions.map(q => ({ ...q, points: q.points || 1, explanation: q.explanation || '' })),
                        audience: exam.audience || {
                            scope: exam.batchId ? 'batch' : (exam.instituteId ? 'institute' : 'global'),
                            instituteId: exam.instituteId || institute?._id || null,
                            batchIds: exam.batchId ? [exam.batchId] : [],
                            studentIds: [],
                        },
                    });
                }
            } catch (error) {
                toast.error('Failed to load exam data.');
                router.push('/tutor/quizzes');
            } finally {
                setLoading(false);
            }
        };
        if (examId) fetchInitialData();
    }, [examId, router, institute?._id]);

    useEffect(() => {
        const fetchAudienceTargets = async () => {
            if (!examData.courseId) { setAvailableBatches([]); setAvailableStudents([]); return; }
            try {
                const [batchesRes, studentsRes] = await Promise.all([api.get('/batches'), api.get(`/enrollments/students/${examData.courseId}`)]);
                const batchList = (batchesRes?.data?.batches || []).filter(b => (b.courseId?._id || b.courseId) === examData.courseId);
                setAvailableBatches(batchList);
                const studentList = (studentsRes?.data?.students || []).map(item => ({ _id: item.studentId?._id, name: item.studentId?.name, email: item.studentId?.email })).filter(i => i._id);
                setAvailableStudents(studentList);
            } catch { setAvailableBatches([]); setAvailableStudents([]); }
        };
        fetchAudienceTargets();
    }, [examData.courseId]);

    useEffect(() => {
        setExamData(prev => ({ ...prev, audience: { ...prev.audience, instituteId: prev.audience?.instituteId || institute?._id || null } }));
    }, [institute?._id]);

    const handleAddQuestion = (type = 'mcq') => {
        setExamData(prev => ({
            ...prev,
            questions: [...prev.questions,
                type === 'subjective'
                    ? { question: '', options: [], idealAnswer: '', points: 1, type: 'subjective' }
                    : { question: '', options: [{ text: 'Option A', isCorrect: true }, { text: 'Option B', isCorrect: false }, { text: 'Option C', isCorrect: false }, { text: 'Option D', isCorrect: false }], points: 1, type: 'mcq' }
            ]
        }));
    };
    const handleQuestionChange = (index, field, value) => {
        const updatedQuestions = [...examData.questions];
        updatedQuestions[index][field] = value;
        setExamData({ ...examData, questions: updatedQuestions });
    };
    const handleOptionChange = (qIndex, oIndex, field, value) => {
        const updatedQuestions = [...examData.questions];
        updatedQuestions[qIndex].options[oIndex][field] = value;
        if (field === 'isCorrect' && value === true) {
            updatedQuestions[qIndex].options.forEach((opt, idx) => { if (idx !== oIndex) opt.isCorrect = false; });
        }
        setExamData({ ...examData, questions: updatedQuestions });
    };
    const handleDeleteQuestion = (index) => {
        setExamData({ ...examData, questions: examData.questions.filter((_, i) => i !== index) });
    };
    
    const handleUpdateExam = async (newStatus = null) => {
        setSaving(true);
        try {
            const payload = {
                ...examData,
                passingPercentage: Number(examData.passingPercentage) || 0,
                passingMarks: derivedPassingMarks,
                startDate: examData.startDate || null,
                endDate: examData.endDate || null,
                status: newStatus || examData.status,
                audience: { ...examData.audience, instituteId: examData.audience?.instituteId || institute?._id || null },
                scope: examData.audience?.scope,
                batchId: examData.audience?.scope === 'batch' ? (examData.audience.batchIds?.[0] || null) : null,
            };
            const res = await api.patch(`/exams/${examId}`, payload);
            if (res?.data?.success) {
                if (newStatus) {
                    setExamData(prev => ({ ...prev, status: newStatus }));
                    toast.success(`Exam ${newStatus === 'published' ? 'Published' : 'Unpublished'}!`);
                } else {
                    toast.success('Exam Updated!');
                    router.push('/tutor/quizzes');
                }
            }
        } catch (error) {
            toast.error('Failed to update exam. ' + (error?.response?.data?.message || ''));
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-3 w-full" style={{ backgroundColor: '#dfdaf3', fontFamily: T.fontFamily }}>
                <Loader2 className="animate-spin" style={{ color: C.btnPrimary, width: '28px', height: '28px' }} />
                <p style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.bold }}>Loading exam data...</p>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen p-6 pb-24 space-y-6" style={{ backgroundColor: '#dfdaf3', fontFamily: T.fontFamily, color: C.text }}>
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                <div className="flex items-center gap-4">
                    <Link href="/tutor/quizzes" className="text-decoration-none">
                        <button className="w-10 h-10 flex items-center justify-center cursor-pointer border-none transition-opacity hover:opacity-80 shrink-0"
                            style={{ backgroundColor: '#E3DFF8', borderRadius: R.full }}>
                            <ArrowLeft size={18} color={C.heading} />
                        </button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h1 style={{ color: C.heading, fontSize: T.size.xl, fontWeight: T.weight.black, margin: 0 }}>
                                Edit Exam
                            </h1>
                            {examData.status && (
                                <span style={{ 
                                    backgroundColor: examData.status === 'published' ? C.successBg : '#D3D3F1', 
                                    color: examData.status === 'published' ? C.success : C.btnViewAllText, 
                                    border: `1px solid ${examData.status === 'published' ? C.successBorder : C.cardBorder}`,
                                    padding: '2px 8px', borderRadius: R.md, fontSize: '10px', fontWeight: T.weight.black, textTransform: 'uppercase' 
                                }}>
                                    {examData.status}
                                </span>
                            )}
                        </div>
                        <p style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.bold, margin: 0 }}>
                            {step === 2 ? "Update exam details and settings." : "Modify questions and answers."}
                        </p>
                    </div>
                </div>

                {/* Step tabs */}
                <div className="flex p-1 w-full sm:w-auto shrink-0" style={{ backgroundColor: '#E3DFF8', borderRadius: R.xl, border: `1px solid ${C.cardBorder}` }}>
                    <StepTab step={2} currentStep={step} label="Details" icon={Settings} onClick={setStep} />
                    <StepTab step={3} currentStep={step} label="Questions" icon={FileText} onClick={setStep} />
                </div>
            </div>

            {/* ── STEP 2: Details ──────────────────────────────────────────── */}
            {step === 2 && (
                <div className="max-w-3xl mx-auto space-y-6">
                    {/* Basic Info Card */}
                    <div className="p-6 space-y-5" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                        <h2 style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading, margin: '0 0 16px 0', borderBottom: `1px solid ${C.cardBorder}`, paddingBottom: '12px' }}>Basic Info</h2>

                        <div className="space-y-2">
                            <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase' }}>Select Course</label>
                            <select value={examData.courseId} disabled style={{ ...baseInputStyle, cursor: 'not-allowed', opacity: 0.7 }}>
                                <option value="">-- Choose a Course --</option>
                                {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
                            </select>
                            <p style={{ fontSize: '11px', color: C.textMuted, fontWeight: T.weight.medium, margin: 0 }}>Course cannot be changed after creation.</p>
                        </div>

                        <div className="space-y-2">
                            <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase' }}>Exam Title</label>
                            <input value={examData.title} onChange={(e) => setExamData({ ...examData, title: e.target.value })}
                                placeholder="e.g. Mid-term Assessment" style={baseInputStyle} onFocus={onFocusHandler} onBlur={onBlurHandler} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase' }}>Duration (min)</label>
                                <div className="relative">
                                    <input type="number" value={examData.duration} onChange={(e) => setExamData({ ...examData, duration: Number(e.target.value) })}
                                        style={{ ...baseInputStyle, paddingRight: '36px' }} onFocus={onFocusHandler} onBlur={onBlurHandler} />
                                    <Clock className="absolute right-3 top-1/2 -translate-y-1/2" size={16} color={C.textMuted} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase' }}>Pass Percentage</label>
                                <div className="relative">
                                    <input type="number" min="0" max="100" value={examData.passingPercentage} onChange={(e) => setExamData({ ...examData, passingPercentage: Number(e.target.value) || 0 })}
                                        style={{ ...baseInputStyle, paddingRight: '36px' }} onFocus={onFocusHandler} onBlur={onBlurHandler} />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2" style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.textMuted }}>%</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase' }}>Passing Marks (Auto)</label>
                            <div className="flex items-center justify-between" style={{ ...baseInputStyle, backgroundColor: '#E3DFF8', opacity: 0.8 }}>
                                <span style={{ fontWeight: T.weight.black }}>{derivedPassingMarks}</span>
                            </div>
                            <p style={{ fontSize: '11px', color: C.textMuted, fontWeight: T.weight.medium, margin: 0 }}>Derived from pass % and {totalQuestionMarks} total marks.</p>
                        </div>
                    </div>

                    {/* Audience */}
                    <div className="p-6" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                        <h2 style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading, margin: '0 0 16px 0', borderBottom: `1px solid ${C.cardBorder}`, paddingBottom: '12px' }}>Audience</h2>
                        <div style={{ backgroundColor: '#E3DFF8', padding: '16px', borderRadius: R.xl }}>
                            <AudienceSelector value={examData.audience} onChange={(audience) => setExamData({ ...examData, audience })}
                                availableBatches={availableBatches} availableStudents={availableStudents}
                                allowGlobal={Boolean(!institute?._id || institute?.features?.allowGlobalPublishingByInstituteTutors)}
                                instituteId={institute?._id || null} />
                        </div>
                    </div>

                    {/* Advanced Settings */}
                    <div className="p-6" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                        <h2 style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading, margin: '0 0 16px 0', borderBottom: `1px solid ${C.cardBorder}`, paddingBottom: '12px' }}>Advanced Settings</h2>

                        <SettingRow label="Show Result Immediately" desc="Show score after submission" checked={examData.showResultImmediately} onChange={(v) => setExamData({ ...examData, showResultImmediately: v })} />
                        <SettingRow label="Show Correct Answers" desc="Display answer key in results" checked={examData.showCorrectAnswers} onChange={(v) => setExamData({ ...examData, showCorrectAnswers: v })} />
                        <SettingRow label="Shuffle Questions" desc="Randomize question order" checked={examData.shuffleQuestions} onChange={(v) => setExamData({ ...examData, shuffleQuestions: v })} />
                        <SettingRow label="Shuffle Options" desc="Randomize answer choices" checked={examData.shuffleOptions} onChange={(v) => setExamData({ ...examData, shuffleOptions: v })} />
                        <SettingRow label="Allow Retakes" desc="Enable multiple attempts" checked={examData.allowRetake} onChange={(v) => setExamData({ ...examData, allowRetake: v })} />
                        
                        {examData.allowRetake && (
                            <div className="mb-4 p-4 flex items-center justify-between" style={{ backgroundColor: '#E3DFF8', borderRadius: R.xl }}>
                                <label style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>Max Attempts</label>
                                <input type="number" min="1" value={examData.maxAttempts} onChange={(e) => setExamData({ ...examData, maxAttempts: Number(e.target.value) })}
                                    style={{ ...baseInputStyle, width: '100px', textAlign: 'center', fontWeight: T.weight.black, color: C.btnPrimary }} onFocus={onFocusHandler} onBlur={onBlurHandler} />
                            </div>
                        )}

                        {/* Scheduling */}
                        <div className="mt-6 pt-4" style={{ borderTop: `1px solid ${C.cardBorder}` }}>
                            <label className="flex items-center gap-2 mb-4" style={{ fontSize: T.size.sm, fontWeight: T.weight.black, color: C.heading }}>
                                <Calendar size={16} color={C.btnPrimary} /> Schedule (Optional)
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <span style={{ fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase' }}>Start Date & Time</span>
                                    <input type="datetime-local" value={examData.startDate} onChange={(e) => setExamData({ ...examData, startDate: e.target.value })}
                                        style={baseInputStyle} onFocus={onFocusHandler} onBlur={onBlurHandler} />
                                </div>
                                <div className="space-y-2">
                                    <span style={{ fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase' }}>End Date & Time</span>
                                    <input type="datetime-local" value={examData.endDate} onChange={(e) => setExamData({ ...examData, endDate: e.target.value })}
                                        style={baseInputStyle} onFocus={onFocusHandler} onBlur={onBlurHandler} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Security */}
                    <div className="p-6" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                        <h2 className="flex items-center gap-2" style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.danger, margin: '0 0 16px 0', borderBottom: `1px solid ${C.cardBorder}`, paddingBottom: '12px' }}>
                            <ShieldAlert size={18} color={C.danger} /> Security & Integrity
                        </h2>
                        <SettingRow label="AI Face Detection (Proctoring)" desc="Requires webcam access. Flags suspicious activity." checked={examData.isProctoringEnabled ?? false} onChange={(v) => setExamData({ ...examData, isProctoringEnabled: v })} />
                        <SettingRow label="Strict Tab Tracking" desc="Flag exam heavily upon tab switches or minimizes" checked={examData.strictTabSwitching ?? false} onChange={(v) => setExamData({ ...examData, strictTabSwitching: v })} />
                    </div>

                    <div className="flex justify-end">
                        <button onClick={() => setStep(3)} className="flex items-center justify-center h-12 px-8 gap-2 cursor-pointer border-none transition-opacity hover:opacity-90 shadow-md"
                            style={{ background: C.gradientBtn, color: '#ffffff', borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                            Next: Edit Questions <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* ── STEP 3: Questions ────────────────────────────────────────── */}
            {step === 3 && (
                <div className="max-w-4xl mx-auto space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-5" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                        <div>
                            <h2 className="flex items-center gap-2" style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading, margin: '0 0 4px 0' }}>
                                Review & Edit Questions
                                <span style={{ backgroundColor: C.btnPrimary, color: '#fff', fontSize: '10px', padding: '2px 8px', borderRadius: R.full }}>{examData.questions.length}</span>
                            </h2>
                            <p style={{ fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.textMuted, margin: 0 }}>Modify or add questions to this exam</p>
                        </div>
                        <div className="flex flex-wrap gap-3 w-full sm:w-auto">
                            <button onClick={() => handleAddQuestion('mcq')} className="flex-1 sm:flex-none flex items-center justify-center gap-2 h-10 px-5 cursor-pointer transition-opacity hover:opacity-80"
                                style={{ backgroundColor: '#E3DFF8', color: C.btnPrimary, border: `1px dashed ${C.btnPrimary}`, borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                                <Plus size={14} /> Add MCQ
                            </button>
                            <button onClick={() => handleAddQuestion('subjective')} className="flex-1 sm:flex-none flex items-center justify-center gap-2 h-10 px-5 cursor-pointer transition-opacity hover:opacity-80"
                                style={{ backgroundColor: C.warningBg, color: C.warning, border: `1px dashed ${C.warning}`, borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                                <MessageSquare size={14} /> Add Subjective
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {examData.questions.map((q, qIndex) => {
                            const isSubjective = !q.options || q.options.length === 0;
                            return (
                                <div key={qIndex} className="p-6 transition-all" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-1 space-y-4">
                                            <div className="flex items-center gap-3">
                                                <span className="w-8 h-8 flex items-center justify-center shrink-0" style={{ backgroundColor: C.surfaceWhite, color: C.btnPrimary, fontSize: T.size.sm, fontWeight: T.weight.black, borderRadius: R.full, border: `1px solid ${C.cardBorder}` }}>{qIndex + 1}</span>
                                                <span style={{ fontSize: '10px', fontWeight: T.weight.black, padding: '4px 8px', borderRadius: R.md, textTransform: 'uppercase', backgroundColor: isSubjective ? C.warningBg : C.successBg, color: isSubjective ? C.warning : C.success, border: `1px solid ${isSubjective ? C.warningBorder : C.successBorder}` }}>
                                                    {isSubjective ? 'SUBJECTIVE' : 'MCQ'}
                                                </span>
                                            </div>
                                            <textarea value={q.question} onChange={(e) => handleQuestionChange(qIndex, 'question', e.target.value)}
                                                placeholder="Enter question text" style={{ ...baseInputStyle, resize: 'none', minHeight: '80px', backgroundColor: C.surfaceWhite }} onFocus={onFocusHandler} onBlur={onBlurHandler} />
                                        </div>
                                        <button onClick={() => handleDeleteQuestion(qIndex)} className="w-10 h-10 flex items-center justify-center shrink-0 cursor-pointer border-none transition-opacity hover:opacity-80"
                                            style={{ backgroundColor: C.dangerBg, borderRadius: R.md }}>
                                            <Trash2 size={18} color={C.danger} />
                                        </button>
                                    </div>

                                    <div className="mt-5 pt-5" style={{ borderTop: `1px solid ${C.cardBorder}` }}>
                                        {isSubjective ? (
                                            <div className="space-y-2 p-4" style={{ backgroundColor: '#E3DFF8', borderRadius: R.xl, border: `1px solid ${C.cardBorder}` }}>
                                                <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.heading, textTransform: 'uppercase' }}>Ideal Answer / Rubric</label>
                                                <textarea value={q.idealAnswer || ''} onChange={(e) => handleQuestionChange(qIndex, 'idealAnswer', e.target.value)}
                                                    placeholder="Write the expected answer or grading rubric..." style={{ ...baseInputStyle, resize: 'none', minHeight: '80px', backgroundColor: C.surfaceWhite }} onFocus={onFocusHandler} onBlur={onBlurHandler} />
                                                <p style={{ fontSize: '11px', fontWeight: T.weight.medium, color: C.textMuted, margin: 0 }}>Not shown to students. For manual grading reference only.</p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4" style={{ backgroundColor: '#E3DFF8', borderRadius: R.xl, border: `1px solid ${C.cardBorder}` }}>
                                                {q.options.map((opt, oIndex) => (
                                                    <div key={oIndex} className="flex items-center gap-3 p-3 transition-colors"
                                                        style={{ backgroundColor: opt.isCorrect ? C.successBg : C.surfaceWhite, borderRadius: R.xl, border: `1px solid ${opt.isCorrect ? C.successBorder : C.cardBorder}` }}>
                                                        <input type="radio" name={`correct-${qIndex}`} checked={opt.isCorrect} onChange={() => handleOptionChange(qIndex, oIndex, 'isCorrect', true)}
                                                            style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: C.success }} />
                                                        <input type="text" value={opt.text} onChange={(e) => handleOptionChange(qIndex, oIndex, 'text', e.target.value)}
                                                            placeholder={`Option ${oIndex + 1}`} style={{ flex: 1, backgroundColor: 'transparent', border: 'none', outline: 'none', fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, fontFamily: T.fontFamily }} />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        {examData.questions.length === 0 && (
                            <div className="text-center py-16 flex flex-col items-center" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px dashed ${C.cardBorder}` }}>
                                <FileText size={32} color={C.textMuted} style={{ opacity: 0.3, marginBottom: '12px' }} />
                                <p style={{ fontSize: T.size.md, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 16px 0' }}>No questions yet. Add some!</p>
                                <div className="flex gap-3">
                                    <button onClick={() => handleAddQuestion('mcq')} className="flex items-center justify-center gap-2 h-10 px-5 cursor-pointer transition-opacity hover:opacity-80"
                                        style={{ backgroundColor: '#E3DFF8', color: C.btnPrimary, border: `1px dashed ${C.btnPrimary}`, borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                                        <Plus size={14} /> Add MCQ
                                    </button>
                                    <button onClick={() => handleAddQuestion('subjective')} className="flex items-center justify-center gap-2 h-10 px-5 cursor-pointer transition-opacity hover:opacity-80"
                                        style={{ backgroundColor: C.warningBg, color: C.warning, border: `1px dashed ${C.warning}`, borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                                        <MessageSquare size={14} /> Add Subjective
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Fixed Bottom Action Bar */}
                    <div className="fixed bottom-0 left-0 right-0 z-20 p-4 flex justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)', borderTop: `1px solid ${C.cardBorder}`, boxShadow: '0 -4px 16px rgba(0,0,0,0.04)' }}>
                        <div className="w-full max-w-4xl flex items-center justify-between">
                            <button onClick={() => setStep(2)} className="flex items-center justify-center h-11 px-6 gap-2 cursor-pointer border-none bg-transparent transition-opacity hover:opacity-70"
                                style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                                <ArrowLeft size={16} /> Back
                            </button>
                            <div className="flex gap-3">
                                {examData.status === 'published' ? (
                                    <button onClick={() => handleUpdateExam('draft')} disabled={saving} className="flex items-center justify-center h-11 px-6 gap-2 cursor-pointer transition-opacity hover:opacity-80 shadow-sm"
                                        style={{ backgroundColor: C.surfaceWhite, color: C.textMuted, border: `1px solid ${C.cardBorder}`, borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                                        <EyeOff size={16} /> Unpublish
                                    </button>
                                ) : (
                                    <button onClick={() => handleUpdateExam('published')} disabled={saving || examData.questions.length === 0} className="flex items-center justify-center h-11 px-6 gap-2 cursor-pointer transition-opacity hover:opacity-80 shadow-sm disabled:opacity-50"
                                        style={{ backgroundColor: C.successBg, color: C.success, border: `1px solid ${C.successBorder}`, borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                                        <Eye size={16} /> Publish
                                    </button>
                                )}
                                <button onClick={() => handleUpdateExam()} disabled={saving || examData.questions.length === 0} className="flex items-center justify-center h-11 px-8 gap-2 cursor-pointer border-none transition-opacity hover:opacity-90 disabled:opacity-50 shadow-md"
                                    style={{ background: C.gradientBtn, color: '#ffffff', borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}