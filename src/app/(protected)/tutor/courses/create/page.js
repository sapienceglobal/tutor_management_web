'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Save, Plus, X, BookOpen } from 'lucide-react';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import AudienceSelector from '@/components/shared/AudienceSelector';
import useInstitute from '@/hooks/useInstitute';

// ─── Shared styled select ────────────────────────────────────────────────────
function StyledSelect({ id, name, value, onChange, required, children }) {
    return (
        <select id={id} name={name} value={value} onChange={onChange} required={required}
            className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700
                focus:outline-none focus:border-[var(--theme-primary)] focus:ring-2 focus:ring-[var(--theme-primary)]/10
                disabled:cursor-not-allowed disabled:opacity-50 transition-colors">
            {children}
        </select>
    );
}

// ─── Section heading ─────────────────────────────────────────────────────────
function SectionHeading({ children }) {
    return (
        <h3 className="text-sm font-bold text-slate-800 pb-2 border-b border-slate-100 flex items-center gap-2">
            <span className="w-1 h-4 rounded-full inline-block" style={{ backgroundColor: 'var(--theme-primary)' }} />
            {children}
        </h3>
    );
}

export default function CreateCoursePage() {
    const router = useRouter();
    const { institute } = useInstitute();
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([]);

    const [formData, setFormData] = useState({
        title: '', description: '', price: '', level: 'beginner',
        category: '', thumbnail: '', language: 'English', duration: 0,
        visibility: 'institute',
        audience: { scope: 'institute', instituteId: null, batchIds: [], studentIds: [] },
        whatYouWillLearn: [''],
        requirements: [''],
    });

    useEffect(() => { fetchCategories(); }, []);

    useEffect(() => {
        setFormData(prev => {
            const nextAudience = { ...prev.audience, instituteId: prev.audience?.instituteId || institute?._id || null };
            return { ...prev, audience: nextAudience, visibility: nextAudience.scope === 'global' ? 'public' : 'institute' };
        });
    }, [institute?._id]);

    const fetchCategories = async () => {
        try {
            const res = await api.get('/categories');
            if (res.data.success) setCategories(res.data.categories || res.data.data || []);
        } catch (error) { console.error('Error fetching categories:', error); }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title || !formData.description || !formData.category || !formData.price) {
            toast.error('Please fill in all required fields');
            return;
        }
        setLoading(true);
        try {
            const payload = {
                title: formData.title, description: formData.description,
                price: Number(formData.price), level: formData.level,
                categoryId: formData.category, thumbnail: formData.thumbnail,
                language: formData.language, duration: Number(formData.duration),
                visibility: formData.audience?.scope === 'global' ? 'public' : 'institute',
                audience: { ...formData.audience, instituteId: formData.audience?.instituteId || institute?._id || null },
                scope: formData.audience?.scope,
                whatYouWillLearn: formData.whatYouWillLearn.filter(i => i.trim() !== ''),
                requirements: formData.requirements.filter(i => i.trim() !== ''),
            };
            const res = await api.post('/courses', payload);
            if (res.data.success) { router.push('/tutor/courses'); router.refresh(); }
        } catch (error) {
            console.error('Error creating course:', error);
            toast.error(error.response?.data?.message || 'Failed to create course');
        } finally { setLoading(false); }
    };

    const listField = (key) => ({
        onChange: (idx, val) => setFormData(prev => {
            const updated = [...prev[key]];
            updated[idx] = val;
            return { ...prev, [key]: updated };
        }),
        add: () => setFormData(prev => ({ ...prev, [key]: [...prev[key], ''] })),
        remove: (idx) => setFormData(prev => ({ ...prev, [key]: prev[key].filter((_, i) => i !== idx) })),
    });

    const learn = listField('whatYouWillLearn');
    const req = listField('requirements');

    return (
        <div className="max-w-2xl mx-auto space-y-5" style={{ fontFamily: "var(--theme-font, 'DM Sans', sans-serif)" }}>

            {/* Page Header */}
            <div className="flex items-center gap-3">
                <Link href="/tutor/courses">
                    <button className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors">
                        <ArrowLeft className="w-4 h-4 text-slate-500" />
                    </button>
                </Link>
                <div>
                    <div className="flex items-center gap-2.5 mb-0.5">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 12%, white)', border: '1px solid color-mix(in srgb, var(--theme-primary) 20%, white)' }}>
                            <BookOpen className="w-3.5 h-3.5" style={{ color: 'var(--theme-primary)' }} />
                        </div>
                        <h1 className="text-lg font-bold text-slate-800">Create New Course</h1>
                    </div>
                    <p className="text-xs text-slate-400 pl-0.5">Fill in the details to publish your course.</p>
                </div>
            </div>

            {/* Form */}
            <div className="bg-white rounded-xl border border-slate-100 p-6">
                <form onSubmit={handleSubmit} className="space-y-7">

                    {/* ── Basic Info ──────────────────────────────────── */}
                    <div className="space-y-4">
                        <SectionHeading>Basic Information</SectionHeading>
                        <div className="space-y-1.5">
                            <Label className="text-sm font-semibold text-slate-700">Course Title <span className="text-red-500">*</span></Label>
                            <Input name="title" placeholder="e.g. Complete Web Development Bootcamp"
                                value={formData.title} onChange={handleChange} required
                                className="h-10 border-slate-200 focus:border-[var(--theme-primary)] focus:ring-[var(--theme-primary)]/10" />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-sm font-semibold text-slate-700">Description <span className="text-red-500">*</span></Label>
                            <Textarea name="description" placeholder="Tell students what they will learn..."
                                className="h-28 border-slate-200 resize-none focus:border-[var(--theme-primary)] focus:ring-[var(--theme-primary)]/10"
                                value={formData.description} onChange={handleChange} required />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-sm font-semibold text-slate-700">Category <span className="text-red-500">*</span></Label>
                                <StyledSelect id="category" name="category" value={formData.category} onChange={handleChange} required>
                                    <option value="">Select a category</option>
                                    {Array.isArray(categories) && categories.map(cat => (
                                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                                    ))}
                                </StyledSelect>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-sm font-semibold text-slate-700">Difficulty Level</Label>
                                <StyledSelect id="level" name="level" value={formData.level} onChange={handleChange}>
                                    <option value="beginner">Beginner</option>
                                    <option value="intermediate">Intermediate</option>
                                    <option value="advanced">Advanced</option>
                                </StyledSelect>
                            </div>
                        </div>
                        <AudienceSelector
                            value={formData.audience}
                            onChange={(audience) => setFormData(prev => ({ ...prev, audience }))}
                            availableBatches={[]} availableStudents={[]}
                            allowGlobal={Boolean(!institute?._id || institute?.features?.allowGlobalPublishingByInstituteTutors)}
                            instituteId={institute?._id || null}
                        />
                    </div>

                    {/* ── Pricing & Media ─────────────────────────────── */}
                    <div className="space-y-4">
                        <SectionHeading>Pricing & Media</SectionHeading>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-sm font-semibold text-slate-700">Price (₹) <span className="text-red-500">*</span></Label>
                                <Input name="price" type="number" placeholder="999" min="0"
                                    value={formData.price} onChange={handleChange} required
                                    className="h-10 border-slate-200" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-sm font-semibold text-slate-700">Thumbnail URL</Label>
                                <Input name="thumbnail" placeholder="https://example.com/image.jpg"
                                    value={formData.thumbnail} onChange={handleChange}
                                    className="h-10 border-slate-200" />
                                <p className="text-[11px] text-slate-400">Paste an image URL for now.</p>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-sm font-semibold text-slate-700">Duration (minutes)</Label>
                                <Input name="duration" type="number" placeholder="120"
                                    value={formData.duration} onChange={handleChange}
                                    className="h-10 border-slate-200" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-sm font-semibold text-slate-700">Language</Label>
                                <Input name="language" placeholder="English"
                                    value={formData.language} onChange={handleChange}
                                    className="h-10 border-slate-200" />
                            </div>
                        </div>
                    </div>

                    {/* ── What students will learn ─────────────────────── */}
                    <div className="space-y-3">
                        <SectionHeading>What Students Will Learn</SectionHeading>
                        <p className="text-xs text-slate-400">Add key learning outcomes shown on the course landing page.</p>
                        {formData.whatYouWillLearn.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                                <Input value={item} placeholder={`Learning outcome ${idx + 1}`}
                                    onChange={(e) => learn.onChange(idx, e.target.value)}
                                    className="h-9 border-slate-200 text-sm" />
                                {formData.whatYouWillLearn.length > 1 && (
                                    <button type="button" onClick={() => learn.remove(idx)}
                                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors flex-shrink-0">
                                        <X className="w-4 h-4 text-red-400" />
                                    </button>
                                )}
                            </div>
                        ))}
                        <Button type="button" variant="outline" size="sm" onClick={learn.add}
                            className="gap-1.5 border-dashed text-sm">
                            <Plus className="w-3.5 h-3.5" /> Add Learning Outcome
                        </Button>
                    </div>

                    {/* ── Requirements ────────────────────────────────── */}
                    <div className="space-y-3">
                        <SectionHeading>Prerequisites & Requirements</SectionHeading>
                        <p className="text-xs text-slate-400">What should students know before enrolling?</p>
                        {formData.requirements.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                                <Input value={item} placeholder={`Requirement ${idx + 1}`}
                                    onChange={(e) => req.onChange(idx, e.target.value)}
                                    className="h-9 border-slate-200 text-sm" />
                                {formData.requirements.length > 1 && (
                                    <button type="button" onClick={() => req.remove(idx)}
                                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors flex-shrink-0">
                                        <X className="w-4 h-4 text-red-400" />
                                    </button>
                                )}
                            </div>
                        ))}
                        <Button type="button" variant="outline" size="sm" onClick={req.add}
                            className="gap-1.5 border-dashed text-sm">
                            <Plus className="w-3.5 h-3.5" /> Add Requirement
                        </Button>
                    </div>

                    {/* Submit */}
                    <div className="pt-2 flex justify-end gap-3 border-t border-slate-100">
                        <Link href="/tutor/courses">
                            <Button type="button" variant="outline" className="border-slate-200">Cancel</Button>
                        </Link>
                        <Button type="submit" disabled={loading} className="min-w-[140px] text-white gap-2"
                            style={{ backgroundColor: 'var(--theme-primary)' }}>
                            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : <><Save className="w-4 h-4" /> Create Course</>}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}