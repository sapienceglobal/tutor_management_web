'use client';

import { useState, useEffect } from 'react';
import { Clock, Award, ChevronRight, History } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/axios';

export default function StudentHistoryPage() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                // Assuming endpoint exists or we use a general search
                const res = await api.get('/exams/student/history-all');
                if (res.data.success) {
                    setHistory(res.data.attempts);
                }
            } catch (error) {
                console.error('Error fetching history:', error);
                // Fallback or empty state is handled by UI
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading history...</div>;
    }

    if (history.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                    <History className="w-10 h-10 text-gray-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">No Attempts Yet</h2>
                <p className="text-gray-500 max-w-sm">
                    You haven&apos;t taken any exams or quizzes yet. Go to your courses and start learning!
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Exam History</h1>
            <div className="grid gap-4">
                {history.map((item, i) => (
                    <Card key={i} className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm ${item.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                    }`}>
                                    {item.score}%
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">{item.examTitle || 'Quiz Attempt'}</h3>
                                    <p className="text-sm text-gray-500 flex items-center gap-2">
                                        <Clock className="w-3 h-3" /> {new Date(item.date).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
