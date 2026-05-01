'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    MdSearch,
    MdStar,
    MdStarBorder,
    MdEmojiEvents,
    MdLocationOn,
    MdArrowForward,
    MdCheckCircle,
    MdMenuBook,
    MdFilterList,
    MdAutoAwesome,
    MdPeople,
    MdClose,
    MdPerson,
    MdSchool,
} from 'react-icons/md';
import api from '@/lib/axios';
import { C, T, S, R } from '@/constants/studentTokens';

// ─── Constants ────────────────────────────────────────────────────────────────
const RATE_OPTIONS = [
    { label: 'Any rate',       value: '' },
    { label: 'Under ₹500/hr',  value: '500' },
    { label: 'Under ₹1000/hr', value: '1000' },
    { label: 'Under ₹2000/hr', value: '2000' },
];

// ─── Focus Handlers ───────────────────────────────────────────────────────────
const onFocusHandler = e => {
    e.target.style.borderColor = C.btnPrimary;
    e.target.style.boxShadow   = '0 0 0 3px rgba(117,115,232,0.15)';
};
const onBlurHandler = e => {
    e.target.style.borderColor = C.cardBorder;
    e.target.style.boxShadow   = 'none';
};

const baseInputStyle = {
    backgroundColor: C.cardBg,
    border:          `1px solid ${C.cardBorder}`,
    borderRadius:    '10px',
    color:           C.heading,
    fontFamily:      T.fontFamily,
    fontSize:        T.size.base,
    fontWeight:      T.weight.semibold,
    outline:         'none',
    width:           '100%',
    padding:         '12px 16px',
    transition:      'all 0.2s ease',
};

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ src, name, size = 'lg' }) {
    const dim = size === 'lg' ? 52 : 40;
    return (
        <div
            style={{
                width:           dim,
                height:          dim,
                borderRadius:    '10px',
                overflow:        'hidden',
                border:          `2px solid ${C.cardBorder}`,
                boxShadow:       S.card,
                flexShrink:      0,
                backgroundColor: C.innerBg,
                display:         'flex',
                alignItems:      'center',
                justifyContent:  'center',
            }}
        >
            {src ? (
                <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
                <span
                    style={{
                        fontFamily:  T.fontFamily,
                        fontSize:    size === 'lg' ? T.size.xl : T.size.md,
                        fontWeight:  T.weight.bold,
                        color:       C.btnPrimary,
                    }}
                >
                    {name?.[0]?.toUpperCase() || 'T'}
                </span>
            )}
        </div>
    );
}

// ─── Tab Button ───────────────────────────────────────────────────────────────
function TabBtn({ active, onClick, children }) {
    return (
        <button
            onClick={onClick}
            className="px-5 py-1.5 transition-all border-none cursor-pointer"
            style={
                active
                    ? {
                        backgroundColor: C.btnPrimary,
                        color:           '#ffffff',
                        fontFamily:      T.fontFamily,
                        fontSize:        T.size.base,
                        fontWeight:      T.weight.semibold,
                        borderRadius:    '10px',
                        boxShadow:       `0 2px 8px ${C.btnPrimary}40`,
                    }
                    : {
                        backgroundColor: 'transparent',
                        color:           C.text,
                        fontFamily:      T.fontFamily,
                        fontSize:        T.size.base,
                        fontWeight:      T.weight.semibold,
                        borderRadius:    '10px',
                    }
            }
        >
            {children}
        </button>
    );
}

