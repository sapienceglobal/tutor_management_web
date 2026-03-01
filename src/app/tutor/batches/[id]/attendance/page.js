'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, Calendar as CalendarIcon, Check, X, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';

export default function BatchAttendancePage() {
    const params = useParams();
    const router = useRouter();
    const { id: batchId } = params;

    const [batch, setBatch] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [records, setRecords] = useState({}); // { studentId: { status, remarks } }

    // Past attendance records fetched for reference
    const [history, setHistory] = useState([]);

    useEffect(() => {
        if (batchId) {
            fetchBatchData();
        }
    }, [batchId, date]); // Also refetch or re-evaluate when date changes

    const fetchBatchData = async () => {
        try {
            // Fetch batch details (gets students)
            const batchRes = await api.get(`/batches/${batchId}`);
            if (!batchRes.data.success) throw new Error('Failed to load batch');

            const currentBatch = batchRes.data.batch;
            setBatch(currentBatch);

            // Fetch attendance history for this batch
            const attRes = await api.get(`/attendance/batch/${batchId}`);
            if (attRes.data.success) {
                setHistory(attRes.data.records);

                // Check if attendance already exists for the selected date
                const targetDate = new Date(date);
                targetDate.setHours(0, 0, 0, 0);

                const existingRecord = attRes.data.records.find(r => {
                    const rDate = new Date(r.date);
                    rDate.setHours(0, 0, 0, 0);
                    return rDate.getTime() === targetDate.getTime();
                });

                if (existingRecord) {
                    // Populate current state with existing records
                    const updatedRecords = {};
                    existingRecord.records.forEach(r => {
                        updatedRecords[r.studentId._id || r.studentId] = {
                            status: r.status,
                            remarks: r.remarks || ''
                        };
                    });

                    // If some new students were added to the batch after this date was marked, ensure they exist in state
                    currentBatch.students.forEach(student => {
                        if (!updatedRecords[student._id]) {
                            updatedRecords[student._id] = { status: 'present', remarks: '' };
                        }
                    });

                    setRecords(updatedRecords);
                } else {
                    // Initialize all students as 'present' for a new day
                    const initialRecords = {};
                    currentBatch.students.forEach(student => {
                        initialRecords[student._id] = { status: 'present', remarks: '' };
                    });
                    setRecords(initialRecords);
                }
            }
        } catch (error) {
            console.error('Fetch data error:', error);
            toast.error('Failed to load attendance data');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = (studentId, status) => {
        setRecords(prev => ({
            ...prev,
            [studentId]: { ...prev[studentId], status }
        }));
    };

    const handleRemarksChange = (studentId, remarks) => {
        setRecords(prev => ({
            ...prev,
            [studentId]: { ...prev[studentId], remarks }
        }));
    };

    const markAll = (status) => {
        const newRecords = {};
        Object.keys(records).forEach(studentId => {
            newRecords[studentId] = { ...records[studentId], status };
        });
        setRecords(newRecords);
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            // Format for API
            const recordsArray = Object.keys(records).map(studentId => ({
                studentId,
                status: records[studentId].status,
                remarks: records[studentId].remarks
            }));

            const payload = {
                batchId,
                date,
                records: recordsArray
            };

            const res = await api.post('/attendance/batch', payload);
            if (res.data.success) {
                toast.success('Attendance saved successfully');
                fetchBatchData(); // Refresh history
            }
        } catch (error) {
            console.error('Save attendance error:', error);
            toast.error(error.response?.data?.message || 'Failed to save attendance');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-24">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!batch) return null;

    // Calculate Summary for the currently selected state
    const presentCount = Object.values(records).filter(r => r.status === 'present').length;
    const absentCount = Object.values(records).filter(r => r.status === 'absent').length;
    const lateCount = Object.values(records).filter(r => r.status === 'late').length;

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" className="p-2" onClick={() => router.back()}>
                        <ArrowLeft className="w-5 h-5 text-slate-500" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Attendance Log</h1>
                        <p className="text-slate-500 text-sm mt-1">{batch.name}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg border border-slate-200">
                    <CalendarIcon className="w-5 h-5 text-indigo-500" />
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="bg-transparent font-medium text-slate-700 outline-none"
                    />
                </div>
            </div>

            {batch.students.length === 0 ? (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-6 rounded-xl flex items-start gap-4">
                    <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />
                    <div>
                        <h3 className="font-semibold">No students in this batch</h3>
                        <p className="text-sm mt-1">Please add students to the batch before logging attendance.</p>
                        <Button variant="outline" className="mt-4 border-amber-300 hover:bg-amber-100" onClick={() => router.push(`/tutor/batches/${batchId}`)}>
                            Go back to add students
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-4 md:p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50">
                        <div className="flex gap-4 text-sm">
                            <div className="flex flex-col">
                                <span className="text-slate-500">Present</span>
                                <span className="font-bold text-emerald-600 text-lg">{presentCount}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-slate-500">Absent</span>
                                <span className="font-bold text-red-600 text-lg">{absentCount}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-slate-500">Late</span>
                                <span className="font-bold text-amber-600 text-lg">{lateCount}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <Button variant="outline" onClick={() => markAll('present')} className="flex-1 md:flex-none h-9 text-xs">
                                Mark All Present
                            </Button>
                            <Button variant="outline" onClick={() => markAll('absent')} className="flex-1 md:flex-none h-9 text-xs">
                                Mark All Absent
                            </Button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-white border-b border-slate-200 text-slate-500">
                                <tr>
                                    <th className="px-6 py-4 font-semibold w-1/3">Student</th>
                                    <th className="px-6 py-4 font-semibold">Status</th>
                                    <th className="px-6 py-4 font-semibold w-1/3">Remarks (Optional)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {batch.students.map((student) => {
                                    const record = records[student._id] || { status: 'present', remarks: '' };

                                    return (
                                        <tr key={student._id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={student.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}`}
                                                        alt={student.name}
                                                        className="w-8 h-8 rounded-full border border-slate-200"
                                                    />
                                                    <div>
                                                        <p className="font-medium text-slate-900">{student.name}</p>
                                                        <p className="text-xs text-slate-500">{student.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleStatusChange(student._id, 'present')}
                                                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${record.status === 'present' ? 'bg-emerald-100 text-emerald-600 ring-2 ring-emerald-600 ring-offset-1' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusChange(student._id, 'absent')}
                                                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${record.status === 'absent' ? 'bg-red-100 text-red-600 ring-2 ring-red-600 ring-offset-1' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusChange(student._id, 'late')}
                                                        className={`px-3 h-8 rounded-full text-xs font-semibold flex items-center justify-center transition-all ${record.status === 'late' ? 'bg-amber-100 text-amber-700 ring-2 ring-amber-500 ring-offset-1' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                                    >
                                                        LATE
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <input
                                                    type="text"
                                                    placeholder="Add a note..."
                                                    value={record.remarks}
                                                    onChange={(e) => handleRemarksChange(student._id, e.target.value)}
                                                    className="w-full bg-transparent border-0 border-b border-slate-200 focus:ring-0 focus:border-indigo-500 py-1 text-sm outline-none px-0"
                                                />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-4 md:p-6 bg-slate-50 border-t border-slate-200 flex justify-end">
                        <Button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="bg-indigo-600 hover:bg-indigo-700 w-full sm:w-auto"
                        >
                            <Save className="w-4 h-4 mr-2" />
                            {submitting ? 'Saving...' : 'Save Attendance'}
                        </Button>
                    </div>
                </div>
            )}

            {/* Minimal History List just below if they want to see past dates quickly */}
            {!loading && history.length > 0 && (
                <div className="pt-6">
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Recent Attendance Logs</h3>
                    <div className="flex gap-3 overflow-x-auto pb-4 hide-scrollbar">
                        {history.slice(0, 5).map(h => {
                            const hDate = new Date(h.date).toISOString().split('T')[0];
                            const isSelected = date === hDate;
                            return (
                                <button
                                    key={h._id}
                                    onClick={() => setDate(hDate)}
                                    className={`shrink-0 flex flex-col items-center justify-center p-3 rounded-xl min-w-[100px] border transition-all ${isSelected ? 'bg-indigo-600 text-white border-indigo-700 shadow-md' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'}`}
                                >
                                    <span className={`text-xs ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                                        {new Date(h.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </span>
                                    <span className="font-bold mt-1 text-lg">
                                        {new Date(h.date).toLocaleDateString('en-US', { weekday: 'short' })}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
