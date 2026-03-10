'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, Save, Loader2, ArrowLeft, CalendarClock } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';

export default function ScheduleQuizPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [exams, setExams] = useState([]);
    const [selectedExamId, setSelectedExamId] = useState('');
    const [schedule, setSchedule] = useState({
        startDate: '',
        startTime: '09:00',
        endDate: '',
        endTime: '17:00'
    });

    useEffect(() => { fetchExams(); }, []);

    const fetchExams = async () => {
        try {
            const res = await api.get('/exams/tutor/all');
            if (res.data.success) setExams(res.data.exams.filter(e => e.type !== 'practice'));
        } catch (error) {
            console.error('Failed to load exams', error);
        }
    };

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
                setSchedule({ startDate: '', startTime: '09:00', endDate: '', endTime: '17:00' });
            }
        }
    }, [selectedExamId, exams]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedExamId) return toast.error('Please select an exam');
        if (!schedule.startDate || !schedule.endDate) return toast.error('Start and End dates are required');

        setLoading(true);
        try {
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
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center gap-3">
                <Link href="/tutor/dashboard">
                    <button className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors">
                        <ArrowLeft className="w-4 h-4 text-slate-500" />
                    </button>
                </Link>
                <div>
                    <div className="flex items-center gap-2.5 mb-0.5">
                        <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center">
                            <CalendarClock className="w-4 h-4 text-orange-500" />
                        </div>
                        <h1 className="text-xl font-bold text-slate-800">Schedule Quiz</h1>
                    </div>
                    <p className="text-xs text-slate-400 pl-0.5">Set the time window during which students can take this exam.</p>
                </div>
            </div>

            {/* Form Card */}
            <div className="max-w-2xl bg-white rounded-xl border border-slate-100 p-6 space-y-6">
                {/* Exam Select */}
                <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700">
                        Select Quiz <span className="text-red-500">*</span>
                    </Label>
                    <Select value={selectedExamId} onValueChange={setSelectedExamId}>
                        <SelectTrigger className="h-10 border-slate-200 focus:border-orange-400 focus:ring-orange-500/10">
                            <SelectValue placeholder="Choose an exam..." />
                        </SelectTrigger>
                        <SelectContent>
                            {exams.map(exam => (
                                <SelectItem key={exam._id} value={exam._id}>{exam.title}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="border-t border-slate-100 pt-5">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Start Window</p>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-slate-700">Start Date</Label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                <Input
                                    type="date"
                                    className="pl-9 h-10 border-slate-200 focus:border-orange-400 focus:ring-orange-500/10"
                                    value={schedule.startDate}
                                    onChange={(e) => setSchedule({ ...schedule, startDate: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-slate-700">Start Time</Label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                <Input
                                    type="time"
                                    className="pl-9 h-10 border-slate-200 focus:border-orange-400 focus:ring-orange-500/10"
                                    value={schedule.startTime}
                                    onChange={(e) => setSchedule({ ...schedule, startTime: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="border-t border-slate-100 pt-5">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">End Window</p>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-slate-700">End Date</Label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                <Input
                                    type="date"
                                    className="pl-9 h-10 border-slate-200 focus:border-orange-400 focus:ring-orange-500/10"
                                    value={schedule.endDate}
                                    onChange={(e) => setSchedule({ ...schedule, endDate: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-slate-700">End Time</Label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                <Input
                                    type="time"
                                    className="pl-9 h-10 border-slate-200 focus:border-orange-400 focus:ring-orange-500/10"
                                    value={schedule.endTime}
                                    onChange={(e) => setSchedule({ ...schedule, endTime: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-2">
                    <Button
                        onClick={handleSubmit}
                        disabled={loading || !selectedExamId}
                        className="w-full h-10 bg-orange-500 hover:bg-orange-600 text-white font-semibold shadow-sm shadow-orange-200 gap-2"
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        <Save className="w-4 h-4" />
                        Save Schedule
                    </Button>
                </div>
            </div>
        </div>
    );
}