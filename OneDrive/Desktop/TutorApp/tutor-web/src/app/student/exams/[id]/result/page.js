'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useParams, useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Home, RotateCcw, Award } from 'lucide-react';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export default function ExamResultPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const attemptId = searchParams.get('attemptId');
    const examId = params.id;

    const [loading, setLoading] = useState(true);
    const [result, setResult] = useState(null);

    useEffect(() => {
        const fetchResult = async () => {
            if (!attemptId) return;
            try {
                const res = await api.get(`/exams/${examId}/attempts/${attemptId}`);
                if (res.data.success) {
                    setResult(res.data.attempt);
                }
            } catch (error) {
                console.error('Error fetching result:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchResult();
    }, [attemptId, examId]);

    if (loading) return <div className="p-10 text-center">Calculaing Results...</div>;
    if (!result) return <div className="p-10 text-center">Result not found</div>;

    const isPassed = result.isPassed;
    const scoreColor = isPassed ? 'text-green-600' : 'text-red-600';
    const bgColor = isPassed ? 'bg-green-50' : 'bg-red-50';
    const borderColor = isPassed ? 'border-green-200' : 'border-red-200';
    const Icon = isPassed ? Award : XCircle;

    return (
        <div className="min-h-screen bg-gray-50 py-10 px-4">
            <div className="max-w-xl mx-auto space-y-6">
                
                {/* Score Card */}
                <Card className={`border-2 ${borderColor} shadow-lg overflow-hidden`}>
                    <div className={`${bgColor} p-8 text-center space-y-4`}>
                        <div className={`mx-auto w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-sm ${scoreColor}`}>
                            <Icon className="w-10 h-10" />
                        </div>
                        <div>
                            <h1 className={`text-3xl font-bold ${scoreColor}`}>
                                {isPassed ? 'Congratulations!' : 'Keep Practicing!'}
                            </h1>
                            <p className="text-gray-600 mt-2">
                                You have {isPassed ? 'passed' : 'failed'} this assessment.
                            </p>
                        </div>
                    </div>
                    <CardContent className="p-6 space-y-6">
                        <div className="grid grid-cols-2 gap-4 text-center">
                            <div className="p-4 bg-gray-50 rounded-xl">
                                <p className="text-sm text-gray-500 uppercase tracking-wide">Score</p>
                                <p className="text-2xl font-bold text-gray-900">{result.score} / {result.totalMarks}</p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-xl">
                                <p className="text-sm text-gray-500 uppercase tracking-wide">Percentage</p>
                                <p className="text-2xl font-bold text-gray-900">{result.percentage}%</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Performance</span>
                                <span className={scoreColor}>{result.percentage}%</span>
                            </div>
                            <Progress value={result.percentage} className="h-2" indicatorClassName={isPassed ? 'bg-green-600' : 'bg-red-600'} />
                        </div>

                        <div className="pt-4 grid gap-3">
                            <Button 
                                className="w-full bg-purple-600 hover:bg-purple-700" 
                                onClick={() => router.push(`/student/courses`)}
                            >
                                <Home className="w-4 h-4 mr-2" />
                                Back to Courses
                            </Button>
                            {!isPassed && (
                                <Button variant="outline" className="w-full" onClick={() => router.push(`/student/exams/${examId}`)}>
                                    <RotateCcw className="w-4 h-4 mr-2" />
                                    Retake Exam
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Answer Key Link (Optional Mock) */}
                <div className="text-center">
                    <Button variant="link" className="text-gray-500" onClick={() => alert('Detailed answer review coming soon!')}>
                        Review Questions & Answers
                    </Button>
                </div>
            </div>
        </div>
    );
}
