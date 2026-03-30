'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Save, BrainCircuit } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { C, T, S, R } from '@/constants/tutorTokens';

// Focus Handlers
const onFocusHandler = e => {
    e.target.style.borderColor = C.btnPrimary;
    e.target.style.boxShadow = '0 0 0 3px rgba(117,115,232,0.10)';
};
const onBlurHandler = e => {
    e.target.style.borderColor = 'transparent';
    e.target.style.boxShadow = 'none';
};

const baseInputStyle = {
    backgroundColor: C.surfaceWhite,
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

export default function CreateSkillPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ name: '', description: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name) { toast.error('Skill Name is required'); return; }
        setLoading(true);
        try {
            const res = await api.post('/taxonomy/skills', formData);
            if (res?.data?.success) {
                toast.success('Skill created successfully!');
                router.push('/tutor/taxonomy/skills');
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to create skill');
        } finally { setLoading(false); }
    };

    return (
        <div className="w-full min-h-screen p-6 flex flex-col items-center" style={{ backgroundColor: '#dfdaf3', fontFamily: T.fontFamily, color: C.text }}>
            
            <div className="w-full max-w-2xl space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                    <div className="flex items-center gap-4">
                        <Link href="/tutor/taxonomy/skills" className="text-decoration-none">
                            <button className="w-10 h-10 flex items-center justify-center cursor-pointer border-none transition-opacity hover:opacity-80 shrink-0"
                                style={{ backgroundColor: '#E3DFF8', borderRadius: R.full }}>
                                <ArrowLeft size={18} color={C.heading} />
                            </button>
                        </Link>
                        <div>
                            <h1 className="flex items-center gap-2" style={{ color: C.heading, fontSize: T.size.xl, fontWeight: T.weight.black, margin: '0 0 4px 0' }}>
                                <BrainCircuit size={20} color={C.btnPrimary} /> Create New Skill
                            </h1>
                            <p style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.bold, margin: 0 }}>
                                Add a competency to track student proficiency
                            </p>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <div className="overflow-hidden" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                    <div className="px-6 py-4 border-b" style={{ borderColor: C.cardBorder, backgroundColor: '#E3DFF8' }}>
                        <h2 style={{ fontSize: T.size.sm, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>Skill Details</h2>
                    </div>
                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        <div className="space-y-2">
                            <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase' }}>
                                Skill Name *
                            </label>
                            <input 
                                placeholder="e.g. Critical Thinking, Algebraic Expressions"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                style={baseInputStyle} onFocus={onFocusHandler} onBlur={onBlurHandler}
                                autoFocus
                            />
                        </div>

                        <div className="space-y-2">
                            <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase' }}>
                                Description <span style={{ fontWeight: T.weight.medium, color: C.textMuted, textTransform: 'none' }}>(Optional)</span>
                            </label>
                            <textarea rows={4}
                                placeholder="Briefly describe this skill and what proficiency means..."
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                style={{ ...baseInputStyle, resize: 'none' }} onFocus={onFocusHandler} onBlur={onBlurHandler}
                            />
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-6 mt-2" style={{ borderTop: `1px solid ${C.cardBorder}` }}>
                            <Link href="/tutor/taxonomy/skills" className="text-decoration-none">
                                <button type="button" className="px-6 py-2.5 cursor-pointer bg-transparent border-none transition-opacity hover:opacity-70"
                                    style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                                    Cancel
                                </button>
                            </Link>
                            <button type="submit" disabled={loading}
                                className="flex items-center justify-center gap-2 h-11 px-8 cursor-pointer border-none transition-opacity hover:opacity-90 disabled:opacity-50 shadow-md"
                                style={{ background: C.gradientBtn, color: '#ffffff', borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                                {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                {loading ? 'Creating...' : 'Create Skill'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}