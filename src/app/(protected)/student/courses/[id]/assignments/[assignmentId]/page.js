'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Loader2,
    CheckCircle,
    Calendar,
    FileText,
    Upload,
    Clock,
    Award,
    Download,
    MessageSquare,
    Send,
    AlertCircle,
    Trash2
} from 'lucide-react';
import api from '@/lib/axios';
import assignmentService from '@/services/assignmentService';
import { toast } from 'react-hot-toast';

export default function StudentAssignmentDetailsPage({ params }) {
    const router = useRouter();
    const { id: courseId, assignmentId } = use(params);

    const [assignment, setAssignment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Submission state
    const [content, setContent] = useState('');
    const [attachments, setAttachments] = useState([]);

    const isSubmitted = assignment?.mySubmission?.status === 'submitted';
    const isGraded = assignment?.mySubmission?.status === 'graded';
    const submission = assignment?.mySubmission;

    useEffect(() => {
        loadData();
    }, [assignmentId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const res = await assignmentService.getAssignmentDetails(assignmentId);
            if (res.success) {
                setAssignment(res.assignment);
                if (res.mySubmission) {
                    setContent(res.mySubmission.content || '');
                    setAttachments(res.mySubmission.attachments || []);
                }
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load assignment details");
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const uploadData = new FormData();
        uploadData.append('file', file);

        try {
            const res = await api.post('/upload/file', uploadData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data.success) {
                setAttachments(prev => [...prev, {
                    name: res.data.name,
                    url: res.data.fileUrl,
                    type: res.data.type
                }]);
                toast.success("File attached");
            }
        } catch (error) {
            console.error('Upload failed:', error);
            toast.error('Failed to attach file');
        }
    };

    const removeAttachment = (index) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!content.trim() && attachments.length === 0) {
            return toast.error("Please add some text or attach a file to submit.");
        }

        setSubmitting(true);
        try {
            const res = await assignmentService.submitAssignment(assignmentId, {
                content,
                attachments
            });

            if (res.success) {
                toast.success("Assignment submitted successfully!");
                loadData(); // Reload to get updated status
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Failed to submit assignment");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
            </div>
        );
    }

    if (!assignment) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-slate-50 gap-4">
                <AlertCircle className="w-16 h-16 text-slate-400" />
                <h2 className="text-xl font-bold text-slate-900">Assignment Not Found</h2>
                <button
                    onClick={() => router.push(`/student/courses/${courseId}`)}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-medium"
                >
                    Back to Course
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="max-w-5xl mx-auto space-y-6">

                {/* Header */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                            <button
                                onClick={() => router.push(`/student/courses/${courseId}`)}
                                className="p-2 hover:bg-slate-100 rounded-xl transition-colors shrink-0"
                            >
                                <ArrowLeft className="w-5 h-5 text-slate-600" />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 mb-2">
                                    {assignment.title}
                                </h1>
                                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                                    {assignment.dueDate && (
                                        <span className="flex items-center gap-1.5 font-medium text-amber-700 bg-amber-50 px-3 py-1 rounded-lg">
                                            <Calendar className="w-4 h-4" />
                                            Due: {new Date(assignment.dueDate).toLocaleString()}
                                        </span>
                                    )}
                                    <span className="flex items-center gap-1.5 font-medium text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg">
                                        <Award className="w-4 h-4" />
                                        {assignment.totalMarks} Points
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Status Badge */}
                        <div className={`px-4 py-2 font-bold rounded-xl text-center shadow-sm shrink-0 border ${isGraded ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                isSubmitted ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                    'bg-slate-50 text-slate-700 border-slate-200'
                            }`}>
                            {isGraded ? (
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                                    <span>Graded: {submission.grade} / {assignment.totalMarks}</span>
                                </div>
                            ) : isSubmitted ? (
                                <div className="flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-amber-600" />
                                    <span>Submitted, Pending Grade</span>
                                </div>
                            ) : (
                                <span>Pending Submission</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Details & Rubric */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Assignment Instructions */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-6 border-b border-slate-200 bg-slate-50">
                                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-indigo-600" />
                                    Instructions
                                </h2>
                            </div>
                            <div className="p-6">
                                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                                    {assignment.description}
                                </p>

                                {assignment.attachments?.length > 0 && (
                                    <div className="mt-8">
                                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Reference Materials</h3>
                                        <div className="grid gap-3">
                                            {assignment.attachments.map((file, idx) => (
                                                <a
                                                    key={idx}
                                                    href={file.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 hover:border-indigo-300 hover:shadow-sm rounded-xl transition-all group"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-indigo-100 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                                            <FileText className="w-5 h-5 text-indigo-600 group-hover:text-white" />
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-sm text-slate-700 group-hover:text-indigo-700">{file.name}</p>
                                                        </div>
                                                    </div>
                                                    <Download className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Grading Rubric */}
                        {assignment.rubric?.length > 0 && (
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="p-6 border-b border-slate-200 bg-slate-50">
                                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                        <Award className="w-5 h-5 text-indigo-600" />
                                        Grading Rubric
                                    </h2>
                                </div>
                                <div className="divide-y divide-slate-100">
                                    {assignment.rubric.map((item, idx) => {
                                        // If graded, find the specific score for this row
                                        const gradedScore = isGraded
                                            ? submission.rubricScores?.find(rs => rs.criterionId === item._id)
                                            : null;

                                        return (
                                            <div key={idx} className={`p-6 ${gradedScore ? 'bg-emerald-50/30' : ''}`}>
                                                <div className="flex items-start justify-between gap-4 mb-2">
                                                    <h3 className="font-bold text-slate-900">{item.criterion}</h3>
                                                    <span className={`font-bold text-sm px-3 py-1 rounded-full ${gradedScore ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-50 text-indigo-700'}`}>
                                                        {gradedScore ? `${gradedScore.points} / ` : ''}{item.points} pts
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-600">{item.description}</p>

                                                {gradedScore?.comments && (
                                                    <div className="mt-4 p-3 bg-white border border-emerald-200 rounded-xl flex items-start gap-3">
                                                        <MessageSquare className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                                                        <div>
                                                            <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">Tutor Feedback</p>
                                                            <p className="text-sm text-slate-700">{gradedScore.comments}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Submission Area / Feedback */}
                    <div className="space-y-6">
                        {isGraded && submission.feedback && (
                            <div className="bg-emerald-50 rounded-2xl shadow-sm border border-emerald-200 p-6 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500 opacity-5 rounded-bl-[100px]"></div>
                                <h2 className="text-lg font-bold text-emerald-900 flex items-center gap-2 mb-4 relative z-10">
                                    <MessageSquare className="w-5 h-5" />
                                    Overall Feedback
                                </h2>
                                <p className="text-emerald-800 text-sm leading-relaxed relative z-10">
                                    {submission.feedback}
                                </p>
                            </div>
                        )}

                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden sticky top-6">
                            <div className="p-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                                <h2 className="text-lg font-bold text-slate-900">Your Work</h2>
                                {isSubmitted && !isGraded && (
                                    <button
                                        onClick={() => assignmentService.submitAssignment(assignmentId, { content, attachments }).then(() => toast.success("Updated!"))}
                                        className="text-sm text-indigo-600 hover:text-indigo-700 font-bold px-3 py-1 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                                    >
                                        Update Submission
                                    </button>
                                )}
                            </div>

                            <div className="p-6">
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Text Response (Optional)</label>
                                        <textarea
                                            rows={6}
                                            value={content}
                                            onChange={(e) => setContent(e.target.value)}
                                            disabled={isGraded}
                                            placeholder="Type your answer or paste links here..."
                                            className="w-full px-4 py-3 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none disabled:bg-slate-50 disabled:text-slate-600"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Attached Files</label>

                                        {attachments.length > 0 && (
                                            <div className="space-y-3 mb-4">
                                                {attachments.map((file, idx) => (
                                                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-indigo-100 rounded-lg">
                                                                <FileText className="w-4 h-4 text-indigo-600" />
                                                            </div>
                                                            <p className="font-semibold text-sm text-slate-700 truncate max-w-[150px]">{file.name}</p>
                                                        </div>
                                                        <div className="flex gap-1">
                                                            <a
                                                                href={file.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                            >
                                                                <Download className="w-4 h-4" />
                                                            </a>
                                                            {!isGraded && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeAttachment(idx)}
                                                                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {!isGraded && (
                                            <div className="relative">
                                                <input
                                                    type="file"
                                                    onChange={handleFileUpload}
                                                    className="hidden"
                                                    id="student-attachment-upload"
                                                />
                                                <label
                                                    htmlFor="student-attachment-upload"
                                                    className="flex items-center justify-center gap-2 w-full p-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-600 text-sm font-semibold hover:border-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all cursor-pointer"
                                                >
                                                    <Upload className="w-4 h-4" />
                                                    Upload File
                                                </label>
                                            </div>
                                        )}
                                    </div>

                                    {!isGraded && (
                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm shadow-indigo-200 disabled:opacity-50"
                                        >
                                            {submitting ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : isSubmitted ? (
                                                <><CheckCircle className="w-5 h-5" /> Saved</>
                                            ) : (
                                                <><Send className="w-5 h-5" /> Submit Assignment</>
                                            )}
                                        </button>
                                    )}
                                </form>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
