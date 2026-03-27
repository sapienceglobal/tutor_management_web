'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Save, Plus, X, BookOpen } from 'lucide-react';
import api from '@/lib/axios';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import AudienceSelector from '@/components/shared/AudienceSelector';
import useInstitute from '@/hooks/useInstitute';
import { C, T, S, R, FX, cx, pageStyle } from '@/constants/tutorTokens';

// ─── Shared styled select ─────────────────────────────────────────────────────
function StyledSelect({ id, name, value, onChange, required, children }) {
    return (
        <select id={id} name={name} value={value} onChange={onChange} required={required}
            style={{ ...cx.input(), width: '100%', height: 40, padding: '0 12px', cursor: 'pointer', appearance: 'none' }}
            onFocus={e => Object.assign(e.target.style, cx.inputFocus)}
            onBlur={e => { e.target.style.borderColor = C.cardBorder; e.target.style.boxShadow = 'none'; }}>
            {children}
        </select>
    );
}

// ─── Section heading ──────────────────────────────────────────────────────────
function SectionHeading({ children }) {
    return (
        <h3 className="flex items-center gap-2 pb-2"
            style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, borderBottom: `1px solid ${C.cardBorder}` }}>
            <span className="w-1 h-4 rounded-full inline-block flex-shrink-0"
                style={{ backgroundColor: C.btnPrimary }} />
            {children}
        </h3>
    );
}

// ─── Field label ──────────────────────────────────────────────────────────────
function FieldLabel({ children, required }) {
    return (
        <label style={{ display: 'block', fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.semibold, color: C.text, marginBottom: 6 }}>
            {children} {required && <span style={{ color: C.danger }}>*</span>}
        </label>
    );
}

