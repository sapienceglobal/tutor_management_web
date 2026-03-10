// ─── CreateSkillPage.jsx ─────────────────────────────────────────────────────
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Save, BrainCircuit } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';

const inp = "w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[var(--theme-primary)] focus:ring-2 focus:ring-[var(--theme-primary)]/10 transition-colors bg-white";

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
            if (res.data.success) {
                toast.success('Skill created successfully!');
                router.push('/tutor/taxonomy/skills');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create skill');
        } finally { setLoading(false); }
    };

    return (
        <div className="space-y-5 max-w-2xl" style={{ fontFamily: "var(--theme-font, 'DM Sans', sans-serif)" }}>

            {/* Header */}
            <div className="bg-white rounded-xl border border-slate-100 px-5 py-4 flex items-center gap-3">
                <Link href="/tutor/taxonomy/skills">
                    <button className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors">
                        <ArrowLeft className="w-4 h-4 text-slate-500" />
                    </button>
                </Link>
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 12%, white)', border: '1px solid color-mix(in srgb, var(--theme-primary) 20%, white)' }}>
                        <BrainCircuit className="w-4 h-4" style={{ color: 'var(--theme-primary)' }} />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-slate-800">Create New Skill</h1>
                        <p className="text-xs text-slate-400">Add a competency to track student proficiency</p>
                    </div>
                </div>
            </div>

            {/* Form */}
            <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                    <h2 className="text-sm font-bold text-slate-800">Skill Details</h2>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500">
                            Skill Name <span className="text-red-500">*</span>
                        </label>
                        <input className={inp}
                            placeholder="e.g. Critical Thinking, Algebraic Expressions"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })} />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500">
                            Description <span className="text-slate-400 font-normal">(Optional)</span>
                        </label>
                        <textarea rows={4} className={`${inp} resize-none`}
                            placeholder="Briefly describe this skill and what proficiency means..."
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })} />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                        <Link href="/tutor/taxonomy/skills">
                            <button type="button"
                                className="px-4 py-2 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                                Cancel
                            </button>
                        </Link>
                        <button type="submit" disabled={loading}
                            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition-opacity disabled:opacity-60"
                            style={{ backgroundColor: 'var(--theme-primary)' }}>
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {loading ? 'Creating...' : 'Create Skill'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}