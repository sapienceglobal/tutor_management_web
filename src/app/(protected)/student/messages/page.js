'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { 
    MdMessage, MdSend, MdSearch, MdSchool, MdCheck, MdDoneAll, MdHourglassEmpty 
} from 'react-icons/md';
import { motion, AnimatePresence } from 'framer-motion';
import { C, T, S, R } from '@/constants/studentTokens';

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
    e.target.style.boxShadow = `0 0 0 3px ${C.btnPrimary}15`;
};
const onBlurHandler = e => {
    e.target.style.borderColor = C.cardBorder;
    e.target.style.boxShadow = 'none';
};

const baseInputStyle = {
    backgroundColor: C.cardBg,
    border: `1px solid ${C.cardBorder}`,
    borderRadius: '12px',
    color: C.heading,
    fontFamily: T.fontFamily,
    fontSize: T.size.base,
    fontWeight: T.weight.semibold,
    outline: 'none',
    width: '100%',
    padding: '12px 16px',
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

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

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
            // Focus back on input automatically so user can keep typing!
            setTimeout(() => {
                if (inputRef.current) {
                    inputRef.current.focus();
                }
            }, 50);
            
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
            <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: C.pageBg }}>
                <div className="flex flex-col items-center gap-3">
                    <div className="relative w-12 h-12">
                        <div className="w-12 h-12 rounded-full border-[3px] animate-spin"
                            style={{ borderColor: `${C.btnPrimary}30`, borderTopColor: C.btnPrimary }} />
                    </div>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.medium, color: C.text }}>
                        Loading...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-screen lg:h-[calc(100vh-100px)] p-6 flex flex-col gap-6" style={{ backgroundColor: C.pageBg, fontFamily: T.fontFamily, color: C.text }}>
            
            {/* Header */}
            <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center justify-center rounded-xl shrink-0 shadow-sm" style={{ width: 44, height: 44, backgroundColor: C.iconBg }}>
                    <MdMessage style={{ width: 20, height: 20, color: C.iconColor }} />
                </div>
                <div>
                    <h2 style={{ fontFamily: T.fontFamily, fontSize: T.size.xl, fontWeight: T.weight.bold, color: C.heading, margin: 0, lineHeight: 1.2 }}>
                        Tutor Messages
                    </h2>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.semibold, color: C.textMuted, margin: 0 }}>
                        Communicate directly with your enrolled course tutors
                    </p>
                </div>
            </div>

            {tutors.length === 0 ? (
                <div className="p-14 text-center border border-dashed flex-1 flex flex-col justify-center shadow-sm" style={{ backgroundColor: C.cardBg, borderColor: C.cardBorder, borderRadius: R['2xl'] }}>
                    <div className="flex items-center justify-center mx-auto mb-4" style={{ width: 64, height: 64, backgroundColor: C.innerBg, borderRadius: R.xl }}>
                        <MdSchool style={{ width: 32, height: 32, color: C.btnPrimary, opacity: 0.5 }} />
                    </div>
                    <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.xl, fontWeight: T.weight.bold, color: C.heading }}>No tutor conversations yet</h3>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, color: C.text, marginTop: 8 }}>Enroll in a course to start direct messaging with your tutors.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 min-h-0 gap-6">

                    {/* ── Inbox Sidebar (OUTER CARD) ────────────────────────────────── */}
                    <aside className="lg:col-span-4 flex flex-col overflow-hidden shadow-sm" 
                        style={{ backgroundColor: C.cardBg, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}` }}>
                        
                        <div className="p-4 shrink-0" style={{ borderBottom: `1px solid ${C.cardBorder}`, backgroundColor: C.surfaceWhite }}>
                            <div className="relative">
                                <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2" size={18} color={C.textMuted} />
                                <input
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search conversations..."
                                    style={{ ...baseInputStyle, paddingLeft: '40px', height: '44px', backgroundColor: C.innerBg, border: 'none' }}
                                    onFocus={onFocusHandler} onBlur={onBlurHandler}
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar" style={{ backgroundColor: C.cardBg }}>
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
                                                backgroundColor: active ? C.innerBg : 'transparent',
                                                borderBottom: `1px solid ${C.cardBorder}`,
                                                borderLeft: active ? `4px solid ${C.btnPrimary}` : '4px solid transparent'
                                            }}>
                                            <div className="flex gap-4 items-center">
                                                <div className="w-12 h-12 flex items-center justify-center shrink-0 text-white shadow-sm" 
                                                    style={{ background: active ? C.gradientBtn : C.textMuted, borderRadius: '12px', fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold }}>
                                                    {convo.counterpart?.name?.[0]?.toUpperCase() || 'T'}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <p className="truncate" style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>{convo.counterpart?.name || 'Tutor'}</p>
                                                        <span style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: active ? C.btnPrimary : C.textMuted, fontWeight: T.weight.bold }}>{timeLabel(convo.lastMessage?.sentAt)}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center mt-1">
                                                        <p className="truncate" style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: active ? T.weight.semibold : T.weight.medium, color: active ? C.heading : C.textMuted, margin: 0 }}>{convo.lastMessage?.body || 'No messages'}</p>
                                                        {convo.unreadCount > 0 && (
                                                            <motion.span 
                                                                initial={{ scale: 0 }} animate={{ scale: 1 }}
                                                                className="shrink-0 min-w-[20px] h-[20px] px-1 flex items-center justify-center shadow-sm" 
                                                                style={{ backgroundColor: C.danger, color: '#ffffff', borderRadius: '10px', fontSize: T.size.xs, fontWeight: T.weight.bold, fontFamily: T.fontFamily }}>
                                                                {convo.unreadCount}
                                                            </motion.span>
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
                                                backgroundColor: active ? C.innerBg : 'transparent',
                                                borderBottom: `1px solid ${C.cardBorder}`,
                                                borderLeft: active ? `4px solid ${C.btnPrimary}` : '4px solid transparent'
                                            }}>
                                            <div className="flex gap-4 items-center">
                                                <div className="w-12 h-12 flex items-center justify-center shrink-0 text-white shadow-sm" 
                                                    style={{ background: active ? C.gradientBtn : C.textMuted, borderRadius: '12px', fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold }}>
                                                    {tutor.name?.[0]?.toUpperCase() || 'T'}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="truncate" style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 4px 0' }}>{tutor.name}</p>
                                                    <p className="truncate" style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.textMuted, margin: 0 }}>No conversation yet</p>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </aside>

                    {/* ── Chat Window (OUTER CARD) ──────────────────────────────────── */}
                    <main className="lg:col-span-8 flex flex-col overflow-hidden shadow-sm" 
                        style={{ backgroundColor: C.surfaceWhite, borderRadius: R['2xl'], border: `1px solid ${C.cardBorder}` }}>
                        
                        {selectedTutorId && currentTutor ? (
                            <>
                                {/* Chat Header */}
                                <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0" style={{ borderBottom: `1px solid ${C.cardBorder}`, backgroundColor: C.cardBg }}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 flex items-center justify-center shrink-0 text-white shadow-sm" style={{ background: C.gradientBtn, borderRadius: '12px', fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold }}>
                                            {currentTutor.name?.[0]?.toUpperCase()}
                                        </div>
                                        <div>
                                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 2px 0' }}>{currentTutor.name}</p>
                                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.semibold, color: C.textMuted, margin: 0 }}>{currentTutor.email}</p>
                                        </div>
                                    </div>

                                    {/* Course Selector */}
                                    <select
                                        value={selectedCourseId}
                                        onChange={(e) => setSelectedCourseId(e.target.value)}
                                        className="w-full sm:w-auto shrink-0 cursor-pointer"
                                        style={{ ...baseInputStyle, height: '40px', padding: '0 16px', backgroundColor: C.innerBg, width: '200px', border: 'none' }}
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
                                <div className="flex-1 overflow-y-auto p-5 md:p-8 custom-scrollbar space-y-6" style={{ backgroundColor: C.innerBg }}>
                                    {loadingMessages ? (
                                        <div className="h-full flex items-center justify-center"><MdHourglassEmpty className="animate-spin" size={24} color={C.btnPrimary} /></div>
                                    ) : messages.length > 0 ? (
                                        <AnimatePresence initial={false}>
                                            {messages.map((msg, i) => {
                                                const showDate = i === 0 || dateLabel(messages[i - 1].sentAt) !== dateLabel(msg.sentAt);
                                                return (
                                                    <div key={msg._id}>
                                                        {showDate && (
                                                            <div className="flex justify-center my-6">
                                                                <span style={{ fontFamily: T.fontFamily, fontSize: '11px', fontWeight: T.weight.bold, color: C.textMuted, backgroundColor: C.cardBg, padding: '4px 16px', borderRadius: '20px', border: `1px solid ${C.cardBorder}`, textTransform: 'uppercase', letterSpacing: '1px', boxShadow: S.sm }}>
                                                                    {dateLabel(msg.sentAt)}
                                                                </span>
                                                            </div>
                                                        )}
                                                        <motion.div 
                                                            initial={{ opacity: 0, y: 10, scale: 0.95 }} 
                                                            animate={{ opacity: 1, y: 0, scale: 1 }} 
                                                            transition={{ duration: 0.2 }}
                                                            className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
                                                        >
                                                            <div className={`max-w-[75%] md:max-w-[65%] p-4 relative group`} 
                                                                style={{ 
                                                                    background: msg.isOwn ? C.gradientBtn : C.cardBg, 
                                                                    color: msg.isOwn ? '#ffffff' : C.heading,
                                                                    boxShadow: msg.isOwn ? S.btn : S.card,
                                                                    borderRadius: '20px',
                                                                    borderBottomRightRadius: msg.isOwn ? '4px' : '20px',
                                                                    borderBottomLeftRadius: msg.isOwn ? '20px' : '4px',
                                                                    border: msg.isOwn ? 'none' : `1px solid ${C.cardBorder}`
                                                                }}>
                                                                {msg.course?.title && (
                                                                    <span style={{ display: 'block', fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: msg.isOwn ? 'rgba(255,255,255,0.8)' : C.btnPrimary, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                                        Regarding: {msg.course.title}
                                                                    </span>
                                                                )}
                                                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, fontWeight: T.weight.semibold, margin: 0, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{msg.body}</p>
                                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', fontFamily: T.fontFamily, fontSize: '10px', marginTop: '8px', color: msg.isOwn ? 'rgba(255,255,255,0.7)' : C.textMuted, fontWeight: T.weight.bold }}>
                                                                    {timeLabel(msg.sentAt)}
                                                                    {msg.isOwn && (
                                                                        <span className="ml-1">{msg.isRead ? <MdDoneAll size={14} color="#60A5FA" /> : <MdCheck size={14} />}</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    </div>
                                                );
                                            })}
                                        </AnimatePresence>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center opacity-60">
                                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                                                <MdMessage size={36} color={C.textMuted} />
                                            </div>
                                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading }}>Start the conversation!</p>
                                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.medium, color: C.textMuted, marginTop: 4 }}>Send your first message below.</p>
                                        </div>
                                    )}
                                    {/* Invisible div to scroll to */}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Reply Input Area */}
                                <div className="p-4 shrink-0 bg-white" style={{ borderTop: `1px solid ${C.cardBorder}` }}>
                                    <div className="flex items-end gap-3 max-w-5xl mx-auto">
                                        <textarea
                                            ref={inputRef}
                                            value={draft}
                                            onChange={(e) => setDraft(e.target.value)}
                                            placeholder="Write your message..."
                                            style={{ ...baseInputStyle, backgroundColor: C.innerBg, resize: 'none', minHeight: '52px', maxHeight: '120px', padding: '14px 16px', borderRadius: '24px', border: `1px solid ${C.cardBorder}` }}
                                            onFocus={onFocusHandler} onBlur={onBlurHandler}
                                            onKeyDown={(e) => { 
                                                if (e.key === 'Enter' && !e.shiftKey) { 
                                                    e.preventDefault(); 
                                                    handleSend(); 
                                                }
                                            }}
                                            rows={draft.split('\n').length > 1 ? Math.min(draft.split('\n').length, 4) : 1}
                                        />
                                        <button onClick={handleSend} disabled={sending || !draft.trim()}
                                            className="w-12 h-12 flex items-center justify-center shrink-0 cursor-pointer border-none transition-transform hover:scale-105 disabled:opacity-40 disabled:hover:scale-100 shadow-sm"
                                            style={{ background: C.gradientBtn, color: '#ffffff', borderRadius: '50%', boxShadow: S.btn }}>
                                            {sending ? <MdHourglassEmpty size={20} className="animate-spin" /> : <MdSend size={20} className="ml-1" />}
                                        </button>
                                    </div>
                                    <p className="text-center mt-2" style={{ fontFamily: T.fontFamily, fontSize: '11px', color: C.textMuted, fontWeight: T.weight.medium }}>
                                        Press <strong style={{color: C.heading}}>Enter</strong> to send, <strong style={{color: C.heading}}>Shift + Enter</strong> for new line.
                                    </p>
                                </div>
                            </>
                        ) : (
                            <div className="p-14 text-center border border-dashed mx-6 my-auto shadow-sm" style={{ backgroundColor: C.cardBg, borderColor: C.cardBorder, borderRadius: R['2xl'] }}>
                                <div className="flex items-center justify-center mx-auto mb-5" style={{ width: 80, height: 80, backgroundColor: C.innerBg, borderRadius: '20px' }}>
                                    <MdMessage style={{ width: 40, height: 40, color: C.btnPrimary, opacity: 0.6 }} />
                                </div>
                                <h3 style={{ fontFamily: T.fontFamily, fontSize: T.size.xl, fontWeight: T.weight.bold, color: C.heading }}>Select a Conversation</h3>
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.base, color: C.textMuted, marginTop: 8 }}>Choose a tutor from the left sidebar to start or continue a discussion.</p>
                            </div>
                        )}
                    </main>
                </div>
            )}
        </div>
    );
}