export default function CreateCoursePage() {
    const router = useRouter();
    const { institute } = useInstitute();
    const [loading, setLoading]     = useState(false);
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
        } catch (err) { console.error('Error fetching categories:', err); }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title || !formData.description || !formData.category || !formData.price) {
            toast.error('Please fill in all required fields'); return;
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
        } catch (err) {
            console.error('Error creating course:', err);
            toast.error(err.response?.data?.message || 'Failed to create course');
        } finally { setLoading(false); }
    };

    const listField = (key) => ({
        onChange: (idx, val) => setFormData(prev => { const u = [...prev[key]]; u[idx] = val; return { ...prev, [key]: u }; }),
        add:    () => setFormData(prev => ({ ...prev, [key]: [...prev[key], ''] })),
        remove: (idx) => setFormData(prev => ({ ...prev, [key]: prev[key].filter((_, i) => i !== idx) })),
    });

    const learn = listField('whatYouWillLearn');
    const req   = listField('requirements');

    const inputSt = { ...cx.input(), width: '100%', height: 40, padding: '0 12px' };

    return (
        <div className="max-w-2xl mx-auto space-y-5" style={pageStyle}>

            {/* ── Page Header ───────────────────────────────────────────── */}
            <div className="flex items-center gap-3">
                <Link href="/tutor/courses">
                    <button className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:opacity-80"
                        style={{ backgroundColor: C.innerBg, color: C.textMuted }}>
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                </Link>
                <div>
                    <div className="flex items-center gap-2.5 mb-0.5">
                        <div className="w-7 h-7 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: FX.primary15, border: `1px solid ${FX.primary25}` }}>
                            <BookOpen className="w-3.5 h-3.5" style={{ color: C.btnPrimary }} />
                        </div>
                        <h1 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading }}>
                            Create New Course
                        </h1>
                    </div>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>
                        Fill in the details to publish your course.
                    </p>
                </div>
            </div>

            {/* ── Form Card ─────────────────────────────────────────────── */}
            <div className="rounded-2xl p-6"
                style={{ backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                <form onSubmit={handleSubmit} className="space-y-7">

                    {/* Basic Info */}
                    <div className="space-y-4">
                        <SectionHeading>Basic Information</SectionHeading>

                        <div>
                            <FieldLabel required>Course Title</FieldLabel>
                            <input name="title" placeholder="e.g. Complete Web Development Bootcamp"
                                value={formData.title} onChange={handleChange} required
                                style={inputSt}
                                onFocus={e => Object.assign(e.target.style, cx.inputFocus)}
                                onBlur={e => { e.target.style.borderColor = C.cardBorder; e.target.style.boxShadow = 'none'; }}
                            />
                        </div>

                        <div>
                            <FieldLabel required>Description</FieldLabel>
                            <textarea name="description" placeholder="Tell students what they will learn..."
                                value={formData.description} onChange={handleChange} required rows={4}
                                style={{ ...cx.input(), width: '100%', padding: '10px 12px', resize: 'none' }}
                                onFocus={e => Object.assign(e.target.style, cx.inputFocus)}
                                onBlur={e => { e.target.style.borderColor = C.cardBorder; e.target.style.boxShadow = 'none'; }}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <FieldLabel required>Category</FieldLabel>
                                <StyledSelect id="category" name="category" value={formData.category} onChange={handleChange} required>
                                    <option value="">Select a category</option>
                                    {categories.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
                                </StyledSelect>
                            </div>
                            <div>
                                <FieldLabel>Difficulty Level</FieldLabel>
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

                    {/* Pricing & Media */}
                    <div className="space-y-4">
                        <SectionHeading>Pricing & Media</SectionHeading>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                { name: 'price',     label: 'Price (₹)',      required: true,  type: 'number', placeholder: '999',                             min: '0' },
                                { name: 'thumbnail', label: 'Thumbnail URL',  required: false, type: 'text',   placeholder: 'https://example.com/image.jpg' },
                                { name: 'duration',  label: 'Duration (mins)', required: false, type: 'number', placeholder: '120' },
                                { name: 'language',  label: 'Language',       required: false, type: 'text',   placeholder: 'English' },
                            ].map(field => (
                                <div key={field.name}>
                                    <FieldLabel required={field.required}>{field.label}</FieldLabel>
                                    <input name={field.name} type={field.type} placeholder={field.placeholder}
                                        min={field.min} required={field.required}
                                        value={formData[field.name]} onChange={handleChange}
                                        style={inputSt}
                                        onFocus={e => Object.assign(e.target.style, cx.inputFocus)}
                                        onBlur={e => { e.target.style.borderColor = C.cardBorder; e.target.style.boxShadow = 'none'; }}
                                    />
                                    {field.name === 'thumbnail' && (
                                        <p style={{ fontFamily: T.fontFamily, fontSize: '11px', color: C.textMuted, marginTop: 4 }}>
                                            Paste an image URL for now.
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* What students will learn */}
                    <div className="space-y-3">
                        <SectionHeading>What Students Will Learn</SectionHeading>
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>
                            Add key learning outcomes shown on the course landing page.
                        </p>
                        {formData.whatYouWillLearn.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                                <input value={item} placeholder={`Learning outcome ${idx + 1}`}
                                    onChange={e => learn.onChange(idx, e.target.value)}
                                    style={{ ...inputSt, height: 36, fontSize: T.size.sm }}
                                    onFocus={e => Object.assign(e.target.style, cx.inputFocus)}
                                    onBlur={e => { e.target.style.borderColor = C.cardBorder; e.target.style.boxShadow = 'none'; }}
                                />
                                {formData.whatYouWillLearn.length > 1 && (
                                    <button type="button" onClick={() => learn.remove(idx)}
                                        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all hover:opacity-80"
                                        style={{ backgroundColor: C.dangerBg, color: C.danger }}>
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                        <button type="button" onClick={learn.add}
                            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm border-2 border-dashed transition-all hover:opacity-80 w-full"
                            style={{ borderColor: FX.primary40, color: C.btnPrimary, backgroundColor: FX.primary10, fontFamily: T.fontFamily, fontWeight: T.weight.bold }}>
                            <Plus className="w-4 h-4" /> Add Learning Outcome
                        </button>
                    </div>

                    {/* Requirements */}
                    <div className="space-y-3">
                        <SectionHeading>Prerequisites & Requirements</SectionHeading>
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>
                            What should students know before enrolling?
                        </p>
                        {formData.requirements.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                                <input value={item} placeholder={`Requirement ${idx + 1}`}
                                    onChange={e => req.onChange(idx, e.target.value)}
                                    style={{ ...inputSt, height: 36, fontSize: T.size.sm }}
                                    onFocus={e => Object.assign(e.target.style, cx.inputFocus)}
                                    onBlur={e => { e.target.style.borderColor = C.cardBorder; e.target.style.boxShadow = 'none'; }}
                                />
                                {formData.requirements.length > 1 && (
                                    <button type="button" onClick={() => req.remove(idx)}
                                        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all hover:opacity-80"
                                        style={{ backgroundColor: C.dangerBg, color: C.danger }}>
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                        <button type="button" onClick={req.add}
                            className="flex items-center gap-1.5 justify-center px-3 py-2 rounded-xl text-sm border-2 border-dashed transition-all hover:opacity-80 w-full"
                            style={{ borderColor: FX.primary40, color: C.btnPrimary, backgroundColor: FX.primary10, fontFamily: T.fontFamily, fontWeight: T.weight.bold }}>
                            <Plus className="w-4 h-4" /> Add Requirement
                        </button>
                    </div>

                    {/* Submit */}
                    <div className="pt-2 flex justify-end gap-3" style={{ borderTop: `1px solid ${C.cardBorder}` }}>
                        <Link href="/tutor/courses">
                            <button type="button"
                                className="px-5 py-2.5 rounded-xl text-sm transition-all hover:opacity-80"
                                style={cx.btnSecondary()}>
                                Cancel
                            </button>
                        </Link>
                        <button type="submit" disabled={loading}
                            className="min-w-[140px] px-5 py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-50 hover:opacity-90 transition-all"
                            style={{ backgroundColor: C.btnPrimary, color: C.surfaceWhite, fontFamily: T.fontFamily, fontWeight: T.weight.bold, boxShadow: S.btn }}>
                            {loading
                                ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</>
                                : <><Save className="w-4 h-4" /> Create Course</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
