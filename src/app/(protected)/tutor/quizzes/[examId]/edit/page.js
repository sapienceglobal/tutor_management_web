'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    MdArrowBack,
    MdHourglassEmpty,
    MdSave,
    MdEdit,
    MdAdd,
    MdDelete,
    MdMessage,
    MdChevronRight,
    MdSettings,
    MdVisibility,
    MdVisibilityOff,
    MdAccessTime,
    MdCalendarMonth,
    MdAutoAwesome,
    MdQuiz,
    MdArticle,
    MdShield,
} from 'react-icons/md';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import AudienceSelector from '@/components/shared/AudienceSelector';
import useInstitute from '@/hooks/useInstitute';
import { C, T, S, R } from '@/constants/studentTokens';
import FeatureGate from '@/components/FeatureGate';

// ─── Focus Handlers ───────────────────────────────────────────────────────────
const onFocusHandler = e => {
    e.target.style.borderColor = C.btnPrimary;
    e.target.style.boxShadow   = '0 0 0 3px rgba(117,115,232,0.10)';
};
const onBlurHandler = e => {
    e.target.style.borderColor = C.cardBorder;
    e.target.style.boxShadow   = 'none';
};

const baseInputStyle = {
    backgroundColor: C.cardBg,
    border:          `1px solid ${C.cardBorder}`,
    borderRadius:    '10px',
    color:           C.heading,
    fontFamily:      T.fontFamily,
    fontSize:        T.size.base,
    fontWeight:      T.weight.medium,
    outline:         'none',
    width:           '100%',
    padding:         '10px 16px',
    transition:      'all 0.2s ease',
};

const sectionCard = {
    backgroundColor: C.cardBg,
    border:          `1px solid ${C.cardBorder}`,
    boxShadow:       S.card,
    borderRadius:    R['2xl'],
};

// ─── Section card header ──────────────────────────────────────────────────────
function CardSectionHeader({ title, icon: Icon, iconColor, right }) {
    return (
        <div
            className="flex items-center justify-between pb-3 mb-4"
            style={{ borderBottom: `1px solid ${C.cardBorder}` }}
        >
            <h2
                className="flex items-center gap-2"
                style={{
                    fontFamily:  T.fontFamily,
                    fontSize:    T.size.lg,
                    fontWeight:  T.weight.semibold,
                    color:       iconColor || C.heading,
                    margin:      0,
                }}
            >
                {Icon && <Icon style={{ width: 18, height: 18, color: iconColor || C.btnPrimary }} />}
                {title}
            </h2>
            {right}
        </div>
    );
}

// ─── Step Tab ─────────────────────────────────────────────────────────────────
function StepTab({ step, currentStep, label, icon: Icon, onClick }) {
    const isActive = currentStep === step;
    return (
        <button
            onClick={() => onClick(step)}
            className="flex flex-1 items-center justify-center gap-2 px-4 py-2 cursor-pointer border-none transition-all"
            style={{
                backgroundColor: isActive ? C.cardBg      : 'transparent',
                color:           isActive ? C.btnPrimary  : C.text,
                borderRadius:    '10px',
                boxShadow:       isActive ? S.card        : 'none',
                fontFamily:      T.fontFamily,
                fontSize:        T.size.base,
                fontWeight:      T.weight.bold,
            }}
        >
            {Icon && <Icon style={{ width: 16, height: 16 }} />}
            <span className="hidden sm:inline">{label}</span>
        </button>
    );
}

// ─── Custom Toggle Switch ─────────────────────────────────────────────────────
function CustomSwitch({ checked, onChange }) {
    return (
        <button
            type="button" role="switch" aria-checked={checked}
            onClick={() => onChange(!checked)}
            style={{
                position:        'relative',
                display:         'inline-flex',
                height:          '24px',
                width:           '44px',
                flexShrink:      0,
                cursor:          'pointer',
                alignItems:      'center',
                borderRadius:    R.full,
                border:          '2px solid transparent',
                transition:      'background-color 300ms ease-in-out',
                backgroundColor: checked ? C.btnPrimary : C.btnViewAllBg,
            }}
        >
            <span
                style={{
                    display:          'inline-block',
                    height:           '20px',
                    width:            '20px',
                    borderRadius:     R.full,
                    backgroundColor:  '#ffffff',
                    transition:       'transform 300ms ease-in-out',
                    transform:        checked ? 'translateX(20px)' : 'translateX(0px)',
                    boxShadow:        '0 1px 3px rgba(0,0,0,0.1)',
                }}
            />
        </button>
    );
}

