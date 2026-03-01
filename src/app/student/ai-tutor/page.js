'use client';

import { useState, useRef, useEffect } from 'react';
import {
    Search,
    Send,
    Plus,
    Mic,
    Bot,
    BookOpen,
    FileQuestion,
    Calculator,
    Layers,
    ClipboardList,
    ChevronRight,
    ChevronLeft,
} from 'lucide-react';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';

const QUICK_ACTIONS = [
    { label: "Explain Newton's Laws", icon: BookOpen, bg: 'bg-purple-100 text-purple-800', iconBg: 'bg-purple-200' },
    { label: 'Generate Quiz', icon: FileQuestion, bg: 'bg-indigo-100 text-indigo-800', iconBg: 'bg-indigo-200' },
    { label: 'Summarize Chapter', icon: BookOpen, bg: 'bg-amber-100 text-amber-800', iconBg: 'bg-amber-200' },
    { label: 'Solve Math Problem', icon: Calculator, bg: 'bg-emerald-100 text-emerald-800', iconBg: 'bg-emerald-200' },
    { label: 'Create Flashcards', icon: Layers, bg: 'bg-sky-100 text-sky-800', iconBg: 'bg-sky-200' },
    { label: 'Prepare Exam Plan', icon: ClipboardList, bg: 'bg-pink-100 text-pink-800', iconBg: 'bg-pink-200' },
];

