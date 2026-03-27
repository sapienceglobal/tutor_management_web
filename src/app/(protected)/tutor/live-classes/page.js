'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Video, Calendar, Clock, Plus, Trash2,
    ExternalLink, Edit, PlayCircle, BookOpen,
    Users, Loader2, X
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { useConfirm } from '@/components/providers/ConfirmProvider';
import AudienceSelector from '@/components/shared/AudienceSelector';
import useInstitute from '@/hooks/useInstitute';
import { C, T, FX } from '@/constants/tutorTokens';

export default function TutorLiveClassesPage() {
    const router = useRouter();
    const { institute } = useInstitute();
    const [classes, setClasses]   = useState([]);
    const [courses, setCourses]   = useState([]);
    const [availableBatches, setAvailableBatches]   = useState([]);
    const [availableStudents, setAvailableStudents] = useState([]);
    const [loading, setLoading]   = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId]   = useState(null);
    const { confirmDialog }           = useConfirm();

    const initialFormState = {
        title: '', description: '', courseId: 'none', dateTime: '',
        duration: 60, meetingLink: '', meetingId: '', passcode: '',
        recordingLink: '', platform: 'jitsi', autoCreate: true,
        audience: { scope: 'institute', instituteId: null, batchIds: [], studentIds: [] },
    };
    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => { fetchClasses(); fetchCourses(); }, []);

    const fetchClasses = async () => {
        try {
            const res = await api.get('/live-classes');
            if (res.data.success) setClasses(res.data.liveClasses);
        } catch { toast.error('Failed to load live classes'); }
        finally { setLoading(false); }
    };

    const fetchCourses = async () => {
        try {
            const res = await api.get('/courses/my-courses');
            if (res.data.success) setCourses(res.data.courses);
        } catch { /* silent */ }
    };

    const handleEditClick = (cls) => {
        setEditingId(cls._id);
        setFormData({
            title: cls.title, description: cls.description || '',
            courseId: cls.courseId?._id || 'none',
            dateTime: new Date(cls.dateTime).toISOString().slice(0, 16),
            duration: cls.duration, meetingLink: cls.meetingLink,
            meetingId: cls.meetingId || '', passcode: cls.passcode || '',
            recordingLink: cls.recordingLink || '', materialLink: cls.materialLink || '',
            platform: cls.platform, autoCreate: false,
            audience: cls.audience || {
                scope: cls.batchId ? 'batch' : (cls.instituteId ? 'institute' : 'global'),
                instituteId: cls.instituteId || institute?._id || null,
                batchIds: cls.batchId ? [cls.batchId] : [], studentIds: [],
            },
        });
        setIsCreating(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => { setIsCreating(false); setEditingId(null); setFormData(initialFormState); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const classStart = new Date(formData.dateTime);
        if (classStart < new Date() && !editingId) { toast.error('Cannot schedule a class in the past.'); return; }

        const classEnd = new Date(classStart.getTime() + formData.duration * 60000);
        const hasOverlap = classes.some(cls => {
            if (editingId && cls._id === editingId) return false;
            const s = new Date(cls.dateTime);
            const e2 = new Date(s.getTime() + (cls.duration || 60) * 60000);
            return classStart < e2 && classEnd > s;
        });
        if (hasOverlap) { toast.error('Scheduling Conflict: This time overlaps with another class.'); return; }

        try {
            const payload = { ...formData };
            payload.audience = { ...formData.audience, instituteId: formData.audience?.instituteId || institute?._id || null };
            payload.scope    = payload.audience.scope;
            payload.batchId  = payload.audience.scope === 'batch' ? (payload.audience.batchIds?.[0] || null) : null;
            if (payload.courseId === 'none') delete payload.courseId;

            if (editingId) {
                const res = await api.patch(`/live-classes/${editingId}`, payload);
                if (res.data.success) toast.success('Live class updated!');
            } else {
                const res = await api.post('/live-classes', payload);
                if (res.data.success) toast.success('Live class scheduled!');
            }
            handleCancelEdit(); fetchClasses();
        } catch (error) { toast.error(error.response?.data?.message || 'Failed to save class'); }
    };

    useEffect(() => {
        const fetchAudienceTargets = async () => {
            if (!isCreating || !formData.courseId || formData.courseId === 'none') {
                setAvailableBatches([]); setAvailableStudents([]); return;
            }
            try {
                const [batchesRes, studentsRes] = await Promise.all([
                    api.get('/batches'),
                    api.get(`/enrollments/students/${formData.courseId}`),
                ]);
                setAvailableBatches((batchesRes.data?.batches || []).filter(b => (b.courseId?._id || b.courseId) === formData.courseId));
                setAvailableStudents((studentsRes.data?.students || []).map(i => ({ _id: i.studentId?._id, name: i.studentId?.name, email: i.studentId?.email })).filter(i => i._id));
            } catch { setAvailableBatches([]); setAvailableStudents([]); }
        };
        fetchAudienceTargets();
    }, [isCreating, formData.courseId]);

    useEffect(() => {
        setFormData(prev => ({ ...prev, audience: { ...prev.audience, instituteId: prev.audience?.instituteId || institute?._id || null } }));
    }, [institute?._id]);

    const handleDeleteClass = async (id) => {
        const ok = await confirmDialog('Cancel Class', 'Are you sure you want to cancel this class?', { variant: 'destructive' });
        if (!ok) return;
        try {
            const res = await api.delete(`/live-classes/${id}`);
            if (res.data.success) { toast.success('Class cancelled'); fetchClasses(); }
        } catch { toast.error('Failed to cancel class'); }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
                <Loader2 className="w-7 h-7 animate-spin" style={{ color: C.btnPrimary }} />
                <p className="text-sm text-slate-400">Loading classes...</p>
            </div>
        );
    }

    return (
        <div className="space-y-5" style={{ fontFamily: T.fontFamily }}>

            {/* ── Header ────────────────────────────────────────────────────── */}
            <div className="bg-white rounded-xl border border-slate-100 px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: FX.primary12, border: `1px solid ${FX.primary20}` }}>
                        <Video className="w-4 h-4" style={{ color: C.btnPrimary }} />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-slate-800">Live Classes</h1>
                        <p className="text-xs text-slate-400">Schedule and manage your live sessions</p>
                    </div>
                </div>
                <button onClick={() => setIsCreating(true)} disabled={isCreating && !editingId}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-xl shadow-sm transition-opacity disabled:opacity-50"
                    style={{ backgroundColor: C.btnPrimary }}>
                    <Plus className="w-4 h-4" /> Schedule Class
                </button>
            </div>

            {/* ── Create / Edit Form ────────────────────────────────────────── */}
            {isCreating && (
                <div className="bg-white rounded-xl border border-slate-100 overflow-hidden animate-in slide-in-from-top-4 duration-300">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: FX.primary12 }}>
                                <Video className="w-3.5 h-3.5" style={{ color: C.btnPrimary }} />
                            </div>
                            <h3 className="text-sm font-bold text-slate-800">{editingId ? 'Edit Class Details' : 'Schedule New Class'}</h3>
                        </div>
                        <button onClick={handleCancelEdit}
                            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors">
                            <X className="w-4 h-4 text-slate-400" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold text-slate-500">Topic</Label>
                                <Input required value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g. Advanced Calculus Review"
                                    className="border-slate-200 focus:border-[#7573E8] focus:ring-[#7573E8]/10" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold text-slate-500">Link to Course (Optional)</Label>
                                <Select value={formData.courseId} onValueChange={val => setFormData({ ...formData, courseId: val })}>
                                    <SelectTrigger className="border-slate-200"><SelectValue placeholder="Select a course" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">No Course Linked</SelectItem>
                                        {courses.map(c => <SelectItem key={c._id} value={c._id}>{c.title}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold text-slate-500">Date & Time</Label>
                                <Input type="datetime-local" required
                                    min={new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
                                    value={formData.dateTime}
                                    onChange={e => setFormData({ ...formData, dateTime: e.target.value })}
                                    className="border-slate-200 focus:border-[#7573E8]" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold text-slate-500">Duration (minutes)</Label>
                                <Input type="number" required min="15" value={formData.duration}
                                    onChange={e => setFormData({ ...formData, duration: e.target.value })}
                                    className="border-slate-200 focus:border-[#7573E8]" />
                            </div>

                            {/* Auto-create toggle */}
                            <div className="md:col-span-2 border-t border-slate-100 pt-4 space-y-3">
                                <label className="flex items-center gap-2.5 cursor-pointer">
                                    <input type="checkbox" id="autoCreate"
                                        className="w-4 h-4 rounded border-slate-300"
                                        style={{ accentColor: C.btnPrimary }}
                                        checked={formData.autoCreate}
                                        onChange={e => setFormData({ ...formData, autoCreate: e.target.checked })} />
                                    <span className="text-sm font-semibold" style={{ color: C.btnPrimary }}>
                                        Auto-generate Secure Class Room
                                    </span>
                                </label>
                                {!formData.autoCreate && (
                                    <div className="space-y-1">
                                        <Label className="text-xs font-semibold text-slate-500">External Meeting Link</Label>
                                        <Input type="url" required={!formData.autoCreate}
                                            placeholder="https://meet.google.com/..."
                                            value={formData.meetingLink}
                                            onChange={e => setFormData({ ...formData, meetingLink: e.target.value })}
                                            className="border-slate-200 focus:border-[#7573E8]" />
                                        <p className="text-[11px] text-slate-400">Uncheck only if you want to use an external link like Google Meet.</p>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs font-semibold text-slate-500">Recording Link <span className="text-slate-400 font-normal">(Optional)</span></Label>
                                <Input type="url" placeholder="https://drive.google.com/..."
                                    value={formData.recordingLink}
                                    onChange={e => setFormData({ ...formData, recordingLink: e.target.value })}
                                    className="border-slate-200 focus:border-[#7573E8]" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold text-slate-500">Material/Notes Link <span className="text-slate-400 font-normal">(Optional)</span></Label>
                                <Input type="url" placeholder="https://drive.google.com/..."
                                    value={formData.materialLink}
                                    onChange={e => setFormData({ ...formData, materialLink: e.target.value })}
                                    className="border-slate-200 focus:border-[#7573E8]" />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs font-semibold text-slate-500">Description <span className="text-slate-400 font-normal">(Optional)</span></Label>
                            <Textarea value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                placeholder="What will be covered?"
                                className="border-slate-200 focus:border-[#7573E8] resize-none" />
                        </div>

                        <AudienceSelector
                            value={formData.audience}
                            onChange={(audience) => setFormData({ ...formData, audience })}
                            availableBatches={availableBatches}
                            availableStudents={availableStudents}
                            allowGlobal={Boolean(!institute?._id || institute?.features?.allowGlobalPublishingByInstituteTutors)}
                            instituteId={institute?._id || null} />

                        <div className="flex justify-end gap-3 pt-2">
                            <button type="button" onClick={handleCancelEdit}
                                className="px-4 py-2 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                                Cancel
                            </button>
                            <button type="submit"
                                className="px-5 py-2 text-sm font-semibold text-white rounded-xl transition-opacity"
                                style={{ backgroundColor: C.btnPrimary }}>
                                {editingId ? 'Update Class' : 'Schedule Class'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* ── Class cards ───────────────────────────────────────────────── */}
            {classes.length === 0 && !isCreating ? (
                <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-200">
                    <div className="mx-auto w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
                        style={{ backgroundColor: FX.primary08 }}>
                        <Video className="w-6 h-6" style={{ color: C.btnPrimary }} />
                    </div>
                    <p className="text-sm font-semibold text-slate-600 mb-1">No live classes scheduled yet</p>
                    <p className="text-xs text-slate-400">Click "Schedule Class" to get started.</p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {classes.map(cls => {
                        const isCompleted = new Date(cls.dateTime) < new Date();
                        return (
                            <div key={cls._id}
                                className="bg-white rounded-xl border border-slate-100 p-5 hover:shadow-sm transition-shadow group relative">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                                            style={{ backgroundColor: FX.primary10 }}>
                                            <Video className="w-4 h-4" style={{ color: C.btnPrimary }} />
                                        </div>
                                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${isCompleted ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                                            {isCompleted ? 'Completed' : 'Upcoming'}
                                        </span>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleEditClick(cls)}
                                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors">
                                            <Edit className="w-3.5 h-3.5 text-slate-400" />
                                        </button>
                                        <button onClick={() => handleDeleteClass(cls._id)}
                                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 transition-colors">
                                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                        </button>
                                    </div>
                                </div>

                                <h3 className="font-bold text-slate-800 line-clamp-1 mb-1">{cls.title}</h3>
                                {cls.courseId?.title && (
                                    <div className="flex items-center gap-1.5 text-[11px] font-semibold mb-2 w-fit px-2 py-0.5 rounded-full"
                                        style={{ backgroundColor: FX.primary08, color: C.btnPrimary }}>
                                        <BookOpen className="w-3 h-3" /> {cls.courseId.title}
                                    </div>
                                )}
                                {cls.description && <p className="text-xs text-slate-500 line-clamp-2 mb-3">{cls.description}</p>}

                                <div className="space-y-1.5 text-xs text-slate-500 mb-4">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-3.5 h-3.5 text-slate-300" />
                                        {format(new Date(cls.dateTime), 'PPP')}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-3.5 h-3.5 text-slate-300" />
                                        {format(new Date(cls.dateTime), 'h:mm a')} · {cls.duration} mins
                                    </div>
                                </div>

                                <div className="border-t border-slate-100 pt-3 space-y-2">
                                    <button
                                        onClick={() => window.open(cls.meetingId ? `https://meet.jit.si/${cls.meetingId}` : cls.meetingLink, '_blank')}
                                        className="flex items-center justify-center w-full gap-2 py-2 text-xs font-semibold text-white rounded-xl transition-opacity"
                                        style={{ backgroundColor: C.btnPrimary }}>
                                        <ExternalLink className="w-3.5 h-3.5" /> Start Class
                                    </button>
                                    <button
                                        onClick={() => router.push(`/tutor/live-classes/${cls._id}/attendance`)}
                                        className="flex items-center justify-center w-full gap-2 py-2 text-xs font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors">
                                        <Users className="w-3.5 h-3.5" /> View Attendance
                                    </button>
                                    {cls.recordingLink && (
                                        <a href={cls.recordingLink} target="_blank" rel="noopener noreferrer"
                                            className="flex items-center justify-center w-full gap-2 py-2 text-xs font-semibold text-slate-500 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors">
                                            <PlayCircle className="w-3.5 h-3.5" /> View Recording
                                        </a>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}