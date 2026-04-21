'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    ArrowLeft, Bold, Italic, Underline, List, ListOrdered,
    Image as ImageIcon, Link as LinkIcon, Loader2, CheckCircle2,
    AlertCircle, Plus, Trash, Edit, BrainCircuit, X, Check,
    Calendar, Clock, Settings, ChevronRight, Save, Sparkles,
    Layout, Type, UploadCloud, Library, Search, Mic, ShieldCheck,
    HelpCircle, Eye
} from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import api from '@/lib/axios';
import { sanitizeHtml } from '@/lib/sanitize';
import { useConfirm } from '@/components/providers/ConfirmProvider';
import { toast } from 'react-hot-toast';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";
import AudienceSelector from '@/components/shared/AudienceSelector';
import useInstitute from '@/hooks/useInstitute';
import { C, T, S, R, cx } from '@/constants/tutorTokens';
import FeatureGate from '@/components/FeatureGate';

const examDetailsSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    courseId: z.string().min(1, "Please select a course/category"),
    type: z.string(),
    duration: z.number().min(1, "Duration must be at least 1 minute"),
    passingMarks: z.number().min(0),
    description: z.string().optional(),
});

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
    backgroundColor: '#E3DFF8',
    border: '1.5px solid transparent',
    borderRadius: R.xl,
    color: C.heading,
    fontFamily: T.fontFamily,
    fontSize: T.size.sm,
    fontWeight: T.weight.medium,
    outline: 'none',
    width: '100%',
    padding: '12px 16px',
    transition: 'all 0.2s ease',
};

