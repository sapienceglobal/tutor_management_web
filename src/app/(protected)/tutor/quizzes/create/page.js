'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    MdArrowBack,
    MdFormatBold,
    MdFormatItalic,
    MdFormatUnderlined,
    MdFormatListBulleted,
    MdFormatListNumbered,
    MdImage,
    MdLink,
    MdCheckCircle,
    MdWarning,
    MdAdd,
    MdDelete,
    MdEdit,
    MdPsychology,
    MdClose,
    MdCheck,
    MdCalendarMonth,
    MdAccessTime,
    MdSettings,
    MdChevronRight,
    MdSave,
    MdAutoAwesome,
    MdGridView,
    MdTitle,
    MdUpload,
    MdLibraryBooks,
    MdSearch,
    MdMic,
    MdShield,
    MdHelp,
    MdVisibility,
} from 'react-icons/md';
import { Modal } from '@/components/ui/modal';
import api from '@/lib/axios';
import { sanitizeHtml } from '@/lib/sanitize';
import { useConfirm } from '@/components/providers/ConfirmProvider';
import { toast } from 'react-hot-toast';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import AudienceSelector from '@/components/shared/AudienceSelector';
import useInstitute from '@/hooks/useInstitute';
import { C, T, S, R } from '@/constants/studentTokens';
import FeatureGate from '@/components/FeatureGate';

const examDetailsSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    courseId: z.string().min(1, 'Please select a course/category'),
    type: z.string(),
    duration: z.number().min(1, 'Duration must be at least 1 minute'),
    passingMarks: z.number().min(0),
    description: z.string().optional(),
});

// ─── Focus Handlers ───────────────────────────────────────────────────────────
const onFocusHandler = e => {
    e.target.style.borderColor = C.btnPrimary;
    e.target.style.boxShadow = `0 0 0 3px ${C.btnPrimary}15`;
};
const onBlurHandler = e => {
    e.target.style.borderColor = C.cardBorder;
    e.target.style.boxShadow = 'none';
};

// ─── Base Input Style — directive 13 ─────────────────────────────────────────
const baseInputStyle = {
    backgroundColor: C.cardBg,
    border: `1px solid ${C.cardBorder}`,
    borderRadius: '10px',
    color: C.heading,
    fontFamily: T.fontFamily,
    fontSize: T.size.base,
    fontWeight: T.weight.semibold,
    outline: 'none',
    width: '100%',
    padding: '12px 16px',
    transition: 'all 0.2s ease',
};

// ─── Custom Switch ────────────────────────────────────────────────────────────
const CustomSwitch = ({ checked, onChange }) => (
    <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        style={{
            position: 'relative',
            display: 'inline-flex',
            height: 24,
            width: 44,
            flexShrink: 0,
            cursor: 'pointer',
            alignItems: 'center',
            borderRadius: R.full,
            border: '2px solid transparent',
            transition: 'background-color 300ms ease-in-out',
            backgroundColor: checked ? C.btnPrimary : C.btnViewAllBg,
        }}
    >
        <span
            style={{
                display: 'inline-block',
                height: 20,
                width: 20,
                borderRadius: R.full,
                backgroundColor: '#ffffff',
                transition: 'transform 300ms ease-in-out',
                transform: checked ? 'translateX(20px)' : 'translateX(0px)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
        />
    </button>
);

// ─── Wizard Steps ─────────────────────────────────────────────────────────────
const WizardSteps = ({ currentStep, steps, onStepClick }) => (
    <div className="flex items-center justify-center w-full mb-10 mt-4">
        <div
            className="flex items-center gap-2 md:gap-3 relative z-10 px-6 py-3"
            style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], boxShadow: S.card }}
        >
            {steps.map((step, idx) => {
                const isActive    = currentStep === step.id;
                const isCompleted = steps.findIndex(s => s.id === currentStep) > idx;
                const isClickable = steps.findIndex(s => s.id === currentStep) >= idx;
                return (
                    <div key={step.id} className="flex items-center">
                        <button
                            onClick={() => isClickable && onStepClick(step.id)}
                            disabled={!isClickable}
                            className="flex items-center gap-2.5 px-4 py-2.5 transition-all duration-300"
                            style={{
                                background: isActive ? C.gradientBtn : isCompleted ? C.btnViewAllBg : 'transparent',
                                borderRadius: '10px',
                                color: isActive ? '#fff' : isCompleted ? C.heading : C.text,
                                transform: isActive ? 'scale(1.05)' : 'scale(1)',
                                boxShadow: isActive ? S.btn : 'none',
                                border: 'none',
                                cursor: isClickable ? 'pointer' : 'default',
                            }}
                        >
                            <div
                                className="flex items-center justify-center shrink-0"
                                style={{
                                    width: 24, height: 24,
                                    borderRadius: R.full,
                                    backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : isCompleted ? C.cardBg : C.innerBg,
                                    color: isActive ? '#fff' : isCompleted ? C.btnPrimary : C.text,
                                    fontFamily: T.fontFamily,
                                    fontSize: T.size.xs,
                                    fontWeight: T.weight.bold,
                                }}
                            >
                                {isCompleted ? <MdCheck style={{ width: 14, height: 14 }} /> : idx + 1}
                            </div>
                            <span
                                className="hidden md:inline-block"
                                style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold }}
                            >
                                {step.label}
                            </span>
                        </button>
                        {idx < steps.length - 1 && (
                            <div className="mx-2" style={{ width: 24, height: 2, backgroundColor: isCompleted ? C.btnPrimary : C.innerBg }} />
                        )}
                    </div>
                );
            })}
        </div>
    </div>
);

// ─── Rich Text Editor ─────────────────────────────────────────────────────────
const RichTextEditor = ({ value, onChange }) => {
    const editorRef = useRef(null);
    const execCommand = (command, val = null) => {
        document.execCommand(command, false, val);
        editorRef.current?.focus();
    };
    const handleInput = () => { if (editorRef.current) onChange(editorRef.current.innerHTML); };
    useEffect(() => {
        if (editorRef.current && value && editorRef.current.innerHTML === '') {
            editorRef.current.innerHTML = value;
        }
    }, [value]);

    return (
        <div style={{ backgroundColor: C.innerBg, borderRadius: '10px', overflow: 'hidden', border: `1px solid ${C.cardBorder}` }}>
            <div className="flex items-center gap-1 p-2" style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                {[['bold', MdFormatBold], ['italic', MdFormatItalic], ['underline', MdFormatUnderlined]].map(([cmd, Icon]) => (
                    <button
                        key={cmd}
                        onClick={() => execCommand(cmd)}
                        className="flex items-center justify-center cursor-pointer hover:opacity-70 transition-all"
                        style={{ padding: 6, borderRadius: '10px', border: 'none', backgroundColor: 'transparent' }}
                    >
                        <Icon style={{ width: 16, height: 16, color: C.heading }} />
                    </button>
                ))}
                <div className="mx-2" style={{ width: 1, height: 16, backgroundColor: C.cardBorder }} />
                <button onClick={() => execCommand('insertUnorderedList')} className="flex items-center justify-center cursor-pointer hover:opacity-70 transition-all"
                    style={{ padding: 6, borderRadius: '10px', border: 'none', backgroundColor: 'transparent' }}>
                    <MdFormatListBulleted style={{ width: 16, height: 16, color: C.heading }} />
                </button>
                <button onClick={() => execCommand('insertOrderedList')} className="flex items-center justify-center cursor-pointer hover:opacity-70 transition-all"
                    style={{ padding: 6, borderRadius: '10px', border: 'none', backgroundColor: 'transparent' }}>
                    <MdFormatListNumbered style={{ width: 16, height: 16, color: C.heading }} />
                </button>
            </div>
            <div
                ref={editorRef}
                contentEditable
                onInput={handleInput}
                style={{ minHeight: 160, padding: 20, outline: 'none', color: C.text, fontFamily: T.fontFamily, fontSize: T.size.base }}
            />
        </div>
    );
};

