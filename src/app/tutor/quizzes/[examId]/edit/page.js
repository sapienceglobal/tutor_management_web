'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Sparkles,
    FileText,
    Layers,
    Loader2,
    Save,
    Pencil,
    Wand2
} from 'lucide-react';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';

export default function EditExamPage({ params }) {
    const { examId } = use(params);
    const router = useRouter();
    const [step, setStep] = useState(2); // Start at Details step
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Data State
    const [courses, setCourses] = useState([]);
    const [examData, setExamData] = useState({
        title: '',
        courseId: '',
        duration: 30, // minutes
        passingMarks: 10,
        description: '',
        // Advanced Settings
        allowRetake: false,
        maxAttempts: 1,
        showResultImmediately: true,
        showCorrectAnswers: true,
        shuffleQuestions: false,
        shuffleOptions: false,
        startDate: '',
        endDate: '',
        questions: []
    });

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [coursesRes, examRes] = await Promise.all([
                    api.get('/courses/my-courses'),
                    api.get(`/exams/${examId}`)
                ]);

                if (coursesRes.data.success) {
                    setCourses(coursesRes.data.courses);
                }

                if (examRes.data.success) {
                    const exam = examRes.data.exam;

                    // Format dates for datetime-local input (YYYY-MM-DDThh:mm)
                    const formatDate = (dateString) => {
                        if (!dateString) return '';
                        return new Date(dateString).toISOString().slice(0, 16);
                    };

                    setExamData({
                        ...exam,
                        courseId: exam.courseId._id || exam.courseId, // Handle populated or unpopulated
                        startDate: formatDate(exam.startDate),
                        endDate: formatDate(exam.endDate),
                        questions: exam.questions.map(q => ({
                            ...q,
                            points: q.points || 1, // Ensure points exist
                            explanation: q.explanation || ''
                        }))
                    });
                }
            } catch (error) {
                console.error('Error fetching data:', error);
                toast.error('Failed to load exam data.');
                router.push('/tutor/quizzes');
            } finally {
                setLoading(false);
            }
        };

        if (examId) {
            fetchInitialData();
        }
    }, [examId, router]);

    const handleAddQuestion = () => {
        setExamData(prev => ({
            ...prev,
            questions: [
                ...prev.questions,
                {
                    question: 'New Question',
                    options: [
                        { text: 'Option A', isCorrect: true },
                        { text: 'Option B', isCorrect: false },
                        { text: 'Option C', isCorrect: false },
                        { text: 'Option D', isCorrect: false },
                    ],
                    points: 1
                }
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
        // Ensure only one correct answer for simplicity
        if (field === 'isCorrect' && value === true) {
            updatedQuestions[qIndex].options.forEach((opt, idx) => {
                if (idx !== oIndex) opt.isCorrect = false;
            });
        }
        setExamData({ ...examData, questions: updatedQuestions });
    };

    const handleDeleteQuestion = (index) => {
        const updatedQuestions = examData.questions.filter((_, i) => i !== index);
        setExamData({ ...examData, questions: updatedQuestions });
    };

    const handleUpdateExam = async (newStatus = null) => {
        setSaving(true);
        try {
            // Prepare payload - ensure dates are handled correctly
            const payload = {
                ...examData,
                startDate: examData.startDate || null,
                endDate: examData.endDate || null,
                status: newStatus || examData.status, // Update status if provided
            };

            const res = await api.patch(`/exams/${examId}`, payload);
            if (res.data.success) {
                // Update local state if status changed without navigation
                if (newStatus) {
                    setExamData(prev => ({ ...prev, status: newStatus }));
                    toast.success(`Exam ${newStatus === 'published' ? 'Published' : 'Unpublished'} Successfully!`);
                } else {
                    toast.success('Exam Updated Successfully!');
                    router.push('/tutor/quizzes');
                }
            }
        } catch (error) {
            console.error('Error updating exam:', error);
            toast.error('Failed to update exam. ' + (error.response?.data?.message || ''));
        } finally {
            setSaving(false);
        }
    };

    const renderDetailsForm = () => (
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl border shadow-sm mt-8">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Pencil className="w-5 h-5 text-blue-600" />
                Edit Exam Details
            </h2>

            <div className="space-y-6">
                <div className="grid gap-2">
                    <Label>Select Course</Label>
                    <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        value={examData.courseId}
                        onChange={(e) => setExamData({ ...examData, courseId: e.target.value })}
                        disabled // Typically shouldn't change course of existing exam to avoid data issues
                    >
                        <option value="">-- Choose a Course --</option>
                        {courses.map(c => (
                            <option key={c._id} value={c._id}>{c.title}</option>
                        ))}
                    </select>
                    <p className="text-xs text-gray-500">Course cannot be changed after creation.</p>
                </div>

                <div className="grid gap-2">
                    <Label>Exam Title</Label>
                    <Input
                        placeholder="e.g. Mid-term Assessment"
                        value={examData.title}
                        onChange={(e) => setExamData({ ...examData, title: e.target.value })}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label>Duration (minutes)</Label>
                        <Input
                            type="number"
                            value={examData.duration}
                            onChange={(e) => setExamData({ ...examData, duration: Number(e.target.value) })}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label>Passing Marks</Label>
                        <Input
                            type="number"
                            value={examData.passingMarks}
                            onChange={(e) => setExamData({ ...examData, passingMarks: Number(e.target.value) })}
                        />
                    </div>
                </div>

                {/* Advanced Settings Section */}
                <div className="border-t pt-6 mt-6 space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Layers className="w-5 h-5 text-gray-500" />
                        Advanced Settings
                    </h3>

                    {/* Retake Policy */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label className="cursor-pointer" htmlFor="allowRetake">Allow Retakes?</Label>
                            <input
                                id="allowRetake"
                                type="checkbox"
                                checked={examData.allowRetake}
                                onChange={(e) => setExamData({ ...examData, allowRetake: e.target.checked })}
                                className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                            />
                        </div>

                        {examData.allowRetake && (
                            <div className="grid gap-2 pl-4 border-l-2 border-purple-100">
                                <Label>Max Attempts</Label>
                                <Input
                                    type="number"
                                    min="1"
                                    value={examData.maxAttempts}
                                    onChange={(e) => setExamData({ ...examData, maxAttempts: Number(e.target.value) })}
                                />
                            </div>
                        )}
                    </div>

                    {/* Result Visibility */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <Label htmlFor="showResult">Show Result Immediately</Label>
                                <p className="text-xs text-gray-500">Show score after submission</p>
                            </div>
                            <input
                                id="showResult"
                                type="checkbox"
                                checked={examData.showResultImmediately}
                                onChange={(e) => setExamData({ ...examData, showResultImmediately: e.target.checked })}
                                className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <Label htmlFor="showAnswers">Show Correct Answers</Label>
                                <p className="text-xs text-gray-500">Display answer key in results</p>
                            </div>
                            <input
                                id="showAnswers"
                                type="checkbox"
                                checked={examData.showCorrectAnswers}
                                onChange={(e) => setExamData({ ...examData, showCorrectAnswers: e.target.checked })}
                                className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                            />
                        </div>
                    </div>

                    {/* Shuffling */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="shuffleQuestions">Shuffle Questions</Label>
                            <input
                                id="shuffleQuestions"
                                type="checkbox"
                                checked={examData.shuffleQuestions}
                                onChange={(e) => setExamData({ ...examData, shuffleQuestions: e.target.checked })}
                                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label htmlFor="shuffleOptions">Shuffle Options</Label>
                            <input
                                id="shuffleOptions"
                                type="checkbox"
                                checked={examData.shuffleOptions}
                                onChange={(e) => setExamData({ ...examData, shuffleOptions: e.target.checked })}
                                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Scheduling */}
                    <div className="space-y-4">
                        <Label>Schedule Exam (Optional)</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <span className="text-xs text-gray-500">Start Date & Time</span>
                                <Input
                                    type="datetime-local"
                                    value={examData.startDate}
                                    onChange={(e) => setExamData({ ...examData, startDate: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <span className="text-xs text-gray-500">End Date & Time</span>
                                <Input
                                    type="datetime-local"
                                    value={examData.endDate}
                                    onChange={(e) => setExamData({ ...examData, endDate: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <Button onClick={() => setStep(3)}>Next: Edit Questions</Button>
                </div>
            </div>
        </div>
    );

    const renderQuestionEditor = () => (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Review & Edit Questions</h2>
                <Button onClick={handleAddQuestion} variant="outline" className="border-dashed">
                    + Add Question
                </Button>
            </div>

            <div className="space-y-6">
                {examData.questions.map((q, qIndex) => (
                    <div key={qIndex} className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
                        <div className="flex justify-between items-start gap-4">
                            <div className="flex-1 grid gap-2">
                                <Label>Question {qIndex + 1}</Label>
                                <Textarea
                                    value={q.question}
                                    onChange={(e) => handleQuestionChange(qIndex, 'question', e.target.value)}
                                    placeholder="Enter question text"
                                />
                            </div>
                            <Button
                                variant="destructive"
                                size="icon"
                                className="h-8 w-8 mt-6"
                                onClick={() => handleDeleteQuestion(qIndex)}
                            >
                                <span className="sr-only">Delete</span>
                                ×
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4 border-l-2 border-gray-100">
                            {q.options.map((opt, oIndex) => (
                                <div key={oIndex} className="flex items-center gap-3">
                                    <input
                                        type="radio"
                                        name={`correct-${qIndex}`}
                                        checked={opt.isCorrect}
                                        onChange={() => handleOptionChange(qIndex, oIndex, 'isCorrect', true)}
                                        className="h-4 w-4 text-purple-600 focus:ring-purple-500"
                                    />
                                    <Input
                                        value={opt.text}
                                        onChange={(e) => handleOptionChange(qIndex, oIndex, 'text', e.target.value)}
                                        placeholder={`Option ${oIndex + 1}`}
                                        className={opt.isCorrect ? "border-green-500 ring-1 ring-green-500 bg-green-50" : ""}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex justify-end gap-3 pt-8 border-t">
                <Button variant="ghost" onClick={() => setStep(2)}>Back</Button>
                <div className="flex gap-2">
                    {/* Status Actions */}
                    {examData.status === 'published' ? (
                        <Button
                            onClick={() => handleUpdateExam('draft')}
                            variant="outline"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            disabled={saving}
                        >
                            Unpublish (Draft)
                        </Button>
                    ) : (
                        <Button
                            onClick={() => handleUpdateExam('published')}
                            variant="outline"
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            disabled={saving || examData.questions.length === 0}
                        >
                            Publish Exam
                        </Button>
                    )}

                    <Button
                        onClick={() => handleUpdateExam()}
                        className="bg-purple-600 hover:bg-purple-700 min-w-[150px]"
                        disabled={saving || examData.questions.length === 0}
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        Save Changes
                    </Button>
                </div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-10 h-10 animate-spin text-purple-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/tutor/quizzes">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Edit Exam</h1>
                    <p className="text-gray-500">
                        {step === 2 && "Update exam details and settings."}
                        {step === 3 && "Modify questions and answers."}
                    </p>
                </div>
            </div>

            {step === 2 && renderDetailsForm()}
            {step === 3 && renderQuestionEditor()}
        </div>
    );
}
