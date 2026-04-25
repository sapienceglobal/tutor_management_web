'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, X, Upload, ChevronRight, ChevronLeft, BookOpen, Video, FileText, CheckCircle2, Rocket, Trash2, ArrowLeft, AlertCircle } from 'lucide-react';
import api from '@/lib/axios';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import AudienceSelector from '@/components/shared/AudienceSelector';
import useInstitute from '@/hooks/useInstitute';
import { C, T, S, R } from '@/constants/tutorTokens';

// â”€â”€ Shared Colors & Styles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const outerCard = '#EAE8FA';
const innerBox = '#E3DFF8';

const onFocusHandler = e => {
    e.target.style.borderColor = C.btnPrimary;
    e.target.style.boxShadow = '0 0 0 3px rgba(117,115,232,0.10)';
};
const onBlurHandler = e => {
    e.target.style.borderColor = 'transparent';
    e.target.style.boxShadow = 'none';
};

const baseInputStyle = {
    backgroundColor: innerBox,
    border: '1.5px solid transparent',
    borderRadius: R.xl,
    color: C.heading,
    fontFamily: T.fontFamily,
    fontSize: T.size.sm,
    fontWeight: T.weight.medium,
    outline: 'none',
    width: '100%',
    padding: '10px 16px',
    transition: 'all 0.2s ease',
};

const createDefaultLessonForm = () => ({
    title: '',
    description: '',
    type: 'video',
    videoUrl: '',
    duration: '',
    isFree: false,
    attachments: [],
    documents: [],
    quiz: { passingScore: 70, timeLimit: '', questions: [] },
});

// â”€â”€â”€ Step Bar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const STEPS = [
    { num: 1, label: 'Course Info' },
    { num: 2, label: 'Curriculum' },
    { num: 3, label: 'Assignments' },
    { num: 4, label: 'Publish' },
];

