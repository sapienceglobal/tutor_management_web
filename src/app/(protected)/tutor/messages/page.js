'use client';

import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { Loader2, MessageSquare, Send, Search, Users, CheckCheck, ChevronLeft } from 'lucide-react';
import { C, T, FX, S, R } from '@/constants/tutorTokens';

// Focus Handlers
const onFocusHandler = e => {
    e.target.style.borderColor = C.btnPrimary;
    e.target.style.boxShadow = '0 0 0 3px rgba(117,115,232,0.10)';
};
const onBlurHandler = e => {
    e.target.style.borderColor = 'transparent';
    e.target.style.boxShadow = 'none';
};

const baseInputStyle = {
    backgroundColor: '#E3DFF8', // Inner Box Color
    border: '1.5px solid transparent',
    borderRadius: R.xl,
    color: C.heading,
    fontFamily: T.fontFamily,
    fontSize: T.size.sm,
    fontWeight: T.weight.medium,
    outline: 'none',
    width: '100%',
    padding: '10px 16px',
    transition: 'all 0.2s ease',
};

const timeLabel = (value) => {
    try {
        return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
        return '-';
    }
};

const dateLabel = (value) => {
    try {
        return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
        return '';
    }
}

export default function TutorMessagesPage() {
    const [loading, setLoading] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sending, setSending] = useState(false);

    const [conversations, setConversations] = useState([]);
    const [students, setStudents] = useState([]);
    const [messages, setMessages] = useState([]);

    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [draft, setDraft] = useState('');
    const [preferredStudentId, setPreferredStudentId] = useState('');

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const requested = String(new URLSearchParams(window.location.search).get('studentId') || '').trim();
        if (requested) setPreferredStudentId(requested);
    }, []);

    useEffect(() => {
        fetchInitialData();
    }, [preferredStudentId]);

    useEffect(() => {
        if (!selectedStudentId) {
            setMessages([]);
            return;
        }
        fetchMessages(selectedStudentId);
    }, [selectedStudentId]);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [conversationsRes, studentsRes] = await Promise.all([
                api.get('/messages/conversations'),
                api.get('/tutor/dashboard/students'),
            ]);

            const convoList = conversationsRes.data?.conversations || [];
            setConversations(convoList);

            const studentList = (studentsRes.data?.students || []).map((student) => ({
                _id: String(student.studentId || student._id),
                name: student.name || 'Student',
                email: student.email || '',
                enrolledCourses: Array.isArray(student.enrolledCourses) ? student.enrolledCourses : [],
            }));
            setStudents(studentList);

            if (preferredStudentId) {
                const hasInConversations = convoList.some((item) => String(item.counterpartId) === String(preferredStudentId));
                if (hasInConversations) {
                    setSelectedStudentId(String(preferredStudentId));
                    return;
                }
            }

            if (convoList.length > 0) {
                setSelectedStudentId(String(convoList[0].counterpartId));
            }
        } catch (error) {
            console.error('Failed to load messages:', error);
            toast.error('Failed to load messages');
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (studentId) => {
        try {
            setLoadingMessages(true);
            const res = await api.get(`/messages/conversations/${studentId}`, { params: { limit: 150 } });
            setMessages(res.data?.messages || []);
            await api.patch(`/messages/conversations/${studentId}/read`);
            setConversations((prev) =>
                prev.map((convo) =>
                    String(convo.counterpartId) === String(studentId)
                        ? { ...convo, unreadCount: 0 }
                        : convo
                )
            );
        } catch (error) {
            console.error('Failed to load conversation messages:', error);
            toast.error('Failed to load conversation');
        } finally {
            setLoadingMessages(false);
        }
    };

    const handleSend = async () => {
        const body = draft.trim();
        if (!selectedStudentId || !body) return;

        try {
            setSending(true);
            const res = await api.post('/messages', {
                partnerId: selectedStudentId,
                body,
                courseId: selectedCourseId || undefined,
            });

            const sentMessage = res.data?.message;
            if (sentMessage) {
                setMessages((prev) => [...prev, sentMessage]);
            }
            setDraft('');
        } catch (error) {
            toast.error('Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const currentStudent = useMemo(() => {
        return students.find((student) => String(student._id) === String(selectedStudentId)) || null;
    }, [students, selectedStudentId]);

    const filteredConversations = useMemo(() => {
        const q = searchTerm.trim().toLowerCase();
        if (!q) return conversations;
        return conversations.filter((c) =>
            String(c.counterpart?.name || '').toLowerCase().includes(q)
        );
    }, [conversations, searchTerm]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-3 w-full" style={{ backgroundColor: '#dfdaf3', fontFamily: T.fontFamily }}>
                <Loader2 className="animate-spin" style={{ color: C.btnPrimary, width: '28px', height: '28px' }} />
                <p style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.bold }}>Loading messages...</p>
            </div>
        );
    }

    return (
        <div className="w-full h-[calc(100vh-100px)] p-6" style={{ backgroundColor: '#dfdaf3', fontFamily: T.fontFamily, color: C.text }}>
            <div className="grid grid-cols-1 lg:grid-cols-12 h-full gap-6">

                {/* ── Inbox Sidebar (OUTER CARD) ────────────────────────────────── */}
                <aside className="lg:col-span-4 flex flex-col overflow-hidden" 
                    style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                    
                    <div className="p-4 shrink-0" style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 flex items-center justify-center shrink-0" style={{ backgroundColor: '#E3DFF8', borderRadius: R.xl }}>
                                <MessageSquare size={20} color={C.btnPrimary} />
                            </div>
                            <h2 style={{ fontSize: T.size.lg, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>Messages</h2>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={16} color={C.textMuted} />
                            <input
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search students..."
                                style={{ ...baseInputStyle, paddingLeft: '36px' }}
                                onFocus={onFocusHandler} onBlur={onBlurHandler}
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {filteredConversations.map((convo) => {
                            const active = String(selectedStudentId) === String(convo.counterpartId);
                            return (
                                <button key={convo.counterpartId} 
                                    onClick={() => setSelectedStudentId(String(convo.counterpartId))}
                                    className="w-full text-left px-5 py-4 border-none cursor-pointer transition-all"
                                    style={{ 
                                        backgroundColor: active ? '#E3DFF8' : 'transparent', // Selected uses innerBox color
                                        borderBottom: `1px solid ${C.cardBorder}`
                                    }}>
                                    <div className="flex gap-3">
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white font-bold" 
                                            style={{ background: C.gradientBtn, border: `2px solid ${active ? C.surfaceWhite : 'transparent'}` }}>
                                            {convo.counterpart?.name?.[0]?.toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center mb-1">
                                                <p className="truncate" style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>{convo.counterpart?.name}</p>
                                                <span style={{ fontSize: '10px', color: C.textMuted }}>{timeLabel(convo.lastMessage?.sentAt)}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <p className="truncate" style={{ fontSize: T.size.xs, color: active ? C.heading : C.textMuted, margin: 0 }}>{convo.lastMessage?.body || 'No messages'}</p>
                                                {convo.unreadCount > 0 && (
                                                    <span className="shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black text-white" style={{ backgroundColor: C.btnPrimary }}>
                                                        {convo.unreadCount}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </aside>

                {/* ── Chat Window (OUTER CARD) ──────────────────────────────────── */}
                <main className="lg:col-span-8 flex flex-col overflow-hidden" 
                    style={{ backgroundColor: '#EAE8FA', borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                    
                    {selectedStudentId && currentStudent ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-4 flex items-center justify-between shrink-0" style={{ borderBottom: `1px solid ${C.cardBorder}`, backgroundColor: '#E3DFF8' }}>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white font-bold" style={{ background: C.gradientBtn }}>
                                        {currentStudent.name?.[0]?.toUpperCase()}
                                    </div>
                                    <div>
                                        <p style={{ fontSize: T.size.sm, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>{currentStudent.name}</p>
                                        <p style={{ fontSize: '11px', color: C.textMuted, margin: 0 }}>{currentStudent.email}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Messages List (INNER BOX FEEL) */}
                            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar space-y-4" style={{ backgroundColor: '#E3DFF8' }}>
                                {loadingMessages ? (
                                    <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin" color={C.btnPrimary} /></div>
                                ) : messages.length > 0 ? (
                                    messages.map((msg, i) => {
                                        const showDate = i === 0 || dateLabel(messages[i - 1].sentAt) !== dateLabel(msg.sentAt);
                                        return (
                                            <div key={msg._id}>
                                                {showDate && (
                                                    <div className="flex justify-center my-6">
                                                        <span style={{ fontSize: '10px', fontWeight: T.weight.black, color: C.textMuted, backgroundColor: '#EAE8FA', padding: '4px 12px', borderRadius: R.md, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                            {dateLabel(msg.sentAt)}
                                                        </span>
                                                    </div>
                                                )}
                                                <div className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-[70%] p-3 rounded-2xl ${msg.isOwn ? 'rounded-tr-none' : 'rounded-tl-none'}`} 
                                                        style={{ 
                                                            backgroundColor: msg.isOwn ? C.btnPrimary : C.surfaceWhite, 
                                                            color: msg.isOwn ? '#fff' : C.heading,
                                                            boxShadow: S.card
                                                        }}>
                                                        <p style={{ fontSize: T.size.sm, margin: 0, lineHeight: 1.5 }}>{msg.body}</p>
                                                        <p style={{ fontSize: '9px', textAlign: 'right', marginTop: '4px', opacity: 0.7, fontWeight: T.weight.bold }}>
                                                            {timeLabel(msg.sentAt)}
                                                            {msg.isOwn && (
                                                                <span className="ml-1">{msg.isRead ? '✓✓' : '✓'}</span>
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center opacity-40">
                                        <MessageSquare size={48} />
                                        <p style={{ fontWeight: T.weight.bold }}>No messages yet</p>
                                    </div>
                                )}
                            </div>

                            {/* Reply Input Area */}
                            <div className="p-4 shrink-0" style={{ borderTop: `1px solid ${C.cardBorder}`, backgroundColor: '#E3DFF8' }}>
                                <div className="flex items-center gap-2">
                                    <textarea
                                        value={draft}
                                        onChange={(e) => setDraft(e.target.value)}
                                        placeholder="Write your message..."
                                        style={{ ...baseInputStyle, backgroundColor: C.surfaceWhite, resize: 'none', height: '44px', paddingTop: '12px' }}
                                        onFocus={onFocusHandler} onBlur={onBlurHandler}
                                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }}}
                                    />
                                    <button onClick={handleSend} disabled={sending || !draft.trim()}
                                        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 cursor-pointer border-none transition-opacity hover:opacity-90 disabled:opacity-40 shadow-md"
                                        style={{ background: C.gradientBtn, color: '#fff' }}>
                                        {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
                            <div className="w-16 h-16 rounded-3xl flex items-center justify-center mb-4 shadow-sm" style={{ backgroundColor: '#E3DFF8' }}>
                                <MessageSquare size={32} color={C.btnPrimary} />
                            </div>
                            <h3 style={{ fontSize: T.size.lg, fontWeight: T.weight.black, color: C.heading, margin: '0 0 8px 0' }}>Select a Conversation</h3>
                            <p style={{ fontSize: T.size.sm, color: C.textMuted, margin: 0, maxWidth: '280px' }}>Choose a student from the left to start or continue a discussion.</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}