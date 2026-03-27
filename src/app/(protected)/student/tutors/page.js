'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Search, Star, Award, MapPin, ArrowRight,
    CheckCircle, BookOpen, Filter, Sparkles, Users, X
} from 'lucide-react';
import api from '@/lib/axios';
import { C, T, S, R, cx, pageStyle } from '@/constants/studentTokens';

const RATE_OPTIONS = [
    { label: 'Any rate',       value: '' },
    { label: 'Under ₹500/hr',  value: '500' },
    { label: 'Under ₹1000/hr', value: '1000' },
    { label: 'Under ₹2000/hr', value: '2000' },
];

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ src, name, size = 'lg' }) {
    const dim = size === 'lg' ? 56 : 40;
    return (
        <div style={{
            width: dim, height: dim,
            borderRadius: R.xl,
            overflow: 'hidden',
            border: '2px solid white',
            boxShadow: S.card,
            flexShrink: 0,
            backgroundColor: C.iconBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
            {src ? (
                <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
                <span style={{
                    fontFamily: T.fontFamily,
                    fontSize: size === 'lg' ? T.size.xl : T.size.md,
                    fontWeight: T.weight.black,
                    color: C.iconColor,
                }}>
                    {name?.[0]?.toUpperCase() || 'T'}
                </span>
            )}
        </div>
    );
}

// ─── Tab Button ───────────────────────────────────────────────────────────────
function TabBtn({ active, onClick, children }) {
    return (
        <button onClick={onClick}
            className="px-4 py-2 rounded-xl text-sm transition-all"
            style={active
                ? { background: C.gradientBtn, color: '#ffffff', fontFamily: T.fontFamily, fontWeight: T.weight.bold }
                : { color: C.text, opacity: 0.7, fontFamily: T.fontFamily, fontWeight: T.weight.semibold }}>
            {children}
        </button>
    );
}

// ─── Tutor Card ───────────────────────────────────────────────────────────────
function TutorCard({ tutor }) {
    return (
        <div className="flex flex-col group hover:-translate-y-0.5 transition-all duration-300"
            style={{ ...cx.card(), overflow: 'hidden' }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = S.cardHover; e.currentTarget.style.borderColor = `${C.btnPrimary}40`; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = S.card; e.currentTarget.style.borderColor = C.cardBorder; }}>

            <div className="p-5 flex-1 flex flex-col">
                {/* Avatar + info */}
                <div className="flex items-start gap-3.5 mb-4">
                    <Avatar src={tutor.userId?.profileImage} name={tutor.userId?.name} />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading }}>
                                {tutor.userId?.name || 'Tutor'}
                            </h3>
                            {tutor.isVerified && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                                    style={{ backgroundColor: C.successBg, color: C.success, border: `1px solid ${C.successBorder}`, fontFamily: T.fontFamily }}>
                                    <CheckCircle className="w-3 h-3" /> Verified
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: C.btnPrimary }}>
                                {tutor.categoryId?.name || 'Expert'}
                            </span>
                            {tutor.instituteId && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase"
                                    style={{ backgroundColor: `${C.chartLine}25`, color: C.chartLine, letterSpacing: T.tracking.wide, fontFamily: T.fontFamily }}>
                                    {tutor.instituteId.name || 'Institute'}
                                </span>
                            )}
                        </div>
                        {/* Rating */}
                        <div className="flex items-center gap-1.5 mt-1.5">
                            {[1,2,3,4,5].map(s => (
                                <Star key={s} className={`w-3 h-3 ${s <= Math.round(tutor.rating || 0) ? 'fill-current' : ''}`}
                                    style={{ color: s <= Math.round(tutor.rating || 0) ? '#f59e0b' : C.cardBorder }} />
                            ))}
                            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.heading, marginLeft: 2 }}>
                                {tutor.rating?.toFixed(1) || 'New'}
                            </span>
                            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>
                                ({tutor.reviewCount || 0})
                            </span>
                        </div>
                    </div>
                </div>

                {/* Bio */}
                <p className="line-clamp-2 mb-3.5"
                    style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.text, lineHeight: T.leading.relaxed, fontWeight: T.weight.medium }}>
                    {tutor.bio || 'Expert tutor ready to help you achieve your learning goals.'}
                </p>

                {/* Meta pills */}
                <div className="flex flex-wrap gap-2 mb-4">
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold"
                        style={{ backgroundColor: `${C.btnPrimary}18`, color: C.btnPrimary, fontFamily: T.fontFamily }}>
                        <Award className="w-3 h-3" /> {tutor.experience || 0} yrs exp
                    </span>
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold"
                        style={{ backgroundColor: C.innerBg, color: C.text, fontFamily: T.fontFamily }}>
                        <Users className="w-3 h-3" /> {tutor.studentsCount || 0} students
                    </span>
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold"
                        style={{ backgroundColor: C.innerBg, color: C.text, fontFamily: T.fontFamily }}>
                        <MapPin className="w-3 h-3" /> {tutor.location || 'Online'}
                    </span>
                </div>

                {/* Footer: rate + CTA */}
                <div className="mt-auto pt-3.5 flex items-center justify-between gap-3"
                    style={{ borderTop: `1px solid ${C.cardBorder}` }}>
                    <div>
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider }}>
                            Hourly Rate
                        </p>
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xl, fontWeight: T.weight.black, color: C.heading }}>
                            ₹{tutor.hourlyRate ?? 0}
                        </p>
                    </div>
                    <Link href={`/student/tutors/${tutor._id}`}>
                        <button className="flex items-center gap-1.5 px-4 py-2 text-white rounded-xl text-xs transition-all hover:opacity-90 group-hover:shadow-md"
                            style={{ background: C.gradientBtn, fontFamily: T.fontFamily, fontWeight: T.weight.bold }}>
                            Book Session <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function FindTutorsPage() {
    const [tutors, setTutors]             = useState([]);
    const [categories, setCategories]     = useState([]);
    const [loading, setLoading]           = useState(true);
    const [searchTerm, setSearchTerm]     = useState('');
    const [categoryId, setCategoryId]     = useState('');
    const [maxRate, setMaxRate]           = useState('');
    const [showFilters, setShowFilters]   = useState(false);
    const [myInstitutes, setMyInstitutes] = useState([]);
    const [activeTab, setActiveTab]       = useState('institute');

    useEffect(() => { fetchMembership(); fetchCategories(); }, []);

    const fetchMembership = async () => {
        try {
            const res = await api.get('/membership/my-institutes');
            if (res.data?.success) {
                setMyInstitutes(res.data.institutes || []);
                if (!res.data.currentInstitute) setActiveTab('global');
            }
        } catch { setActiveTab('global'); }
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
            if (maxRate)    params.set('maxRate', maxRate);
            if (activeTab)  params.set('scope', activeTab);
            const res = await api.get(`/tutors?${params.toString()}`);
            if (res.data.success) setTutors(res.data.tutors || []);
        } catch { setTutors([]); }
        finally { setLoading(false); }
    };

    const handleSearch = (e) => { e.preventDefault(); fetchTutors(); };
    const clearFilters = () => { setCategoryId(''); setMaxRate(''); };
    const activeFilterCount = [categoryId, maxRate].filter(Boolean).length;

    const selectStyle = {
        ...cx.input(),
        width: '100%',
        padding: '10px 14px',
        cursor: 'pointer',
        appearance: 'none',
    };

    return (
        <div className="space-y-5 pb-10" style={pageStyle}>

            {/* ── Header ───────────────────────────────────────────────── */}
            <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                    <h1 style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.black, color: C.heading }}>
                        Find a Tutor
                    </h1>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.text, opacity: 0.55, marginTop: 2 }}>
                        Connect with verified tutors for 1-on-1 learning
                    </p>
                </div>

                {myInstitutes.length > 0 && (
                    <div className="flex items-center gap-1 p-1 rounded-2xl"
                        style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}` }}>
                        <TabBtn active={activeTab === 'institute'} onClick={() => setActiveTab('institute')}>
                            My Institute
                        </TabBtn>
                        <TabBtn active={activeTab === 'global'} onClick={() => setActiveTab('global')}>
                            Global
                        </TabBtn>
                    </div>
                )}
            </div>

            {/* ── Search + Filter card ──────────────────────────────────── */}
            <div className="p-4 space-y-3"
                style={{ ...cx.card(), borderRadius: R['2xl'] }}>
                <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2.5">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: C.textMuted }} />
                        <input type="text" placeholder="Search by name or subject…"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            style={{ ...cx.input(), width: '100%', padding: '10px 14px 10px 38px' }}
                            onFocus={e => { Object.assign(e.target.style, cx.inputFocus); }}
                            onBlur={e => { e.target.style.borderColor = C.cardBorder; e.target.style.boxShadow = 'none'; }}
                        />
                    </div>

                    <div className="flex gap-2">
                        <button type="submit"
                            className="px-5 py-2.5 text-sm text-white rounded-xl transition-all hover:opacity-90"
                            style={{ background: C.gradientBtn, fontFamily: T.fontFamily, fontWeight: T.weight.bold }}>
                            Search
                        </button>
                        <button type="button" onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm rounded-xl border transition-all"
                            style={showFilters || activeFilterCount > 0
                                ? { backgroundColor: `${C.btnPrimary}18`, color: C.btnPrimary, borderColor: `${C.btnPrimary}40`, fontFamily: T.fontFamily, fontWeight: T.weight.bold }
                                : { ...cx.btnSecondary(), fontFamily: T.fontFamily }}>
                            <Filter className="w-4 h-4" />
                            Filters
                            {activeFilterCount > 0 && (
                                <span className="w-5 h-5 text-white text-[10px] font-black rounded-full flex items-center justify-center"
                                    style={{ backgroundColor: C.btnPrimary, fontFamily: T.fontFamily }}>
                                    {activeFilterCount}
                                </span>
                            )}
                        </button>
                    </div>
                </form>

                {/* Expanded filters */}
                {showFilters && (
                    <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
                        style={{ borderTop: `1px solid ${C.cardBorder}` }}>
                        <div>
                            <label style={{ display: 'block', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, marginBottom: 6 }}>
                                Category
                            </label>
                            <select value={categoryId} onChange={e => setCategoryId(e.target.value)}
                                style={selectStyle}>
                                <option value="">All categories</option>
                                {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: T.tracking.wider, marginBottom: 6 }}>
                                Max Hourly Rate
                            </label>
                            <select value={maxRate} onChange={e => setMaxRate(e.target.value)}
                                style={selectStyle}>
                                {RATE_OPTIONS.map(o => <option key={o.value || 'any'} value={o.value}>{o.label}</option>)}
                            </select>
                        </div>
                        {activeFilterCount > 0 && (
                            <div className="flex items-end">
                                <button onClick={clearFilters}
                                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl transition-all hover:opacity-80"
                                    style={{ backgroundColor: C.dangerBg, color: C.danger, border: `1px solid ${C.dangerBorder}`, fontFamily: T.fontFamily }}>
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
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.text, fontWeight: T.weight.semibold }}>
                        <span style={{ color: C.heading, fontWeight: T.weight.black }}>{tutors.length}</span>{' '}
                        tutor{tutors.length !== 1 ? 's' : ''} found
                    </p>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>
                        {activeTab === 'institute' ? '📍 My Institute' : '🌐 Global'}
                    </p>
                </div>
            )}

            {/* ── Results ──────────────────────────────────────────────── */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <div className="relative w-11 h-11">
                        <div className="w-11 h-11 rounded-full border-[3px] animate-spin"
                            style={{ borderColor: `${C.btnPrimary}30`, borderTopColor: C.btnPrimary }} />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Sparkles className="w-4 h-4 animate-pulse" style={{ color: C.btnPrimary }} />
                        </div>
                    </div>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.text, opacity: 0.55 }}>
                        Finding tutors…
                    </p>
                </div>
            ) : tutors.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tutors.map(tutor => <TutorCard key={tutor._id} tutor={tutor} />)}
                </div>
            ) : (
                /* Empty state */
                <div className="rounded-2xl overflow-hidden relative"
                    style={{ backgroundColor: C.darkCard, borderRadius: R['2xl'] }}>
                    <div className="absolute inset-0 opacity-[0.06] pointer-events-none"
                        style={{ backgroundImage: 'radial-gradient(white 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
                    <div className="relative text-center py-14 px-6">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
                            style={{ backgroundColor: 'rgba(255,255,255,0.10)' }}>
                            <Search className="w-7 h-7" style={{ color: 'rgba(255,255,255,0.50)' }} />
                        </div>
                        <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.black, color: '#ffffff', marginBottom: 8 }}>
                            No tutors found
                        </h3>
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: 'rgba(255,255,255,0.55)', marginBottom: 20 }}>
                            Try adjusting your search or clearing filters.
                        </p>
                        <button onClick={() => { setSearchTerm(''); clearFilters(); fetchTutors(); }}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors"
                            style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.20)', fontFamily: T.fontFamily }}>
                            <X className="w-4 h-4" /> Clear all & retry
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}