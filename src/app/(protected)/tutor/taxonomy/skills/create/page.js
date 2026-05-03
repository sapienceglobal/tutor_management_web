'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MdArrowBack, MdHourglassEmpty, MdSave, MdPsychology } from 'react-icons/md';
import Link from 'next/link';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { C, T, S, R } from '@/constants/studentTokens';

// Focus Handlers
const onFocusHandler = e => {
    e.target.style.border = `1px solid ${C.btnPrimary}`;
    e.target.style.boxShadow = `0 0 0 3px ${C.btnPrimary}30`;
};
const onBlurHandler = e => {
    e.target.style.border = `1px solid ${C.cardBorder}`;
    e.target.style.boxShadow = 'none';
};

const baseInputStyle = {
    backgroundColor: C.innerBg,
    border: `1px solid ${C.cardBorder}`,
    borderRadius: '10px',
    color: C.heading,
    fontFamily: T.fontFamily,
    fontSize: T.size.base,
    fontWeight: T.weight.semibold,
    outline: 'none',
    width: '100%',
    padding: '12px 16px',
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
        <div className="w-full min-h-screen flex flex-col items-center" style={{ backgroundColor: C.pageBg, fontFamily: T.fontFamily, color: C.text }}>
            
            <div className="w-full max-w-2xl space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                    <div className="flex items-center gap-4">
                        <Link href="/tutor/taxonomy/skills" className="text-decoration-none">
                            <button className="w-10 h-10 flex items-center justify-center cursor-pointer border-none transition-colors shrink-0"
                                style={{ backgroundColor: C.innerBg, borderRadius: '10px' }}
                                onMouseEnter={e => e.currentTarget.style.backgroundColor = C.btnViewAllBg}
                                onMouseLeave={e => e.currentTarget.style.backgroundColor = C.innerBg}>
                                <MdArrowBack size={20} color={C.heading} />
                            </button>
                        </Link>
                        <div>
                            <h1 className="flex items-center gap-2" style={{ color: C.heading, fontSize: T.size.xl, fontWeight: T.weight.black, margin: '0 0 2px 0' }}>
                                <MdPsychology size={24} color={C.btnPrimary} /> Create New Skill
                            </h1>
                            <p style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.medium, margin: 0 }}>
                                Add a competency to track student proficiency
                            </p>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <div className="overflow-hidden animate-in fade-in duration-500 delay-100" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                    <div className="px-6 py-4 border-b" style={{ borderColor: C.cardBorder, backgroundColor: C.innerBg }}>
                        <h2 style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>Skill Details</h2>
                    </div>
                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        
                        <div className="space-y-2">
                            <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', letterSpacing: T.tracking.wider }}>
                                Skill Name *
                            </label>
                            <input 
                                placeholder="e.g. Critical Thinking, Algebraic Expressions"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                style={{...baseInputStyle, backgroundColor: C.surfaceWhite}} 
                                onFocus={onFocusHandler} onBlur={onBlurHandler}
                                autoFocus
                            />
                        </div>

                        <div className="space-y-2">
                            <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', letterSpacing: T.tracking.wider }}>
                                Description <span style={{ fontWeight: T.weight.semibold, color: C.textMuted, textTransform: 'none', letterSpacing: 'normal' }}>(Optional)</span>
                            </label>
                            <textarea rows={4}
                                placeholder="Briefly describe this skill and what proficiency means..."
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                style={{ ...baseInputStyle, backgroundColor: C.surfaceWhite, resize: 'none' }} 
                                onFocus={onFocusHandler} onBlur={onBlurHandler}
                            />
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-6 mt-4" style={{ borderTop: `1px solid ${C.cardBorder}` }}>
                            <Link href="/tutor/taxonomy/skills" className="text-decoration-none">
                                <button type="button" className="px-6 py-2.5 cursor-pointer bg-transparent border-none transition-opacity hover:opacity-70"
                                    style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                                    Cancel
                                </button>
                            </Link>
                            <button type="submit" disabled={loading}
                                className="flex items-center justify-center gap-2 h-11 px-8 cursor-pointer border-none transition-opacity hover:opacity-90 disabled:opacity-50 shadow-md"
                                style={{ background: C.gradientBtn, color: '#ffffff', borderRadius: '10px', fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily, boxShadow: S.btn }}>
                                {loading ? <MdHourglassEmpty size={18} className="animate-spin" /> : <MdSave size={18} />}
                                {loading ? 'Creating...' : 'Create Skill'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}