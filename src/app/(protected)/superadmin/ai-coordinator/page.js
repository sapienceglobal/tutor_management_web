'use client';

import React, { useState, useEffect, useRef } from 'react';
import axiosInstance from '@/lib/axios';
import ReactMarkdown from 'react-markdown';
import {
    Bot, User, Send, Zap, Loader2, Sparkles, CheckCircle2,
    AlertTriangle, TrendingUp, Wifi, BookOpen, Shield,
    Building2, GraduationCap, LayoutDashboard, Activity,
    TerminalSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const SUGGESTION_CHIPS = [
    { icon: TrendingUp,    label: 'Platform performance summary',     color: 'bg-[#F4F0FD] text-[#6B4DF1] border-[#E9DFFC]' },
    { icon: AlertTriangle, label: 'Konse institutes expiring hain?',  color: 'bg-[#FFF7ED] text-[#EA580C] border-[#FFEDD5]' },
    { icon: Wifi,          label: 'Abhi koi live class chal rahi hai?', color: 'bg-[#ECFDF5] text-[#10B981] border-[#D1FAE5]' },
    { icon: BookOpen,      label: 'Sabse popular course kaun sa hai?', color: 'bg-[#FDF4FF] text-[#C026D3] border-[#FAE8FF]' },
];

const softShadow = '0px 8px 30px -10px rgba(112, 128, 176, 0.12)';

// Animated typing dots indicator
function TypingIndicator() {
    return (
        <div className="flex gap-4 items-end mb-4">
            <div className="w-10 h-10 rounded-[14px] bg-[#F4F0FD] border border-[#E9DFFC] flex items-center justify-center shadow-sm flex-shrink-0">
                <Bot size={20} className="text-[#6B4DF1]" />
            </div>
            <div className="bg-white border border-[#E9DFFC] rounded-2xl rounded-bl-sm px-5 py-4 flex items-center gap-2 shadow-sm">
                <span className="text-[12px] text-[#6B4DF1] font-bold tracking-widest uppercase mr-1">Processing</span>
                {[0, 1, 2].map(i => (
                    <motion.div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-[#6B4DF1]"
                        animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                    />
                ))}
            </div>
        </div>
    );
}

// Live status pill
function StatusPill({ label, value, colorClass }) {
    return (
        <div className="flex flex-col items-center">
            <span className="text-[10px] font-bold tracking-widest uppercase text-[#A0ABC0]">{label}</span>
            <span className={`text-[15px] font-black tabular-nums ${colorClass}`}>{value}</span>
        </div>
    );
}

export default function SuperAdminAICoordinator() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [platformFootprint, setPlatformFootprint] = useState(null);
    const [isOnline] = useState(true);
    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);

    useEffect(() => {
        setMessages([{
            role: 'assistant',
            content: "### Coordinator Online 🟢\n\nWelcome back, **Super Admin**. I am your Agentic AI Platform Coordinator with real-time access to your entire LMS infrastructure.\n\nI can:\n- 📊 Fetch live platform metrics and health reports\n- 🏛️ Audit specific institutes, users, or courses\n- ⚡ Perform actions like suspend/block with your confirmation\n- 🔍 Search across students, tutors, and exams instantly\n\n*How can I assist your operations today?*"
        }]);
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + 'px';
        }
    }, [input]);

    const handleSendMessage = async (e) => {
        e?.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsg = input.trim();
        setInput('');
        const newHistory = [...messages, { role: 'user', content: userMsg }];
        setMessages(newHistory);
        setIsLoading(true);

        try {
            const res = await axiosInstance.post('/ai/superadmin-coordinator', {
                message: userMsg,
                history: messages.slice(-10)
            });
            if (res.data.success) {
                setMessages([...newHistory, { role: 'assistant', content: res.data.reply }]);
                if (res.data.platformStateFootprint) setPlatformFootprint(res.data.platformStateFootprint);
            }
        } catch {
            toast.error("Neural link interrupted.");
            setMessages([...newHistory, { role: 'assistant', content: "*Error: Failed to reach the AI core. Please check your network or API keys.*" }]);
        } finally {
            setIsLoading(false);
        }
    };

    const executeAction = async (actionObj, msgIndex) => {
        const t = toast.loading(`Executing: ${actionObj.action}...`);
        try {
            const res = await axiosInstance.post('/ai/execute-action', {
                action: actionObj.action,
                targetId: actionObj.targetId
            });
            toast.dismiss(t);
            if (res.data.success) {
                toast.success(res.data.message);
                setMessages(prev => {
                    const updated = [...prev];
                    updated[msgIndex] = { ...updated[msgIndex], actionExecuted: true };
                    return updated;
                });
            }
        } catch (err) {
            toast.dismiss(t);
            toast.error(err.response?.data?.message || "Execution failed");
        }
    };

    const renderMessageContent = (msg, index) => {
        if (msg.role === 'user') {
            return <p className="text-white text-[14px] leading-relaxed whitespace-pre-wrap m-0">{msg.content}</p>;
        }

        const jsonBlockRegex = /```json\s*(\{[\s\S]*?\})\s*```/g;
        let cleanContent = msg.content;
        let actionObj = null;

        const match = jsonBlockRegex.exec(msg.content);
        if (match?.[1]) {
            try {
                actionObj = JSON.parse(match[1]);
                cleanContent = msg.content.replace(match[0], '').trim();
            } catch { /* silent */ }
        }

        return (
            <div className="space-y-4 w-full">
                {/* Custom Markdown Styling without prose plugin */}
                <div className="text-[14px] text-[#4A5568] leading-relaxed break-words">
                    <ReactMarkdown
                        components={{
                            p: ({node, ...props}) => <p className="mb-3 last:mb-0" {...props} />,
                            strong: ({node, ...props}) => <strong className="font-black text-[#27225B]" {...props} />,
                            h1: ({node, ...props}) => <h1 className="text-[20px] font-black text-[#27225B] mt-4 mb-2" {...props} />,
                            h2: ({node, ...props}) => <h2 className="text-[18px] font-black text-[#27225B] mt-4 mb-2" {...props} />,
                            h3: ({node, ...props}) => <h3 className="text-[16px] font-bold text-[#6B4DF1] mt-3 mb-2" {...props} />,
                            ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-3 space-y-1 marker:text-[#6B4DF1]" {...props} />,
                            ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-3 space-y-1 marker:text-[#6B4DF1]" {...props} />,
                            li: ({node, ...props}) => <li className="" {...props} />,
                            code: ({node, inline, ...props}) => 
                                inline 
                                ? <code className="bg-[#F4F0FD] text-[#6B4DF1] px-1.5 py-0.5 rounded-md text-[12px] font-bold font-mono" {...props} />
                                : <code className="block bg-[#27225B] text-[#A78BFA] p-3 rounded-xl text-[12px] overflow-x-auto font-mono my-3 shadow-inner" {...props} />,
                            blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-[#6B4DF1] bg-[#F9F7FC] pl-4 py-2 italic text-[#7D8DA6] rounded-r-lg my-3" {...props} />,
                        }}
                    >
                        {cleanContent}
                    </ReactMarkdown>
                </div>

                {/* The Action Execution Block */}
                {actionObj && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.97, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        className="mt-4 rounded-[16px] overflow-hidden border border-[#FFEDD5] bg-[#FFF7ED] shadow-sm"
                    >
                        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-[#FFEDD5] bg-[#FFFBEB]">
                            <div className="w-7 h-7 rounded-lg bg-[#FFEDD5] flex items-center justify-center">
                                <TerminalSquare size={14} className="text-[#EA580C]" />
                            </div>
                            <span className="text-[11px] font-black text-[#EA580C] uppercase tracking-wider">Pending Command</span>
                           <span className="ml-auto text-[10px] font-bold text-[#EA580C] bg-[#FFEDD5] px-2.5 py-1 rounded-md border border-[#FDBA74] uppercase tracking-wider">
    {actionObj.operation ? `${actionObj.operation} USER/INSTITUTE` : actionObj.action}
</span>
                        </div>
                        <div className="px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div>
                                <p className="text-[11px] font-bold text-[#A0ABC0] uppercase tracking-wider mb-1">Target ID</p>
                                <p className="text-[13px] font-mono font-bold text-[#27225B] bg-white px-3 py-1.5 rounded-lg border border-[#E9DFFC] inline-block m-0">
                                    {actionObj.targetId}
                                </p>
                            </div>
                            {msg.actionExecuted ? (
                                <div className="flex items-center gap-2 bg-[#ECFDF5] border border-[#A7F3D0] text-[#10B981] text-[13px] font-bold px-5 py-2.5 rounded-xl w-full sm:w-auto justify-center">
                                    <CheckCircle2 size={16} strokeWidth={3} /> Executed Successfully
                                </div>
                            ) : (
                                <button
                                    onClick={() => executeAction(actionObj, index)}
                                    className="flex items-center justify-center gap-2 bg-[#6B4DF1] hover:bg-[#5839D6] active:scale-95 text-white text-[13px] font-bold px-6 py-2.5 rounded-xl transition-all shadow-[0_4px_14px_rgba(107,77,241,0.25)] border-none cursor-pointer w-full sm:w-auto"
                                >
                                    <Zap size={14} strokeWidth={3} /> Approve & Execute
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}
            </div>
        );
    };

    return (
        <div className="h-[calc(100vh-88px)] flex flex-col relative overflow-hidden rounded-[24px] bg-[#F4EEFD] font-sans -m-4 lg:-m-6">
            
            <div className="relative z-10 flex flex-col h-full">
                {/* ── Header ── */}
                <div className="flex flex-col md:flex-row items-center justify-between px-6 py-4 border-b border-[#E9DFFC] bg-white flex-shrink-0" style={{ boxShadow: softShadow }}>
                    <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="w-12 h-12 rounded-[14px] bg-[#F4F0FD] border border-[#E9DFFC] flex items-center justify-center">
                                    <Bot size={24} className="text-[#6B4DF1]" />
                                </div>
                                <div className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${isOnline ? 'bg-[#10B981]' : 'bg-[#E53E3E]'}`} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[#27225B] font-black text-[18px] tracking-tight">AI Coordinator</span>
                                    <Sparkles size={16} className="text-[#F59E0B]" />
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#6B4DF1] bg-[#F4F0FD] px-2 py-0.5 rounded border border-[#E9DFFC]">Superadmin God Mode</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats bar (Hidden on mobile for space) */}
                    <AnimatePresence>
                        {platformFootprint && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="hidden lg:flex items-center gap-6 px-6 py-2.5 rounded-xl border border-[#E9DFFC] bg-[#F9F7FC]"
                            >
                                <StatusPill label="Institutes" value={platformFootprint.totalInstitutes} colorClass="text-[#10B981]" />
                                <div className="w-px h-8 bg-[#E9DFFC]" />
                                <StatusPill label="Students" value={platformFootprint.totalStudents} colorClass="text-[#6B4DF1]" />
                                <div className="w-px h-8 bg-[#E9DFFC]" />
                                <StatusPill label="Tutors" value={platformFootprint.totalTutors ?? '—'} colorClass="text-[#EA580C]" />
                                <div className="w-px h-8 bg-[#E9DFFC]" />
                                <StatusPill label="Courses" value={platformFootprint.totalActiveCourses} colorClass="text-[#3182CE]" />
                                {platformFootprint.expiringInstitutesCount > 0 && (
                                    <>
                                        <div className="w-px h-8 bg-[#E9DFFC]" />
                                        <StatusPill label="Expiring" value={platformFootprint.expiringInstitutesCount} colorClass="text-[#E53E3E]" />
                                    </>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* ── Chat area ── */}
                <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6 bg-[#FDFBFF] custom-scrollbar">
                    <AnimatePresence initial={false}>
                        {messages.map((msg, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ type: 'spring', stiffness: 280, damping: 24 }}
                                className={`flex gap-4 items-end max-w-4xl ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
                            >
                                {/* Avatar */}
                                {msg.role === 'user' ? (
                                    <div className="w-10 h-10 rounded-[14px] bg-white border border-[#E9DFFC] shadow-sm flex items-center justify-center flex-shrink-0">
                                        <User size={18} className="text-[#7D8DA6]" />
                                    </div>
                                ) : (
                                    <div className="w-10 h-10 rounded-[14px] bg-[#F4F0FD] border border-[#E9DFFC] shadow-sm flex items-center justify-center flex-shrink-0">
                                        <Bot size={20} className="text-[#6B4DF1]" />
                                    </div>
                                )}

                                {/* Bubble */}
                                <div className={`px-6 py-4 shadow-sm w-full ${
                                    msg.role === 'user'
                                        ? 'rounded-3xl rounded-br-sm bg-[#6B4DF1] text-white border border-[#5839D6]'
                                        : 'rounded-3xl rounded-bl-sm bg-white border border-[#E9DFFC]'
                                }`}>
                                    {renderMessageContent(msg, idx)}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {isLoading && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl">
                            <TypingIndicator />
                        </motion.div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* ── Input area ── */}
                <div className="px-4 md:px-8 py-5 border-t border-[#E9DFFC] bg-white flex-shrink-0">
                    
                    {/* Suggestion chips */}
                    <AnimatePresence>
                        {messages.length <= 1 && (
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, height: 0 }}
                                className="flex flex-wrap gap-2 mb-3"
                            >
                                {SUGGESTION_CHIPS.map((chip, i) => (
                                    <motion.button
                                        key={i}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: i * 0.05 }}
                                        onClick={() => setInput(chip.label)}
                                        className={`group flex items-center gap-2 px-4 py-2 rounded-xl border text-[12px] font-bold transition-all duration-200 cursor-pointer ${chip.color} hover:shadow-sm`}
                                    >
                                        <chip.icon size={14} />
                                        {chip.label}
                                    </motion.button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Text input */}
                    <form onSubmit={handleSendMessage} className="flex items-end gap-3">
                        <div className="flex-1 flex items-end gap-2 rounded-[20px] border border-[#E9DFFC] bg-[#F9F7FC] px-5 py-3 transition-all duration-200 focus-within:border-[#6B4DF1] focus-within:ring-2 focus-within:ring-[#6B4DF1]/20 focus-within:bg-white shadow-sm">
                            <textarea
                                ref={textareaRef}
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage();
                                    }
                                }}
                                placeholder="Command your LMS or ask for platform insights..."
                                className="flex-1 bg-transparent text-[#27225B] placeholder:text-[#A0ABC0] outline-none resize-none text-[14px] font-semibold leading-relaxed min-h-[24px] max-h-[160px] custom-scrollbar"
                                rows={1}
                            />
                            <div className="text-[10px] font-bold text-[#A0ABC0] mb-0.5 flex-shrink-0 hidden md:block uppercase tracking-wider">⏎ Send</div>
                        </div>

                        <button
                            type="submit"
                            disabled={!input.trim() || isLoading}
                            className="h-[52px] w-[52px] rounded-[18px] bg-[#6B4DF1] hover:bg-[#5839D6] flex items-center justify-center transition-all duration-200 flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 shadow-[0_4px_14px_rgba(107,77,241,0.25)] border-none cursor-pointer"
                        >
                            {isLoading ? <Loader2 size={20} className="text-white animate-spin" /> : <Send size={20} className="text-white ml-1" />}
                        </button>
                    </form>

                    <p className="text-center text-[10px] text-[#A0ABC0] mt-3 tracking-widest font-bold uppercase select-none flex items-center justify-center gap-1.5">
                        <Shield size={12}/> Sapience Secure Line • Actions require manual approval
                    </p>
                </div>
            </div>
        </div>
    );
}