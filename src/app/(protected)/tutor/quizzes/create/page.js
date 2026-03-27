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
    HelpCircle,
    Eye
} from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Textarea } from '@/components/ui/textarea';
import api from '@/lib/axios';
import { sanitizeHtml } from '@/lib/sanitize';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useConfirm } from '@/components/providers/ConfirmProvider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'react-hot-toast';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";
import AudienceSelector from '@/components/shared/AudienceSelector';
import useInstitute from '@/hooks/useInstitute';

const examDetailsSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    courseId: z.string().min(1, "Please select a course/category"),
    type: z.string(),
    duration: z.number().min(1, "Duration must be at least 1 minute"),
    passingMarks: z.number().min(0),
    description: z.string().optional(),
});

// 🔥 FIX: Custom Premium Switch Component (Guaranteed to show thumb and colors properly)
const CustomSwitch = ({ checked, onChange, color = 'orange' }) => {
    let bgClass = 'bg-slate-200';
    if (checked) {
        if (color === 'red') bgClass = 'bg-red-500';
        else if (color === 'blue') bgClass = 'bg-blue-500';
        else if (color === 'emerald') bgClass = 'bg-emerald-500';
        else if (color === 'indigo') bgClass = 'bg-indigo-500';
        else bgClass = 'bg-orange-500';
    }

    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className={cn(
                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2",
                bgClass
            )}
        >
            <span
                className={cn(
                    "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-300 ease-in-out",
                    checked ? "translate-x-5" : "translate-x-0"
                )}
            />
        </button>
    );
};

