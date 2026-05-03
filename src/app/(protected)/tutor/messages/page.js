'use client';

import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { 
    MdHourglassEmpty, MdForum, MdSend, MdSearch, 
    MdPeople, MdDoneAll, MdCheck, MdChevronLeft 
} from 'react-icons/md';
import { C, T, S, R } from '@/constants/studentTokens';

// Focus Handlers
const onFocusHandler = e => {
    e.target.style.borderColor = C.btnPrimary;
    e.target.style.boxShadow = `0 0 0 3px ${C.btnPrimary}30`;
};
const onBlurHandler = e => {
    e.target.style.borderColor = C.cardBorder;
    e.target.style.boxShadow = 'none';
};

const baseInputStyle = {
    backgroundColor: C.innerBg,
    border: `1.5px solid ${C.cardBorder}`,
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
            <div className="flex flex-col items-center justify-center min-h-screen gap-3 w-full" style={{ backgroundColor: C.pageBg, fontFamily: T.fontFamily }}>
                <MdHourglassEmpty className="animate-spin" style={{ color: C.btnPrimary, width: '28px', height: '28px' }} />
                <p style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.bold }}>Loading messages...</p>
            </div>
        );
    }

    return (
        <div className="w-full h-[calc(100vh-120px)]" style={{ backgroundColor: C.pageBg, fontFamily: T.fontFamily, color: C.text }}>
            <div className="grid grid-cols-1 lg:grid-cols-12 h-full gap-6">

                {/* ── Inbox Sidebar ────────────────────────────────────────────── */}
                <aside className="lg:col-span-4 flex flex-col overflow-hidden animate-in fade-in slide-in-from-left-4 duration-500" 
                    style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                    
                    <div className="p-5 shrink-0" style={{ borderBottom: `1px solid ${C.cardBorder}` }}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 flex items-center justify-center shrink-0" style={{ backgroundColor: C.iconBg, borderRadius: '10px' }}>
                                <MdForum size={22} color={C.iconColor} />
                            </div>
                            <h2 style={{ fontSize: T.size.lg, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>Chat</h2>
                        </div>
                        <div className="relative">
                            <MdSearch className="absolute left-3.5 top-1/2 -translate-y-1/2" size={18} color={C.textMuted} />
                            <input
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search students..."
                                style={{ ...baseInputStyle, paddingLeft: '40px', backgroundColor: C.innerBg }}
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
                                        backgroundColor: active ? C.btnViewAllBg : 'transparent',
                                        borderBottom: `1px solid ${C.cardBorder}`
                                    }}>
                                    <div className="flex gap-4">
                                        <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 text-white font-bold shadow-sm" 
                                            style={{ background: C.gradientBtn, border: `2px solid ${active ? C.surfaceWhite : 'transparent'}` }}>
                                            {convo.counterpart?.name?.[0]?.toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center mb-1">
                                                <p className="truncate" style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>{convo.counterpart?.name}</p>
                                                <span style={{ fontSize: '10px', color: C.textMuted, fontWeight: T.weight.semibold }}>{timeLabel(convo.lastMessage?.sentAt)}</span>
                                            </div>
                                            <div className="flex justify-between items-center gap-2">
                                                <p className="truncate" style={{ fontSize: '11px', color: active ? C.heading : C.textMuted, margin: 0, fontWeight: convo.unreadCount > 0 ? T.weight.bold : T.weight.medium }}>
                                                    {convo.lastMessage?.body || 'No messages'}
                                                </p>
                                                {convo.unreadCount > 0 && (
                                                    <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-sm" style={{ backgroundColor: C.btnPrimary }}>
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

                {/* ── Chat Window ──────────────────────────────────────────────── */}
                <main className="lg:col-span-8 flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500" 
                    style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                    
                    {selectedStudentId && currentStudent ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-4 px-6 flex items-center justify-between shrink-0" style={{ borderBottom: `1px solid ${C.cardBorder}`, backgroundColor: C.innerBg }}>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white font-bold shadow-sm" style={{ background: C.gradientBtn }}>
                                        {currentStudent.name?.[0]?.toUpperCase()}
                                    </div>
                                    <div>
                                        <p style={{ fontSize: T.size.base, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>{currentStudent.name}</p>
                                        <p style={{ fontSize: '11px', color: C.textMuted, fontWeight: T.weight.semibold }}>{currentStudent.email}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Messages List */}
                            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6" style={{ backgroundColor: C.innerBg }}>
                                {loadingMessages ? (
                                    <div className="h-full flex items-center justify-center"><MdHourglassEmpty className="animate-spin" size={32} color={C.btnPrimary} /></div>
                                ) : messages.length > 0 ? (
                                    messages.map((msg, i) => {
                                        const showDate = i === 0 || dateLabel(messages[i - 1].sentAt) !== dateLabel(msg.sentAt);
                                        return (
                                            <div key={msg._id} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                                {showDate && (
                                                    <div className="flex justify-center my-8">
                                                        <span style={{ fontSize: '10px', fontWeight: T.weight.black, color: C.textMuted, backgroundColor: C.cardBg, padding: '6px 16px', borderRadius: '10px', textTransform: 'uppercase', letterSpacing: T.tracking.wider, border: `1px solid ${C.cardBorder}` }}>
                                                            {dateLabel(msg.sentAt)}
                                                        </span>
                                                    </div>
                                                )}
                                                <div className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-[75%] p-4 shadow-sm ${msg.isOwn ? 'rounded-2xl rounded-tr-none' : 'rounded-2xl rounded-tl-none'}`} 
                                                        style={{ 
                                                            backgroundColor: msg.isOwn ? C.btnPrimary : C.surfaceWhite, 
                                                            color: msg.isOwn ? '#ffffff' : C.heading,
                                                            border: msg.isOwn ? 'none' : `1px solid ${C.cardBorder}`
                                                        }}>
                                                        <p style={{ fontSize: T.size.sm, margin: 0, lineHeight: 1.6, fontWeight: T.weight.medium }}>{msg.body}</p>
                                                        <div className="flex items-center justify-end gap-1 mt-2" style={{ opacity: 0.8 }}>
                                                            <span style={{ fontSize: '9px', fontWeight: T.weight.bold }}>{timeLabel(msg.sentAt)}</span>
                                                            {msg.isOwn && (
                                                                <span style={{ fontSize: '12px' }}>{msg.isRead ? <MdDoneAll /> : <MdCheck />}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center opacity-30">
                                        <MdForum size={64} color={C.textMuted} />
                                        <p style={{ fontWeight: T.weight.black, fontSize: T.size.lg, marginTop: '12px' }}>No messages yet</p>
                                    </div>
                                )}
                            </div>

                            {/* Reply Input Area */}
                            <div className="p-4 px-6 shrink-0" style={{ borderTop: `1px solid ${C.cardBorder}`, backgroundColor: C.cardBg }}>
                                <div className="flex items-end gap-3">
                                    <textarea
                                        value={draft}
                                        onChange={(e) => setDraft(e.target.value)}
                                        placeholder="Type a message..."
                                        style={{ ...baseInputStyle, backgroundColor: C.innerBg, resize: 'none', minHeight: '48px', maxHeight: '120px', paddingTop: '14px' }}
                                        onFocus={onFocusHandler} onBlur={onBlurHandler}
                                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }}}
                                    />
                                    <button onClick={handleSend} disabled={sending || !draft.trim()}
                                        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 cursor-pointer border-none transition-all hover:scale-105 active:scale-95 disabled:opacity-40 shadow-lg"
                                        style={{ background: C.gradientBtn, color: '#fff' }}>
                                        {sending ? <MdHourglassEmpty size={20} className="animate-spin" /> : <MdSend size={22} />}
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-10 animate-in fade-in duration-700">
                            <div className="w-20 h-20 rounded-[24px] flex items-center justify-center mb-6 shadow-md" style={{ backgroundColor: C.innerBg, border: `1px solid ${C.cardBorder}` }}>
                                <MdForum size={40} color={C.btnPrimary} />
                            </div>
                            <h3 style={{ fontSize: T.size.xl, fontWeight: T.weight.black, color: C.heading, margin: '0 0 10px 0' }}>Your Inbox</h3>
                            <p style={{ fontSize: T.size.sm, color: C.textMuted, margin: 0, maxWidth: '300px', fontWeight: T.weight.semibold, lineHeight: 1.5 }}>
                                Select a student from the sidebar to start a conversation or view recent messages.
                            </p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}