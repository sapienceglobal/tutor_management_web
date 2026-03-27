'use client';

import { useState, useRef } from 'react';
import {
    Upload, FileText, Sparkles, Loader2, MoreHorizontal,
    AlertTriangle, CheckCircle2, Globe, BookOpen,
    Brain, Save, RefreshCw, Share2, ExternalLink,
    AlertCircle, Copy, Check, Shield, BarChart2,
    MapPin
} from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { C, T, S, R } from '@/constants/tutorTokens';

// ─── Purple palette ───────────────────────────────────────────────────────────
const P = {
    primary:  '#7C3AED',
    light:    '#8B5CF6',
    soft:     'rgba(124,58,237,0.08)',
    border:   'rgba(124,58,237,0.14)',
    gradient: 'linear-gradient(135deg,#5B21B6 0%,#7C3AED 60%,#8B5CF6 100%)',
    pageBg:   '#F5F3FF',
    red:      '#EF4444',
    redSoft:  'rgba(239,68,68,0.10)',
    orange:   '#F97316',
    yellow:   '#F59E0B',
    green:    '#10B981',
    greenSoft:'rgba(16,185,129,0.10)',
    teal:     '#0891B2',
};

const RISK_CFG = {
    Low:      { color: P.green,  bg: P.greenSoft,          label: 'Low',      gaugePct: 15 },
    Medium:   { color: P.yellow, bg: 'rgba(245,158,11,0.10)', label: 'Medium', gaugePct: 50 },
    High:     { color: P.orange, bg: 'rgba(249,115,22,0.10)', label: 'High',   gaugePct: 75 },
    Critical: { color: P.red,    bg: P.redSoft,             label: 'Critical', gaugePct: 95 },
};

const SOURCE_ICON_CFG = {
    Web:      { icon: Globe,     color: P.primary },
    Document: { icon: FileText,  color: P.orange  },
    Journal:  { icon: BookOpen,  color: P.teal    },
    Book:     { icon: BookOpen,  color: P.green   },
};

const SENTENCE_CFG = {
    Matched:  { color: P.red,    bg: 'rgba(239,68,68,0.10)',   label: 'Matched'  },
    Partial:  { color: P.yellow, bg: 'rgba(245,158,11,0.10)',  label: 'Partial'  },
    Original: { color: P.green,  bg: P.greenSoft,              label: 'Original' },
};

const HIGHLIGHT_CFG = {
    exact:       { color: P.red,    bg: 'rgba(239,68,68,0.15)'  },
    paraphrased: { color: P.yellow, bg: 'rgba(245,158,11,0.15)' },
    original:    { color: P.green,  bg: 'rgba(16,185,129,0.10)' },
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skel({ h = 10, w = '100%', r = 10 }) {
    return <div className="animate-pulse" style={{ height: h, width: w, borderRadius: r, backgroundColor: P.soft }} />;
}

// ─── Gauge SVG ────────────────────────────────────────────────────────────────
function RiskGauge({ level = 'Medium' }) {
    const cfg    = RISK_CFG[level] || RISK_CFG.Medium;
    const pct    = cfg.gaugePct / 100; // 0–1
    // Semi-circle: angle from -180deg to 0deg
    const angle  = -180 + pct * 180; // degrees
    const rad    = (angle * Math.PI) / 180;
    const cx = 60, cy = 60, r = 44;
    const nx = cx + r * Math.cos(rad);
    const ny = cy + r * Math.sin(rad);

    return (
        <div className="flex flex-col items-center gap-1">
            <svg width={120} height={70} viewBox="0 0 120 70">
                {/* Background arc */}
                <path d="M 16 60 A 44 44 0 0 1 104 60" fill="none" stroke="#E2E8F0" strokeWidth={10} strokeLinecap="round" />
                {/* Colored arc segments */}
                <path d="M 16 60 A 44 44 0 0 1 37 24" fill="none" stroke={P.green}  strokeWidth={10} strokeLinecap="round" />
                <path d="M 37 24 A 44 44 0 0 1 60 16" fill="none" stroke={P.yellow} strokeWidth={10} strokeLinecap="round" />
                <path d="M 60 16 A 44 44 0 0 1 83 24" fill="none" stroke={P.orange} strokeWidth={10} strokeLinecap="round" />
                <path d="M 83 24 A 44 44 0 0 1 104 60" fill="none" stroke={P.red}   strokeWidth={10} strokeLinecap="round" />
                {/* Needle */}
                <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#1E293B" strokeWidth={3} strokeLinecap="round" />
                <circle cx={cx} cy={cy} r={5} fill="#1E293B" />
                <circle cx={cx} cy={cy} r={2} fill="#fff" />
                {/* Center icon */}
                <text x={cx} y={cy + 18} textAnchor="middle" style={{ fontFamily: T.fontFamily, fontSize: 11, fontWeight: 700, fill: cfg.color }}>
                    ⚠
                </text>
            </svg>
            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.black, color: cfg.color }}>
                {cfg.label}
            </span>
        </div>
    );
}

