'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    ArrowLeft, Bold, Italic, Underline, List, ListOrdered,
    Image as ImageIcon, Link as LinkIcon, Loader2, CheckCircle2,
    AlertCircle, Plus, Trash, Edit, BrainCircuit, X, Check,
    Calendar, Clock, Settings, ChevronRight, Save, Sparkles,
    Layout, Type, UploadCloud, Library, Search
} from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Textarea } from '@/components/ui/textarea';
import api from '@/lib/axios';
import { sanitizeHtml } from '@/lib/sanitize';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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

// ── Wizard Steps ─────────────────────────────────────────────────────────────
const WizardSteps = ({ currentStep, steps, onStepClick }) => (
    <div className="flex items-center justify-center w-full mb-8">
        <div className="flex items-center gap-2 md:gap-4 relative z-10">
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
                                "flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 border",
                                isActive
                                    ? "bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-200 scale-105"
                                    : isCompleted
                                        ? "bg-white text-orange-500 border-orange-200 hover:bg-orange-50"
                                        : "bg-white text-slate-400 border-slate-200"
                            )}
                        >
                            <div className={cn(
                                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                                isActive ? "bg-white/20 text-white" : isCompleted ? "bg-orange-100 text-orange-600" : "bg-slate-100 text-slate-500"
                            )}>
                                {isCompleted ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                            </div>
                            <span className={cn("text-sm font-semibold hidden md:inline-block", isActive || isCompleted ? "opacity-100" : "opacity-60")}>
                                {step.label}
                            </span>
                        </button>
                        {idx < steps.length - 1 && <div className="w-8 h-0.5 bg-slate-200 mx-2 md:mx-4" />}
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
            <div className="flex items-center gap-1 p-2 border-b border-slate-100 bg-slate-50/50">
                {[['bold', Bold], ['italic', Italic], ['underline', Underline]].map(([cmd, Icon]) => (
                    <Button key={cmd} variant="ghost" size="sm" onClick={() => execCommand(cmd)} className="h-8 w-8 p-0 hover:bg-orange-50 text-slate-600 hover:text-orange-600"><Icon className="w-4 h-4" /></Button>
                ))}
                <div className="w-px h-4 bg-slate-300 mx-1" />
                <Button variant="ghost" size="sm" onClick={() => execCommand('insertUnorderedList')} className="h-8 w-8 p-0 hover:bg-orange-50 text-slate-600 hover:text-orange-600"><List className="w-4 h-4" /></Button>
                <Button variant="ghost" size="sm" onClick={() => execCommand('insertOrderedList')} className="h-8 w-8 p-0 hover:bg-orange-50 text-slate-600 hover:text-orange-600"><ListOrdered className="w-4 h-4" /></Button>
                <div className="w-px h-4 bg-slate-300 mx-1" />
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-300 cursor-not-allowed"><ImageIcon className="w-4 h-4" /></Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-300 cursor-not-allowed"><LinkIcon className="w-4 h-4" /></Button>
            </div>
            <div ref={editorRef} contentEditable className="min-h-[150px] p-4 outline-none prose prose-sm max-w-none text-slate-700 font-medium" onInput={handleInput} />
        </div>
    );
};

