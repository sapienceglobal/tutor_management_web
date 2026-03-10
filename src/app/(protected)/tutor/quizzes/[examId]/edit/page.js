'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft, Sparkles, FileText, Layers, Loader2, Save,
    Pencil, Plus, Trash2, MessageSquare, ChevronRight, Settings,
    Eye, EyeOff, Clock, Calendar
} from 'lucide-react';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'react-hot-toast';
import AudienceSelector from '@/components/shared/AudienceSelector';
import useInstitute from '@/hooks/useInstitute';
import { cn } from '@/lib/utils';

// Step tab component
const StepTab = ({ step, currentStep, label, icon: Icon, onClick }) => {
    const isActive = currentStep === step;
    return (
        <button onClick={() => onClick(step)}
            className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                isActive ? "bg-orange-500 text-white shadow-sm shadow-orange-200" : "text-slate-500 hover:bg-slate-100 hover:text-slate-700")}>
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{label}</span>
        </button>
    );
};

const SettingRow = ({ label, desc, id, checked, onChange }) => (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
        <div>
            <Label htmlFor={id} className="text-sm font-medium text-slate-700 cursor-pointer">{label}</Label>
            {desc && <p className="text-xs text-slate-400 mt-0.5">{desc}</p>}
        </div>
        <Switch id={id} checked={checked} onCheckedChange={onChange} className="data-[state=checked]:bg-orange-500" />
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

    const totalQuestionMarks = (examData.questions || []).reduce((sum, q) => sum + (q.points || 1), 0);
    const derivedPassingMarks = totalQuestionMarks > 0
        ? Number((((Number(examData.passingPercentage) || 0) / 100) * totalQuestionMarks).toFixed(2))
        : 0;

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [coursesRes, examRes] = await Promise.all([api.get('/courses/my-courses'), api.get(`/exams/${examId}`)]);
                if (coursesRes.data.success) setCourses(coursesRes.data.courses);
                if (examRes.data.success) {
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
    }, [examId, router]);

    useEffect(() => {
        const fetchAudienceTargets = async () => {
            if (!examData.courseId) { setAvailableBatches([]); setAvailableStudents([]); return; }
            try {
                const [batchesRes, studentsRes] = await Promise.all([api.get('/batches'), api.get(`/enrollments/students/${examData.courseId}`)]);
                const batchList = (batchesRes.data?.batches || []).filter(b => (b.courseId?._id || b.courseId) === examData.courseId);
                setAvailableBatches(batchList);
                const studentList = (studentsRes.data?.students || []).map(item => ({ _id: item.studentId?._id, name: item.studentId?.name, email: item.studentId?.email })).filter(i => i._id);
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
            if (res.data.success) {
                if (newStatus) {
                    setExamData(prev => ({ ...prev, status: newStatus }));
                    toast.success(`Exam ${newStatus === 'published' ? 'Published' : 'Unpublished'}!`);
                } else {
                    toast.success('Exam Updated!');
                    router.push('/tutor/quizzes');
                }
            }
        } catch (error) {
            toast.error('Failed to update exam. ' + (error.response?.data?.message || ''));
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                <p className="text-sm text-slate-400">Loading exam data...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Link href="/tutor/quizzes">
                        <button className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors">
                            <ArrowLeft className="w-4 h-4 text-slate-500" />
                        </button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-2.5 mb-0.5">
                            <div className="w-7 h-7 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center">
                                <Pencil className="w-3.5 h-3.5 text-orange-500" />
                            </div>
                            <h1 className="text-lg font-bold text-slate-800">Edit Exam</h1>
                            {examData.status && (
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase
                                    ${examData.status === 'published' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                                    {examData.status}
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-slate-400 pl-0.5">
                            {step === 2 ? "Update exam details and settings." : "Modify questions and answers."}
                        </p>
                    </div>
                </div>

                {/* Step tabs */}
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                    <StepTab step={2} currentStep={step} label="Details" icon={Settings} onClick={setStep} />
                    <StepTab step={3} currentStep={step} label="Questions" icon={FileText} onClick={setStep} />
                </div>
            </div>

            {/* ── STEP 2: Details ──────────────────────────────────────────── */}
            {step === 2 && (
                <div className="max-w-2xl space-y-5">
                    {/* Basic Info Card */}
                    <div className="bg-white rounded-xl border border-slate-100 p-6 space-y-5">
                        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Basic Info</h2>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-slate-700">Select Course</Label>
                            <select
                                className="flex h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 cursor-not-allowed"
                                value={examData.courseId} disabled>
                                <option value="">-- Choose a Course --</option>
                                {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
                            </select>
                            <p className="text-xs text-slate-400">Course cannot be changed after creation.</p>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-slate-700">Exam Title</Label>
                            <Input placeholder="e.g. Mid-term Assessment" value={examData.title}
                                onChange={(e) => setExamData({ ...examData, title: e.target.value })}
                                className="h-10 border-slate-200 focus:border-orange-400 focus:ring-orange-500/10" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-slate-700">Duration (min)</Label>
                                <div className="relative">
                                    <Input type="number" value={examData.duration}
                                        onChange={(e) => setExamData({ ...examData, duration: Number(e.target.value) })}
                                        className="h-10 border-slate-200 pr-10 focus:border-orange-400 focus:ring-orange-500/10" />
                                    <Clock className="absolute right-3 top-3 w-4 h-4 text-slate-400" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-slate-700">Pass Percentage</Label>
                                <div className="relative">
                                    <Input type="number" min="0" max="100" value={examData.passingPercentage}
                                        onChange={(e) => setExamData({ ...examData, passingPercentage: Number(e.target.value) || 0 })}
                                        className="h-10 border-slate-200 pr-8 focus:border-orange-400 focus:ring-orange-500/10" />
                                    <span className="absolute right-3 top-2.5 text-slate-400 font-bold text-sm">%</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-slate-700">Passing Marks (Auto)</Label>
                            <Input type="number" value={derivedPassingMarks} readOnly className="h-10 bg-slate-50 border-slate-200 text-slate-500" />
                            <p className="text-xs text-slate-400">Derived from pass % and {totalQuestionMarks} total marks.</p>
                        </div>
                    </div>

                    {/* Audience */}
                    <div className="bg-white rounded-xl border border-slate-100 p-6">
                        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">Audience</h2>
                        <AudienceSelector value={examData.audience} onChange={(audience) => setExamData({ ...examData, audience })}
                            availableBatches={availableBatches} availableStudents={availableStudents}
                            allowGlobal={Boolean(!institute?._id || institute?.features?.allowGlobalPublishingByInstituteTutors)}
                            instituteId={institute?._id || null} />
                    </div>

                    {/* Advanced Settings */}
                    <div className="bg-white rounded-xl border border-slate-100 p-6">
                        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-1">Advanced Settings</h2>
                        <p className="text-xs text-slate-400 mb-5">Configure exam behavior and accessibility</p>

                        <SettingRow label="Show Result Immediately" desc="Show score after submission" id="showResult" checked={examData.showResultImmediately} onChange={(v) => setExamData({ ...examData, showResultImmediately: v })} />
                        <SettingRow label="Show Correct Answers" desc="Display answer key in results" id="showAnswers" checked={examData.showCorrectAnswers} onChange={(v) => setExamData({ ...examData, showCorrectAnswers: v })} />
                        <SettingRow label="Shuffle Questions" desc="Randomize question order" id="shuffleQ" checked={examData.shuffleQuestions} onChange={(v) => setExamData({ ...examData, shuffleQuestions: v })} />
                        <SettingRow label="Shuffle Options" desc="Randomize answer choices" id="shuffleO" checked={examData.shuffleOptions} onChange={(v) => setExamData({ ...examData, shuffleOptions: v })} />
                        <SettingRow label="Allow Retakes" desc="Enable multiple attempts" id="allowRetake" checked={examData.allowRetake} onChange={(v) => setExamData({ ...examData, allowRetake: v })} />
                        {examData.allowRetake && (
                            <div className="mt-3 ml-4 pl-3 border-l-2 border-orange-100 space-y-2">
                                <Label className="text-sm font-medium text-slate-700">Max Attempts</Label>
                                <Input type="number" min="1" value={examData.maxAttempts}
                                    onChange={(e) => setExamData({ ...examData, maxAttempts: Number(e.target.value) })}
                                    className="h-10 max-w-[120px] border-slate-200 focus:border-orange-400" />
                            </div>
                        )}

                        {/* Scheduling */}
                        <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                            <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-slate-400" /> Schedule (Optional)
                            </Label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <span className="text-xs text-slate-400 font-medium">Start Date & Time</span>
                                    <Input type="datetime-local" value={examData.startDate}
                                        onChange={(e) => setExamData({ ...examData, startDate: e.target.value })}
                                        className="h-10 border-slate-200 focus:border-orange-400 focus:ring-orange-500/10" />
                                </div>
                                <div className="space-y-1.5">
                                    <span className="text-xs text-slate-400 font-medium">End Date & Time</span>
                                    <Input type="datetime-local" value={examData.endDate}
                                        onChange={(e) => setExamData({ ...examData, endDate: e.target.value })}
                                        className="h-10 border-slate-200 focus:border-orange-400 focus:ring-orange-500/10" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Button onClick={() => setStep(3)} className="bg-orange-500 hover:bg-orange-600 text-white gap-2 shadow-sm shadow-orange-200">
                            Next: Edit Questions <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* ── STEP 3: Questions ────────────────────────────────────────── */}
            {step === 3 && (
                <div className="max-w-4xl space-y-5">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div>
                            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                Review & Edit Questions
                                <span className="bg-orange-100 text-orange-600 text-xs px-2 py-0.5 rounded-full font-bold">{examData.questions.length}</span>
                            </h2>
                            <p className="text-xs text-slate-400 mt-0.5">Modify or add questions to this exam</p>
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={() => handleAddQuestion('mcq')} variant="outline" size="sm" className="gap-1.5 border-dashed text-sm">
                                <Plus className="w-3.5 h-3.5" /> Add MCQ
                            </Button>
                            <Button onClick={() => handleAddQuestion('subjective')} variant="outline" size="sm" className="gap-1.5 border-dashed text-amber-600 border-amber-300 hover:bg-amber-50 text-sm">
                                <MessageSquare className="w-3.5 h-3.5" /> Add Subjective
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {examData.questions.map((q, qIndex) => {
                            const isSubjective = !q.options || q.options.length === 0;
                            return (
                                <div key={qIndex} className="bg-white p-5 rounded-xl border border-slate-100 hover:shadow-sm transition-shadow space-y-4">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-center gap-2">
                                                <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 text-xs font-bold flex items-center justify-center">{qIndex + 1}</span>
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${isSubjective ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                                                    {isSubjective ? 'SUBJECTIVE' : 'MCQ'}
                                                </span>
                                            </div>
                                            <Textarea value={q.question} onChange={(e) => handleQuestionChange(qIndex, 'question', e.target.value)}
                                                placeholder="Enter question text" className="border-slate-200 focus:border-orange-400 focus:ring-orange-500/10 resize-none min-h-[70px]" />
                                        </div>
                                        <button onClick={() => handleDeleteQuestion(qIndex)}
                                            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors flex-shrink-0 mt-6">
                                            <Trash2 className="w-4 h-4 text-red-400" />
                                        </button>
                                    </div>

                                    {isSubjective ? (
                                        <div className="ml-4 pl-3 border-l-2 border-amber-200 space-y-2">
                                            <Label className="text-xs font-semibold text-amber-700">Ideal Answer / Rubric</Label>
                                            <Textarea value={q.idealAnswer || ''} onChange={(e) => handleQuestionChange(qIndex, 'idealAnswer', e.target.value)}
                                                placeholder="Write the expected answer or grading rubric..." className="min-h-[70px] border-amber-200 focus:border-amber-400 resize-none text-sm" />
                                            <p className="text-xs text-slate-400">Not shown to students. For manual grading reference only.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-4 pl-3 border-l-2 border-slate-100">
                                            {q.options.map((opt, oIndex) => (
                                                <div key={oIndex} className="flex items-center gap-2.5">
                                                    <input type="radio" name={`correct-${qIndex}`} checked={opt.isCorrect}
                                                        onChange={() => handleOptionChange(qIndex, oIndex, 'isCorrect', true)}
                                                        className="w-4 h-4 text-orange-500 focus:ring-orange-400" />
                                                    <Input value={opt.text} onChange={(e) => handleOptionChange(qIndex, oIndex, 'text', e.target.value)}
                                                        placeholder={`Option ${oIndex + 1}`}
                                                        className={`h-9 text-sm ${opt.isCorrect ? 'border-emerald-400 ring-1 ring-emerald-100 bg-emerald-50' : 'border-slate-200'}`} />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {examData.questions.length === 0 && (
                            <div className="text-center py-14 bg-white rounded-xl border border-dashed border-slate-200 flex flex-col items-center">
                                <FileText className="w-10 h-10 text-slate-300 mb-3" />
                                <p className="text-sm text-slate-500 mb-5">No questions yet. Add some!</p>
                                <div className="flex gap-2">
                                    <Button onClick={() => handleAddQuestion('mcq')} variant="outline" size="sm" className="gap-1.5 text-sm"><Plus className="w-3.5 h-3.5" /> Add MCQ</Button>
                                    <Button onClick={() => handleAddQuestion('subjective')} variant="outline" size="sm" className="gap-1.5 text-amber-600 border-amber-300 hover:bg-amber-50 text-sm"><MessageSquare className="w-3.5 h-3.5" /> Add Subjective</Button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                        <Button variant="ghost" onClick={() => setStep(2)} className="text-slate-500 text-sm gap-1">
                            <ArrowLeft className="w-4 h-4" /> Back to Details
                        </Button>
                        <div className="flex gap-2">
                            {examData.status === 'published' ? (
                                <Button onClick={() => handleUpdateExam('draft')} variant="outline" size="sm" disabled={saving}
                                    className="text-slate-500 border-slate-200 gap-1.5 text-sm">
                                    <EyeOff className="w-4 h-4" /> Unpublish
                                </Button>
                            ) : (
                                <Button onClick={() => handleUpdateExam('published')} variant="outline" size="sm"
                                    disabled={saving || examData.questions.length === 0}
                                    className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 gap-1.5 text-sm">
                                    <Eye className="w-4 h-4" /> Publish
                                </Button>
                            )}
                            <Button onClick={() => handleUpdateExam()} disabled={saving || examData.questions.length === 0}
                                className="bg-orange-500 hover:bg-orange-600 text-white gap-2 text-sm shadow-sm shadow-orange-200">
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Save Changes
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}