// ─── Score Ring ───────────────────────────────────────────────────────────────
function ScoreRing({ score, size = 80, color, icon: Icon, crossIcon = false }) {
    const r    = (size - 8) / 2;
    const circ = 2 * Math.PI * r;
    const dash = (score / 100) * circ;

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color + '22'} strokeWidth={7} />
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={7}
                    strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
                    style={{ transition: 'stroke-dasharray 0.8s ease' }} />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                {crossIcon
                    ? <span style={{ fontSize: 22, lineHeight: 1 }}>✗</span>
                    : Icon ? <Icon className="w-5 h-5" style={{ color }} /> : null}
            </div>
        </div>
    );
}

// ─── Highlighted text renderer ────────────────────────────────────────────────
function HighlightedText({ rawText, segments }) {
    if (!segments || segments.length === 0) {
        return <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#475569', lineHeight: 1.8 }}>{rawText}</p>;
    }

    let remaining = rawText;
    const parts   = [];
    let idx       = 0;

    segments.forEach((seg, i) => {
        const pos = remaining.indexOf(seg.text);
        if (pos === -1) {
            parts.push(<span key={`t-${i}`} style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#475569', lineHeight: 1.8 }}>{remaining}</span>);
            remaining = '';
            return;
        }
        if (pos > 0) {
            parts.push(<span key={`pre-${i}`} style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#475569', lineHeight: 1.8 }}>{remaining.slice(0, pos)}</span>);
        }
        const hcfg = HIGHLIGHT_CFG[seg.type] || HIGHLIGHT_CFG.original;
        parts.push(
            <mark key={`mark-${i}`} style={{ backgroundColor: hcfg.bg, color: hcfg.color, borderRadius: 4, padding: '0 3px', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, lineHeight: 1.8 }}>
                {seg.text}
            </mark>
        );
        remaining = remaining.slice(pos + seg.text.length);
        idx++;
    });

    if (remaining) {
        parts.push(<span key="tail" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#475569', lineHeight: 1.8 }}>{remaining}</span>);
    }

    return <p style={{ lineHeight: 1.8 }}>{parts}</p>;
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PlagiarismPage() {
    const [text, setText]             = useState('');
    const [fileName, setFileName]     = useState(null);
    const [fileBuffer, setFileBuffer] = useState(null);
    const [studentName, setStudentName] = useState('');
    const [subject, setSubject]       = useState('');
    const [assignmentTitle, setAssignmentTitle] = useState('');

    const [loading, setLoading]       = useState(false);
    const [result, setResult]         = useState(null);
    const [copied, setCopied]         = useState(false);

    const fileRef = useRef(null);

    // ── File pick ─────────────────────────────────────────────────────
    const handleFile = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setFileName(file.name);
        setFileBuffer(file);
        setAssignmentTitle(file.name.replace(/\.[^.]+$/, ''));
        toast.success(`File loaded: ${file.name}`);
    };

    // ── Check plagiarism ──────────────────────────────────────────────
    const handleCheck = async () => {
        if (!text.trim() && !fileBuffer) return toast.error('Please paste text or upload a file');

        setLoading(true);
        setResult(null);

        try {
            const formData = new FormData();
            if (fileBuffer) {
                formData.append('file', fileBuffer);
            } else {
                formData.append('text', text);
            }
            if (studentName)    formData.append('studentName', studentName);
            if (subject)        formData.append('subject', subject);
            if (assignmentTitle)formData.append('assignmentTitle', assignmentTitle);

            const res = await api.post('/ai/plagiarism-check', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (res.data?.success) {
                setResult(res.data.result);
                toast.success('Plagiarism check complete!');
            } else {
                toast.error('Check failed. Please retry.');
            }
        } catch (err) {
            toast.error(err?.response?.data?.message || 'AI failed. Please retry.');
        } finally {
            setLoading(false);
        }
    };

    const handleRecheck = () => { setResult(null); handleCheck(); };

    const risk    = result ? (RISK_CFG[result.riskLevel] || RISK_CFG.Medium) : null;
    const plagPct = result?.plagiarismScore ?? 0;
    const origPct = result?.originalScore  ?? 0;

    // ─────────────────────────────────────────────────────────────────
    return (
        <div className="flex flex-col h-full overflow-y-auto custom-scrollbar"
            style={{ fontFamily: T.fontFamily, backgroundColor: P.pageBg, padding: 16, gap: 16 }}>

            {/* ── TOP BAR ───────────────────────────────────────────────── */}
            <div className="flex items-center gap-3 p-4 rounded-2xl"
                style={{ backgroundColor: '#fff', border: `1px solid ${P.border}`, boxShadow: S.card }}>

                {/* Upload button */}
                <button onClick={() => fileRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all hover:opacity-80 flex-shrink-0"
                    style={{ background: P.gradient, boxShadow: `0 2px 8px rgba(124,58,237,0.30)` }}>
                    <Upload className="w-4 h-4 text-white" />
                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#fff' }}>UPLOAD ASSIGNMENT</span>
                </button>
                <input ref={fileRef} type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={handleFile} />

                {/* File name */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl flex-1 min-w-0"
                    style={{ backgroundColor: P.soft, border: `1px solid ${P.border}` }}>
                    <FileText className="w-4 h-4 flex-shrink-0" style={{ color: P.primary }} />
                    <span className="truncate" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#334155' }}>
                        {fileName || 'No file selected — or paste text below'}
                    </span>
                </div>

                {/* Check button */}
                <button onClick={handleCheck} disabled={loading || (!text.trim() && !fileBuffer)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all disabled:opacity-50 hover:opacity-90 flex-shrink-0"
                    style={{ background: P.gradient, boxShadow: `0 2px 10px rgba(124,58,237,0.35)` }}>
                    {loading ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Sparkles className="w-4 h-4 text-white" />}
                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#fff' }}>
                        {loading ? 'Checking…' : '🔍 Check Plagiarism'}
                    </span>
                </button>

                {/* Report info */}
                {result && (
                    <div className="flex-shrink-0 text-right">
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: '#1E293B' }}>
                            Report ID: #{result.reportId}
                        </p>
                        <p style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#94A3B8' }}>
                            Scanned on: {result.scannedOn}
                        </p>
                    </div>
                )}
            </div>

            {/* Text input — if no file */}
            {!fileBuffer && (
                <div className="rounded-2xl p-4"
                    style={{ backgroundColor: '#fff', border: `1px solid ${P.border}`, boxShadow: S.card }}>
                    <div className="grid grid-cols-3 gap-3 mb-3">
                        <div>
                            <label style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#94A3B8', fontWeight: T.weight.semibold }}>Student Name</label>
                            <input value={studentName} onChange={e => setStudentName(e.target.value)} placeholder="e.g. Avinash Kumar"
                                className="w-full px-3 py-2 rounded-xl outline-none mt-1"
                                style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#334155', border: `1px solid ${P.border}`, backgroundColor: P.soft }} />
                        </div>
                        <div>
                            <label style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#94A3B8', fontWeight: T.weight.semibold }}>Subject</label>
                            <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Physics"
                                className="w-full px-3 py-2 rounded-xl outline-none mt-1"
                                style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#334155', border: `1px solid ${P.border}`, backgroundColor: P.soft }} />
                        </div>
                        <div>
                            <label style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#94A3B8', fontWeight: T.weight.semibold }}>Assignment Title</label>
                            <input value={assignmentTitle} onChange={e => setAssignmentTitle(e.target.value)} placeholder="e.g. Newton's Laws"
                                className="w-full px-3 py-2 rounded-xl outline-none mt-1"
                                style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#334155', border: `1px solid ${P.border}`, backgroundColor: P.soft }} />
                        </div>
                    </div>
                    <textarea value={text} onChange={e => setText(e.target.value)}
                        placeholder="Paste the student's assignment text here to check for plagiarism…"
                        rows={4} className="w-full resize-none outline-none px-4 py-3 rounded-xl"
                        style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: '#334155', border: `1px solid ${P.border}`, backgroundColor: P.soft, lineHeight: 1.7 }} />
                </div>
            )}

            {/* Loading */}
            {loading && (
                <div className="flex flex-col items-center justify-center py-12 rounded-2xl"
                    style={{ backgroundColor: '#fff', border: `1px solid ${P.border}`, boxShadow: S.card }}>
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                        style={{ background: P.gradient, boxShadow: `0 8px 24px rgba(124,58,237,0.35)` }}>
                        <Shield className="w-8 h-8 text-white animate-pulse" />
                    </div>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.md, fontWeight: T.weight.black, color: '#1E293B', marginBottom: 4 }}>
                        AI is scanning for plagiarism…
                    </p>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#94A3B8' }}>Powered by Groq · usually 5–10s</p>
                    <div className="flex gap-1.5 mt-4">
                        {[0,1,2].map(i => (
                            <span key={i} className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: P.primary, animation: `plg-b 1.2s ease-in-out ${i*0.2}s infinite` }} />
                        ))}
                        <style>{`@keyframes plg-b{0%,80%,100%{transform:translateY(0);opacity:.4}40%{transform:translateY(-5px);opacity:1}}`}</style>
                    </div>
                </div>
            )}

            {/* ── RESULT ────────────────────────────────────────────────── */}
            {result && !loading && (
                <>
                    {/* Stats row */}
                    <div className="grid grid-cols-4 gap-4">
                        {/* Plagiarism Score */}
                        <div className="p-4 rounded-2xl flex items-center gap-3"
                            style={{ backgroundColor: '#fff', border: `1px solid ${P.border}`, boxShadow: S.card }}>
                            <div>
                                <div className="flex items-center gap-1.5 mb-1">
                                    <AlertCircle className="w-4 h-4" style={{ color: P.red }} />
                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: '#1E293B' }}>Plagiarism Score</p>
                                    <span style={{ color: P.red, fontSize: 14 }}>!</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <ScoreRing score={plagPct} size={56} color={P.red} crossIcon />
                                    <div>
                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.black, color: P.red }}>{plagPct}%</p>
                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: P.red, fontWeight: T.weight.semibold }}>
                                            {result.riskLevel} Risk
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Original Content */}
                        <div className="p-4 rounded-2xl flex items-center gap-3"
                            style={{ backgroundColor: '#fff', border: `1px solid ${P.border}`, boxShadow: S.card }}>
                            <div>
                                <div className="flex items-center gap-1.5 mb-1">
                                    <CheckCircle2 className="w-4 h-4" style={{ color: P.green }} />
                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: '#1E293B' }}>Original Content</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <ScoreRing score={origPct} size={56} color={P.green} icon={CheckCircle2} />
                                    <div>
                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.black, color: P.green }}>{origPct}%</p>
                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: P.green, fontWeight: T.weight.semibold }}>Good Work</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sources Found */}
                        <div className="p-4 rounded-2xl"
                            style={{ backgroundColor: '#fff', border: `1px solid ${P.border}`, boxShadow: S.card }}>
                            <div className="flex items-center gap-1.5 mb-2">
                                <Globe className="w-4 h-4" style={{ color: P.primary }} />
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: '#1E293B' }}>Sources Found</p>
                            </div>
                            <p style={{ fontFamily: T.fontFamily, fontSize: '42px', fontWeight: T.weight.black, color: P.primary, lineHeight: 1 }}>
                                {result.sourcesFound}
                            </p>
                            <p style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#94A3B8', marginTop: 4 }}>Web + Documents</p>
                        </div>

                        {/* Risk Level gauge */}
                        <div className="p-4 rounded-2xl"
                            style={{ backgroundColor: '#fff', border: `1px solid ${P.border}`, boxShadow: S.card }}>
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-1.5">
                                    <AlertTriangle className="w-4 h-4" style={{ color: risk?.color || P.yellow }} />
                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: '#1E293B' }}>Risk Level</p>
                                </div>
                                <button className="p-1 rounded-lg hover:opacity-70">
                                    <MoreHorizontal className="w-3.5 h-3.5" style={{ color: '#94A3B8' }} />
                                </button>
                            </div>
                            <RiskGauge level={result.riskLevel} />
                        </div>
                    </div>

                    {/* Main 3-col grid */}
                    <div className="grid grid-cols-3 gap-4">

                        {/* LEFT — Submitted Content */}
                        <div className="rounded-2xl overflow-hidden"
                            style={{ backgroundColor: '#fff', border: `1px solid ${P.border}`, boxShadow: S.card }}>
                            <div className="flex items-center justify-between px-4 py-3"
                                style={{ borderBottom: `1px solid ${P.border}`, background: `linear-gradient(135deg,${P.soft},rgba(255,255,255,0))` }}>
                                <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4" style={{ color: P.primary }} />
                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#1E293B' }}>Submitted Content</p>
                                </div>
                                <button className="p-1 rounded-lg hover:opacity-70">
                                    <MoreHorizontal className="w-4 h-4" style={{ color: '#94A3B8' }} />
                                </button>
                            </div>

                            <div className="p-4">
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#1E293B', marginBottom: 10 }}>
                                    {result.assignmentTitle}
                                </p>

                                {/* Highlighted text */}
                                <div className="mb-4 max-h-52 overflow-y-auto custom-scrollbar pr-1">
                                    <HighlightedText
                                        rawText={result.rawText}
                                        segments={result.highlightedSegments || []} />
                                </div>

                                {/* Legend */}
                                <div className="flex items-center gap-3 mb-4">
                                    {[
                                        { label: 'Exact Match',  color: P.red    },
                                        { label: 'Paraphrased',  color: P.yellow },
                                        { label: 'Original',     color: P.green  },
                                    ].map(item => (
                                        <div key={item.label} className="flex items-center gap-1.5">
                                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                                            <span style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#64748B' }}>{item.label}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Similarity heatmap */}
                                <div>
                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: '#1E293B', marginBottom: 8 }}>
                                        Similarity Heatmap
                                    </p>
                                    <div className="flex rounded-full overflow-hidden" style={{ height: 16 }}>
                                        <div style={{ width: `${result.exactMatchScore}%`,   backgroundColor: P.red,    minWidth: result.exactMatchScore > 0 ? 4 : 0 }} />
                                        <div style={{ width: `${result.paraphrasedScore}%`,  backgroundColor: P.yellow, minWidth: result.paraphrasedScore > 0 ? 4 : 0 }} />
                                        <div style={{ width: `${result.originalScore}%`,     backgroundColor: P.green,  minWidth: 4 }} />
                                    </div>
                                    <div className="flex justify-between mt-1.5">
                                        <span style={{ fontFamily: T.fontFamily, fontSize: '10px', color: P.red,    fontWeight: T.weight.bold }}>{result.exactMatchScore}% Plagiarized</span>
                                        <span style={{ fontFamily: T.fontFamily, fontSize: '10px', color: P.yellow, fontWeight: T.weight.bold }}>{result.paraphrasedScore}% Paraphrased</span>
                                        <span style={{ fontFamily: T.fontFamily, fontSize: '10px', color: P.green,  fontWeight: T.weight.bold }}>{result.originalScore}% Original</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* CENTER — Source Matches */}
                        <div className="rounded-2xl overflow-hidden"
                            style={{ backgroundColor: '#fff', border: `1px solid ${P.border}`, boxShadow: S.card }}>
                            <div className="flex items-center justify-between px-4 py-3"
                                style={{ borderBottom: `1px solid ${P.border}`, background: `linear-gradient(135deg,${P.soft},rgba(255,255,255,0))` }}>
                                <div className="flex items-center gap-2">
                                    <Globe className="w-4 h-4" style={{ color: P.primary }} />
                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#1E293B' }}>Source Matches</p>
                                </div>
                                <button className="p-1 rounded-lg hover:opacity-70">
                                    <MoreHorizontal className="w-4 h-4" style={{ color: '#94A3B8' }} />
                                </button>
                            </div>

                            <div className="p-4 space-y-3">
                                {(result.sources || []).map((src, i) => {
                                    const scfg = SOURCE_ICON_CFG[src.type] || SOURCE_ICON_CFG.Web;
                                    const Icon = scfg.icon;
                                    return (
                                        <div key={i} className="p-3 rounded-xl"
                                            style={{ backgroundColor: P.soft, border: `1px solid ${P.border}` }}>
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                                                        style={{ backgroundColor: scfg.color + '15' }}>
                                                        <Icon className="w-3.5 h-3.5" style={{ color: scfg.color }} />
                                                    </div>
                                                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: '#1E293B' }}>
                                                        {src.name}
                                                    </span>
                                                </div>
                                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.black, color: src.matchPercent >= 15 ? P.red : src.matchPercent >= 8 ? P.yellow : P.green }}>
                                                    {src.matchPercent}% Match
                                                </span>
                                            </div>
                                            <p style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#94A3B8', marginLeft: 34 }}>{src.url}</p>
                                            {src.uploadedDate && (
                                                <p style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#CBD5E1', marginLeft: 34 }}>Uploaded: {src.uploadedDate}</p>
                                            )}
                                            <div className="flex items-center gap-2 mt-2 ml-9">
                                                <button className="flex items-center gap-1 px-2 py-1 rounded-lg hover:opacity-70"
                                                    style={{ backgroundColor: P.primary + '15', border: `1px solid ${P.border}` }}>
                                                    <ExternalLink className="w-2.5 h-2.5" style={{ color: P.primary }} />
                                                    <span style={{ fontFamily: T.fontFamily, fontSize: '9px', fontWeight: T.weight.bold, color: P.primary }}>View Source</span>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Matching Sources list */}
                                <div className="mt-2 pt-3" style={{ borderTop: `1px solid ${P.border}` }}>
                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.black, color: '#1E293B', marginBottom: 6 }}>
                                        Matching Sources:
                                    </p>
                                    {(result.sources || []).slice(0, 3).map((src, i) => (
                                        <div key={i} className="flex items-center gap-2 mb-1.5">
                                            <div className="w-2 h-2 rounded-full flex-shrink-0"
                                                style={{ backgroundColor: i === 0 ? P.red : i === 1 ? P.yellow : P.green }} />
                                            <span style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#475569' }}>
                                                {i + 1}. {src.name} –{' '}
                                                <strong style={{ color: i === 0 ? P.red : i === 1 ? P.yellow : P.green }}>
                                                    {src.matchPercent}%
                                                </strong>
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Save / Share */}
                            <div className="flex items-center gap-2 px-4 py-3"
                                style={{ borderTop: `1px solid ${P.border}` }}>
                                <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl hover:opacity-80 flex-1"
                                    style={{ backgroundColor: P.soft, border: `1px solid ${P.border}` }}>
                                    <Save className="w-3.5 h-3.5" style={{ color: P.primary }} />
                                    <span style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: P.primary }}>Save to Course</span>
                                </button>
                                <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl hover:opacity-80 flex-1"
                                    style={{ backgroundColor: P.soft, border: `1px solid ${P.border}` }}>
                                    <Share2 className="w-3.5 h-3.5" style={{ color: P.primary }} />
                                    <span style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: P.primary }}>Share to Student</span>
                                </button>
                            </div>
                        </div>

                        {/* RIGHT — AI Analysis */}
                        <div className="rounded-2xl overflow-hidden"
                            style={{ backgroundColor: '#fff', border: `1px solid ${P.border}`, boxShadow: S.card }}>
                            <div className="flex items-center justify-between px-4 py-3"
                                style={{ borderBottom: `1px solid ${P.border}`, background: `linear-gradient(135deg,${P.soft},rgba(255,255,255,0))` }}>
                                <div className="flex items-center gap-2">
                                    <Brain className="w-4 h-4" style={{ color: P.primary }} />
                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#1E293B' }}>AI Analysis</p>
                                </div>
                                <button className="p-1 rounded-lg hover:opacity-70">
                                    <MoreHorizontal className="w-4 h-4" style={{ color: '#94A3B8' }} />
                                </button>
                            </div>

                            <div className="p-4 overflow-y-auto custom-scrollbar" style={{ maxHeight: 480 }}>
                                {/* Sentence by sentence */}
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.black, color: '#1E293B', marginBottom: 10 }}>
                                    Sentence by Sentence
                                </p>
                                <div className="space-y-2 mb-4">
                                    {(result.sentences || []).map((sent, i) => {
                                        const scfg = SENTENCE_CFG[sent.status] || SENTENCE_CFG.Original;
                                        return (
                                            <div key={i} className="flex items-start gap-2">
                                                <span style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#94A3B8', fontWeight: T.weight.bold, minWidth: 16, marginTop: 2 }}>{i + 1}</span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="truncate" style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#475569' }}>
                                                        {sent.text}…
                                                    </p>
                                                </div>
                                                <span className="px-2 py-0.5 rounded-full flex-shrink-0"
                                                    style={{ backgroundColor: scfg.bg, fontFamily: T.fontFamily, fontSize: '9px', fontWeight: T.weight.black, color: scfg.color }}>
                                                    {sent.status}{sent.matchPercent ? ` (${sent.matchPercent}%)` : ''}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* AI Suggestions */}
                                <div className="flex items-center justify-between mb-2">
                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.black, color: '#1E293B' }}>
                                        AI Suggestions
                                    </p>
                                    <button className="flex items-center gap-1 px-2 py-1 rounded-lg"
                                        style={{ background: P.gradient }}>
                                        <Sparkles className="w-2.5 h-2.5 text-white" />
                                        <span style={{ fontFamily: T.fontFamily, fontSize: '9px', fontWeight: T.weight.black, color: '#fff' }}>Rewrite with AI</span>
                                    </button>
                                </div>
                                <div className="space-y-2 mb-4">
                                    {(result.aiSuggestions || []).map((sug, i) => (
                                        <div key={i} className="p-2.5 rounded-xl"
                                            style={{ backgroundColor: i === 0 ? P.redSoft : P.soft, border: `1px solid ${i === 0 ? P.red + '25' : P.border}` }}>
                                            <div className="flex items-start gap-1.5">
                                                <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                                                    style={{ backgroundColor: i === 0 ? P.red : P.primary }} />
                                                <p style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#475569', lineHeight: 1.5 }}>
                                                    <strong style={{ color: i === 0 ? P.red : P.primary }}>{sug.type}: </strong>
                                                    {sug.original && <span>"{sug.original.slice(0, 30)}…" → </span>}
                                                    {sug.suggestion}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Student Report Preview */}
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.black, color: '#1E293B', marginBottom: 10 }}>
                                    Student Report Preview
                                </p>
                                <div className="p-3 rounded-xl flex items-center gap-3 mb-3"
                                    style={{ backgroundColor: P.soft, border: `1px solid ${P.border}` }}>
                                    {/* Grade circle */}
                                    <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                                        style={{ border: `3px solid ${P.primary}`, backgroundColor: '#fff' }}>
                                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: P.primary }}>
                                            {result.grade}
                                        </span>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#64748B' }}>Plagiarism</span>
                                            <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#94A3B8' }}>{result.studentName}</span>
                                        </div>
                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.black, color: P.red }}>{plagPct}%</p>
                                        <span className="px-2 py-0.5 rounded-full"
                                            style={{ backgroundColor: plagPct > 40 ? P.redSoft : 'rgba(245,158,11,0.10)', fontFamily: T.fontFamily, fontSize: '9px', fontWeight: T.weight.black, color: plagPct > 40 ? P.red : P.yellow }}>
                                            {result.verdict}
                                        </span>
                                    </div>
                                </div>

                                {/* Action buttons */}
                                <div className="flex gap-2">
                                    <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl hover:opacity-80 flex-1"
                                        style={{ backgroundColor: P.soft, border: `1px solid ${P.border}` }}>
                                        <Save className="w-3.5 h-3.5" style={{ color: P.primary }} />
                                        <span style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: P.primary }}>Save to Course</span>
                                    </button>
                                    <button onClick={handleRecheck} disabled={loading}
                                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl hover:opacity-80 flex-1"
                                        style={{ background: P.gradient }}>
                                        <RefreshCw className="w-3.5 h-3.5 text-white" />
                                        <span style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.black, color: '#fff' }}>Re-Check</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Empty state */}
            {!result && !loading && (
                <div className="flex flex-col items-center justify-center py-16 rounded-2xl"
                    style={{ backgroundColor: '#fff', border: `1px solid ${P.border}`, boxShadow: S.card }}>
                    <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-4"
                        style={{ background: P.gradient, boxShadow: `0 8px 32px rgba(124,58,237,0.30)` }}>
                        <Shield className="w-10 h-10 text-white" />
                    </div>
                    <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.black, color: '#1E293B', marginBottom: 8 }}>
                        Plagiarism Insight
                    </h3>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: '#94A3B8', maxWidth: 360, textAlign: 'center', lineHeight: 1.6 }}>
                        Upload a DOCX/PDF file or paste student text above, then click <strong style={{ color: P.primary }}>Check Plagiarism</strong> to get an AI-powered analysis.
                    </p>
                    <div className="flex items-center gap-2 mt-4 px-4 py-2.5 rounded-xl"
                        style={{ backgroundColor: P.soft, border: `1px solid ${P.border}` }}>
                        <Sparkles className="w-4 h-4" style={{ color: P.primary }} />
                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: P.primary, fontWeight: T.weight.semibold }}>
                            Powered by Groq AI · llama-3.3-70b-versatile
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}