'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    ArrowLeft,
    Bold,
    Italic,
    Underline,
    List,
    ListOrdered,
    Image as ImageIcon,
    Link as LinkIcon,
    Loader2,
    CheckCircle2,
    AlertCircle,
    AlignRight,
    Plus,
    Trash,
    Edit,
    BrainCircuit,
    X,
    GripVertical,
    Check,
    Calendar,
    Clock,
    Settings,
    MoreHorizontal,
    ChevronRight,
    Save,
    Sparkles,
    Layout,
    Type,
    UploadCloud
} from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Textarea } from '@/components/ui/textarea';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from 'react-hot-toast';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";

// --- Validation Schema ---
const examDetailsSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    courseId: z.string().min(1, "Please select a course/category"),
    type: z.string(),
    duration: z.number().min(1, "Duration must be at least 1 minute"),
    passingMarks: z.number().min(0),
    description: z.string().optional(),
});

// --- Simple Wizard Steps Component ---
const WizardSteps = ({ currentStep, steps, onStepClick }) => {
    return (
        <div className="flex items-center justify-center w-full mb-8">
            <div className="flex items-center gap-2 md:gap-4 relative z-10">
                {steps.map((step, idx) => {
                    const isActive = currentStep === step.id;
                    const isCompleted = steps.findIndex(s => s.id === currentStep) > idx;
                    const isClickable = steps.findIndex(s => s.id === currentStep) >= idx; // Can implement stricter logic

                    return (
                        <div key={step.id} className="flex items-center">
                            <button
                                onClick={() => isClickable && onStepClick(step.id)}
                                disabled={!isClickable}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 border",
                                    isActive
                                        ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200 scale-105"
                                        : isCompleted
                                            ? "bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                                            : "bg-white text-slate-400 border-slate-200"
                                )}
                            >
                                <div className={cn(
                                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                                    isActive ? "bg-white/20 text-white" : isCompleted ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-500"
                                )}>
                                    {isCompleted ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                                </div>
                                <span className={cn("text-sm font-semibold hidden md:inline-block", isActive || isCompleted ? "opacity-100" : "opacity-60")}>
                                    {step.label}
                                </span>
                            </button>
                            {idx < steps.length - 1 && (
                                <div className="w-8 h-0.5 bg-slate-200 mx-2 md:mx-4" />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};


// --- Rich Text Editor Component ---
const RichTextEditor = ({ value, onChange }) => {
    const editorRef = useRef(null);

    const execCommand = (command, value = null) => {
        document.execCommand(command, false, value);
        if (editorRef.current) {
            editorRef.current.focus();
        }
    };

    // Sync content changes to parent
    const handleInput = () => {
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    };

    // Initial value sync
    useEffect(() => {
        if (editorRef.current && value && editorRef.current.innerHTML === '') {
            editorRef.current.innerHTML = value;
        }
    }, []);

    return (
        <div className="border border-slate-200 rounded-xl shadow-sm bg-white overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all hover:shadow-md">
            {/* Toolbar */}
            <div className="flex items-center gap-1 p-2 border-b border-slate-100 bg-slate-50/50">
                <Button variant="ghost" size="sm" onClick={() => execCommand('bold')} className="h-8 w-8 p-0 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600"><Bold className="w-4 h-4" /></Button>
                <Button variant="ghost" size="sm" onClick={() => execCommand('italic')} className="h-8 w-8 p-0 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600"><Italic className="w-4 h-4" /></Button>
                <Button variant="ghost" size="sm" onClick={() => execCommand('underline')} className="h-8 w-8 p-0 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600"><Underline className="w-4 h-4" /></Button>
                <div className="w-px h-4 bg-slate-300 mx-2" />
                <Button variant="ghost" size="sm" onClick={() => execCommand('insertUnorderedList')} className="h-8 w-8 p-0 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600"><List className="w-4 h-4" /></Button>
                <Button variant="ghost" size="sm" onClick={() => execCommand('insertOrderedList')} className="h-8 w-8 p-0 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600"><ListOrdered className="w-4 h-4" /></Button>
                <div className="w-px h-4 bg-slate-300 mx-2" />
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-slate-200 text-slate-400 cursor-not-allowed"><ImageIcon className="w-4 h-4" /></Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-slate-200 text-slate-400 cursor-not-allowed"><LinkIcon className="w-4 h-4" /></Button>
            </div>

            {/* Editor Area */}
            <div
                ref={editorRef}
                contentEditable
                className="min-h-[150px] p-4 outline-none prose prose-sm max-w-none text-slate-700 font-medium"
                onInput={handleInput}
            />
        </div>
    );
};

export default function CreateExamPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const defaultType = searchParams.get('type') || 'quiz';

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState("details");
    const [examId, setExamId] = useState(null);

    // Data State
    const [courses, setCourses] = useState([]);
    const [examData, setExamData] = useState({
        title: '',
        courseId: '',
        type: defaultType,
        isFree: true,
        description: '',
        isPublic: true,
        duration: 30,
        passingMarks: 10,
        questions: [],
        // Settings
        shuffleQuestions: false,
        shuffleOptions: false,
        showResultImmediately: true,
        showCorrectAnswers: true,
        allowRetake: false,
        maxAttempts: 1,
        passingPercentage: 50,
        disableFinishButton: false, // Extra from screenshot
        enableQuestionListView: true, // Extra from screenshot
        hideSolutions: false, // Extra from screenshot
        hideSolutions: false, // Extra from screenshot
        negativeMarking: false, // Extra from screenshot
        // Scheduling
        isScheduled: false,
        startDate: '',
        endDate: ''
    });

    const [errors, setErrors] = useState({});

    // Question Management State
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isAIOpen, setIsAIOpen] = useState(false);
    const [editingIndex, setEditingIndex] = useState(-1);
    const [currentQuestion, setCurrentQuestion] = useState({
        question: '',
        options: [{ text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }],
        explanation: '',
        points: 1,
        difficulty: 'medium'
    });

    // AI State
    const [aiParams, setAiParams] = useState({
        topic: '',
        count: 5,
        difficulty: 'medium'
    });
    const [aiLoading, setAiLoading] = useState(false);

    // Helpers
    const handleAddOption = () => {
        if (currentQuestion.options.length < 6) {
            setCurrentQuestion({
                ...currentQuestion,
                options: [...currentQuestion.options, { text: '', isCorrect: false }]
            });
        }
    };

    const handleRemoveOption = (idx) => {
        if (currentQuestion.options.length > 2) {
            const newOps = currentQuestion.options.filter((_, i) => i !== idx);
            setCurrentQuestion({ ...currentQuestion, options: newOps });
        }
    };

    const handleOptionChange = (idx, val) => {
        const newOps = [...currentQuestion.options];
        newOps[idx].text = val;
        setCurrentQuestion({ ...currentQuestion, options: newOps });
    };

    const handleCorrectSelect = (idx) => {
        const newOps = currentQuestion.options.map((op, i) => ({ ...op, isCorrect: i === idx }));
        setCurrentQuestion({ ...currentQuestion, options: newOps });
    };

    const handleSaveQuestion = () => {
        // Basic validation
        if (!currentQuestion.question || currentQuestion.question === '<br>') {
            toast.error("Question text is required");
            return;
        }
        if (currentQuestion.options.some(o => !o.text.trim())) {
            toast.error("All options must have text");
            return;
        }
        if (!currentQuestion.options.some(o => o.isCorrect)) {
            toast.error("Select a correct answer");
            return;
        }

        const newQuestions = [...examData.questions];
        if (editingIndex >= 0) {
            newQuestions[editingIndex] = currentQuestion;
        } else {
            newQuestions.push(currentQuestion);
        }

        setExamData({ ...examData, questions: newQuestions });
        setIsAddOpen(false);
        resetQuestionForm();
        toast.success(editingIndex >= 0 ? "Question updated" : "Question added");
    };

    const handleEditQuestion = (idx) => {
        setEditingIndex(idx);
        // Deep copy to avoid reference issues
        setCurrentQuestion(JSON.parse(JSON.stringify(examData.questions[idx])));
        setIsAddOpen(true);
    };

    const handleDeleteQuestion = (idx) => {
        if (confirm("Are you sure you want to delete this question?")) {
            const newQuestions = examData.questions.filter((_, i) => i !== idx);
            setExamData({ ...examData, questions: newQuestions });
            toast.success("Question deleted");
        }
    };

    const resetQuestionForm = () => {
        setEditingIndex(-1);
        setCurrentQuestion({
            question: '',
            options: [{ text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }],
            explanation: '',
            points: 1,
            difficulty: 'medium'
        });
    };

    const handleAIGenerate = async () => {
        if (!aiParams.topic) {
            toast.error("Please enter a topic");
            return;
        }
        setAiLoading(true);
        try {
            const res = await api.post('/ai/generate-questions', aiParams);
            if (res.data.success) {
                const newQs = res.data.questions.map(q => ({
                    question: q.question,
                    options: q.options.map(opt => ({ text: opt, isCorrect: opt === q.correctAnswer })),
                    // AI sends string correctAnswer, map to boolean
                    explanation: q.explanation,
                    points: 1,
                    difficulty: q.difficulty.toLowerCase()
                }));

                // Fix: ensure correct option is marked if not already (AI sometimes fuzzy match)
                // The map above assumes exact match. If AI fails, user has to fix manually.
                // We'll rely on AI quality for now.

                setExamData(prev => ({
                    ...prev,
                    questions: [...prev.questions, ...newQs]
                }));
                setIsAIOpen(false);
                toast.success(`Generated ${newQs.length} questions!`);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to generate questions. Try a different topic.");
        } finally {
            setAiLoading(false);
        }
    };

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const res = await api.get('/courses/my-courses');
                if (res.data.success) {
                    setCourses(res.data.courses);
                }
            } catch (err) {
                console.error('Error fetching courses:', err);
                toast.error("Failed to load courses");
            }
        };
        fetchCourses();
    }, []);

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
        // Handle event object if passed directly
        const { status = 'draft', shouldRedirect = false } = options && options.preventDefault ? {} : options;

        if (!validateForm()) return;

        setSaving(true);
        try {
            const payload = {
                ...examData,
                status: status, // Use passed status or default 'draft'
            };

            console.log("Saving Exam Payload:", payload); // Debugging

            let response;
            if (examId) {
                response = await api.patch(`/exams/${examId}`, payload);
            } else {
                response = await api.post('/exams', payload);
            }

            if (response.data.success) {
                const savedExam = response.data.exam;
                setExamId(savedExam._id);
                toast.success(status === 'published' ? "Quiz published successfully!" : "Changes saved!");

                if (shouldRedirect) {
                    router.push('/tutor/quizzes');
                } else {
                    // Auto-advance tabs if not redirecting
                    if (activeTab === 'details') setActiveTab('settings');
                    else if (activeTab === 'settings') setActiveTab('questions');
                    else if (activeTab === 'questions') setActiveTab('schedules');
                }
            }
        } catch (error) {
            console.error('Save error:', error);
            toast.error(error.response?.data?.message || "Failed to save exam");
        } finally {
            setSaving(false);
        }
    };

    // --- Animation Variants ---
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
        // Simple validation or guard can go here
        if (newStep === 'settings' && !examData.title) {
            toast.error("Please enter a title first");
            return;
        }
        setActiveTab(newStep);
    };

    return (
        <div className="min-h-screen bg-[#F8F9FC] pb-20 font-sans text-slate-900">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200/60 shadow-sm">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/tutor/quizzes">
                            <Button variant="ghost" size="icon" className="group">
                                <ArrowLeft className="w-5 h-5 text-slate-500 group-hover:text-indigo-600 transition-colors" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent">
                                {examId ? 'Edit Quiz' : 'Create New Quiz'}
                            </h1>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            className="hidden sm:flex border-slate-200 text-slate-600"
                            onClick={() => handleSaveAndProceed({ status: 'draft', shouldRedirect: true })}
                        >
                            Save Draft
                        </Button>
                        <Button
                            onClick={() => handleSaveAndProceed({ status: 'draft' })}
                            disabled={saving}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save & Continue'}
                        </Button>
                    </div>
                </div>
            </div>

            <main className="max-w-5xl mx-auto px-6 py-8">
                <WizardSteps currentStep={activeTab} steps={steps} onStepClick={handleStepChange} />

                <div className="relative">
                    <AnimatePresence mode="wait">
                        {activeTab === 'details' && (
                            <motion.div
                                key="details"
                                variants={variants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                className="bg-white/70 backdrop-blur-xl rounded-[2rem] border border-white/50 shadow-xl shadow-indigo-100/40 p-8 md:p-10"
                            >
                                <div className="max-w-3xl mx-auto space-y-8">
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-3">
                                                <Label className="text-base font-semibold text-slate-800">Quiz Title <span className="text-red-500">*</span></Label>
                                                <div className="relative group">
                                                    <Input
                                                        placeholder="e.g. Thermodynamics Midterm"
                                                        value={examData.title}
                                                        onChange={(e) => setExamData({ ...examData, title: e.target.value })}
                                                        className={`h-14 text-lg bg-white/50 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl transition-all ${errors.title ? 'border-red-500' : ''}`}
                                                    />
                                                    <div className="absolute right-4 top-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                                                        <Type className="w-5 h-5" />
                                                    </div>
                                                </div>
                                                {errors.title && <p className="text-sm text-red-500 flex items-center gap-1 mt-1"><AlertCircle className="w-3 h-3" /> {errors.title[0]}</p>}
                                            </div>

                                            <div className="space-y-3">
                                                <Label className="text-base font-semibold text-slate-800">Category / Course <span className="text-red-500">*</span></Label>
                                                <Select
                                                    value={examData.courseId}
                                                    onValueChange={(val) => setExamData({ ...examData, courseId: val })}
                                                >
                                                    <SelectTrigger className={`h-14 bg-white/50 border-slate-200 rounded-xl ${errors.courseId ? 'border-red-500' : ''}`}>
                                                        <SelectValue placeholder="Select Course" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {courses.map(c => (
                                                            <SelectItem key={c._id} value={c._id}>{c.title}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <Label className="text-base font-semibold text-slate-800">Description</Label>
                                            <RichTextEditor
                                                value={examData.description}
                                                onChange={(html) => setExamData({ ...examData, description: html })}
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                                            <div className="space-y-3">
                                                <Label className="text-sm font-semibold text-slate-700">Quiz Type</Label>
                                                <Select
                                                    value={examData.type}
                                                    onValueChange={(val) => setExamData({ ...examData, type: val })}
                                                >
                                                    <SelectTrigger className="h-12 bg-white/50 border-slate-200 rounded-lg">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="quiz">Quiz</SelectItem>
                                                        <SelectItem value="assessment">Assessment</SelectItem>
                                                        <SelectItem value="practice">Practice Set</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-3">
                                                <Label className="text-sm font-semibold text-slate-700">Duration (min)</Label>
                                                <div className="relative">
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        value={examData.duration}
                                                        onChange={(e) => setExamData({ ...examData, duration: parseInt(e.target.value) || 0 })}
                                                        className="h-12 bg-white/50 pr-10"
                                                    />
                                                    <Clock className="absolute right-3 top-3.5 w-4 h-4 text-slate-400" />
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <Label className="text-sm font-semibold text-slate-700">Total Marks</Label>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    value={examData.passingMarks}
                                                    onChange={(e) => setExamData({ ...examData, passingMarks: parseInt(e.target.value) || 0 })}
                                                    className="h-12 bg-white/50"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                                                    <Sparkles className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-slate-800">Free Access</h3>
                                                    <p className="text-xs text-slate-500">Accessible to all users without enrollment</p>
                                                </div>
                                            </div>
                                            <Switch
                                                checked={examData.isFree}
                                                onCheckedChange={(checked) => setExamData({ ...examData, isFree: checked })}
                                                className="data-[state=checked]:bg-emerald-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-6">
                                        <Button
                                            onClick={handleSaveAndProceed}
                                            className="h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-200 font-semibold"
                                        >
                                            Next Step <ChevronRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'settings' && (
                            <motion.div
                                key="settings"
                                variants={variants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                className="bg-white/70 backdrop-blur-xl rounded-[2rem] border border-white/50 shadow-xl shadow-indigo-100/40 p-8 md:p-10"
                            >
                                <div className="max-w-4xl mx-auto space-y-10">
                                    {/* Section 1: Scoring & Behavior */}
                                    <div>
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                                                <Settings className="w-5 h-5" />
                                            </div>
                                            <h2 className="text-xl font-bold text-slate-800">Scoring & Configuration</h2>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="bg-white/50 rounded-2xl p-6 border border-slate-200/60 hover:shadow-md transition-all">
                                                <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                                    <Clock className="w-4 h-4 text-slate-400" />
                                                    Timing & Scoring
                                                </h3>
                                                <div className="space-y-6">
                                                    <div className="flex items-center justify-between">
                                                        <div className="space-y-0.5">
                                                            <Label className="text-sm font-medium text-slate-700">Duration Mode</Label>
                                                            <p className="text-xs text-slate-500">Auto vs Manual timing</p>
                                                        </div>
                                                        <div className="bg-indigo-600 text-white px-3 py-1 text-xs font-bold rounded-full shadow-sm">
                                                            MANUAL
                                                        </div>
                                                    </div>

                                                    <div className="space-y-3">
                                                        <Label className="text-sm font-medium text-slate-700">Pass Percentage <span className="text-red-500">*</span></Label>
                                                        <div className="relative group">
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                max="100"
                                                                value={examData.passingPercentage}
                                                                onChange={(e) => setExamData({ ...examData, passingPercentage: parseInt(e.target.value) || 0 })}
                                                                className="pr-10 h-11 bg-white/70"
                                                            />
                                                            <span className="absolute right-3 top-3 text-slate-400 font-bold group-focus-within:text-indigo-600">%</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between pt-2">
                                                        <div className="space-y-0.5">
                                                            <Label className="text-sm font-medium text-slate-700">Negative Marking</Label>
                                                            <p className="text-xs text-slate-500">Deduct points for wrong answers</p>
                                                        </div>
                                                        <Switch
                                                            checked={examData.negativeMarking}
                                                            onCheckedChange={(checked) => setExamData({ ...examData, negativeMarking: checked })}
                                                            className="data-[state=checked]:bg-indigo-600"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-white/50 rounded-2xl p-6 border border-slate-200/60 hover:shadow-md transition-all">
                                                <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                                    <BrainCircuit className="w-4 h-4 text-slate-400" />
                                                    Exam Experience
                                                </h3>
                                                <div className="space-y-5">
                                                    {[
                                                        { label: "Shuffle Questions", key: "shuffleQuestions", desc: "Randomize question order" },
                                                        { label: "Shuffle Options", key: "shuffleOptions", desc: "Randomize answer choices" },
                                                        { label: "Show Results Info", key: "showResultImmediately", desc: "Show score after submission" },
                                                    ].map((item) => (
                                                        <div key={item.key} className="flex items-center justify-between">
                                                            <div className="space-y-0.5">
                                                                <Label className="text-sm font-medium text-slate-700 cursor-pointer" htmlFor={item.key}>{item.label}</Label>
                                                                <p className="text-xs text-slate-500">{item.desc}</p>
                                                            </div>
                                                            <Switch
                                                                id={item.key}
                                                                checked={examData[item.key]}
                                                                onCheckedChange={(checked) => setExamData({ ...examData, [item.key]: checked })}
                                                                className="data-[state=checked]:bg-indigo-600"
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section 2: Attempts & Review */}
                                    <div className="pt-2">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                                <Layout className="w-5 h-5" />
                                            </div>
                                            <h2 className="text-xl font-bold text-slate-800">Attempts & Review</h2>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="bg-white/50 rounded-2xl p-6 border border-slate-200/60 hover:shadow-md transition-all">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="space-y-0.5">
                                                        <Label className="text-base font-medium text-slate-800">Allow Retakes</Label>
                                                        <p className="text-xs text-slate-500">Enable multiple attempts</p>
                                                    </div>
                                                    <Switch
                                                        checked={examData.allowRetake}
                                                        onCheckedChange={(checked) => setExamData({ ...examData, allowRetake: checked })}
                                                        className="data-[state=checked]:bg-blue-600"
                                                    />
                                                </div>

                                                <AnimatePresence>
                                                    {examData.allowRetake && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            className="overflow-hidden"
                                                        >
                                                            <div className="pt-2 bg-blue-50/50 p-4 rounded-xl border border-blue-100/50">
                                                                <Label className="text-sm font-medium text-slate-700">Max Attempts</Label>
                                                                <Input
                                                                    type="number"
                                                                    min="1"
                                                                    value={examData.maxAttempts}
                                                                    onChange={(e) => setExamData({ ...examData, maxAttempts: parseInt(e.target.value) || 1 })}
                                                                    className="h-11 mt-2 bg-white"
                                                                />
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>

                                            <div className="bg-white/50 rounded-2xl p-6 border border-slate-200/60 hover:shadow-md transition-all">
                                                <div className="space-y-5">
                                                    {[
                                                        { label: "Show Correct Answers", key: "showCorrectAnswers", desc: "Reveal answers after submission" },
                                                        { label: "Hide Solutions", key: "hideSolutions", desc: "Keep detailed solutions hidden" },
                                                    ].map((item) => (
                                                        <div key={item.key} className="flex items-center justify-between">
                                                            <div className="space-y-0.5">
                                                                <Label className="text-sm font-medium text-slate-700 cursor-pointer" htmlFor={item.key}>{item.label}</Label>
                                                                <p className="text-xs text-slate-500">{item.desc}</p>
                                                            </div>
                                                            <Switch
                                                                id={item.key}
                                                                checked={examData[item.key]}
                                                                onCheckedChange={(checked) => setExamData({ ...examData, [item.key]: checked })}
                                                                className="data-[state=checked]:bg-blue-600"
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-between pt-6">
                                        <Button
                                            variant="ghost"
                                            onClick={() => setActiveTab('details')}
                                            className="text-slate-500 hover:text-slate-800"
                                        >
                                            Back
                                        </Button>
                                        <Button
                                            onClick={handleSaveAndProceed}
                                            className="h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-200 font-semibold"
                                        >
                                            Next Step <ChevronRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'questions' && (
                            <motion.div
                                key="questions"
                                variants={variants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                className="bg-white/70 backdrop-blur-xl rounded-[2rem] border border-white/50 shadow-xl shadow-indigo-100/40 p-8 md:p-10"
                            >
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                                    <div>
                                        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                                            Questions
                                            <span className="bg-indigo-100 text-indigo-600 text-sm py-1 px-3 rounded-full">{examData.questions.length}</span>
                                        </h2>
                                        <p className="text-slate-500">Manage your quiz content manually or with AI</p>
                                    </div>
                                    <div className="flex gap-3 w-full md:w-auto">
                                        <Button variant="outline" onClick={() => setIsAIOpen(true)} className="flex-1 md:flex-none gap-2 text-purple-700 border-purple-200 hover:bg-purple-50 hover:border-purple-300">
                                            <Sparkles className="w-4 h-4" />
                                            Generate via AI
                                        </Button>
                                        <Button onClick={() => { resetQuestionForm(); setIsAddOpen(true); }} className="flex-1 md:flex-none gap-2 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 text-white">
                                            <Plus className="w-4 h-4" />
                                            Add Question
                                        </Button>
                                    </div>
                                </div>

                                {examData.questions.length === 0 ? (
                                    <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50 flex flex-col items-center justify-center">
                                        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6">
                                            <List className="w-8 h-8 text-indigo-400" />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-800 mb-2">No questions yet</h3>
                                        <p className="text-slate-500 mb-8 max-w-sm mx-auto">Start building your quiz by adding questions manually or using our AI generator.</p>
                                        <div className="flex gap-4">
                                            <Button variant="outline" onClick={() => setIsAIOpen(true)} className="gap-2">
                                                <Sparkles className="w-4 h-4" /> AI Generate
                                            </Button>
                                            <Button onClick={() => setIsAddOpen(true)} className="gap-2 bg-indigo-600 text-white hover:bg-indigo-700">
                                                <Plus className="w-4 h-4" /> Manual Add
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-4">
                                        {examData.questions.map((q, idx) => (
                                            <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group relative">
                                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button variant="ghost" size="sm" onClick={() => handleEditQuestion(idx)} className="h-8 w-8 p-0 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full"><Edit className="w-4 h-4" /></Button>
                                                    <Button variant="ghost" size="sm" onClick={() => handleDeleteQuestion(idx)} className="h-8 w-8 p-0 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full"><Trash className="w-4 h-4" /></Button>
                                                </div>

                                                <div className="flex gap-4">
                                                    <div className="flex-none pt-1">
                                                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-bold text-sm">
                                                            {idx + 1}
                                                        </span>
                                                    </div>
                                                    <div className="flex-1 pr-16">
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wide ${q.difficulty === 'hard' ? 'bg-red-100 text-red-700' :
                                                                q.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                                                    'bg-green-100 text-green-700'
                                                                }`}>
                                                                {q.difficulty}
                                                            </span>
                                                            <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full font-medium">
                                                                {q.points} Points
                                                            </span>
                                                        </div>

                                                        <div dangerouslySetInnerHTML={{ __html: q.question }} className="font-medium text-slate-800 mb-4 prose prose-sm max-w-none line-clamp-2" />

                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                            {q.options.map((opt, i) => (
                                                                <div key={i} className={`text-sm p-3 rounded-xl border flex items-center gap-3 ${opt.isCorrect ? 'bg-emerald-50/50 border-emerald-200 text-emerald-800' : 'bg-slate-50/50 border-slate-100 text-slate-500'}`}>
                                                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${opt.isCorrect ? 'bg-emerald-200 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                                                                        {String.fromCharCode(65 + i)}
                                                                    </span>
                                                                    <span className="flex-1 truncate">{opt.text}</span>
                                                                    {opt.isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="flex justify-between pt-6 border-t border-slate-200/60 mt-8">
                                    <Button
                                        variant="ghost"
                                        onClick={() => setActiveTab('settings')}
                                        className="text-slate-500 hover:text-slate-800"
                                    >
                                        Back
                                    </Button>
                                    <Button
                                        onClick={handleSaveAndProceed}
                                        className="h-12 px-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-200 font-semibold"
                                    >
                                        Next Step <ChevronRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'schedules' && (
                            <motion.div
                                key="schedules"
                                variants={variants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                className="bg-white/70 backdrop-blur-xl rounded-[2rem] border border-white/50 shadow-xl shadow-indigo-100/40 p-8 md:p-10"
                            >
                                <div className="max-w-3xl mx-auto space-y-10">
                                    <div className="flex items-center gap-4 mb-2">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-200/50">
                                            <Calendar className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-slate-800">Quiz Availability</h2>
                                            <p className="text-slate-500">Control when students can access this quiz</p>
                                        </div>
                                    </div>

                                    <div className="bg-white/60 p-6 rounded-2xl border border-slate-200/60 shadow-sm">
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="space-y-1">
                                                <Label className="text-base font-semibold text-slate-800">Enable Scheduling</Label>
                                                <p className="text-sm text-slate-500">
                                                    Restrict access to a specific date and time window
                                                </p>
                                            </div>
                                            <Switch
                                                checked={examData.isScheduled}
                                                onCheckedChange={(checked) => setExamData({ ...examData, isScheduled: checked })}
                                                className="data-[state=checked]:bg-emerald-500"
                                            />
                                        </div>

                                        <AnimatePresence>
                                            {examData.isScheduled && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-200/50">
                                                        <div className="space-y-3">
                                                            <Label className="text-sm font-semibold text-slate-700">Start Date & Time</Label>
                                                            <div className="relative group">
                                                                <Input
                                                                    type="datetime-local"
                                                                    value={examData.startDate ? new Date(examData.startDate).toISOString().slice(0, 16) : ''}
                                                                    onChange={(e) => setExamData({ ...examData, startDate: e.target.value })}
                                                                    className="h-12 bg-white/50 border-slate-200 group-hover:border-indigo-300 transition-colors"
                                                                />
                                                            </div>
                                                            <p className="text-xs text-slate-400">Quiz becomes available to students</p>
                                                        </div>

                                                        <div className="space-y-3">
                                                            <Label className="text-sm font-semibold text-slate-700">End Date & Time</Label>
                                                            <div className="relative group">
                                                                <Input
                                                                    type="datetime-local"
                                                                    value={examData.endDate ? new Date(examData.endDate).toISOString().slice(0, 16) : ''}
                                                                    onChange={(e) => setExamData({ ...examData, endDate: e.target.value })}
                                                                    className="h-12 bg-white/50 border-slate-200 group-hover:border-indigo-300 transition-colors"
                                                                />
                                                            </div>
                                                            <p className="text-xs text-slate-400">Quiz closes automatically</p>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {!examData.isScheduled && (
                                            <motion.div
                                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                                className="mt-4 p-4 bg-emerald-50/50 text-emerald-800 rounded-xl flex items-start gap-3 border border-emerald-100/50"
                                            >
                                                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                                                <div>
                                                    <h4 className="font-semibold text-sm mb-0.5">Always Available</h4>
                                                    <p className="text-xs opacity-90">
                                                        Once published, this quiz can be accessed by students at any time without restriction.
                                                    </p>
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>

                                    <div className="flex justify-between pt-6 border-t border-slate-200/60">
                                        <Button
                                            variant="ghost"
                                            onClick={() => setActiveTab('questions')}
                                            className="text-slate-500 hover:text-slate-800"
                                        >
                                            Back
                                        </Button>
                                        <Button
                                            onClick={() => handleSaveAndProceed({ status: 'published', shouldRedirect: true })}
                                            disabled={saving}
                                            className="h-12 px-8 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-200 font-bold tracking-wide rounded-xl transform transition-all hover:scale-[1.02] active:scale-[0.98]"
                                        >
                                            {saving ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                                    Publishing...
                                                </>
                                            ) : (
                                                <>
                                                    SAVE & PUBLISH
                                                    <UploadCloud className="w-5 h-5 ml-2" />
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>

            {/* AI Generate Modal */}
            <Modal isOpen={isAIOpen} onClose={() => setIsAIOpen(false)} title="Generate Questions with AI">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Topic</Label>
                        <Input
                            placeholder="e.g. World War II, Calculus Derivatives"
                            value={aiParams.topic}
                            onChange={(e) => setAiParams({ ...aiParams, topic: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Question Count</Label>
                            <Input
                                type="number"
                                min="1"
                                max="20"
                                value={aiParams.count}
                                onChange={(e) => setAiParams({ ...aiParams, count: parseInt(e.target.value) || 5 })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Difficulty</Label>
                            <Select
                                value={aiParams.difficulty}
                                onValueChange={(val) => setAiParams({ ...aiParams, difficulty: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="easy">Easy</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="hard">Hard</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <Button onClick={handleAIGenerate} disabled={aiLoading} className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                        {aiLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <BrainCircuit className="w-4 h-4 mr-2" />}
                        Generate Questions
                    </Button>
                </div>
            </Modal>

            {/* Manual Add Question Modal - Large */}
            <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title={editingIndex >= 0 ? "Edit Question" : "Add New Question"} className="max-w-4xl">
                <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-2">
                    <div className="space-y-2">
                        <Label>Question Text</Label>
                        <RichTextEditor
                            value={currentQuestion.question}
                            onChange={(html) => setCurrentQuestion({ ...currentQuestion, question: html })}
                        />
                    </div>

                    <div className="space-y-3">
                        <Label>Options</Label>
                        {currentQuestion.options.map((opt, idx) => (
                            <div key={idx} className="flex items-center gap-3">
                                <div className="flex-none">
                                    <input
                                        type="radio"
                                        name="correctAnswer"
                                        checked={opt.isCorrect}
                                        onChange={() => handleCorrectSelect(idx)}
                                        className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                                    />
                                </div>
                                <div className="flex-1">
                                    <Input
                                        value={opt.text}
                                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                                        placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                                        className={opt.isCorrect ? "border-green-500 ring-1 ring-green-100" : ""}
                                    />
                                </div>
                                {currentQuestion.options.length > 2 && (
                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveOption(idx)} className="text-red-400 hover:text-red-500">
                                        <X className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>
                        ))}
                        {currentQuestion.options.length < 6 && (
                            <Button variant="outline" size="sm" onClick={handleAddOption} className="mt-2 text-xs">
                                <Plus className="w-3 h-3 mr-1" /> Add Option
                            </Button>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label>Points</Label>
                            <Input
                                type="number"
                                min="1"
                                value={currentQuestion.points}
                                onChange={(e) => setCurrentQuestion({ ...currentQuestion, points: parseFloat(e.target.value) || 1 })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Difficulty</Label>
                            <Select
                                value={currentQuestion.difficulty}
                                onValueChange={(val) => setCurrentQuestion({ ...currentQuestion, difficulty: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="easy">Easy</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="hard">Hard</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Explanation (Optional)</Label>
                        <Textarea
                            value={currentQuestion.explanation}
                            onChange={(e) => setCurrentQuestion({ ...currentQuestion, explanation: e.target.value })}
                            placeholder="Explain why this answer is correct..."
                            className="h-20"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveQuestion} className="bg-[#3b0d46] text-white">
                            {editingIndex >= 0 ? "Update Question" : "Add Question"}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
