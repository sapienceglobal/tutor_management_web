'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, ChevronDown, FileText, Loader2, Send } from 'lucide-react';
import api from '@/lib/axios';

export default function AiTutorWidget({
    context = {},
    recommendedTopics = [],
    title = 'Sapience AI Assistant',
    subtitle = 'How can I help you today?',
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
    }, [messages]);

    const handleSendMessage = async (e, forcedMessage = null) => {
        if (e) e.preventDefault();

        const messageText = forcedMessage || inputValue;
        if (!messageText.trim()) return;

        // Add user message
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
        <div className={`bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col h-[500px] ${className}`}>
            <h2 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2 shrink-0">
                <Bot className="w-5 h-5 text-indigo-600" />
                {title}
            </h2>
            <p className="text-slate-600 text-sm mb-4 shrink-0">
                {subtitle}
            </p>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2 custom-scrollbar">
                {messages.length === 0 ? (
                    <div className="text-center py-6">
                        <Bot className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                        <p className="text-slate-500 text-sm">Ask me any question based on what you are viewing right now!</p>
                    </div>
                ) : (
                    messages.map((msg, index) => (
                        <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${msg.role === 'user'
                                ? 'bg-indigo-600 text-white rounded-tr-none'
                                : 'bg-slate-100 text-slate-800 rounded-tl-none prose prose-sm prose-slate max-w-none prose-p:leading-relaxed prose-pre:bg-slate-800 prose-pre:text-slate-50'
                                }`}>
                                {/* Using simple text rendering for now, could use react-markdown if installed */}
                                {msg.role === 'user' ? (
                                    <p>{msg.content}</p>
                                ) : (
                                    <div dangerouslySetInnerHTML={{ __html: msg.content.replace(/\n/g, '<br />').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                                )}
                            </div>
                        </div>
                    ))
                )}

                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-slate-100 text-slate-500 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2">
                            <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></span>
                            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                            <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Recommended Topics (only show if no messages yet) */}
            {messages.length === 0 && recommendedTopics.length > 0 && (
                <div className="mb-4 shrink-0">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Recommended questions:</p>
                    <ul className="space-y-2">
                        {recommendedTopics.map((topic, i) => (
                            <li key={i}>
                                <button
                                    type="button"
                                    onClick={(e) => handleSendMessage(e, topic)}
                                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors border border-slate-100"
                                >
                                    <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                                    <span className="line-clamp-2">{topic}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="relative mt-auto shrink-0">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    disabled={loading}
                    placeholder="Ask a question..."
                    className="w-full pl-4 pr-12 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
                <button
                    type="submit"
                    disabled={!inputValue.trim() || loading}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-indigo-600 hover:bg-indigo-50 disabled:text-slate-400 disabled:hover:bg-transparent transition-colors"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 mr-0.5 mt-0.5" />}
                </button>
            </form>
        </div>
    );
}
