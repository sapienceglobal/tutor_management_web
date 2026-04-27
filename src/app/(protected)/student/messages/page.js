'use client';

import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { Loader2, MessageSquare, Send, Search, GraduationCap, CheckCheck, PlayCircle } from 'lucide-react';
import { C, T, S, R } from '@/constants/studentTokens';

// ─── Theme Colors ─────────────────────────────────────────────────────────────

// ─── Helpers ──────────────────────────────────────────────────────────────────
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
};

const normalizeTutorFromEnrollment = (enrollment) => {
    const course = enrollment?.courseId;
    const tutor = course?.tutorId;
    const tutorId = tutor?._id || tutor;
    if (!tutorId) return null;

    const tutorUser = tutor?.userId || {};
    return {
        tutorId: String(tutorId),
        name: tutorUser?.name || 'Tutor',
        email: tutorUser?.email || '',
        profileImage: tutorUser?.profileImage || null,
        course: course?._id
            ? {
                courseId: String(course._id),
                title: course?.title || 'Course',
            }
            : null,
    };
};

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
    backgroundColor: C.surfaceWhite,
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

// ─── Main Component ───────────────────────────────────────────────────────────
export default function StudentMessagesPage() {
    const [loading, setLoading] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sending, setSending] = useState(false);

    const [conversations, setConversations] = useState([]);
    const [tutors, setTutors] = useState([]);
    const [messages, setMessages] = useState([]);

    const [selectedTutorId, setSelectedTutorId] = useState('');
    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [draft, setDraft] = useState('');

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (!selectedTutorId) {
            setMessages([]);
            return;
        }
        fetchMessages(selectedTutorId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedTutorId]);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [conversationsRes, enrollmentsRes] = await Promise.all([
                api.get('/messages/conversations'),
                api.get('/enrollments/my-enrollments').catch(() => ({ data: { enrollments: [] } })),
            ]);

            const convoList = conversationsRes.data?.conversations || [];
            setConversations(convoList);

            const tutorMap = new Map();
            const enrollments = enrollmentsRes.data?.enrollments || [];
            enrollments.forEach((enrollment) => {
                const normalized = normalizeTutorFromEnrollment(enrollment);
                if (!normalized) return;

                if (!tutorMap.has(normalized.tutorId)) {
                    tutorMap.set(normalized.tutorId, {
                        _id: normalized.tutorId,
                        name: normalized.name,
                        email: normalized.email,
                        profileImage: normalized.profileImage,
                        courses: [],
                    });
                }
                if (normalized.course?.courseId) {
                    const entry = tutorMap.get(normalized.tutorId);
                    const exists = entry.courses.some((course) => course.courseId === normalized.course.courseId);
                    if (!exists) entry.courses.push(normalized.course);
                }
            });

            convoList.forEach((conversation) => {
                const id = String(conversation.counterpartId || '');
                if (!id) return;
                if (!tutorMap.has(id)) {
                    tutorMap.set(id, {
                        _id: id,
                        name: conversation.counterpart?.name || 'Tutor',
                        email: conversation.counterpart?.email || '',
                        profileImage: conversation.counterpart?.profileImage || null,
                        courses: [],
                    });
                }
            });

            const tutorList = Array.from(tutorMap.values()).sort((a, b) =>
                String(a.name || '').localeCompare(String(b.name || ''))
            );
            setTutors(tutorList);

            if (convoList.length > 0) {
                setSelectedTutorId(String(convoList[0].counterpartId));
            } else if (tutorList.length > 0) {
                setSelectedTutorId(tutorList[0]._id);
            }
        } catch (error) {
            console.error('Failed to load student messages:', error);
            toast.error('Failed to load messages');
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (tutorId) => {
        try {
            setLoadingMessages(true);
            const res = await api.get(`/messages/conversations/${tutorId}`, { params: { limit: 150 } });
            setMessages(res.data?.messages || []);
            await api.patch(`/messages/conversations/${tutorId}/read`);
            setConversations((prev) =>
                prev.map((convo) =>
                    String(convo.counterpartId) === String(tutorId)
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

    const refreshConversations = async () => {
        try {
            const res = await api.get('/messages/conversations');
            setConversations(res.data?.conversations || []);
        } catch {
            // silent refresh fail
        }
    };

    const currentTutor = useMemo(() => {
        return tutors.find((tutor) => String(tutor._id) === String(selectedTutorId)) || null;
    }, [tutors, selectedTutorId]);

    const filteredConversations = useMemo(() => {
        const q = searchTerm.trim().toLowerCase();
        if (!q) return conversations;
        return conversations.filter((conversation) =>
            String(conversation.counterpart?.name || '').toLowerCase().includes(q)
            || String(conversation.counterpart?.email || '').toLowerCase().includes(q)
            || String(conversation.course?.title || '').toLowerCase().includes(q)
        );
    }, [conversations, searchTerm]);

    const handleSend = async () => {
        const body = draft.trim();
        if (!selectedTutorId) return toast.error('Please select a tutor');
        if (!body) return toast.error('Write a message first');

        try {
            setSending(true);
            const res = await api.post('/messages', {
                partnerId: selectedTutorId,
                body,
                courseId: selectedCourseId || undefined,
            });

            const sentMessage = res.data?.message;
            if (sentMessage) {
                setMessages((prev) => [...prev, sentMessage]);
            }
            setDraft('');
            await refreshConversations();
        } catch (error) {
            console.error('Send message error:', error);
            toast.error(error.response?.data?.message || 'Failed to send message');
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-3 w-full" style={{ backgroundColor: C.pageBgAlt, fontFamily: T.fontFamily }}>
                <Loader2 className="animate-spin" style={{ color: C.btnPrimary, width: '28px', height: '28px' }} />
                <p style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.bold }}>Loading messages...</p>
            </div>
        );
    }

    return (
        <div className="w-full h-screen lg:h-[calc(100vh-100px)] p-6 flex flex-col gap-6" style={{ backgroundColor: C.pageBgAlt, fontFamily: T.fontFamily, color: C.text }}>
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 shrink-0" style={{ backgroundColor: C.outerCard, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 flex items-center justify-center shrink-0" style={{ backgroundColor: C.innerBox, borderRadius: R.xl }}>
                        <MessageSquare size={24} color={C.btnPrimary} />
                    </div>
                    <div>
                        <h1 style={{ color: C.heading, fontSize: T.size.xl, fontWeight: T.weight.black, margin: '0 0 4px 0' }}>
                            Tutor Messages
                        </h1>
                        <p style={{ color: C.textMuted, fontSize: T.size.sm, fontWeight: T.weight.medium, margin: 0 }}>
                            Direct chat with your enrolled tutors.
                        </p>
                    </div>
                </div>
            </div>

            {tutors.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-10 rounded-3xl" style={{ backgroundColor: C.outerCard, border: `1px dashed ${C.cardBorder}` }}>
                    <GraduationCap size={48} color={C.textMuted} style={{ opacity: 0.3, marginBottom: '16px' }} />
                    <h3 style={{ fontSize: T.size.lg, fontWeight: T.weight.black, color: C.heading, margin: '0 0 8px 0' }}>No tutor conversations yet</h3>
                    <p style={{ fontSize: T.size.sm, color: C.textMuted, margin: 0, maxWidth: '280px' }}>Enroll in a course to start direct messaging with your tutors.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 min-h-0 gap-6">

                    {/* ── Inbox Sidebar (OUTER CARD) ────────────────────────────────── */}
                    <aside className="lg:col-span-4 flex flex-col overflow-hidden" 
                        style={{ backgroundColor: C.outerCard, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                        
                        <div className="p-4 shrink-0" style={{ borderBottom: `1px solid ${C.cardBorder}`, backgroundColor: C.innerBox }}>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={16} color={C.textMuted} />
                                <input
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search conversations..."
                                    style={{ ...baseInputStyle, paddingLeft: '36px', height: '40px', backgroundColor: C.surfaceWhite }}
                                    onFocus={onFocusHandler} onBlur={onBlurHandler}
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {filteredConversations.length > 0 ? (
                                filteredConversations.map((convo) => {
                                    const active = String(selectedTutorId) === String(convo.counterpartId);
                                    return (
                                        <button key={convo.counterpartId} 
                                            onClick={() => {
                                                setSelectedTutorId(String(convo.counterpartId));
                                                setSelectedCourseId('');
                                            }}
                                            className="w-full text-left px-5 py-4 border-none cursor-pointer transition-all"
                                            style={{ 
                                                backgroundColor: active ? C.innerBox : 'transparent',
                                                borderBottom: `1px solid ${C.cardBorder}`
                                            }}>
                                            <div className="flex gap-3 items-center">
                                                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white font-bold" 
                                                    style={{ background: C.gradientBtn, border: `2px solid ${active ? C.surfaceWhite : 'transparent'}` }}>
                                                    {convo.counterpart?.name?.[0]?.toUpperCase() || 'T'}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <p className="truncate" style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>{convo.counterpart?.name || 'Tutor'}</p>
                                                        <span style={{ fontSize: '10px', color: C.textMuted }}>{timeLabel(convo.lastMessage?.sentAt)}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <p className="truncate" style={{ fontSize: T.size.xs, color: active ? C.heading : C.textMuted, margin: 0 }}>{convo.lastMessage?.body || 'No messages'}</p>
                                                        {convo.unreadCount > 0 && (
                                                            <span className="shrink-0 min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center text-[9px] font-black text-white" style={{ backgroundColor: C.btnPrimary }}>
                                                                {convo.unreadCount}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })
                            ) : (
                                tutors.map((tutor) => {
                                    const active = String(selectedTutorId) === String(tutor._id);
                                    return (
                                        <button key={tutor._id} 
                                            onClick={() => {
                                                setSelectedTutorId(String(tutor._id));
                                                setSelectedCourseId('');
                                            }}
                                            className="w-full text-left px-5 py-4 border-none cursor-pointer transition-all"
                                            style={{ 
                                                backgroundColor: active ? C.innerBox : 'transparent',
                                                borderBottom: `1px solid ${C.cardBorder}`
                                            }}>
                                            <div className="flex gap-3 items-center">
                                                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white font-bold" 
                                                    style={{ background: C.gradientBtn, border: `2px solid ${active ? C.surfaceWhite : 'transparent'}` }}>
                                                    {tutor.name?.[0]?.toUpperCase() || 'T'}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="truncate" style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>{tutor.name}</p>
                                                    <p className="truncate" style={{ fontSize: T.size.xs, color: C.textMuted, margin: 0 }}>No conversation yet</p>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </aside>

                    {/* ── Chat Window (OUTER CARD) ──────────────────────────────────── */}
                    <main className="lg:col-span-8 flex flex-col overflow-hidden" 
                        style={{ backgroundColor: C.outerCard, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}>
                        
                        {selectedTutorId && currentTutor ? (
                            <>
                                {/* Chat Header */}
                                <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0" style={{ borderBottom: `1px solid ${C.cardBorder}`, backgroundColor: C.innerBox }}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white font-bold shadow-sm" style={{ background: C.gradientBtn }}>
                                            {currentTutor.name?.[0]?.toUpperCase()}
                                        </div>
                                        <div>
                                            <p style={{ fontSize: T.size.sm, fontWeight: T.weight.black, color: C.heading, margin: 0 }}>{currentTutor.name}</p>
                                            <p style={{ fontSize: '11px', color: C.textMuted, margin: 0 }}>{currentTutor.email}</p>
                                        </div>
                                    </div>

                                    {/* Course Selector */}
                                    <select
                                        value={selectedCourseId}
                                        onChange={(e) => setSelectedCourseId(e.target.value)}
                                        className="w-full sm:w-auto shrink-0"
                                        style={{ ...baseInputStyle, height: '40px', backgroundColor: C.surfaceWhite, width: '180px' }}
                                        onFocus={onFocusHandler} onBlur={onBlurHandler}
                                    >
                                        <option value="">General Discussion</option>
                                        {(currentTutor.courses || []).map((course, idx) => (
                                            <option key={`${course.courseId}-${idx}`} value={course.courseId}>
                                                {course.title}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Messages List (INNER BOX FEEL) */}
                                <div className="flex-1 overflow-y-auto p-5 custom-scrollbar space-y-4" style={{ backgroundColor: C.innerBox }}>
                                    {loadingMessages ? (
                                        <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin" color={C.btnPrimary} /></div>
                                    ) : messages.length > 0 ? (
                                        messages.map((msg, i) => {
                                            const showDate = i === 0 || dateLabel(messages[i - 1].sentAt) !== dateLabel(msg.sentAt);
                                            return (
                                                <div key={msg._id}>
                                                    {showDate && (
                                                        <div className="flex justify-center my-6">
                                                            <span style={{ fontSize: '10px', fontWeight: T.weight.black, color: C.textMuted, backgroundColor: C.outerCard, padding: '4px 12px', borderRadius: R.md, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                                {dateLabel(msg.sentAt)}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}>
                                                        <div className={`max-w-[70%] p-3.5 rounded-2xl ${msg.isOwn ? 'rounded-tr-none' : 'rounded-tl-none'}`} 
                                                            style={{ 
                                                                backgroundColor: msg.isOwn ? C.btnPrimary : C.surfaceWhite, 
                                                                color: msg.isOwn ? '#fff' : C.heading,
                                                                boxShadow: S.card
                                                            }}>
                                                            {msg.course?.title && (
                                                                <span style={{ display: 'block', fontSize: '9px', fontWeight: T.weight.black, opacity: 0.7, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                                    Regarding: {msg.course.title}
                                                                </span>
                                                            )}
                                                            <p style={{ fontSize: T.size.sm, margin: 0, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{msg.body}</p>
                                                            <p style={{ fontSize: '9px', textAlign: 'right', marginTop: '6px', opacity: 0.7, fontWeight: T.weight.bold }}>
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
                                            <p style={{ fontWeight: T.weight.bold, marginTop: '8px' }}>Start the conversation!</p>
                                        </div>
                                    )}
                                </div>

                                {/* Reply Input Area */}
                                <div className="p-4 shrink-0" style={{ borderTop: `1px solid ${C.cardBorder}`, backgroundColor: C.innerBox }}>
                                    <div className="flex items-center gap-3">
                                        <textarea
                                            value={draft}
                                            onChange={(e) => setDraft(e.target.value)}
                                            placeholder="Write your message..."
                                            style={{ ...baseInputStyle, backgroundColor: C.surfaceWhite, resize: 'none', height: '44px', paddingTop: '12px' }}
                                            onFocus={onFocusHandler} onBlur={onBlurHandler}
                                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }}}
                                        />
                                        <button onClick={handleSend} disabled={sending || !draft.trim()}
                                            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 cursor-pointer border-none transition-opacity hover:opacity-90 disabled:opacity-40 shadow-md"
                                            style={{ background: C.gradientBtn, color: '#fff' }}>
                                            {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
                                <div className="w-16 h-16 rounded-3xl flex items-center justify-center mb-4 shadow-sm" style={{ backgroundColor: C.innerBox }}>
                                    <MessageSquare size={32} color={C.btnPrimary} />
                                </div>
                                <h3 style={{ fontSize: T.size.lg, fontWeight: T.weight.black, color: C.heading, margin: '0 0 8px 0' }}>Select a Conversation</h3>
                                <p style={{ fontSize: T.size.sm, color: C.textMuted, margin: 0, maxWidth: '280px' }}>Choose a tutor from the left to start or continue a discussion.</p>
                            </div>
                        )}
                    </main>
                </div>
            )}
        </div>
    );
}