'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Search, Star, Award, MapPin, ArrowRight,
    CheckCircle, BookOpen, Filter, Sparkles, Users, X, User
} from 'lucide-react';
import api from '@/lib/axios';
import { C, T, S, R } from '@/constants/studentTokens';

// ─── Theme Colors ─────────────────────────────────────────────────────────────
const themeBg = '#dfdaf3';
const outerCard = '#EAE8FA';
const innerBox = '#E3DFF8';

const RATE_OPTIONS = [
    { label: 'Any rate',       value: '' },
    { label: 'Under ₹500/hr',  value: '500' },
    { label: 'Under ₹1000/hr', value: '1000' },
    { label: 'Under ₹2000/hr', value: '2000' },
];

// Focus Handlers
const onFocusHandler = e => {
    e.target.style.borderColor = C.btnPrimary;
    e.target.style.boxShadow = '0 0 0 3px rgba(117,115,232,0.15)';
};
const onBlurHandler = e => {
    e.target.style.borderColor = C.cardBorder;
    e.target.style.boxShadow = 'none';
};

const baseInputStyle = {
    backgroundColor: C.surfaceWhite,
    border: `1px solid ${C.cardBorder}`,
    borderRadius: R.xl,
    color: C.heading,
    fontFamily: T.fontFamily,
    fontSize: T.size.sm,
    fontWeight: T.weight.bold,
    outline: 'none',
    width: '100%',
    padding: '12px 16px',
    transition: 'all 0.2s ease',
};

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ src, name, size = 'lg' }) {
    const dim = size === 'lg' ? 56 : 40;
    return (
        <div style={{
            width: dim, height: dim,
            borderRadius: R.xl,
            overflow: 'hidden',
            border: `2px solid ${C.surfaceWhite}`,
            boxShadow: S.card,
            flexShrink: 0,
            backgroundColor: innerBox,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
            {src ? (
                <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
                <span style={{
                    fontFamily: T.fontFamily,
                    fontSize: size === 'lg' ? T.size.xl : T.size.md,
                    fontWeight: T.weight.black,
                    color: C.btnPrimary,
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
            className="px-5 py-2.5 rounded-xl transition-all border-none cursor-pointer"
            style={active
                ? { background: C.btnPrimary, color: '#ffffff', fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }
                : { backgroundColor: 'transparent', color: C.textMuted, fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.semibold }}>
            {children}
        </button>
    );
}

// ─── Tutor Card ───────────────────────────────────────────────────────────────
function TutorCard({ tutor }) {
    return (
        <div className="flex flex-col group transition-all duration-300 rounded-3xl border shadow-sm"
            style={{ backgroundColor: outerCard, borderColor: C.cardBorder }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = S.cardHover; e.currentTarget.style.borderColor = C.btnPrimary; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = S.card; e.currentTarget.style.borderColor = C.cardBorder; e.currentTarget.style.transform = 'none'; }}>

            <div className="p-6 flex-1 flex flex-col">
                {/* Avatar + info */}
                <div className="flex items-start gap-4 mb-5">
                    <Avatar src={tutor.userId?.profileImage} name={tutor.userId?.name} />
                    <div className="flex-1 min-w-0 pt-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                            <h3 className="truncate" style={{ fontFamily: T.fontFamily, fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>
                                {tutor.userId?.name || 'Tutor'}
                            </h3>
                            {tutor.isVerified && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider"
                                    style={{ backgroundColor: C.successBg, color: C.success, border: `1px solid ${C.successBorder}`, fontFamily: T.fontFamily }}>
                                    <CheckCircle className="w-3 h-3" /> Verified
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.btnPrimary }}>
                                {tutor.categoryId?.name || 'Expert'}
                            </span>
                            {tutor.instituteId && (
                                <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase"
                                    style={{ backgroundColor: innerBox, color: C.textMuted, border: `1px solid ${C.cardBorder}`, letterSpacing: '0.5px', fontFamily: T.fontFamily }}>
                                    {tutor.instituteId.name || 'Institute'}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Rating & Bio */}
                <div className="mb-4 space-y-3">
                    <div className="flex items-center gap-1.5">
                        <div className="flex items-center">
                            {[1,2,3,4,5].map(s => (
                                <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.round(tutor.rating || 0) ? 'fill-amber-400 text-amber-400' : 'fill-transparent text-slate-300'}`} />
                            ))}
                        </div>
                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.black, color: C.heading, marginLeft: 2 }}>
                            {tutor.rating?.toFixed(1) || 'New'}
                        </span>
                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted }}>
                            ({tutor.reviewCount || 0} reviews)
                        </span>
                    </div>
                    <p className="line-clamp-2" style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.text, lineHeight: 1.5, fontWeight: T.weight.medium, margin: 0 }}>
                        {tutor.bio || 'Expert tutor ready to help you achieve your learning goals with personalized guidance.'}
                    </p>
                </div>

                {/* Meta pills */}
                <div className="flex flex-wrap gap-2 mb-5">
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold"
                        style={{ backgroundColor: innerBox, color: C.heading, border: `1px solid ${C.cardBorder}`, fontFamily: T.fontFamily }}>
                        <Award className="w-3.5 h-3.5" style={{ color: C.btnPrimary }} /> {tutor.experience || 0} yrs exp
                    </span>
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold"
                        style={{ backgroundColor: innerBox, color: C.heading, border: `1px solid ${C.cardBorder}`, fontFamily: T.fontFamily }}>
                        <Users className="w-3.5 h-3.5" style={{ color: C.btnPrimary }} /> {tutor.studentsCount || 0} students
                    </span>
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold"
                        style={{ backgroundColor: innerBox, color: C.heading, border: `1px solid ${C.cardBorder}`, fontFamily: T.fontFamily }}>
                        <MapPin className="w-3.5 h-3.5" style={{ color: C.btnPrimary }} /> Live Online
                    </span>
                </div>

                {/* Footer: rate + CTA */}
                <div className="mt-auto pt-4 flex items-center justify-between gap-3"
                    style={{ borderTop: `1px solid ${C.cardBorder}` }}>
                    <div>
                        <p style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 2px 0' }}>
                            Hourly Rate
                        </p>
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xl, fontWeight: T.weight.black, color: C.heading, margin: 0, lineHeight: 1 }}>
                            ₹{tutor.hourlyRate ?? 0}
                        </p>
                    </div>
                    <Link href={`/student/tutors/${tutor._id}`} className="text-decoration-none">
                        <button className="flex items-center justify-center gap-1.5 px-5 h-10 text-white rounded-xl text-xs transition-all shadow-md cursor-pointer border-none group-hover:scale-105"
                            style={{ background: C.gradientBtn, fontFamily: T.fontFamily, fontWeight: T.weight.bold }}>
                            Book Live Class <ArrowRight className="w-4 h-4" />
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
            if (res.data?.success) setCategories(res.data.categories || []);
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
            if (res.data?.success) setTutors(res.data.tutors || []);
        } catch { setTutors([]); }
        finally { setLoading(false); }
    };

    const handleSearch = (e) => { e.preventDefault(); fetchTutors(); };
    const clearFilters = () => { setCategoryId(''); setMaxRate(''); };
    const activeFilterCount = [categoryId, maxRate].filter(Boolean).length;

    return (
        <div className="w-full min-h-screen p-6 space-y-6" style={{ backgroundColor: themeBg, fontFamily: T.fontFamily, color: C.text }}>

            {/* ── Header & Tabs ───────────────────────────────────────────────── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl" style={{ backgroundColor: outerCard, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 flex items-center justify-center shrink-0 shadow-sm" style={{ backgroundColor: innerBox, borderRadius: R.xl }}>
                        <User size={24} color={C.btnPrimary} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: T.size.xl, fontWeight: T.weight.black, color: C.heading, margin: '0 0 2px 0' }}>Find a Tutor</h1>
                        <p style={{ fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.textMuted, margin: 0 }}>
                            Connect with verified experts for personalized 1-on-1 live online classes.
                        </p>
                    </div>
                </div>

                {myInstitutes.length > 0 && (
                    <div className="flex p-1 rounded-xl shrink-0" style={{ backgroundColor: innerBox, border: `1px solid ${C.cardBorder}` }}>
                        <TabBtn active={activeTab === 'institute'} onClick={() => setActiveTab('institute')}>
                            My Institute
                        </TabBtn>
                        <TabBtn active={activeTab === 'global'} onClick={() => setActiveTab('global')}>
                            Global Tutors
                        </TabBtn>
                    </div>
                )}
            </div>

            {/* ── Search + Filter card ──────────────────────────────────── */}
            <div className="p-5 rounded-3xl shadow-sm" style={{ backgroundColor: outerCard, border: `1px solid ${C.cardBorder}` }}>
                <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: C.textMuted }} />
                        <input type="text" placeholder="Search tutors by name or subject..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            style={{ ...baseInputStyle, paddingLeft: '40px', height: '48px', backgroundColor: C.surfaceWhite }}
                            onFocus={onFocusHandler}
                            onBlur={onBlurHandler}
                        />
                    </div>

                    <div className="flex gap-2 shrink-0">
                        <button type="submit" className="px-6 h-12 text-sm text-white rounded-xl transition-all hover:opacity-90 shadow-md cursor-pointer border-none"
                            style={{ background: C.gradientBtn, fontFamily: T.fontFamily, fontWeight: T.weight.bold }}>
                            Search
                        </button>
                        <button type="button" onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center justify-center gap-2 px-5 h-12 text-sm rounded-xl transition-all cursor-pointer border"
                            style={showFilters || activeFilterCount > 0
                                ? { backgroundColor: innerBox, color: C.btnPrimary, borderColor: C.btnPrimary, fontFamily: T.fontFamily, fontWeight: T.weight.bold }
                                : { backgroundColor: C.surfaceWhite, color: C.heading, borderColor: C.cardBorder, fontFamily: T.fontFamily, fontWeight: T.weight.bold }}>
                            <Filter className="w-4 h-4" />
                            Filters
                            {activeFilterCount > 0 && (
                                <span className="w-5 h-5 text-white text-[10px] font-black rounded-full flex items-center justify-center"
                                    style={{ backgroundColor: C.btnPrimary }}>
                                    {activeFilterCount}
                                </span>
                            )}
                        </button>
                    </div>
                </form>

                {/* Expanded filters */}
                {showFilters && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="pt-5 mt-5 overflow-hidden" style={{ borderTop: `1px solid ${C.cardBorder}` }}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 items-end">
                            <div className="space-y-2">
                                <label style={{ display: 'block', fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>
                                    Category
                                </label>
                                <select value={categoryId} onChange={e => setCategoryId(e.target.value)}
                                    style={{ ...baseInputStyle, cursor: 'pointer', appearance: 'none', height: '44px' }} onFocus={onFocusHandler} onBlur={onBlurHandler}>
                                    <option value="">All categories</option>
                                    {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label style={{ display: 'block', fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>
                                    Max Hourly Rate
                                </label>
                                <select value={maxRate} onChange={e => setMaxRate(e.target.value)}
                                    style={{ ...baseInputStyle, cursor: 'pointer', appearance: 'none', height: '44px' }} onFocus={onFocusHandler} onBlur={onBlurHandler}>
                                    {RATE_OPTIONS.map(o => <option key={o.value || 'any'} value={o.value}>{o.label}</option>)}
                                </select>
                            </div>
                            {activeFilterCount > 0 && (
                                <div className="h-11 flex items-center">
                                    <button onClick={clearFilters}
                                        className="flex items-center gap-2 px-4 h-full text-sm font-bold rounded-xl transition-all hover:opacity-80 cursor-pointer border"
                                        style={{ backgroundColor: C.dangerBg, color: C.danger, borderColor: C.dangerBorder, fontFamily: T.fontFamily }}>
                                        <X className="w-4 h-4" /> Clear filters
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </div>

            {/* ── Results count ────────────────────────────────────────── */}
            {!loading && tutors.length > 0 && (
                <div className="flex items-center justify-between px-2">
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.textMuted, fontWeight: T.weight.bold, margin: 0 }}>
                        Found <span style={{ color: C.btnPrimary, fontWeight: T.weight.black }}>{tutors.length}</span> tutor{tutors.length !== 1 ? 's' : ''}
                    </p>
                    <p className="px-3 py-1 rounded-lg border" style={{ backgroundColor: innerBox, borderColor: C.cardBorder, fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', margin: 0 }}>
                        {activeTab === 'institute' ? '📍 My Institute' : '🌐 Global'}
                    </p>
                </div>
            )}

            {/* ── Results Grid ──────────────────────────────────────────────── */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <div className="w-12 h-12 rounded-full border-[3px] border-[#4F46E5]/30 border-t-[#4F46E5] animate-spin" />
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.textMuted, margin: 0 }}>
                        Finding experts...
                    </p>
                </div>
            ) : tutors.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tutors.map(tutor => <TutorCard key={tutor._id} tutor={tutor} />)}
                </div>
            ) : (
                /* Empty state */
                <div className="rounded-3xl overflow-hidden relative shadow-lg"
                    style={{ backgroundColor: '#1E1B4B' }}>
                    <div className="absolute inset-0 opacity-[0.05] pointer-events-none"
                        style={{ backgroundImage: 'radial-gradient(white 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
                    <div className="relative text-center py-20 px-6">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 border shadow-inner"
                            style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }}>
                            <Search className="w-8 h-8" style={{ color: 'rgba(255,255,255,0.7)' }} />
                        </div>
                        <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.xl, fontWeight: T.weight.black, color: '#ffffff', marginBottom: 8 }}>
                            No Tutors Found
                        </h3>
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.medium, color: 'rgba(255,255,255,0.6)', marginBottom: 24 }}>
                            Try adjusting your search terms or clearing the active filters.
                        </p>
                        <button onClick={() => { setSearchTerm(''); clearFilters(); fetchTutors(); }}
                            className="inline-flex items-center gap-2 px-6 h-11 rounded-xl text-sm font-bold transition-all cursor-pointer border shadow-lg hover:scale-105"
                            style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#ffffff', borderColor: 'rgba(255,255,255,0.2)', fontFamily: T.fontFamily }}>
                            <X className="w-4 h-4" /> Clear all filters
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
