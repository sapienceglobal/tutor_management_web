'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    Search, Star, Award, MapPin, ArrowRight,
    CheckCircle, BookOpen, Filter, Sparkles, Users, X
} from 'lucide-react';
import useInstitute from '@/hooks/useInstitute';
import api from '@/lib/axios';

const RATE_OPTIONS = [
    { label: 'Any rate',       value: '' },
    { label: 'Under ₹500/hr',  value: '500' },
    { label: 'Under ₹1000/hr', value: '1000' },
    { label: 'Under ₹2000/hr', value: '2000' },
];

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ src, name, size = 'lg' }) {
    const dim = size === 'lg' ? 'w-14 h-14' : 'w-10 h-10';
    const text = size === 'lg' ? 'text-xl' : 'text-base';
    return (
        <div className={`${dim} rounded-2xl overflow-hidden border-2 border-white shadow-sm shrink-0 bg-gradient-to-br from-[var(--theme-primary)] to-[var(--theme-accent)]`}>
            {src ? (
                <img src={src} alt={name} className="w-full h-full object-cover" />
            ) : (
                <div className={`w-full h-full flex items-center justify-center ${text} font-black text-[var(--theme-primary)]`}>
                    {name?.[0]?.toUpperCase() || 'T'}
                </div>
            )}
        </div>
    );
}