// ─── Step Card ────────────────────────────────────────────────────────────────
const StepCard = ({ children }) => (
    <div style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, borderRadius: R['2xl'], padding: 32, boxShadow: S.card }}>
        {children}
    </div>
);

// ─── Toggle Row ───────────────────────────────────────────────────────────────
const ToggleRow = ({ label, desc, keyName, icon: Icon, examData, setExamData }) => (
    <div
        className="flex items-center justify-between"
        style={{ backgroundColor: C.innerBg, borderRadius: '10px', padding: 16 }}
    >
        <div className="flex gap-4 items-center">
            {Icon && (
                <div
                    className="flex items-center justify-center shrink-0"
                    style={{ width: 40, height: 40, backgroundColor: C.cardBg, borderRadius: '10px' }}
                >
                    <Icon style={{ width: 20, height: 20, color: C.btnPrimary }} />
                </div>
            )}
            <div className="space-y-1">
                <label style={{ fontFamily: T.fontFamily, fontSize: T.size.md, fontWeight: T.weight.bold, color: C.heading, cursor: 'pointer', display: 'block' }}>
                    {label}
                </label>
                {desc && (
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.medium, color: C.text, margin: 0 }}>
                        {desc}
                    </p>
                )}
            </div>
        </div>
        <CustomSwitch checked={examData[keyName]} onChange={val => setExamData({ ...examData, [keyName]: val })} />
    </div>
);

