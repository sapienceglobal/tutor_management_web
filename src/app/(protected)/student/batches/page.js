'use client';

import { useState, useEffect } from 'react';
import {
    MdMenuBook,
    MdCalendarMonth,
    MdAccessTime,
    MdCheckCircle,
    MdCancel,
    MdWarning,
    MdLanguage,
    MdBusiness,
    MdSearch,
    MdPeople,
    MdLogin,
    MdHourglassEmpty,
} from 'react-icons/md';
import { toast } from 'react-hot-toast';
import api from '@/lib/axios';
import { C, T, S, R, pageStyle } from '@/constants/studentTokens';

export default function StudentBatchesPage() {
    const [myBatches, setMyBatches]               = useState([]);
    const [availableBatches, setAvailableBatches] = useState([]);
    const [loading, setLoading]                   = useState(true);
    const [loadingAvail, setLoadingAvail]         = useState(false);
    const [joiningId, setJoiningId]               = useState(null);
    const [activeTab, setActiveTab]               = useState('my');
    const [discoverSearch, setDiscoverSearch]     = useState('');

    useEffect(() => { fetchMyBatches(); }, []);
    useEffect(() => { if (activeTab === 'discover') fetchAvailableBatches(); }, [activeTab]);

    const fetchMyBatches = async () => {
        setLoading(true);
        try {
            const res = await api.get('/batches/my');
            if (res.data.success) {
                const batchesWithStats = await Promise.all(res.data.batches.map(async (batch) => {
                    try {
                        const attRes = await api.get(`/attendance/batch/${batch._id}`);
                        if (attRes.data.success) {
                            const records    = attRes.data.records;
                            const present    = records.filter(r => r.status === 'present').length;
                            const total      = records.length;
                            const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
                            return { ...batch, attendanceStats: { present, total, percentage }, recentLogs: records.slice(0, 5) };
                        }
                    } catch { return { ...batch, attendanceStats: null, recentLogs: [] }; }
                    return { ...batch, attendanceStats: null, recentLogs: [] };
                }));
                setMyBatches(batchesWithStats);
            }
        } catch (err) {
            console.error(err);
            toast.error('Failed to load your enrolled batches');
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailableBatches = async () => {
        setLoadingAvail(true);
        try {
            const res = await api.get('/batches/available');
            if (res.data.success) setAvailableBatches(res.data.batches || []);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load available batches');
        } finally {
            setLoadingAvail(false);
        }
    };

    const handleJoin = async (batchId) => {
        setJoiningId(batchId);
        try {
            const res = await api.post(`/batches/${batchId}/join`);
            if (res.data.success) {
                toast.success('Successfully joined the batch!');
                const joined = availableBatches.find(b => b._id === batchId);
                if (joined) {
                    setMyBatches(prev => [{ ...joined, attendanceStats: null, recentLogs: [] }, ...prev]);
                    setAvailableBatches(prev => prev.filter(b => b._id !== batchId));
                }
                setActiveTab('my');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to join batch');
        } finally {
            setJoiningId(null);
        }
    };

    const getStatusIcon = (status) => {
        if (status === 'present') return <MdCheckCircle style={{ width: 16, height: 16, color: C.success }} />;
        if (status === 'absent')  return <MdCancel      style={{ width: 16, height: 16, color: C.danger }} />;
        if (status === 'late')    return <MdWarning     style={{ width: 16, height: 16, color: C.warning }} />;
        return null;
    };

    const getAttColor = (pct) => {
        if (pct >= 75) return C.success;
        if (pct >= 50) return C.warning;
        return C.danger;
    };

    const filteredAvailable = availableBatches.filter(b => {
        const q = discoverSearch.toLowerCase();
        return !q || b.name?.toLowerCase().includes(q) || b.courseId?.title?.toLowerCase().includes(q);
    });

    if (loading) return (
        <div className="flex items-center justify-center min-h-[50vh]" style={{ backgroundColor: C.pageBg }}>
            <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full border-[3px] animate-spin"
                    style={{ borderColor: `${C.btnPrimary}30`, borderTopColor: C.btnPrimary }} />
                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.text }}>
                    Loading batches…
                </p>
            </div>
        </div>
    );

  return (
        <div className="space-y-5 pb-8" style={{ ...pageStyle, backgroundColor: C.pageBg }}>

            {/* ── Header ─────────────────────────────────────────────── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.bold, color: C.heading }}>
                        Batches
                    </h1>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, color: C.text, marginTop: 2 }}>
                        Track your enrolled cohorts or join new ones.
                    </p>
                </div>

                {/* Tab switcher — exact animated pill pattern */}
                <div className="relative flex items-center p-1 self-start"
                    style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, borderRadius: '10px' }}>
                    <div
                        className="absolute top-1 bottom-1 w-[calc(50%-4px)] transition-transform duration-300 ease-in-out z-0"
                        style={{
                            backgroundColor: C.btnPrimary,
                            transform: activeTab === 'my' ? 'translateX(0)' : 'translateX(100%)',
                            boxShadow: `0 2px 10px ${C.btnPrimary}40`,
                            borderRadius: '10px',
                        }}
                    />
                    {[
                        { key: 'my',       label: 'My Batches',       Icon: MdMenuBook },
                        { key: 'discover', label: 'Discover Batches', Icon: MdLanguage },
                    ].map(({ key, label, Icon }) => (
                        <button key={key} onClick={() => setActiveTab(key)}
                            className="flex items-center gap-2 px-4 py-2 flex-1 relative z-10 transition-colors duration-300"
                            style={{
                                fontFamily: T.fontFamily,
                                fontSize: T.size.base,
                                fontWeight: T.weight.semibold,
                                color: activeTab === key ? '#ffffff' : C.text,
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                borderRadius: '10px',
                            }}>
                            <Icon style={{ width: 16, height: 16 }} /> {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ══ MY BATCHES TAB ══════════════════════════════════════════ */}
            {activeTab === 'my' && (
                myBatches.length === 0 ? (
                    <div className="p-14 text-center border border-dashed"
                        style={{ backgroundColor: C.cardBg, borderColor: C.cardBorder, borderRadius: R['2xl'] }}>
                        <div className="flex items-center justify-center mx-auto mb-4"
                            style={{ width: 56, height: 56, backgroundColor: C.innerBg, borderRadius: '10px' }}>
                            <MdMenuBook style={{ width: 28, height: 28, color: C.btnPrimary, opacity: 0.5 }} />
                        </div>
                        <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading }}>
                            No Batches Yet
                        </h3>
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, color: C.text, marginTop: 8, maxWidth: 380, margin: '8px auto 0' }}>
                            You haven't joined any batches. Explore available batches or wait for your instructor to add you.
                        </p>
                        <button onClick={() => setActiveTab('discover')}
                            className="mt-6 cursor-pointer hover:opacity-90 transition-opacity"
                            style={{
                                background: C.gradientBtn,
                                color: '#ffffff',
                                fontFamily: T.fontFamily,
                                fontSize: T.size.base,
                                fontWeight: T.weight.bold,
                                padding: '12px 24px',
                                borderRadius: '10px',
                                border: 'none',
                                boxShadow: S.btn,
                                marginTop: 24,
                            }}>
                            Discover Batches
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        {myBatches.map(batch => {
                            const pct      = batch.attendanceStats?.percentage || 0;
                            const attColor = getAttColor(pct);

                            return (
                                <div key={batch._id} className="flex flex-col transition-all"
                                    style={{
                                        backgroundColor: C.cardBg,
                                        border: `1px solid ${C.cardBorder}`,
                                        boxShadow: S.card,
                                        borderRadius: R['2xl'],
                                        overflow: 'hidden',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.boxShadow = S.cardHover}
                                    onMouseLeave={e => e.currentTarget.style.boxShadow = S.card}
                                >
                                    {/* Header */}
                                    <div className="p-5 flex items-start gap-4"
                                        style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                                        <div className="flex items-center justify-center shrink-0"
                                            style={{
                                                width: 56,
                                                height: 56,
                                                borderRadius: '10px',
                                                backgroundColor: C.iconBg,
                                            }}>
                                            <MdMenuBook style={{ width: 28, height: 28, color: C.iconColor }} />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <h2 className="line-clamp-1"
                                                    style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading }}>
                                                    {batch.name}
                                                </h2>
                                                <span
                                                    style={batch.status === 'active'
                                                        ? { backgroundColor: C.successBg, color: C.success, fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '4px 10px', borderRadius: '10px', border: `1px solid ${C.successBorder}`, flexShrink: 0 }
                                                        : { backgroundColor: C.btnViewAllBg, color: C.btnPrimary, fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '4px 10px', borderRadius: '10px', border: `1px solid ${C.cardBorder}`, flexShrink: 0 }}>
                                                    {batch.status}
                                                </span>
                                            </div>
                                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, color: C.text, marginTop: 2 }}>
                                                {batch.courseId?.title}
                                            </p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <img
                                                    src={batch.tutorId?.userId?.profileImage || `https://ui-avatars.com/api/?name=${batch.tutorId?.userId?.name}`}
                                                    alt=""
                                                    style={{ width: 20, height: 20, borderRadius: R.full }}
                                                />
                                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.text, fontWeight: T.weight.semibold }}>
                                                    {batch.tutorId?.userId?.name}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Date + Schedule (FIXED ALIGNMENT) */}
                                    <div className="px-5 pt-5">
                                        <div className="grid grid-cols-2 divide-x"
                                            style={{ 
                                                backgroundColor: C.innerBg, 
                                                border: `1px solid ${C.cardBorder}`, 
                                                borderRadius: '10px',
                                                borderColor: C.cardBorder 
                                            }}>
                                            {[
                                                { icon: MdCalendarMonth, label: 'Start Date', value: new Date(batch.startDate).toLocaleDateString() },
                                                { icon: MdAccessTime, label: 'Schedule', value: batch.scheduleDescription || 'Flexible' },
                                            ].map(({ icon: Icon, label, value }) => (
                                                <div key={label} className="p-4 flex flex-col gap-1" style={{ borderColor: C.cardBorder }}>
                                                    <div className="flex items-center gap-1.5"
                                                        style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                        <Icon style={{ width: 14, height: 14 }} /> {label}
                                                    </div>
                                                    <span className="truncate"
                                                        style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.semibold, color: C.heading }}>
                                                        {value}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Attendance */}
                                    <div className="p-5 flex-1">
                                        <div className="flex items-end justify-between mb-3">
                                            <div>
                                                <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading }}>
                                                    Your Attendance
                                                </h3>
                                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.text, marginTop: 2 }}>
                                                    Overall presence rate
                                                </p>
                                            </div>
                                            <span style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.bold, color: attColor }}>
                                                {pct}%
                                            </span>
                                        </div>

                                        <div className="w-full overflow-hidden mb-5"
                                            style={{ height: 8, borderRadius: '10px', backgroundColor: C.innerBg }}>
                                            <div className="h-full transition-all duration-700"
                                                style={{ width: `${pct}%`, backgroundColor: attColor, borderRadius: '10px' }} />
                                        </div>

                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                                            Recent Logs
                                        </p>
                                        <div className="space-y-2.5">
                                            {batch.recentLogs?.length > 0 ? batch.recentLogs.map(log => (
                                                <div key={log._id} className="flex items-center justify-between"
                                                    style={{
                                                        backgroundColor: C.innerBg,
                                                        border: `1px solid ${C.cardBorder}`,
                                                        borderRadius: '10px',
                                                        padding: 12,
                                                    }}>
                                                    <div className="flex items-center gap-3">
                                                        <div style={{
                                                            padding: 6,
                                                            borderRadius: '10px',
                                                            backgroundColor: log.status === 'present' ? C.successBg :
                                                                             log.status === 'absent'  ? C.dangerBg  : C.warningBg,
                                                        }}>
                                                            {getStatusIcon(log.status)}
                                                        </div>
                                                        <div>
                                                            <span className="block capitalize"
                                                                style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.semibold, color: C.heading }}>
                                                                {log.status}
                                                            </span>
                                                            <span className="block"
                                                                style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.text }}>
                                                                {new Date(log.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {log.remarks && (
                                                        <span className="truncate max-w-[140px] italic"
                                                            style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.text }}
                                                            title={log.remarks}>
                                                            "{log.remarks}"
                                                        </span>
                                                    )}
                                                </div>
                                            )) : (
                                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, color: C.text, fontStyle: 'italic' }}>
                                                    No attendance records yet.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )
            )}

            {/* ══ DISCOVER BATCHES TAB ════════════════════════════════════ */}
            {activeTab === 'discover' && (
                <div className="space-y-5">
                    {/* Search */}
                    <div className="relative">
                        <MdSearch
                            style={{ width: 16, height: 16, color: C.text, opacity: 0.5 }}
                            className="absolute left-4 top-1/2 -translate-y-1/2"
                        />
                        <input
                            type="text"
                            placeholder="Search batches by name or course…"
                            value={discoverSearch}
                            onChange={e => setDiscoverSearch(e.target.value)}
                            className="w-full focus:outline-none transition-all"
                            style={{
                                backgroundColor: C.cardBg,
                                border: `1px solid ${C.cardBorder}`,
                                borderRadius: '10px',
                                color: C.heading,
                                fontFamily: T.fontFamily,
                                fontSize: T.size.base,
                                fontWeight: T.weight.semibold,
                                outline: 'none',
                                width: '100%',
                                padding: '12px 16px 12px 44px',
                                boxShadow: S.card,
                                transition: 'all 0.2s ease',
                            }}
                            onFocus={e => { e.currentTarget.style.borderColor = C.btnPrimary; e.currentTarget.style.boxShadow = `0 0 0 3px ${C.btnPrimary}15`; }}
                            onBlur={e => { e.currentTarget.style.borderColor = C.cardBorder; e.currentTarget.style.boxShadow = S.card; }}
                        />
                    </div>

                    {loadingAvail ? (
                        <div className="flex justify-center py-20">
                            <div className="w-12 h-12 rounded-full border-[3px] animate-spin"
                                style={{ borderColor: `${C.btnPrimary}30`, borderTopColor: C.btnPrimary }} />
                        </div>
                    ) : filteredAvailable.length === 0 ? (
                        <div className="p-14 text-center border border-dashed"
                            style={{ backgroundColor: C.cardBg, borderColor: C.cardBorder, borderRadius: R['2xl'] }}>
                            <div className="flex items-center justify-center mx-auto mb-4"
                                style={{ width: 56, height: 56, backgroundColor: C.innerBg, borderRadius: '10px' }}>
                                <MdLanguage style={{ width: 28, height: 28, color: C.btnPrimary, opacity: 0.5 }} />
                            </div>
                            <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading }}>
                                {discoverSearch ? 'No batches match your search' : 'No Available Batches'}
                            </h3>
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, color: C.text, marginTop: 8 }}>
                                {discoverSearch ? 'Try a different search term.' : 'Check back later — new batches are added regularly.'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                            {filteredAvailable.map(batch => (
                                <div key={batch._id} className="flex flex-col transition-all"
                                    style={{
                                        backgroundColor: C.cardBg,
                                        border: `1px solid ${C.cardBorder}`,
                                        boxShadow: S.card,
                                        borderRadius: R['2xl'],
                                        overflow: 'hidden',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.boxShadow = S.cardHover}
                                    onMouseLeave={e => e.currentTarget.style.boxShadow = S.card}
                                >
                                    {/* Header */}
                                    <div className="p-5 flex items-start gap-4"
                                        style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                                        <div className="flex items-center justify-center shrink-0"
                                            style={{ width: 48, height: 48, borderRadius: '10px', backgroundColor: C.iconBg }}>
                                            <MdMenuBook style={{ width: 24, height: 24, color: C.iconColor }} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <h2 className="line-clamp-1"
                                                    style={{ fontFamily: T.fontFamily, fontSize: T.size.md, fontWeight: T.weight.bold, color: C.heading }}>
                                                    {batch.name}
                                                </h2>
                                                {/* Institute vs Global badge */}
                                                <span className="flex items-center gap-1 shrink-0"
                                                    style={batch.instituteId
                                                        ? { backgroundColor: C.btnViewAllBg, color: C.btnPrimary, fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, padding: '4px 10px', borderRadius: '10px', border: `1px solid ${C.cardBorder}` }
                                                        : { backgroundColor: '#EFF6FF', color: '#2563EB', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, padding: '4px 10px', borderRadius: '10px' }}>
                                                    {batch.instituteId
                                                        ? <MdBusiness style={{ width: 12, height: 12 }} />
                                                        : <MdLanguage style={{ width: 12, height: 12 }} />}
                                                    {batch.instituteId ? 'Institute' : 'Global'}
                                                </span>
                                            </div>
                                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, color: C.text, marginTop: 2 }}>
                                                {batch.courseId?.title || 'Course'}
                                            </p>
                                            <div className="flex items-center gap-4 mt-2">
                                                <span className="flex items-center gap-1"
                                                    style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.text }}>
                                                    <MdPeople style={{ width: 14, height: 14 }} />
                                                    {batch.students?.length || 0} students
                                                </span>
                                                {batch.grade && (
                                                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.text }}>
                                                        Grade: {batch.grade}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Date + Schedule (FIXED ALIGNMENT) */}
                                    <div className="px-5 pt-5">
                                        <div className="grid grid-cols-2 divide-x"
                                            style={{ 
                                                backgroundColor: C.innerBg, 
                                                border: `1px solid ${C.cardBorder}`, 
                                                borderRadius: '10px',
                                                borderColor: C.cardBorder 
                                            }}>
                                            {[
                                                { icon: MdCalendarMonth, label: 'Start Date', value: batch.startDate ? new Date(batch.startDate).toLocaleDateString() : '—' },
                                                { icon: MdAccessTime, label: 'Schedule', value: batch.scheduleDescription || 'Flexible' },
                                            ].map(({ icon: Icon, label, value }) => (
                                                <div key={label} className="p-4 flex flex-col gap-1" style={{ borderColor: C.cardBorder }}>
                                                    <div className="flex items-center gap-1.5"
                                                        style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.statLabel, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                        <Icon style={{ width: 14, height: 14 }} /> {label}
                                                    </div>
                                                    <span className="truncate"
                                                        style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.semibold, color: C.heading }}>
                                                        {value}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Instructor + Join */}
                                    <div className="p-5 flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <img
                                                src={batch.tutorId?.userId?.profileImage || `https://ui-avatars.com/api/?name=${batch.tutorId?.userId?.name || 'T'}`}
                                                alt=""
                                                style={{ width: 32, height: 32, borderRadius: R.full, flexShrink: 0 }}
                                            />
                                            <div className="min-w-0">
                                                <p className="truncate"
                                                    style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading }}>
                                                    {batch.tutorId?.userId?.name || 'Instructor'}
                                                </p>
                                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.text }}>
                                                    Instructor
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleJoin(batch._id)}
                                            disabled={joiningId === batch._id}
                                            className="flex items-center gap-2 shrink-0 hover:opacity-90 disabled:opacity-60 transition-opacity cursor-pointer"
                                            style={{
                                                background: C.gradientBtn,
                                                color: '#ffffff',
                                                fontFamily: T.fontFamily,
                                                fontSize: T.size.base,
                                                fontWeight: T.weight.bold,
                                                padding: '10px 20px',
                                                borderRadius: '10px',
                                                border: 'none',
                                                boxShadow: S.btn,
                                            }}>
                                            {joiningId === batch._id
                                                ? <><MdHourglassEmpty style={{ width: 16, height: 16 }} className="animate-spin" /> Joining…</>
                                                : <><MdLogin style={{ width: 16, height: 16 }} /> Join Batch</>
                                            }
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}