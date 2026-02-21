'use client';

import { useState, useEffect } from 'react';
import {
    X,
    History,
    Star,
    TrendingUp,
    CheckCircle,
    XCircle,
    Clock,
    Award,
    Calendar,
    ArrowRight,
    BarChart3,
    PlayCircle
} from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';

export default function ExamHistoryModal({ exam, onClose, onViewAttempt, onStartExam }) {
    const [attempts, setAttempts] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadHistory();
    }, [exam._id]);

    const loadHistory = async () => {
        try {
            const response = await api.get(`/exams/${exam._id}/my-attempts`);

            if (response.data.success) {
                setAttempts(response.data.attempts || []);
                setStats(response.data.stats || null);
            }
        } catch (error) {
            console.error('Error loading history:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

        if (diffInDays === 0) {
            return `Today at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
        } else if (diffInDays === 1) {
            return 'Yesterday';
        } else if (diffInDays < 7) {
            return `${diffInDays} days ago`;
        } else {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }
    };

    const formatDuration = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        if (minutes > 0) {
            return `${minutes} min`;
        }
        return `${seconds} sec`;
    };

    const handleViewAttempt = async (attemptId) => {
        try {
            const response = await api.get(`/exams/attempt/${attemptId}`);

            if (response.data.success) {
                onViewAttempt({
                    attempt: response.data.attempt,
                    detailedResults: response.data.detailedResults
                });
            }
        } catch (error) {
            toast.error('Failed to load attempt details');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-8">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                            <History className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900">My Attempts</h2>
                            <p className="text-slate-600">{exam.title}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X className="w-6 h-6 text-slate-600" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Start Exam Button */}
                            {(() => {
                                const canTakeExam = onStartExam && (
                                    attempts.length === 0 ||
                                    (exam.allowRetake && (!exam.maxAttempts || attempts.length < exam.maxAttempts))
                                );

                                return canTakeExam && (
                                    <button
                                        onClick={() => {
                                            onClose();
                                            onStartExam();
                                        }}
                                        className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
                                    >
                                        <PlayCircle className="w-5 h-5" />
                                        {attempts.length > 0 ? 'Retake Exam' : 'Start Exam'}
                                    </button>
                                );
                            })()}

                            {attempts.length === 0 ? (
                                <div className="text-center py-16">
                                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <History className="w-10 h-10 text-slate-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-2">No Attempts Yet</h3>
                                    <p className="text-slate-600">You haven't taken this exam yet</p>
                                </div>
                            ) : (
                                <>
                                    {/* Stats Card */}
                                    {stats && (
                                        <div className={`p-6 rounded-2xl bg-gradient-to-br ${stats.passed
                                            ? 'from-green-500 to-green-600'
                                            : 'from-blue-500 to-blue-600'
                                            } text-white shadow-xl`}>
                                            <div className="grid grid-cols-3 gap-6 mb-6">
                                                <div className="text-center">
                                                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                                                        <History className="w-6 h-6" />
                                                    </div>
                                                    <div className="text-3xl font-bold mb-1">{stats.totalAttempts}</div>
                                                    <div className="text-white/80 text-sm">Total Attempts</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                                                        <Star className="w-6 h-6 fill-white" />
                                                    </div>
                                                    <div className="text-3xl font-bold mb-1">{stats.bestScore}%</div>
                                                    <div className="text-white/80 text-sm">Best Score</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                                                        <TrendingUp className="w-6 h-6" />
                                                    </div>
                                                    <div className="text-3xl font-bold mb-1">{stats.averageScore}%</div>
                                                    <div className="text-white/80 text-sm">Average Score</div>
                                                </div>
                                            </div>

                                            {stats.passed && (
                                                <div className="p-3 bg-white/20 rounded-xl flex items-center justify-center gap-2">
                                                    <CheckCircle className="w-5 h-5" />
                                                    <span className="font-bold tracking-wider">PASSED</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Attempts List */}
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 mb-4">Attempt History</h3>
                                        <div className="space-y-3">
                                            {attempts.map((attempt) => {
                                                const isPassed = attempt.isPassed;
                                                const score = attempt.score;

                                                return (
                                                    <button
                                                        key={attempt._id}
                                                        onClick={() => handleViewAttempt(attempt._id)}
                                                        className={`w-full p-5 rounded-xl border-2 transition-all text-left hover:shadow-lg ${isPassed
                                                            ? 'border-green-300 bg-green-50 hover:bg-green-100'
                                                            : 'border-slate-200 bg-white hover:border-slate-300'
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            {/* Score Circle */}
                                                            <div className={`w-16 h-16 rounded-full flex flex-col items-center justify-center font-bold ${isPassed
                                                                ? 'bg-green-100 text-green-700'
                                                                : 'bg-orange-100 text-orange-700'
                                                                }`}>
                                                                <div className="text-xl">{score}%</div>
                                                                {isPassed ? (
                                                                    <CheckCircle className="w-4 h-4 fill-current" />
                                                                ) : (
                                                                    <XCircle className="w-4 h-4" />
                                                                )}
                                                            </div>

                                                            {/* Details */}
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <h4 className="font-bold text-slate-900">
                                                                        Attempt #{attempt.attemptNumber}
                                                                    </h4>
                                                                    {isPassed && (
                                                                        <span className="px-2 py-0.5 bg-green-600 text-white text-xs font-bold rounded">
                                                                            PASSED
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p className="text-sm text-slate-600 mb-2">
                                                                    {formatDate(attempt.submittedAt)}
                                                                </p>
                                                                <div className="flex items-center gap-4 text-sm text-slate-600">
                                                                    <div className="flex items-center gap-1">
                                                                        <Clock className="w-4 h-4" />
                                                                        {formatDuration(attempt.timeSpent)}
                                                                    </div>
                                                                    <div className="flex items-center gap-1">
                                                                        <Award className="w-4 h-4 text-amber-500" />
                                                                        {attempt.correctAnswers}/{attempt.totalQuestions}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <ArrowRight className="w-5 h-5 text-slate-400" />
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

}