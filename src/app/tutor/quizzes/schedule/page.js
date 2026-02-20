'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, Save, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';

export default function ScheduleQuizPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [exams, setExams] = useState([]);
    const [selectedExamId, setSelectedExamId] = useState('');

    // Schedule Data
    const [schedule, setSchedule] = useState({
        startDate: '',
        startTime: '09:00',
        endDate: '',
        endTime: '17:00'
    });

    useEffect(() => {
        fetchExams();
    }, []);

    const fetchExams = async () => {
        try {
            const res = await api.get('/exams/tutor/all');
            if (res.data.success) {
                // Only show exams that are NOT practice sets
                setExams(res.data.exams.filter(e => e.type !== 'practice'));
            }
        } catch (error) {
            console.error('Failed to load exams', error);
        }
    };

    // Load existing schedule when exam is selected
    useEffect(() => {
        if (!selectedExamId) return;
        const exam = exams.find(e => e._id === selectedExamId);
        if (exam) {
            if (exam.startDate && exam.endDate) {
                const start = new Date(exam.startDate);
                const end = new Date(exam.endDate);
                setSchedule({
                    startDate: start.toISOString().split('T')[0],
                    startTime: start.toTimeString().slice(0, 5),
                    endDate: end.toISOString().split('T')[0],
                    endTime: end.toTimeString().slice(0, 5)
                });
            } else {
                // Reset to defaults if no schedule
                setSchedule({
                    startDate: '',
                    startTime: '09:00',
                    endDate: '',
                    endTime: '17:00'
                });
            }
        }
    }, [selectedExamId, exams]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedExamId) return toast.error('Please select an exam');
        if (!schedule.startDate || !schedule.endDate) return toast.error('Start and End dates are required');

        setLoading(true);
        try {
            // Combine date and time
            const startDateTime = new Date(`${schedule.startDate}T${schedule.startTime}`);
            const endDateTime = new Date(`${schedule.endDate}T${schedule.endTime}`);

            if (endDateTime <= startDateTime) {
                toast.error('End date must be after start date');
                setLoading(false);
                return;
            }

            const payload = {
                isScheduled: true,
                startDate: startDateTime.toISOString(),
                endDate: endDateTime.toISOString()
            };

            const res = await api.patch(`/exams/${selectedExamId}`, payload);

            if (res.data.success) {
                toast.success('Exam scheduled successfully!');
                // Update local list to reflect changes
                setExams(exams.map(e => e._id === selectedExamId ? { ...e, ...payload } : e));
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to schedule exam');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/tutor/dashboard">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                    </Link>
                    <h1 className="text-2xl font-bold text-slate-800">Schedule Quiz</h1>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Exam Availability</CardTitle>
                        <CardDescription>Set the time window during which students can take this exam.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label>Select Quiz <span className="text-red-500">*</span></Label>
                            <Select value={selectedExamId} onValueChange={setSelectedExamId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose an exam..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {exams.map(exam => (
                                        <SelectItem key={exam._id} value={exam._id}>
                                            {exam.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Start Date</Label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                    <Input
                                        type="date"
                                        className="pl-9"
                                        value={schedule.startDate}
                                        onChange={(e) => setSchedule({ ...schedule, startDate: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Start Time</Label>
                                <div className="relative">
                                    <Clock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                    <Input
                                        type="time"
                                        className="pl-9"
                                        value={schedule.startTime}
                                        onChange={(e) => setSchedule({ ...schedule, startTime: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>End Date</Label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                    <Input
                                        type="date"
                                        className="pl-9"
                                        value={schedule.endDate}
                                        onChange={(e) => setSchedule({ ...schedule, endDate: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>End Time</Label>
                                <div className="relative">
                                    <Clock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                    <Input
                                        type="time"
                                        className="pl-9"
                                        value={schedule.endTime}
                                        onChange={(e) => setSchedule({ ...schedule, endTime: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-4">
                            <Button
                                onClick={handleSubmit}
                                disabled={loading || !selectedExamId}
                                className="w-full bg-[#3b0d46] hover:bg-[#2a0933]"
                            >
                                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                <Save className="w-4 h-4 mr-2" />
                                Save Schedule
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