// ─── Tab Button ───────────────────────────────────────────────────────────────
function TabBtn({ active, onClick, children }) {
    return (
        <button onClick={onClick}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all
                ${active
                    ? 'text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'}`}
            style={active ? { background: 'linear-gradient(135deg, var(--theme-sidebar), var(--theme-primary))' } : {}}>
            {children}
        </button>
    );
}

// ─── Tutor Card ───────────────────────────────────────────────────────────────
function TutorCard({ tutor }) {
    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md hover:border-[var(--theme-primary)]/30 hover:-translate-y-0.5 transition-all flex flex-col group">
            <div className="p-5 flex-1 flex flex-col">
                {/* Top row: avatar + info */}
                <div className="flex items-start gap-3.5 mb-4">
                    <Avatar src={tutor.userId?.profileImage} name={tutor.userId?.name} />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <h3 className="font-black text-slate-800 truncate text-sm">
                                {tutor.userId?.name || 'Tutor'}
                            </h3>
                            {tutor.isVerified && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-200">
                                    <CheckCircle className="w-3 h-3" /> Verified
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-semibold text-[var(--theme-primary)]">
                                {tutor.categoryId?.name || 'Expert'}
                            </span>
                            {tutor.instituteId && (
                                <span className="px-2 py-0.5 bg-[var(--theme-accent)]/20 text-[var(--theme-accent)] text-[10px] font-bold uppercase tracking-wider rounded-full border border-[var(--theme-accent)]/30">
                                    {tutor.instituteId.name || 'Institute'}
                                </span>
                            )}
                        </div>

                        {/* Rating */}
                        <div className="flex items-center gap-1.5 mt-1.5">
                            {[1,2,3,4,5].map(s => (
                                <Star key={s} className={`w-3 h-3 ${s <= Math.round(tutor.rating || 0) ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`} />
                            ))}
                            <span className="text-xs font-bold text-slate-700 ml-0.5">
                                {tutor.rating?.toFixed(1) || 'New'}
                            </span>
                            <span className="text-xs text-slate-400">({tutor.reviewCount || 0})</span>
                        </div>
                    </div>
                </div>

                {/* Bio */}
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mb-3.5 font-medium">
                    {tutor.bio || 'Expert tutor ready to help you achieve your learning goals.'}
                </p>

                {/* Meta pills */}
                <div className="flex flex-wrap gap-2 mb-4">
                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-[var(--theme-primary)]/20 text-[var(--theme-primary)] text-[11px] font-semibold rounded-xl">
                        <Award className="w-3 h-3" /> {tutor.experience || 0} yrs exp
                    </span>
                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 text-slate-600 text-[11px] font-semibold rounded-xl">
                        <Users className="w-3 h-3" /> {tutor.studentsCount || 0} students
                    </span>
                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 text-slate-600 text-[11px] font-semibold rounded-xl">
                        <MapPin className="w-3 h-3" /> {tutor.location || 'Online'}
                    </span>
                </div>

                {/* Footer: rate + CTA */}
                <div className="mt-auto pt-3.5 border-t border-slate-100 flex items-center justify-between gap-3">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.07em]">Hourly Rate</p>
                        <p className="text-lg font-black text-slate-800">₹{tutor.hourlyRate ?? 0}</p>
                    </div>
                    <Link href={`/student/tutors/${tutor._id}`}>
                        <button className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white rounded-xl transition-all group-hover:shadow-md"
                            style={{ background: 'linear-gradient(135deg, var(--theme-sidebar), var(--theme-primary))' }}>
                            Book Session <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function FindTutorsPage() {
    const [tutors, setTutors]               = useState([]);
    const [categories, setCategories]       = useState([]);
    const [loading, setLoading]             = useState(true);
    const [searchTerm, setSearchTerm]       = useState('');
    const [categoryId, setCategoryId]       = useState('');
    const [maxRate, setMaxRate]             = useState('');
    const [showFilters, setShowFilters]     = useState(false);
    const [myInstitutes, setMyInstitutes]   = useState([]);
    const [currentInstitute, setCurrentInstitute] = useState(null);
    const [activeTab, setActiveTab]         = useState('institute');

    useEffect(() => { fetchMembership(); fetchCategories(); }, []);

    const fetchMembership = async () => {
        try {
            const res = await api.get('/membership/my-institutes');
            if (res.data?.success) {
                setMyInstitutes(res.data.institutes || []);
                setCurrentInstitute(res.data.currentInstitute);
                if (!res.data.currentInstitute) setActiveTab('global');
            }
        } catch {
            setActiveTab('global');
        }
    };

    useEffect(() => { fetchTutors(); }, [categoryId, maxRate, activeTab]);

    const fetchCategories = async () => {
        try {
            const res = await api.get('/categories');
            if (res.data.success) setCategories(res.data.categories || []);
        } catch {}
    };

    const fetchTutors = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (searchTerm) params.set('search', searchTerm);
            if (categoryId) params.set('categoryId', categoryId);
            if (maxRate) params.set('maxRate', maxRate);
            if (activeTab) params.set('scope', activeTab);
            const res = await api.get(`/tutors?${params.toString()}`);
            if (res.data.success) setTutors(res.data.tutors || []);
        } catch { setTutors([]); }
        finally { setLoading(false); }
    };

    const handleSearch = (e) => { e.preventDefault(); fetchTutors(); };
    const clearFilters = () => { setCategoryId(''); setMaxRate(''); };
    const activeFilterCount = [categoryId, maxRate].filter(Boolean).length;

    return (
        <div className="space-y-5 pb-10" style={{ fontFamily: "var(--theme-font, 'DM Sans', sans-serif)" }}>

            {/* ── Header ─────────────────────────────────────────────────── */}
            <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-xl font-black text-slate-800">Find a Tutor</h1>
                    <p className="text-xs text-slate-400 mt-0.5 font-medium">Connect with verified tutors for 1-on-1 learning</p>
                </div>

                {/* Institute / Global switcher */}
                {myInstitutes.length > 0 && (
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl">
                        <TabBtn active={activeTab === 'institute'} onClick={() => setActiveTab('institute')}>
                            My Institute
                        </TabBtn>
                        <TabBtn active={activeTab === 'global'} onClick={() => setActiveTab('global')}>
                            Global
                        </TabBtn>
                    </div>
                )}
            </div>

            {/* ── Search + Filters card ────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
                <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2.5">
                    {/* Search input */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by name or subject…"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-[var(--theme-primary)] focus:bg-white text-sm text-slate-800 placeholder:text-slate-400 transition-colors"
                        />
                    </div>

                    <div className="flex gap-2">
                        <button type="submit"
                            className="px-5 py-2.5 text-sm font-bold text-white rounded-xl transition-all"
                            style={{ background: 'linear-gradient(135deg, var(--theme-sidebar), var(--theme-primary))' }}>
                            Search
                        </button>
                        <button type="button" onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold border rounded-xl transition-all
                                ${showFilters || activeFilterCount > 0
                                    ? 'bg-[var(--theme-primary)]/20 text-[var(--theme-primary)] border-[var(--theme-primary)]/30'
                                    : 'text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                            <Filter className="w-4 h-4" />
                            Filters
                            {activeFilterCount > 0 && (
                                <span className="w-5 h-5 bg-[var(--theme-primary)] text-white text-[10px] font-black rounded-full flex items-center justify-center">
                                    {activeFilterCount}
                                </span>
                            )}
                        </button>
                    </div>
                </form>

                {/* Expanded filters */}
                {showFilters && (
                    <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-[0.07em] mb-1.5">Category</label>
                            <select value={categoryId} onChange={e => setCategoryId(e.target.value)}
                                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-white text-sm text-slate-700 focus:ring-2 focus:ring-[var(--theme-primary)] font-medium">
                                <option value="">All categories</option>
                                {categories.map(c => (
                                    <option key={c._id} value={c._id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-[0.07em] mb-1.5">Max Hourly Rate</label>
                            <select value={maxRate} onChange={e => setMaxRate(e.target.value)}
                                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-white text-sm text-slate-700 focus:ring-2 focus:ring-[var(--theme-primary)] font-medium">
                                {RATE_OPTIONS.map(o => (
                                    <option key={o.value || 'any'} value={o.value}>{o.label}</option>
                                ))}
                            </select>
                        </div>
                        {activeFilterCount > 0 && (
                            <div className="flex items-end">
                                <button onClick={clearFilters}
                                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-red-600 border border-red-200 bg-red-50 rounded-xl hover:bg-red-100 transition-colors">
                                    <X className="w-4 h-4" /> Clear filters
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ── Results count ────────────────────────────────────────── */}
            {!loading && tutors.length > 0 && (
                <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-500 font-semibold">
                        <span className="text-slate-800 font-black">{tutors.length}</span> tutor{tutors.length !== 1 ? 's' : ''} found
                    </p>
                    <p className="text-xs text-slate-400 font-medium capitalize">
                        {activeTab === 'institute' ? '📍 My Institute' : '🌐 Global'}
                    </p>
                </div>
            )}

            {/* ── Results ──────────────────────────────────────────────── */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <div className="relative w-11 h-11">
                        <div className="w-11 h-11 rounded-full border-[3px] border-[var(--theme-primary)]/30 border-t-[var(--theme-primary)] animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-[var(--theme-primary)] animate-pulse" />
                        </div>
                    </div>
                    <p className="text-sm text-slate-400 font-medium">Finding tutors…</p>
                </div>
            ) : tutors.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tutors.map(tutor => (
                        <TutorCard key={tutor._id} tutor={tutor} />
                    ))}
                </div>
            ) : (
                /* ── Empty state ─────────────────────────────────────── */
                <div className="rounded-2xl overflow-hidden relative"
                    style={{ background: 'linear-gradient(135deg, var(--theme-sidebar) 0%, var(--theme-sidebar) 100%)' }}>
                    {/* dot grid */}
                    <div className="absolute inset-0 opacity-[0.06] pointer-events-none"
                        style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
                    <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-[var(--theme-accent)]/20 blur-3xl pointer-events-none" />

                    <div className="relative text-center py-14 px-6">
                        <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                            <Search className="w-7 h-7 text-[var(--theme-primary)]/70" />
                        </div>
                        <h3 className="text-lg font-black text-white mb-2">No tutors found</h3>
                        <p className="text-sm text-[var(--theme-primary)]/70 mb-5 max-w-xs mx-auto">
                            Try adjusting your search or clearing filters.
                        </p>
                        <button
                            onClick={() => { setSearchTerm(''); clearFilters(); fetchTutors(); }}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/15 hover:bg-white/25 text-white text-sm font-bold rounded-xl transition-colors border border-white/20">
                            <X className="w-4 h-4" /> Clear all & retry
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}