'use client';

import { useState, useRef, useEffect } from 'react';
import {
    Search, Bot, Send, Plus, Trash2, Mic,
    MessageSquare, Menu, X, Loader2, FileText,
    ChevronDown, ChevronRight, MoreHorizontal, Sparkles, GraduationCap
} from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';

// ─── Action cards config ──────────────────────────────────────────────────────
const ACTION_CARDS = [
    { title: 'Explain',      subtitle: "Newton's Laws", icon: '🍎', from: '#ddd6fe', to: '#a5b4fc' },
    { title: 'Generate',     subtitle: 'Quiz',          icon: '📝', from: '#a5b4fc', to: '#7dd3fc' },
    { title: 'Summarize',    subtitle: 'Chapter',       icon: '📄', from: '#fde68a', to: '#fcd34d' },
    { title: 'Solve Math',   subtitle: 'Problem',       icon: '❓', from: '#6ee7b7', to: '#86efac' },
    { title: 'Create',       subtitle: 'Flashcards',    icon: '📇', from: '#7dd3fc', to: '#60a5fa' },
    { title: 'Prepare',      subtitle: 'Exam Plan',     icon: '📋', from: '#fca5a5', to: '#f9a8d4' },
];

// ─── Typing dots ──────────────────────────────────────────────────────────────
function TypingDots() {
    return (
        <div className="flex items-center gap-1 py-1">
            {[0, 0.15, 0.3].map((d, i) => (
                <div key={i} className="w-2 h-2 rounded-full bg-[var(--theme-primary)]/20 animate-bounce"
                    style={{ animationDelay: `${d}s` }} />
            ))}
        </div>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AITutorPage() {
    const [sessions, setSessions]           = useState([]);
    const [activeSessionId, setActiveSessionId] = useState(null);
    const [courses, setCourses]             = useState([]);
    const [selectedCourse, setSelectedCourse] = useState('');
    const [question, setQuestion]           = useState('');
    const [messages, setMessages]           = useState([]);
    const [isLoading, setIsLoading]         = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [expandedCitations, setExpandedCitations] = useState({});

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

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
                `<span class="inline-flex items-center justify-center w-4 h-4 ml-1 text-[9px] font-black text-white bg-[var(--theme-primary)] rounded-full cursor-pointer hover:bg-[var(--theme-primary)] transition-colors">${i + 1}</span>`
            );
        });
        return out;
    };

    // ── Toolbar (GPT select + course RAG) ────────────────────────────────────
    const Toolbar = () => (
        <div className="w-full max-w-3xl flex items-center justify-between px-1 mb-2 flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
                {/* Model badge */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 shadow-sm">
                    <div className="w-4 h-4 bg-[var(--theme-primary)]/20 rounded-lg flex items-center justify-center">
                        <MessageSquare className="w-2.5 h-2.5 text-[var(--theme-primary)]" />
                    </div>
                    GPT-4 <ChevronDown className="w-3 h-3 text-slate-400" />
                </div>

                {/* Course RAG selector */}
                <div className="relative">
                    <FileText className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select value={selectedCourse}
                        onChange={e => { setSelectedCourse(e.target.value); if (activeSessionId) toast.success('Context updated'); }}
                        className="appearance-none pl-7 pr-7 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)] shadow-sm">
                        <option value="">Ask from Course</option>
                        {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
                    </select>
                    <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
            </div>

            {/* Sapience AI badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-sm"
                style={{ background: 'linear-gradient(135deg, var(--theme-sidebar), var(--theme-primary))' }}>
                <Sparkles className="w-3 h-3" />
                Sapience AI
            </div>
        </div>
    );

    return (
        <div className="flex h-[calc(100vh-64px)] bg-slate-50 overflow-hidden relative"
            style={{ fontFamily: "var(--theme-font, 'DM Sans', sans-serif)" }}>

            {/* ── Sidebar backdrop (mobile) ───────────────────────────── */}
            {isSidebarOpen && (
                <div className="fixed inset-0 bg-black/25 z-40 md:hidden backdrop-blur-sm"
                    onClick={() => setIsSidebarOpen(false)} />
            )}

            {/* ══════════════════════════════════════════════════════════
                SIDEBAR
            ══════════════════════════════════════════════════════════ */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-72 flex flex-col transition-transform duration-300 ease-in-out
                md:relative md:translate-x-0 border-r border-slate-200
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `} style={{ background: 'linear-gradient(180deg, var(--theme-sidebar) 0%, var(--theme-sidebar) 60%, var(--theme-sidebar) 100%)' }}>

                {/* Sidebar header */}
                <div className="p-4 flex items-center gap-2 border-b border-white/10">
                    <div className="flex items-center gap-2 flex-1">
                        <div className="w-7 h-7 bg-white/15 rounded-xl flex items-center justify-center shrink-0">
                            <GraduationCap className="w-4 h-4 text-[var(--theme-primary)]/70" />
                        </div>
                        <span className="text-sm font-black text-white">Sapience AI</span>
                    </div>
                    <button onClick={createNewSession}
                        className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/15 text-[var(--theme-primary)]/70 text-xs font-bold rounded-xl transition-colors">
                        <Plus className="w-3.5 h-3.5" /> New Chat
                    </button>
                    <button className="md:hidden p-2 bg-white/10 rounded-xl text-slate-300"
                        onClick={() => setIsSidebarOpen(false)}>
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Sessions list */}
                <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
                    <p className="text-[10px] font-bold text-[var(--theme-primary)]/70 uppercase tracking-[0.1em] px-2 mb-3">Chat History</p>
                    {sessions.length === 0 && (
                        <p className="text-xs text-[var(--theme-primary)]/70/60 px-2 italic">No earlier chats</p>
                    )}
                    {sessions.map(session => (
                        <div key={session._id} onClick={() => loadSession(session._id)}
                            className={`group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all
                                ${activeSessionId === session._id
                                    ? 'bg-white/15 text-white'
                                    : 'hover:bg-white/8 text-[var(--theme-primary)]/70 hover:text-[var(--theme-primary)]/70'}`}>
                            <div className="flex items-center gap-2.5 overflow-hidden flex-1">
                                <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${activeSessionId === session._id ? 'text-[var(--theme-primary)]/70' : 'text-[var(--theme-primary)]'}`} />
                                <span className="text-xs font-medium truncate">{session.title}</span>
                            </div>
                            <button onClick={e => deleteSession(e, session._id)}
                                className="opacity-0 group-hover:opacity-100 p-1 text-[var(--theme-primary)]/70 hover:text-red-400 transition-all rounded-lg hover:bg-white/10">
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))}
                </div>

                {/* Sidebar footer dot grid decoration */}
                <div className="h-16 relative overflow-hidden border-t border-white/10 flex items-center px-4">
                    <div className="absolute inset-0 opacity-[0.04]"
                        style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '12px 12px' }} />
                    <div className="relative text-[10px] font-semibold text-[var(--theme-primary)]/70/60">Powered by Sapience LMS</div>
                </div>
            </aside>

            {/* ══════════════════════════════════════════════════════════
                MAIN CHAT AREA
            ══════════════════════════════════════════════════════════ */}
            <main className="flex-1 flex flex-col min-w-0 relative bg-[var(--theme-background)]">

                {/* Mobile top bar */}
                <div className="md:hidden flex items-center px-4 py-3 border-b border-slate-200 bg-white sticky top-0 z-10">
                    <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-1 text-[var(--theme-primary)] rounded-xl">
                        <Menu className="w-5 h-5" />
                    </button>
                    <div className="flex-1 text-center text-sm font-black text-slate-800">Sapience AI</div>
                    <div className="w-8" />
                </div>

                {/* ── Scrollable content ────────────────────────────────── */}
                <div className="flex-1 overflow-y-auto px-4 md:px-8 lg:px-16 pt-8 pb-52 relative">

                    {/* Soft background glow */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] pointer-events-none -z-10"
                        style={{ background: 'radial-gradient(ellipse at center top, #e0e7ff 0%, transparent 70%)', opacity: 0.5 }} />

                    {messages.length === 0 ? (
                        /* ── Welcome / Empty state ──────────────────────── */
                        <>
                            <div className="text-center mb-8">
                                <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-md"
                                    style={{ background: 'linear-gradient(135deg, var(--theme-sidebar), var(--theme-primary))' }}>
                                    <Sparkles className="w-7 h-7 text-white" />
                                </div>
                                <h1 className="text-2xl font-black text-slate-800 mb-1">Sapience AI Tutor</h1>
                                <p className="text-sm text-slate-400 font-medium">Ask questions, generate notes, solve problems instantly</p>
                            </div>

                            {/* Welcome search input */}
                            <div className="max-w-2xl mx-auto mb-8 w-full">
                                <div className="relative mb-4">
                                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        placeholder="Ask anything…"
                                        value={question}
                                        onChange={e => setQuestion(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') handleSubmit(e); }}
                                        className="w-full h-14 pl-12 pr-14 rounded-2xl border border-slate-200 bg-white shadow-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent text-sm font-medium transition-all"
                                    />
                                    <button onClick={handleSubmit} disabled={!question.trim()}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center text-white rounded-xl transition-all disabled:opacity-40"
                                        style={{ background: 'linear-gradient(135deg, var(--theme-sidebar), var(--theme-primary))' }}>
                                        <Send className="w-4 h-4" />
                                    </button>
                                </div>
                                <Toolbar />
                            </div>

                            {/* Action cards */}
                            <div className="max-w-4xl mx-auto">
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.08em] mb-3 px-1">Quick Actions</p>
                                <div className="flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory">
                                    {ACTION_CARDS.map((card, i) => (
                                        <button key={i}
                                            onClick={() => handleSubmit(null, `${card.title} ${card.subtitle}`.trim())}
                                            className="shrink-0 flex items-center gap-3 w-[148px] p-4 rounded-2xl border border-white/40 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all snap-start text-left group"
                                            style={{ background: `linear-gradient(135deg, ${card.from}, ${card.to})` }}>
                                            <div className="text-2xl drop-shadow-sm group-hover:scale-110 transition-transform">{card.icon}</div>
                                            <div className="flex flex-col leading-tight">
                                                <span className="font-black text-xs text-slate-700">{card.title}</span>
                                                <span className="font-semibold text-[11px] text-slate-600">{card.subtitle}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : (
                        /* ── Messages ─────────────────────────────────────── */
                        <div className="max-w-3xl mx-auto space-y-6">
                            {messages.map((msg, idx) => (
                                <div key={idx}>
                                    {msg.role === 'user' ? (
                                        /* User bubble */
                                        <div className="flex justify-end">
                                            <div className="max-w-[80%] flex items-end gap-2">
                                                <div className="px-5 py-3 rounded-2xl rounded-br-md text-sm font-semibold text-white shadow-sm"
                                                    style={{ background: 'linear-gradient(135deg, var(--theme-sidebar), var(--theme-primary))' }}>
                                                    {msg.content}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        /* AI bubble */
                                        <div className="flex items-start gap-3">
                                            {/* AI avatar */}
                                            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm mt-0.5"
                                                style={{ background: 'linear-gradient(135deg, var(--theme-sidebar), var(--theme-primary))' }}>
                                                <Bot className="w-4 h-4 text-white" />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <span className="text-xs font-black text-slate-700">Sapience AI</span>
                                                    {msg.contextUsed && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[var(--theme-primary)]/20 text-[var(--theme-primary)] text-[10px] font-bold rounded-full border border-[var(--theme-primary)]/30">
                                                            <FileText className="w-2.5 h-2.5" /> RAG Used
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-md px-5 py-4 shadow-sm text-sm text-slate-700 leading-relaxed prose prose-sm max-w-none prose-headings:text-slate-800 prose-strong:text-slate-800 prose-ul:list-disc prose-p:leading-relaxed">
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
                                                            <div key={ci} className="flex items-start gap-2 px-3 py-2 bg-[var(--theme-primary)]/20/60 border border-[var(--theme-primary)]/30 rounded-xl text-xs">
                                                                <span className="w-4 h-4 bg-[var(--theme-primary)] text-white rounded-full flex items-center justify-center text-[9px] font-black shrink-0 mt-0.5">{ci + 1}</span>
                                                                <span className="text-[var(--theme-primary)] font-medium">{c.text || c}</span>
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
                                        style={{ background: 'linear-gradient(135deg, var(--theme-sidebar), var(--theme-primary))' }}>
                                        <Bot className="w-4 h-4 text-white" />
                                    </div>
                                    <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-md px-5 py-4 shadow-sm">
                                        <TypingDots />
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>

                {/* ── Floating bottom input (active chat) ───────────────── */}
                {messages.length > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 pt-3"
                        style={{ background: 'linear-gradient(to top, var(--theme-background) 70%, transparent)' }}>
                        <div className="max-w-3xl mx-auto">
                            <Toolbar />

                            {/* Input pill */}
                            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl px-3 py-2 shadow-sm">
                                <button className="p-2 text-slate-400 hover:text-[var(--theme-primary)] hover:bg-[var(--theme-primary)]/20 rounded-xl transition-colors">
                                    <Plus className="w-4 h-4" />
                                </button>

                                <input
                                    ref={inputRef}
                                    type="text"
                                    placeholder="Type a message…"
                                    value={question}
                                    onChange={e => setQuestion(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); }
                                    }}
                                    className="flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none font-medium py-2 px-1"
                                />

                                <button onClick={handleSubmit} disabled={!question.trim() || isLoading}
                                    className="flex items-center gap-1.5 px-4 py-2 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-40 shadow-sm"
                                    style={{ background: 'linear-gradient(135deg, var(--theme-sidebar), var(--theme-primary))' }}>
                                    {isLoading
                                        ? <Loader2 className="w-4 h-4 animate-spin" />
                                        : <><Send className="w-3.5 h-3.5" /> Send</>}
                                </button>
                            </div>

                            <p className="text-center text-[11px] text-slate-400 mt-2 font-medium">
                                Sapience AI can make mistakes. Verify important information.
                            </p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}