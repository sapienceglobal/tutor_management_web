'use client';

import { useState, useEffect } from 'react';
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
import { cn } from '@/lib/utils'; // Ensure this exists

export default function CreateExamPage() {
    const router = useRouter();
    const [step, setStep] = useState(1); // 1: Mode, 2: Details, 3: Questions
    const [mode, setMode] = useState(null); // 'manual', 'ai', 'blueprint'
    const [loading, setLoading] = useState(false);

    // Data State
    const [courses, setCourses] = useState([]);
    const [examData, setExamData] = useState({
        title: '',
        courseId: '',
        duration: 30, // minutes
        description: '',
        difficulty: 'medium', // for AI
        questionCount: 5, // for AI
        topic: '', // for AI
        questions: []
    });

    useEffect(() => {
        // Fetch courses for dropdown
        const fetchCourses = async () => {
            try {
                const res = await api.get('/courses/my-courses');
                if (res.data.success) {
                    setCourses(res.data.courses);
                }
            } catch (err) {
                console.error('Error fetching courses:', err);
                if (err.response?.status === 403) {
                    alert('Access Denied: You must be a Tutor to create exams.');
                    router.push('/login');
                }
            }
        };
        fetchCourses();
    }, []);

    const handleModeSelect = (selectedMode) => {
        setMode(selectedMode);
        setStep(2);
    };

    const handleGenerateAI = async () => {
        if (!examData.topic || !examData.courseId) {
            alert('Please select a course and enter a topic.');
            return;
        }

        setLoading(true);
        try {
            const response = await api.post('/ai/generate-questions', {
                topic: examData.topic,
                count: Number(examData.questionCount),
                difficulty: examData.difficulty
            });

            // Here we would handle the generated questions
            // For now, let's just alert success and simulate
            // Add questions to previous data
            setExamData(prev => ({ ...prev, questions: response.data.questions }));
            setStep(3);
        } catch (error) {
            console.error('AI Generation Error:', error);
            alert('Failed to generate questions. ' + (error.response?.data?.message || ''));
        } finally {
            setLoading(false);
        }
    };

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
        // Ensure only one correct answer for simplicity (or allow multiples if backend supports)
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

    const handleSaveExam = async () => {
        setLoading(true);
        try {
            await api.post('/exams', {
                ...examData,
                // Ensure questions structure matches backend expectation if needed
            });
            alert('Exam Created Successfully!');
            router.push('/tutor/exams');
        } catch (error) {
            console.error('Error saving exam:', error);
            alert('Failed to save exam. ' + (error.response?.data?.message || ''));
        } finally {
            setLoading(false);
        }
    };

    // --- RENDER STEPS ---
    const renderModeSelection = () => (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <button
                onClick={() => handleModeSelect('ai')}
                className="group relative flex flex-col items-center p-8 bg-white rounded-2xl border-2 border-transparent hover:border-purple-500 shadow-sm hover:shadow-xl transition-all"
            >
                <div className="h-16 w-16 bg-purple-100 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Sparkles className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">AI Generator</h3>
                <p className="text-center text-sm text-gray-500 mt-2">
                    Enter a topic and let AI create questions for you instantly.
                </p>
                <Badge className="mt-4 bg-purple-100 text-purple-700 pointer-events-none">Recommended</Badge>
            </button>

            <button
                onClick={() => handleModeSelect('manual')}
                className="group relative flex flex-col items-center p-8 bg-white rounded-2xl border-2 border-transparent hover:border-blue-500 shadow-sm hover:shadow-xl transition-all"
            >
                <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <FileText className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Manual Creation</h3>
                <p className="text-center text-sm text-gray-500 mt-2">
                    Write your own questions and answers from scratch.
                </p>
            </button>

            <button
                onClick={() => handleModeSelect('blueprint')}
                className="group relative flex flex-col items-center p-8 bg-white rounded-2xl border-2 border-transparent hover:border-indigo-500 shadow-sm hover:shadow-xl transition-all"
            >
                <div className="h-16 w-16 bg-indigo-100 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Layers className="w-8 h-8 text-indigo-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Blueprint Mode</h3>
                <p className="text-center text-sm text-gray-500 mt-2">
                    Define a structure (e.g. 5 Easy, 2 Hard) and auto-fill.
                </p>
            </button>
        </div>
    );

    const renderDetailsForm = () => (
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl border shadow-sm mt-8">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                {mode === 'ai' && <Sparkles className="w-5 h-5 text-purple-600" />}
                {mode === 'manual' && <Pencil className="w-5 h-5 text-blue-600" />}
                Configure Exam Details
            </h2>

            <div className="space-y-6">
                <div className="grid gap-2">
                    <Label>Select Course</Label>
                    <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        value={examData.courseId}
                        onChange={(e) => setExamData({ ...examData, courseId: e.target.value })}
                    >
                        <option value="">-- Choose a Course --</option>
                        {courses.map(c => (
                            <option key={c._id} value={c._id}>{c.title}</option>
                        ))}
                    </select>
                </div>

                <div className="grid gap-2">
                    <Label>Exam Title</Label>
                    <Input
                        placeholder="e.g. Mid-term Assessment"
                        value={examData.title}
                        onChange={(e) => setExamData({ ...examData, title: e.target.value })}
                    />
                </div>

                {mode === 'ai' && (
                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-100 space-y-4">
                        <div className="grid gap-2">
                            <Label className="text-purple-900">Topic / Instructions for AI</Label>
                            <Textarea
                                placeholder="e.g. Generate questions about React Hooks, specifically useState and useEffect."
                                className="bg-white"
                                value={examData.topic}
                                onChange={(e) => setExamData({ ...examData, topic: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label className="text-purple-900">Difficulty</Label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
                                    value={examData.difficulty}
                                    onChange={(e) => setExamData({ ...examData, difficulty: e.target.value })}
                                >
                                    <option value="easy">Easy</option>
                                    <option value="medium">Medium</option>
                                    <option value="hard">Hard</option>
                                </select>
                            </div>
                            <div className="grid gap-2">
                                <Label className="text-purple-900">Question Count</Label>
                                <Input
                                    type="number"
                                    value={examData.questionCount}
                                    onChange={(e) => setExamData({ ...examData, questionCount: e.target.value })}
                                    className="bg-white"
                                />
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-4">
                    <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
                    {mode === 'ai' ? (
                        <Button
                            onClick={handleGenerateAI}
                            disabled={loading || !examData.courseId || !examData.topic}
                            className="bg-purple-600 hover:bg-purple-700"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Wand2 className="w-4 h-4 mr-2" />}
                            Generate Questions
                        </Button>
                    ) : (
                        <Button onClick={() => setStep(3)}>Next: Add Questions</Button>
                    )}
                </div>
            </div>
        </div>
    );

    const renderQuestionEditor = () => (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Review & Edit Questions</h2>
                <Button onClick={handleAddQuestion} variant="outline" className="border-dashed">
                    + Add Manually
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
                <Button
                    onClick={handleSaveExam}
                    className="bg-green-600 hover:bg-green-700 min-w-[150px]"
                    disabled={loading || examData.questions.length === 0}
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Exam
                </Button>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/tutor/exams">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Create New Exam</h1>
                    <p className="text-gray-500">
                        {step === 1 && "Choose how you want to create your assessment."}
                        {step === 2 && "Configure basic details."}
                        {step === 3 && "Review and edit questions."}
                    </p>
                </div>
            </div>

            {step === 1 && renderModeSelection()}
            {step === 2 && renderDetailsForm()}
            {step === 3 && renderQuestionEditor()}
        </div>
    );
}
