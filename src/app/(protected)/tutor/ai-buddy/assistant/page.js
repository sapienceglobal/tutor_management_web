'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
    Plus, Trash2, Bot, Send, Sparkles, FileText,
    ChevronDown, Loader2, Mic, RotateCcw, Bell,
    ClipboardList, BarChart2, FileStack,
    CheckSquare, ScanSearch, MessageSquare, Clock,
    MoreHorizontal, User
} from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { C, T, S } from '@/constants/tutorTokens';

const AI_TOOLS = [
    { label: 'Generate Quiz',       icon: ClipboardList, color: '#6366F1', bg: '#EEF2FF' },
    { label: 'Evaluate Assignment', icon: CheckSquare,   color: '#8B5CF6', bg: '#F5F3FF' },
    { label: 'Plagiarism Check',    icon: ScanSearch,    color: '#06B6D4', bg: '#ECFEFF' },
    { label: 'Create Report',       icon: FileStack,     color: '#10B981', bg: '#ECFDF5' },
];

const AI_CONTEXT_TOOLS = [
    { label: 'Generate Quiz',       icon: ClipboardList },
    { label: 'Evaluate Assignment', icon: CheckSquare },
    { label: 'Plagiarism Check',    icon: ScanSearch },
];

const BOTTOM_CHIPS = [
    { label: 'Generate Quiz',     icon: ClipboardList },
    { label: 'Summarize Lecture', icon: FileStack },
    { label: 'Create Assignment', icon: ClipboardList },
    { label: '« More »',          icon: MoreHorizontal },
];

const QUICK_PROMPTS = [
    'Create a 60-minute lesson plan for my next class.',
    'Generate a quiz blueprint with easy/medium/hard mix.',
    'Draft an announcement for upcoming assignment submission.',
    'Suggest 5 ways to increase classroom engagement.',
];

// ─── Typing dots ──────────────────────────────────────────────────────────────
function TypingDots() {
    return (
        <div className="flex items-center gap-1.5 px-4 py-3">
            {[0, 1, 2].map(i => (
                <span key={i} className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: '#6366F1', animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
            ))}
            <style>{`@keyframes bounce{0%,80%,100%{transform:translateY(0);opacity:.4}40%{transform:translateY(-6px);opacity:1}}`}</style>
        </div>
    );
}