function StepBar({ current = 1 }) {
    return (
        <div className="flex items-center flex-wrap gap-y-2 p-4 mb-6"
            style={{ backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, borderRadius: R.xl, boxShadow: S.card }}>
            {STEPS.map((step, i) => {
                const isActive = step.num === current;
                const isDone = step.num < current;
                return (
                    <div key={step.num} className="flex items-center">
                        <div className="flex items-center gap-2 px-3 py-1.5" style={{
                            backgroundColor: isActive ? C.surfaceWhite : 'transparent',
                            borderRadius: R.lg,
                            boxShadow: isActive ? S.card : 'none'
                        }}>
                            <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                                style={{
                                    backgroundColor: isActive ? C.btnPrimary : isDone ? C.successBg : innerBox,
                                    color: isActive ? '#fff' : isDone ? C.success : C.textMuted,
                                    fontSize: '11px', fontWeight: T.weight.black
                                }}>
                                {isDone ? <CheckCircle2 size={14} /> : step.num}
                            </div>
                            <span style={{ fontSize: T.size.sm, fontWeight: isActive ? T.weight.bold : T.weight.medium, color: isActive ? C.btnPrimary : C.textMuted }}>
                                {step.label}
                            </span>
                        </div>
                        {i < STEPS.length - 1 && (
                            <ChevronRight size={16} color={C.textMuted} className="mx-2 shrink-0 opacity-50" />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

function ThumbnailUpload({ value, onFileSelect, uploading }) {
    return (
        <div className="space-y-2">
            <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase' }}>
                Course Thumbnail (Recommended 800x450)
            </label>
            <div className="flex gap-4 items-stretch h-36">
                <div className="flex-1 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-opacity hover:opacity-80"
                    style={{ borderColor: C.btnPrimary, backgroundColor: '#E3DFF8' }}>
                    <input type="file" className="hidden" accept="image/*" id="thumb-upload"
                        onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) onFileSelect(file);
                            e.target.value = '';
                        }} />
                    <label htmlFor="thumb-upload" className="flex flex-col items-center cursor-pointer w-full h-full justify-center">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2" style={{ backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}` }}>
                            <Upload size={18} color={C.btnPrimary} />
                        </div>
                        <p style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>
                            {uploading ? 'Uploading...' : 'Browse files'}
                        </p>
                        <p style={{ fontSize: '11px', color: C.textMuted, margin: 0 }}>JPG, PNG, GIF</p>
                    </label>
                </div>
                <div className="w-48 rounded-2xl flex items-center justify-center overflow-hidden shrink-0 border"
                    style={{ backgroundColor: '#E3DFF8', borderColor: C.cardBorder }}>
                    {value ? <img src={value} alt="thumb" className="w-full h-full object-cover" /> : <BookOpen size={24} color={C.textMuted} style={{ opacity: 0.3 }} />}
                </div>
            </div>
        </div>
    );
}

function ListFieldSection({ title, desc, items, onAdd, onRemove, onChange, placeholder }) {
    return (
        <div className="space-y-3">
            <div>
                <p style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 2px 0' }}>{title}</p>
                {desc && <p style={{ fontSize: T.size.xs, fontWeight: T.weight.medium, color: C.textMuted, margin: 0 }}>{desc}</p>}
            </div>
            {items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                    <input value={item} placeholder={`${placeholder} ${idx + 1}`} onChange={e => onChange(idx, e.target.value)} style={baseInputStyle} onFocus={onFocusHandler} onBlur={onBlurHandler} />
                    {items.length > 1 && (
                        <button type="button" onClick={() => onRemove(idx)} className="w-10 h-10 flex items-center justify-center flex-shrink-0 cursor-pointer border-none transition-opacity hover:opacity-80" style={{ backgroundColor: C.dangerBg, borderRadius: R.md }}>
                            <X size={16} color={C.danger} />
                        </button>
                    )}
                </div>
            ))}
            <button type="button" onClick={onAdd} className="w-full flex items-center justify-center gap-2 h-10 border-2 border-dashed cursor-pointer transition-opacity hover:opacity-80"
                style={{ backgroundColor: '#E3DFF8', borderColor: C.btnPrimary, color: C.btnPrimary, borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold }}>
                <Plus size={16} /> Add Item
            </button>
        </div>
    );
}

const CancelBtn = ({ onClick }) => (
    <button type="button" onClick={onClick}
        className="flex-1 py-2.5 rounded-xl text-sm transition-opacity hover:opacity-80 cursor-pointer border-none"
        style={{ backgroundColor: C.surfaceWhite, color: C.textMuted, fontWeight: T.weight.bold, border: `1px solid ${C.cardBorder}` }}>
        Cancel
    </button>
);

// â”€â”€â”€ Main SPA Wizard â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function CreateCoursePage() {
    const router = useRouter();
    const { institute } = useInstitute();

    // Wizard State
    const [step, setStep] = useState(1);
    const [courseId, setCourseId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
    const [categories, setCategories] = useState([]);

    // Data States
    const [courseData, setCourseData] = useState({
        title: '', description: '', price: '', level: 'beginner',
        category: '', thumbnail: '', language: 'English', duration: 0,
        visibility: 'institute',
        audience: { scope: 'institute', instituteId: null, batchIds: [], studentIds: [] },
        whatYouWillLearn: [''], requirements: [''],
    });

    const [modules, setModules] = useState([]);
    const [lessons, setLessons] = useState([]);
    const [assignments, setAssignments] = useState([]);

    // Modals State
    const [modals, setModals] = useState({ module: false, lesson: false, assignment: false });
    const [activeModuleId, setActiveModuleId] = useState(null);

    // Modal Forms
    const [moduleTitle, setModuleTitle] = useState('');
    const [lessonForm, setLessonForm] = useState(createDefaultLessonForm);
    const [assignmentForm, setAssignmentForm] = useState({ title: '', description: '', totalMarks: 100 });
    const [assignmentFiles, setAssignmentFiles] = useState([]);
    const [isUploadingVideo, setIsUploadingVideo] = useState(false);

    useEffect(() => { fetchCategories(); }, []);

    useEffect(() => {
        setCourseData(prev => {
            const nextAudience = { ...prev.audience, instituteId: prev.audience?.instituteId || institute?._id || null };
            return { ...prev, audience: nextAudience, visibility: nextAudience.scope === 'global' ? 'public' : 'institute' };
        });
    }, [institute?._id]);

    const fetchCategories = async () => {
        try {
            const res = await api.get('/categories');
            if (res?.data?.success) setCategories(res.data.categories || res.data.data || []);
        } catch (err) { console.error('Error fetching categories:', err); }
    };

    const handleDataChange = (e) => {
        const { name, value } = e.target;
        setCourseData(prev => ({ ...prev, [name]: value }));
    };

    const handleThumbnailUpload = async (file) => {
        if (!file) return;
        const previewUrl = URL.createObjectURL(file);
        setCourseData((prev) => ({ ...prev, thumbnail: previewUrl }));
        setIsUploadingThumbnail(true);

        try {
            const formData = new FormData();
            formData.append('image', file);
            const res = await api.post('/upload/image', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            const uploadedUrl = res.data?.imageUrl || res.data?.url;
            if (!uploadedUrl) throw new Error('Upload response missing image URL');
            setCourseData((prev) => ({ ...prev, thumbnail: uploadedUrl }));
            toast.success('Thumbnail uploaded');
        } catch (error) {
            setCourseData((prev) => ({ ...prev, thumbnail: '' }));
            toast.error(error?.response?.data?.message || 'Failed to upload thumbnail');
        } finally {
            URL.revokeObjectURL(previewUrl);
            setIsUploadingThumbnail(false);
        }
    };

    // â”€â”€â”€ Step 1: Save Course Info (Draft) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const handleStep1Submit = async (e) => {
        e.preventDefault();
        if (isUploadingThumbnail) {
            return toast.error('Please wait for thumbnail upload to finish');
        }
        if (!courseData.title || !courseData.description || !courseData.category || !courseData.price) {
            return toast.error('Please fill in all required fields');
        }
        setLoading(true);
        try {
            const payload = {
                title: courseData.title, description: courseData.description,
                price: Number(courseData.price), level: courseData.level,
                categoryId: courseData.category, thumbnail: courseData.thumbnail,
                language: courseData.language, duration: Number(courseData.duration),
                visibility: courseData.audience?.scope === 'global' ? 'public' : 'institute',
                audience: { ...courseData.audience, instituteId: courseData.audience?.instituteId || institute?._id || null },
                scope: courseData.audience?.scope,
                whatYouWillLearn: courseData.whatYouWillLearn.filter(i => i.trim() !== ''),
                requirements: courseData.requirements.filter(i => i.trim() !== ''),
                status: 'draft',
            };

            if (courseId) {
                await api.patch(`/courses/${courseId}`, payload);
                toast.success('Course info updated!');
                setStep(2);
            } else {
                const res = await api.post('/courses', payload);
                if (res?.data?.success) {
                    setCourseId(res.data.course._id);
                    toast.success('Course draft created! Now add curriculum.');
                    setStep(2);
                }
            }
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to save course info');
        } finally { setLoading(false); }
    };

    // â”€â”€â”€ Step 2: Curriculum Management â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const handleAddModule = async (e) => {
        e.preventDefault();
        if (!moduleTitle.trim()) return;
        setLoading(true);
        try {
            const updatedModules = [...modules, { title: moduleTitle }];
            await api.patch(`/courses/${courseId}`, { modules: updatedModules });

            const res = await api.get(`/courses/${courseId}`);
            if (res?.data?.success) {
                setModules(res.data.course.modules);
            }
            setModals({ ...modals, module: false });
            setModuleTitle('');
            toast.success('Module added');
        } catch { toast.error('Failed to add module'); }
        finally { setLoading(false); }
    };

    const handleAddLesson = async (e) => {
        e.preventDefault();
        if (!lessonForm.title || !activeModuleId) return;
        setLoading(true);
        try {
            let attachments = Array.isArray(lessonForm.attachments) ? lessonForm.attachments : [];
            const content = { attachments };
            if (lessonForm.type === 'video') {
                content.videoUrl = lessonForm.videoUrl;
                content.duration = Number(lessonForm.duration) * 60;
            } else if (lessonForm.type === 'document') {
                content.documents = lessonForm.documents;
                content.duration = Number(lessonForm.duration) * 60 || 0;
            } else if (lessonForm.type === 'quiz') {
                content.quiz = {
                    ...lessonForm.quiz,
                    timeLimit: lessonForm.quiz.timeLimit ? Number(lessonForm.quiz.timeLimit) : null,
                };
                content.duration = Number(lessonForm.duration) * 60 || 0;
            }

            const payload = {
                courseId, moduleId: activeModuleId,
                title: lessonForm.title, description: lessonForm.description, type: lessonForm.type,
                content, isFree: lessonForm.isFree
            };

            const res = await api.post('/lessons', payload);
            if (res?.data?.success) {
                setLessons(prev => [...prev, res.data.lesson]);
                setModals({ ...modals, lesson: false });
                setLessonForm(createDefaultLessonForm());
                toast.success('Lesson added');
            }
        } catch { toast.error('Failed to add lesson'); }
        finally { setLoading(false); }
    };

    const handleLessonFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const fd = new FormData();
        fd.append('file', file);
        try {
            const res = await api.post('/upload/file', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            if (res.data?.success || res.data?.fileUrl) {
                setLessonForm(prev => ({
                    ...prev,
                    attachments: [...prev.attachments, {
                        name: res.data.name || file.name,
                        url: res.data.fileUrl || res.data.url,
                        type: res.data.type || file.type
                    }]
                }));
                toast.success('File uploaded');
            }
        } catch {
            toast.error('Failed to upload file');
        } finally {
            e.target.value = '';
        }
    };

    const handleLessonDocumentUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const fd = new FormData();
        fd.append('file', file);
        try {
            const res = await api.post('/upload/file', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            if (res.data?.success || res.data?.fileUrl) {
                setLessonForm(prev => ({
                    ...prev,
                    documents: [...prev.documents, {
                        name: res.data.name || file.name,
                        url: res.data.fileUrl || res.data.url,
                        type: res.data.type || file.type
                    }]
                }));
                toast.success('Document uploaded');
            }
        } catch {
            toast.error('Failed to upload document');
        } finally {
            e.target.value = '';
        }
    };

    const handleLessonVideoUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const resolveUrl = (raw) => {
            if (!raw) return '';
            if (/^https?:\/\//i.test(raw)) return raw;
            const base = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/api\/?$/, '').replace(/\/+$/, '');
            return base ? `${base}${raw.startsWith('/') ? '' : '/'}${raw}` : raw;
        };
        const fd = new FormData();
        fd.append('video', file);
        setIsUploadingVideo(true);
        try {
            const res = await api.post('/upload/video-hls', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            if (res.data?.success) {
                setLessonForm(prev => ({ ...prev, videoUrl: resolveUrl(res.data.estimatedPlaylistUrl) }));
                toast.success('Video uploaded and is processing for HLS!');
            }
        } catch (error) {
            const msg = error.response?.data?.message || '';
            if (error.response?.status === 403 && /(hls|feature|subscription)/i.test(msg)) {
                try {
                    const fd2 = new FormData();
                    fd2.append('file', file);
                    const fb = await api.post('/upload/file', fd2, { headers: { 'Content-Type': 'multipart/form-data' } });
                    if (fb.data?.success || fb.data?.fileUrl) {
                        setLessonForm(prev => ({ ...prev, videoUrl: fb.data.fileUrl || fb.data.url }));
                        toast.success('Video uploaded (standard mode).');
                        return;
                    }
                } catch { /* ignore fallback upload errors */ }
            }
            toast.error(msg || 'Failed to upload video');
        } finally {
            setIsUploadingVideo(false);
            e.target.value = '';
        }
    };

    // â”€â”€â”€ Step 3: Assignments Management â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const handleAddAssignment = async (e) => {
        e.preventDefault();
        if (!assignmentForm.title.trim()) return;
        setLoading(true);
        try {
            // ðŸŒŸ 1. Upload files first if any
            const uploadedAttachments = [];
            if (assignmentFiles.length > 0) {
                for (const file of assignmentFiles) {
                    const formData = new FormData();
                    formData.append('file', file);
                    const res = await api.post('/upload/file', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                    if (res.data?.fileUrl || res.data?.url) {
                        uploadedAttachments.push({
                            name: res.data.name || file.name,
                            url: res.data.fileUrl || res.data.url,
                            type: res.data.type || file.type
                        });
                    }
                }
            }

            // ðŸŒŸ 2. Create Assignment with attachments
            const payload = {
                courseId,
                title: assignmentForm.title,
                description: assignmentForm.description,
                totalMarks: Number(assignmentForm.totalMarks),
                status: 'published',
                attachments: uploadedAttachments, // Injecting files here!
                audience: { scope: courseData.audience?.scope, instituteId: institute?._id || null }
            };
            const res = await api.post('/assignments', payload);
            if (res?.data?.success) {
                setAssignments(prev => [...prev, res.data.assignment]);
                setModals({ ...modals, assignment: false });
                setAssignmentForm({ title: '', description: '', totalMarks: 100 });
                setAssignmentFiles([]); // Reset files
                toast.success('Assignment added with attachments!');
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to add assignment');
        } finally { setLoading(false); }
    };

    // ðŸŒŸ File Handlers
    const handleAssignmentFileUpload = (e) => {
        const files = Array.from(e.target.files);
        const valid = files.filter(f => {
            if (f.size > 20 * 1024 * 1024) { toast.error(`${f.name} is too large (Max 20MB)`); return false; }
            return true;
        });
        setAssignmentFiles(prev => [...prev, ...valid]);
        e.target.value = '';
    };
    const removeAssignmentFile = (idx) => setAssignmentFiles(prev => prev.filter((_, i) => i !== idx));

    // â”€â”€â”€ Step 4: Final Publish â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const handlePublish = async () => {
        setLoading(true);
        try {
            const res = await api.patch(`/courses/${courseId}`, { status: 'published' });
            if (res?.data?.success) {
                toast.success('Course Published Successfully! ðŸŽ‰');
                router.push('/tutor/courses');
            }
        } catch { toast.error('Failed to publish course'); }
        finally { setLoading(false); }
    };

    // â”€â”€â”€ UI Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const learnList = {
        onChange: (idx, val) => setCourseData(prev => { const u = [...prev.whatYouWillLearn]; u[idx] = val; return { ...prev, whatYouWillLearn: u }; }),
        add: () => setCourseData(prev => ({ ...prev, whatYouWillLearn: [...prev.whatYouWillLearn, ''] })),
        remove: (idx) => setCourseData(prev => ({ ...prev, whatYouWillLearn: prev.whatYouWillLearn.filter((_, i) => i !== idx) })),
    };
    const reqList = {
        onChange: (idx, val) => setCourseData(prev => { const u = [...prev.requirements]; u[idx] = val; return { ...prev, requirements: u }; }),
        add: () => setCourseData(prev => ({ ...prev, requirements: [...prev.requirements, ''] })),
        remove: (idx) => setCourseData(prev => ({ ...prev, requirements: prev.requirements.filter((_, i) => i !== idx) })),
    };

    return (
        <div className="w-full min-h-screen p-6 pb-24" style={{ backgroundColor: '#dfdaf3', fontFamily: T.fontFamily, color: C.text }}>
            <div className="max-w-4xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <Link href="/tutor/courses" className="text-decoration-none">
                        <button className="w-10 h-10 flex items-center justify-center cursor-pointer border-none transition-opacity hover:opacity-80 shrink-0"
                            style={{ backgroundColor: outerCard, borderRadius: R.full }}>
                            <ArrowLeft size={18} color={C.heading} />
                        </button>
                    </Link>
                    <div>
                        <h1 style={{ fontSize: T.size.xl, fontWeight: T.weight.black, color: C.heading, margin: '0 0 2px 0' }}>Course Wizard</h1>
                        <p style={{ fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.textMuted, margin: 0 }}>Create and structure your entire course in one place.</p>
                    </div>
                </div>

                <StepBar current={step} />

                {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
                    STEP 1: COURSE INFO
                â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
                {step === 1 && (
                    <form onSubmit={handleStep1Submit} className="p-6 space-y-6" style={{ backgroundColor: outerCard, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                        <div className="space-y-2">
                            <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase' }}>Course Title *</label>
                            <input name="title" required value={courseData.title} onChange={handleDataChange} placeholder="e.g. Master React in 30 Days" style={baseInputStyle} onFocus={onFocusHandler} onBlur={onBlurHandler} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase' }}>Category *</label>
                                <select name="category" required value={courseData.category} onChange={handleDataChange} style={baseInputStyle} onFocus={onFocusHandler} onBlur={onBlurHandler}>
                                    <option value="" disabled>Select a category</option>
                                    {categories.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase' }}>Price (â‚¹) *</label>
                                <input name="price" type="number" min="0" required value={courseData.price} onChange={handleDataChange} placeholder="0.00" style={baseInputStyle} onFocus={onFocusHandler} onBlur={onBlurHandler} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase' }}>Course Summary *</label>
                            <textarea name="description" required rows={4} value={courseData.description} onChange={handleDataChange} placeholder="Provide a brief summary for your course..." style={{ ...baseInputStyle, resize: 'vertical', minHeight: '100px' }} onFocus={onFocusHandler} onBlur={onBlurHandler} />
                        </div>

                        <ThumbnailUpload value={courseData.thumbnail} onFileSelect={handleThumbnailUpload} uploading={isUploadingThumbnail} />

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase' }}>Difficulty Level</label>
                                <select name="level" value={courseData.level} onChange={handleDataChange} style={baseInputStyle} onFocus={onFocusHandler} onBlur={onBlurHandler}>
                                    <option value="beginner">Beginner</option>
                                    <option value="intermediate">Intermediate</option>
                                    <option value="advanced">Advanced</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase' }}>Language</label>
                                <input name="language" value={courseData.language} onChange={handleDataChange} placeholder="English" style={baseInputStyle} onFocus={onFocusHandler} onBlur={onBlurHandler} />
                            </div>
                            <div className="space-y-2">
                                <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase' }}>Duration (mins)</label>
                                <input name="duration" type="number" min="0" value={courseData.duration} onChange={handleDataChange} placeholder="0" style={baseInputStyle} onFocus={onFocusHandler} onBlur={onBlurHandler} />
                            </div>
                        </div>

                        <div className="pt-6 border-t" style={{ borderColor: C.cardBorder }}>
                            <ListFieldSection title="What Students Will Learn" items={courseData.whatYouWillLearn} onAdd={learnList.add} onRemove={learnList.remove} onChange={learnList.onChange} placeholder="Learning outcome" />
                        </div>

                        <div className="pt-6 border-t" style={{ borderColor: C.cardBorder }}>
                            <ListFieldSection title="Prerequisites & Requirements" items={courseData.requirements} onAdd={reqList.add} onRemove={reqList.remove} onChange={reqList.onChange} placeholder="Requirement" />
                        </div>

                        <div className="flex justify-end pt-4">
                            <button type="submit" disabled={loading || isUploadingThumbnail} className="flex items-center justify-center gap-2 h-11 px-8 cursor-pointer border-none transition-opacity hover:opacity-90 disabled:opacity-50 shadow-md"
                                style={{ background: C.gradientBtn, color: '#ffffff', borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                                {(loading || isUploadingThumbnail) ? <Loader2 size={16} className="animate-spin" /> : <>Save & Next <ChevronRight size={16} /></>}
                            </button>
                        </div>
                        <div className="flex justify-end pt-4">
                            <button type="submit" disabled={loading} className="flex items-center justify-center gap-2 ">

                            </button>
                        </div>
                    </form>
                )}

                {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
                    STEP 2: CURRICULUM
                â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
                {step === 2 && (
                    <div className="space-y-6">
                        <div className="p-6 flex items-center justify-between" style={{ backgroundColor: outerCard, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                            <div>
                                <h2 style={{ fontSize: T.size.lg, fontWeight: T.weight.black, color: C.heading, margin: '0 0 4px 0' }}>Build Curriculum</h2>
                                <p style={{ fontSize: T.size.sm, color: C.textMuted, margin: 0 }}>Organize your course into modules and lessons.</p>
                            </div>
                            <button onClick={() => setModals({ ...modals, module: true })} className="flex items-center justify-center gap-2 h-10 px-5 cursor-pointer border-none transition-opacity hover:opacity-90 shadow-sm"
                                style={{ backgroundColor: C.btnPrimary, color: '#ffffff', borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                                <Plus size={16} /> Add Module
                            </button>
                        </div>

                        {modules.length === 0 ? (
                            <div className="text-center py-16" style={{ backgroundColor: outerCard, borderRadius: R['2xl'], border: `1px dashed ${C.cardBorder}` }}>
                                <BookOpen size={32} color={C.textMuted} style={{ opacity: 0.3, marginBottom: '12px' }} />
                                <p style={{ fontSize: T.size.md, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 4px 0' }}>No Modules Yet</p>
                                <p style={{ fontSize: T.size.sm, color: C.textMuted, margin: 0 }}>Start by adding your first module.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {modules.map((mod, idx) => {
                                    const modLessons = lessons.filter(l => l.moduleId === mod._id);
                                    return (
                                        <div key={mod._id} className="overflow-hidden" style={{ backgroundColor: outerCard, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                                            <div className="p-4 flex items-center justify-between" style={{ backgroundColor: innerBox, borderBottom: `1px solid ${C.cardBorder}` }}>
                                                <h3 style={{ fontSize: T.size.md, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>
                                                    Module {idx + 1}: {mod.title}
                                                </h3>
                                                <button onClick={() => { setActiveModuleId(mod._id); setLessonForm(createDefaultLessonForm()); setModals({ ...modals, lesson: true }); }} className="flex items-center justify-center gap-1.5 h-8 px-3 cursor-pointer border-none transition-opacity hover:opacity-80 shadow-sm"
                                                    style={{ backgroundColor: C.surfaceWhite, color: C.btnPrimary, borderRadius: R.md, fontSize: T.size.xs, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                                                    <Plus size={14} /> Add Lesson
                                                </button>
                                            </div>
                                            <div className="p-4 space-y-2">
                                                {modLessons.length === 0 ? (
                                                    <p style={{ fontSize: T.size.xs, color: C.textMuted, margin: 0, fontStyle: 'italic' }}>No lessons in this module.</p>
                                                ) : (
                                                    modLessons.map((les, lIdx) => (
                                                        <div key={les._id} className="flex items-center gap-3 p-3" style={{ backgroundColor: innerBox, borderRadius: R.xl, border: `1px solid ${C.cardBorder}` }}>
                                                            <Video size={16} color={C.btnPrimary} />
                                                            <span style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading }}>{lIdx + 1}. {les.title}</span>
                                                            <span style={{ marginLeft: 'auto', fontSize: '10px', backgroundColor: C.surfaceWhite, padding: '2px 8px', borderRadius: R.full, color: C.textMuted, fontWeight: T.weight.bold }}>{les.type}</span>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <div className="flex justify-between pt-4">
                            <button onClick={() => setStep(1)} className="flex items-center justify-center gap-2 h-11 px-6 cursor-pointer border-none bg-transparent transition-opacity hover:opacity-70"
                                style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                                <ChevronLeft size={16} /> Back
                            </button>
                            <button onClick={() => setStep(3)} className="flex items-center justify-center gap-2 h-11 px-8 cursor-pointer border-none transition-opacity hover:opacity-90 shadow-md"
                                style={{ background: C.gradientBtn, color: '#ffffff', borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                                Next: Assignments <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}

                {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
                    STEP 3: ASSIGNMENTS
                â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
                {step === 3 && (
                    <div className="space-y-6">
                        <div className="p-6 flex items-center justify-between" style={{ backgroundColor: outerCard, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                            <div>
                                <h2 style={{ fontSize: T.size.lg, fontWeight: T.weight.black, color: C.heading, margin: '0 0 4px 0' }}>Course Assignments</h2>
                                <p style={{ fontSize: T.size.sm, color: C.textMuted, margin: 0 }}>Add assignments to test student knowledge.</p>
                            </div>
                            <button onClick={() => setModals({ ...modals, assignment: true })} className="flex items-center justify-center gap-2 h-10 px-5 cursor-pointer border-none transition-opacity hover:opacity-90 shadow-sm"
                                style={{ backgroundColor: C.btnPrimary, color: '#ffffff', borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                                <Plus size={16} /> Add Assignment
                            </button>
                        </div>

                        {assignments.length === 0 ? (
                            <div className="text-center py-16" style={{ backgroundColor: outerCard, borderRadius: R['2xl'], border: `1px dashed ${C.cardBorder}` }}>
                                <FileText size={32} color={C.textMuted} style={{ opacity: 0.3, marginBottom: '12px' }} />
                                <p style={{ fontSize: T.size.md, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 4px 0' }}>No Assignments Yet</p>
                                <p style={{ fontSize: T.size.sm, color: C.textMuted, margin: 0 }}>Optional: Add assignments or skip to publish.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {assignments.map((assign, idx) => (
                                    <div key={assign._id} className="p-4 flex items-center gap-4" style={{ backgroundColor: outerCard, borderRadius: R.xl, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                                        <div className="w-10 h-10 flex items-center justify-center shrink-0" style={{ backgroundColor: innerBox, borderRadius: R.md }}>
                                            <FileText size={18} color={C.btnPrimary} />
                                        </div>
                                        <div>
                                            <p style={{ fontSize: T.size.md, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 2px 0' }}>{assign.title}</p>
                                            <p style={{ fontSize: T.size.xs, color: C.textMuted, margin: 0 }}>{assign.totalMarks} Points</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex justify-between pt-4">
                            <button onClick={() => setStep(2)} className="flex items-center justify-center gap-2 h-11 px-6 cursor-pointer border-none bg-transparent transition-opacity hover:opacity-70"
                                style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                                <ChevronLeft size={16} /> Back
                            </button>
                            <button onClick={() => setStep(4)} className="flex items-center justify-center gap-2 h-11 px-8 cursor-pointer border-none transition-opacity hover:opacity-90 shadow-md"
                                style={{ background: C.gradientBtn, color: '#ffffff', borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                                Next: Publish <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}

                {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
                    STEP 4: PUBLISH
                â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
                {step === 4 && (
                    <div className="space-y-6">
                        <div className="p-10 text-center" style={{ backgroundColor: outerCard, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                            <div className="w-20 h-20 mx-auto flex items-center justify-center mb-6" style={{ backgroundColor: C.successBg, borderRadius: R.full, border: `4px solid ${C.surfaceWhite}`, boxShadow: S.card }}>
                                <Rocket size={32} color={C.success} />
                            </div>
                            <h2 style={{ fontSize: T.size['2xl'], fontWeight: T.weight.black, color: C.heading, margin: '0 0 8px 0' }}>You're almost there!</h2>
                            <p style={{ fontSize: T.size.sm, color: C.textMuted, margin: '0 auto 24px', maxWidth: 400, lineHeight: 1.5 }}>
                                Your course draft is saved. Review your curriculum and publish it when you're ready to go live.
                            </p>

                            <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto mb-8">
                                <div className="p-4" style={{ backgroundColor: innerBox, borderRadius: R.xl }}>
                                    <p style={{ fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', margin: '0 0 4px 0' }}>Modules</p>
                                    <p style={{ fontSize: T.size.xl, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>{modules.length}</p>
                                </div>
                                <div className="p-4" style={{ backgroundColor: innerBox, borderRadius: R.xl }}>
                                    <p style={{ fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', margin: '0 0 4px 0' }}>Lessons</p>
                                    <p style={{ fontSize: T.size.xl, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>{lessons.length}</p>
                                </div>
                                <div className="p-4" style={{ backgroundColor: innerBox, borderRadius: R.xl }}>
                                    <p style={{ fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', margin: '0 0 4px 0' }}>Assignments</p>
                                    <p style={{ fontSize: T.size.xl, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>{assignments.length}</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-center gap-4">
                                <button onClick={() => setStep(3)} className="flex items-center justify-center gap-2 h-12 px-8 cursor-pointer border-none bg-transparent transition-opacity hover:opacity-70"
                                    style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                                    <ChevronLeft size={16} /> Go Back
                                </button>
                                <button onClick={handlePublish} disabled={loading} className="flex items-center justify-center gap-2 h-12 px-10 cursor-pointer border-none transition-opacity hover:opacity-90 disabled:opacity-50 shadow-lg"
                                    style={{ backgroundColor: C.success, color: '#ffffff', borderRadius: R.xl, fontSize: T.size.base, fontWeight: T.weight.black, fontFamily: T.fontFamily }}>
                                    {loading ? <Loader2 size={18} className="animate-spin" /> : <Rocket size={18} />} Publish Course
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
                MODALS FOR WIZARD
            â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}

            {/* Add Module Modal */}
            {modals.module && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(21, 22, 86, 0.4)', backdropFilter: 'blur(4px)' }}>
                    <div className="w-full max-w-md p-6" style={{ backgroundColor: outerCard, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.cardHover }}>
                        <h3 style={{ fontSize: T.size.lg, fontWeight: T.weight.black, color: C.heading, margin: '0 0 16px 0' }}>Add Module</h3>
                        <form onSubmit={handleAddModule} className="space-y-4">
                            <input type="text" value={moduleTitle} onChange={e => setModuleTitle(e.target.value)} required placeholder="Module Title (e.g. Basics of React)" style={baseInputStyle} onFocus={onFocusHandler} onBlur={onBlurHandler} autoFocus />
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setModals({ ...modals, module: false })} className="px-5 py-2 cursor-pointer bg-transparent border-none hover:opacity-70" style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>Cancel</button>
                                <button type="submit" disabled={loading || !moduleTitle} className="px-6 py-2 cursor-pointer border-none transition-opacity hover:opacity-90 disabled:opacity-50 shadow-md" style={{ background: C.gradientBtn, color: '#ffffff', borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                                    {loading ? <Loader2 size={16} className="animate-spin" /> : 'Save'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Lesson Modal */}
            {modals.lesson && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(21, 22, 86, 0.4)', backdropFilter: 'blur(4px)' }}>
                    <div className="w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto custom-scrollbar" style={{ backgroundColor: outerCard, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.cardHover }}>
                        <h3 style={{ fontSize: T.size.lg, fontWeight: T.weight.black, color: C.heading, margin: '0 0 16px 0' }}>Add Lesson</h3>
                        <form onSubmit={handleAddLesson} className="space-y-4">
                            <div className="grid grid-cols-3 gap-2">
                                {['video', 'document', 'quiz'].map(type => (
                                    <button key={type} type="button"
                                        onClick={() => setLessonForm(prev => ({ ...prev, type }))}
                                        className="py-2.5 rounded-xl border-2 text-xs font-bold capitalize transition-all cursor-pointer"
                                        style={lessonForm.type === type
                                            ? { borderColor: C.btnPrimary, backgroundColor: '#ECEAFF', color: C.btnPrimary, fontFamily: T.fontFamily }
                                            : { borderColor: C.cardBorder, backgroundColor: C.surfaceWhite, color: C.textMuted, fontFamily: T.fontFamily }}>
                                        {type}
                                    </button>
                                ))}
                            </div>

                            <input type="text" value={lessonForm.title} onChange={e => setLessonForm(prev => ({ ...prev, title: e.target.value }))} required placeholder="Lesson Title" style={baseInputStyle} onFocus={onFocusHandler} onBlur={onBlurHandler} autoFocus />
                            <textarea rows={3} value={lessonForm.description} onChange={e => setLessonForm(prev => ({ ...prev, description: e.target.value }))} placeholder="Briefly describe what students will learn..." style={{ ...baseInputStyle, resize: 'none' }} onFocus={onFocusHandler} onBlur={onBlurHandler} />

                            <div className="mt-1 border-t pt-4" style={{ borderColor: C.cardBorder }}>
                                <label style={{ fontSize: '10px', fontWeight: T.weight.black, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', display: 'block' }}>
                                    Resources & Attachments
                                </label>
                                {lessonForm.attachments.length > 0 && (
                                    <div className="space-y-2 mb-3 max-h-36 overflow-y-auto pr-1 custom-scrollbar">
                                        {lessonForm.attachments.map((file, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl border" style={{ backgroundColor: C.surfaceWhite, borderColor: C.cardBorder }}>
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <FileText size={14} style={{ color: C.btnPrimary, flexShrink: 0 }} />
                                                    <div className="min-w-0">
                                                        <p className="truncate m-0" style={{ fontSize: '11px', fontWeight: T.weight.bold, color: C.heading }}>{file.name}</p>
                                                        <p className="m-0" style={{ fontSize: '10px', color: C.textMuted, textTransform: 'uppercase' }}>{file.type?.split('/')[1] || 'File'}</p>
                                                    </div>
                                                </div>
                                                <button type="button" onClick={() => setLessonForm(prev => ({ ...prev, attachments: prev.attachments.filter((_, i) => i !== idx) }))} className="w-6 h-6 flex items-center justify-center rounded-md cursor-pointer border-none bg-red-50 hover:bg-red-100 transition-colors shrink-0" style={{ color: C.danger }}>
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <input type="file" onChange={handleLessonFileUpload} className="hidden" id="tutor-lesson-resource-upload" />
                                <label htmlFor="tutor-lesson-resource-upload" className="flex items-center justify-center gap-2 w-full py-2.5 border-2 border-dashed rounded-xl text-xs font-semibold cursor-pointer transition-all"
                                    style={{ borderColor: C.btnPrimary, color: C.btnPrimary, backgroundColor: '#ECEAFF', fontFamily: T.fontFamily }}>
                                    <Plus size={14} /> Upload Resource
                                </label>
                            </div>

                            {lessonForm.type === 'video' && (
                                <div className="space-y-3">
                                    <input type="file" onChange={handleLessonVideoUpload} accept="video/mp4,video/x-m4v,video/*" className="hidden" id="tutor-lesson-video-upload" disabled={isUploadingVideo} />
                                    <label htmlFor="tutor-lesson-video-upload" className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-dashed text-sm font-semibold transition-all ${isUploadingVideo ? 'opacity-60 cursor-wait' : 'cursor-pointer'}`}
                                        style={{ borderColor: C.btnPrimary, color: C.btnPrimary, backgroundColor: '#ECEAFF', fontFamily: T.fontFamily }}>
                                        {isUploadingVideo
                                            ? <><Loader2 size={14} className="animate-spin" /> Uploading & Processing…</>
                                            : <><Video size={14} /> Upload Video (Auto HLS)</>}
                                    </label>
                                    <input type="url" value={lessonForm.videoUrl} onChange={e => setLessonForm(prev => ({ ...prev, videoUrl: e.target.value }))} required placeholder="https://example.com/video.mp4" style={baseInputStyle} onFocus={onFocusHandler} onBlur={onBlurHandler} />
                                    <p style={{ fontSize: '11px', color: C.textMuted, margin: 0 }}>Direct video link or YouTube URL</p>
                                </div>
                            )}

                            {lessonForm.type === 'document' && (
                                <div className="space-y-3">
                                    {lessonForm.documents.length > 0 && (
                                        <div className="space-y-2 max-h-36 overflow-y-auto pr-1 custom-scrollbar">
                                            {lessonForm.documents.map((file, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl border" style={{ backgroundColor: C.surfaceWhite, borderColor: C.cardBorder }}>
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <FileText size={14} style={{ color: C.warning, flexShrink: 0 }} />
                                                        <p className="truncate m-0" style={{ fontSize: '11px', fontWeight: T.weight.bold, color: C.heading }}>{file.name}</p>
                                                    </div>
                                                    <button type="button" onClick={() => setLessonForm(prev => ({ ...prev, documents: prev.documents.filter((_, i) => i !== idx) }))} className="w-6 h-6 flex items-center justify-center rounded-md cursor-pointer border-none bg-red-50 hover:bg-red-100 transition-colors shrink-0" style={{ color: C.danger }}>
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <input type="file" onChange={handleLessonDocumentUpload} className="hidden" id="tutor-lesson-doc-upload" accept=".pdf,.doc,.docx,.ppt,.pptx" />
                                    <label htmlFor="tutor-lesson-doc-upload" className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed rounded-xl text-sm font-semibold cursor-pointer transition-all"
                                        style={{ borderColor: C.warningBorder, backgroundColor: C.warningBg, color: C.warning, fontFamily: T.fontFamily }}>
                                        <Upload size={14} /> Upload Document
                                    </label>
                                </div>
                            )}

                            {lessonForm.type === 'quiz' && (
                                <div className="p-4 rounded-2xl border text-center" style={{ borderColor: '#CFC8FF', backgroundColor: '#F3F1FF' }}>
                                    <AlertCircle size={20} className="mx-auto mb-2" style={{ color: C.btnPrimary }} />
                                    <h4 style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>Quiz Builder</h4>
                                    <p style={{ fontSize: T.size.xs, color: C.textMuted, margin: '4px 0 14px 0' }}>
                                        Questions are managed in the Quiz Builder after creation.
                                    </p>
                                    <div className="grid grid-cols-2 gap-3 text-left">
                                        {[
                                            { label: 'Passing Score (%)', key: 'passingScore', placeholder: '70' },
                                            { label: 'Time Limit (mins)', key: 'timeLimit', placeholder: 'No limit' },
                                        ].map(({ label, key, placeholder }) => (
                                            <div key={key}>
                                                <label style={{ display: 'block', fontSize: '10px', fontWeight: T.weight.black, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                                                    {label}
                                                </label>
                                                <input type="number" placeholder={placeholder} value={lessonForm.quiz?.[key] || ''} onChange={e => setLessonForm(prev => ({ ...prev, quiz: { ...prev.quiz, [key]: e.target.value } }))} style={{ ...baseInputStyle, padding: '8px 12px' }} onFocus={onFocusHandler} onBlur={onBlurHandler} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {lessonForm.type !== 'quiz' && (
                                <>
                                    <input type="number" value={lessonForm.duration} onChange={e => setLessonForm(prev => ({ ...prev, duration: e.target.value }))} placeholder="Duration (minutes)" style={baseInputStyle} onFocus={onFocusHandler} onBlur={onBlurHandler} />
                                    <label className="flex items-center gap-3 p-3.5 rounded-xl cursor-pointer" style={{ backgroundColor: innerBox }}>
                                        <input type="checkbox" checked={lessonForm.isFree} onChange={e => setLessonForm(prev => ({ ...prev, isFree: e.target.checked }))} className="w-4 h-4 rounded" style={{ accentColor: C.btnPrimary }} />
                                        <div>
                                            <p style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>Free preview lesson</p>
                                            <p style={{ fontSize: T.size.xs, color: C.textMuted, margin: 0 }}>Students can watch this without enrolling</p>
                                        </div>
                                    </label>
                                </>
                            )}

                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setModals({ ...modals, lesson: false })} className="px-5 py-2 cursor-pointer bg-transparent border-none hover:opacity-70" style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>Cancel</button>
                                <button type="submit" disabled={loading || !lessonForm.title} className="px-6 py-2 cursor-pointer border-none transition-opacity hover:opacity-90 disabled:opacity-50 shadow-md" style={{ background: C.gradientBtn, color: '#ffffff', borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                                    {loading ? <Loader2 size={16} className="animate-spin" /> : 'Add Lesson'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Assignment Modal */}
            {modals.assignment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(21, 22, 86, 0.4)', backdropFilter: 'blur(4px)' }}>
                    <div className="w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto custom-scrollbar" style={{ backgroundColor: outerCard, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.cardHover }}>
                        <h3 style={{ fontSize: T.size.lg, fontWeight: T.weight.black, color: C.heading, margin: '0 0 16px 0' }}>Add Assignment</h3>
                        <form onSubmit={handleAddAssignment} className="space-y-4">
                            <input type="text" value={assignmentForm.title} onChange={e => setAssignmentForm({ ...assignmentForm, title: e.target.value })} required placeholder="Assignment Title" style={baseInputStyle} onFocus={onFocusHandler} onBlur={onBlurHandler} autoFocus />
                            <textarea rows={3} value={assignmentForm.description} onChange={e => setAssignmentForm({ ...assignmentForm, description: e.target.value })} placeholder="Brief description & instructions..." style={{ ...baseInputStyle, resize: 'none' }} onFocus={onFocusHandler} onBlur={onBlurHandler} />
                            <input type="number" value={assignmentForm.totalMarks} onChange={e => setAssignmentForm({ ...assignmentForm, totalMarks: e.target.value })} required placeholder="Total Marks" style={baseInputStyle} onFocus={onFocusHandler} onBlur={onBlurHandler} />

                            {/* ðŸŒŸ NEW FILE UPLOAD ZONE */}
                            <div className="mt-4 border-t pt-4" style={{ borderColor: C.cardBorder }}>
                                <label style={{ fontSize: '10px', fontWeight: T.weight.black, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', display: 'block' }}>
                                    Attach Reference Files
                                </label>
                                <div className="border-2 border-dashed rounded-2xl p-6 text-center transition-colors cursor-pointer mb-4"
                                    style={{ borderColor: C.cardBorder, backgroundColor: innerBox }}
                                    onClick={() => document.getElementById('tutor-assignment-upload').click()}>
                                    <input type="file" multiple accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg" onChange={handleAssignmentFileUpload} className="hidden" id="tutor-assignment-upload" />
                                    <Upload className="w-6 h-6 mx-auto mb-2" style={{ color: C.btnPrimary }} />
                                    <p style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, margin: 0 }}>Click to attach PDFs or Documents</p>
                                </div>

                                {assignmentFiles.length > 0 && (
                                    <div className="space-y-2 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                                        {assignmentFiles.map((f, i) => (
                                            <div key={i} className="flex items-center justify-between p-2.5 rounded-xl border" style={{ backgroundColor: C.surfaceWhite, borderColor: C.cardBorder }}>
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <FileText size={14} style={{ color: C.btnPrimary, flexShrink: 0 }} />
                                                    <p className="truncate m-0" style={{ fontSize: '11px', fontWeight: T.weight.bold, color: C.heading }}>{f.name}</p>
                                                </div>
                                                <button type="button" onClick={(e) => { e.stopPropagation(); removeAssignmentFile(i); }} className="w-6 h-6 flex items-center justify-center rounded-md cursor-pointer border-none bg-red-50 hover:bg-red-100 transition-colors shrink-0" style={{ color: C.danger }}>
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setModals({ ...modals, assignment: false })} className="px-5 py-2 cursor-pointer bg-transparent border-none hover:opacity-70" style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>Cancel</button>
                                <button type="submit" disabled={loading || !assignmentForm.title} className="px-6 py-2 cursor-pointer border-none transition-opacity hover:opacity-90 disabled:opacity-50 shadow-md" style={{ background: C.gradientBtn, color: '#ffffff', borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                                    {loading ? <Loader2 size={16} className="animate-spin" /> : 'Save Assignment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
