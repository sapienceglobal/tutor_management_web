'use client';

import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { Loader2, MessageSquare, Send, Search, Users } from 'lucide-react';
import { C, T, FX, S, pageStyle } from '@/constants/tutorTokens';

const timeLabel = (value) => {
    try {
        return new Date(value).toLocaleString();
    } catch {
        return '-';
    }
};

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [preferredStudentId]);

    useEffect(() => {
        if (!selectedStudentId) {
            setMessages([]);
            return;
        }
        fetchMessages(selectedStudentId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
                const hasInStudents = studentList.some((item) => String(item._id) === String(preferredStudentId));
                if (hasInConversations || hasInStudents) {
                    setSelectedStudentId(String(preferredStudentId));
                    return;
                }
            }

            if (convoList.length > 0) {
                setSelectedStudentId(String(convoList[0].counterpartId));
            } else if (studentList.length > 0) {
                setSelectedStudentId(studentList[0]._id);
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

    const refreshConversations = async () => {
        try {
            const res = await api.get('/messages/conversations');
            setConversations(res.data?.conversations || []);
        } catch {
            // silent refresh fail
        }
    };

    const currentStudent = useMemo(() => {
        return students.find((student) => String(student._id) === String(selectedStudentId)) || null;
    }, [students, selectedStudentId]);

    const filteredConversations = useMemo(() => {
        const q = searchTerm.trim().toLowerCase();
        if (!q) return conversations;
        return conversations.filter((conversation) =>
            String(conversation.counterpart?.name || '').toLowerCase().includes(q)
            || String(conversation.counterpart?.email || '').toLowerCase().includes(q)
        );
    }, [conversations, searchTerm]);

    const handleSend = async () => {
        const body = draft.trim();
        if (!selectedStudentId) return toast.error('Please select a student');
        if (!body) return toast.error('Write a message first');

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
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: FX.primary12, border: `1px solid ${FX.primary20}` }}>
                        <MessageSquare className="w-4 h-4" style={{ color: C.btnPrimary }} />
                    </div>
                    <div>
                        <h1 style={{ fontFamily: T.fontFamily, fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading }}>
                            Student Messages
                        </h1>
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>
                            Direct communication with enrolled students
                        </p>
                    </div>
                </div>
            </div>

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
                                const active = String(selectedStudentId) === String(conversation.counterpartId);
                                return (
                                    <button
                                        key={conversation.counterpartId}
                                        onClick={() => {
                                            setSelectedStudentId(String(conversation.counterpartId));
                                            setSelectedCourseId('');
                                        }}
                                        className="w-full text-left px-3 py-2.5 border-b transition-colors"
                                        style={{
                                            borderColor: C.cardBorder,
                                            backgroundColor: active ? FX.primary06 : C.surfaceWhite,
                                        }}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="truncate" style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.heading, fontWeight: T.weight.semibold }}>
                                                    {conversation.counterpart?.name || 'Student'}
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
                            <div className="p-5 text-center">
                                <Users className="w-5 h-5 mx-auto mb-2" style={{ color: C.textMuted }} />
                                <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>
                                    No conversations yet
                                </p>
                            </div>
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
                                {currentStudent?.name || 'Select a student'}
                            </p>
                            <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted }}>
                                {currentStudent?.email || 'Choose from existing conversations or send a new message'}
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <select
                                value={selectedStudentId}
                                onChange={(e) => {
                                    setSelectedStudentId(e.target.value);
                                    setSelectedCourseId('');
                                }}
                                className="h-9 rounded-xl border px-3 text-sm"
                                style={{ borderColor: C.cardBorder, fontFamily: T.fontFamily, color: C.heading }}
                            >
                                {students.map((student) => (
                                    <option key={student._id} value={student._id}>
                                        {student.name} ({student.email})
                                    </option>
                                ))}
                            </select>
                            <select
                                value={selectedCourseId}
                                onChange={(e) => setSelectedCourseId(e.target.value)}
                                className="h-9 rounded-xl border px-3 text-sm"
                                style={{ borderColor: C.cardBorder, fontFamily: T.fontFamily, color: C.heading }}
                            >
                                <option value="">All Enrolled Courses</option>
                                {(currentStudent?.enrolledCourses || []).map((course, idx) => (
                                    <option key={`${course.courseId}-${idx}`} value={course.courseId}>
                                        {course.title}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="h-[420px] overflow-auto px-4 py-3 space-y-2.5" style={{ backgroundColor: FX.primary04 }}>
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
                                        backgroundColor: message.isOwn ? FX.primary12 : C.surfaceWhite,
                                        borderColor: message.isOwn ? FX.primary20 : C.cardBorder,
                                    }}
                                >
                                    <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, color: C.text, whiteSpace: 'pre-wrap' }}>
                                        {message.body}
                                    </p>
                                    <p style={{ fontFamily: T.fontFamily, fontSize: '10px', color: C.textMuted, marginTop: 4 }}>
                                        {timeLabel(message.sentAt)}
                                    </p>
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
                            disabled={sending || !selectedStudentId}
                            className="px-4 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-60 inline-flex items-center gap-1.5"
                            style={{ backgroundColor: C.btnPrimary }}
                        >
                            {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                            Send
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );
}