export default function AITutorPage() {
    const [question, setQuestion] = useState('');
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([
        {
            id: '1',
            role: 'user',
            text: "How do I calculate compound interest?",
            userName: 'Manohar',
            userImage: null,
            time: new Date(),
        },
        {
            id: '2',
            role: 'assistant',
            text: `1. Understand the formula: A = P (1 + r/n)^(nt)
• A = Final amount
• P = Principal (initial amount)
• r = Annual interest rate (decimal)
• n = Number of times interest is compounded per year
• t = Time in years

2. Apply the values: Let's say you want to find the compound interest on a $10,000 investment with an annual interest rate of 5% compounded quarterly for 3 years.

A = 10,000 (1 + 0.05/4)^(4×3)`,
            time: new Date(),
        },
    ]);
    const [sending, setSending] = useState(false);
    const [model, setModel] = useState('Sapience AI');
    const [chatPage, setChatPage] = useState(1);
    const chatEndRef = useRef(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleAsk = (q) => {
        const qText = typeof q === 'string' ? q : question;
        if (!qText.trim()) return;
        setSending(true);
        const userMsg = {
            id: Date.now().toString(),
            role: 'user',
            text: qText.trim(),
            userName: 'You',
            time: new Date(),
        };
        setMessages((prev) => [...prev, userMsg]);
        setQuestion('');
        setMessage('');

        // Placeholder: backend integration can be added here (e.g. api.post('/ai/tutor-chat', { message: qText }))
        setTimeout(() => {
            setMessages((prev) => [
                ...prev,
                {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    text: 'Backend integration can be connected here. You asked: "' + qText + '"',
                    time: new Date(),
                },
            ]);
            setSending(false);
        }, 800);
    };

    const handleQuickAction = (label) => {
        setQuestion(label);
    };

    return (
        <div className="min-h-screen bg-[#f0f2f8]">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
                <div className="bg-white/80 backdrop-blur rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    {/* Header */}
                    <div className="p-6 border-b border-slate-100">
                        <h1 className="text-2xl font-bold text-slate-900">Sapience AI Tutor</h1>
                        <p className="text-slate-600 mt-1">Ask questions, generate notes, solve problems instantly</p>

                        <div className="relative mt-6">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAsk(question)}
                                placeholder="Ask a question..."
                                className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white text-slate-800 placeholder:text-slate-400"
                            />
                            <button
                                type="button"
                                onClick={() => handleAsk(question)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                            >
                                <Search className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Quick action cards */}
                    <div className="px-6 py-4 border-b border-slate-100 overflow-x-auto">
                        <div className="flex gap-3 pb-2 min-w-max">
                            {QUICK_ACTIONS.map((action, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => handleQuickAction(action.label)}
                                    className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium text-sm whitespace-nowrap transition-colors hover:opacity-90 ${action.bg}`}
                                >
                                    <span className={`p-1.5 rounded-lg ${action.iconBg}`}>
                                        <action.icon className="w-4 h-4" />
                                    </span>
                                    {action.label}
                                </button>
                            ))}
                            <span className="flex items-center justify-center w-10 text-slate-400">
                                <ChevronRight className="w-5 h-5" />
                            </span>
                        </div>
                    </div>

                    {/* Chat area */}
                    <div className="p-6 min-h-[400px] max-h-[60vh] overflow-y-auto space-y-6">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                {msg.role === 'assistant' && (
                                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                                        <Bot className="w-5 h-5 text-indigo-600" />
                                    </div>
                                )}
                                <div
                                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                                        msg.role === 'user'
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-slate-100 text-slate-800 border border-slate-200'
                                    }`}
                                >
                                    {msg.role === 'user' && msg.userName && (
                                        <p className="text-xs font-semibold opacity-90 mb-1">{msg.userName}</p>
                                    )}
                                    {msg.role === 'assistant' && (
                                        <p className="text-xs font-semibold text-indigo-600 mb-1">AI Tutor</p>
                                    )}
                                    <div className="text-sm whitespace-pre-wrap">{msg.text}</div>
                                </div>
                                {msg.role === 'user' && (
                                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center shrink-0 text-slate-600 font-semibold">
                                        {msg.userName?.charAt(0) || 'U'}
                                    </div>
                                )}
                            </div>
                        ))}
                        {sending && (
                            <div className="flex gap-3 justify-start">
                                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                                    <Bot className="w-5 h-5 text-indigo-600" />
                                </div>
                                <div className="bg-slate-100 rounded-2xl px-4 py-3 border border-slate-200">
                                    <div className="flex gap-1">
                                        <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Message input */}
                    <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                        <div className="flex gap-2">
                            <button
                                type="button"
                                className="p-2 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                            <input
                                type="text"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleAsk(message)}
                                placeholder="Type a message..."
                                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg bg-white text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                            <Button
                                onClick={() => handleAsk(message)}
                                disabled={sending}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1"
                            >
                                <Send className="w-4 h-4" />
                                Send
                            </Button>
                        </div>

                        {/* Options bar */}
                        <div className="flex flex-wrap items-center gap-2 mt-3 text-sm">
                            <select
                                value={model}
                                onChange={(e) => setModel(e.target.value)}
                                className="px-2 py-1 border border-slate-200 rounded bg-white text-slate-600"
                            >
                                <option>GPT-4</option>
                                <option>Sapience AI</option>
                            </select>
                            <button type="button" className="p-1.5 rounded text-slate-500 hover:bg-slate-100">
                                <Mic className="w-4 h-4" />
                            </button>
                            <Button variant="outline" size="sm" className="border-slate-200 text-slate-600">
                                Ask from Course
                            </Button>
                            <select className="px-2 py-1 border border-slate-200 rounded bg-white text-slate-600">
                                <option>Sapience AI</option>
                                <option>GPT-4</option>
                            </select>
                        </div>

                        {/* Recent Chat History */}
                        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-sm font-semibold text-slate-700">Recent Chat History</span>
                            <div className="flex items-center gap-1">
                                <button type="button" className="p-1.5 rounded hover:bg-slate-100 text-slate-500 disabled:opacity-50" disabled={chatPage <= 1}>
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="flex items-center gap-1">
                                    {[1, 2, 3].map((p) => (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => setChatPage(p)}
                                            className={`w-8 h-8 rounded text-sm font-medium ${chatPage === p ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </span>
                                <button type="button" className="p-1.5 rounded hover:bg-slate-100 text-slate-500">
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