const CustomSwitch = ({ checked, onChange }) => {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            style={{
                position: 'relative',
                display: 'inline-flex',
                height: '24px',
                width: '44px',
                flexShrink: 0,
                cursor: 'pointer',
                alignItems: 'center',
                borderRadius: R.full,
                border: '2px solid transparent',
                transition: 'background-color 300ms ease-in-out',
                backgroundColor: checked ? C.btnPrimary : C.btnViewAllBg
            }}
        >
            <span
                style={{
                    display: 'inline-block',
                    height: '20px',
                    width: '20px',
                    borderRadius: R.full,
                    backgroundColor: '#ffffff',
                    transition: 'transform 300ms ease-in-out',
                    transform: checked ? 'translateX(20px)' : 'translateX(0px)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}
            />
        </button>
    );
};

const WizardSteps = ({ currentStep, steps, onStepClick }) => (
    <div className="flex items-center justify-center w-full mb-10 mt-4">
        <div className="flex items-center gap-2 md:gap-3 relative z-10 px-6 py-3" style={{ backgroundColor: C.surfaceWhite, borderRadius: R['2xl'], boxShadow: S.card }}>
            {steps.map((step, idx) => {
                const isActive = currentStep === step.id;
                const isCompleted = steps.findIndex(s => s.id === currentStep) > idx;
                const isClickable = steps.findIndex(s => s.id === currentStep) >= idx;
                return (
                    <div key={step.id} className="flex items-center">
                        <button
                            onClick={() => isClickable && onStepClick(step.id)}
                            disabled={!isClickable}
                            className="flex items-center gap-2.5 px-4 py-2.5 transition-all duration-300 border-none cursor-pointer"
                            style={{
                                background: isActive ? C.gradientBtn : isCompleted ? '#E3DFF8' : 'transparent',
                                borderRadius: R.xl,
                                color: isActive ? '#fff' : isCompleted ? C.heading : C.textMuted,
                                transform: isActive ? 'scale(1.05)' : 'scale(1)',
                                boxShadow: isActive ? S.btn : 'none'
                            }}
                        >
                            <div className="flex items-center justify-center shrink-0"
                                style={{
                                    width: '24px', height: '24px', borderRadius: R.full,
                                    backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : isCompleted ? C.surfaceWhite : '#E3DFF8',
                                    color: isActive ? '#fff' : isCompleted ? C.btnPrimary : C.textMuted,
                                    fontSize: '11px', fontWeight: T.weight.black
                                }}>
                                {isCompleted ? <Check size={14} /> : idx + 1}
                            </div>
                            <span className="hidden md:inline-block" style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                                {step.label}
                            </span>
                        </button>
                        {idx < steps.length - 1 && <div className="mx-2" style={{ width: '24px', height: '2px', backgroundColor: isCompleted ? C.btnPrimary : '#E3DFF8' }} />}
                    </div>
                );
            })}
        </div>
    </div>
);

const RichTextEditor = ({ value, onChange }) => {
    const editorRef = useRef(null);
    const execCommand = (command, val = null) => {
        document.execCommand(command, false, val);
        editorRef.current?.focus();
    };
    const handleInput = () => {
        if (editorRef.current) onChange(editorRef.current.innerHTML);
    };
    useEffect(() => {
        if (editorRef.current && value && editorRef.current.innerHTML === '') {
            editorRef.current.innerHTML = value;
        }
    }, [value]);

    return (
        <div style={{ backgroundColor: '#E3DFF8', borderRadius: R.xl, overflow: 'hidden' }}>
            <div className="flex items-center gap-1 p-2" style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                {[['bold', Bold], ['italic', Italic], ['underline', Underline]].map(([cmd, Icon]) => (
                    <button key={cmd} onClick={() => execCommand(cmd)} className="p-1.5 flex items-center justify-center cursor-pointer border-none bg-transparent hover:opacity-70" style={{ borderRadius: R.sm }}>
                        <Icon size={16} color={C.heading} />
                    </button>
                ))}
                <div className="mx-2" style={{ width: '1px', height: '16px', backgroundColor: C.cardBorder }} />
                <button onClick={() => execCommand('insertUnorderedList')} className="p-1.5 flex items-center justify-center cursor-pointer border-none bg-transparent hover:opacity-70" style={{ borderRadius: R.sm }}><List size={16} color={C.heading} /></button>
                <button onClick={() => execCommand('insertOrderedList')} className="p-1.5 flex items-center justify-center cursor-pointer border-none bg-transparent hover:opacity-70" style={{ borderRadius: R.sm }}><ListOrdered size={16} color={C.heading} /></button>
            </div>
            <div ref={editorRef} contentEditable onInput={handleInput} style={{ minHeight: '160px', padding: '20px', outline: 'none', color: C.text, fontSize: T.size.sm, fontFamily: T.fontFamily }} />
        </div>
    );
};

const StepCard = ({ children }) => (
    <div style={{ backgroundColor: '#EAE8FA', border: `1px solid ${C.cardBorder}`, borderRadius: R['2xl'], padding: '32px', boxShadow: S.card }}>
        {children}
    </div>
);

function CreateExamPageClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const defaultType = searchParams?.get('type') || 'quiz';
    const { institute } = useInstitute();

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState("details");
    const [examId, setExamId] = useState(null);
    const { confirmDialog } = useConfirm();

    const [courses, setCourses] = useState([]);
    const [availableBatches, setAvailableBatches] = useState([]);
    const [availableStudents, setAvailableStudents] = useState([]);
    const [topics, setTopics] = useState([]);
    const [skills, setSkills] = useState([]);

    const [examData, setExamData] = useState({
        title: '', courseId: '', type: defaultType, isFree: true, description: '',
        isPublic: true, duration: 30, passingMarks: 10, questions: [],
        shuffleQuestions: false, shuffleOptions: false, showResultImmediately: true,
        showCorrectAnswers: true, allowRetake: false, maxAttempts: 1, passingPercentage: 50,
        disableFinishButton: false, enableQuestionListView: true, hideSolutions: false,
        negativeMarking: false,
        isProctoringEnabled: false,
        isAudioProctoringEnabled: false,
        strictTabSwitching: false, isScheduled: false, startDate: '', endDate: '',
        audience: { scope: 'institute', instituteId: null, batchIds: [], studentIds: [] },
    });

    const [errors, setErrors] = useState({});
    const totalQuestionMarks = (examData?.questions || []).reduce((sum, q) => sum + (q?.points || 1), 0);
    const derivedPassingMarks = totalQuestionMarks > 0
        ? Number((((Number(examData?.passingPercentage) || 0) / 100) * totalQuestionMarks).toFixed(2))
        : 0;

    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isAIOpen, setIsAIOpen] = useState(false);
    const [editingIndex, setEditingIndex] = useState(-1);
    const [currentQuestion, setCurrentQuestion] = useState({
        question: '', options: [{ text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }],
        explanation: '', points: 1, difficulty: 'medium'
    });
    const [aiParams, setAiParams] = useState({ topic: '', count: 5, difficulty: 'medium' });
    const [aiLoading, setAiLoading] = useState(false);
    const [isBankOpen, setIsBankOpen] = useState(false);
    const [bankQuestions, setBankQuestions] = useState([]);
    const [bankLoading, setBankLoading] = useState(false);
    const [bankFilters, setBankFilters] = useState({ topicId: 'all', skillId: 'all', difficulty: 'all' });
    const [selectedBankIds, setSelectedBankIds] = useState([]);

    const handleAddOption = () => {
        if (currentQuestion?.options?.length < 6)
            setCurrentQuestion({ ...currentQuestion, options: [...currentQuestion.options, { text: '', isCorrect: false }] });
    };
    const handleRemoveOption = (idx) => {
        if (currentQuestion?.options?.length > 2)
            setCurrentQuestion({ ...currentQuestion, options: currentQuestion.options.filter((_, i) => i !== idx) });
    };
    const handleOptionChange = (idx, val) => {
        const newOps = [...currentQuestion.options];
        newOps[idx].text = val;
        setCurrentQuestion({ ...currentQuestion, options: newOps });
    };
    const handleCorrectSelect = (idx) => {
        setCurrentQuestion({ ...currentQuestion, options: currentQuestion.options.map((op, i) => ({ ...op, isCorrect: i === idx })) });
    };
    const handleSaveQuestion = () => {
        if (!currentQuestion?.question || currentQuestion.question === '<br>') { toast.error("Question text is required"); return; }
        if (currentQuestion.options.some(o => !o.text.trim())) { toast.error("All options must have text"); return; }
        if (!currentQuestion.options.some(o => o.isCorrect)) { toast.error("Select a correct answer"); return; }
        const newQuestions = [...examData.questions];
        if (editingIndex >= 0) newQuestions[editingIndex] = currentQuestion;
        else newQuestions.push(currentQuestion);
        setExamData({ ...examData, questions: newQuestions });
        setIsAddOpen(false);
        resetQuestionForm();
        toast.success(editingIndex >= 0 ? "Question updated" : "Question added");
    };
    const handleEditQuestion = (idx) => {
        setEditingIndex(idx);
        setCurrentQuestion(JSON.parse(JSON.stringify(examData.questions[idx])));
        setIsAddOpen(true);
    };
    const handleDeleteQuestion = async (idx) => {
        const isConfirmed = await confirmDialog("Delete Question", "Are you sure you want to delete this question?", { variant: 'destructive' });
        if (isConfirmed) {
            setExamData({ ...examData, questions: examData.questions.filter((_, i) => i !== idx) });
            toast.success("Question deleted");
        }
    };
    const resetQuestionForm = () => {
        setEditingIndex(-1);
        setCurrentQuestion({ question: '', options: [{ text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }], explanation: '', points: 1, difficulty: 'medium' });
    };
    const handleAIGenerate = async () => {
        if (!aiParams?.topic) { toast.error("Please enter a topic"); return; }
        setAiLoading(true);
        try {
            const res = await api.post('/ai/generate-questions', aiParams);
            if (res?.data?.success) {
                const newQs = res.data.questions.map(q => ({
                    question: q.question,
                    options: q.options.map(opt => ({ text: opt, isCorrect: opt === q.correctAnswer })),
                    explanation: q.explanation, points: 1, difficulty: q.difficulty.toLowerCase()
                }));
                setExamData(prev => ({ ...prev, questions: [...prev.questions, ...newQs] }));
                setIsAIOpen(false);
                toast.success(`Generated ${newQs.length} questions!`);
            }
        } catch (error) { toast.error("Failed to generate questions. Try a different topic."); }
        finally { setAiLoading(false); }
    };

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const res = await api.get('/courses/my-courses');
                if (res?.data?.success) setCourses(res.data.courses);
            } catch (err) { toast.error("Failed to load courses"); }
        };
        const fetchTaxonomy = async () => {
            try {
                const [topicsRes, skillsRes] = await Promise.all([api.get('/taxonomy/topics'), api.get('/taxonomy/skills')]);
                if (topicsRes?.data?.success) setTopics(topicsRes.data.topics);
                if (skillsRes?.data?.success) setSkills(skillsRes.data.skills);
            } catch (err) { }
        };
        fetchCourses(); fetchTaxonomy();
    }, []);

    useEffect(() => {
        setExamData(prev => ({ ...prev, audience: { ...prev.audience, instituteId: prev.audience?.instituteId || institute?._id || null } }));
    }, [institute?._id]);

    useEffect(() => {
        const fetchAudienceTargets = async () => {
            if (!examData?.courseId) { setAvailableBatches([]); setAvailableStudents([]); return; }
            try {
                const [batchesRes, studentsRes] = await Promise.all([api.get('/batches'), api.get(`/enrollments/students/${examData.courseId}`)]);
                const batchList = (batchesRes?.data?.batches || []).filter(batch => (batch.courseId?._id || batch.courseId) === examData.courseId);
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
        } catch { toast.error("Failed to load bank questions"); }
        finally { setBankLoading(false); }
    };
    useEffect(() => { if (isBankOpen) fetchBankQuestions(); }, [isBankOpen, bankFilters]);

    const handleImportFromBank = () => {
        if (selectedBankIds.length === 0) { toast.error("Select at least one question to import"); return; }
        const questionsToImport = bankQuestions.filter(q => selectedBankIds.includes(q._id));
        const mappedQuestions = questionsToImport.map(q => ({
            question: q.question, options: q.type === 'mcq' ? q.options : [], type: q.type,
            explanation: q.explanation || '', points: q.points || 1, difficulty: q.difficulty || 'medium'
        }));
        setExamData(prev => ({ ...prev, questions: [...prev.questions, ...mappedQuestions] }));
        setIsBankOpen(false); setSelectedBankIds([]);
        toast.success(`Imported ${mappedQuestions.length} questions from bank!`);
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
        setErrors({});
        return true;
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
                toast.success(status === 'published' ? "Assessment published successfully!" : "Changes saved!");
                if (shouldRedirect) router.push('/tutor/quizzes');
                else {
                    if (activeTab === 'details') setActiveTab('settings');
                    else if (activeTab === 'settings') setActiveTab('questions');
                    else if (activeTab === 'questions') setActiveTab('schedules');
                }
            }
        } catch (error) { toast.error(error?.response?.data?.message || "Failed to save exam"); }
        finally { setSaving(false); }
    };

    const variants = {
        enter: { opacity: 0, y: 15 },
        center: { zIndex: 1, y: 0, opacity: 1 },
        exit: { opacity: 0, y: -15, zIndex: 0 }
    };

    const steps = [
        { id: 'details', label: 'Basic Details' },
        { id: 'settings', label: 'Configuration' },
        { id: 'questions', label: 'Questions Setup' },
        { id: 'schedules', label: 'Availability' }
    ];

    const handleStepChange = (newStep) => {
        if (newStep === 'settings' && !examData?.title) { toast.error("Please enter a title first"); return; }
        setActiveTab(newStep);
    };

    const ToggleRow = ({ label, desc, keyName, icon: Icon }) => (
        <div className="flex items-center justify-between p-4" style={{ backgroundColor: '#E3DFF8', borderRadius: R.xl }}>
            <div className="flex gap-4 items-center">
                {Icon && (
                    <div className="w-10 h-10 flex items-center justify-center shrink-0" style={{ backgroundColor: C.surfaceWhite, borderRadius: R.md }}>
                        <Icon size={20} color={C.btnPrimary} />
                    </div>
                )}
                <div className="space-y-1">
                    <label style={{ fontSize: T.size.md, fontWeight: T.weight.bold, color: C.heading, cursor: 'pointer' }}>{label}</label>
                    {desc && <p style={{ fontSize: T.size.xs, fontWeight: T.weight.medium, color: C.textMuted }}>{desc}</p>}
                </div>
            </div>
            <CustomSwitch checked={examData[keyName]} onChange={(val) => setExamData({ ...examData, [keyName]: val })} />
        </div>
    );

    return (
        <div className="min-h-screen pb-20 w-full" style={{ backgroundColor: C.pageBg, fontFamily: T.fontFamily, color: C.text }}>

            {/* Header */}
            <div className="sticky top-0 z-50 shadow-sm px-6 h-[72px] flex items-center justify-between" style={{ backgroundColor: C.surfaceWhite, borderBottom: `1px solid ${C.cardBorder}` }}>
                <div className="flex items-center gap-4">
                    <Link href="/tutor/quizzes">
                        <button className="w-10 h-10 flex items-center justify-center cursor-pointer border-none transition-opacity hover:opacity-80" style={{ borderRadius: R.full, backgroundColor: '#EAE8FA' }}>
                            <ArrowLeft size={18} color={C.heading} />
                        </button>
                    </Link>
                    <div>
                        <h1 style={{ fontSize: T.size.xl, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>
                            {examId ? 'Edit Assessment' : 'Create New Assessment'}
                        </h1>
                        <p className="hidden sm:block" style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>Configuration Wizard</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button className="hidden sm:flex items-center cursor-pointer transition-opacity hover:opacity-80 px-5 h-10"
                        onClick={() => handleSaveAndProceed({ status: 'draft', shouldRedirect: true })}
                        style={{ backgroundColor: C.btnViewAllBg, color: C.btnViewAllText, border: 'none', borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                        Save Draft
                    </button>
                    <button onClick={() => handleSaveAndProceed({ status: 'draft' })} disabled={saving} className="flex items-center justify-center px-6 h-10 cursor-pointer border-none transition-opacity hover:opacity-90"
                        style={{ background: C.gradientBtn, color: '#ffffff', borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily, boxShadow: S.btn }}>
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save & Continue'}
                    </button>
                </div>
            </div>

            <main className="w-full px-4 sm:px-6 py-6">
                <WizardSteps currentStep={activeTab} steps={steps} onStepClick={handleStepChange} />

                <AnimatePresence mode="wait">
                    {activeTab === 'details' && (
                        <motion.div key="details" variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3, ease: "easeOut" }}>
                            <StepCard>
                                <div className="space-y-8">
                                    <div className="text-center mb-8">
                                        <h2 style={{ fontSize: T.size['2xl'], fontWeight: T.weight.black, color: C.heading, margin: 0 }}>Basic Information</h2>
                                        <p style={{ fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.textMuted, marginTop: '4px' }}>Start by providing the fundamental details of your assessment.</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.heading, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Assessment Title *</label>
                                            <input
                                                placeholder="e.g. Advanced Thermodynamics"
                                                value={examData.title}
                                                onChange={(e) => setExamData({ ...examData, title: e.target.value })}
                                                style={{ ...baseInputStyle, borderColor: errors.title ? C.danger : 'transparent' }}
                                                onFocus={onFocusHandler} onBlur={onBlurHandler}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.heading, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Category / Course *</label>
                                            <select
                                                value={examData.courseId}
                                                onChange={(e) => setExamData({ ...examData, courseId: e.target.value })}
                                                style={{ ...baseInputStyle, borderColor: errors.courseId ? C.danger : 'transparent' }}
                                                onFocus={onFocusHandler} onBlur={onBlurHandler}
                                            >
                                                <option value="" disabled>Select associated course</option>
                                                {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.heading, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Detailed Description</label>
                                        <RichTextEditor value={examData.description} onChange={(html) => setExamData({ ...examData, description: html })} />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="space-y-2">
                                            <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.heading, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Assessment Type</label>
                                            <select
                                                value={examData.type}
                                                onChange={(e) => setExamData({ ...examData, type: e.target.value })}
                                                style={baseInputStyle}
                                                onFocus={onFocusHandler} onBlur={onBlurHandler}
                                            >
                                                <option value="quiz">Quiz</option>
                                                <option value="assessment">Assessment</option>
                                                <option value="practice">Practice Set</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.heading, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Duration (Mins)</label>
                                            <input
                                                type="number" min="1"
                                                value={examData.duration}
                                                onChange={(e) => setExamData({ ...examData, duration: parseInt(e.target.value) || 0 })}
                                                style={baseInputStyle}
                                                onFocus={onFocusHandler} onBlur={onBlurHandler}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.heading, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Passing Marks</label>
                                            <div className="flex items-center justify-between" style={{ ...baseInputStyle, backgroundColor: '#EAE8FA', color: C.heading }}>
                                                <span style={{ fontWeight: T.weight.black }}>{derivedPassingMarks}</span>
                                                <span style={{ fontSize: T.size.xs, color: C.textMuted }}>Auto-calculated</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-6" style={{ borderTop: `1px solid ${C.cardBorder}` }}>
                                        <label className="block mb-4" style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.heading, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Access & Enrollment</label>
                                        <div className="flex items-center justify-between p-5 mb-6" style={{ backgroundColor: '#E3DFF8', borderRadius: R.xl }}>
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 flex items-center justify-center shrink-0" style={{ backgroundColor: C.surfaceWhite, borderRadius: R.full }}>
                                                    <Sparkles size={20} color={C.btnPrimary} />
                                                </div>
                                                <div>
                                                    <h3 style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>Make it Free</h3>
                                                    <p style={{ fontSize: T.size.xs, fontWeight: T.weight.medium, color: C.textMuted, margin: 0 }}>Allow any student to access without prior enrollment</p>
                                                </div>
                                            </div>
                                            <CustomSwitch checked={examData.isFree} onChange={(val) => setExamData({ ...examData, isFree: val })} />
                                        </div>
                                        {/* Assuming AudienceSelector handles its own styling correctly, or wraps nicely */}
                                        <div style={{ backgroundColor: '#E3DFF8', padding: '16px', borderRadius: R.xl }}>
                                            <AudienceSelector value={examData.audience} onChange={(audience) => setExamData({ ...examData, audience })}
                                                availableBatches={availableBatches} availableStudents={availableStudents}
                                                allowGlobal={Boolean(!institute?._id || institute?.features?.allowGlobalPublishingByInstituteTutors)}
                                                instituteId={institute?._id || null} />
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-6" style={{ borderTop: `1px solid ${C.cardBorder}` }}>
                                        <button onClick={handleSaveAndProceed} className="flex items-center justify-center px-8 h-12 cursor-pointer border-none transition-opacity hover:opacity-90 gap-2"
                                            style={{ background: C.gradientBtn, color: '#ffffff', borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily, boxShadow: S.btn }}>
                                            Continue to Configuration <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            </StepCard>
                        </motion.div>
                    )}

                    {activeTab === 'settings' && (
                        <motion.div key="settings" variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3, ease: "easeOut" }}>
                            <StepCard>
                                <div className="space-y-10">
                                    <div className="text-center mb-10">
                                        <h2 style={{ fontSize: T.size['2xl'], fontWeight: T.weight.black, color: C.heading, margin: 0 }}>Exam Configuration</h2>
                                        <p style={{ fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.textMuted, marginTop: '4px' }}>Setup rules, scoring, and high-level security for this assessment.</p>
                                    </div>

                                    {/* 🌟 PREMIUM FEATURE: AI Proctoring 🌟 */}
                                    <FeatureGate featureName="aiAssessment" mode="lock">
                                        <div className="p-6" style={{ backgroundColor: '#E3DFF8', borderRadius: R['2xl'] }}>
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className="w-10 h-10 flex items-center justify-center shrink-0" style={{ backgroundColor: C.surfaceWhite, borderRadius: R.xl }}>
                                                    <ShieldCheck size={20} color={C.btnPrimary} />
                                                </div>
                                                <div>
                                                    <h2 style={{ fontSize: T.size.lg, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>Advanced Security & Integrity</h2>
                                                    <p style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', margin: 0 }}>Industry-level Proctoring</p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                <ToggleRow icon={Eye} label="Visual AI Proctoring" desc="Requires webcam. Flags absence & multiple faces." keyName="isProctoringEnabled" />
                                                <ToggleRow icon={Mic} label="Audio & Gaze Proctoring" desc="Requires mic. Flags noise & looking away/down." keyName="isAudioProctoringEnabled" />
                                                <div className="lg:col-span-2">
                                                    <ToggleRow icon={Layout} label="Strict Environment Lock" desc="Aggressively tracks and flags tab switching." keyName="strictTabSwitching" />
                                                </div>
                                            </div>
                                        </div>
                                    </FeatureGate>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-3 pb-3" style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                                                <div className="w-8 h-8 flex items-center justify-center" style={{ backgroundColor: '#E3DFF8', borderRadius: R.md }}>
                                                    <Clock size={16} color={C.btnPrimary} />
                                                </div>
                                                <h3 style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>Scoring Rules</h3>
                                            </div>
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between p-4" style={{ backgroundColor: '#E3DFF8', borderRadius: R.xl }}>
                                                    <label style={{ fontSize: T.size.md, fontWeight: T.weight.bold, color: C.heading }}>Required Pass Percentage</label>
                                                    <div className="relative w-28">
                                                        <input
                                                            type="number" min="0" max="100"
                                                            value={examData.passingPercentage}
                                                            onChange={(e) => setExamData({ ...examData, passingPercentage: parseInt(e.target.value) || 0 })}
                                                            style={{ ...baseInputStyle, backgroundColor: C.surfaceWhite, textAlign: 'center', paddingRight: '2rem' }}
                                                            onFocus={onFocusHandler} onBlur={onBlurHandler}
                                                        />
                                                        <span className="absolute right-3 top-2.5 font-bold" style={{ color: C.textMuted }}>%</span>
                                                    </div>
                                                </div>
                                                <ToggleRow icon={AlertCircle} label="Negative Marking" desc="Deduct points for incorrect answers" keyName="negativeMarking" />
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="flex items-center gap-3 pb-3" style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                                                <div className="w-8 h-8 flex items-center justify-center" style={{ backgroundColor: '#E3DFF8', borderRadius: R.md }}>
                                                    <BrainCircuit size={16} color={C.btnPrimary} />
                                                </div>
                                                <h3 style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>Exam Experience</h3>
                                            </div>
                                            <div className="space-y-3">
                                                <ToggleRow icon={List} label="Shuffle Questions" desc="Randomize question sequence" keyName="shuffleQuestions" />
                                                <ToggleRow icon={ListOrdered} label="Shuffle Options" desc="Randomize A, B, C, D choices" keyName="shuffleOptions" />
                                            </div>
                                        </div>

                                        <div className="space-y-6 md:col-span-2">
                                            <div className="flex items-center gap-3 pb-3" style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                                                <div className="w-8 h-8 flex items-center justify-center" style={{ backgroundColor: '#E3DFF8', borderRadius: R.md }}>
                                                    <Layout size={16} color={C.btnPrimary} />
                                                </div>
                                                <h3 style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>Post-Exam Review</h3>
                                            </div>
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                <ToggleRow label="Show Results Instantly" desc="Display score immediately after submit" keyName="showResultImmediately" />
                                                <ToggleRow label="Show Correct Answers" desc="Reveal correct options during review" keyName="showCorrectAnswers" />
                                                <ToggleRow label="Hide Detailed Solutions" desc="Do not show explanations to students" keyName="hideSolutions" />
                                                <div className="space-y-3">
                                                    <ToggleRow label="Allow Multiple Attempts" desc="Let students retake the exam" keyName="allowRetake" />
                                                    <AnimatePresence>
                                                        {examData.allowRetake && (
                                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                                                <div className="flex items-center justify-between p-4 mt-2" style={{ backgroundColor: '#E3DFF8', borderRadius: R.xl }}>
                                                                    <label style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>Maximum Allowed Attempts</label>
                                                                    <input
                                                                        type="number" min="1" value={examData.maxAttempts}
                                                                        onChange={(e) => setExamData({ ...examData, maxAttempts: parseInt(e.target.value) || 1 })}
                                                                        style={{ ...baseInputStyle, backgroundColor: C.surfaceWhite, textAlign: 'center', width: '80px', padding: '8px' }}
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
                                        <button onClick={() => setActiveTab('details')} className="px-6 h-12 cursor-pointer border-none bg-transparent hover:opacity-70"
                                            style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                                            Go Back
                                        </button>
                                        <button onClick={handleSaveAndProceed} className="flex items-center justify-center px-8 h-12 cursor-pointer border-none transition-opacity hover:opacity-90 gap-2"
                                            style={{ background: C.gradientBtn, color: '#ffffff', borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily, boxShadow: S.btn }}>
                                            Setup Questions <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            </StepCard>
                        </motion.div>
                    )}

                    {activeTab === 'questions' && (
                        <motion.div key="questions" variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3, ease: "easeOut" }}>
                            <StepCard>
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 pb-6" style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                                    <div>
                                        <h2 className="flex items-center gap-3" style={{ fontSize: T.size['2xl'], fontWeight: T.weight.black, color: C.heading, margin: 0 }}>
                                            Questions Setup
                                            <span className="px-3 py-1 text-sm font-black text-white" style={{ background: C.gradientBtn, borderRadius: R.full }}>{examData.questions.length}</span>
                                        </h2>
                                        <p style={{ fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.textMuted, marginTop: '4px' }}>Manually author questions or use AI to generate them instantly.</p>
                                    </div>
                                    <div className="flex gap-3 w-full md:w-auto flex-wrap">
                                        {/* 🌟 PREMIUM FEATURE: AI Generate Button 🌟 */}
                                        <FeatureGate featureName="aiAssessment" mode="lock">
                                            <button onClick={() => setIsAIOpen(true)} className="flex items-center gap-2 h-11 px-5 cursor-pointer transition-opacity hover:opacity-80"
                                                style={{ backgroundColor: C.surfaceWhite, color: C.btnPrimary, border: `1px solid ${C.cardBorder}`, borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                                                <Sparkles size={16} /> AI Generate
                                            </button>
                                        </FeatureGate>
                                        <button onClick={() => setIsBankOpen(true)} className="flex items-center gap-2 h-11 px-5 cursor-pointer transition-opacity hover:opacity-80"
                                            style={{ backgroundColor: C.surfaceWhite, color: C.heading, border: `1px solid ${C.cardBorder}`, borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                                            <Library size={16} /> Import
                                        </button>
                                        <button onClick={() => { resetQuestionForm(); setIsAddOpen(true); }} className="flex items-center gap-2 h-11 px-5 cursor-pointer border-none transition-opacity hover:opacity-90 shadow-md"
                                            style={{ background: C.gradientBtn, color: '#ffffff', borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                                            <Plus size={16} /> Add Manual
                                        </button>
                                    </div>
                                </div>

                                {examData.questions.length === 0 ? (
                                    <div className="text-center py-20 flex flex-col items-center" style={{ backgroundColor: '#E3DFF8', border: `2px dashed ${C.cardBorder}`, borderRadius: R['2xl'] }}>
                                        <div className="w-16 h-16 flex items-center justify-center mb-6" style={{ backgroundColor: C.surfaceWhite, borderRadius: R.xl, border: `1px solid ${C.cardBorder}` }}>
                                            <HelpCircle size={32} color={C.textMuted} />
                                        </div>
                                        <h3 style={{ fontSize: T.size.lg, fontWeight: T.weight.black, color: C.heading, margin: '0 0 8px 0' }}>The question bank is empty</h3>
                                        <p className="max-w-sm mb-8" style={{ fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.textMuted, margin: '0 auto 32px' }}>Build your assessment by adding questions manually, pulling from the bank, or let AI do the heavy lifting.</p>
                                        {/* 🌟 PREMIUM FEATURE: Empty State AI Button 🌟 */}
                                        <FeatureGate featureName="aiAssessment" mode="lock">
                                            <button onClick={() => setIsAIOpen(true)} className="flex items-center justify-center h-12 px-8 gap-2 cursor-pointer border-none transition-opacity hover:opacity-90 shadow-lg"
                                                style={{ background: C.gradientBtn, color: '#ffffff', borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                                                <Sparkles size={16} /> Auto-Generate with AI
                                            </button>
                                        </FeatureGate>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {examData.questions.map((q, idx) => (
                                            <div key={idx} className="p-6 transition-all group relative" style={{ backgroundColor: '#E3DFF8', borderRadius: R.xl, border: `1px solid ${C.cardBorder}` }}>
                                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 shadow-sm" style={{ backgroundColor: C.surfaceWhite, borderRadius: R.md, border: `1px solid ${C.cardBorder}` }}>
                                                    <button onClick={() => handleEditQuestion(idx)} className="w-8 h-8 flex items-center justify-center cursor-pointer border-none bg-transparent hover:opacity-70" style={{ borderRadius: R.sm }}>
                                                        <Edit size={16} color={C.heading} />
                                                    </button>
                                                    <button onClick={() => handleDeleteQuestion(idx)} className="w-8 h-8 flex items-center justify-center cursor-pointer border-none bg-transparent hover:opacity-70" style={{ borderRadius: R.sm }}>
                                                        <Trash size={16} color={C.danger} />
                                                    </button>
                                                </div>
                                                <div className="flex gap-4">
                                                    <div className="w-9 h-9 flex items-center justify-center shrink-0" style={{ backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.black, color: C.heading }}>{idx + 1}</div>
                                                    <div className="flex-1 pr-20">
                                                        <div className="flex items-center gap-3 mb-3">
                                                            <span className="px-2.5 py-1 uppercase" style={{ fontSize: '10px', fontWeight: T.weight.black, borderRadius: R.sm, backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, color: C.heading }}>{q.difficulty}</span>
                                                            <span className="px-2.5 py-1 uppercase" style={{ fontSize: '10px', fontWeight: T.weight.black, borderRadius: R.sm, backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, color: C.textMuted }}>{q.points} Point{q.points > 1 ? 's' : ''}</span>
                                                        </div>
                                                        <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(q.question) }} style={{ fontWeight: T.weight.bold, color: C.heading, marginBottom: '20px', fontSize: T.size.base }} />
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                            {q.options.map((opt, i) => (
                                                                <div key={i} className="flex items-center gap-3 p-3 transition-colors"
                                                                    style={{
                                                                        borderRadius: R.xl,
                                                                        backgroundColor: C.surfaceWhite,
                                                                        border: `2px solid ${opt.isCorrect ? C.success : C.cardBorder}`,
                                                                        color: opt.isCorrect ? C.success : C.text
                                                                    }}>
                                                                    <span className="w-6 h-6 flex items-center justify-center shrink-0" style={{ fontSize: '12px', fontWeight: T.weight.black, borderRadius: R.full, backgroundColor: opt.isCorrect ? C.success : '#EAE8FA', color: opt.isCorrect ? '#fff' : C.textMuted }}>
                                                                        {String.fromCharCode(65 + i)}
                                                                    </span>
                                                                    <span className="flex-1 truncate" style={{ fontWeight: opt.isCorrect ? T.weight.bold : T.weight.medium, fontSize: T.size.sm }}>{opt.text}</span>
                                                                    {opt.isCorrect && <CheckCircle2 size={16} color={C.success} className="shrink-0" />}
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
                                    <button onClick={() => setActiveTab('settings')} className="px-6 h-12 cursor-pointer border-none bg-transparent hover:opacity-70"
                                        style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                                        Go Back
                                    </button>
                                    <button onClick={handleSaveAndProceed} className="flex items-center justify-center px-8 h-12 cursor-pointer border-none transition-opacity hover:opacity-90 gap-2 shadow-md"
                                        style={{ background: C.gradientBtn, color: '#ffffff', borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                                        Finalize Schedule <ChevronRight size={16} />
                                    </button>
                                </div>
                            </StepCard>
                        </motion.div>
                    )}

                    {activeTab === 'schedules' && (
                        <motion.div key="schedules" variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3, ease: "easeOut" }}>
                            <StepCard>
                                <div className="space-y-10">
                                    <div className="text-center mb-8">
                                        <h2 style={{ fontSize: T.size['2xl'], fontWeight: T.weight.black, color: C.heading, margin: 0 }}>Publish & Availability</h2>
                                        <p style={{ fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.textMuted, marginTop: '4px' }}>Decide when students can view and attempt this assessment.</p>
                                    </div>

                                    <div className="p-8 shadow-sm" style={{ backgroundColor: '#E3DFF8', border: `1px solid ${C.cardBorder}`, borderRadius: R['2xl'] }}>
                                        <div className="flex items-start justify-between pb-6 mb-8" style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                                            <div className="flex gap-4">
                                                <div className="w-12 h-12 flex items-center justify-center shrink-0" style={{ backgroundColor: C.surfaceWhite, borderRadius: R.xl }}>
                                                    <Calendar size={24} color={C.btnPrimary} />
                                                </div>
                                                <div>
                                                    <label style={{ fontSize: T.size.lg, fontWeight: T.weight.black, color: C.heading }}>Strict Time Window</label>
                                                    <p className="max-w-sm mt-1" style={{ fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.textMuted }}>Enable this to lock the exam outside of the specified start and end dates.</p>
                                                </div>
                                            </div>
                                            <CustomSwitch checked={examData.isScheduled} onChange={(val) => setExamData({ ...examData, isScheduled: val })} />
                                        </div>

                                        <AnimatePresence>
                                            {examData.isScheduled ? (
                                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6" style={{ backgroundColor: C.surfaceWhite, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}` }}>
                                                        <div className="space-y-2">
                                                            <label style={{ fontSize: T.size.xs, fontWeight: T.weight.black, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '1px' }}>Opening Time</label>
                                                            <input
                                                                type="datetime-local"
                                                                value={examData.startDate ? new Date(examData.startDate).toISOString().slice(0, 16) : ''}
                                                                onChange={(e) => setExamData({ ...examData, startDate: e.target.value })}
                                                                style={{ ...baseInputStyle, backgroundColor: '#E3DFF8' }}
                                                                onFocus={onFocusHandler} onBlur={onBlurHandler}
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label style={{ fontSize: T.size.xs, fontWeight: T.weight.black, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '1px' }}>Closing Time</label>
                                                            <input
                                                                type="datetime-local"
                                                                value={examData.endDate ? new Date(examData.endDate).toISOString().slice(0, 16) : ''}
                                                                onChange={(e) => setExamData({ ...examData, endDate: e.target.value })}
                                                                style={{ ...baseInputStyle, backgroundColor: '#E3DFF8' }}
                                                                onFocus={onFocusHandler} onBlur={onBlurHandler}
                                                            />
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ) : (
                                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                                    <div className="mt-4 p-5 flex items-center gap-4 shadow-sm" style={{ backgroundColor: C.successBg, border: `1px solid ${C.successBorder}`, borderRadius: R['2xl'] }}>
                                                        <div className="w-10 h-10 flex items-center justify-center shrink-0" style={{ backgroundColor: C.surfaceWhite, borderRadius: R.full }}>
                                                            <CheckCircle2 size={20} color={C.success} />
                                                        </div>
                                                        <div>
                                                            <h4 style={{ fontSize: T.size.base, fontWeight: T.weight.black, color: C.heading, margin: '0 0 2px 0' }}>Always Open</h4>
                                                            <p style={{ fontSize: T.size.sm, fontWeight: T.weight.semibold, color: C.success, margin: 0 }}>Once published, students can access this quiz immediately and anytime.</p>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    <div className="flex justify-between pt-8 mt-10" style={{ borderTop: `1px solid ${C.cardBorder}` }}>
                                        <button onClick={() => setActiveTab('questions')} className="px-6 h-12 cursor-pointer border-none bg-transparent hover:opacity-70"
                                            style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                                            Go Back
                                        </button>
                                        <button onClick={() => handleSaveAndProceed({ status: 'published', shouldRedirect: true })} disabled={saving}
                                            className="flex items-center justify-center px-10 h-12 cursor-pointer border-none transition-opacity hover:opacity-90 gap-3 shadow-lg"
                                            style={{ backgroundColor: C.success, color: '#ffffff', borderRadius: R.xl, fontSize: T.size.base, fontWeight: T.weight.black, fontFamily: T.fontFamily }}>
                                            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <UploadCloud size={20} />}
                                            Publish Assessment
                                        </button>
                                    </div>
                                </div>
                            </StepCard>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* AI Modal */}
            <Modal isOpen={isAIOpen} onClose={() => setIsAIOpen(false)} title="Generate Questions with AI">
                <div className="space-y-6 p-2" style={{ backgroundColor: '#EAE8FA', padding: '24px', borderRadius: R['2xl'] }}>
                    <div className="space-y-3">
                        <label style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>Topic or Subject</label>
                        <input
                            placeholder="e.g. Newton's Laws of Motion"
                            value={aiParams.topic}
                            onChange={(e) => setAiParams({ ...aiParams, topic: e.target.value })}
                            style={baseInputStyle}
                            onFocus={onFocusHandler} onBlur={onBlurHandler}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-3">
                            <label style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>Number of Questions</label>
                            <input
                                type="number" min="1" max="20"
                                value={aiParams.count}
                                onChange={(e) => setAiParams({ ...aiParams, count: parseInt(e.target.value) || 5 })}
                                style={baseInputStyle}
                                onFocus={onFocusHandler} onBlur={onBlurHandler}
                            />
                        </div>
                        <div className="space-y-3">
                            <label style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>Difficulty</label>
                            <select
                                value={aiParams.difficulty}
                                onChange={(e) => setAiParams({ ...aiParams, difficulty: e.target.value })}
                                style={baseInputStyle}
                                onFocus={onFocusHandler} onBlur={onBlurHandler}
                            >
                                <option value="easy">Easy</option>
                                <option value="medium">Medium</option>
                                <option value="hard">Hard</option>
                            </select>
                        </div>
                    </div>
                    <button onClick={handleAIGenerate} disabled={aiLoading} className="w-full h-12 flex items-center justify-center gap-2 mt-4 cursor-pointer border-none shadow-md transition-opacity hover:opacity-90"
                        style={{ background: C.gradientBtn, color: '#ffffff', borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                        {aiLoading ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
                        Generate Now
                    </button>
                </div>
            </Modal>

            {/* Add/Edit Question Modal */}
{/* Add/Edit Question Modal */}
{/* 🌟 Modal tag par className="max-w-4xl" lagao */}
<Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title={editingIndex >= 0 ? "Edit Question" : "Add New Question"} className="max-w-4xl">
    {/* 🌟 Andar wale div se wo lambi wali width classes HATA do */}
    <div className="space-y-6 max-h-[80vh] overflow-y-auto p-1 custom-scrollbar" style={{ backgroundColor: '#EAE8FA', padding: '24px', borderRadius: R['2xl'] }}>
                    <div className="space-y-3">
                        <label style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>Question Content</label>
                        <RichTextEditor value={currentQuestion.question} onChange={(html) => setCurrentQuestion({ ...currentQuestion, question: html })} />
                    </div>
                    <div className="space-y-4 p-6" style={{ backgroundColor: '#E3DFF8', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}` }}>
                        <label style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>Answer Options</label>
                        {currentQuestion.options.map((opt, idx) => (
                            <div key={idx} className="flex items-center gap-4">
                                <div className="flex items-center justify-center w-8">
                                    <input
                                        type="radio" name="correctAnswer"
                                        checked={opt.isCorrect}
                                        onChange={() => handleCorrectSelect(idx)}
                                        style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                                    />
                                </div>
                                <input
                                    value={opt.text}
                                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                                    placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                                    style={{ ...baseInputStyle, backgroundColor: opt.isCorrect ? C.successBg : C.surfaceWhite, borderColor: opt.isCorrect ? C.success : 'transparent' }}
                                    onFocus={onFocusHandler} onBlur={onBlurHandler}
                                />
                                {currentQuestion.options.length > 2 && (
                                    <button onClick={() => handleRemoveOption(idx)} className="w-10 h-10 flex items-center justify-center shrink-0 cursor-pointer transition-opacity hover:opacity-70 shadow-sm"
                                        style={{ backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, borderRadius: R.xl }}>
                                        <Trash size={16} color={C.danger} />
                                    </button>
                                )}
                            </div>
                        ))}
                        {currentQuestion.options.length < 6 && (
                            <div className="pl-12 pt-2">
                                <button onClick={handleAddOption} className="flex items-center justify-center gap-2 h-9 px-4 cursor-pointer bg-transparent hover:opacity-70"
                                    style={{ border: `1px dashed ${C.cardBorder}`, borderRadius: R.md, color: C.textMuted, fontSize: T.size.xs, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                                    <Plus size={14} /> Add Another Option
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <label style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>Points / Marks</label>
                            <input
                                type="number" min="1"
                                value={currentQuestion.points}
                                onChange={(e) => setCurrentQuestion({ ...currentQuestion, points: parseFloat(e.target.value) || 1 })}
                                style={baseInputStyle}
                                onFocus={onFocusHandler} onBlur={onBlurHandler}
                            />
                        </div>
                        <div className="space-y-3">
                            <label style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>Difficulty Level</label>
                            <select
                                value={currentQuestion.difficulty}
                                onChange={(e) => setCurrentQuestion({ ...currentQuestion, difficulty: e.target.value })}
                                style={baseInputStyle}
                                onFocus={onFocusHandler} onBlur={onBlurHandler}
                            >
                                <option value="easy">Easy</option>
                                <option value="medium">Medium</option>
                                <option value="hard">Hard</option>
                            </select>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <label style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>Explanation (Optional)</label>
                        <textarea
                            value={currentQuestion.explanation}
                            onChange={(e) => setCurrentQuestion({ ...currentQuestion, explanation: e.target.value })}
                            placeholder="Explain why the selected answer is correct..."
                            style={{ ...baseInputStyle, minHeight: '100px', resize: 'vertical' }}
                            onFocus={onFocusHandler} onBlur={onBlurHandler}
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-6" style={{ borderTop: `1px solid ${C.cardBorder}` }}>
                        <button onClick={() => setIsAddOpen(false)} className="h-11 px-6 cursor-pointer border-none bg-transparent hover:opacity-70"
                            style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                            Cancel
                        </button>
                        <button onClick={handleSaveQuestion} className="flex items-center justify-center h-11 px-8 gap-2 cursor-pointer border-none transition-opacity hover:opacity-90 shadow-md"
                            style={{ background: C.gradientBtn, color: '#ffffff', borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                            <Save size={16} />
                            {editingIndex >= 0 ? "Save Changes" : "Add to Quiz"}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Import from Bank Modal */}
         
<Modal isOpen={isBankOpen} onClose={() => setIsBankOpen(false)} title="Import from Question Bank" className="max-w-5xl">
    {/* 🌟 Andar wale div se wo lambi wali width classes HATA do */}
    <div className="space-y-5 flex flex-col p-1" style={{ backgroundColor: '#EAE8FA', padding: '24px', borderRadius: R['2xl'] }}>
                    <div className="flex gap-4 items-end shrink-0 p-4" style={{ backgroundColor: '#E3DFF8', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}` }}>
                        <div className="flex-1 space-y-2">
                            <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Search Questions</label>
                            <div className="relative">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" color={C.textMuted} />
                                <input
                                    placeholder="Type to search..."
                                    value={bankFilters.search || ''}
                                    onChange={(e) => setBankFilters({ ...bankFilters, search: e.target.value })}
                                    style={{ ...baseInputStyle, paddingLeft: '2.5rem', backgroundColor: C.surfaceWhite }}
                                    onFocus={onFocusHandler} onBlur={onBlurHandler}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Difficulty</label>
                            <select
                                value={bankFilters.difficulty}
                                onChange={(e) => setBankFilters({ ...bankFilters, difficulty: e.target.value })}
                                style={{ ...baseInputStyle, width: '150px', backgroundColor: C.surfaceWhite }}
                                onFocus={onFocusHandler} onBlur={onBlurHandler}
                            >
                                <option value="all">All Levels</option>
                                <option value="easy">Easy</option>
                                <option value="medium">Medium</option>
                                <option value="hard">Hard</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-[400px] shadow-sm custom-scrollbar" style={{ backgroundColor: C.surfaceWhite, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}` }}>
                        {bankLoading ? (
                            <div className="flex flex-col justify-center items-center min-h-[300px] gap-3">
                                <Loader2 size={32} className="animate-spin" color={C.textMuted} />
                                <p style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.textMuted }}>Loading bank...</p>
                            </div>
                        ) : (() => {
                            const searchFiltered = bankQuestions.filter(q => !bankFilters.search || q.question.toLowerCase().includes(bankFilters.search.toLowerCase()));
                            if (searchFiltered.length === 0) {
                                return (
                                    <div className="flex flex-col items-center justify-center min-h-[300px]">
                                        <Library size={48} color={C.textMuted} style={{ opacity: 0.2, marginBottom: '16px' }} />
                                        <p style={{ fontSize: T.size.base, fontWeight: T.weight.bold, color: C.textMuted }}>No matching questions found.</p>
                                    </div>
                                );
                            }
                            const grouped = searchFiltered.reduce((acc, q) => {
                                const topicName = q.topicId?.name || 'Uncategorized';
                                if (!acc[topicName]) acc[topicName] = [];
                                acc[topicName].push(q);
                                return acc;
                            }, {});
                            return Object.entries(grouped).map(([topicName, questions]) => (
                                <div key={topicName} className="overflow-hidden shadow-sm" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}` }}>
                                    <div className="px-5 py-4 flex items-center justify-between" style={{ backgroundColor: '#E3DFF8', borderBottom: `1px solid ${C.cardBorder}` }}>
                                        <div className="flex items-center gap-3">
                                            <span style={{ fontWeight: T.weight.black, color: C.heading }}>{topicName}</span>
                                            <span style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, backgroundColor: C.surfaceWhite, color: C.textMuted, padding: '2px 8px', borderRadius: R.md }}>{questions.length} items</span>
                                        </div>
                                        <button type="button" onClick={() => {
                                            const topicIds = questions.map(q => q._id);
                                            const allSelected = topicIds.every(id => selectedBankIds.includes(id));
                                            if (allSelected) setSelectedBankIds(selectedBankIds.filter(id => !topicIds.includes(id)));
                                            else setSelectedBankIds([...new Set([...selectedBankIds, ...topicIds])]);
                                        }} className="cursor-pointer border-none transition-opacity hover:opacity-80 px-3 py-1.5"
                                            style={{ fontSize: T.size.xs, color: C.btnPrimary, fontWeight: T.weight.black, textTransform: 'uppercase', letterSpacing: '0.5px', backgroundColor: C.surfaceWhite, borderRadius: R.md }}>
                                            {questions.every(q => selectedBankIds.includes(q._id)) ? 'Deselect All' : 'Select All'}
                                        </button>
                                    </div>
                                    <div>
                                        {questions.map((q) => (
                                            <div key={q._id} className="px-5 py-4 flex items-start gap-4 transition-colors hover:opacity-90" style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                                                <div className="pt-1">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedBankIds.includes(q._id)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) setSelectedBankIds([...selectedBankIds, q._id]);
                                                            else setSelectedBankIds(selectedBankIds.filter(id => id !== q._id));
                                                        }}
                                                        style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex gap-2 mb-2">
                                                        <span className="uppercase" style={{ fontSize: '10px', fontWeight: T.weight.black, padding: '2px 8px', borderRadius: R.md, backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, color: C.heading }}>{q.difficulty}</span>
                                                        <span className="uppercase" style={{ fontSize: '10px', fontWeight: T.weight.black, padding: '2px 8px', borderRadius: R.md, backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, color: C.textMuted }}>{(q.type || 'mcq')}</span>
                                                        <span style={{ fontSize: '10px', fontWeight: T.weight.black, padding: '2px 8px', borderRadius: R.md, backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, color: C.textMuted }}>{q.points || 1} Pts</span>
                                                    </div>
                                                    <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(q.question) }} style={{ fontSize: T.size.sm, fontWeight: T.weight.semibold, color: C.heading }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ));
                        })()}
                    </div>

                    <div className="flex justify-between items-center pt-5 shrink-0" style={{ borderTop: `1px solid ${C.cardBorder}` }}>
                        <span style={{ fontSize: T.size.sm, fontWeight: T.weight.black, color: C.heading, backgroundColor: C.surfaceWhite, padding: '8px 16px', borderRadius: R.xl, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                            <span style={{ color: C.btnPrimary }}>{selectedBankIds.length}</span> questions selected
                        </span>
                        <div className="flex gap-3">
                            <button onClick={() => { setIsBankOpen(false); setSelectedBankIds([]); }} className="h-11 px-6 cursor-pointer border-none bg-transparent hover:opacity-70"
                                style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                                Cancel
                            </button>
                            <button onClick={handleImportFromBank} disabled={selectedBankIds.length === 0} className="flex items-center justify-center h-11 px-8 gap-2 cursor-pointer border-none transition-opacity hover:opacity-90 shadow-md"
                                style={{ background: selectedBankIds.length > 0 ? C.gradientBtn : '#D3D3F1', color: selectedBankIds.length > 0 ? '#ffffff' : C.btnViewAllText, borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                                <Library size={16} /> Import to Quiz
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