// ── Card wrapper shared style ─────────────────────────────────────────────────
const StepCard = ({ children, className = '' }) => (
    <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-8 md:p-10 ${className}`}>
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
        negativeMarking: false, isScheduled: false, startDate: '', endDate: '',
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
                toast.success(status === 'published' ? "Quiz published successfully!" : "Changes saved!");
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
        enter: { opacity: 0, x: 20 },
        center: { zIndex: 1, x: 0, opacity: 1 },
        exit: { opacity: 0, x: -20, zIndex: 0 }
    };

    const steps = [
        { id: 'details', label: 'Quiz Details' },
        { id: 'settings', label: 'Configuration' },
        { id: 'questions', label: 'Questions' },
        { id: 'schedules', label: 'Schedule' }
    ];

    const handleStepChange = (newStep) => {
        if (newStep === 'settings' && !examData.title) { toast.error("Please enter a title first"); return; }
        setActiveTab(newStep);
    };

    // Shared toggle row
    const ToggleRow = ({ label, desc, keyName, color = 'orange' }) => (
        <div className="flex items-center justify-between">
            <div className="space-y-0.5">
                <Label className="text-sm font-medium text-slate-700 cursor-pointer" htmlFor={keyName}>{label}</Label>
                {desc && <p className="text-xs text-slate-500">{desc}</p>}
            </div>
            <Switch id={keyName} checked={examData[keyName]} onCheckedChange={(checked) => setExamData({ ...examData, [keyName]: checked })}
                className={`data-[state=checked]:bg-${color}-500`} />
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50/50 pb-20">
            {/* Sticky Header */}
            <div className="bg-white/95 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100 shadow-sm">
                <div className="max-w-6xl mx-auto px-6 h-[60px] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/tutor/quizzes">
                            <button className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors group">
                                <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:text-orange-500" />
                            </button>
                        </Link>
                        <h1 className="text-base font-bold text-slate-800">
                            {examId ? 'Edit Quiz' : 'Create New Quiz'}
                        </h1>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="hidden sm:flex border-slate-200 text-slate-600 text-xs"
                            onClick={() => handleSaveAndProceed({ status: 'draft', shouldRedirect: true })}>
                            Save Draft
                        </Button>
                        <Button size="sm" onClick={() => handleSaveAndProceed({ status: 'draft' })} disabled={saving}
                            className="bg-orange-500 hover:bg-orange-600 text-white shadow-sm shadow-orange-200 text-xs">
                            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save & Continue'}
                        </Button>
                    </div>
                </div>
            </div>

            <main className="max-w-5xl mx-auto px-6 py-8">
                <WizardSteps currentStep={activeTab} steps={steps} onStepClick={handleStepChange} />

                <AnimatePresence mode="wait">
                    {/* ── STEP 1: Details ──────────────────────────────── */}
                    {activeTab === 'details' && (
                        <motion.div key="details" variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25, ease: "easeInOut" }}>
                            <StepCard>
                                <div className="max-w-3xl mx-auto space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-sm font-semibold text-slate-800">Quiz Title <span className="text-red-500">*</span></Label>
                                            <div className="relative group">
                                                <Input placeholder="e.g. Thermodynamics Midterm" value={examData.title}
                                                    onChange={(e) => setExamData({ ...examData, title: e.target.value })}
                                                    className={`h-12 text-base border-slate-200 focus:border-orange-400 focus:ring-orange-500/10 rounded-xl ${errors.title ? 'border-red-400' : ''}`} />
                                                <Type className="absolute right-3 top-3.5 w-4 h-4 text-slate-300 group-focus-within:text-orange-400 transition-colors" />
                                            </div>
                                            {errors.title && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.title[0]}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-semibold text-slate-800">Category / Course <span className="text-red-500">*</span></Label>
                                            <Select value={examData.courseId} onValueChange={(val) => setExamData({ ...examData, courseId: val })}>
                                                <SelectTrigger className={`h-12 border-slate-200 rounded-xl focus:border-orange-400 ${errors.courseId ? 'border-red-400' : ''}`}>
                                                    <SelectValue placeholder="Select Course" />
                                                </SelectTrigger>
                                                <SelectContent>{courses.map(c => <SelectItem key={c._id} value={c._id}>{c.title}</SelectItem>)}</SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold text-slate-800">Description</Label>
                                        <RichTextEditor value={examData.description} onChange={(html) => setExamData({ ...examData, description: html })} />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                        <div className="space-y-2">
                                            <Label className="text-sm font-semibold text-slate-700">Quiz Type</Label>
                                            <Select value={examData.type} onValueChange={(val) => setExamData({ ...examData, type: val })}>
                                                <SelectTrigger className="h-11 border-slate-200"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="quiz">Quiz</SelectItem>
                                                    <SelectItem value="assessment">Assessment</SelectItem>
                                                    <SelectItem value="practice">Practice Set</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-semibold text-slate-700">Duration (min)</Label>
                                            <div className="relative">
                                                <Input type="number" min="1" value={examData.duration}
                                                    onChange={(e) => setExamData({ ...examData, duration: parseInt(e.target.value) || 0 })}
                                                    className="h-11 border-slate-200 pr-10" />
                                                <Clock className="absolute right-3 top-3 w-4 h-4 text-slate-400" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-semibold text-slate-700">Passing Marks (Auto)</Label>
                                            <Input type="number" value={derivedPassingMarks} readOnly className="h-11 bg-slate-50 border-slate-200 text-slate-500" />
                                            <p className="text-xs text-slate-400">From pass % and {totalQuestionMarks} total pts.</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-50/60 border border-emerald-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center">
                                                <Sparkles className="w-4 h-4 text-emerald-600" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-slate-800 text-sm">Free Access</h3>
                                                <p className="text-xs text-slate-500">Accessible without enrollment</p>
                                            </div>
                                        </div>
                                        <Switch checked={examData.isFree} onCheckedChange={(checked) => setExamData({ ...examData, isFree: checked })} className="data-[state=checked]:bg-emerald-500" />
                                    </div>

                                    <AudienceSelector value={examData.audience} onChange={(audience) => setExamData({ ...examData, audience })}
                                        availableBatches={availableBatches} availableStudents={availableStudents}
                                        allowGlobal={Boolean(!institute?._id || institute?.features?.allowGlobalPublishingByInstituteTutors)}
                                        instituteId={institute?._id || null} />

                                    <div className="flex justify-end pt-4">
                                        <Button onClick={handleSaveAndProceed} className="h-11 px-7 bg-orange-500 hover:bg-orange-600 text-white rounded-xl shadow-sm shadow-orange-200 font-semibold gap-2">
                                            Next Step <ChevronRight className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </StepCard>
                        </motion.div>
                    )}

                    {/* ── STEP 2: Settings ─────────────────────────────── */}
                    {activeTab === 'settings' && (
                        <motion.div key="settings" variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25, ease: "easeInOut" }}>
                            <StepCard>
                                <div className="max-w-4xl mx-auto space-y-10">
                                    <div>
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center">
                                                <Settings className="w-4 h-4 text-orange-500" />
                                            </div>
                                            <h2 className="text-lg font-bold text-slate-800">Scoring & Configuration</h2>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="bg-slate-50/50 rounded-xl p-5 border border-slate-100 space-y-5">
                                                <h3 className="font-semibold text-slate-700 text-sm flex items-center gap-2">
                                                    <Clock className="w-4 h-4 text-slate-400" /> Timing & Scoring
                                                </h3>
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-medium text-slate-700">Pass Percentage <span className="text-red-500">*</span></Label>
                                                    <div className="relative">
                                                        <Input type="number" min="0" max="100" value={examData.passingPercentage}
                                                            onChange={(e) => setExamData({ ...examData, passingPercentage: parseInt(e.target.value) || 0 })}
                                                            className="pr-8 h-10 border-slate-200" />
                                                        <span className="absolute right-3 top-2.5 text-slate-400 font-bold text-sm">%</span>
                                                    </div>
                                                </div>
                                                <ToggleRow label="Negative Marking" desc="Deduct points for wrong answers" keyName="negativeMarking" />
                                            </div>
                                            <div className="bg-slate-50/50 rounded-xl p-5 border border-slate-100 space-y-4">
                                                <h3 className="font-semibold text-slate-700 text-sm flex items-center gap-2">
                                                    <BrainCircuit className="w-4 h-4 text-slate-400" /> Exam Experience
                                                </h3>
                                                <ToggleRow label="Shuffle Questions" desc="Randomize question order" keyName="shuffleQuestions" />
                                                <ToggleRow label="Shuffle Options" desc="Randomize answer choices" keyName="shuffleOptions" />
                                                <ToggleRow label="Show Results Info" desc="Show score after submission" keyName="showResultImmediately" />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                                                <Layout className="w-4 h-4 text-blue-500" />
                                            </div>
                                            <h2 className="text-lg font-bold text-slate-800">Attempts & Review</h2>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="bg-slate-50/50 rounded-xl p-5 border border-slate-100 space-y-4">
                                                <ToggleRow label="Allow Retakes" desc="Enable multiple attempts" keyName="allowRetake" color="blue" />
                                                <AnimatePresence>
                                                    {examData.allowRetake && (
                                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                                            <div className="pt-2 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                                                <Label className="text-sm font-medium text-slate-700">Max Attempts</Label>
                                                                <Input type="number" min="1" value={examData.maxAttempts}
                                                                    onChange={(e) => setExamData({ ...examData, maxAttempts: parseInt(e.target.value) || 1 })}
                                                                    className="h-10 mt-2 bg-white border-slate-200" />
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                            <div className="bg-slate-50/50 rounded-xl p-5 border border-slate-100 space-y-4">
                                                <ToggleRow label="Show Correct Answers" desc="Reveal answers after submission" keyName="showCorrectAnswers" color="blue" />
                                                <ToggleRow label="Hide Solutions" desc="Keep detailed solutions hidden" keyName="hideSolutions" color="blue" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-between pt-4">
                                        <Button variant="ghost" onClick={() => setActiveTab('details')} className="text-slate-500">Back</Button>
                                        <Button onClick={handleSaveAndProceed} className="h-11 px-7 bg-orange-500 hover:bg-orange-600 text-white rounded-xl shadow-sm shadow-orange-200 font-semibold gap-2">
                                            Next Step <ChevronRight className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </StepCard>
                        </motion.div>
                    )}

                    {/* ── STEP 3: Questions ────────────────────────────── */}
                    {activeTab === 'questions' && (
                        <motion.div key="questions" variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25, ease: "easeInOut" }}>
                            <StepCard>
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2.5">
                                            Questions
                                            <span className="bg-orange-100 text-orange-600 text-xs py-0.5 px-2.5 rounded-full font-bold">{examData.questions.length}</span>
                                        </h2>
                                        <p className="text-sm text-slate-400">Manage your quiz content manually or with AI</p>
                                    </div>
                                    <div className="flex gap-2 w-full md:w-auto flex-wrap">
                                        <Button variant="outline" onClick={() => setIsAIOpen(true)} className="gap-2 text-orange-600 border-orange-200 hover:bg-orange-50 text-sm">
                                            <Sparkles className="w-4 h-4" /> Generate via AI
                                        </Button>
                                        <Button variant="outline" onClick={() => setIsBankOpen(true)} className="gap-2 text-blue-600 border-blue-200 hover:bg-blue-50 text-sm">
                                            <Library className="w-4 h-4" /> Import from Bank
                                        </Button>
                                        <Button onClick={() => { resetQuestionForm(); setIsAddOpen(true); }} className="gap-2 bg-orange-500 hover:bg-orange-600 text-white shadow-sm shadow-orange-200 text-sm">
                                            <Plus className="w-4 h-4" /> Add Question
                                        </Button>
                                    </div>
                                </div>

                                {examData.questions.length === 0 ? (
                                    <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 flex flex-col items-center">
                                        <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-5 border border-slate-100">
                                            <List className="w-7 h-7 text-orange-400" />
                                        </div>
                                        <h3 className="text-base font-bold text-slate-800 mb-1.5">No questions yet</h3>
                                        <p className="text-sm text-slate-400 mb-7 max-w-xs">Start building your quiz by adding questions manually or using AI.</p>
                                        <div className="flex gap-3 flex-wrap justify-center">
                                            <Button variant="outline" onClick={() => setIsAIOpen(true)} className="gap-2 text-sm"><Sparkles className="w-4 h-4" /> AI Generate</Button>
                                            <Button variant="outline" onClick={() => setIsBankOpen(true)} className="gap-2 text-sm"><Library className="w-4 h-4" /> Import Bank</Button>
                                            <Button onClick={() => setIsAddOpen(true)} className="gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm"><Plus className="w-4 h-4" /> Manual Add</Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {examData.questions.map((q, idx) => (
                                            <div key={idx} className="bg-slate-50/50 p-5 rounded-xl border border-slate-100 hover:shadow-sm transition-all group relative">
                                                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleEditQuestion(idx)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-orange-100 transition-colors">
                                                        <Edit className="w-3.5 h-3.5 text-orange-500" />
                                                    </button>
                                                    <button onClick={() => handleDeleteQuestion(idx)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-100 transition-colors">
                                                        <Trash className="w-3.5 h-3.5 text-red-500" />
                                                    </button>
                                                </div>
                                                <div className="flex gap-3">
                                                    <span className="w-7 h-7 rounded-full bg-slate-200 text-slate-600 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">{idx + 1}</span>
                                                    <div className="flex-1 pr-14">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${q.difficulty === 'hard' ? 'bg-red-100 text-red-700' : q.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{q.difficulty}</span>
                                                            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">{q.points} pts</span>
                                                        </div>
                                                        <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(q.question) }} className="font-medium text-slate-800 mb-3 prose prose-sm max-w-none line-clamp-2 text-sm" />
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                            {q.options.map((opt, i) => (
                                                                <div key={i} className={`text-xs p-2.5 rounded-lg border flex items-center gap-2.5 ${opt.isCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-white border-slate-100 text-slate-500'}`}>
                                                                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${opt.isCorrect ? 'bg-emerald-200 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{String.fromCharCode(65 + i)}</span>
                                                                    <span className="flex-1 truncate">{opt.text}</span>
                                                                    {opt.isCorrect && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="flex justify-between pt-6 border-t border-slate-100 mt-6">
                                    <Button variant="ghost" onClick={() => setActiveTab('settings')} className="text-slate-500">Back</Button>
                                    <Button onClick={handleSaveAndProceed} className="h-11 px-7 bg-orange-500 hover:bg-orange-600 text-white rounded-xl shadow-sm shadow-orange-200 font-semibold gap-2">
                                        Next Step <ChevronRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            </StepCard>
                        </motion.div>
                    )}

                    {/* ── STEP 4: Schedule ─────────────────────────────── */}
                    {activeTab === 'schedules' && (
                        <motion.div key="schedules" variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25, ease: "easeInOut" }}>
                            <StepCard>
                                <div className="max-w-3xl mx-auto space-y-8">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                                            <Calendar className="w-5 h-5 text-emerald-600" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold text-slate-800">Quiz Availability</h2>
                                            <p className="text-sm text-slate-400">Control when students can access this quiz</p>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50/50 p-6 rounded-xl border border-slate-100">
                                        <div className="flex items-center justify-between mb-5">
                                            <div>
                                                <Label className="text-sm font-semibold text-slate-800">Enable Scheduling</Label>
                                                <p className="text-xs text-slate-400 mt-0.5">Restrict access to a specific time window</p>
                                            </div>
                                            <Switch checked={examData.isScheduled} onCheckedChange={(checked) => setExamData({ ...examData, isScheduled: checked })} className="data-[state=checked]:bg-emerald-500" />
                                        </div>

                                        <AnimatePresence>
                                            {examData.isScheduled && (
                                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200/60">
                                                        <div className="space-y-2">
                                                            <Label className="text-sm font-semibold text-slate-700">Start Date & Time</Label>
                                                            <Input type="datetime-local" value={examData.startDate ? new Date(examData.startDate).toISOString().slice(0, 16) : ''}
                                                                onChange={(e) => setExamData({ ...examData, startDate: e.target.value })}
                                                                className="h-11 border-slate-200 focus:border-orange-400 focus:ring-orange-500/10" />
                                                            <p className="text-xs text-slate-400">Quiz becomes available to students</p>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-sm font-semibold text-slate-700">End Date & Time</Label>
                                                            <Input type="datetime-local" value={examData.endDate ? new Date(examData.endDate).toISOString().slice(0, 16) : ''}
                                                                onChange={(e) => setExamData({ ...examData, endDate: e.target.value })}
                                                                className="h-11 border-slate-200 focus:border-orange-400 focus:ring-orange-500/10" />
                                                            <p className="text-xs text-slate-400">Quiz closes automatically</p>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {!examData.isScheduled && (
                                            <div className="mt-4 p-3.5 bg-emerald-50 text-emerald-800 rounded-xl flex items-start gap-3 border border-emerald-100">
                                                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-600" />
                                                <div>
                                                    <h4 className="font-semibold text-sm mb-0.5">Always Available</h4>
                                                    <p className="text-xs text-emerald-700">Once published, students can access this quiz at any time.</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex justify-between pt-4">
                                        <Button variant="ghost" onClick={() => setActiveTab('questions')} className="text-slate-500">Back</Button>
                                        <Button onClick={() => handleSaveAndProceed({ status: 'published', shouldRedirect: true })} disabled={saving}
                                            className="h-11 px-7 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-sm shadow-emerald-200 gap-2">
                                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><UploadCloud className="w-4 h-4" /> Save & Publish</>}
                                        </Button>
                                    </div>
                                </div>
                            </StepCard>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* AI Modal */}
            <Modal isOpen={isAIOpen} onClose={() => setIsAIOpen(false)} title="Generate Questions with AI">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Topic</Label>
                        <Input placeholder="e.g. World War II, Calculus Derivatives" value={aiParams.topic} onChange={(e) => setAiParams({ ...aiParams, topic: e.target.value })} className="border-slate-200 focus:border-orange-400 focus:ring-orange-500/10" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Question Count</Label>
                            <Input type="number" min="1" max="20" value={aiParams.count} onChange={(e) => setAiParams({ ...aiParams, count: parseInt(e.target.value) || 5 })} className="border-slate-200" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Difficulty</Label>
                            <Select value={aiParams.difficulty} onValueChange={(val) => setAiParams({ ...aiParams, difficulty: val })}>
                                <SelectTrigger className="border-slate-200"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="easy">Easy</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="hard">Hard</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <Button onClick={handleAIGenerate} disabled={aiLoading} className="w-full bg-orange-500 hover:bg-orange-600 text-white gap-2">
                        {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
                        Generate Questions
                    </Button>
                </div>
            </Modal>

            {/* Add/Edit Question Modal */}
            <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title={editingIndex >= 0 ? "Edit Question" : "Add New Question"} className="max-w-4xl">
                <div className="space-y-5 max-h-[80vh] overflow-y-auto pr-1">
                    <div className="space-y-2">
                        <Label className="text-sm font-semibold">Question Text</Label>
                        <RichTextEditor value={currentQuestion.question} onChange={(html) => setCurrentQuestion({ ...currentQuestion, question: html })} />
                    </div>
                    <div className="space-y-3">
                        <Label className="text-sm font-semibold">Options</Label>
                        {currentQuestion.options.map((opt, idx) => (
                            <div key={idx} className="flex items-center gap-3">
                                <input type="radio" name="correctAnswer" checked={opt.isCorrect} onChange={() => handleCorrectSelect(idx)} className="w-4 h-4 text-orange-500 focus:ring-orange-500" />
                                <Input value={opt.text} onChange={(e) => handleOptionChange(idx, e.target.value)} placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                                    className={`flex-1 ${opt.isCorrect ? 'border-emerald-400 ring-1 ring-emerald-100' : 'border-slate-200'}`} />
                                {currentQuestion.options.length > 2 && (
                                    <button onClick={() => handleRemoveOption(idx)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors">
                                        <X className="w-4 h-4 text-red-400" />
                                    </button>
                                )}
                            </div>
                        ))}
                        {currentQuestion.options.length < 6 && (
                            <Button variant="outline" size="sm" onClick={handleAddOption} className="text-xs gap-1.5 border-dashed">
                                <Plus className="w-3 h-3" /> Add Option
                            </Button>
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold">Points</Label>
                            <Input type="number" min="1" value={currentQuestion.points} onChange={(e) => setCurrentQuestion({ ...currentQuestion, points: parseFloat(e.target.value) || 1 })} className="border-slate-200" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold">Difficulty</Label>
                            <Select value={currentQuestion.difficulty} onValueChange={(val) => setCurrentQuestion({ ...currentQuestion, difficulty: val })}>
                                <SelectTrigger className="border-slate-200"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="easy">Easy</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="hard">Hard</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-semibold">Explanation (Optional)</Label>
                        <Textarea value={currentQuestion.explanation} onChange={(e) => setCurrentQuestion({ ...currentQuestion, explanation: e.target.value })} placeholder="Explain why this answer is correct..." className="h-20 border-slate-200 resize-none" />
                    </div>
                    <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                        <Button variant="outline" onClick={() => setIsAddOpen(false)} className="text-sm">Cancel</Button>
                        <Button onClick={handleSaveQuestion} className="bg-orange-500 hover:bg-orange-600 text-white text-sm gap-2">
                            <Save className="w-4 h-4" />
                            {editingIndex >= 0 ? "Update Question" : "Add Question"}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Import from Bank Modal */}
            <Modal isOpen={isBankOpen} onClose={() => setIsBankOpen(false)} title="Import from Question Bank" className="max-w-5xl">
                <div className="space-y-4 max-h-[85vh] flex flex-col">
                    <div className="flex gap-3 items-end shrink-0">
                        <div className="flex-1 space-y-1">
                            <Label className="text-xs text-slate-500">Search Questions</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input placeholder="Search by question text..." className="pl-9 border-slate-200" value={bankFilters.search || ''} onChange={(e) => setBankFilters({ ...bankFilters, search: e.target.value })} />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs text-slate-500">Difficulty</Label>
                            <Select value={bankFilters.difficulty} onValueChange={(val) => setBankFilters({ ...bankFilters, difficulty: val })}>
                                <SelectTrigger className="w-[130px] border-slate-200"><SelectValue placeholder="All" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    <SelectItem value="easy">Easy</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="hard">Hard</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto border border-slate-200 rounded-xl bg-slate-50/50 p-4 space-y-3 min-h-[400px]">
                        {bankLoading ? (
                            <div className="flex justify-center items-center min-h-[300px]">
                                <Loader2 className="w-7 h-7 animate-spin text-orange-500" />
                            </div>
                        ) : (() => {
                            const searchFiltered = bankQuestions.filter(q => !bankFilters.search || q.question.toLowerCase().includes(bankFilters.search.toLowerCase()));
                            if (searchFiltered.length === 0) {
                                return (
                                    <div className="flex flex-col items-center justify-center min-h-[300px] text-slate-400">
                                        <Library className="w-10 h-10 mb-3 opacity-40" />
                                        <p className="text-sm">No questions found.</p>
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
                                <div key={topicName} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                    <div className="px-4 py-3 bg-slate-50 border-b flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-sm text-slate-800">{topicName}</span>
                                            <span className="text-xs bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full">{questions.length}</span>
                                        </div>
                                        <button type="button" onClick={() => {
                                            const topicIds = questions.map(q => q._id);
                                            const allSelected = topicIds.every(id => selectedBankIds.includes(id));
                                            if (allSelected) setSelectedBankIds(selectedBankIds.filter(id => !topicIds.includes(id)));
                                            else setSelectedBankIds([...new Set([...selectedBankIds, ...topicIds])]);
                                        }} className="text-xs text-orange-500 hover:text-orange-600 font-medium">
                                            {questions.every(q => selectedBankIds.includes(q._id)) ? 'Deselect All' : 'Select All'}
                                        </button>
                                    </div>
                                    <div className="divide-y divide-slate-100">
                                        {questions.map((q) => (
                                            <div key={q._id} className="px-4 py-3 flex items-start gap-3 hover:bg-slate-50/50">
                                                <input type="checkbox" checked={selectedBankIds.includes(q._id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) setSelectedBankIds([...selectedBankIds, q._id]);
                                                        else setSelectedBankIds(selectedBankIds.filter(id => id !== q._id));
                                                    }}
                                                    className="w-4 h-4 rounded border-slate-300 text-orange-500 focus:ring-orange-400 mt-0.5" />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex gap-1.5 mb-1">
                                                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${q.difficulty === 'hard' ? 'bg-red-100 text-red-700' : q.difficulty === 'easy' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{q.difficulty}</span>
                                                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">{(q.type || 'mcq').toUpperCase()}</span>
                                                        <span className="text-[10px] text-slate-400">{q.points || 1} pts</span>
                                                    </div>
                                                    <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(q.question) }} className="text-sm font-medium text-slate-800 line-clamp-2" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ));
                        })()}
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-slate-100 shrink-0">
                        <span className="text-sm text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full font-medium">
                            {selectedBankIds.length} selected
                        </span>
                        <div className="flex gap-2">
                            <Button variant="ghost" onClick={() => { setIsBankOpen(false); setSelectedBankIds([]); }} className="text-sm">Cancel</Button>
                            <Button onClick={handleImportFromBank} disabled={selectedBankIds.length === 0} className="bg-orange-500 hover:bg-orange-600 text-white gap-2 text-sm">
                                <Library className="w-4 h-4" /> Import Selected
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