'use client';

import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { Loader2, MessageSquare, Send, Search, GraduationCap } from 'lucide-react';
import { C, T, S, pageStyle } from '@/constants/studentTokens';

const timeLabel = (value) => {
    try {
        return new Date(value).toLocaleString();
    } catch {
        return '-';
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
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
                <Loader2 className="w-7 h-7 animate-spin" style={{ color: C.btnPrimary }} />
                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.textMuted }}>
                    Loading messages...
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-5" style={pageStyle}>
            <div
                className="rounded-2xl px-5 py-4"
                style={{ backgroundColor: C.surfaceWhite, border: `1px solid ${C.cardBorder}`, boxShadow: S.card }}
            >
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'color-mix(in srgb, #7573E8 12%, white)', border: '1px solid color-mix(in srgb, #7573E8 20%, white)' }}>
                        <MessageSquare className="w-4 h-4" style={{ color: C.btnPrimary }} />
                    </div>
                    <div>
                        <h1 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading }}>
                            Tutor Messages
                        </h1>
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>
                            Direct chat with your enrolled tutors
                        </p>
                    </div>
                </div>
            </div>

            {tutors.length === 0 ? (
                <div className="rounded-2xl border p-10 text-center" style={{ backgroundColor: C.surfaceWhite, borderColor: C.cardBorder, boxShadow: S.card }}>
                    <GraduationCap className="w-10 h-10 mx-auto mb-3" style={{ color: C.textMuted }} />
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.heading, fontWeight: T.weight.bold }}>
                        No tutor conversations yet
                    </p>
                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted, marginTop: 6 }}>
                        Enroll in a course to start direct messaging with tutors.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-4">
                    <aside
                        className="rounded-2xl border overflow-hidden"
                        style={{ backgroundColor: C.surfaceWhite, borderColor: C.cardBorder, boxShadow: S.card }}
                    >
                        <div className="p-3 border-b" style={{ borderColor: C.cardBorder }}>
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.textMuted }} />
                                <input
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search conversations..."
                                    className="w-full h-9 rounded-xl border pl-9 pr-3 text-sm"
                                    style={{ borderColor: C.cardBorder, fontFamily: T.fontFamily, color: C.heading }}
                                />
                            </div>
                        </div>

                        <div className="max-h-[560px] overflow-auto">
                            {filteredConversations.length > 0 ? (
                                filteredConversations.map((conversation) => {
                                    const active = String(selectedTutorId) === String(conversation.counterpartId);
                                    return (
                                        <button
                                            key={conversation.counterpartId}
                                            onClick={() => {
                                                setSelectedTutorId(String(conversation.counterpartId));
                                                setSelectedCourseId('');
                                            }}
                                            className="w-full text-left px-3 py-2.5 border-b transition-colors"
                                            style={{
                                                borderColor: C.cardBorder,
                                                backgroundColor: active ? 'color-mix(in srgb, #7573E8 6%, white)' : C.surfaceWhite,
                                            }}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <p className="truncate" style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.heading, fontWeight: T.weight.semibold }}>
                                                        {conversation.counterpart?.name || 'Tutor'}
                                                    </p>
                                                    <p className="truncate" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>
                                                        {conversation.lastMessage?.body || 'No message yet'}
                                                    </p>
                                                </div>
                                                {conversation.unreadCount > 0 && (
                                                    <span className="min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold flex items-center justify-center text-white" style={{ backgroundColor: C.btnPrimary }}>
                                                        {conversation.unreadCount}
                                                    </span>
                                                )}
                                            </div>
                                            <p style={{ fontFamily: T.fontFamily, fontSize: '10px', color: C.textMuted, marginTop: 4 }}>
                                                {timeLabel(conversation.lastMessage?.sentAt)}
                                            </p>
                                        </button>
                                    );
                                })
                            ) : (
                                tutors.map((tutor) => {
                                    const active = String(selectedTutorId) === String(tutor._id);
                                    return (
                                        <button
                                            key={tutor._id}
                                            onClick={() => {
                                                setSelectedTutorId(String(tutor._id));
                                                setSelectedCourseId('');
                                            }}
                                            className="w-full text-left px-3 py-2.5 border-b transition-colors"
                                            style={{
                                                borderColor: C.cardBorder,
                                                backgroundColor: active ? 'color-mix(in srgb, #7573E8 6%, white)' : C.surfaceWhite,
                                            }}
                                        >
                                            <p className="truncate" style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.heading, fontWeight: T.weight.semibold }}>
                                                {tutor.name}
                                            </p>
                                            <p className="truncate" style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>
                                                {tutor.email || 'No conversation yet'}
                                            </p>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </aside>

                    <section
                        className="rounded-2xl border overflow-hidden"
                        style={{ backgroundColor: C.surfaceWhite, borderColor: C.cardBorder, boxShadow: S.card }}
                    >
                        <div className="px-4 py-3 border-b flex flex-col gap-2" style={{ borderColor: C.cardBorder }}>
                            <div>
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.heading, fontWeight: T.weight.bold }}>
                                    {currentTutor?.name || 'Select a tutor'}
                                </p>
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>
                                    {currentTutor?.email || 'Choose a tutor to start messaging'}
                                </p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                <select
                                    value={selectedTutorId}
                                    onChange={(e) => {
                                        setSelectedTutorId(e.target.value);
                                        setSelectedCourseId('');
                                    }}
                                    className="h-9 rounded-xl border px-3 text-sm"
                                    style={{ borderColor: C.cardBorder, fontFamily: T.fontFamily, color: C.heading }}
                                >
                                    {tutors.map((tutor) => (
                                        <option key={tutor._id} value={tutor._id}>
                                            {tutor.name} {tutor.email ? `(${tutor.email})` : ''}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    value={selectedCourseId}
                                    onChange={(e) => setSelectedCourseId(e.target.value)}
                                    className="h-9 rounded-xl border px-3 text-sm"
                                    style={{ borderColor: C.cardBorder, fontFamily: T.fontFamily, color: C.heading }}
                                >
                                    <option value="">Any Enrolled Course</option>
                                    {(currentTutor?.courses || []).map((course, idx) => (
                                        <option key={`${course.courseId}-${idx}`} value={course.courseId}>
                                            {course.title}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="h-[420px] overflow-auto px-4 py-3 space-y-2.5" style={{ backgroundColor: 'color-mix(in srgb, #7573E8 4%, white)' }}>
                            {loadingMessages ? (
                                <div className="h-full flex items-center justify-center">
                                    <Loader2 className="w-5 h-5 animate-spin" style={{ color: C.btnPrimary }} />
                                </div>
                            ) : messages.length > 0 ? (
                                messages.map((message) => (
                                    <div
                                        key={message._id}
                                        className={`max-w-[78%] px-3 py-2 rounded-xl border ${message.isOwn ? 'ml-auto' : ''}`}
                                        style={{
                                            backgroundColor: message.isOwn ? 'color-mix(in srgb, #7573E8 12%, white)' : C.surfaceWhite,
                                            borderColor: message.isOwn ? 'color-mix(in srgb, #7573E8 20%, white)' : C.cardBorder,
                                        }}
                                    >
                                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.text, whiteSpace: 'pre-wrap' }}>
                                            {message.body}
                                        </p>
                                        <div className="flex items-center justify-between gap-2 mt-1.5">
                                            <p style={{ fontFamily: T.fontFamily, fontSize: '10px', color: C.textMuted }}>
                                                {timeLabel(message.sentAt)}
                                            </p>
                                            {message.course?.title ? (
                                                <span style={{ fontFamily: T.fontFamily, fontSize: '10px', color: C.textMuted }}>
                                                    {message.course.title}
                                                </span>
                                            ) : null}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="h-full flex items-center justify-center text-center">
                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.textMuted }}>
                                        Start this conversation by sending the first message.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="p-3 border-t flex gap-2" style={{ borderColor: C.cardBorder }}>
                            <textarea
                                value={draft}
                                onChange={(e) => setDraft(e.target.value)}
                                rows={2}
                                placeholder="Type your message..."
                                className="flex-1 rounded-xl border px-3 py-2 text-sm resize-none"
                                style={{ borderColor: C.cardBorder, fontFamily: T.fontFamily, color: C.heading }}
                            />
                            <button
                                onClick={handleSend}
                                disabled={sending || !selectedTutorId}
                                className="px-4 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-60 inline-flex items-center gap-1.5"
                                style={{ backgroundColor: C.btnPrimary }}
                            >
                                {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                                Send
                            </button>
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
}
