'use client';

import {
    X,
    CheckCircle,
    XCircle,
    HelpCircle,
    Award,
    Clock,
    Calendar,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { useState } from 'react';

export default function ExamResultModal({ result, onClose }) {
    const { attempt, detailedResults } = result;
    const [expandedQuestions, setExpandedQuestions] = useState([]);

    const toggleQuestion = (index) => {
        setExpandedQuestions(prev =>
            prev.includes(index)
                ? prev.filter(i => i !== index)
                : [...prev, index]
        );
    };

    const toggleAll = () => {
        if (expandedQuestions.length === detailedResults.length) {
            setExpandedQuestions([]);
        } else {
            setExpandedQuestions(detailedResults.map((_, i) => i));
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-8 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200 shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">Exam Results</h2>
                        <p className="text-slate-600">Review your performance</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X className="w-6 h-6 text-slate-600" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    {/* Summary Card */}
                    <div className={`p-6 rounded-2xl bg-gradient-to-br ${attempt.isPassed
                        ? 'from-green-500 to-green-600'
                        : 'from-red-500 to-red-600'
                        } text-white shadow-lg mb-8`}>
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                                    {attempt.isPassed ? (
                                        <CheckCircle className="w-8 h-8" />
                                    ) : (
                                        <XCircle className="w-8 h-8" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold">
                                        {attempt.isPassed ? 'Congratulations! Passed' : 'Not Passed'}
                                    </h3>
                                    <p className="text-white/80">
                                        You scored {attempt.score}% ({attempt.pointsEarned}/{attempt.totalMarks} points)
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="bg-white/20 px-4 py-2 rounded-lg text-center">
                                    <Clock className="w-4 h-4 mx-auto mb-1" />
                                    <span className="font-bold">{Math.floor(attempt.timeSpent / 60)}m {attempt.timeSpent % 60}s</span>
                                </div>
                                <div className="bg-white/20 px-4 py-2 rounded-lg text-center">
                                    <Award className="w-4 h-4 mx-auto mb-1" />
                                    <span className="font-bold">{attempt.correctAnswers}/{attempt.totalQuestions}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Questions Review */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-slate-900">Detailed Breakdown</h3>
                            <button
                                onClick={toggleAll}
                                className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                            >
                                {expandedQuestions.length === detailedResults.length ? 'Collapse All' : 'Expand All'}
                            </button>
                        </div>

                        {detailedResults.map((q, index) => {
                            const isCorrect = q.isCorrect;
                            const isExpanded = expandedQuestions.includes(index);

                            return (
                                <div
                                    key={index}
                                    className={`border rounded-xl transition-all ${isExpanded ? 'border-blue-200 shadow-md' : 'border-slate-200'
                                        }`}
                                >
                                    <button
                                        onClick={() => toggleQuestion(index)}
                                        className="w-full text-left p-4 flex items-start gap-4 hover:bg-slate-50 rounded-t-xl"
                                    >
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-bold ${isCorrect
                                                ? 'bg-green-100 text-green-700'
                                                : q.selectedIndex === -1
                                                    ? 'bg-slate-100 text-slate-500'
                                                    : 'bg-red-100 text-red-700'
                                            }`}>
                                            {index + 1}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium text-slate-900 line-clamp-2 md:line-clamp-none">
                                                {q.question}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${isCorrect
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-red-100 text-red-700'
                                                }`}>
                                                {q.pointsEarned} / {q.pointsPossible} pts
                                            </span>
                                            {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                                        </div>
                                    </button>

                                    {isExpanded && (
                                        <div className="p-4 border-t border-slate-100 bg-slate-50/50 rounded-b-xl space-y-3">
                                            <div className="space-y-2">
                                                {q.options.map((opt, optIdx) => {
                                                    const isSelected = q.selectedIndex === optIdx;
                                                    const isAnswer = q.correctIndex === optIdx;

                                                    let optionClass = "p-3 rounded-lg border flex items-center gap-3 ";

                                                    if (isAnswer) {
                                                        optionClass += "bg-green-50 border-green-200 text-green-800";
                                                    } else if (isSelected && !isCorrect) {
                                                        optionClass += "bg-red-50 border-red-200 text-red-800";
                                                    } else {
                                                        optionClass += "bg-white border-slate-200 text-slate-700";
                                                    }

                                                    return (
                                                        <div key={optIdx} className={optionClass}>
                                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] ${isAnswer
                                                                    ? 'border-green-500 bg-green-500 text-white'
                                                                    : isSelected
                                                                        ? 'border-red-500 bg-red-500 text-white'
                                                                        : 'border-slate-300'
                                                                }`}>
                                                                {String.fromCharCode(65 + optIdx)}
                                                            </div>
                                                            <span className="flex-1 font-medium">{opt}</span>
                                                            {isAnswer && <CheckCircle className="w-5 h-5 text-green-600" />}
                                                            {isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-600" />}
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {q.explanation && (
                                                <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg mt-3">
                                                    <div className="flex items-center gap-2 text-blue-800 font-bold text-sm mb-1">
                                                        <HelpCircle className="w-4 h-4" />
                                                        Explanation
                                                    </div>
                                                    <p className="text-blue-900 text-sm">{q.explanation}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="p-6 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition-colors"
                    >
                        Close Results
                    </button>
                </div>
            </div>
        </div>
    );
}
