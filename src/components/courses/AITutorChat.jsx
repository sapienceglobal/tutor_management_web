'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2, Sparkles, BookOpen, FileText } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';

export default function AITutorChat({ lessonId, lessonTitle }) {
    const [messages, setMessages] = useState([
        {
            role: 'tutor',
            content: `Hello! I'm Sapience AI, your personal tutor for **${lessonTitle}**. What questions do you have about this lesson?`
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [citations, setCitations] = useState([]);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsg = { role: 'user', content: input.trim() };
        setInput('');

        // Add user message to UI immediately
        const updatedMessages = [...messages, userMsg];
        setMessages(updatedMessages);
        setIsLoading(true);

        try {
            const res = await api.post('/ai/tutor-chat', {
                lessonId,
                message: userMsg.content,
                history: messages
            });

            if (res.data.success) {
                setMessages([...updatedMessages, { role: 'tutor', content: res.data.reply }]);
                if (res.data.citations) {
                    setCitations(res.data.citations);
                }
            } else {
                toast.error(res.data.message || 'Failed to get a reply');
                // Remove the user message if it failed or show error
                setMessages(messages);
            }
        } catch (error) {
            console.error('Chat error:', error);
            toast.error('An error occurred communicating with the AI Tutor.');
            setMessages(messages);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[500px] bg-slate-900 border border-indigo-500/20 rounded-2xl overflow-hidden shadow-2xl relative">

            {/* Header */}
            <div className="bg-indigo-900/40 border-b border-indigo-500/20 px-6 py-4 flex items-center gap-3 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 animate-pulse"></div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg relative z-10">
                    <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="relative z-10">
                    <h3 className="font-bold text-white flex items-center gap-2">
                        Sapience AI
                        <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">BETA</span>
                    </h3>
                    <p className="text-xs text-indigo-300">Context-Aware Smart Tutor</p>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-indigo-500/20 scrollbar-track-transparent">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex items-start gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>

                        {/* Avatar */}
                        <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center shadow-md ${msg.role === 'user'
                            ? 'bg-slate-700'
                            : 'bg-gradient-to-br from-indigo-500 to-purple-600'
                            }`}>
                            {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
                        </div>

                        {/* Bubble */}
                        <div className={`max-w-[80%] rounded-2xl px-5 py-3 shadow-md ${msg.role === 'user'
                            ? 'bg-indigo-600 text-white rounded-tr-none'
                            : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none prose prose-invert prose-sm'
                            }`}>
                            {msg.role === 'tutor' ? (
                                <ReactMarkdown className="markdown-body">
                                    {msg.content}
                                </ReactMarkdown>
                            ) : (
                                <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                            )}

                            {/* Citation references for tutor messages */}
                            {msg.role === 'tutor' && citations.length > 0 && idx === messages.length - 1 && (
                                <div className="mt-3 pt-2 border-t border-slate-700/50 space-y-1">
                                    {citations.map((cite, i) => (
                                        <div key={i} className="flex items-center gap-1.5 text-xs text-indigo-300/80">
                                            {cite.source === 'Lesson' ? <BookOpen className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                                            <span className="opacity-70">Source:</span>
                                            <span className="font-medium">{cite.title}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex items-start gap-4">
                        <div className="w-8 h-8 shrink-0 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
                            <Bot className="w-4 h-4 text-white" />
                        </div>
                        <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-none px-5 py-4 shadow-md flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"></div>
                            <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            <div className="w-2 h-2 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-slate-900 border-t border-slate-800">
                <form onSubmit={handleSend} className="relative flex items-center">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask a question about this lesson..."
                        className="w-full bg-slate-800 border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl pl-4 pr-12 py-3 text-white placeholder:text-slate-500 transition-all outline-none"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className="absolute right-2 p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white transition-colors flex items-center justify-center"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                </form>
            </div>

            <style jsx global>{`
                .markdown-body p:last-child {
                    margin-bottom: 0;
                }
                .markdown-body ul, .markdown-body ol {
                    padding-left: 1.5rem;
                    margin-top: 0.5rem;
                    margin-bottom: 0.5rem;
                }
                .markdown-body li {
                    margin-bottom: 0.25rem;
                }
                .markdown-body strong {
                    color: white;
                }
            `}</style>
        </div>
    );
}