// ─── Setting Row ──────────────────────────────────────────────────────────────
function SettingRow({ label, desc, checked, onChange }) {
    return (
        <div
            className="flex items-center justify-between p-4 mb-3"
            style={{ backgroundColor: C.innerBg, borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}
        >
            <div>
                <label
                    style={{
                        fontFamily:  T.fontFamily,
                        fontSize:    T.size.base,
                        fontWeight:  T.weight.semibold,
                        color:       C.heading,
                        cursor:      'pointer',
                        display:     'block',
                        margin:      '0 0 2px 0',
                    }}
                >
                    {label}
                </label>
                {desc && (
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.medium, color: C.text, margin: 0 }}>
                        {desc}
                    </p>
                )}
            </div>
            <CustomSwitch checked={checked} onChange={onChange} />
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function EditExamPage({ params }) {
    const { examId }         = use(params);
    const router             = useRouter();
    const { institute }      = useInstitute();

    const [step, setStep]           = useState(2);
    const [loading, setLoading]     = useState(true);
    const [saving, setSaving]       = useState(false);
    const [courses, setCourses]     = useState([]);
    const [availableBatches, setAvailableBatches]   = useState([]);
    const [availableStudents, setAvailableStudents] = useState([]);

    const [examData, setExamData] = useState({
        title: '', courseId: '', duration: 30, passingMarks: 10, passingPercentage: 33,
        description: '', allowRetake: false, maxAttempts: 1,
        showResultImmediately: true, showCorrectAnswers: true,
        shuffleQuestions: false, shuffleOptions: false,
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
                const [coursesRes, examRes] = await Promise.all([
                    api.get('/courses/my-courses'),
                    api.get(`/exams/${examId}`),
                ]);
                if (coursesRes?.data?.success) setCourses(coursesRes.data.courses);
                if (examRes?.data?.success) {
                    const exam = examRes.data.exam;
                    const formatDate = (d) => d ? new Date(d).toISOString().slice(0, 16) : '';
                    setExamData({
                        ...exam,
                        courseId:          exam.courseId._id || exam.courseId,
                        passingPercentage: exam.passingPercentage ?? 33,
                        startDate:         formatDate(exam.startDate),
                        endDate:           formatDate(exam.endDate),
                        questions:         exam.questions.map(q => ({ ...q, points: q.points || 1, explanation: q.explanation || '' })),
                        audience:          exam.audience || {
                            scope:       exam.batchId ? 'batch' : (exam.instituteId ? 'institute' : 'global'),
                            instituteId: exam.instituteId || institute?._id || null,
                            batchIds:    exam.batchId ? [exam.batchId] : [],
                            studentIds:  [],
                        },
                    });
                }
            } catch (error) {
                toast.error('Failed to load exam data.');
                router.push('/tutor/quizzes');
            } finally { setLoading(false); }
        };
        if (examId) fetchInitialData();
    }, [examId, router, institute?._id]);

    useEffect(() => {
        const fetchAudienceTargets = async () => {
            if (!examData.courseId) { setAvailableBatches([]); setAvailableStudents([]); return; }
            try {
                const [batchesRes, studentsRes] = await Promise.all([
                    api.get('/batches'),
                    api.get(`/enrollments/students/${examData.courseId}`),
                ]);
                const batchList   = (batchesRes?.data?.batches || []).filter(b => (b.courseId?._id || b.courseId) === examData.courseId);
                const studentList = (studentsRes?.data?.students || []).map(item => ({ _id: item.studentId?._id, name: item.studentId?.name, email: item.studentId?.email })).filter(i => i._id);
                setAvailableBatches(batchList);
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
            ],
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
                passingMarks:      derivedPassingMarks,
                startDate:         examData.startDate || null,
                endDate:           examData.endDate   || null,
                status:            newStatus || examData.status,
                audience:          { ...examData.audience, instituteId: examData.audience?.instituteId || institute?._id || null },
                scope:             examData.audience?.scope,
                batchId:           examData.audience?.scope === 'batch' ? (examData.audience.batchIds?.[0] || null) : null,
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
        } finally { setSaving(false); }
    };

    // ── Loading ──────────────────────────────────────────────────────────────
    if (loading) return (
        <div
            className="flex flex-col items-center justify-center min-h-screen gap-3 w-full"
            style={{ backgroundColor: C.pageBg, fontFamily: T.fontFamily }}
        >
            <div className="relative w-12 h-12">
                <div
                    className="w-12 h-12 rounded-full border-[3px] animate-spin"
                    style={{ borderColor: `${C.btnPrimary}30`, borderTopColor: C.btnPrimary }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                    <MdAutoAwesome className="animate-pulse" style={{ width: 18, height: 18, color: C.btnPrimary }} />
                </div>
            </div>
            <p style={{ fontFamily: T.fontFamily, color: C.text, fontSize: T.size.base, fontWeight: T.weight.medium }}>
                Loading exam data...
            </p>
        </div>
    );

    return (
        <div
            className="w-full min-h-screen pb-24 space-y-5"
            style={{ backgroundColor: C.pageBg, fontFamily: T.fontFamily, color: C.text }}
        >
            {/* ── Header ──────────────────────────────────────────────────── */}
            <div
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5"
                style={sectionCard}
            >
                <div className="flex items-center gap-3">
                    {/* Back */}
                    <Link href="/tutor/quizzes">
                        <button
                            className="flex items-center justify-center cursor-pointer border-none transition-opacity hover:opacity-80 shrink-0"
                            style={{ width: 40, height: 40, backgroundColor: C.innerBg, borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}
                        >
                            <MdArrowBack style={{ width: 18, height: 18, color: C.heading }} />
                        </button>
                    </Link>

                    {/* Icon Pill */}
                    <div
                        className="flex items-center justify-center rounded-lg shrink-0"
                        style={{ width: 40, height: 40, backgroundColor: C.iconBg }}
                    >
                        <MdQuiz style={{ width: 20, height: 20, color: C.iconColor }} />
                    </div>

                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h1
                                style={{
                                    fontFamily:  T.fontFamily,
                                    color:       C.heading,
                                    fontSize:    T.size['2xl'],
                                    fontWeight:  T.weight.bold,
                                    margin:      0,
                                    lineHeight:  T.leading.tight,
                                }}
                            >
                                Edit Exam
                            </h1>
                            {examData.status && (
                                <span
                                    style={{
                                        fontFamily:      T.fontFamily,
                                        backgroundColor: examData.status === 'published' ? C.successBg    : C.innerBg,
                                        color:           examData.status === 'published' ? C.success       : C.text,
                                        border:          `1px solid ${examData.status === 'published' ? C.successBorder : C.cardBorder}`,
                                        padding:         '2px 8px',
                                        borderRadius:    '10px',
                                        fontSize:        T.size.xs,
                                        fontWeight:      T.weight.bold,
                                        textTransform:   'uppercase',
                                    }}
                                >
                                    {examData.status}
                                </span>
                            )}
                        </div>
                        <p
                            style={{
                                fontFamily:  T.fontFamily,
                                color:       C.text,
                                fontSize:    T.size.base,
                                fontWeight:  T.weight.medium,
                                margin:      0,
                            }}
                        >
                            {step === 2 ? 'Update exam details and settings.' : 'Modify questions and answers.'}
                        </p>
                    </div>
                </div>

                {/* Step Tab Switcher */}
                <div
                    className="flex p-1 w-full sm:w-auto shrink-0"
                    style={{ backgroundColor: C.innerBg, borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}
                >
                    <StepTab step={2} currentStep={step} label="Details"   icon={MdSettings} onClick={setStep} />
                    <StepTab step={3} currentStep={step} label="Questions"  icon={MdArticle}  onClick={setStep} />
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════
                STEP 2: DETAILS
            ══════════════════════════════════════════════════════════════ */}
            {step === 2 && (
                <div className="max-w-3xl mx-auto space-y-5">

                    {/* Basic Info */}
                    <div className="p-6 space-y-5" style={sectionCard}>
                        <CardSectionHeader title="Basic Info" />

                        {/* Course (disabled) */}
                        <div className="space-y-2">
                            <label style={{ display: 'block', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.text, textTransform: 'uppercase', letterSpacing: T.tracking.wider }}>
                                Select Course
                            </label>
                            <select
                                value={examData.courseId}
                                disabled
                                style={{ ...baseInputStyle, cursor: 'not-allowed', opacity: 0.65 }}
                            >
                                <option value="">-- Choose a Course --</option>
                                {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
                            </select>
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.text, fontWeight: T.weight.medium, margin: 0 }}>
                                Course cannot be changed after creation.
                            </p>
                        </div>

                        {/* Title */}
                        <div className="space-y-2">
                            <label style={{ display: 'block', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.text, textTransform: 'uppercase', letterSpacing: T.tracking.wider }}>
                                Exam Title
                            </label>
                            <input
                                value={examData.title}
                                onChange={e => setExamData({ ...examData, title: e.target.value })}
                                placeholder="e.g. Mid-term Assessment"
                                style={baseInputStyle}
                                onFocus={onFocusHandler} onBlur={onBlurHandler}
                            />
                        </div>

                        {/* Duration + Pass % */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label style={{ display: 'block', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.text, textTransform: 'uppercase', letterSpacing: T.tracking.wider }}>
                                    Duration (min)
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={examData.duration}
                                        onChange={e => setExamData({ ...examData, duration: Number(e.target.value) })}
                                        style={{ ...baseInputStyle, paddingRight: '36px' }}
                                        onFocus={onFocusHandler} onBlur={onBlurHandler}
                                    />
                                    <MdAccessTime className="absolute right-3 top-1/2 -translate-y-1/2" style={{ width: 16, height: 16, color: C.text }} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label style={{ display: 'block', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.text, textTransform: 'uppercase', letterSpacing: T.tracking.wider }}>
                                    Pass Percentage
                                </label>
                                <div className="relative">
                                    <input
                                        type="number" min="0" max="100"
                                        value={examData.passingPercentage}
                                        onChange={e => setExamData({ ...examData, passingPercentage: Number(e.target.value) || 0 })}
                                        style={{ ...baseInputStyle, paddingRight: '36px' }}
                                        onFocus={onFocusHandler} onBlur={onBlurHandler}
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2" style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.text }}>%</span>
                                </div>
                            </div>
                        </div>

                        {/* Derived Passing Marks */}
                        <div className="space-y-2">
                            <label style={{ display: 'block', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.text, textTransform: 'uppercase', letterSpacing: T.tracking.wider }}>
                                Passing Marks (Auto)
                            </label>
                            <div
                                className="flex items-center justify-between"
                                style={{ ...baseInputStyle, backgroundColor: C.innerBg, opacity: 0.8 }}
                            >
                                <span style={{ fontFamily: T.fontFamily, fontWeight: T.weight.bold, color: C.heading }}>{derivedPassingMarks}</span>
                            </div>
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.text, fontWeight: T.weight.medium, margin: 0 }}>
                                Derived from pass % and {totalQuestionMarks} total marks.
                            </p>
                        </div>
                    </div>

                    {/* Audience */}
                    <div className="p-6" style={sectionCard}>
                        <CardSectionHeader title="Audience" />
                        <div
                            style={{
                                backgroundColor: C.innerBg,
                                padding:         '16px',
                                borderRadius:    '10px',
                                border:          `1px solid ${C.cardBorder}`,
                            }}
                        >
                            <AudienceSelector
                                value={examData.audience}
                                onChange={audience => setExamData({ ...examData, audience })}
                                availableBatches={availableBatches}
                                availableStudents={availableStudents}
                                allowGlobal={Boolean(!institute?._id || institute?.features?.allowGlobalPublishingByInstituteTutors)}
                                instituteId={institute?._id || null}
                            />
                        </div>
                    </div>

                    {/* Advanced Settings */}
                    <div className="p-6" style={sectionCard}>
                        <CardSectionHeader title="Advanced Settings" />

                        <SettingRow label="Show Result Immediately"   desc="Show score after submission"        checked={examData.showResultImmediately} onChange={v => setExamData({ ...examData, showResultImmediately: v })} />
                        <SettingRow label="Show Correct Answers"      desc="Display answer key in results"      checked={examData.showCorrectAnswers}    onChange={v => setExamData({ ...examData, showCorrectAnswers: v })} />
                        <SettingRow label="Hide Detailed Solutions"   desc="Do not show explanations to students" checked={examData.hideSolutions}       onChange={v => setExamData({ ...examData, hideSolutions: v })} />
                        <SettingRow label="Negative Marking"          desc="Deduct 25% points for incorrect answers" checked={examData.negativeMarking}       onChange={v => setExamData({ ...examData, negativeMarking: v })} />
                        <SettingRow label="Shuffle Questions"          desc="Randomize question order"           checked={examData.shuffleQuestions}      onChange={v => setExamData({ ...examData, shuffleQuestions: v })} />
                        <SettingRow label="Shuffle Options"            desc="Randomize answer choices"           checked={examData.shuffleOptions}        onChange={v => setExamData({ ...examData, shuffleOptions: v })} />
                        <SettingRow label="Allow Retakes"              desc="Enable multiple attempts"           checked={examData.allowRetake}           onChange={v => setExamData({ ...examData, allowRetake: v })} />
                        <SettingRow label="Free Exam"                  desc="Students can attempt without enrollment/payment" checked={examData.isFree}  onChange={v => setExamData({ ...examData, isFree: v })} />

                        {examData.allowRetake && (
                            <div
                                className="mb-3 p-4 flex items-center justify-between"
                                style={{ backgroundColor: C.innerBg, borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}
                            >
                                <label style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.semibold, color: C.heading }}>Max Attempts</label>
                                <input
                                    type="number" min="1"
                                    value={examData.maxAttempts}
                                    onChange={e => setExamData({ ...examData, maxAttempts: Number(e.target.value) })}
                                    style={{ ...baseInputStyle, width: '100px', textAlign: 'center', fontWeight: T.weight.bold, color: C.btnPrimary }}
                                    onFocus={onFocusHandler} onBlur={onBlurHandler}
                                />
                            </div>
                        )}

                        {/* Schedule */}
                        <div className="mt-5 pt-4" style={{ borderTop: `1px solid ${C.cardBorder}` }}>
                            <label
                                className="flex items-center gap-2 mb-4"
                                style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.semibold, color: C.heading }}
                            >
                                <MdCalendarMonth style={{ width: 16, height: 16, color: C.btnPrimary }} />
                                Schedule (Optional)
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <span style={{ display: 'block', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.text, textTransform: 'uppercase', letterSpacing: T.tracking.wider }}>
                                        Start Date & Time
                                    </span>
                                    <input
                                        type="datetime-local"
                                        value={examData.startDate}
                                        onChange={e => setExamData({ ...examData, startDate: e.target.value })}
                                        style={baseInputStyle}
                                        onFocus={onFocusHandler} onBlur={onBlurHandler}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <span style={{ display: 'block', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.text, textTransform: 'uppercase', letterSpacing: T.tracking.wider }}>
                                        End Date & Time
                                    </span>
                                    <input
                                        type="datetime-local"
                                        value={examData.endDate}
                                        onChange={e => setExamData({ ...examData, endDate: e.target.value })}
                                        style={baseInputStyle}
                                        onFocus={onFocusHandler} onBlur={onBlurHandler}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Security */}
                    <FeatureGate featureName="aiAssessment" mode="lock">
                        <div className="p-6" style={sectionCard}>
                            <CardSectionHeader title="Security & Integrity" icon={MdShield} iconColor={C.danger} />
                            <SettingRow label="Visual AI Proctoring" desc="Requires webcam. Flags absence & multiple faces."    checked={examData.isProctoringEnabled ?? false} onChange={v => setExamData({ ...examData, isProctoringEnabled: v })} />
                            <SettingRow label="Audio & Gaze Proctoring" desc="Requires mic. Flags noise & looking away/down." checked={examData.isAudioProctoringEnabled ?? false} onChange={v => setExamData({ ...examData, isAudioProctoringEnabled: v })} />
                            <SettingRow label="Strict Environment Lock"             desc="Aggressively tracks and flags tab switching."      checked={examData.strictTabSwitching  ?? false} onChange={v => setExamData({ ...examData, strictTabSwitching: v })} />
                        </div>
                    </FeatureGate>

                    {/* Next */}
                    <div className="flex justify-end">
                        <button
                            onClick={() => setStep(3)}
                            className="flex items-center justify-center h-12 px-8 gap-2 cursor-pointer border-none transition-opacity hover:opacity-90"
                            style={{ background: C.gradientBtn, color: '#ffffff', borderRadius: '10px', boxShadow: S.btn, fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold }}
                        >
                            Next: Edit Questions <MdChevronRight style={{ width: 18, height: 18 }} />
                        </button>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                STEP 3: QUESTIONS
            ══════════════════════════════════════════════════════════════ */}
            {step === 3 && (
                <div className="max-w-4xl mx-auto space-y-5">

                    {/* Questions Header */}
                    <div
                        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-5"
                        style={sectionCard}
                    >
                        <div>
                            <h2
                                className="flex items-center gap-2"
                                style={{ fontFamily: T.fontFamily, fontSize: T.size.xl, fontWeight: T.weight.semibold, color: C.heading, margin: '0 0 4px 0' }}
                            >
                                Review & Edit Questions
                                <span
                                    style={{
                                        backgroundColor: C.btnPrimary,
                                        color:           '#fff',
                                        fontFamily:      T.fontFamily,
                                        fontSize:        T.size.xs,
                                        fontWeight:      T.weight.bold,
                                        padding:         '2px 8px',
                                        borderRadius:    '10px',
                                    }}
                                >
                                    {examData.questions.length}
                                </span>
                            </h2>
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.text, margin: 0 }}>
                                Modify or add questions to this exam
                            </p>
                        </div>

                        {/* Add Question Buttons */}
                        <div className="flex flex-wrap gap-3 w-full sm:w-auto">
                            <button
                                onClick={() => handleAddQuestion('mcq')}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-2 h-10 px-5 cursor-pointer border-none transition-opacity hover:opacity-80 border-2 border-dashed"
                                style={{ backgroundColor: C.innerBg, color: C.btnPrimary, borderColor: C.btnPrimary, borderRadius: '10px', fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold }}
                            >
                                <MdAdd style={{ width: 16, height: 16 }} /> Add MCQ
                            </button>
                            <button
                                onClick={() => handleAddQuestion('subjective')}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-2 h-10 px-5 cursor-pointer border-none transition-opacity hover:opacity-80 border-2 border-dashed"
                                style={{ backgroundColor: C.warningBg, color: C.warning, borderColor: C.warning, borderRadius: '10px', fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold }}
                            >
                                <MdMessage style={{ width: 16, height: 16 }} /> Add Subjective
                            </button>
                        </div>
                    </div>

                    {/* Question Cards */}
                    <div className="space-y-4">
                        {examData.questions.map((q, qIndex) => {
                            const isSubjective = !q.options || q.options.length === 0;
                            return (
                                <div key={qIndex} className="p-5 transition-all" style={sectionCard}>
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-1 space-y-4">
                                            {/* Q Number + Type Badge */}
                                            <div className="flex items-center gap-3">
                                                <span
                                                    className="flex items-center justify-center shrink-0"
                                                    style={{
                                                        width:           32,
                                                        height:          32,
                                                        backgroundColor: C.innerBg,
                                                        color:           C.btnPrimary,
                                                        fontFamily:      T.fontFamily,
                                                        fontSize:        T.size.base,
                                                        fontWeight:      T.weight.bold,
                                                        borderRadius:    '10px',
                                                        border:          `1px solid ${C.cardBorder}`,
                                                    }}
                                                >
                                                    {qIndex + 1}
                                                </span>
                                                <span
                                                    style={{
                                                        fontFamily:      T.fontFamily,
                                                        fontSize:        T.size.xs,
                                                        fontWeight:      T.weight.bold,
                                                        padding:         '4px 8px',
                                                        borderRadius:    '10px',
                                                        textTransform:   'uppercase',
                                                        backgroundColor: isSubjective ? C.warningBg  : C.successBg,
                                                        color:           isSubjective ? C.warning    : C.success,
                                                        border:          `1px solid ${isSubjective ? C.warningBorder : C.successBorder}`,
                                                    }}
                                                >
                                                    {isSubjective ? 'SUBJECTIVE' : 'MCQ'}
                                                </span>
                                            </div>

                                            {/* Question Text */}
                                            <textarea
                                                value={q.question}
                                                onChange={e => handleQuestionChange(qIndex, 'question', e.target.value)}
                                                placeholder="Enter question text"
                                                style={{ ...baseInputStyle, resize: 'none', minHeight: '80px' }}
                                                onFocus={onFocusHandler} onBlur={onBlurHandler}
                                            />
                                        </div>

                                        {/* Delete */}
                                        <button
                                            onClick={() => handleDeleteQuestion(qIndex)}
                                            className="flex items-center justify-center shrink-0 cursor-pointer border-none transition-opacity hover:opacity-80"
                                            style={{ width: 40, height: 40, backgroundColor: C.dangerBg, borderRadius: '10px' }}
                                        >
                                            <MdDelete style={{ width: 18, height: 18, color: C.danger }} />
                                        </button>
                                    </div>

                                    {/* Options / Ideal Answer */}
                                    <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${C.cardBorder}` }}>
                                        {isSubjective ? (
                                            <div
                                                className="space-y-2 p-4"
                                                style={{ backgroundColor: C.innerBg, borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}
                                            >
                                                <label style={{ display: 'block', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.text, textTransform: 'uppercase', letterSpacing: T.tracking.wider }}>
                                                    Ideal Answer / Rubric
                                                </label>
                                                <textarea
                                                    value={q.idealAnswer || ''}
                                                    onChange={e => handleQuestionChange(qIndex, 'idealAnswer', e.target.value)}
                                                    placeholder="Write the expected answer or grading rubric..."
                                                    style={{ ...baseInputStyle, resize: 'none', minHeight: '80px' }}
                                                    onFocus={onFocusHandler} onBlur={onBlurHandler}
                                                />
                                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.medium, color: C.text, margin: 0 }}>
                                                    Not shown to students. For manual grading reference only.
                                                </p>
                                            </div>
                                        ) : (
                                            <div
                                                className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4"
                                                style={{ backgroundColor: C.innerBg, borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}
                                            >
                                                {q.options.map((opt, oIndex) => (
                                                    <div
                                                        key={oIndex}
                                                        className="flex items-center gap-3 p-3 transition-colors"
                                                        style={{
                                                            backgroundColor: opt.isCorrect ? C.successBg : C.cardBg,
                                                            borderRadius:    '10px',
                                                            border:          `1px solid ${opt.isCorrect ? C.successBorder : C.cardBorder}`,
                                                        }}
                                                    >
                                                        <input
                                                            type="radio"
                                                            name={`correct-${qIndex}`}
                                                            checked={opt.isCorrect}
                                                            onChange={() => handleOptionChange(qIndex, oIndex, 'isCorrect', true)}
                                                            style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: C.success }}
                                                        />
                                                        <input
                                                            type="text"
                                                            value={opt.text}
                                                            onChange={e => handleOptionChange(qIndex, oIndex, 'text', e.target.value)}
                                                            placeholder={`Option ${oIndex + 1}`}
                                                            style={{
                                                                flex:            1,
                                                                backgroundColor: 'transparent',
                                                                border:          'none',
                                                                outline:         'none',
                                                                fontFamily:      T.fontFamily,
                                                                fontSize:        T.size.base,
                                                                fontWeight:      T.weight.semibold,
                                                                color:           C.heading,
                                                            }}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        {/* Empty state */}
                        {examData.questions.length === 0 && (
                            <div
                                className="text-center py-16 flex flex-col items-center border border-dashed"
                                style={{ backgroundColor: C.cardBg, borderColor: C.cardBorder, borderRadius: R['2xl'] }}
                            >
                                <div
                                    className="flex items-center justify-center mb-4"
                                    style={{ width: 56, height: 56, backgroundColor: C.innerBg, borderRadius: R.lg }}
                                >
                                    <MdArticle style={{ width: 28, height: 28, color: C.text, opacity: 0.3 }} />
                                </div>
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 16px 0' }}>
                                    No questions yet. Add some!
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => handleAddQuestion('mcq')}
                                        className="flex items-center justify-center gap-2 h-10 px-5 cursor-pointer border-none transition-opacity hover:opacity-80 border-2 border-dashed"
                                        style={{ backgroundColor: C.innerBg, color: C.btnPrimary, borderColor: C.btnPrimary, borderRadius: '10px', fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold }}
                                    >
                                        <MdAdd style={{ width: 14, height: 14 }} /> Add MCQ
                                    </button>
                                    <button
                                        onClick={() => handleAddQuestion('subjective')}
                                        className="flex items-center justify-center gap-2 h-10 px-5 cursor-pointer border-none transition-opacity hover:opacity-80 border-2 border-dashed"
                                        style={{ backgroundColor: C.warningBg, color: C.warning, borderColor: C.warning, borderRadius: '10px', fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold }}
                                    >
                                        <MdMessage style={{ width: 14, height: 14 }} /> Add Subjective
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── Fixed Bottom Action Bar ──────────────────────────── */}
                    <div
                        className="fixed bottom-0 left-0 right-0 z-20 p-4 flex justify-center"
                        style={{
                            backgroundColor: 'rgba(255,255,255,0.95)',
                            backdropFilter:  'blur(8px)',
                            borderTop:       `1px solid ${C.cardBorder}`,
                            boxShadow:       '0 -4px 16px rgba(0,0,0,0.04)',
                        }}
                    >
                        <div className="w-full max-w-4xl flex items-center justify-between">
                            {/* Back */}
                            <button
                                onClick={() => setStep(2)}
                                className="flex items-center justify-center h-11 px-6 gap-2 cursor-pointer border-none bg-transparent transition-opacity hover:opacity-70"
                                style={{ fontFamily: T.fontFamily, color: C.text, fontSize: T.size.base, fontWeight: T.weight.bold }}
                            >
                                <MdArrowBack style={{ width: 16, height: 16 }} /> Back
                            </button>

                            <div className="flex gap-3">
                                {/* Publish / Unpublish */}
                                {examData.status === 'published' ? (
                                    <button
                                        onClick={() => handleUpdateExam('draft')}
                                        disabled={saving}
                                        className="flex items-center justify-center h-11 px-6 gap-2 cursor-pointer border-none transition-opacity hover:opacity-80"
                                        style={{ backgroundColor: C.innerBg, color: C.text, border: `1px solid ${C.cardBorder}`, borderRadius: '10px', fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold }}
                                    >
                                        <MdVisibilityOff style={{ width: 16, height: 16 }} /> Unpublish
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleUpdateExam('published')}
                                        disabled={saving || examData.questions.length === 0}
                                        className="flex items-center justify-center h-11 px-6 gap-2 cursor-pointer border-none transition-opacity hover:opacity-80 disabled:opacity-50"
                                        style={{ backgroundColor: C.successBg, color: C.success, border: `1px solid ${C.successBorder}`, borderRadius: '10px', fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold }}
                                    >
                                        <MdVisibility style={{ width: 16, height: 16 }} /> Publish
                                    </button>
                                )}

                                {/* Save */}
                                <button
                                    onClick={() => handleUpdateExam()}
                                    disabled={saving || examData.questions.length === 0}
                                    className="flex items-center justify-center h-11 px-8 gap-2 cursor-pointer border-none transition-opacity hover:opacity-90 disabled:opacity-50"
                                    style={{ background: C.gradientBtn, color: '#ffffff', borderRadius: '10px', boxShadow: S.btn, fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold }}
                                >
                                    {saving
                                        ? <MdHourglassEmpty style={{ width: 16, height: 16 }} className="animate-spin" />
                                        : <MdSave style={{ width: 16, height: 16 }} />
                                    }
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}