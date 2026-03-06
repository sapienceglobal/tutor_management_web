'use client';

import { useState, useRef, useEffect } from 'react';
import {
    Search, Bot, Send, Plus, Trash2, Mic,
    MessageSquare, Menu, X, Loader2, FileText, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, MoreHorizontal
} from 'lucide-react';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';

export default function AITutorPage() {
    const [sessions, setSessions] = useState([]);
    const [activeSessionId, setActiveSessionId] = useState(null);

    const [courses, setCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState('');

    const [question, setQuestion] = useState('');
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [expandedCitations, setExpandedCitations] = useState({});

    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Initial Load
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                // Fetch Courses for RAG
                const courseRes = await api.get('/enrollments/my-enrollments');
                const enrolledCourses = courseRes.data.enrollments?.map(e => ({
                    _id: e.courseId._id,
                    title: e.courseId.title,
                })) || [];
                setCourses(enrolledCourses);

                // Fetch Chat History
                fetchSessions();
            } catch (error) {
                console.error('Error fetching initial data:', error);
            }
        };
        fetchInitialData();
    }, []);

    const fetchSessions = async () => {
        try {
            const res = await api.get('/ai/chat-sessions');
            if (res.data.success) {
                setSessions(res.data.sessions);
            }
        } catch (error) {
            console.error('Error fetching sessions:', error);
        }
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
        } catch (error) {
            console.error('Error loading session:', error);
            toast.error('Failed to load chat history');
        }
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
            if (activeSessionId === sessionId) {
                createNewSession();
            }
            toast.success('Chat deleted');
        } catch (error) {
            console.error('Error deleting session:', error);
            toast.error('Failed to delete chat');
        }
    };

    const handleSubmit = async (e, overrideQuestion = null) => {
        if (e) e.preventDefault();
        const textToSubmit = overrideQuestion || question;
        if (!textToSubmit.trim() || isLoading) return;

        // Optimistic UI Update
        const tempUserMessage = {
            _id: Date.now().toString(),
            role: 'user',
            content: textToSubmit.trim(),
            timestamp: new Date()
        };

        setMessages(prev => [...prev, tempUserMessage]);
        setQuestion('');
        setIsLoading(true);

        try {
            let currentSessionId = activeSessionId;

            // Create a session implicitly if none is active
            if (!currentSessionId) {
                const createRes = await api.post('/ai/chat-sessions', {
                    courseId: selectedCourse || undefined
                });
                currentSessionId = createRes.data.session._id;
                setActiveSessionId(currentSessionId);
            }

            // Send Message
            const res = await api.post(`/ai/chat-sessions/${currentSessionId}/message`, {
                message: textToSubmit.trim()
            });

            if (res.data.success) {
                // Add AI Reply
                setMessages(prev => [...prev, res.data.reply]);

                // Refresh sidebar blindly to catch title updates
                fetchSessions();
            }
        } catch (error) {
            console.error('AI Chat Error:', error);
            const errorMessage = {
                _id: Date.now().toString() + 'err',
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please try again.',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleCitation = (citationId) => {
        setExpandedCitations(prev => ({ ...prev, [citationId]: !prev[citationId] }));
    };

    const formatMessageWithCitations = (content, citations) => {
        if (!citations || citations.length === 0) return content;
        let formattedContent = content;
        citations.forEach((citation, index) => {
            const marker = `[Source ${index + 1}]`;
            if (formattedContent.includes(marker)) {
                formattedContent = formattedContent.replace(
                    marker,
                    `<span class="inline-flex items-center justify-center w-[18px] h-[18px] ml-1 text-[10px] font-bold text-white bg-[#6A5EE8] rounded-full select-none cursor-pointer hover:bg-slate-700 transition-colors shadow-sm">${index + 1}</span>`
                );
            }
        });
        return formattedContent;
    };

    const renderToolbar = () => (
        <div className="w-full max-w-3xl flex justify-between items-center px-4 mb-2">
            <div className="flex gap-2 items-center flex-wrap">
                {/* GPT Select */}
                <button className="flex items-center gap-1.5 px-4 py-2 bg-[#F6F7FA] border border-white shadow-sm rounded-lg text-sm font-bold text-[#696495] hover:bg-white transition-colors">
                    <span className="w-4 h-4 bg-[#6A5EE8]/10 rounded flex items-center justify-center text-[#6A5EE8]"><MessageSquare className="w-3 h-3" /></span>
                    GPT-4 <ChevronDown className="w-3.5 h-3.5" />
                </button>

                {/* Context Select (RAG wireup) */}
                <div className="relative">
                    <select
                        value={selectedCourse}
                        onChange={(e) => {
                            setSelectedCourse(e.target.value);
                            if (activeSessionId) toast.success('Context updated for next message');
                        }}
                        className="appearance-none flex items-center gap-1.5 pl-9 pr-8 py-2 bg-[#F6F7FA] border border-white shadow-sm rounded-lg text-sm font-bold text-[#696495] hover:bg-white transition-colors focus:outline-none"
                    >
                        <option value="">Ask from Course</option>
                        {courses.map(course => (
                            <option key={course._id} value={course._id}>{course.title}</option>
                        ))}
                    </select>
                    <FileText className="w-3.5 h-3.5 text-[#696495] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
            </div>

            <div className="flex gap-2 items-center flex-wrap mt-2 md:mt-0">
                <button className="flex items-center gap-1.5 px-4 py-2 bg-[#F6F7FA] border border-white shadow-sm rounded-lg text-sm font-bold text-[#6A5EE8] hover:bg-white transition-colors">
                    <span className="w-3 h-1 bg-[#6A5EE8] rounded-full"></span>
                    Sapience AI <ChevronDown className="w-3.5 h-3.5" />
                </button>
                <button className="p-2 text-[#A49FCC]">
                    <MoreHorizontal className="w-5 h-5" />
                </button>
            </div>
        </div>
    );

    const actionCards = [
        { title: 'Explain', subtitle: "Newton's Laws", icon: '🍎', gradient: 'from-[#D5C6F8] to-[#9CA6F8]' },
        { title: 'Generate', subtitle: "Quiz", icon: '📝', gradient: 'from-[#9CA6F8] to-[#A0DFF6]' },
        { title: 'Summarize', subtitle: 'Chapter', icon: '📄', gradient: 'from-[#FDE0A3] to-[#FDE8A5]' },
        { title: 'Solve Math', subtitle: 'Problem', icon: '❓', gradient: 'from-[#A1E4B5] to-[#A5EC89]' },
        { title: 'Create', subtitle: 'Flashcards', icon: '📇', gradient: 'from-[#9FCEF8] to-[#86ACF5]' },
        { title: 'Prepare', subtitle: 'Exam Plan', icon: '📋', gradient: 'from-[#F6BBC6] to-[#EFAED8]' },
    ];

    return (
        <div className="flex h-[calc(100vh-64px)] bg-[#FDFCFD] overflow-hidden text-[#2C2E5D] font-sans relative">

            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/20 z-40 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* --- SIDEBAR (Styled to match the light UI) --- */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-72 bg-[#F6F4FE] border-r border-[#EBE7FF] flex flex-col transition-transform duration-300 ease-in-out md:relative md:translate-x-0
                ${isSidebarOpen ? 'translate-x-[0px]' : '-translate-x-full'}
            `}>
                <div className="p-4 flex gap-2 border-b border-[#EBE7FF]">
                    <button
                        onClick={createNewSession}
                        className="flex-1 flex items-center justify-center gap-2 bg-white border border-[#EBE7FF] hover:bg-white text-[#524A9A] font-semibold py-2.5 rounded-xl transition-colors shadow-[0_2px_10px_-4px_rgba(82,74,154,0.1)]"
                    >
                        <Plus className="w-5 h-5" />
                        New Chat
                    </button>
                    {/* Mobile Close */}
                    <button
                        className="md:hidden p-2.5 bg-white border border-[#EBE7FF] rounded-xl text-slate-500"
                        onClick={() => setIsSidebarOpen(false)}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 custom-scrollbar">
                    <div className="text-[11px] font-bold text-[#8C87BA] mb-3 px-2 uppercase tracking-wider">Chat History (ChatGPT style)</div>
                    {sessions.length === 0 && (
                        <div className="text-sm text-[#8C87BA] px-2 italic">No earlier chats</div>
                    )}
                    {sessions.map(session => (
                        <div
                            key={session._id}
                            onClick={() => loadSession(session._id)}
                            className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors ${activeSessionId === session._id ? 'bg-[#E5DDFE] text-[#423C8A] font-bold' : 'hover:bg-[#EBE7FF] text-[#696495]'
                                }`}
                        >
                            <div className="flex items-center gap-2.5 overflow-hidden flex-1">
                                <MessageSquare className={`w-4 h-4 shrink-0 ${activeSessionId === session._id ? 'text-[#6A5EE8]' : 'text-[#A49FCC]'}`} />
                                <span className="text-sm truncate">{session.title}</span>
                            </div>
                            <button
                                onClick={(e) => deleteSession(e, session._id)}
                                className="opacity-0 group-hover:opacity-100 p-1 text-[#A49FCC] hover:text-red-500 transition-all rounded hover:bg-white/50"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            </aside>

            {/* --- MAIN CHAT AREA --- */}
            <main className="flex-1 flex flex-col min-w-0 relative">

                {/* Mobile Header */}
                <div className="md:hidden flex items-center p-4 border-b border-[#EBE7FF] bg-[#FDFCFD] sticky top-0 z-10">
                    <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-[#6A5EE8] rounded-lg">
                        <Menu className="w-6 h-6" />
                    </button>
                    <div className="flex-1 text-center font-bold text-[#2C2E5D] text-lg">Sapience AI</div>
                    <div className="w-10"></div>
                </div>

                {/* Main Scrollable Content */}
                <div className="flex-1 overflow-y-auto w-full custom-scrollbar relative px-4 md:px-8 lg:px-12 pt-6 md:pt-10 pb-48">

                    {/* Floating Background Glow (from mockup) */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-[#EFE9FF] to-transparent rounded-full blur-3xl -z-10 pointer-events-none opacity-50" />

                    {messages.length === 0 ? (
                        <>
                            {/* Empty State / Welcome Screen */}
                            <div className="text-center mb-8">
                                <h1 className="text-3xl font-bold text-[#2C2E5D] mb-1">Sapience AI Tutor</h1>
                                <p className="text-[#696495] font-medium text-sm">Ask questions, generate notes, solve problems instantly</p>
                            </div>

                            {/* Search Pill */}
                            <div className="max-w-3xl mx-auto mb-10 w-full px-4 md:px-0">
                                <div className="relative mb-5 w-full">
                                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A49FCC]" />
                                    <input
                                        type="text"
                                        placeholder="Ask a question..."
                                        className="w-full h-14 pl-14 pr-16 rounded-full border border-white bg-white/60 shadow-[0_4px_20px_-5px_rgba(82,74,154,0.08)] backdrop-blur-md text-[#2C2E5D] placeholder:text-[#A49FCC] focus:outline-none focus:ring-2 focus:ring-[#8C83EA]/50 font-medium text-base transition-all"
                                        value={question}
                                        onChange={(e) => setQuestion(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleSubmit(e);
                                        }}
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                        <button
                                            onClick={(e) => handleSubmit(e)}
                                            disabled={!question.trim()}
                                            className="p-2 text-white bg-[#6A5EE8] hover:bg-[#524A9A] rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                            <Send className="w-4 h-4 ml-0.5" />
                                        </button>
                                    </div>
                                </div>
                                {renderToolbar()}
                            </div>

                            {/* Action Cards (Mockup style) */}
                            <div className="max-w-4xl mx-auto">
                                <div className="flex gap-4 overflow-x-auto pb-6 pt-2 custom-scrollbar snap-x snap-mandatory px-4 md:px-0">
                                    {actionCards.map((card, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleSubmit(null, `${card.title} ${card.subtitle}`.trim())}
                                            className={`shrink-0 flex items-center gap-3 w-[150px] p-4 rounded-xl bg-gradient-to-br ${card.gradient} shadow-[0_4px_15px_-4px_rgba(0,0,0,0.05)] hover:shadow-lg transition-all hover:-translate-y-1 snap-start text-left group border border-white/20`}
                                        >
                                            <div className="text-3xl drop-shadow-sm group-hover:scale-110 transition-transform">{card.icon}</div>
                                            <div className="flex flex-col leading-tight">
                                                <span className="font-bold text-sm text-[#3E387B]/90">{card.title}</span>
                                                {card.subtitle && <span className="font-semibold text-xs text-[#3E387B]/70">{card.subtitle}</span>}
                                            </div>
                                        </button>
                                    ))}
                                    <button className="shrink-0 w-10 flex items-center justify-center p-3 rounded-xl bg-white shadow-sm border border-[#EBE7FF] text-[#A49FCC] hover:bg-[#F6F4FE]">
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="max-w-4xl mx-auto">
                            {/* Messages Container (Matching Mockup exactly) */}
                            <div className="bg-[#FAF9FF] border border-white shadow-[0_8px_30px_-10px_rgba(82,74,154,0.1)] rounded-[32px] p-6 md:p-8">
                                {messages.map((msg, idx) => (
                                    <div key={idx} className="mb-8 last:mb-0">
                                        {msg.role === 'user' ? (
                                            <div className="flex items-center gap-3 bg-[#EAE8FA]/50 border border-[#EBE7FF] text-[#2C2E5D] px-6 py-4 rounded-full w-max max-w-full font-semibold shadow-sm ml-6 md:ml-12 mb-6">
                                                <div className="w-8 h-8 rounded-full bg-cover shadow-sm bg-center shrink-0 border-2 border-white" style={{ backgroundImage: "url('https://i.pravatar.cc/150?img=11')" }} />
                                                <span className="truncate whitespace-normal">Manohar: {msg.content}</span>
                                            </div>
                                        ) : (
                                            <div className="relative">
                                                {/* AI Header */}
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                                                            <Bot className="w-5 h-5 text-blue-600" />
                                                        </div>
                                                        <span className="font-bold text-[#423C8A] text-lg">AI Tutor:</span>
                                                        <span className="text-xs text-[#A49FCC] font-semibold">Degs 25</span>
                                                    </div>
                                                    <div className="flex gap-2 text-[#A49FCC]">
                                                        <MoreHorizontal className="w-5 h-5" />
                                                    </div>
                                                </div>

                                                {/* AI Content Bubble */}
                                                <div className="relative z-10 bg-[#F6F4FE]/80 border border-white backdrop-blur-md rounded-2xl p-6 text-[#423C8A] shadow-[0_2px_15px_-5px_rgba(0,0,0,0.05)] ml-10 prose prose-sm md:prose-base max-w-none prose-headings:text-[#2C2E5D] prose-p:leading-relaxed prose-strong:text-[#423C8A] prose-ul:list-disc">

                                                    {msg.contextUsed && (
                                                        <div className="mb-3 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#6A5EE8] bg-[#EAE8FA] px-2.5 py-1 rounded-full border border-[#D5C6F8]/50">
                                                            <FileText className="w-3 h-3" /> Configured RAG Used
                                                        </div>
                                                    )}

                                                    <div dangerouslySetInnerHTML={{ __html: formatMessageWithCitations(msg.content.replace(/\n/g, '<br />'), msg.citations) }} />

                                                    {/* Copy / Actions inside bubble */}
                                                    <div className="absolute right-4 bottom-4 flex gap-1">
                                                        <Button size="icon" variant="ghost" className="w-8 h-8 rounded hover:bg-white text-[#A49FCC]">
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {isLoading && (
                                    <div className="ml-10 mt-6 flex gap-1">
                                        <div className="w-2.5 h-2.5 bg-[#8C83EA] rounded-full animate-bounce"></div>
                                        <div className="w-2.5 h-2.5 bg-[#8C83EA] rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                                        <div className="w-2.5 h-2.5 bg-[#8C83EA] rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        </div>
                    )}
                </div>

                {/* Floating Bottom Input Area (Matching Mockup exactly) */}
                {messages.length > 0 && (
                    <div className="absolute bottom-4 left-0 right-0 px-4 md:px-0 flex flex-col items-center">
                        {renderToolbar()}

                        {/* Main Input Pill */}
                        <div className="w-full max-w-3xl bg-[#F6F7FA] border border-white shadow-[0_10px_30px_-10px_rgba(82,74,154,0.15)] rounded-full p-2 flex items-center gap-2 mb-3">
                            <button className="p-2.5 text-[#A49FCC] hover:bg-[#EAE8FA] rounded-full ml-1 transition-colors">
                                <Plus className="w-5 h-5" />
                            </button>

                            <input
                                type="text"
                                placeholder="Type a message..."
                                className="flex-1 h-12 bg-transparent text-[#2C2E5D] placeholder:text-[#A49FCC] focus:outline-none font-medium text-base px-2"
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSubmit(e);
                                    }
                                }}
                            />

                            <Button
                                onClick={(e) => handleSubmit(e)}
                                disabled={!question.trim() || isLoading}
                                className="h-12 px-6 rounded-full bg-[#6A5EE8] hover:bg-[#524A9A] text-white font-bold text-sm shadow-md transition-colors"
                            >
                                Send
                            </Button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