// ─── Message bubble ───────────────────────────────────────────────────────────
function MessageBubble({ msg }) {
    const isUser = msg.role === 'user';
    const time = msg.timestamp
        ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : '';

    if (isUser) {
        return (
            <div className="flex justify-end items-end gap-2">
                <div>
                    <div className="max-w-[380px] px-5 py-3 rounded-2xl rounded-br-md whitespace-pre-wrap"
                        style={{ background: 'linear-gradient(135deg,#6366F1,#4F46E5)', color: '#fff', fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.medium, boxShadow: '0 4px 16px rgba(99,102,241,.30)' }}>
                        {msg.content}
                    </div>
                    {time && <p className="text-right mt-1" style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#94A3B8' }}>Delivered · {time}</p>}
                </div>
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mb-4"
                    style={{ background: 'linear-gradient(135deg,#6366F1,#4F46E5)' }}>
                    <User className="w-4 h-4 text-white" />
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-end gap-2">
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mb-4"
                style={{ background: 'linear-gradient(135deg,#4F46E5,#7C3AED)', boxShadow: '0 2px 8px rgba(99,102,241,.3)' }}>
                <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
                <p style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#94A3B8', marginBottom: 4 }}>AI</p>
                <div className="max-w-[400px] px-5 py-3 rounded-2xl rounded-bl-md whitespace-pre-wrap"
                    style={{ backgroundColor: '#fff', border: '1px solid rgba(99,102,241,.15)', boxShadow: '0 2px 12px rgba(0,0,0,.06)', fontFamily: T.fontFamily, fontSize: T.size.sm, color: '#1E293B', lineHeight: '1.6' }}>
                    <span style={{ fontWeight: T.weight.bold }}>{msg.content?.split(' ').slice(0, 1).join(' ')} </span>
                    {msg.content?.split(' ').slice(1).join(' ')}
                </div>
                {time && <p className="mt-1" style={{ fontFamily: T.fontFamily, fontSize: '10px', color: '#94A3B8' }}>Delivered · {time}</p>}
            </div>
        </div>
    );
}

// ─── Right panel — receives stats as prop ─────────────────────────────────────
function RightPanel({ onToolClick, stats }) {
    const [contextActive, setContextActive] = useState(0);

    return (
        <div className="flex flex-col gap-4 w-[260px] flex-shrink-0">
            {/* AI Tools */}
            <div className="rounded-2xl p-4"
                style={{ backgroundColor: '#fff', border: '1px solid rgba(99,102,241,.12)', boxShadow: '0 2px 16px rgba(99,102,241,.08)' }}>
                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: '#1E293B', marginBottom: 12 }}>AI Tools</p>
                <div className="space-y-2.5">
                    {AI_TOOLS.map(tool => {
                        const Icon = tool.icon;
                        return (
                            <button key={tool.label} onClick={() => onToolClick?.(tool.label)}
                                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all hover:opacity-90 hover:-translate-y-0.5"
                                style={{ background: `linear-gradient(135deg,${tool.color}22,${tool.color}15)`, border: `1px solid ${tool.color}25` }}>
                                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: tool.bg }}>
                                    <Icon className="w-3.5 h-3.5" style={{ color: tool.color }} />
                                </div>
                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: '#334155' }}>{tool.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* AI Context Mode */}
            <div className="rounded-2xl p-4"
                style={{ backgroundColor: '#fff', border: '1px solid rgba(99,102,241,.12)', boxShadow: '0 2px 16px rgba(99,102,241,.08)' }}>
                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: '#1E293B', marginBottom: 12 }}>AI Context Mode</p>
                <div className="space-y-2">
                    {AI_CONTEXT_TOOLS.map((tool, idx) => {
                        const Icon = tool.icon;
                        const isActive = contextActive === idx;
                        return (
                            <button key={tool.label} onClick={() => setContextActive(idx)}
                                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all"
                                style={isActive
                                    ? { background: 'linear-gradient(135deg,#6366F1,#4F46E5)', boxShadow: '0 4px 12px rgba(99,102,241,.35)' }
                                    : { backgroundColor: 'rgba(99,102,241,.06)', border: '1px solid rgba(99,102,241,.12)' }}>
                                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                                    style={{ backgroundColor: isActive ? 'rgba(255,255,255,.20)' : 'rgba(99,102,241,.10)' }}>
                                    <Icon className="w-3.5 h-3.5" style={{ color: isActive ? '#fff' : '#6366F1' }} />
                                </div>
                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: isActive ? '#fff' : '#475569' }}>
                                    {tool.label}
                                </span>
                                {isActive && <Sparkles className="w-3.5 h-3.5 ml-auto text-white/70" />}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Usage Stats — real data from props */}
            <div className="rounded-2xl p-4"
                style={{ backgroundColor: '#fff', border: '1px solid rgba(99,102,241,.12)', boxShadow: '0 2px 16px rgba(99,102,241,.08)' }}>
                <div className="flex items-center gap-2 mb-3">
                    <BarChart2 className="w-4 h-4" style={{ color: '#6366F1' }} />
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: '#1E293B' }}>Usage Stats</p>
                </div>
                <div className="space-y-3">
                    {[
                        { icon: MessageSquare, label: 'Conversations',     value: stats?.totalSessions  ?? '—', color: '#6366F1' },
                        { icon: CheckSquare,   label: 'Tasks Completed',   value: stats?.totalTasks     ?? '—', color: '#10B981' },
                        { icon: Clock,         label: 'Avg. Response Time',value: stats?.avgResponseTime ?? '—', color: '#F59E0B' },
                    ].map(stat => {
                        const Icon = stat.icon;
                        return (
                            <div key={stat.label} className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${stat.color}12` }}>
                                        <Icon className="w-3.5 h-3.5" style={{ color: stat.color }} />
                                    </div>
                                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#64748B' }}>{stat.label}</span>
                                </div>
                                <span style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#1E293B' }}>
                                    {stat.value}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AIAssistantChatPage() {
    const [sessions, setSessions]               = useState([]);
    const [activeSessionId, setActiveSessionId] = useState(null);
    const [messages, setMessages]               = useState([]);
    const [courses, setCourses]                 = useState([]);
    const [selectedCourse, setSelectedCourse]   = useState('');
    const [input, setInput]                     = useState('');
    const [sending, setSending]                 = useState(false);
    // ✅ stats state here
    const [stats, setStats]                     = useState(null);
    const endRef = useRef(null);

    const activeTitle = useMemo(() =>
        sessions.find(s => s._id === activeSessionId)?.title || 'New Chat',
        [sessions, activeSessionId]
    );

    useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, sending]);

    useEffect(() => {
        const init = async () => {
            try {
                const [courseRes, sessionRes, statsRes] = await Promise.all([
                    api.get('/courses/my-courses'),
                    api.get('/ai/chat-sessions'),
                    api.get('/ai/tutor-dashboard-stats'),   // ✅ fetch stats
                ]);
                if (courseRes.data?.success)
                    setCourses((courseRes.data.courses || []).map(c => ({ _id: c._id, title: c.title })));
                if (sessionRes.data?.success)
                    setSessions(sessionRes.data.sessions || []);
                if (statsRes.data?.success)
                    setStats(statsRes.data.stats);          // ✅ set stats
            } catch {
                toast.error('Failed to load AI Buddy');
            }
        };
        init();
    }, []);

    const refreshSessions = async () => {
        try {
            const res = await api.get('/ai/chat-sessions');
            if (res.data?.success) setSessions(res.data.sessions || []);
        } catch { /* silent */ }
    };

    const loadSession = async (id) => {
        try {
            const res = await api.get(`/ai/chat-sessions/${id}`);
            if (res.data?.success) {
                setActiveSessionId(id);
                setMessages(res.data.session?.messages || []);
                setSelectedCourse(res.data.session?.courseId?._id || '');
            }
        } catch { toast.error('Failed to load chat'); }
    };

    const createSession = () => { setActiveSessionId(null); setMessages([]); setInput(''); };

    const deleteSession = async (e, id) => {
        e.stopPropagation();
        try {
            await api.delete(`/ai/chat-sessions/${id}`);
            setSessions(prev => prev.filter(s => s._id !== id));
            if (activeSessionId === id) createSession();
        } catch { toast.error('Failed to delete chat'); }
    };

    const sendMessage = async (forcedText = null) => {
        const text = (forcedText || input).trim();
        if (!text || sending) return;
        const userMsg = { _id: `tmp-${Date.now()}`, role: 'user', content: text, timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setSending(true);
        try {
            let sid = activeSessionId;
            if (!sid) {
                const createRes = await api.post('/ai/chat-sessions', { courseId: selectedCourse || undefined, persona: 'tutor' });
                sid = createRes.data?.session?._id;
                setActiveSessionId(sid);
            }
            const res = await api.post(`/ai/chat-sessions/${sid}/message`, { message: text });
            if (res.data?.success) {
                setMessages(prev => [...prev, res.data.reply]);
                await refreshSessions();
            }
        } catch {
            setMessages(prev => [...prev, { _id: `err-${Date.now()}`, role: 'assistant', content: 'I could not respond right now. Please retry.', timestamp: new Date() }]);
        } finally { setSending(false); }
    };

    const handleToolClick = (toolName) => sendMessage(`Use the ${toolName} tool to help me.`);

    return (
        <div className="flex gap-4 h-full p-4" style={{ fontFamily: T.fontFamily, backgroundColor: C.pageBg }}>

            {/* Left: Chat history */}
            <div className="w-[200px] flex-shrink-0 rounded-2xl flex flex-col overflow-hidden"
                style={{ background: 'linear-gradient(160deg,#2D2B7A 0%,#1E1B4B 100%)', boxShadow: '0 4px 24px rgba(45,43,122,.35)' }}>
                <div className="px-3 py-3 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,.15)' }}>
                            <Bot className="w-3.5 h-3.5 text-white" />
                        </div>
                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: '#fff' }}>AI Chats</span>
                    </div>
                    <button onClick={createSession}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-white text-[10px] font-bold transition-all hover:opacity-80"
                        style={{ backgroundColor: 'rgba(255,255,255,.16)' }}>
                        <Plus className="w-3 h-3" /> New
                    </button>
                </div>
                <div className="h-px mx-3" style={{ backgroundColor: 'rgba(255,255,255,.10)' }} />
                <div className="flex-1 overflow-y-auto py-2 px-2 space-y-1 custom-scrollbar">
                    {sessions.length === 0 && (
                        <p className="text-center py-6" style={{ fontFamily: T.fontFamily, fontSize: '10px', color: 'rgba(255,255,255,.35)' }}>
                            No conversations yet
                        </p>
                    )}
                    {sessions.map(session => (
                        <div key={session._id} onClick={() => loadSession(session._id)}
                            className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left transition-all group cursor-pointer"
                            style={activeSessionId === session._id ? { backgroundColor: 'rgba(255,255,255,.18)' } : { backgroundColor: 'transparent' }}
                            onMouseEnter={e => { if (activeSessionId !== session._id) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,.08)'; }}
                            onMouseLeave={e => { if (activeSessionId !== session._id) e.currentTarget.style.backgroundColor = 'transparent'; }}>
                            <div className="flex items-center gap-2 min-w-0">
                                <MessageSquare className="w-3 h-3 flex-shrink-0" style={{ color: 'rgba(255,255,255,.50)' }} />
                                <span className="truncate" style={{ fontFamily: T.fontFamily, fontSize: '11px', color: 'rgba(255,255,255,.80)' }}>
                                    {session.title}
                                </span>
                            </div>
                            <div onClick={e => deleteSession(e, session._id)} role="button" tabIndex={0}
                                className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 p-0.5 rounded cursor-pointer hover:text-red-300"
                                style={{ color: 'rgba(255,255,255,.50)' }}>
                                <Trash2 className="w-3 h-3" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Center: Chat area */}
            <div className="flex-1 flex flex-col rounded-2xl overflow-hidden"
                style={{ backgroundColor: '#F8F7FF', border: '1px solid rgba(99,102,241,.15)', boxShadow: '0 4px 24px rgba(99,102,241,.08)' }}>
                <div className="flex items-center justify-between px-5 py-3.5 flex-shrink-0"
                    style={{ backgroundColor: '#fff', borderBottom: '1px solid rgba(99,102,241,.10)' }}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg,#6366F1,#4F46E5)', boxShadow: '0 2px 8px rgba(99,102,241,.35)' }}>
                            <Bot className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: '#1E293B' }}>AI Assistant Chat</p>
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#94A3B8' }}>Chat with your AI Assistant</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <FileText className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#94A3B8' }} />
                            <select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}
                                className="appearance-none pl-8 pr-7 py-1.5 rounded-xl text-xs"
                                style={{ border: '1px solid rgba(99,102,241,.20)', backgroundColor: 'rgba(99,102,241,.05)', fontFamily: T.fontFamily, color: '#475569', outline: 'none' }}>
                                <option value="">Course Context</option>
                                {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
                            </select>
                            <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#94A3B8' }} />
                        </div>
                        <button className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(99,102,241,.08)' }}>
                            <Bell className="w-4 h-4" style={{ color: '#6366F1' }} />
                        </button>
                    </div>
                </div>

                {messages.length === 0 && (
                    <div className="mx-4 mt-4 rounded-2xl p-5 flex items-center gap-4 flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg,#4F46E5 0%,#6366F1 50%,#7C3AED 100%)', boxShadow: '0 8px 32px rgba(99,102,241,.30)', position: 'relative', overflow: 'hidden' }}>
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="absolute rounded-full" style={{ width: 2, height: 2, backgroundColor: 'rgba(255,255,255,.6)', left: `${10 + i * 11}%`, top: `${15 + (i % 3) * 30}%` }} />
                        ))}
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                            style={{ background: 'rgba(255,255,255,.15)', backdropFilter: 'blur(8px)' }}>
                            <Bot className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.black, color: '#fff', marginBottom: 4 }}>Hello Tutor! 👋</h3>
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: 'rgba(255,255,255,.75)' }}>Ask me anything about your LMS</p>
                        </div>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 custom-scrollbar">
                    {messages.length === 0 && (
                        <div className="mt-3">
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#94A3B8', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: T.weight.bold }}>
                                Quick Prompts
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {QUICK_PROMPTS.map(prompt => (
                                    <button key={prompt} onClick={() => sendMessage(prompt)}
                                        className="text-left px-4 py-3 rounded-xl transition-all hover:opacity-80"
                                        style={{ backgroundColor: '#fff', border: '1px solid rgba(99,102,241,.15)', boxShadow: '0 2px 8px rgba(99,102,241,.06)', fontFamily: T.fontFamily, fontSize: T.size.xs, color: '#475569' }}>
                                        {prompt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    {messages.map((msg, idx) => <MessageBubble key={msg._id || idx} msg={msg} />)}
                    {sending && (
                        <div className="flex items-end gap-2">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                                style={{ background: 'linear-gradient(135deg,#4F46E5,#7C3AED)' }}>
                                <Bot className="w-5 h-5 text-white" />
                            </div>
                            <div className="rounded-2xl rounded-bl-md"
                                style={{ backgroundColor: '#fff', border: '1px solid rgba(99,102,241,.15)', boxShadow: '0 2px 12px rgba(0,0,0,.06)' }}>
                                <TypingDots />
                            </div>
                        </div>
                    )}
                    <div ref={endRef} />
                </div>

                <div className="px-4 pb-2 pt-1 flex items-center gap-2 flex-shrink-0 flex-wrap">
                    {BOTTOM_CHIPS.map(chip => {
                        const Icon = chip.icon;
                        return (
                            <button key={chip.label} onClick={() => sendMessage(chip.label)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all hover:opacity-80"
                                style={{ background: 'linear-gradient(135deg,#6366F1,#4F46E5)', color: '#fff', boxShadow: '0 2px 8px rgba(99,102,241,.25)', fontFamily: T.fontFamily }}>
                                <Icon className="w-3 h-3" />{chip.label}
                            </button>
                        );
                    })}
                </div>

                <div className="px-4 pb-4 flex-shrink-0">
                    <div className="flex items-center gap-2.5 rounded-2xl px-4 py-2.5"
                        style={{ backgroundColor: '#fff', border: '1px solid rgba(99,102,241,.20)', boxShadow: '0 4px 16px rgba(99,102,241,.10)' }}>
                        <input value={input} onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                            placeholder="Ask me anything..."
                            className="flex-1 bg-transparent outline-none"
                            style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: '#1E293B' }} />
                        {input && (
                            <button onClick={() => setInput('')}
                                className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 transition-all hover:opacity-70"
                                style={{ backgroundColor: 'rgba(99,102,241,.08)' }}>
                                <RotateCcw className="w-3.5 h-3.5" style={{ color: '#6366F1' }} />
                            </button>
                        )}
                        <button className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 transition-all hover:opacity-70"
                            style={{ backgroundColor: 'rgba(99,102,241,.08)' }}>
                            <Mic className="w-3.5 h-3.5" style={{ color: '#6366F1' }} />
                        </button>
                        <button onClick={() => sendMessage()} disabled={!input.trim() || sending}
                            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-40 hover:opacity-90"
                            style={{ background: 'linear-gradient(135deg,#6366F1,#4F46E5)', boxShadow: '0 2px 8px rgba(99,102,241,.35)' }}>
                            {sending ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* ✅ Right: stats pass kar rahe hain */}
            <RightPanel onToolClick={handleToolClick} stats={stats} />
        </div>
    );
}