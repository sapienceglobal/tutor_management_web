'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Loader2,
    CheckCircle,
    User,
    Download,
    MessageSquare,
    Calculator
} from 'lucide-react';
import api from '@/lib/axios';
import assignmentService from '@/services/assignmentService';
import { toast } from 'react-hot-toast';

export default function AssignmentSubmissionsPage({ params }) {
    const router = useRouter();
    const { id: courseId, assignmentId } = use(params);

    const [assignment, setAssignment] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
    const [selectedSubmission, setSelectedSubmission] = useState(null);

    // Grading form state
    const [feedback, setFeedback] = useState('');
    const [rubricScores, setRubricScores] = useState([]);
    const [submittingGrade, setSubmittingGrade] = useState(false);

    useEffect(() => {
        loadData();
    }, [assignmentId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [assignRes, subsRes] = await Promise.all([
                assignmentService.getAssignmentDetails(assignmentId),
                assignmentService.getSubmissions(assignmentId)
            ]);

            if (assignRes.success) {
                setAssignment(assignRes.assignment);
            }
            if (subsRes.success) {
                setSubmissions(subsRes.submissions);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load submissions");
        } finally {
            setLoading(false);
        }
    };

    const openGradeModal = (submission) => {
        setSelectedSubmission(submission);
        setFeedback(submission.feedback || '');

        // Initialize rubric scores based on assignment's rubric
        if (assignment && assignment.rubric) {
            const initialScores = assignment.rubric.map(crit => {
                const existingScore = submission.rubricScores?.find(rs => rs.criterionId === crit._id);
                return {
                    criterionId: crit._id,
                    criterionName: crit.criterion,
                    maxPoints: crit.points,
                    points: existingScore ? existingScore.points : 0,
                    comments: existingScore ? existingScore.comments : ''
                };
            });
            setRubricScores(initialScores);
        }

        setIsGradeModalOpen(true);
    };

    const handleUpdateScore = (index, field, value) => {
        setRubricScores(prev => {
            const newScores = [...prev];
            newScores[index] = { ...newScores[index], [field]: value };
            return newScores;
        });
    };

    const submitGrade = async (e) => {
        e.preventDefault();

        const totalCalculatedGrade = rubricScores.reduce((acc, curr) => acc + Number(curr.points || 0), 0);

        setSubmittingGrade(true);
        try {
            const res = await assignmentService.gradeSubmission(selectedSubmission._id, {
                grade: totalCalculatedGrade,
                feedback,
                rubricScores: rubricScores.map(rs => ({
                    criterionId: rs.criterionId,
                    points: rs.points,
                    comments: rs.comments
                }))
            });

            if (res.success) {
                toast.success("Grade submitted successfully");

                // Update local state
                setSubmissions(prev => prev.map(s =>
                    s._id === selectedSubmission._id ? res.submission : s
                ));

                setIsGradeModalOpen(false);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to submit grade");
        } finally {
            setSubmittingGrade(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="max-w-6xl mx-auto space-y-6">

                {/* Header */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push(`/tutor/courses/${courseId}/assignments`)}
                            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-slate-600" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">
                                {assignment?.title} - Submissions
                            </h1>
                            <p className="text-slate-500 mt-1">
                                {submissions.length} total submission{submissions.length !== 1 && 's'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Submissions Table/List */}
                {submissions.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <User className="w-10 h-10 text-slate-400" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">No Submissions Yet</h3>
                        <p className="text-slate-500 max-w-md mx-auto">
                            Students have not submitted any work for this assignment yet.
                        </p>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-sm font-semibold text-slate-500 uppercase tracking-wider">
                                    <th className="px-6 py-4">Student</th>
                                    <th className="px-6 py-4">Submitted At</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Score</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 text-sm">
                                {submissions.map(sub => (
                                    <tr key={sub._id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                                                    {sub.studentId?.name ? sub.studentId.name[0].toUpperCase() : 'U'}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900">{sub.studentId?.name || 'Unknown Student'}</p>
                                                    <p className="text-xs text-slate-500">{sub.studentId?.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {new Date(sub.submittedAt).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${sub.status === 'graded'
                                                    ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200'
                                                    : 'bg-amber-100 text-amber-700 ring-1 ring-amber-200'
                                                }`}>
                                                {sub.status === 'graded' && <CheckCircle className="w-3.5 h-3.5" />}
                                                {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {sub.status === 'graded' ? (
                                                <div className="font-bold text-slate-900">
                                                    {sub.grade} <span className="text-slate-400 font-normal">/ {assignment?.totalMarks}</span>
                                                </div>
                                            ) : (
                                                <span className="text-slate-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => openGradeModal(sub)}
                                                className={`px-4 py-2 rounded-lg font-semibold transition-all shadow-sm ${sub.status === 'graded'
                                                        ? 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                                                        : 'bg-indigo-600 border border-transparent text-white hover:bg-indigo-700'
                                                    }`}
                                            >
                                                {sub.status === 'graded' ? 'Update Grade' : 'Grade Now'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Grading Modal */}
            {isGradeModalOpen && selectedSubmission && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex justify-end">
                    <div className="w-full max-w-2xl bg-white h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">

                        {/* Header */}
                        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Grading Student Work</h2>
                                <p className="text-sm text-slate-500">{selectedSubmission.studentId?.name}</p>
                            </div>
                            <button
                                onClick={() => setIsGradeModalOpen(false)}
                                className="p-2 hover:bg-slate-200 rounded-xl transition-colors text-slate-500"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Scrolling Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-8">

                            {/* Student's Submission Content */}
                            <section>
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">Student's Work</h3>

                                {selectedSubmission.content && (
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4 text-slate-700 whitespace-pre-wrap text-sm">
                                        {selectedSubmission.content}
                                    </div>
                                )}

                                {selectedSubmission.attachments?.length > 0 ? (
                                    <div className="space-y-2">
                                        {selectedSubmission.attachments.map((file, idx) => (
                                            <a
                                                key={idx}
                                                href={file.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-3 p-3 bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-sm rounded-xl transition-all group"
                                            >
                                                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                                    <Download className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-semibold text-slate-700 group-hover:text-indigo-600 transition-colors">
                                                        {file.name}
                                                    </p>
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                ) : !selectedSubmission.content && (
                                    <p className="text-slate-500 italic text-sm">No text or files provided in this submission.</p>
                                )}
                            </section>

                            {/* Rubric Evaluator */}
                            <section>
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2 flex items-center justify-between">
                                    <span>Rubric Evaluation</span>
                                    <span className="text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full text-xs">
                                        Total: {rubricScores.reduce((acc, curr) => acc + Number(curr.points || 0), 0)} / {assignment?.totalMarks}
                                    </span>
                                </h3>

                                <div className="space-y-4">
                                    {rubricScores.map((score, idx) => (
                                        <div key={idx} className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                                            <div className="flex items-center justify-between">
                                                <p className="font-bold text-slate-900">{score.criterionName}</p>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max={score.maxPoints}
                                                        value={score.points}
                                                        onChange={(e) => handleUpdateScore(idx, 'points', e.target.value)}
                                                        className="w-20 px-3 py-1.5 font-bold text-right border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                    />
                                                    <span className="text-sm text-slate-500 font-medium">/ {score.maxPoints} pts</span>
                                                </div>
                                            </div>
                                            <textarea
                                                rows={2}
                                                value={score.comments}
                                                onChange={(e) => handleUpdateScore(idx, 'comments', e.target.value)}
                                                placeholder={`Add feedback specifically for ${score.criterionName}...`}
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 hover:bg-white focus:bg-white transition-colors resize-none"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Overall Feedback */}
                            <section>
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">Overall Feedback</h3>
                                <textarea
                                    rows={4}
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                    placeholder="Provide comprehensive feedback for the student..."
                                    className="w-full px-4 py-3 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none shadow-sm"
                                />
                            </section>

                        </div>

                        {/* Footer / Submit Button */}
                        <div className="p-4 border-t border-slate-200 bg-white shrink-0">
                            <button
                                onClick={submitGrade}
                                disabled={submittingGrade}
                                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
                            >
                                {submittingGrade ? <Loader2 className="w-5 h-5 animate-spin" /> : <Calculator className="w-5 h-5" />}
                                Submit Final Grade ({rubricScores.reduce((acc, curr) => acc + Number(curr.points || 0), 0)} pts)
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