// ── Premium Wizard Steps ─────────────────────────────────────────────────────
const WizardSteps = ({ currentStep, steps, onStepClick }) => (
    <div className="flex items-center justify-center w-full mb-10 mt-4">
        <div className="flex items-center gap-2 md:gap-3 relative z-10 bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-100">
            {steps.map((step, idx) => {
                const isActive = currentStep === step.id;
                const isCompleted = steps.findIndex(s => s.id === currentStep) > idx;
                const isClickable = steps.findIndex(s => s.id === currentStep) >= idx;
                return (
                    <div key={step.id} className="flex items-center">
                        <button
                            onClick={() => isClickable && onStepClick(step.id)}
                            disabled={!isClickable}
                            className={cn(
                                "flex items-center gap-2.5 px-4 py-2.5 rounded-xl transition-all duration-300",
                                isActive
                                    ? "bg-slate-900 text-white shadow-md scale-105"
                                    : isCompleted
                                        ? "bg-slate-50 text-slate-700 hover:bg-slate-100"
                                        : "bg-transparent text-slate-400"
                            )}
                        >
                            <div className={cn(
                                "w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black tracking-wider transition-colors",
                                isActive ? "bg-white/20 text-white" : isCompleted ? "bg-slate-200 text-slate-700" : "bg-slate-100 text-slate-400"
                            )}>
                                {isCompleted ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                            </div>
                            <span className={cn("text-sm font-bold hidden md:inline-block", isActive || isCompleted ? "opacity-100" : "opacity-60")}>
                                {step.label}
                            </span>
                        </button>
                        {idx < steps.length - 1 && <div className={cn("w-6 h-[2px] mx-2 transition-colors duration-300", isCompleted ? "bg-slate-800" : "bg-slate-100")} />}
                    </div>
                );
            })}
        </div>
    </div>
);

// ── Rich Text Editor ──────────────────────────────────────────────────────────
const RichTextEditor = ({ value, onChange }) => {
    const editorRef = useRef(null);
    const execCommand = (command, value = null) => {
        document.execCommand(command, false, value);
        editorRef.current?.focus();
    };
    const handleInput = () => {
        if (editorRef.current) onChange(editorRef.current.innerHTML);
    };
    useEffect(() => {
        if (editorRef.current && value && editorRef.current.innerHTML === '') {
            editorRef.current.innerHTML = value;
        }
    }, []);

    return (
        <div className="border border-slate-200 rounded-xl bg-white overflow-hidden focus-within:ring-2 focus-within:ring-orange-500/20 focus-within:border-orange-400 transition-all hover:shadow-sm">
            <div className="flex items-center gap-1 p-2 border-b border-slate-100 bg-slate-50/80">
                {[['bold', Bold], ['italic', Italic], ['underline', Underline]].map(([cmd, Icon]) => (
                    <Button key={cmd} variant="ghost" size="sm" onClick={() => execCommand(cmd)} className="h-8 w-8 p-0 hover:bg-slate-200 text-slate-600"><Icon className="w-4 h-4" /></Button>
                ))}
                <div className="w-px h-4 bg-slate-300 mx-2" />
                <Button variant="ghost" size="sm" onClick={() => execCommand('insertUnorderedList')} className="h-8 w-8 p-0 hover:bg-slate-200 text-slate-600"><List className="w-4 h-4" /></Button>
                <Button variant="ghost" size="sm" onClick={() => execCommand('insertOrderedList')} className="h-8 w-8 p-0 hover:bg-slate-200 text-slate-600"><ListOrdered className="w-4 h-4" /></Button>
            </div>
            <div ref={editorRef} contentEditable className="min-h-[160px] p-5 outline-none prose prose-sm max-w-none text-slate-700 font-medium leading-relaxed" onInput={handleInput} />
        </div>
    );
};

// ── Shared Card Wrapper ───────────────────────────────────────────────────────
const StepCard = ({ children, className = '' }) => (
    <div className={cn("bg-white rounded-[24px] border border-slate-200 shadow-sm p-8 md:p-12", className)}>
        {children}
    </div>
);

function CreateExamPageClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const defaultType = searchParams.get('type') || 'quiz';
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
    const totalQuestionMarks = (examData.questions || []).reduce((sum, q) => sum + (q.points || 1), 0);
    const derivedPassingMarks = totalQuestionMarks > 0
        ? Number((((Number(examData.passingPercentage) || 0) / 100) * totalQuestionMarks).toFixed(2))
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
        if (currentQuestion.options.length < 6)
            setCurrentQuestion({ ...currentQuestion, options: [...currentQuestion.options, { text: '', isCorrect: false }] });
    };
    const handleRemoveOption = (idx) => {
        if (currentQuestion.options.length > 2)
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
        if (!currentQuestion.question || currentQuestion.question === '<br>') { toast.error("Question text is required"); return; }
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
        if (!aiParams.topic) { toast.error("Please enter a topic"); return; }
        setAiLoading(true);
        try {
            const res = await api.post('/ai/generate-questions', aiParams);
            if (res.data.success) {
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
                if (res.data.success) setCourses(res.data.courses);
            } catch (err) { toast.error("Failed to load courses"); }
        };
        const fetchTaxonomy = async () => {
            try {
                const [topicsRes, skillsRes] = await Promise.all([api.get('/taxonomy/topics'), api.get('/taxonomy/skills')]);
                if (topicsRes.data.success) setTopics(topicsRes.data.topics);
                if (skillsRes.data.success) setSkills(skillsRes.data.skills);
            } catch (err) { }
        };
        fetchCourses(); fetchTaxonomy();
    }, []);

    useEffect(() => {
        setExamData(prev => ({ ...prev, audience: { ...prev.audience, instituteId: prev.audience?.instituteId || institute?._id || null } }));
    }, [institute?._id]);

    useEffect(() => {
        const fetchAudienceTargets = async () => {
            if (!examData.courseId) { setAvailableBatches([]); setAvailableStudents([]); return; }
            try {
                const [batchesRes, studentsRes] = await Promise.all([api.get('/batches'), api.get(`/enrollments/students/${examData.courseId}`)]);
                const batchList = (batchesRes.data?.batches || []).filter(batch => (batch.courseId?._id || batch.courseId) === examData.courseId);
                setAvailableBatches(batchList);
                const studentList = (studentsRes.data?.students || []).map(item => ({ _id: item.studentId?._id, name: item.studentId?.name, email: item.studentId?.email })).filter(item => item._id);
                setAvailableStudents(studentList);
            } catch { setAvailableBatches([]); setAvailableStudents([]); }
        };
        fetchAudienceTargets();
    }, [examData.courseId]);

    const fetchBankQuestions = async () => {
        setBankLoading(true);
        try {
            const params = new URLSearchParams();
            if (bankFilters.difficulty !== 'all') params.append('difficulty', bankFilters.difficulty);
            if (bankFilters.topicId !== 'all') params.append('topicId', bankFilters.topicId);
            const res = await api.get(`/question-bank/questions?${params.toString()}`);
            if (res.data.success) setBankQuestions(res.data.questions);
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
            if (response.data.success) {
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
        } catch (error) { toast.error(error.response?.data?.message || "Failed to save exam"); }
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
        if (newStep === 'settings' && !examData.title) { toast.error("Please enter a title first"); return; }
        setActiveTab(newStep);
    };

    // 🔥 Premium Toggle Row Component
    const ToggleRow = ({ label, desc, keyName, color = 'orange', icon: Icon }) => (
        <div className="flex items-center justify-between bg-white border border-slate-100 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex gap-4 items-center">
                {Icon && (
                    <div className={`w-10 h-10 rounded-xl bg-${color}-50 border border-${color}-100 flex items-center justify-center shrink-0`}>
                        <Icon className={`w-5 h-5 text-${color}-500`} />
                    </div>
                )}
                <div className="space-y-1">
                    <Label className="text-base font-bold text-slate-800 cursor-pointer" htmlFor={keyName}>{label}</Label>
                    {desc && <p className="text-xs font-semibold text-slate-500 leading-snug pr-4">{desc}</p>}
                </div>
            </div>
            <CustomSwitch checked={examData[keyName]} onChange={(val) => setExamData({ ...examData, [keyName]: val })} color={color} />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20 font-sans">
            {/* Premium Sticky Header */}
            <div className="bg-white/80 backdrop-blur-xl sticky top-0 z-50 border-b border-slate-200 shadow-sm">
                <div className="max-w-6xl mx-auto px-6 h-[72px] flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/tutor/quizzes">
                            <button className="w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 hover:border-slate-300 transition-all group shadow-sm">
                                <ArrowLeft className="w-4 h-4 text-slate-600 group-hover:text-slate-900" />
                            </button>
                        </Link>
                        <div>
                            <h1 className="text-xl font-black text-slate-900 tracking-tight">
                                {examId ? 'Edit Assessment' : 'Create New Assessment'}
                            </h1>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest hidden sm:block">Configuration Wizard</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" className="hidden sm:flex border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-bold h-10 px-5"
                            onClick={() => handleSaveAndProceed({ status: 'draft', shouldRedirect: true })}>
                            Save Draft
                        </Button>
                        <Button onClick={() => handleSaveAndProceed({ status: 'draft' })} disabled={saving}
                            className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-md h-10 px-6 font-bold">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save & Continue'}
                        </Button>
                    </div>
                </div>
            </div>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
                <WizardSteps currentStep={activeTab} steps={steps} onStepClick={handleStepChange} />

                <AnimatePresence mode="wait">
                    {/* ── STEP 1: Details ──────────────────────────────── */}
                    {activeTab === 'details' && (
                        <motion.div key="details" variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3, ease: "easeOut" }}>
                            <StepCard>
                                <div className="max-w-3xl mx-auto space-y-8">
                                    <div className="text-center mb-8">
                                        <h2 className="text-2xl font-black text-slate-800">Basic Information</h2>
                                        <p className="text-sm font-semibold text-slate-500 mt-1">Start by providing the fundamental details of your assessment.</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2.5">
                                            <Label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Assessment Title <span className="text-red-500">*</span></Label>
                                            <div className="relative group">
                                                <Input placeholder="e.g. Advanced Thermodynamics" value={examData.title}
                                                    onChange={(e) => setExamData({ ...examData, title: e.target.value })}
                                                    className={cn("h-14 pl-12 text-base font-semibold border-slate-200 focus:border-slate-800 focus:ring-slate-800/10 rounded-xl bg-slate-50 focus:bg-white transition-all", errors.title && 'border-red-400')} />
                                                <Type className="absolute left-4 top-4 w-5 h-5 text-slate-400 transition-colors group-focus-within:text-slate-800" />
                                            </div>
                                            {errors.title && <p className="text-xs font-bold text-red-500 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{errors.title[0]}</p>}
                                        </div>
                                        <div className="space-y-2.5">
                                            <Label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Category / Course <span className="text-red-500">*</span></Label>
                                            <Select value={examData.courseId} onValueChange={(val) => setExamData({ ...examData, courseId: val })}>
                                                <SelectTrigger className={cn("h-14 font-semibold border-slate-200 rounded-xl focus:border-slate-800 bg-slate-50 focus:bg-white transition-all", errors.courseId && 'border-red-400')}>
                                                    <SelectValue placeholder="Select associated course" />
                                                </SelectTrigger>
                                                <SelectContent className="font-semibold text-slate-700">
                                                    {courses.map(c => <SelectItem key={c._id} value={c._id}>{c.title}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="space-y-2.5">
                                        <Label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Detailed Description</Label>
                                        <RichTextEditor value={examData.description} onChange={(html) => setExamData({ ...examData, description: html })} />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="space-y-2.5">
                                            <Label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Assessment Type</Label>
                                            <Select value={examData.type} onValueChange={(val) => setExamData({ ...examData, type: val })}>
                                                <SelectTrigger className="h-12 font-semibold border-slate-200 rounded-xl bg-slate-50"><SelectValue /></SelectTrigger>
                                                <SelectContent className="font-semibold">
                                                    <SelectItem value="quiz">Quiz</SelectItem>
                                                    <SelectItem value="assessment">Assessment</SelectItem>
                                                    <SelectItem value="practice">Practice Set</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2.5">
                                            <Label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Duration (Mins)</Label>
                                            <div className="relative">
                                                <Input type="number" min="1" value={examData.duration}
                                                    onChange={(e) => setExamData({ ...examData, duration: parseInt(e.target.value) || 0 })}
                                                    className="h-12 font-semibold border-slate-200 pl-10 rounded-xl bg-slate-50" />
                                                <Clock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                                            </div>
                                        </div>
                                        <div className="space-y-2.5">
                                            <Label className="text-sm font-bold text-slate-700 uppercase tracking-wider">Passing Marks</Label>
                                            <div className="h-12 flex items-center px-4 bg-slate-100 border border-slate-200 rounded-xl">
                                                <span className="font-black text-slate-700">{derivedPassingMarks}</span>
                                                <span className="text-xs font-bold text-slate-400 ml-auto">Auto-calculated</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-slate-100">
                                        <Label className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 block">Access & Enrollment</Label>
                                        <div className="flex items-center justify-between p-5 rounded-2xl bg-emerald-50 border border-emerald-200 shadow-sm mb-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-full bg-white border border-emerald-100 flex items-center justify-center shadow-sm">
                                                    <Sparkles className="w-5 h-5 text-emerald-500" />
                                                </div>
                                                <div>
                                                    <h3 className="font-black text-emerald-900 text-base">Make it Free</h3>
                                                    <p className="text-xs font-semibold text-emerald-700 mt-0.5">Allow any student to access without prior enrollment</p>
                                                </div>
                                            </div>
                                            <CustomSwitch checked={examData.isFree} onChange={(val) => setExamData({ ...examData, isFree: val })} color="emerald" />
                                        </div>
                                        <AudienceSelector value={examData.audience} onChange={(audience) => setExamData({ ...examData, audience })}
                                            availableBatches={availableBatches} availableStudents={availableStudents}
                                            allowGlobal={Boolean(!institute?._id || institute?.features?.allowGlobalPublishingByInstituteTutors)}
                                            instituteId={institute?._id || null} />
                                    </div>

                                    <div className="flex justify-end pt-6 border-t border-slate-100">
                                        <Button onClick={handleSaveAndProceed} className="h-12 px-8 bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-md font-bold gap-2 transition-transform hover:-translate-y-0.5">
                                            Continue to Configuration <ChevronRight className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </StepCard>
                        </motion.div>
                    )}

                    {/* ── STEP 2: Settings ─────────────────────────────── */}
                    {activeTab === 'settings' && (
                        <motion.div key="settings" variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3, ease: "easeOut" }}>
                            <StepCard>
                                <div className="max-w-4xl mx-auto space-y-10">
                                    <div className="text-center mb-10">
                                        <h2 className="text-2xl font-black text-slate-800">Exam Configuration</h2>
                                        <p className="text-sm font-semibold text-slate-500 mt-1">Setup rules, scoring, and high-level security for this assessment.</p>
                                    </div>

                                    {/* Security Section (Most Important) */}
                                    <div className="bg-red-50/30 rounded-3xl p-6 border border-red-100 shadow-sm">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-10 h-10 rounded-xl bg-red-100 border border-red-200 flex items-center justify-center shadow-sm">
                                                <ShieldCheck className="w-5 h-5 text-red-600" />
                                            </div>
                                            <div>
                                                <h2 className="text-lg font-black text-slate-800">Advanced Security & Integrity</h2>
                                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Industry-level Proctoring</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                            <ToggleRow icon={Eye} label="Visual AI Proctoring" desc="Requires webcam. Flags absence & multiple faces." keyName="isProctoringEnabled" color="red" />
                                            <ToggleRow icon={Mic} label="Audio & Gaze Proctoring" desc="Requires mic. Flags noise & looking away/down." keyName="isAudioProctoringEnabled" color="red" />
                                            <div className="lg:col-span-2">
                                                <ToggleRow icon={Layout} label="Strict Environment Lock" desc="Aggressively tracks and flags tab switching or minimizing the browser." keyName="strictTabSwitching" color="red" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                                                <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                                                    <Clock className="w-4 h-4 text-blue-600" />
                                                </div>
                                                <h3 className="font-black text-slate-800 text-base">Scoring Rules</h3>
                                            </div>
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between bg-white border border-slate-100 p-4 rounded-xl shadow-sm">
                                                    <Label className="text-base font-bold text-slate-800">Required Pass Percentage</Label>
                                                    <div className="relative w-28">
                                                        <Input type="number" min="0" max="100" value={examData.passingPercentage}
                                                            onChange={(e) => setExamData({ ...examData, passingPercentage: parseInt(e.target.value) || 0 })}
                                                            className="pr-8 h-10 font-black text-center border-slate-200 bg-slate-50 focus:bg-white" />
                                                        <span className="absolute right-3 top-2.5 text-slate-400 font-bold">%</span>
                                                    </div>
                                                </div>
                                                <ToggleRow icon={AlertCircle} label="Negative Marking" desc="Deduct points for incorrect answers" keyName="negativeMarking" color="blue" />
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                                                <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                                                    <BrainCircuit className="w-4 h-4 text-emerald-600" />
                                                </div>
                                                <h3 className="font-black text-slate-800 text-base">Exam Experience</h3>
                                            </div>
                                            <div className="space-y-3">
                                                <ToggleRow icon={List} label="Shuffle Questions" desc="Randomize question sequence" keyName="shuffleQuestions" color="emerald" />
                                                <ToggleRow icon={ListOrdered} label="Shuffle Options" desc="Randomize A, B, C, D choices" keyName="shuffleOptions" color="emerald" />
                                            </div>
                                        </div>

                                        <div className="space-y-6 md:col-span-2">
                                            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                                                <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center">
                                                    <Layout className="w-4 h-4 text-orange-600" />
                                                </div>
                                                <h3 className="font-black text-slate-800 text-base">Post-Exam Review</h3>
                                            </div>
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                <ToggleRow label="Show Results Instantly" desc="Display score immediately after submit" keyName="showResultImmediately" color="orange" />
                                                <ToggleRow label="Show Correct Answers" desc="Reveal correct options during review" keyName="showCorrectAnswers" color="orange" />
                                                <ToggleRow label="Hide Detailed Solutions" desc="Do not show explanations to students" keyName="hideSolutions" color="orange" />
                                                <div className="space-y-3">
                                                    <ToggleRow label="Allow Multiple Attempts" desc="Let students retake the exam" keyName="allowRetake" color="orange" />
                                                    <AnimatePresence>
                                                        {examData.allowRetake && (
                                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                                                <div className="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-xl mt-2">
                                                                    <Label className="text-sm font-bold text-orange-900">Maximum Allowed Attempts</Label>
                                                                    <Input type="number" min="1" value={examData.maxAttempts}
                                                                        onChange={(e) => setExamData({ ...examData, maxAttempts: parseInt(e.target.value) || 1 })}
                                                                        className="w-24 h-9 text-center font-black bg-white border-orange-200 focus:border-orange-400" />
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-between pt-8 border-t border-slate-100 mt-10">
                                        <Button variant="ghost" onClick={() => setActiveTab('details')} className="text-slate-500 font-bold h-12 px-6">Go Back</Button>
                                        <Button onClick={handleSaveAndProceed} className="h-12 px-8 bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-md font-bold gap-2 transition-transform hover:-translate-y-0.5">
                                            Setup Questions <ChevronRight className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </StepCard>
                        </motion.div>
                    )}

                    {/* ── STEP 3: Questions ────────────────────────────── */}
                    {activeTab === 'questions' && (
                        <motion.div key="questions" variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3, ease: "easeOut" }}>
                            <StepCard>
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 pb-6 border-b border-slate-100">
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                                            Questions Setup
                                            <span className="bg-slate-900 text-white text-sm py-1 px-3 rounded-full font-black shadow-sm">{examData.questions.length}</span>
                                        </h2>
                                        <p className="text-sm font-semibold text-slate-500 mt-1">Manually author questions or use AI to generate them instantly.</p>
                                    </div>
                                    <div className="flex gap-3 w-full md:w-auto flex-wrap">
                                        <Button variant="outline" onClick={() => setIsAIOpen(true)} className="gap-2 text-indigo-600 border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300 font-bold h-11 px-5 rounded-xl transition-all shadow-sm">
                                            <Sparkles className="w-4 h-4" /> AI Generate
                                        </Button>
                                        <Button variant="outline" onClick={() => setIsBankOpen(true)} className="gap-2 text-slate-700 border-slate-200 hover:bg-slate-50 font-bold h-11 px-5 rounded-xl shadow-sm">
                                            <Library className="w-4 h-4" /> Import
                                        </Button>
                                        <Button onClick={() => { resetQuestionForm(); setIsAddOpen(true); }} className="gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold h-11 px-5 rounded-xl shadow-md transition-transform hover:-translate-y-0.5">
                                            <Plus className="w-4 h-4" /> Add Manual
                                        </Button>
                                    </div>
                                </div>

                                {examData.questions.length === 0 ? (
                                    <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-[24px] bg-slate-50 flex flex-col items-center">
                                        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6 border border-slate-100">
                                            <HelpCircle className="w-8 h-8 text-slate-400" />
                                        </div>
                                        <h3 className="text-lg font-black text-slate-800 mb-2">The question bank is empty</h3>
                                        <p className="text-sm font-semibold text-slate-500 mb-8 max-w-sm">Build your assessment by adding questions manually, pulling from the bank, or let AI do the heavy lifting.</p>
                                        <Button onClick={() => setIsAIOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 font-bold rounded-xl h-12 px-8 gap-2">
                                            <Sparkles className="w-4 h-4" /> Auto-Generate with AI
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {examData.questions.map((q, idx) => (
                                            <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all group relative">
                                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white p-1 rounded-lg shadow-sm border border-slate-100">
                                                    <button onClick={() => handleEditQuestion(idx)} className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-slate-100 transition-colors">
                                                        <Edit className="w-4 h-4 text-slate-600" />
                                                    </button>
                                                    <button onClick={() => handleDeleteQuestion(idx)} className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-red-50 transition-colors">
                                                        <Trash className="w-4 h-4 text-red-500" />
                                                    </button>
                                                </div>
                                                <div className="flex gap-4">
                                                    <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 font-black text-sm flex items-center justify-center shrink-0 shadow-sm">{idx + 1}</div>
                                                    <div className="flex-1 pr-20">
                                                        <div className="flex items-center gap-3 mb-3">
                                                            <span className={cn(
                                                                "text-[10px] px-2.5 py-1 rounded-md font-black uppercase tracking-wider",
                                                                q.difficulty === 'hard' ? 'bg-red-50 text-red-600 border border-red-100' : 
                                                                q.difficulty === 'medium' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 
                                                                'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                            )}>{q.difficulty}</span>
                                                            <span className="text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-500 border border-slate-200 px-2.5 py-1 rounded-md">{q.points} Point{q.points>1?'s':''}</span>
                                                        </div>
                                                        <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(q.question) }} className="font-bold text-slate-800 mb-5 prose prose-base max-w-none line-clamp-3" />
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                            {q.options.map((opt, i) => (
                                                                <div key={i} className={cn("text-sm p-3 rounded-xl border-2 flex items-center gap-3 transition-colors", opt.isCorrect ? 'bg-emerald-50/50 border-emerald-500 text-emerald-900 font-bold' : 'bg-white border-slate-100 text-slate-600 font-medium')}>
                                                                    <span className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 border-2", opt.isCorrect ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-200 bg-slate-50 text-slate-400')}>{String.fromCharCode(65 + i)}</span>
                                                                    <span className="flex-1 truncate">{opt.text}</span>
                                                                    {opt.isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="flex justify-between pt-8 border-t border-slate-100 mt-10">
                                    <Button variant="ghost" onClick={() => setActiveTab('settings')} className="text-slate-500 font-bold h-12 px-6">Go Back</Button>
                                    <Button onClick={handleSaveAndProceed} className="h-12 px-8 bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-md font-bold gap-2 transition-transform hover:-translate-y-0.5">
                                        Finalize Schedule <ChevronRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            </StepCard>
                        </motion.div>
                    )}

                    {/* ── STEP 4: Schedule ─────────────────────────────── */}
                    {activeTab === 'schedules' && (
                        <motion.div key="schedules" variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3, ease: "easeOut" }}>
                            <StepCard>
                                <div className="max-w-3xl mx-auto space-y-10">
                                    <div className="text-center mb-8">
                                        <h2 className="text-2xl font-black text-slate-800">Publish & Availability</h2>
                                        <p className="text-sm font-semibold text-slate-500 mt-1">Decide when students can view and attempt this assessment.</p>
                                    </div>

                                    <div className="bg-white border border-slate-200 p-8 rounded-[24px] shadow-sm">
                                        <div className="flex items-start justify-between mb-8 pb-6 border-b border-slate-100">
                                            <div className="flex gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                                                    <Calendar className="w-6 h-6 text-indigo-600" />
                                                </div>
                                                <div>
                                                    <Label className="text-lg font-black text-slate-800">Strict Time Window</Label>
                                                    <p className="text-sm font-semibold text-slate-500 mt-1 max-w-sm">Enable this to lock the exam outside of the specified start and end dates.</p>
                                                </div>
                                            </div>
                                            <CustomSwitch checked={examData.isScheduled} onChange={(val) => setExamData({ ...examData, isScheduled: val })} color="indigo" />
                                        </div>

                                        <AnimatePresence>
                                            {examData.isScheduled ? (
                                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                                        <div className="space-y-2">
                                                            <Label className="text-xs font-black text-slate-500 uppercase tracking-widest">Opening Time</Label>
                                                            <Input type="datetime-local" value={examData.startDate ? new Date(examData.startDate).toISOString().slice(0, 16) : ''}
                                                                onChange={(e) => setExamData({ ...examData, startDate: e.target.value })}
                                                                className="h-14 font-bold text-slate-800 border-slate-200 rounded-xl focus:border-indigo-400 bg-white" />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-xs font-black text-slate-500 uppercase tracking-widest">Closing Time</Label>
                                                            <Input type="datetime-local" value={examData.endDate ? new Date(examData.endDate).toISOString().slice(0, 16) : ''}
                                                                onChange={(e) => setExamData({ ...examData, endDate: e.target.value })}
                                                                className="h-14 font-bold text-slate-800 border-slate-200 rounded-xl focus:border-indigo-400 bg-white" />
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ) : (
                                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                                    <div className="mt-4 p-5 bg-emerald-50 text-emerald-900 rounded-2xl flex items-center gap-4 border border-emerald-200 shadow-sm">
                                                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0">
                                                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-black text-base mb-0.5">Always Open</h4>
                                                            <p className="text-sm font-semibold text-emerald-700">Once published, students can access this quiz immediately and anytime.</p>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    <div className="flex justify-between pt-8 border-t border-slate-100 mt-10">
                                        <Button variant="ghost" onClick={() => setActiveTab('questions')} className="text-slate-500 font-bold h-12 px-6">Go Back</Button>
                                        <Button onClick={() => handleSaveAndProceed({ status: 'published', shouldRedirect: true })} disabled={saving}
                                            className="h-12 px-10 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl shadow-lg shadow-emerald-200 gap-3 transition-transform hover:-translate-y-0.5 text-base">
                                            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5" />}
                                            Publish Assessment
                                        </Button>
                                    </div>
                                </div>
                            </StepCard>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* AI Modal */}
            <Modal isOpen={isAIOpen} onClose={() => setIsAIOpen(false)} title="Generate Questions with AI" className="sm:max-w-md">
                <div className="space-y-6 p-2">
                    <div className="space-y-3">
                        <Label className="text-sm font-bold text-slate-700">Topic or Subject</Label>
                        <Input placeholder="e.g. Newton's Laws of Motion" value={aiParams.topic} onChange={(e) => setAiParams({ ...aiParams, topic: e.target.value })} className="h-12 border-slate-200 focus:border-indigo-400 font-medium rounded-xl" />
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-3">
                            <Label className="text-sm font-bold text-slate-700">Number of Questions</Label>
                            <Input type="number" min="1" max="20" value={aiParams.count} onChange={(e) => setAiParams({ ...aiParams, count: parseInt(e.target.value) || 5 })} className="h-12 border-slate-200 rounded-xl font-medium" />
                        </div>
                        <div className="space-y-3">
                            <Label className="text-sm font-bold text-slate-700">Difficulty</Label>
                            <Select value={aiParams.difficulty} onValueChange={(val) => setAiParams({ ...aiParams, difficulty: val })}>
                                <SelectTrigger className="h-12 border-slate-200 rounded-xl font-medium"><SelectValue /></SelectTrigger>
                                <SelectContent className="font-medium">
                                    <SelectItem value="easy">Easy</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="hard">Hard</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <Button onClick={handleAIGenerate} disabled={aiLoading} className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md gap-2 mt-4">
                        {aiLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                        Generate Now
                    </Button>
                </div>
            </Modal>

            {/* Add/Edit Question Modal */}
            <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title={editingIndex >= 0 ? "Edit Question" : "Add New Question"} className="max-w-4xl">
                <div className="space-y-6 max-h-[80vh] overflow-y-auto p-1 custom-scrollbar">
                    <div className="space-y-3">
                        <Label className="text-sm font-bold text-slate-700">Question Content</Label>
                        <RichTextEditor value={currentQuestion.question} onChange={(html) => setCurrentQuestion({ ...currentQuestion, question: html })} />
                    </div>
                    <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                        <Label className="text-sm font-bold text-slate-800">Answer Options</Label>
                        {currentQuestion.options.map((opt, idx) => (
                            <div key={idx} className="flex items-center gap-4">
                                <div className="flex items-center justify-center w-8">
                                    <input type="radio" name="correctAnswer" checked={opt.isCorrect} onChange={() => handleCorrectSelect(idx)} className="w-5 h-5 text-emerald-500 focus:ring-emerald-500 border-slate-300" />
                                </div>
                                <Input value={opt.text} onChange={(e) => handleOptionChange(idx, e.target.value)} placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                                    className={cn("flex-1 h-12 rounded-xl font-medium transition-all", opt.isCorrect ? 'border-emerald-400 bg-emerald-50/30 ring-1 ring-emerald-200' : 'border-slate-200 bg-white')} />
                                {currentQuestion.options.length > 2 && (
                                    <button onClick={() => handleRemoveOption(idx)} className="w-10 h-10 rounded-xl flex items-center justify-center bg-white border border-slate-200 hover:bg-red-50 hover:border-red-200 transition-colors shrink-0 shadow-sm">
                                        <Trash className="w-4 h-4 text-red-500" />
                                    </button>
                                )}
                            </div>
                        ))}
                        {currentQuestion.options.length < 6 && (
                            <div className="pl-12 pt-2">
                                <Button variant="outline" size="sm" onClick={handleAddOption} className="text-xs font-bold gap-2 border-dashed border-slate-300 text-slate-600 rounded-lg h-9">
                                    <Plus className="w-3.5 h-3.5" /> Add Another Option
                                </Button>
                            </div>
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <Label className="text-sm font-bold text-slate-700">Points / Marks</Label>
                            <Input type="number" min="1" value={currentQuestion.points} onChange={(e) => setCurrentQuestion({ ...currentQuestion, points: parseFloat(e.target.value) || 1 })} className="h-12 border-slate-200 rounded-xl font-bold" />
                        </div>
                        <div className="space-y-3">
                            <Label className="text-sm font-bold text-slate-700">Difficulty Level</Label>
                            <Select value={currentQuestion.difficulty} onValueChange={(val) => setCurrentQuestion({ ...currentQuestion, difficulty: val })}>
                                <SelectTrigger className="h-12 border-slate-200 rounded-xl font-bold"><SelectValue /></SelectTrigger>
                                <SelectContent className="font-bold">
                                    <SelectItem value="easy">Easy</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="hard">Hard</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <Label className="text-sm font-bold text-slate-700">Explanation (Optional)</Label>
                        <Textarea value={currentQuestion.explanation} onChange={(e) => setCurrentQuestion({ ...currentQuestion, explanation: e.target.value })} placeholder="Explain why the selected answer is correct..." className="min-h-[100px] border-slate-200 rounded-xl resize-y p-4 font-medium" />
                    </div>
                    <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                        <Button variant="ghost" onClick={() => setIsAddOpen(false)} className="font-bold h-11 px-6 rounded-xl">Cancel</Button>
                        <Button onClick={handleSaveQuestion} className="bg-slate-900 hover:bg-slate-800 text-white font-bold h-11 px-8 rounded-xl shadow-md gap-2">
                            <Save className="w-4 h-4" />
                            {editingIndex >= 0 ? "Save Changes" : "Add to Quiz"}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Import from Bank Modal */}
            <Modal isOpen={isBankOpen} onClose={() => setIsBankOpen(false)} title="Import from Question Bank" className="max-w-5xl">
                <div className="space-y-5 max-h-[85vh] flex flex-col p-1">
                    <div className="flex gap-4 items-end shrink-0 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <div className="flex-1 space-y-2">
                            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Search Questions</Label>
                            <div className="relative">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input placeholder="Type to search..." className="pl-10 h-11 border-slate-200 rounded-xl font-medium bg-white" value={bankFilters.search || ''} onChange={(e) => setBankFilters({ ...bankFilters, search: e.target.value })} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Difficulty</Label>
                            <Select value={bankFilters.difficulty} onValueChange={(val) => setBankFilters({ ...bankFilters, difficulty: val })}>
                                <SelectTrigger className="w-[150px] h-11 border-slate-200 rounded-xl font-medium bg-white"><SelectValue placeholder="All Levels" /></SelectTrigger>
                                <SelectContent className="font-medium">
                                    <SelectItem value="all">All Levels</SelectItem>
                                    <SelectItem value="easy">Easy</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="hard">Hard</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto rounded-2xl bg-white border border-slate-200 p-5 space-y-4 min-h-[400px] shadow-sm custom-scrollbar">
                        {bankLoading ? (
                            <div className="flex flex-col justify-center items-center min-h-[300px] gap-3">
                                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                                <p className="text-sm font-bold text-slate-500">Loading bank...</p>
                            </div>
                        ) : (() => {
                            const searchFiltered = bankQuestions.filter(q => !bankFilters.search || q.question.toLowerCase().includes(bankFilters.search.toLowerCase()));
                            if (searchFiltered.length === 0) {
                                return (
                                    <div className="flex flex-col items-center justify-center min-h-[300px] text-slate-400">
                                        <Library className="w-12 h-12 mb-4 opacity-20" />
                                        <p className="text-base font-bold text-slate-500">No matching questions found.</p>
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
                                <div key={topicName} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                                    <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="font-black text-slate-800">{topicName}</span>
                                            <span className="text-xs font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md">{questions.length} items</span>
                                        </div>
                                        <button type="button" onClick={() => {
                                            const topicIds = questions.map(q => q._id);
                                            const allSelected = topicIds.every(id => selectedBankIds.includes(id));
                                            if (allSelected) setSelectedBankIds(selectedBankIds.filter(id => !topicIds.includes(id)));
                                            else setSelectedBankIds([...new Set([...selectedBankIds, ...topicIds])]);
                                        }} className="text-xs text-[var(--theme-primary)] hover:underline font-black uppercase tracking-wider bg-[var(--theme-primary)]/10 px-3 py-1.5 rounded-lg">
                                            {questions.every(q => selectedBankIds.includes(q._id)) ? 'Deselect All' : 'Select All'}
                                        </button>
                                    </div>
                                    <div className="divide-y divide-slate-100">
                                        {questions.map((q) => (
                                            <div key={q._id} className="px-5 py-4 flex items-start gap-4 hover:bg-slate-50/50 transition-colors">
                                                <div className="pt-1">
                                                    <input type="checkbox" checked={selectedBankIds.includes(q._id)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) setSelectedBankIds([...selectedBankIds, q._id]);
                                                            else setSelectedBankIds(selectedBankIds.filter(id => id !== q._id));
                                                        }}
                                                        className="w-5 h-5 rounded border-slate-300 text-[var(--theme-primary)] focus:ring-[var(--theme-primary)] cursor-pointer" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex gap-2 mb-2">
                                                        <span className={cn("text-[10px] px-2 py-0.5 rounded-md font-black uppercase tracking-wider", q.difficulty === 'hard' ? 'bg-red-50 text-red-600 border border-red-100' : q.difficulty === 'easy' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-yellow-50 text-yellow-600 border border-yellow-100')}>{q.difficulty}</span>
                                                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-bold border border-slate-200">{(q.type || 'mcq').toUpperCase()}</span>
                                                        <span className="text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md">{q.points || 1} Pts</span>
                                                    </div>
                                                    <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(q.question) }} className="text-sm font-semibold text-slate-800 line-clamp-2 prose prose-sm max-w-none" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ));
                        })()}
                    </div>

                    <div className="flex justify-between items-center pt-5 shrink-0 border-t border-slate-200">
                        <span className="text-sm font-black text-slate-700 bg-slate-100 px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                            <span className="text-[var(--theme-primary)]">{selectedBankIds.length}</span> questions selected
                        </span>
                        <div className="flex gap-3">
                            <Button variant="ghost" onClick={() => { setIsBankOpen(false); setSelectedBankIds([]); }} className="font-bold rounded-xl px-6 h-11">Cancel</Button>
                            <Button onClick={handleImportFromBank} disabled={selectedBankIds.length === 0} className="bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl px-8 h-11 gap-2 shadow-md">
                                <Library className="w-4 h-4" /> Import to Quiz
                            </Button>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

export default function CreateExamPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-50/50" />}>
            <CreateExamPageClient />
        </Suspense>
    );
}