// ─── Main Client Component ────────────────────────────────────────────────────
function CreateExamPageClient() {
    const router      = useRouter();
    const searchParams = useSearchParams();
    const defaultType  = searchParams?.get('type') || 'quiz';
    const { institute } = useInstitute();

    const [loading, setLoading]   = useState(false);
    const [saving, setSaving]     = useState(false);
    const [activeTab, setActiveTab] = useState('details');
    const [examId, setExamId]     = useState(null);
    const { confirmDialog }       = useConfirm();

    const [courses, setCourses]                     = useState([]);
    const [availableBatches, setAvailableBatches]   = useState([]);
    const [availableStudents, setAvailableStudents] = useState([]);
    const [topics, setTopics]   = useState([]);
    const [skills, setSkills]   = useState([]);

    const [examData, setExamData] = useState({
        title: '', courseId: '', type: defaultType, isFree: true, description: '',
        isPublic: true, duration: 30, passingMarks: 10, questions: [],
        shuffleQuestions: false, shuffleOptions: false, showResultImmediately: true,
        showCorrectAnswers: true, allowRetake: false, maxAttempts: 1, passingPercentage: 50,
        disableFinishButton: false, enableQuestionListView: true, hideSolutions: false,
        negativeMarking: false, isProctoringEnabled: false,
        isAudioProctoringEnabled: false, strictTabSwitching: false,
        isScheduled: false, startDate: '', endDate: '',
        audience: { scope: 'institute', instituteId: null, batchIds: [], studentIds: [] },
    });

    const [errors, setErrors] = useState({});
    const totalQuestionMarks = (examData?.questions || []).reduce((sum, q) => sum + (q?.points || 1), 0);
    const derivedPassingMarks = totalQuestionMarks > 0
        ? Number((((Number(examData?.passingPercentage) || 0) / 100) * totalQuestionMarks).toFixed(2))
        : 0;

    const [isAddOpen, setIsAddOpen]     = useState(false);
    const [isAIOpen, setIsAIOpen]       = useState(false);
    const [editingIndex, setEditingIndex] = useState(-1);
    const [currentQuestion, setCurrentQuestion] = useState({
        question: '',
        options: [
            { text: '', isCorrect: false },
            { text: '', isCorrect: false },
            { text: '', isCorrect: false },
            { text: '', isCorrect: false },
        ],
        explanation: '', points: 1, difficulty: 'medium',
    });
    const [aiParams, setAiParams]     = useState({ topic: '', count: 5, difficulty: 'medium' });
    const [aiLoading, setAiLoading]   = useState(false);
    const [isBankOpen, setIsBankOpen] = useState(false);
    const [bankQuestions, setBankQuestions]   = useState([]);
    const [bankLoading, setBankLoading]       = useState(false);
    const [bankFilters, setBankFilters]       = useState({ topicId: 'all', skillId: 'all', difficulty: 'all' });
    const [selectedBankIds, setSelectedBankIds] = useState([]);

    const handleAddOption    = () => { if (currentQuestion?.options?.length < 6) setCurrentQuestion({ ...currentQuestion, options: [...currentQuestion.options, { text: '', isCorrect: false }] }); };
    const handleRemoveOption = (idx) => { if (currentQuestion?.options?.length > 2) setCurrentQuestion({ ...currentQuestion, options: currentQuestion.options.filter((_, i) => i !== idx) }); };
    const handleOptionChange = (idx, val) => { const newOps = [...currentQuestion.options]; newOps[idx].text = val; setCurrentQuestion({ ...currentQuestion, options: newOps }); };
    const handleCorrectSelect = (idx) => { setCurrentQuestion({ ...currentQuestion, options: currentQuestion.options.map((op, i) => ({ ...op, isCorrect: i === idx })) }); };

    const handleSaveQuestion = () => {
        if (!currentQuestion?.question || currentQuestion.question === '<br>') { toast.error('Question text is required'); return; }
        if (currentQuestion.options.some(o => !o.text.trim())) { toast.error('All options must have text'); return; }
        if (!currentQuestion.options.some(o => o.isCorrect)) { toast.error('Select a correct answer'); return; }
        const newQuestions = [...examData.questions];
        if (editingIndex >= 0) newQuestions[editingIndex] = currentQuestion;
        else newQuestions.push(currentQuestion);
        setExamData({ ...examData, questions: newQuestions });
        setIsAddOpen(false); resetQuestionForm();
        toast.success(editingIndex >= 0 ? 'Question updated' : 'Question added');
    };
    const handleEditQuestion = (idx) => { setEditingIndex(idx); setCurrentQuestion(JSON.parse(JSON.stringify(examData.questions[idx]))); setIsAddOpen(true); };
    const handleDeleteQuestion = async (idx) => {
        const ok = await confirmDialog('Delete Question', 'Are you sure you want to delete this question?', { variant: 'destructive' });
        if (ok) { setExamData({ ...examData, questions: examData.questions.filter((_, i) => i !== idx) }); toast.success('Question deleted'); }
    };
    const resetQuestionForm = () => {
        setEditingIndex(-1);
        setCurrentQuestion({ question: '', options: [{ text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }], explanation: '', points: 1, difficulty: 'medium' });
    };
    const handleAIGenerate = async () => {
        if (!aiParams?.topic) { toast.error('Please enter a topic'); return; }
        setAiLoading(true);
        try {
            const res = await api.post('/ai/generate-questions', aiParams);
            if (res?.data?.success) {
                const newQs = res.data.questions.map(q => ({ question: q.question, options: q.options.map(opt => ({ text: opt, isCorrect: opt === q.correctAnswer })), explanation: q.explanation, points: 1, difficulty: q.difficulty.toLowerCase() }));
                setExamData(prev => ({ ...prev, questions: [...prev.questions, ...newQs] }));
                setIsAIOpen(false); toast.success(`Generated ${newQs.length} questions!`);
            }
        } catch { toast.error('Failed to generate questions. Try a different topic.'); }
        finally { setAiLoading(false); }
    };

    useEffect(() => {
        const fetchCourses = async () => { try { const res = await api.get('/courses/my-courses'); if (res?.data?.success) setCourses(res.data.courses); } catch { toast.error('Failed to load courses'); } };
        const fetchTaxonomy = async () => {
            try {
                const [topicsRes, skillsRes] = await Promise.all([api.get('/taxonomy/topics'), api.get('/taxonomy/skills')]);
                if (topicsRes?.data?.success) setTopics(topicsRes.data.topics);
                if (skillsRes?.data?.success) setSkills(skillsRes.data.skills);
            } catch { }
        };
        fetchCourses(); fetchTaxonomy();
    }, []);

    useEffect(() => { setExamData(prev => ({ ...prev, audience: { ...prev.audience, instituteId: prev.audience?.instituteId || institute?._id || null } })); }, [institute?._id]);

    useEffect(() => {
        const fetchAudienceTargets = async () => {
            if (!examData?.courseId) { setAvailableBatches([]); setAvailableStudents([]); return; }
            try {
                const [batchesRes, studentsRes] = await Promise.all([api.get('/batches'), api.get(`/enrollments/students/${examData.courseId}`)]);
                const batchList = (batchesRes?.data?.batches || []).filter(b => (b.courseId?._id || b.courseId) === examData.courseId);
                setAvailableBatches(batchList);
                const studentList = (studentsRes?.data?.students || []).map(item => ({ _id: item.studentId?._id, name: item.studentId?.name, email: item.studentId?.email })).filter(item => item._id);
                setAvailableStudents(studentList);
            } catch { setAvailableBatches([]); setAvailableStudents([]); }
        };
        fetchAudienceTargets();
    }, [examData.courseId]);

    const fetchBankQuestions = async () => {
        setBankLoading(true);
        try {
            const params = new URLSearchParams();
            if (bankFilters?.difficulty !== 'all') params.append('difficulty', bankFilters.difficulty);
            if (bankFilters?.topicId !== 'all') params.append('topicId', bankFilters.topicId);
            const res = await api.get(`/question-bank/questions?${params.toString()}`);
            if (res?.data?.success) setBankQuestions(res.data.questions);
        } catch { toast.error('Failed to load bank questions'); }
        finally { setBankLoading(false); }
    };
    useEffect(() => { if (isBankOpen) fetchBankQuestions(); }, [isBankOpen, bankFilters]);

    const handleImportFromBank = () => {
        if (selectedBankIds.length === 0) { toast.error('Select at least one question to import'); return; }
        const questionsToImport = bankQuestions.filter(q => selectedBankIds.includes(q._id));
        const mappedQuestions = questionsToImport.map(q => ({ question: q.question, options: q.type === 'mcq' ? q.options : [], type: q.type, explanation: q.explanation || '', points: q.points || 1, difficulty: q.difficulty || 'medium' }));
        setExamData(prev => ({ ...prev, questions: [...prev.questions, ...mappedQuestions] }));
        setIsBankOpen(false); setSelectedBankIds([]); toast.success(`Imported ${mappedQuestions.length} questions from bank!`);
    };

    const validateForm = () => {
        const result = examDetailsSchema.safeParse(examData);
        if (!result.success) {
            const fieldErrors = result.error.flatten().fieldErrors;
            setErrors(fieldErrors);
            const firstError = Object.values(fieldErrors)[0]?.[0];
            if (firstError) toast.error(firstError);
            return false;
        }
        setErrors({}); return true;
    };

    const handleSaveAndProceed = async (options = {}) => {
        const { status = 'draft', shouldRedirect = false } = options && options.preventDefault ? {} : options;
        if (!validateForm()) return;
        setSaving(true);
        try {
            const safePassingPercentage = Number(examData.passingPercentage) || 0;
            const safeAudience = { ...examData.audience, instituteId: examData.audience?.instituteId || institute?._id || null };
            const payload = { ...examData, passingPercentage: safePassingPercentage, passingMarks: derivedPassingMarks, status, audience: safeAudience, scope: safeAudience.scope, batchId: safeAudience.scope === 'batch' ? (safeAudience.batchIds?.[0] || null) : null };
            let response;
            if (examId) response = await api.patch(`/exams/${examId}`, payload);
            else response = await api.post('/exams', payload);
            if (response?.data?.success) {
                const savedExam = response.data.exam;
                setExamId(savedExam._id);
                toast.success(status === 'published' ? 'Assessment published successfully!' : 'Changes saved!');
                if (shouldRedirect) router.push('/tutor/quizzes');
                else {
                    if (activeTab === 'details') setActiveTab('settings');
                    else if (activeTab === 'settings') setActiveTab('questions');
                    else if (activeTab === 'questions') setActiveTab('schedules');
                }
            }
        } catch (error) { toast.error(error?.response?.data?.message || 'Failed to save exam'); }
        finally { setSaving(false); }
    };

    const variants = {
        enter:  { opacity: 0, y: 15 },
        center: { zIndex: 1, y: 0, opacity: 1 },
        exit:   { opacity: 0, y: -15, zIndex: 0 },
    };

    const steps = [
        { id: 'details',   label: 'Basic Details' },
        { id: 'settings',  label: 'Configuration' },
        { id: 'questions', label: 'Questions Setup' },
        { id: 'schedules', label: 'Availability' },
    ];

    const handleStepChange = (newStep) => {
        if (newStep === 'settings' && !examData?.title) { toast.error('Please enter a title first'); return; }
        setActiveTab(newStep);
    };

    // Helper — shared toggle row that captures examData from scope
    const TR = ({ label, desc, keyName, icon }) => (
        <ToggleRow label={label} desc={desc} keyName={keyName} icon={icon} examData={examData} setExamData={setExamData} />
    );

    return (
        <div className="min-h-screen pb-20 w-full" style={{ backgroundColor: C.pageBg, fontFamily: T.fontFamily, color: C.text }}>

            {/* ── Sticky Header ── */}
            <div
                className="sticky top-0 z-50 px-6 h-[72px] flex items-center justify-between"
                style={{ backgroundColor: C.cardBg, borderBottom: `1px solid ${C.cardBorder}`, boxShadow: S.card }}
            >
                <div className="flex items-center gap-4">
                    <Link href="/tutor/quizzes">
                        <button
                            className="flex items-center justify-center cursor-pointer transition-all hover:opacity-80"
                            style={{ width: 40, height: 40, borderRadius: '10px', backgroundColor: C.innerBg, border: 'none' }}
                        >
                            <MdArrowBack style={{ width: 18, height: 18, color: C.heading }} />
                        </button>
                    </Link>
                    <div>
                        <h1 style={{ fontFamily: T.fontFamily, fontSize: T.size.xl, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>
                            {examId ? 'Edit Assessment' : 'Create New Assessment'}
                        </h1>
                        <p className="hidden sm:block" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.text, textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
                            Configuration Wizard
                        </p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        className="hidden sm:flex items-center cursor-pointer transition-all hover:opacity-80"
                        onClick={() => handleSaveAndProceed({ status: 'draft', shouldRedirect: true })}
                        style={{ backgroundColor: C.btnViewAllBg, color: C.btnViewAllText, border: `1px solid ${C.cardBorder}`, borderRadius: '10px', fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, padding: '0 20px', height: 40 }}
                    >
                        Save Draft
                    </button>
                    <button
                        onClick={() => handleSaveAndProceed({ status: 'draft' })}
                        disabled={saving}
                        className="flex items-center justify-center cursor-pointer transition-all hover:opacity-90"
                        style={{ background: C.gradientBtn, color: '#ffffff', borderRadius: '10px', fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, border: 'none', boxShadow: S.btn, padding: '0 24px', height: 40 }}
                    >
                        {saving
                            ? <div className="rounded-full border-2 animate-spin" style={{ width: 16, height: 16, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
                            : 'Save & Continue'}
                    </button>
                </div>
            </div>

            <main className="w-full px-4 sm:px-6 py-6">
                <WizardSteps currentStep={activeTab} steps={steps} onStepClick={handleStepChange} />

                <AnimatePresence mode="wait">

                    {/* ══ STEP 1: DETAILS ══ */}
                    {activeTab === 'details' && (
                        <motion.div key="details" variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3, ease: 'easeOut' }}>
                            <StepCard>
                                <div className="space-y-8">
                                    <div className="text-center mb-8">
                                        <h2 style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>
                                            Basic Information
                                        </h2>
                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.text, marginTop: 4 }}>
                                            Start by providing the fundamental details of your assessment.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.heading, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>
                                                Assessment Title *
                                            </label>
                                            <input
                                                placeholder="e.g. Advanced Thermodynamics"
                                                value={examData.title}
                                                onChange={e => setExamData({ ...examData, title: e.target.value })}
                                                style={{ ...baseInputStyle, borderColor: errors.title ? C.danger : C.cardBorder }}
                                                onFocus={onFocusHandler} onBlur={onBlurHandler}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.heading, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>
                                                Category / Course *
                                            </label>
                                            <select
                                                value={examData.courseId}
                                                onChange={e => setExamData({ ...examData, courseId: e.target.value })}
                                                style={{ ...baseInputStyle, borderColor: errors.courseId ? C.danger : C.cardBorder }}
                                                onFocus={onFocusHandler} onBlur={onBlurHandler}
                                            >
                                                <option value="" disabled>Select associated course</option>
                                                {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.heading, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>
                                            Detailed Description
                                        </label>
                                        <RichTextEditor value={examData.description} onChange={html => setExamData({ ...examData, description: html })} />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="space-y-2">
                                            <label style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.heading, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>
                                                Assessment Type
                                            </label>
                                            <select value={examData.type} onChange={e => setExamData({ ...examData, type: e.target.value })} style={baseInputStyle} onFocus={onFocusHandler} onBlur={onBlurHandler}>
                                                <option value="quiz">Quiz</option>
                                                <option value="assessment">Assessment</option>
                                                <option value="practice">Practice Set</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.heading, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>
                                                Duration (Mins)
                                            </label>
                                            <input type="number" min="1" value={examData.duration} onChange={e => setExamData({ ...examData, duration: parseInt(e.target.value) || 0 })} style={baseInputStyle} onFocus={onFocusHandler} onBlur={onBlurHandler} />
                                        </div>
                                        <div className="space-y-2">
                                            <label style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.heading, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>
                                                Passing Marks
                                            </label>
                                            <div
                                                className="flex items-center justify-between"
                                                style={{ ...baseInputStyle, backgroundColor: C.innerBg, color: C.heading }}
                                            >
                                                <span style={{ fontWeight: T.weight.bold }}>{derivedPassingMarks}</span>
                                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.text }}>Auto-calculated</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Access */}
                                    <div className="pt-6" style={{ borderTop: `1px solid ${C.cardBorder}` }}>
                                        <label className="block mb-4" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.heading, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            Access & Enrollment
                                        </label>
                                        <div className="flex items-center justify-between mb-6" style={{ backgroundColor: C.innerBg, borderRadius: '10px', padding: 20 }}>
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center justify-center shrink-0" style={{ width: 48, height: 48, backgroundColor: C.cardBg, borderRadius: R.full }}>
                                                    <MdAutoAwesome style={{ width: 20, height: 20, color: C.btnPrimary }} />
                                                </div>
                                                <div>
                                                    <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.md, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>Make it Free</h3>
                                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.medium, color: C.text, margin: 0 }}>Allow any student to access without prior enrollment</p>
                                                </div>
                                            </div>
                                            <CustomSwitch checked={examData.isFree} onChange={val => setExamData({ ...examData, isFree: val })} />
                                        </div>
                                        <div style={{ backgroundColor: C.innerBg, padding: 16, borderRadius: '10px' }}>
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

                                    <div className="flex justify-end pt-6" style={{ borderTop: `1px solid ${C.cardBorder}` }}>
                                        <button
                                            onClick={handleSaveAndProceed}
                                            className="flex items-center justify-center gap-2 cursor-pointer transition-all hover:opacity-90"
                                            style={{ background: C.gradientBtn, color: '#ffffff', borderRadius: '10px', fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, border: 'none', boxShadow: S.btn, height: 48, padding: '0 32px' }}
                                        >
                                            Continue to Configuration <MdChevronRight style={{ width: 16, height: 16 }} />
                                        </button>
                                    </div>
                                </div>
                            </StepCard>
                        </motion.div>
                    )}

                    {/* ══ STEP 2: SETTINGS ══ */}
                    {activeTab === 'settings' && (
                        <motion.div key="settings" variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3, ease: 'easeOut' }}>
                            <StepCard>
                                <div className="space-y-10">
                                    <div className="text-center mb-10">
                                        <h2 style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>
                                            Exam Configuration
                                        </h2>
                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.text, marginTop: 4 }}>
                                            Setup rules, scoring, and high-level security for this assessment.
                                        </p>
                                    </div>

                                    {/* AI Proctoring */}
                                    <FeatureGate featureName="aiAssessment" mode="lock">
                                        <div style={{ backgroundColor: C.innerBg, borderRadius: R['2xl'], padding: 24 }}>
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className="flex items-center justify-center shrink-0" style={{ width: 40, height: 40, backgroundColor: C.cardBg, borderRadius: '10px' }}>
                                                    <MdShield style={{ width: 20, height: 20, color: C.btnPrimary }} />
                                                </div>
                                                <div>
                                                    <h2 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>
                                                        Advanced Security & Integrity
                                                    </h2>
                                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.text, textTransform: 'uppercase', margin: 0 }}>
                                                        Industry-level Proctoring
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                <TR icon={MdVisibility} label="Visual AI Proctoring" desc="Requires webcam. Flags absence & multiple faces." keyName="isProctoringEnabled" />
                                                <TR icon={MdMic} label="Audio & Gaze Proctoring" desc="Requires mic. Flags noise & looking away/down." keyName="isAudioProctoringEnabled" />
                                                <div className="lg:col-span-2">
                                                    <TR icon={MdGridView} label="Strict Environment Lock" desc="Aggressively tracks and flags tab switching." keyName="strictTabSwitching" />
                                                </div>
                                            </div>
                                        </div>
                                    </FeatureGate>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {/* Scoring Rules */}
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-3 pb-3" style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                                                <div className="flex items-center justify-center" style={{ width: 32, height: 32, backgroundColor: C.innerBg, borderRadius: '10px' }}>
                                                    <MdAccessTime style={{ width: 16, height: 16, color: C.btnPrimary }} />
                                                </div>
                                                <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.md, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>Scoring Rules</h3>
                                            </div>
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between" style={{ backgroundColor: C.innerBg, borderRadius: '10px', padding: 16 }}>
                                                    <label style={{ fontFamily: T.fontFamily, fontSize: T.size.md, fontWeight: T.weight.bold, color: C.heading }}>Required Pass Percentage</label>
                                                    <div className="relative w-28">
                                                        <input
                                                            type="number" min="0" max="100"
                                                            value={examData.passingPercentage}
                                                            onChange={e => setExamData({ ...examData, passingPercentage: parseInt(e.target.value) || 0 })}
                                                            style={{ ...baseInputStyle, textAlign: 'center', paddingRight: 32 }}
                                                            onFocus={onFocusHandler} onBlur={onBlurHandler}
                                                        />
                                                        <span className="absolute right-3 top-2.5 font-bold" style={{ fontFamily: T.fontFamily, color: C.text }}>%</span>
                                                    </div>
                                                </div>
                                                <TR icon={MdWarning} label="Negative Marking" desc="Deduct points for incorrect answers" keyName="negativeMarking" />
                                            </div>
                                        </div>

                                        {/* Exam Experience */}
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-3 pb-3" style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                                                <div className="flex items-center justify-center" style={{ width: 32, height: 32, backgroundColor: C.innerBg, borderRadius: '10px' }}>
                                                    <MdPsychology style={{ width: 16, height: 16, color: C.btnPrimary }} />
                                                </div>
                                                <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.md, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>Exam Experience</h3>
                                            </div>
                                            <div className="space-y-3">
                                                <TR icon={MdFormatListBulleted} label="Shuffle Questions" desc="Randomize question sequence" keyName="shuffleQuestions" />
                                                <TR icon={MdFormatListNumbered} label="Shuffle Options" desc="Randomize A, B, C, D choices" keyName="shuffleOptions" />
                                            </div>
                                        </div>

                                        {/* Post-Exam Review */}
                                        <div className="space-y-6 md:col-span-2">
                                            <div className="flex items-center gap-3 pb-3" style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                                                <div className="flex items-center justify-center" style={{ width: 32, height: 32, backgroundColor: C.innerBg, borderRadius: '10px' }}>
                                                    <MdGridView style={{ width: 16, height: 16, color: C.btnPrimary }} />
                                                </div>
                                                <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.md, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>Post-Exam Review</h3>
                                            </div>
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                <TR label="Show Results Instantly" desc="Display score immediately after submit" keyName="showResultImmediately" />
                                                <TR label="Show Correct Answers" desc="Reveal correct options during review" keyName="showCorrectAnswers" />
                                                <TR label="Hide Detailed Solutions" desc="Do not show explanations to students" keyName="hideSolutions" />
                                                <div className="space-y-3">
                                                    <TR label="Allow Multiple Attempts" desc="Let students retake the exam" keyName="allowRetake" />
                                                    <AnimatePresence>
                                                        {examData.allowRetake && (
                                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                                                <div className="flex items-center justify-between mt-2" style={{ backgroundColor: C.innerBg, borderRadius: '10px', padding: 16 }}>
                                                                    <label style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading }}>Maximum Allowed Attempts</label>
                                                                    <input
                                                                        type="number" min="1" value={examData.maxAttempts}
                                                                        onChange={e => setExamData({ ...examData, maxAttempts: parseInt(e.target.value) || 1 })}
                                                                        style={{ ...baseInputStyle, textAlign: 'center', width: 80, padding: 8 }}
                                                                        onFocus={onFocusHandler} onBlur={onBlurHandler}
                                                                    />
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-between pt-8" style={{ borderTop: `1px solid ${C.cardBorder}` }}>
                                        <button onClick={() => setActiveTab('details')} className="cursor-pointer hover:opacity-70 transition-all"
                                            style={{ color: C.text, fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, background: 'none', border: 'none', padding: '0 24px', height: 48 }}>
                                            Go Back
                                        </button>
                                        <button onClick={handleSaveAndProceed} className="flex items-center justify-center gap-2 cursor-pointer transition-all hover:opacity-90"
                                            style={{ background: C.gradientBtn, color: '#ffffff', borderRadius: '10px', fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, border: 'none', boxShadow: S.btn, height: 48, padding: '0 32px' }}>
                                            Setup Questions <MdChevronRight style={{ width: 16, height: 16 }} />
                                        </button>
                                    </div>
                                </div>
                            </StepCard>
                        </motion.div>
                    )}

                    {/* ══ STEP 3: QUESTIONS ══ */}
                    {activeTab === 'questions' && (
                        <motion.div key="questions" variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3, ease: 'easeOut' }}>
                            <StepCard>
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 pb-6" style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                                    <div>
                                        <h2 className="flex items-center gap-3" style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>
                                            Questions Setup
                                            <span className="px-3 py-1 text-white" style={{ background: C.gradientBtn, borderRadius: R.full, fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold }}>
                                                {examData.questions.length}
                                            </span>
                                        </h2>
                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.text, marginTop: 4 }}>
                                            Manually author questions or use AI to generate them instantly.
                                        </p>
                                    </div>
                                    <div className="flex gap-3 w-full md:w-auto flex-wrap">
                                        <FeatureGate featureName="aiAssessment" mode="lock">
                                            <button onClick={() => setIsAIOpen(true)} className="flex items-center gap-2 cursor-pointer transition-all hover:opacity-80"
                                                style={{ backgroundColor: C.cardBg, color: C.btnPrimary, border: `1px solid ${C.cardBorder}`, borderRadius: '10px', fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, height: 44, padding: '0 20px' }}>
                                                <MdAutoAwesome style={{ width: 16, height: 16 }} /> AI Generate
                                            </button>
                                        </FeatureGate>
                                        <button onClick={() => setIsBankOpen(true)} className="flex items-center gap-2 cursor-pointer transition-all hover:opacity-80"
                                            style={{ backgroundColor: C.cardBg, color: C.heading, border: `1px solid ${C.cardBorder}`, borderRadius: '10px', fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, height: 44, padding: '0 20px' }}>
                                            <MdLibraryBooks style={{ width: 16, height: 16 }} /> Import
                                        </button>
                                        <button onClick={() => { resetQuestionForm(); setIsAddOpen(true); }} className="flex items-center gap-2 cursor-pointer transition-all hover:opacity-90"
                                            style={{ background: C.gradientBtn, color: '#ffffff', border: 'none', borderRadius: '10px', fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, boxShadow: S.btn, height: 44, padding: '0 20px' }}>
                                            <MdAdd style={{ width: 16, height: 16 }} /> Add Manual
                                        </button>
                                    </div>
                                </div>

                                {examData.questions.length === 0 ? (
                                    <div className="text-center flex flex-col items-center border-2 border-dashed" style={{ backgroundColor: C.innerBg, borderColor: C.cardBorder, borderRadius: R['2xl'], padding: '80px 24px' }}>
                                        <div className="flex items-center justify-center mb-6" style={{ width: 64, height: 64, backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, borderRadius: '10px' }}>
                                            <MdHelp style={{ width: 32, height: 32, color: C.text, opacity: 0.5 }} />
                                        </div>
                                        <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 8px 0' }}>The question bank is empty</h3>
                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.text, maxWidth: 380, margin: '0 auto 32px' }}>
                                            Build your assessment by adding questions manually, pulling from the bank, or let AI do the heavy lifting.
                                        </p>
                                        <FeatureGate featureName="aiAssessment" mode="lock">
                                            <button onClick={() => setIsAIOpen(true)} className="flex items-center justify-center gap-2 cursor-pointer transition-all hover:opacity-90"
                                                style={{ background: C.gradientBtn, color: '#ffffff', border: 'none', borderRadius: '10px', fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, boxShadow: S.btn, height: 48, padding: '0 32px' }}>
                                                <MdAutoAwesome style={{ width: 16, height: 16 }} /> Auto-Generate with AI
                                            </button>
                                        </FeatureGate>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {examData.questions.map((q, idx) => (
                                            <div
                                                key={idx}
                                                className="group relative transition-all"
                                                style={{ backgroundColor: C.innerBg, borderRadius: '10px', border: `1px solid ${C.cardBorder}`, padding: 24 }}
                                            >
                                                {/* Action buttons */}
                                                <div
                                                    className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    style={{ backgroundColor: C.cardBg, borderRadius: '10px', border: `1px solid ${C.cardBorder}`, padding: 4 }}
                                                >
                                                    <button onClick={() => handleEditQuestion(idx)} className="flex items-center justify-center cursor-pointer transition-all hover:opacity-70"
                                                        style={{ width: 32, height: 32, borderRadius: '10px', background: 'none', border: 'none' }}>
                                                        <MdEdit style={{ width: 16, height: 16, color: C.heading }} />
                                                    </button>
                                                    <button onClick={() => handleDeleteQuestion(idx)} className="flex items-center justify-center cursor-pointer transition-all hover:opacity-70"
                                                        style={{ width: 32, height: 32, borderRadius: '10px', background: 'none', border: 'none' }}>
                                                        <MdDelete style={{ width: 16, height: 16, color: C.danger }} />
                                                    </button>
                                                </div>
                                                <div className="flex gap-4">
                                                    <div
                                                        className="flex items-center justify-center shrink-0"
                                                        style={{ width: 36, height: 36, backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, borderRadius: '10px', fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading }}
                                                    >
                                                        {idx + 1}
                                                    </div>
                                                    <div className="flex-1 pr-20">
                                                        <div className="flex items-center gap-3 mb-3">
                                                            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, textTransform: 'uppercase', borderRadius: '10px', backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, color: C.heading, padding: '3px 10px' }}>
                                                                {q.difficulty}
                                                            </span>
                                                            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, textTransform: 'uppercase', borderRadius: '10px', backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, color: C.text, padding: '3px 10px' }}>
                                                                {q.points} Point{q.points > 1 ? 's' : ''}
                                                            </span>
                                                        </div>
                                                        <div
                                                            dangerouslySetInnerHTML={{ __html: sanitizeHtml(q.question) }}
                                                            style={{ fontFamily: T.fontFamily, fontWeight: T.weight.bold, color: C.heading, marginBottom: 20, fontSize: T.size.base }}
                                                        />
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                            {q.options.map((opt, i) => (
                                                                <div
                                                                    key={i}
                                                                    className="flex items-center gap-3"
                                                                    style={{ borderRadius: '10px', backgroundColor: C.cardBg, border: `2px solid ${opt.isCorrect ? C.success : C.cardBorder}`, color: opt.isCorrect ? C.success : C.text, padding: 12 }}
                                                                >
                                                                    <span
                                                                        className="flex items-center justify-center shrink-0"
                                                                        style={{ width: 24, height: 24, fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, borderRadius: R.full, backgroundColor: opt.isCorrect ? C.success : C.innerBg, color: opt.isCorrect ? '#fff' : C.text }}
                                                                    >
                                                                        {String.fromCharCode(65 + i)}
                                                                    </span>
                                                                    <span className="flex-1 truncate" style={{ fontFamily: T.fontFamily, fontWeight: opt.isCorrect ? T.weight.bold : T.weight.medium, fontSize: T.size.base }}>
                                                                        {opt.text}
                                                                    </span>
                                                                    {opt.isCorrect && <MdCheckCircle style={{ width: 16, height: 16, color: C.success, flexShrink: 0 }} />}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="flex justify-between pt-8 mt-10" style={{ borderTop: `1px solid ${C.cardBorder}` }}>
                                    <button onClick={() => setActiveTab('settings')} className="cursor-pointer hover:opacity-70 transition-all"
                                        style={{ color: C.text, fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, background: 'none', border: 'none', padding: '0 24px', height: 48 }}>
                                        Go Back
                                    </button>
                                    <button onClick={handleSaveAndProceed} className="flex items-center justify-center gap-2 cursor-pointer transition-all hover:opacity-90"
                                        style={{ background: C.gradientBtn, color: '#ffffff', borderRadius: '10px', fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, border: 'none', boxShadow: S.btn, height: 48, padding: '0 32px' }}>
                                        Finalize Schedule <MdChevronRight style={{ width: 16, height: 16 }} />
                                    </button>
                                </div>
                            </StepCard>
                        </motion.div>
                    )}

                    {/* ══ STEP 4: SCHEDULE ══ */}
                    {activeTab === 'schedules' && (
                        <motion.div key="schedules" variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3, ease: 'easeOut' }}>
                            <StepCard>
                                <div className="space-y-10">
                                    <div className="text-center mb-8">
                                        <h2 style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>
                                            Publish & Availability
                                        </h2>
                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.text, marginTop: 4 }}>
                                            Decide when students can view and attempt this assessment.
                                        </p>
                                    </div>

                                    <div style={{ backgroundColor: C.innerBg, border: `1px solid ${C.cardBorder}`, borderRadius: R['2xl'], padding: 32 }}>
                                        <div className="flex items-start justify-between pb-6 mb-8" style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                                            <div className="flex gap-4">
                                                <div className="flex items-center justify-center shrink-0" style={{ width: 48, height: 48, backgroundColor: C.cardBg, borderRadius: '10px' }}>
                                                    <MdCalendarMonth style={{ width: 24, height: 24, color: C.btnPrimary }} />
                                                </div>
                                                <div>
                                                    <label style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading, display: 'block' }}>
                                                        Strict Time Window
                                                    </label>
                                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.text, maxWidth: 380, marginTop: 4 }}>
                                                        Enable this to lock the exam outside of the specified start and end dates.
                                                    </p>
                                                </div>
                                            </div>
                                            <CustomSwitch checked={examData.isScheduled} onChange={val => setExamData({ ...examData, isScheduled: val })} />
                                        </div>

                                        <AnimatePresence>
                                            {examData.isScheduled ? (
                                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                                    <div
                                                        className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6"
                                                        style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}` }}
                                                    >
                                                        <div className="space-y-2">
                                                            <label style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.text, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block' }}>
                                                                Opening Time
                                                            </label>
                                                            <input
                                                                type="datetime-local"
                                                                value={examData.startDate ? new Date(examData.startDate).toISOString().slice(0, 16) : ''}
                                                                onChange={e => setExamData({ ...examData, startDate: e.target.value })}
                                                                style={baseInputStyle}
                                                                onFocus={onFocusHandler} onBlur={onBlurHandler}
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.text, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block' }}>
                                                                Closing Time
                                                            </label>
                                                            <input
                                                                type="datetime-local"
                                                                value={examData.endDate ? new Date(examData.endDate).toISOString().slice(0, 16) : ''}
                                                                onChange={e => setExamData({ ...examData, endDate: e.target.value })}
                                                                style={baseInputStyle}
                                                                onFocus={onFocusHandler} onBlur={onBlurHandler}
                                                            />
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ) : (
                                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                                    <div
                                                        className="mt-4 flex items-center gap-4"
                                                        style={{ backgroundColor: C.successBg, border: `1px solid ${C.successBorder}`, borderRadius: R['2xl'], padding: 20 }}
                                                    >
                                                        <div className="flex items-center justify-center shrink-0" style={{ width: 40, height: 40, backgroundColor: C.cardBg, borderRadius: R.full }}>
                                                            <MdCheckCircle style={{ width: 20, height: 20, color: C.success }} />
                                                        </div>
                                                        <div>
                                                            <h4 style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 2px 0' }}>Always Open</h4>
                                                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.semibold, color: C.success, margin: 0 }}>
                                                                Once published, students can access this quiz immediately and anytime.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    <div className="flex justify-between pt-8 mt-10" style={{ borderTop: `1px solid ${C.cardBorder}` }}>
                                        <button onClick={() => setActiveTab('questions')} className="cursor-pointer hover:opacity-70 transition-all"
                                            style={{ color: C.text, fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, background: 'none', border: 'none', padding: '0 24px', height: 48 }}>
                                            Go Back
                                        </button>
                                        <button
                                            onClick={() => handleSaveAndProceed({ status: 'published', shouldRedirect: true })}
                                            disabled={saving}
                                            className="flex items-center justify-center gap-3 cursor-pointer transition-all hover:opacity-90"
                                            style={{ backgroundColor: C.success, color: '#ffffff', borderRadius: '10px', fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, border: 'none', boxShadow: `0 4px 14px ${C.success}30`, height: 48, padding: '0 40px' }}
                                        >
                                            {saving
                                                ? <div className="rounded-full border-2 animate-spin" style={{ width: 20, height: 20, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
                                                : <MdUpload style={{ width: 20, height: 20 }} />}
                                            Publish Assessment
                                        </button>
                                    </div>
                                </div>
                            </StepCard>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* ── AI Generate Modal ── */}
            <Modal isOpen={isAIOpen} onClose={() => setIsAIOpen(false)} title="Generate Questions with AI">
                <div style={{ backgroundColor: C.cardBg, padding: 24, borderRadius: R['2xl'] }}>
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <label style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading, display: 'block' }}>Topic or Subject</label>
                            <input
                                placeholder="e.g. Newton's Laws of Motion"
                                value={aiParams.topic}
                                onChange={e => setAiParams({ ...aiParams, topic: e.target.value })}
                                style={baseInputStyle}
                                onFocus={onFocusHandler} onBlur={onBlurHandler}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-5">
                            <div className="space-y-3">
                                <label style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading, display: 'block' }}>Number of Questions</label>
                                <input type="number" min="1" max="20" value={aiParams.count} onChange={e => setAiParams({ ...aiParams, count: parseInt(e.target.value) || 5 })} style={baseInputStyle} onFocus={onFocusHandler} onBlur={onBlurHandler} />
                            </div>
                            <div className="space-y-3">
                                <label style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading, display: 'block' }}>Difficulty</label>
                                <select value={aiParams.difficulty} onChange={e => setAiParams({ ...aiParams, difficulty: e.target.value })} style={baseInputStyle} onFocus={onFocusHandler} onBlur={onBlurHandler}>
                                    <option value="easy">Easy</option>
                                    <option value="medium">Medium</option>
                                    <option value="hard">Hard</option>
                                </select>
                            </div>
                        </div>
                        <button
                            onClick={handleAIGenerate}
                            disabled={aiLoading}
                            className="w-full flex items-center justify-center gap-2 cursor-pointer transition-all hover:opacity-90"
                            style={{ background: C.gradientBtn, color: '#ffffff', border: 'none', borderRadius: '10px', fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, boxShadow: S.btn, height: 48 }}
                        >
                            {aiLoading
                                ? <div className="rounded-full border-2 animate-spin" style={{ width: 20, height: 20, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
                                : <MdAutoAwesome style={{ width: 20, height: 20 }} />}
                            Generate Now
                        </button>
                    </div>
                </div>
            </Modal>

            {/* ── Add/Edit Question Modal ── */}
            <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title={editingIndex >= 0 ? 'Edit Question' : 'Add New Question'} className="max-w-4xl">
                <div className="space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar" style={{ backgroundColor: C.cardBg, padding: 24, borderRadius: R['2xl'] }}>
                    <div className="space-y-3">
                        <label style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading, display: 'block' }}>Question Content</label>
                        <RichTextEditor value={currentQuestion.question} onChange={html => setCurrentQuestion({ ...currentQuestion, question: html })} />
                    </div>
                    <div className="space-y-4 p-6" style={{ backgroundColor: C.innerBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}` }}>
                        <label style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading, display: 'block' }}>Answer Options</label>
                        {currentQuestion.options.map((opt, idx) => (
                            <div key={idx} className="flex items-center gap-4">
                                <div className="flex items-center justify-center w-8">
                                    <input type="radio" name="correctAnswer" checked={opt.isCorrect} onChange={() => handleCorrectSelect(idx)} style={{ width: 20, height: 20, cursor: 'pointer' }} />
                                </div>
                                <input
                                    value={opt.text}
                                    onChange={e => handleOptionChange(idx, e.target.value)}
                                    placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                                    style={{ ...baseInputStyle, backgroundColor: opt.isCorrect ? C.successBg : C.cardBg, borderColor: opt.isCorrect ? C.success : C.cardBorder }}
                                    onFocus={onFocusHandler} onBlur={onBlurHandler}
                                />
                                {currentQuestion.options.length > 2 && (
                                    <button
                                        onClick={() => handleRemoveOption(idx)}
                                        className="flex items-center justify-center shrink-0 cursor-pointer transition-all hover:opacity-70"
                                        style={{ width: 40, height: 40, backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, borderRadius: '10px' }}
                                    >
                                        <MdDelete style={{ width: 16, height: 16, color: C.danger }} />
                                    </button>
                                )}
                            </div>
                        ))}
                        {currentQuestion.options.length < 6 && (
                            <div className="pl-12 pt-2">
                                <button
                                    onClick={handleAddOption}
                                    className="flex items-center justify-center gap-2 cursor-pointer hover:opacity-70 transition-all"
                                    style={{ border: `1px dashed ${C.cardBorder}`, borderRadius: '10px', color: C.text, fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, background: 'transparent', height: 36, padding: '0 16px' }}
                                >
                                    <MdAdd style={{ width: 14, height: 14 }} /> Add Another Option
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <label style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading, display: 'block' }}>Points / Marks</label>
                            <input type="number" min="1" value={currentQuestion.points} onChange={e => setCurrentQuestion({ ...currentQuestion, points: parseFloat(e.target.value) || 1 })} style={baseInputStyle} onFocus={onFocusHandler} onBlur={onBlurHandler} />
                        </div>
                        <div className="space-y-3">
                            <label style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading, display: 'block' }}>Difficulty Level</label>
                            <select value={currentQuestion.difficulty} onChange={e => setCurrentQuestion({ ...currentQuestion, difficulty: e.target.value })} style={baseInputStyle} onFocus={onFocusHandler} onBlur={onBlurHandler}>
                                <option value="easy">Easy</option>
                                <option value="medium">Medium</option>
                                <option value="hard">Hard</option>
                            </select>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <label style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading, display: 'block' }}>Explanation (Optional)</label>
                        <textarea
                            value={currentQuestion.explanation}
                            onChange={e => setCurrentQuestion({ ...currentQuestion, explanation: e.target.value })}
                            placeholder="Explain why the selected answer is correct..."
                            style={{ ...baseInputStyle, minHeight: 100, resize: 'vertical' }}
                            onFocus={onFocusHandler} onBlur={onBlurHandler}
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-6" style={{ borderTop: `1px solid ${C.cardBorder}` }}>
                        <button onClick={() => setIsAddOpen(false)} className="cursor-pointer hover:opacity-70 transition-all"
                            style={{ color: C.text, fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, background: 'none', border: 'none', height: 44, padding: '0 24px' }}>
                            Cancel
                        </button>
                        <button onClick={handleSaveQuestion} className="flex items-center justify-center gap-2 cursor-pointer transition-all hover:opacity-90"
                            style={{ background: C.gradientBtn, color: '#ffffff', border: 'none', borderRadius: '10px', fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, boxShadow: S.btn, height: 44, padding: '0 32px' }}>
                            <MdSave style={{ width: 16, height: 16 }} />
                            {editingIndex >= 0 ? 'Save Changes' : 'Add to Quiz'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* ── Import from Bank Modal ── */}
            <Modal isOpen={isBankOpen} onClose={() => setIsBankOpen(false)} title="Import from Question Bank" className="max-w-5xl">
                <div className="space-y-5 flex flex-col" style={{ backgroundColor: C.cardBg, padding: 24, borderRadius: R['2xl'] }}>
                    {/* Filters */}
                    <div className="flex gap-4 items-end shrink-0" style={{ backgroundColor: C.innerBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, padding: 16 }}>
                        <div className="flex-1 space-y-2">
                            <label style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.text, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>Search Questions</label>
                            <div className="relative">
                                <MdSearch className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ width: 16, height: 16, color: C.text }} />
                                <input
                                    placeholder="Type to search..."
                                    value={bankFilters.search || ''}
                                    onChange={e => setBankFilters({ ...bankFilters, search: e.target.value })}
                                    style={{ ...baseInputStyle, paddingLeft: 40 }}
                                    onFocus={onFocusHandler} onBlur={onBlurHandler}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.text, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>Difficulty</label>
                            <select value={bankFilters.difficulty} onChange={e => setBankFilters({ ...bankFilters, difficulty: e.target.value })} style={{ ...baseInputStyle, width: 150 }} onFocus={onFocusHandler} onBlur={onBlurHandler}>
                                <option value="all">All Levels</option>
                                <option value="easy">Easy</option>
                                <option value="medium">Medium</option>
                                <option value="hard">Hard</option>
                            </select>
                        </div>
                    </div>

                    {/* Questions list */}
                    <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar" style={{ minHeight: 400, backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, padding: 20, boxShadow: S.card }}>
                        {bankLoading ? (
                            <div className="flex flex-col justify-center items-center min-h-[300px] gap-3">
                                <div className="rounded-full border-[3px] animate-spin" style={{ width: 32, height: 32, borderColor: `${C.btnPrimary}30`, borderTopColor: C.btnPrimary }} />
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.text }}>Loading bank...</p>
                            </div>
                        ) : (() => {
                            const searchFiltered = bankQuestions.filter(q => !bankFilters.search || q.question.toLowerCase().includes(bankFilters.search.toLowerCase()));
                            if (searchFiltered.length === 0) return (
                                <div className="flex flex-col items-center justify-center min-h-[300px]">
                                    <MdLibraryBooks style={{ width: 48, height: 48, color: C.text, opacity: 0.2, marginBottom: 16 }} />
                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.text }}>No matching questions found.</p>
                                </div>
                            );
                            const grouped = searchFiltered.reduce((acc, q) => {
                                const topicName = q.topicId?.name || 'Uncategorized';
                                if (!acc[topicName]) acc[topicName] = [];
                                acc[topicName].push(q); return acc;
                            }, {});
                            return Object.entries(grouped).map(([topicName, questions]) => (
                                <div key={topicName} className="overflow-hidden" style={{ backgroundColor: C.innerBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}` }}>
                                    <div className="flex items-center justify-between px-5 py-4" style={{ backgroundColor: C.cardBg, borderBottom: `1px solid ${C.cardBorder}` }}>
                                        <div className="flex items-center gap-3">
                                            <span style={{ fontFamily: T.fontFamily, fontWeight: T.weight.bold, color: C.heading }}>{topicName}</span>
                                            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, backgroundColor: C.innerBg, color: C.text, padding: '2px 8px', borderRadius: '10px' }}>
                                                {questions.length} items
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const topicIds = questions.map(q => q._id);
                                                const allSelected = topicIds.every(id => selectedBankIds.includes(id));
                                                if (allSelected) setSelectedBankIds(selectedBankIds.filter(id => !topicIds.includes(id)));
                                                else setSelectedBankIds([...new Set([...selectedBankIds, ...topicIds])]);
                                            }}
                                            className="cursor-pointer transition-all hover:opacity-80"
                                            style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.btnPrimary, fontWeight: T.weight.bold, textTransform: 'uppercase', letterSpacing: '0.05em', backgroundColor: C.innerBg, borderRadius: '10px', border: 'none', padding: '6px 12px' }}
                                        >
                                            {questions.every(q => selectedBankIds.includes(q._id)) ? 'Deselect All' : 'Select All'}
                                        </button>
                                    </div>
                                    <div>
                                        {questions.map(q => (
                                            <div key={q._id} className="flex items-start gap-4 transition-all hover:opacity-90" style={{ padding: '16px 20px', borderBottom: `1px solid ${C.cardBorder}` }}>
                                                <div className="pt-1">
                                                    <input type="checkbox" checked={selectedBankIds.includes(q._id)} onChange={e => { if (e.target.checked) setSelectedBankIds([...selectedBankIds, q._id]); else setSelectedBankIds(selectedBankIds.filter(id => id !== q._id)); }} style={{ width: 20, height: 20, cursor: 'pointer' }} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex gap-2 mb-2">
                                                        {[q.difficulty, q.type || 'mcq', `${q.points || 1} Pts`].map((tag, i) => (
                                                            <span key={i} style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, textTransform: 'uppercase', padding: '2px 8px', borderRadius: '10px', backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, color: i === 0 ? C.heading : C.text }}>
                                                                {tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                    <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(q.question) }} style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.semibold, color: C.heading }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ));
                        })()}
                    </div>

                    {/* Footer */}
                    <div className="flex justify-between items-center pt-5 shrink-0" style={{ borderTop: `1px solid ${C.cardBorder}` }}>
                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading, backgroundColor: C.cardBg, padding: '8px 16px', borderRadius: '10px', border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                            <span style={{ color: C.btnPrimary }}>{selectedBankIds.length}</span> questions selected
                        </span>
                        <div className="flex gap-3">
                            <button onClick={() => { setIsBankOpen(false); setSelectedBankIds([]); }} className="cursor-pointer hover:opacity-70 transition-all"
                                style={{ color: C.text, fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, background: 'none', border: 'none', height: 44, padding: '0 24px' }}>
                                Cancel
                            </button>
                            <button
                                onClick={handleImportFromBank}
                                disabled={selectedBankIds.length === 0}
                                className="flex items-center justify-center gap-2 cursor-pointer transition-all hover:opacity-90"
                                style={{
                                    background: selectedBankIds.length > 0 ? C.gradientBtn : C.btnViewAllBg,
                                    color: selectedBankIds.length > 0 ? '#ffffff' : C.btnViewAllText,
                                    borderRadius: '10px', fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, border: 'none', height: 44, padding: '0 32px',
                                    boxShadow: selectedBankIds.length > 0 ? S.btn : 'none',
                                }}
                            >
                                <MdLibraryBooks style={{ width: 16, height: 16 }} /> Import to Quiz
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

export default function CreateExamPage() {
    return (
        <Suspense fallback={<div className="min-h-screen" style={{ backgroundColor: C.pageBg }} />}>
            <CreateExamPageClient />
        </Suspense>
    );
}