// ─── Tutor Card ───────────────────────────────────────────────────────────────
function TutorCard({ tutor }) {
    return (
        <div
            className="flex flex-col transition-all duration-200"
            style={{
                backgroundColor: C.cardBg,
                border:          `1px solid ${C.cardBorder}`,
                boxShadow:       S.card,
                borderRadius:    R['2xl'],
            }}
            onMouseEnter={e => {
                e.currentTarget.style.boxShadow     = S.cardHover;
                e.currentTarget.style.borderColor   = C.btnPrimary;
                e.currentTarget.style.transform     = 'translateY(-2px)';
            }}
            onMouseLeave={e => {
                e.currentTarget.style.boxShadow   = S.card;
                e.currentTarget.style.borderColor = C.cardBorder;
                e.currentTarget.style.transform   = 'none';
            }}
        >
            <div className="p-5 flex-1 flex flex-col">

                {/* Avatar + Info */}
                <div className="flex items-start gap-3 mb-4">
                    <Avatar src={tutor.userId?.profileImage} name={tutor.userId?.name} />
                    <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3
                                className="truncate"
                                style={{
                                    fontFamily:  T.fontFamily,
                                    fontSize:    T.size.md,
                                    fontWeight:  T.weight.bold,
                                    color:       C.heading,
                                    margin:      0,
                                }}
                            >
                                {tutor.userId?.name || 'Tutor'}
                            </h3>
                            {tutor.isVerified && (
                                <span
                                    className="inline-flex items-center gap-1 px-2 py-0.5"
                                    style={{
                                        backgroundColor: C.successBg,
                                        color:           C.success,
                                        border:          `1px solid ${C.successBorder}`,
                                        fontFamily:      T.fontFamily,
                                        fontSize:        T.size.xs,
                                        fontWeight:      T.weight.bold,
                                        borderRadius:    '10px',
                                        textTransform:   'uppercase',
                                    }}
                                >
                                    <MdCheckCircle style={{ width: 12, height: 12 }} /> Verified
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <span
                                style={{
                                    fontFamily:  T.fontFamily,
                                    fontSize:    T.size.base,
                                    fontWeight:  T.weight.semibold,
                                    color:       C.btnPrimary,
                                }}
                            >
                                {tutor.categoryId?.name || 'Expert'}
                            </span>
                            {tutor.instituteId && (
                                <span
                                    className="px-2 py-0.5"
                                    style={{
                                        backgroundColor: C.innerBg,
                                        color:           C.text,
                                        border:          `1px solid ${C.cardBorder}`,
                                        fontFamily:      T.fontFamily,
                                        fontSize:        T.size.xs,
                                        fontWeight:      T.weight.semibold,
                                        borderRadius:    '10px',
                                        textTransform:   'uppercase',
                                    }}
                                >
                                    {tutor.instituteId.name || 'Institute'}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Rating + Bio */}
                <div className="mb-4 space-y-2.5">
                    <div className="flex items-center gap-1.5">
                        <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map(s =>
                                s <= Math.round(tutor.rating || 0)
                                    ? <MdStar     key={s} style={{ width: 14, height: 14, color: '#F59E0B' }} />
                                    : <MdStarBorder key={s} style={{ width: 14, height: 14, color: C.cardBorder }} />
                            )}
                        </div>
                        <span
                            style={{
                                fontFamily:  T.fontFamily,
                                fontSize:    T.size.base,
                                fontWeight:  T.weight.bold,
                                color:       C.heading,
                                marginLeft:  2,
                            }}
                        >
                            {tutor.rating?.toFixed(1) || 'New'}
                        </span>
                        <span
                            style={{
                                fontFamily: T.fontFamily,
                                fontSize:   T.size.xs,
                                fontWeight: T.weight.medium,
                                color:      C.text,
                            }}
                        >
                            ({tutor.reviewCount || 0} reviews)
                        </span>
                    </div>
                    <p
                        className="line-clamp-2"
                        style={{
                            fontFamily:  T.fontFamily,
                            fontSize:    T.size.base,
                            color:       C.text,
                            lineHeight:  T.leading.relaxed,
                            fontWeight:  T.weight.medium,
                            margin:      0,
                        }}
                    >
                        {tutor.bio || 'Expert tutor ready to help you achieve your learning goals with personalized guidance.'}
                    </p>
                </div>

                {/* Meta Pills */}
                <div className="flex flex-wrap gap-2 mb-4">
                    {[
                        { icon: MdEmojiEvents, text: `${tutor.experience || 0} yrs exp` },
                        { icon: MdPeople,      text: `${tutor.studentsCount || 0} students` },
                        { icon: MdLocationOn,  text: 'Live Online' },
                    ].map(({ icon: Icon, text }) => (
                        <span
                            key={text}
                            className="flex items-center gap-1.5 px-3 py-1.5"
                            style={{
                                backgroundColor: C.innerBg,
                                color:           C.heading,
                                border:          `1px solid ${C.cardBorder}`,
                                fontFamily:      T.fontFamily,
                                fontSize:        T.size.xs,
                                fontWeight:      T.weight.semibold,
                                borderRadius:    '10px',
                            }}
                        >
                            <Icon style={{ width: 14, height: 14, color: C.btnPrimary }} />
                            {text}
                        </span>
                    ))}
                </div>

                {/* Footer: Rate + CTA */}
                <div
                    className="mt-auto pt-4 flex items-center justify-between gap-3"
                    style={{ borderTop: `1px solid ${C.cardBorder}` }}
                >
                    <div>
                        <p
                            style={{
                                fontFamily:    T.fontFamily,
                                fontSize:      T.size.xs,
                                fontWeight:    T.weight.semibold,
                                color:         C.text,
                                textTransform: 'uppercase',
                                letterSpacing: T.tracking.wider,
                                margin:        '0 0 2px 0',
                            }}
                        >
                            Hourly Rate
                        </p>
                        <p
                            style={{
                                fontFamily:  T.fontFamily,
                                fontSize:    T.size['2xl'],
                                fontWeight:  T.weight.bold,
                                color:       C.heading,
                                margin:      0,
                                lineHeight:  1,
                            }}
                        >
                            ₹{tutor.hourlyRate ?? 0}
                        </p>
                    </div>
                    <Link href={`/student/tutors/${tutor._id}`}>
                        <button
                            className="flex items-center justify-center gap-1.5 px-5 h-10 text-white transition-all cursor-pointer border-none"
                            style={{
                                background:  C.gradientBtn,
                                fontFamily:  T.fontFamily,
                                fontSize:    T.size.base,
                                fontWeight:  T.weight.bold,
                                borderRadius:'10px',
                                boxShadow:   S.btn,
                            }}
                        >
                            Book Live Class <MdArrowForward style={{ width: 16, height: 16 }} />
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
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

    const handleSearch    = (e) => { e.preventDefault(); fetchTutors(); };
    const clearFilters    = () => { setCategoryId(''); setMaxRate(''); };
    const activeFilterCount = [categoryId, maxRate].filter(Boolean).length;

    return (
        <div
            className="w-full min-h-screen space-y-5 pb-8"
            style={{ backgroundColor: C.pageBg, fontFamily: T.fontFamily, color: C.text }}
        >
            {/* ── Header ─────────────────────────────────────────────────── */}
            <div
                className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5"
                style={{
                    backgroundColor: C.cardBg,
                    border:          `1px solid ${C.cardBorder}`,
                    boxShadow:       S.card,
                    borderRadius:    R['2xl'],
                }}
            >
                <div className="flex items-center gap-3">
                    {/* Icon Pill */}
                    <div
                        className="flex items-center justify-center rounded-lg shrink-0"
                        style={{ width: 40, height: 40, backgroundColor: C.iconBg }}
                    >
                        <MdSchool style={{ width: 20, height: 20, color: C.iconColor }} />
                    </div>
                    <div>
                        <h1
                            style={{
                                fontFamily:  T.fontFamily,
                                fontSize:    T.size['2xl'],
                                fontWeight:  T.weight.bold,
                                color:       C.heading,
                                margin:      '0 0 2px 0',
                                lineHeight:  T.leading.tight,
                            }}
                        >
                            Find a Tutor
                        </h1>
                        <p
                            style={{
                                fontFamily:  T.fontFamily,
                                fontSize:    T.size.base,
                                fontWeight:  T.weight.medium,
                                color:       C.text,
                                margin:      0,
                            }}
                        >
                            Connect with verified experts for personalized 1-on-1 live online classes.
                        </p>
                    </div>
                </div>

                {/* Institute / Global Switcher */}
                {myInstitutes.length > 0 && (
                    <div
                        className="relative flex items-center p-1 rounded-xl self-start md:self-auto shrink-0"
                        style={{
                            backgroundColor: C.cardBg,
                            border:          `1px solid ${C.cardBorder}`,
                        }}
                    >
                        <div
                            className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg transition-transform duration-300 ease-in-out z-0"
                            style={{
                                backgroundColor: C.btnPrimary,
                                transform:       activeTab === 'institute' ? 'translateX(0)' : 'translateX(100%)',
                                boxShadow:       `0 2px 10px ${C.btnPrimary}40`,
                            }}
                        />
                        {['institute', 'global'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className="flex-1 relative z-10 px-5 py-1.5 capitalize transition-colors duration-300 border-none cursor-pointer"
                                style={{
                                    fontFamily:  T.fontFamily,
                                    fontSize:    T.size.base,
                                    fontWeight:  T.weight.semibold,
                                    color:       activeTab === tab ? '#ffffff' : C.text,
                                    background:  'transparent',
                                    borderRadius:'10px',
                                }}
                            >
                                {tab === 'institute' ? 'My Institute' : 'Global'}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Search + Filter ─────────────────────────────────────────── */}
            <div
                className="p-5"
                style={{
                    backgroundColor: C.cardBg,
                    border:          `1px solid ${C.cardBorder}`,
                    boxShadow:       S.card,
                    borderRadius:    R['2xl'],
                }}
            >
                <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
                    {/* Search Input */}
                    <div className="relative flex-1">
                        <MdSearch
                            className="absolute left-4 top-1/2 -translate-y-1/2"
                            style={{ width: 18, height: 18, color: C.text }}
                        />
                        <input
                            type="text"
                            placeholder="Search tutors by name or subject..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            style={{ ...baseInputStyle, paddingLeft: '42px', height: '46px' }}
                            onFocus={onFocusHandler}
                            onBlur={onBlurHandler}
                        />
                    </div>

                    <div className="flex gap-2 shrink-0">
                        {/* Search Button */}
                        <button
                            type="submit"
                            className="px-6 h-[46px] text-white transition-all hover:opacity-90 cursor-pointer border-none"
                            style={{
                                background:   C.gradientBtn,
                                fontFamily:   T.fontFamily,
                                fontSize:     T.size.base,
                                fontWeight:   T.weight.bold,
                                borderRadius: '10px',
                                boxShadow:    S.btn,
                            }}
                        >
                            Search
                        </button>

                        {/* Filter Toggle Button */}
                        <button
                            type="button"
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center justify-center gap-2 px-4 h-[46px] transition-all cursor-pointer"
                            style={
                                showFilters || activeFilterCount > 0
                                    ? {
                                        backgroundColor: C.innerBg,
                                        color:           C.btnPrimary,
                                        border:          `1px solid ${C.btnPrimary}`,
                                        fontFamily:      T.fontFamily,
                                        fontSize:        T.size.base,
                                        fontWeight:      T.weight.bold,
                                        borderRadius:    '10px',
                                    }
                                    : {
                                        backgroundColor: C.innerBg,
                                        color:           C.heading,
                                        border:          `1px solid ${C.cardBorder}`,
                                        fontFamily:      T.fontFamily,
                                        fontSize:        T.size.base,
                                        fontWeight:      T.weight.bold,
                                        borderRadius:    '10px',
                                    }
                            }
                        >
                            <MdFilterList style={{ width: 18, height: 18 }} />
                            Filters
                            {activeFilterCount > 0 && (
                                <span
                                    className="flex items-center justify-center text-white"
                                    style={{
                                        width:           20,
                                        height:          20,
                                        backgroundColor: C.btnPrimary,
                                        borderRadius:    '50%',
                                        fontFamily:      T.fontFamily,
                                        fontSize:        T.size.xs,
                                        fontWeight:      T.weight.bold,
                                    }}
                                >
                                    {activeFilterCount}
                                </span>
                            )}
                        </button>
                    </div>
                </form>

                {/* Expanded Filters */}
                {showFilters && (
                    <div
                        className="pt-5 mt-5"
                        style={{ borderTop: `1px solid ${C.cardBorder}` }}
                    >
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                            {/* Category */}
                            <div className="space-y-2">
                                <label
                                    style={{
                                        display:       'block',
                                        fontFamily:    T.fontFamily,
                                        fontSize:      T.size.xs,
                                        fontWeight:    T.weight.bold,
                                        color:         C.text,
                                        textTransform: 'uppercase',
                                        letterSpacing: T.tracking.wider,
                                        margin:        0,
                                    }}
                                >
                                    Category
                                </label>
                                <select
                                    value={categoryId}
                                    onChange={e => setCategoryId(e.target.value)}
                                    style={{ ...baseInputStyle, cursor: 'pointer', height: '44px' }}
                                    onFocus={onFocusHandler}
                                    onBlur={onBlurHandler}
                                >
                                    <option value="">All categories</option>
                                    {categories.map(c => (
                                        <option key={c._id} value={c._id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Max Rate */}
                            <div className="space-y-2">
                                <label
                                    style={{
                                        display:       'block',
                                        fontFamily:    T.fontFamily,
                                        fontSize:      T.size.xs,
                                        fontWeight:    T.weight.bold,
                                        color:         C.text,
                                        textTransform: 'uppercase',
                                        letterSpacing: T.tracking.wider,
                                        margin:        0,
                                    }}
                                >
                                    Max Hourly Rate
                                </label>
                                <select
                                    value={maxRate}
                                    onChange={e => setMaxRate(e.target.value)}
                                    style={{ ...baseInputStyle, cursor: 'pointer', height: '44px' }}
                                    onFocus={onFocusHandler}
                                    onBlur={onBlurHandler}
                                >
                                    {RATE_OPTIONS.map(o => (
                                        <option key={o.value || 'any'} value={o.value}>{o.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Clear Filters */}
                            {activeFilterCount > 0 && (
                                <div className="flex items-center" style={{ height: 44 }}>
                                    <button
                                        onClick={clearFilters}
                                        className="flex items-center gap-2 px-4 h-full transition-all hover:opacity-80 cursor-pointer"
                                        style={{
                                            backgroundColor: C.dangerBg,
                                            color:           C.danger,
                                            border:          `1px solid ${C.dangerBorder}`,
                                            fontFamily:      T.fontFamily,
                                            fontSize:        T.size.base,
                                            fontWeight:      T.weight.bold,
                                            borderRadius:    '10px',
                                        }}
                                    >
                                        <MdClose style={{ width: 16, height: 16 }} /> Clear filters
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Results Count ───────────────────────────────────────────── */}
            {!loading && tutors.length > 0 && (
                <div className="flex items-center justify-between px-1">
                    <p
                        style={{
                            fontFamily:  T.fontFamily,
                            fontSize:    T.size.base,
                            color:       C.text,
                            fontWeight:  T.weight.medium,
                            margin:      0,
                        }}
                    >
                        Found{' '}
                        <span style={{ color: C.btnPrimary, fontWeight: T.weight.bold }}>
                            {tutors.length}
                        </span>{' '}
                        tutor{tutors.length !== 1 ? 's' : ''}
                    </p>
                    <span
                        className="px-3 py-1"
                        style={{
                            backgroundColor: C.innerBg,
                            border:          `1px solid ${C.cardBorder}`,
                            fontFamily:      T.fontFamily,
                            fontSize:        T.size.xs,
                            fontWeight:      T.weight.bold,
                            color:           C.text,
                            textTransform:   'uppercase',
                            letterSpacing:   T.tracking.wider,
                            borderRadius:    '10px',
                        }}
                    >
                        {activeTab === 'institute' ? '📍 My Institute' : '🌐 Global'}
                    </span>
                </div>
            )}

            {/* ── Results Grid / Loading / Empty ──────────────────────────── */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <div className="relative w-12 h-12">
                        <div
                            className="w-12 h-12 rounded-full border-[3px] animate-spin"
                            style={{
                                borderColor:    `${C.btnPrimary}30`,
                                borderTopColor: C.btnPrimary,
                            }}
                        />
                    </div>
                    <p
                        style={{
                            fontFamily:  T.fontFamily,
                            fontSize:    T.size.base,
                            fontWeight:  T.weight.medium,
                            color:       C.text,
                            margin:      0,
                        }}
                    >
                        Finding experts...
                    </p>
                </div>
            ) : tutors.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {tutors.map(tutor => <TutorCard key={tutor._id} tutor={tutor} />)}
                </div>
            ) : (
                /* Empty State */
                <div
                    className="p-14 text-center border border-dashed"
                    style={{
                        backgroundColor: C.cardBg,
                        borderColor:     C.cardBorder,
                        borderRadius:    R['2xl'],
                    }}
                >
                    <div
                        className="flex items-center justify-center mx-auto mb-4"
                        style={{
                            width:           56,
                            height:          56,
                            backgroundColor: C.innerBg,
                            borderRadius:    R.lg,
                        }}
                    >
                        <MdSearch style={{ width: 28, height: 28, color: C.btnPrimary, opacity: 0.5 }} />
                    </div>
                    <h3
                        style={{
                            fontFamily:  T.fontFamily,
                            fontSize:    T.size.lg,
                            fontWeight:  T.weight.bold,
                            color:       C.heading,
                            marginBottom: 6,
                        }}
                    >
                        No Tutors Found
                    </h3>
                    <p
                        style={{
                            fontFamily:   T.fontFamily,
                            fontSize:     T.size.base,
                            fontWeight:   T.weight.medium,
                            color:        C.text,
                            marginBottom: 20,
                        }}
                    >
                        Try adjusting your search terms or clearing the active filters.
                    </p>
                    <button
                        onClick={() => { setSearchTerm(''); clearFilters(); fetchTutors(); }}
                        className="inline-flex items-center gap-2 px-6 h-10 transition-all cursor-pointer hover:opacity-80"
                        style={{
                            backgroundColor: C.btnViewAllBg,
                            color:           C.btnViewAllText,
                            border:          `1px solid ${C.cardBorder}`,
                            fontFamily:      T.fontFamily,
                            fontSize:        T.size.base,
                            fontWeight:      T.weight.bold,
                            borderRadius:    '10px',
                        }}
                    >
                        <MdClose style={{ width: 16, height: 16 }} /> Clear all filters
                    </button>
                </div>
            )}
        </div>
    );
}