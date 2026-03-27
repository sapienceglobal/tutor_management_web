'use client';

import { useState, useRef, useEffect } from 'react';
import {
    Search, Bot, Send, Plus, Trash2,
    MessageSquare, Menu, X, Loader2, FileText,
    ChevronDown, Sparkles, GraduationCap
} from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { C, T, S } from '@/constants/studentTokens';

// Sidebar dark bg — intentionally separate (AI page has dark sidebar)
const SIDEBAR_BG = '#2D2B7A';

// ─── Action cards config ──────────────────────────────────────────────────────
const ACTION_CARDS = [
    { title: 'Explain',    subtitle: "Newton's Laws", icon: '🍎', from: '#ddd6fe', to: '#a5b4fc' },
    { title: 'Generate',   subtitle: 'Quiz',          icon: '📝', from: '#a5b4fc', to: '#7dd3fc' },
    { title: 'Summarize',  subtitle: 'Chapter',       icon: '📄', from: '#fde68a', to: '#fcd34d' },
    { title: 'Solve Math', subtitle: 'Problem',       icon: '❓', from: '#6ee7b7', to: '#86efac' },
    { title: 'Create',     subtitle: 'Flashcards',    icon: '📇', from: '#7dd3fc', to: '#60a5fa' },
    { title: 'Prepare',    subtitle: 'Exam Plan',     icon: '📋', from: '#fca5a5', to: '#f9a8d4' },
];

