'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Upload as UploadIcon,
    FileText,
    Loader2,
    Bot,
    X,
    ChevronDown,
} from 'lucide-react';
import api from '@/lib/axios';
import assignmentService from '@/services/assignmentService';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';
import AiTutorWidget from '@/components/AiTutorWidget';

const MAX_SIZE_MB = 20;
const ALLOWED_EXT = ['.pdf', '.doc', '.docx', '.txt', '.png', '.jpg', '.jpeg'];

export default function UploadAssignmentPage() {
    const router = useRouter();
    const [enrollments, setEnrollments] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
    const [files, setFiles] = useState([]);
    const [comments, setComments] = useState('');
    const [dragOver, setDragOver] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        api.get('/enrollments/my-enrollments').then((res) => {
            if (res.data?.enrollments) setEnrollments(res.data.enrollments);
        }).catch(() => { });
    }, []);

    useEffect(() => {
        if (!selectedCourseId) {
            setAssignments([]);
            setSelectedAssignmentId('');
            return;
        }
        assignmentService.getCourseAssignments(selectedCourseId).then((res) => {
            setAssignments(res.assignments || []);
            setSelectedAssignmentId('');
        }).catch(() => setAssignments([]));
    }, [selectedCourseId]);

    const validateFile = (file) => {
        const ext = '.' + (file.name.split('.').pop() || '').toLowerCase();
        if (!ALLOWED_EXT.includes(ext)) {
            toast.error(`Allowed: PDF, DOC, DOCX, TXT, PNG, JPG`);
            return false;
        }
        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
            toast.error(`Max file size: ${MAX_SIZE_MB}MB`);
            return false;
        }
        return true;
    };

    const onFiles = useCallback((list) => {
        const valid = [];
        list.forEach((f) => {
            if (validateFile(f)) valid.push(f);
        });
        setFiles((prev) => [...prev, ...valid]);
    }, []);

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        const list = Array.from(e.dataTransfer?.files || []);
        onFiles(list);
    };

    const handleFileInput = (e) => {
        const list = Array.from(e.target.files || []);
        onFiles(list);
        e.target.value = '';
    };

    const removeFile = (index) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedAssignmentId) {
            toast.error('Please select an assignment');
            return;
        }
        if (files.length === 0) {
            toast.error('Please add at least one file');
            return;
        }

        setSubmitting(true);
        try {
            const attachments = [];
            for (const file of files) {
                const formData = new FormData();
                formData.append('file', file);
                const res = await api.post('/upload/file', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                if (res.data?.fileUrl) {
                    attachments.push({ name: file.name, url: res.data.fileUrl, type: res.data.type || file.type });
                }
            }
            const res = await assignmentService.submitAssignment(selectedAssignmentId, {
                content: comments.trim() || undefined,
                attachments,
            });
            if (res?.success) {
                toast.success('Assignment submitted successfully!');
                router.push('/student/assignments');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Submission failed');
        } finally {
            setSubmitting(false);
        }
    };

    const recommendedTopics = [
        'What is machine learning?',
        'Can you explain supervised vs. unsupervised learning?',
    ];

    return (
        <div className="min-h-screen bg-[#f0f2f8]">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
                <h1 className="text-2xl font-bold text-slate-900 mb-6">Upload Assignment</h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Form */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
                            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">Upload Assignment</h2>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Course</label>
                                    <select
                                        value={selectedCourseId}
                                        onChange={(e) => setSelectedCourseId(e.target.value)}
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        <option value="">Select Course</option>
                                        {enrollments.map((e) => (
                                            <option key={e.courseId?._id || e.courseId} value={e.courseId?._id || e.courseId}>
                                                {e.courseId?.title || 'Course'}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Assignment</label>
                                    <select
                                        value={selectedAssignmentId}
                                        onChange={(e) => setSelectedAssignmentId(e.target.value)}
                                        className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        <option value="">Select Assignment</option>
                                        {assignments.map((a) => (
                                            <option key={a._id} value={a._id}>{a.title}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Files</label>
                                    <div
                                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                        onDragLeave={() => setDragOver(false)}
                                        onDrop={handleDrop}
                                        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${dragOver ? 'border-indigo-400 bg-indigo-50/50' : 'border-slate-200 bg-slate-50/50'}`}
                                    >
                                        <input
                                            type="file"
                                            multiple
                                            accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                                            onChange={handleFileInput}
                                            className="hidden"
                                            id="upload-files"
                                        />
                                        <label htmlFor="upload-files" className="cursor-pointer block">
                                            <UploadIcon className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                                            <p className="text-slate-600 font-medium">Drag and drop your files here or click to upload</p>
                                            <p className="text-slate-500 text-sm mt-1">Supported file types: PDF, DOC, DOCX, TXT, PNG, JPG</p>
                                            <p className="text-slate-500 text-sm">Max file size: {MAX_SIZE_MB}MB</p>
                                        </label>
                                    </div>
                                    {files.length > 0 && (
                                        <ul className="mt-3 space-y-2">
                                            {files.map((f, i) => (
                                                <li key={i} className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg text-sm">
                                                    <span className="truncate text-slate-700">{f.name}</span>
                                                    <button type="button" onClick={() => removeFile(i)} className="text-slate-400 hover:text-red-500">
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Comments (Optional)</label>
                                    <textarea
                                        value={comments}
                                        onChange={(e) => setComments(e.target.value)}
                                        placeholder="Add any comments or additional information..."
                                        rows={4}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-lg bg-white text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <Link href="/student/assignments">
                                        <Button type="button" variant="outline" className="bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200">
                                            Cancel
                                        </Button>
                                    </Link>
                                    <Button
                                        type="submit"
                                        disabled={submitting}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                    >
                                        {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                        Submit Assignment
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* AI Tutor widget */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-6">
                            <AiTutorWidget
                                title="Submission Assistant"
                                subtitle="Need help with this assignment? Ask me!"
                                context={{
                                    pageType: 'assignment_upload',
                                    courseId: selectedCourseId,
                                    assignmentId: selectedAssignmentId
                                }}
                                recommendedTopics={[
                                    'What are the key requirements for this type of assignment?',
                                    'Can you help me structure my essay/report?',
                                    'What should I double check before submitting?'
                                ]}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
