'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Loader2, BookOpen } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';
import { format } from 'date-fns';
import { C, T, FX } from '@/constants/tutorTokens';

export default function TopicsPage() {
    const [topics, setTopics]         = useState([]);
    const [loading, setLoading]       = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        (async () => {
            try {
                const res = await api.get('/taxonomy/topics');
                if (res.data.success) setTopics(res.data.topics);
            } catch { /* silent */ }
            finally { setLoading(false); }
        })();
    }, []);

    const filtered = topics.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.courseId?.title?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-5" style={{ fontFamily: T.fontFamily }}>

            {/* Header */}
            <div className="bg-white rounded-xl border border-slate-100 px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: FX.primary12, border: `1px solid ${FX.primary20}` }}>
                        <BookOpen className="w-4 h-4" style={{ color: C.btnPrimary }} />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-slate-800">Topics</h1>
                        <p className="text-xs text-slate-400">Manage subject topics for questions and recommendations</p>
                    </div>
                </div>
                <Link href="/tutor/taxonomy/topics/create">
                    <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-xl shadow-sm transition-opacity"
                        style={{ backgroundColor: C.btnPrimary }}>
                        <Plus className="w-4 h-4" /> Create Topic
                    </button>
                </Link>
            </div>

            {/* Table card */}
            <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
                    <h2 className="text-sm font-bold text-slate-700">All Topics <span className="text-slate-400 font-normal ml-1">({filtered.length})</span></h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input placeholder="Search topics or courses..."
                            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                            className="pl-8 pr-3 h-8 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-[#7573E8] focus:ring-2 focus:ring-[#7573E8]/10 w-56 transition-colors" />
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                        <Loader2 className="w-6 h-6 animate-spin" style={{ color: C.btnPrimary }} />
                        <p className="text-xs text-slate-400">Loading topics...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-14">
                        <div className="mx-auto w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
                            style={{ backgroundColor: FX.primary08 }}>
                            <BookOpen className="w-6 h-6" style={{ color: C.btnPrimary }} />
                        </div>
                        <p className="text-sm font-semibold text-slate-600">No topics found.</p>
                        <p className="text-xs text-slate-400 mt-1">Create topics to categorize your questions.</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-[2fr_1.5fr_130px] gap-4 px-5 py-3 border-b border-slate-50 bg-slate-50/60">
                            {['Topic Name', 'Linked Course', 'Created'].map(h => (
                                <span key={h} className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{h}</span>
                            ))}
                        </div>
                        <div className="divide-y divide-slate-50">
                            {filtered.map(topic => (
                                <div key={topic._id}
                                    className="grid grid-cols-[2fr_1.5fr_130px] gap-4 px-5 py-3.5 items-center hover:bg-slate-50/40 transition-colors">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-800">{topic.name}</p>
                                        {topic.description && (
                                            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{topic.description}</p>
                                        )}
                                    </div>
                                    <div>
                                        {topic.courseId ? (
                                            <span className="inline-flex text-[11px] font-semibold px-2.5 py-1 rounded-full border"
                                                style={{
                                                    backgroundColor: FX.primary08,
                                                    color: C.btnPrimary,
                                                    borderColor: FX.primary20
                                                }}>
                                                {topic.courseId.title}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-slate-400 italic">None</span>
                                        )}
                                    </div>
                                    <span className="text-xs text-slate-400">{format(new Date(topic.createdAt), 'MMM d, yyyy')}</span>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}