// ─── Typing dots ──────────────────────────────────────────────────────────────
function TypingDots() {
    return (
        <div className="flex items-center gap-1 py-1">
            {[0, 0.15, 0.3].map((d, i) => (
                <div key={i} className="w-2 h-2 rounded-full animate-bounce"
                    style={{ backgroundColor: C.btnPrimary, opacity: 0.4, animationDelay: `${d}s` }} />
            ))}
        </div>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AITutorPage() {
    const [sessions, setSessions]               = useState([]);
    const [activeSessionId, setActiveSessionId] = useState(null);
    const [courses, setCourses]                 = useState([]);
    const [selectedCourse, setSelectedCourse]   = useState('');
    const [question, setQuestion]               = useState('');
    const [messages, setMessages]               = useState([]);
    const [isLoading, setIsLoading]             = useState(false);
    const [isSidebarOpen, setIsSidebarOpen]     = useState(false);

    const messagesEndRef = useRef(null);
    const inputRef       = useRef(null);

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const courseRes = await api.get('/enrollments/my-enrollments');
                setCourses(courseRes.data.enrollments?.map(e => ({
                    _id: e.courseId._id, title: e.courseId.title,
                })) || []);
                fetchSessions();
            } catch (err) { console.error(err); }
        };
        fetchInitialData();
    }, []);

    const fetchSessions = async () => {
        try {
            const res = await api.get('/ai/chat-sessions');
            if (res.data.success) setSessions(res.data.sessions);
        } catch (err) { console.error(err); }
    };

    const loadSession = async (sessionId) => {
        try {
            setActiveSessionId(sessionId);
            const res = await api.get(`/ai/chat-sessions/${sessionId}`);
            if (res.data.success) {
                setMessages(res.data.session.messages || []);
                setSelectedCourse(res.data.session.courseId?._id || '');
                if (window.innerWidth < 768) setIsSidebarOpen(false);
            }
        } catch { toast.error('Failed to load chat history'); }
    };

    const createNewSession = () => {
        setActiveSessionId(null);
        setMessages([]);
        setQuestion('');
        if (window.innerWidth < 768) setIsSidebarOpen(false);
    };

    const deleteSession = async (e, sessionId) => {
        e.stopPropagation();
        try {
            await api.delete(`/ai/chat-sessions/${sessionId}`);
            setSessions(prev => prev.filter(s => s._id !== sessionId));
            if (activeSessionId === sessionId) createNewSession();
            toast.success('Chat deleted');
        } catch { toast.error('Failed to delete chat'); }
    };

    const handleSubmit = async (e, overrideQuestion = null) => {
        if (e) e.preventDefault();
        const text = (overrideQuestion || question).trim();
        if (!text || isLoading) return;

        const tempMsg = { _id: Date.now().toString(), role: 'user', content: text, timestamp: new Date() };
        setMessages(prev => [...prev, tempMsg]);
        setQuestion('');
        setIsLoading(true);

        try {
            let sid = activeSessionId;
            if (!sid) {
                const createRes = await api.post('/ai/chat-sessions', { courseId: selectedCourse || undefined });
                sid = createRes.data.session._id;
                setActiveSessionId(sid);
            }
            const res = await api.post(`/ai/chat-sessions/${sid}/message`, { message: text });
            if (res.data.success) {
                setMessages(prev => [...prev, res.data.reply]);
                fetchSessions();
            }
        } catch {
            setMessages(prev => [...prev, {
                _id: Date.now() + 'err', role: 'assistant',
                content: 'Sorry, I encountered an error. Please try again.',
                timestamp: new Date(),
            }]);
        } finally { setIsLoading(false); }
    };

    const formatMessageWithCitations = (content, citations) => {
        if (!citations?.length) return content;
        let out = content;
        citations.forEach((_, i) => {
            out = out.replace(
                `[Source ${i + 1}]`,
                `<span style="display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;margin-left:4px;font-size:9px;font-weight:900;color:white;background-color:${C.btnPrimary};border-radius:9999px;cursor:pointer;">${i + 1}</span>`
            );
        });
        return out;
    };

    // ── Toolbar ───────────────────────────────────────────────────────────────
    const Toolbar = () => (
        <div className="w-full max-w-3xl flex items-center justify-between px-1 mb-2 flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
                {/* Model badge */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl shadow-sm"
                    style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.text }}>
                    <div className="w-4 h-4 rounded-lg flex items-center justify-center" style={{ backgroundColor: C.innerBg }}>
                        <MessageSquare className="w-2.5 h-2.5" style={{ color: C.btnPrimary }} />
                    </div>
                    GPT-4 <ChevronDown className="w-3 h-3" style={{ color: C.text, opacity: 0.4 }} />
                </div>

                {/* Course selector */}
                <div className="relative">
                    <FileText className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                        style={{ color: C.text, opacity: 0.4 }} />
                    <select value={selectedCourse}
                        onChange={e => { setSelectedCourse(e.target.value); if (activeSessionId) toast.success('Context updated'); }}
                        className="appearance-none pl-7 pr-7 py-1.5 rounded-xl focus:outline-none shadow-sm"
                        style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBorder}`, color: C.text, fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold }}>
                        <option value="">Ask from Course</option>
                        {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
                    </select>
                    <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
                        style={{ color: C.text, opacity: 0.4 }} />
                </div>
            </div>

            {/* Sapience AI badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-white shadow-sm"
                style={{ background: C.gradientBtn, fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold }}>
                <Sparkles className="w-3 h-3" />
                Sapience AI
            </div>
        </div>
    );

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden relative"
            style={{ backgroundColor: C.pageBg, fontFamily: T.fontFamily }}>

            {/* Mobile backdrop */}
            {isSidebarOpen && (
                <div className="fixed inset-0 bg-black/25 z-40 md:hidden backdrop-blur-sm"
                    onClick={() => setIsSidebarOpen(false)} />
            )}

            {/* ══ SIDEBAR ═════════════════════════════════════════════════ */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-72 flex flex-col transition-transform duration-300 ease-in-out
                md:relative md:translate-x-0
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `} style={{ backgroundColor: SIDEBAR_BG, borderRight: '1px solid rgba(255,255,255,0.06)' }}>

                {/* Sidebar header */}
                <div className="p-4 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="flex items-center gap-2 flex-1">
                        <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                            style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}>
                            <GraduationCap className="w-4 h-4 text-white" />
                        </div>
                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#ffffff' }}>
                            Sapience AI
                        </span>
                    </div>
                    <button onClick={createNewSession}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl transition-colors"
                        style={{ backgroundColor: 'rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.80)', border: '1px solid rgba(255,255,255,0.12)', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.18)'; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.10)'; }}>
                        <Plus className="w-3.5 h-3.5" /> New Chat
                    </button>
                    <button className="md:hidden p-2 rounded-xl text-white/60"
                        style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
                        onClick={() => setIsSidebarOpen(false)}>
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Sessions list */}
                <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
                    <p style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.black, textTransform: 'uppercase', letterSpacing: T.tracking.widest, color: 'rgba(255,255,255,0.35)', paddingLeft: 8, marginBottom: 12 }}>
                        Chat History
                    </p>
                    {sessions.length === 0 && (
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontStyle: 'italic', color: 'rgba(255,255,255,0.30)', paddingLeft: 8 }}>
                            No earlier chats
                        </p>
                    )}
                    {sessions.map(session => (
                        <div key={session._id} onClick={() => loadSession(session._id)}
                            className="group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all"
                            style={activeSessionId === session._id
                                ? { backgroundColor: 'rgba(255,255,255,0.15)', color: 'white' }
                                : { color: 'rgba(255,255,255,0.60)' }}
                            onMouseEnter={e => { if (activeSessionId !== session._id) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; }}
                            onMouseLeave={e => { if (activeSessionId !== session._id) e.currentTarget.style.backgroundColor = 'transparent'; }}>
                            <div className="flex items-center gap-2.5 overflow-hidden flex-1">
                                <MessageSquare className="w-3.5 h-3.5 shrink-0"
                                    style={{ color: activeSessionId === session._id ? 'white' : 'rgba(255,255,255,0.45)' }} />
                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.medium }} className="truncate">
                                    {session.title}
                                </span>
                            </div>
                            <button onClick={e => deleteSession(e, session._id)}
                                className="opacity-0 group-hover:opacity-100 p-1 rounded-lg transition-all"
                                style={{ color: 'rgba(255,255,255,0.45)' }}
                                onMouseEnter={e => { e.currentTarget.style.color = C.danger; }}
                                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; }}>
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="h-12 flex items-center px-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <span style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.semibold, color: 'rgba(255,255,255,0.25)' }}>
                        Powered by Sapience LMS
                    </span>
                </div>
            </aside>

            {/* ══ MAIN CHAT AREA ══════════════════════════════════════════ */}
            <main className="flex-1 flex flex-col min-w-0 relative" style={{ backgroundColor: C.pageBg }}>

                {/* Mobile top bar */}
                <div className="md:hidden flex items-center px-4 py-3 sticky top-0 z-10"
                    style={{ backgroundColor: C.pageBg, borderBottom: `1px solid ${C.cardBorder}` }}>
                    <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-1 rounded-xl"
                        style={{ color: C.btnPrimary }}>
                        <Menu className="w-5 h-5" />
                    </button>
                    <div className="flex-1 text-center"
                        style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: C.heading }}>
                        Sapience AI
                    </div>
                    <div className="w-8" />
                </div>

                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto px-4 md:px-8 lg:px-16 pt-8 pb-52 relative">

                    {/* Background glow */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] pointer-events-none -z-10"
                        style={{ background: `radial-gradient(ellipse at center top, ${C.innerBg} 0%, transparent 70%)`, opacity: 0.7 }} />

                    {messages.length === 0 ? (
                        <>
                            {/* Welcome state */}
                            <div className="text-center mb-8">
                                <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-md"
                                    style={{ background: C.gradientBtn }}>
                                    <Sparkles className="w-7 h-7 text-white" />
                                </div>
                                <h1 style={{ fontFamily: T.fontFamily, fontSize: T.size['2xl'], fontWeight: T.weight.black, color: C.heading, marginBottom: 4 }}>
                                    Sapience AI Tutor
                                </h1>
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.text, opacity: 0.5 }}>
                                    Ask questions, generate notes, solve problems instantly
                                </p>
                            </div>

                            {/* Welcome input */}
                            <div className="max-w-2xl mx-auto mb-8 w-full">
                                <div className="relative mb-4">
                                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4"
                                        style={{ color: C.text, opacity: 0.35 }} />
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        placeholder="Ask anything…"
                                        value={question}
                                        onChange={e => setQuestion(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') handleSubmit(e); }}
                                        className="w-full h-14 pl-12 pr-14 rounded-2xl focus:outline-none transition-all"
                                        style={{
                                            backgroundColor: C.surfaceWhite,
                                            border: `1.5px solid ${C.cardBorder}`,
                                            color: C.heading,
                                            boxShadow: S.card,
                                            fontFamily: T.fontFamily,
                                            fontSize: T.size.sm,
                                            fontWeight: T.weight.medium,
                                        }}
                                        onFocus={e => { e.currentTarget.style.borderColor = C.btnPrimary; e.currentTarget.style.boxShadow = `0 0 0 3px ${C.btnPrimary}20`; }}
                                        onBlur={e => { e.currentTarget.style.borderColor = C.cardBorder; e.currentTarget.style.boxShadow = S.card; }}
                                    />
                                    <button onClick={handleSubmit} disabled={!question.trim()}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center text-white rounded-xl transition-all disabled:opacity-40"
                                        style={{ background: C.gradientBtn }}>
                                        <Send className="w-4 h-4" />
                                    </button>
                                </div>
                                <Toolbar />
                            </div>

                            {/* Action cards */}
                            <div className="max-w-4xl mx-auto">
                                <p style={{ fontFamily: T.fontFamily, fontSize: '11px', fontWeight: T.weight.bold, textTransform: 'uppercase', letterSpacing: T.tracking.wider, color: C.text, opacity: 0.40, marginBottom: 12, paddingLeft: 4 }}>
                                    Quick Actions
                                </p>
                                <div className="flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory">
                                    {ACTION_CARDS.map((card, i) => (
                                        <button key={i}
                                            onClick={() => handleSubmit(null, `${card.title} ${card.subtitle}`.trim())}
                                            className="shrink-0 flex items-center gap-3 w-[148px] p-4 rounded-2xl border border-white/40 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all snap-start text-left group"
                                            style={{ background: `linear-gradient(135deg, ${card.from}, ${card.to})` }}>
                                            <div className="text-2xl drop-shadow-sm group-hover:scale-110 transition-transform">{card.icon}</div>
                                            <div className="flex flex-col leading-tight">
                                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.black, color: C.heading }}>{card.title}</span>
                                                <span style={{ fontFamily: T.fontFamily, fontSize: '11px', fontWeight: T.weight.semibold, color: C.text, opacity: 0.70 }}>{card.subtitle}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : (
                        /* Messages */
                        <div className="max-w-3xl mx-auto space-y-6">
                            {messages.map((msg, idx) => (
                                <div key={idx}>
                                    {msg.role === 'user' ? (
                                        <div className="flex justify-end">
                                            <div className="max-w-[80%]">
                                                <div className="px-5 py-3 rounded-2xl rounded-br-md text-white shadow-sm"
                                                    style={{ background: C.gradientBtn, fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.semibold }}>
                                                    {msg.content}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-start gap-3">
                                            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm mt-0.5"
                                                style={{ background: C.gradientBtn }}>
                                                <Bot className="w-4 h-4 text-white" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.black, color: C.heading }}>Sapience AI</span>
                                                    {msg.contextUsed && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full"
                                                            style={{ backgroundColor: C.innerBg, color: C.btnPrimary, border: `1px solid ${C.cardBorder}`, fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold }}>
                                                            <FileText className="w-2.5 h-2.5" /> RAG Used
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="rounded-2xl rounded-tl-md px-5 py-4 shadow-sm prose prose-sm max-w-none"
                                                    style={{ backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, color: C.text, fontFamily: T.fontFamily, fontSize: T.size.sm, lineHeight: T.leading.relaxed }}>
                                                    <div dangerouslySetInnerHTML={{
                                                        __html: formatMessageWithCitations(
                                                            msg.content.replace(/\n/g, '<br />'),
                                                            msg.citations
                                                        )
                                                    }} />
                                                </div>

                                                {/* Citations */}
                                                {msg.citations?.length > 0 && (
                                                    <div className="mt-2 space-y-1">
                                                        {msg.citations.map((c, ci) => (
                                                            <div key={ci} className="flex items-start gap-2 px-3 py-2 rounded-xl"
                                                                style={{ backgroundColor: C.innerBg, border: `1px solid ${C.cardBorder}` }}>
                                                                <span className="w-4 h-4 text-white rounded-full flex items-center justify-center shrink-0 mt-0.5"
                                                                    style={{ backgroundColor: C.btnPrimary, fontFamily: T.fontFamily, fontSize: '9px', fontWeight: T.weight.black }}>{ci + 1}</span>
                                                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.medium, color: C.btnPrimary }}>{c.text || c}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* Typing indicator */}
                            {isLoading && (
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                                        style={{ background: C.gradientBtn }}>
                                        <Bot className="w-4 h-4 text-white" />
                                    </div>
                                    <div className="rounded-2xl rounded-tl-md px-5 py-4 shadow-sm"
                                        style={{ backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}` }}>
                                        <TypingDots />
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>

                {/* Floating bottom input */}
                {messages.length > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 pt-3"
                        style={{ background: `linear-gradient(to top, ${C.pageBg} 70%, transparent)` }}>
                        <div className="max-w-3xl mx-auto">
                            <Toolbar />
                            <div className="flex items-center gap-2 rounded-2xl px-3 py-2 shadow-sm"
                                style={{ backgroundColor: C.surfaceWhite, border: `1.5px solid ${C.cardBorder}` }}>
                                <button className="p-2 rounded-xl transition-colors"
                                    style={{ color: C.text, opacity: 0.35 }}
                                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.innerBg; e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = C.btnPrimary; }}
                                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.opacity = '0.35'; e.currentTarget.style.color = C.text; }}>
                                    <Plus className="w-4 h-4" />
                                </button>
                                <input
                                    ref={inputRef}
                                    type="text"
                                    placeholder="Type a message…"
                                    value={question}
                                    onChange={e => setQuestion(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }}
                                    className="flex-1 bg-transparent focus:outline-none py-2 px-1"
                                    style={{ color: C.heading, fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.medium }}
                                />
                                <button onClick={handleSubmit} disabled={!question.trim() || isLoading}
                                    className="flex items-center gap-1.5 px-4 py-2 text-white rounded-xl transition-all disabled:opacity-40 shadow-sm"
                                    style={{ background: C.gradientBtn, fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold }}>
                                    {isLoading
                                        ? <Loader2 className="w-4 h-4 animate-spin" />
                                        : <><Send className="w-3.5 h-3.5" /> Send</>}
                                </button>
                            </div>
                            <p className="text-center mt-2"
                                style={{ fontFamily: T.fontFamily, fontSize: '11px', fontWeight: T.weight.medium, color: C.text, opacity: 0.35 }}>
                                Sapience AI can make mistakes. Verify important information.
                            </p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}