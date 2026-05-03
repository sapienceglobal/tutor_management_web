'use client';

import { useState, useEffect } from 'react';
import { MdAdd, MdSearch, MdHourglassEmpty, MdPsychology } from 'react-icons/md';
import Link from 'next/link';
import api from '@/lib/axios';
import { format } from 'date-fns';
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
    backgroundColor: C.cardBg,
    border: `1px solid ${C.cardBorder}`,
    borderRadius: '10px',
    color: C.heading,
    fontFamily: T.fontFamily,
    fontSize: T.size.base,
    fontWeight: T.weight.semibold,
    outline: 'none',
    width: '100%',
    padding: '10px 16px',
    transition: 'all 0.2s ease',
};

export default function SkillsPage() {
    const [skills, setSkills]         = useState([]);
    const [loading, setLoading]       = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        (async () => {
            try {
                const res = await api.get('/taxonomy/skills');
                if (res?.data?.success) setSkills(res.data.skills);
            } catch { /* silent */ }
            finally { setLoading(false); }
        })();
    }, []);

    const filtered = skills.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-3 w-full" style={{ backgroundColor: C.pageBg, fontFamily: T.fontFamily }}>
                <MdHourglassEmpty className="animate-spin" style={{ color: C.btnPrimary, width: '28px', height: '28px' }} />
                <p style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.bold }}>Loading skills...</p>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen space-y-6" style={{ backgroundColor: C.pageBg, fontFamily: T.fontFamily, color: C.text }}>

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 flex items-center justify-center shrink-0" style={{ backgroundColor: C.iconBg, borderRadius: '10px' }}>
                        <MdPsychology size={24} color={C.iconColor} />
                    </div>
                    <div>
                        <h1 style={{ color: C.heading, fontSize: T.size.xl, fontWeight: T.weight.black, margin: '0 0 2px 0' }}>Skills</h1>
                        <p style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.medium, margin: 0 }}>Manage competencies and proficiencies for granular tracking.</p>
                    </div>
                </div>
                <Link href="/tutor/taxonomy/skills/create" className="text-decoration-none">
                    <button className="flex items-center justify-center gap-2 h-11 px-6 cursor-pointer border-none transition-opacity hover:opacity-90 shadow-md w-full sm:w-auto"
                        style={{ background: C.gradientBtn, color: '#ffffff', borderRadius: '10px', fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily, boxShadow: S.btn }}>
                        <MdAdd size={18} /> Create Skill
                    </button>
                </Link>
            </div>

            {/* Table card */}
            <div className="overflow-hidden animate-in fade-in duration-500 delay-100" style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 py-4" style={{ backgroundColor: C.innerBg, borderBottom: `1px solid ${C.cardBorder}` }}>
                    <h2 style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>
                        All Skills <span style={{ color: C.btnPrimary, fontWeight: T.weight.bold, fontSize: T.size.sm }}>({filtered.length})</span>
                    </h2>
                    <div className="relative w-full sm:w-72">
                        <MdSearch className="absolute left-3.5 top-1/2 -translate-y-1/2" size={18} style={{ color: C.textMuted }} />
                        <input placeholder="Search skills..."
                            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                            style={{ ...baseInputStyle, paddingLeft: '40px', height: '40px', backgroundColor: C.surfaceWhite }}
                            onFocus={onFocusHandler} onBlur={onBlurHandler} />
                    </div>
                </div>

                {filtered.length === 0 ? (
                    <div className="text-center py-20 flex flex-col items-center">
                        <div className="w-14 h-14 flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: C.innerBg, borderRadius: '10px' }}>
                            <MdPsychology size={28} color={C.textMuted} style={{ opacity: 0.5 }} />
                        </div>
                        <p style={{ fontSize: T.size.md, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 4px 0' }}>No skills found.</p>
                        <p style={{ fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.textMuted, margin: 0 }}>Create skills to track specific student competencies.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto custom-scrollbar">
                        <div className="min-w-[600px]">
                            <div className="grid grid-cols-[2fr_1fr] gap-4 px-6 py-3" style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                                {['Skill Name', 'Created'].map((h, i) => (
                                    <span key={i} className={i === 1 ? 'text-right' : ''} style={{ fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', letterSpacing: T.tracking.wider }}>{h}</span>
                                ))}
                            </div>
                            <div className="flex flex-col gap-2 p-4">
                                {filtered.map(skill => (
                                    <div key={skill._id} className="grid grid-cols-[2fr_1fr] gap-4 px-4 py-3 items-center transition-colors"
                                        style={{ backgroundColor: C.innerBg, borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}
                                        onMouseEnter={e => e.currentTarget.style.backgroundColor = C.btnViewAllBg}
                                        onMouseLeave={e => e.currentTarget.style.backgroundColor = C.innerBg}>
                                        <div className="min-w-0">
                                            <p className="truncate" style={{ fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 4px 0' }}>{skill.name}</p>
                                            {skill.description && (
                                                <p className="truncate" style={{ fontSize: T.size.xs, fontWeight: T.weight.medium, color: C.textMuted, margin: 0 }}>{skill.description}</p>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <span style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted }}>
                                                {format(new Date(skill.createdAt), 'MMM d, yyyy')}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}