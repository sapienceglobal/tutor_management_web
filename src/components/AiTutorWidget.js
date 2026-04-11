'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, Sparkles, Loader2, Send, ChevronRight, MessageSquare } from 'lucide-react';
import api from '@/lib/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { C, T, S, R } from '@/constants/studentTokens';

// Focus Handlers for Input
const onFocusHandler = e => {
    e.target.style.borderColor = C.btnPrimary;
    e.target.style.boxShadow = '0 0 0 3px rgba(117,115,232,0.15)';
};
const onBlurHandler = e => {
    e.target.style.borderColor = C.cardBorder;
    e.target.style.boxShadow = 'none';
};

export default function AiTutorWidget({
    context = {},
    recommendedTopics = [],
    title = 'Sapience AI',
    subtitle = 'Your Personal Study Assistant',
    className = ''
}) {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, loading]);

    const handleSendMessage = async (e, forcedMessage = null) => {
        if (e) e.preventDefault();

        const messageText = forcedMessage || inputValue;
        if (!messageText.trim()) return;

        const newMessages = [...messages, { role: 'user', content: messageText }];
        setMessages(newMessages);
        setInputValue('');
        setLoading(true);

        try {
            const res = await api.post('/ai/contextual-chat', {
                message: messageText,
                history: messages.map(m => ({ role: m.role, content: m.content })),
                context
            });

            if (res.data?.success) {
                setMessages([...newMessages, { role: 'assistant', content: res.data.reply }]);
            } else {
                setMessages([...newMessages, { role: 'assistant', content: 'Sorry, I encountered an error answering that.' }]);
            }
        } catch (error) {
            console.error('AI Widget Error:', error);
            setMessages([...newMessages, { role: 'assistant', content: 'Failed to connect to AI server.' }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`flex flex-col rounded-3xl overflow-hidden shadow-sm border h-[500px] ${className}`}
            style={{ backgroundColor: '#EAE8FA', borderColor: C.cardBorder }}>
            
            {/* ── Header ──────────────────────────────────────────────────────── */}
            <div className="px-5 py-4 border-b flex items-center gap-3 shrink-0" 
                style={{ backgroundColor: '#E3DFF8', borderColor: C.cardBorder }}>
                <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center border" style={{ borderColor: C.cardBorder }}>
                    <Sparkles className="w-5 h-5" style={{ color: C.btnPrimary }} />
                </div>
                <div>
                    <h2 style={{ fontSize: T.size.md, fontWeight: T.weight.black, color: C.heading, margin: '0 0 2px 0' }}>{title}</h2>
                    <p style={{ fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>{subtitle}</p>
                </div>
            </div>

            {/* ── Chat Area ────────────────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar space-y-5 flex flex-col" 
                style={{ backgroundColor: '#E3DFF8' }}>
                
                {messages.length === 0 ? (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}
                        className="flex-1 flex flex-col items-center justify-center text-center py-6">
                        <div className="w-16 h-16 rounded-3xl flex items-center justify-center mb-4 shadow-inner border" style={{ backgroundColor: 'rgba(255,255,255,0.5)', borderColor: C.cardBorder }}>
                            <Bot className="w-8 h-8" style={{ color: C.btnPrimary, opacity: 0.8 }} />
                        </div>
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, marginBottom: 4 }}>How can I help you?</p>
                        <p style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: C.textMuted, maxWidth: '240px' }}>Ask me anything related to your current task or course material.</p>
                    </motion.div>
                ) : (
                    <div className="space-y-4">
                        <AnimatePresence initial={false}>
                            {messages.map((msg, index) => (
                                <motion.div 
                                    key={index} 
                                    initial={{ opacity: 0, y: 10, scale: 0.98 }} 
                                    animate={{ opacity: 1, y: 0, scale: 1 }} 
                                    transition={{ duration: 0.3, ease: 'easeOut' }}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${msg.role === 'user' ? 'rounded-tr-sm text-white' : 'rounded-tl-sm bg-white'}`}
                                        style={msg.role === 'user' ? { backgroundColor: C.btnPrimary, fontFamily: T.fontFamily, fontWeight: T.weight.medium, lineHeight: 1.5 } : { color: C.heading, border: `1px solid ${C.cardBorder}`, fontFamily: T.fontFamily, fontWeight: T.weight.medium, lineHeight: 1.6 }}>
                                        {msg.role === 'user' ? (
                                            <p className="m-0">{msg.content}</p>
                                        ) : (
                                            <div dangerouslySetInnerHTML={{ __html: msg.content.replace(/\n/g, '<br />').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}

                {loading && (
                    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
                        <div className="bg-white text-slate-500 rounded-2xl rounded-tl-sm px-4 py-3.5 flex items-center gap-1.5 shadow-sm border" style={{ borderColor: C.cardBorder }}>
                            <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: C.btnPrimary }}></span>
                            <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: C.btnPrimary, animationDelay: '0.15s' }}></span>
                            <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: C.btnPrimary, animationDelay: '0.3s' }}></span>
                        </div>
                    </motion.div>
                )}
                
                {/* ── Suggested Questions (Pinned to bottom if empty) ───────────── */}
                {messages.length === 0 && recommendedTopics.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-auto w-full pt-4">
                        <p style={{ fontSize: '10px', fontWeight: T.weight.black, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>Suggested Questions</p>
                        <div className="space-y-2.5">
                            {recommendedTopics.map((topic, i) => (
                                <button key={i} type="button" onClick={(e) => handleSendMessage(e, topic)}
                                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all cursor-pointer bg-white border border-transparent shadow-sm"
                                    style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.heading }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = C.btnPrimary; e.currentTarget.style.color = C.btnPrimary; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.color = C.heading; e.currentTarget.style.transform = 'none'; }}>
                                    <span className="line-clamp-1 text-left flex-1">{topic}</span>
                                    <ChevronRight size={14} style={{ opacity: 0.4 }} />
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
                
                <div ref={messagesEndRef} />
            </div>

            {/* ── Input Form ───────────────────────────────────────────────────── */}
            <form onSubmit={handleSendMessage} className="p-4 border-t shrink-0 relative" style={{ backgroundColor: '#E3DFF8', borderColor: C.cardBorder }}>
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    disabled={loading}
                    placeholder="Ask a question..."
                    className="w-full pl-4 pr-14 py-3 rounded-2xl bg-white transition-all disabled:opacity-60"
                    style={{ border: `1px solid ${C.cardBorder}`, color: C.heading, fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.bold, outline: 'none' }}
                    onFocus={onFocusHandler} onBlur={onBlurHandler}
                />
                <button
                    type="submit"
                    disabled={!inputValue.trim() || loading}
                    className="absolute right-6 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer border-none shadow-sm disabled:opacity-40"
                    style={{ background: inputValue.trim() ? C.gradientBtn : C.cardBorder, color: '#fff' }}
                    onMouseEnter={e => { if (inputValue.trim()) e.currentTarget.style.transform = 'scale(1.05)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
                    {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} style={{ marginLeft: '2px' }} />}
                </button>
            </form>
        </div>
    );
}