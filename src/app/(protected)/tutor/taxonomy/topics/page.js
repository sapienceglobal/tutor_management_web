'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Loader2, BookOpen } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';
import { format } from 'date-fns';
import { C, T, S, R, FX } from '@/constants/tutorTokens';

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

export default function TopicsPage() {
    const [topics, setTopics]         = useState([]);
    const [loading, setLoading]       = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        (async () => {
            try {
                const res = await api.get('/taxonomy/topics');
                if (res?.data?.success) setTopics(res.data.topics);
            } catch { /* silent */ }
            finally { setLoading(false); }
        })();
    }, []);

    const filtered = topics.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.courseId?.title?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-3 w-full" style={{ backgroundColor: '#dfdaf3', fontFamily: T.fontFamily }}>
                <Loader2 className="animate-spin" style={{ color: C.btnPrimary, width: '28px', height: '28px' }} />
                <p style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.bold }}>Loading topics...</p>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen p-6 space-y-6" style={{ backgroundColor: '#dfdaf3', fontFamily: T.fontFamily, color: C.text }}>

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 flex items-center justify-center shrink-0" style={{ backgroundColor: '#E3DFF8', borderRadius: R.xl }}>
                        <BookOpen size={24} color={C.btnPrimary} />
                    </div>
                    <div>
                        <h1 style={{ color: C.heading, fontSize: T.size.xl, fontWeight: T.weight.black, margin: '0 0 4px 0' }}>Topics</h1>
                        <p style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.medium, margin: 0 }}>Manage subject topics for questions and recommendations.</p>
                    </div>
                </div>
                <Link href="/tutor/taxonomy/topics/create" className="text-decoration-none">
                    <button className="flex items-center justify-center gap-2 h-10 px-5 cursor-pointer border-none transition-opacity hover:opacity-90 shadow-md w-full sm:w-auto"
                        style={{ background: C.gradientBtn, color: '#ffffff', borderRadius: R.xl, fontSize: T.size.sm, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                        <Plus size={16} /> Create Topic
                    </button>
                </Link>
            </div>

            {/* Table card */}
            <div className="overflow-hidden" style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 py-4" style={{ backgroundColor: '#E3DFF8', borderBottom: `1px solid ${C.cardBorder}` }}>
                    <h2 style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>
                        All Topics <span style={{ color: C.btnPrimary, fontWeight: T.weight.bold, fontSize: T.size.sm }}>({filtered.length})</span>
                    </h2>
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: C.textMuted }} />
                        <input placeholder="Search topics or courses..."
                            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                            style={{ ...baseInputStyle, paddingLeft: '36px', height: '40px', backgroundColor: C.surfaceWhite }}
                            onFocus={onFocusHandler} onBlur={onBlurHandler} />
                    </div>
                </div>

                {filtered.length === 0 ? (
                    <div className="text-center py-20 flex flex-col items-center">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: FX.primary10 }}>
                            <BookOpen size={28} color={C.btnPrimary} />
                        </div>
                        <p style={{ fontSize: T.size.md, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 4px 0' }}>No topics found.</p>
                        <p style={{ fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.textMuted, margin: 0 }}>Create topics to categorize your questions.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto custom-scrollbar">
                        <div className="min-w-[800px]">
                            <div className="grid grid-cols-[2fr_1.5fr_1fr] gap-4 px-6 py-3" style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                                {['Topic Name', 'Linked Course', 'Created'].map((h, i) => (
                                    <span key={i} className={i === 2 ? 'text-right' : ''} style={{ fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</span>
                                ))}
                            </div>
                            <div className="flex flex-col gap-2 p-3">
                                {filtered.map(topic => (
                                    <div key={topic._id} className="grid grid-cols-[2fr_1.5fr_1fr] gap-4 px-4 py-3 items-center transition-colors hover:bg-white/40"
                                        style={{ backgroundColor: '#E3DFF8', borderRadius: R.xl }}>
                                        <div className="min-w-0">
                                            <p className="truncate" style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 2px 0' }}>{topic.name}</p>
                                            {topic.description && (
                                                <p className="truncate" style={{ fontSize: T.size.xs, fontWeight: T.weight.medium, color: C.textMuted, margin: 0 }}>{topic.description}</p>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            {topic.courseId ? (
                                                <span className="inline-flex truncate" style={{ fontSize: '10px', fontWeight: T.weight.bold, backgroundColor: C.surfaceWhite, color: C.btnPrimary, border: `1px solid ${C.cardBorder}`, padding: '4px 10px', borderRadius: R.full, maxWidth: '100%' }}>
                                                    {topic.courseId.title}
                                                </span>
                                            ) : (
                                                <span style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, fontStyle: 'italic' }}>None</span>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <span style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted }}>
                                                {format(new Date(topic.createdAt), 'MMM d, yyyy')}
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