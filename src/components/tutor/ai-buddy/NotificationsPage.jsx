'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BellRing, Send, BarChart2, Zap, Settings, AlertTriangle, Clock, 
    MessageSquare, CheckCircle2, ChevronDown, User, FileText, RefreshCw, PenTool, Sparkles
} from 'lucide-react';
import { C, T, S, R, cx, pageStyle } from '@/constants/tutorTokens';
import { toast } from 'react-hot-toast';
import api from '@/lib/axios';
import { cn } from '@/lib/utils';
import Image from 'next/image';

const MOCK_HISTORY = [
    { id: 1, student: 'Priya Patel', time: '10 mins ago', type: 'Performance Drop', message: "Hey Priya, I noticed your recent quiz scores dropped slightly. Would you like me to generate some extra practice questions for you?", isOpened: true },
    { id: 2, student: 'Rohan Gupta', time: '2 hours ago', type: 'Deadline Alert', message: "Hi Rohan, just a gentle reminder that your Physics assignment is due tomorrow. Let me know if you need help on any topic!", isOpened: false },
    { id: 3, student: 'Avinash Kumar', time: '1 day ago', type: 'Dropout Risk', message: "Hello Avinash, haven't seen you in the last 3 lectures. Everything okay? Remember, I'm here to support your learning journey whenever you're ready.", isOpened: true },
];

export default function NotificationsPage() {
    const [drafting, setDrafting] = useState(false);
    const [contextTopic, setContextTopic] = useState('');
    const [tone, setTone] = useState('Encouraging');
    const [draftedMessage, setDraftedMessage] = useState('');
    const [targetStudent, setTargetStudent] = useState('');
    
    // Toggles state
    const [triggers, setTriggers] = useState({
        dropout: true,
        performance: true,
        deadline: false
    });

    const handleDraft = async () => {
        if (!contextTopic.trim()) return toast.error('Please provide a context or reason.');
        if (!targetStudent.trim()) return toast.error('Please specify a target student/course.');

        setDrafting(true);
        try {
            const res = await api.post('/ai/draft-notification', {
                targetType: 'student',
                targetId: 'mock-id',
                contextTopic,
                tone
            });
            if (res.data.success) {
                setDraftedMessage(res.data.message);
                toast.success('AI successfully drafted the message!');
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to generate draft.');
        } finally {
            setDrafting(false);
        }
    };

    const handleSend = () => {
        if (!draftedMessage.trim()) return toast.error('Cannot send empty message.');
        toast.promise(
            new Promise(resolve => setTimeout(resolve, 800)),
            {
                loading: 'Dispatching...',
                success: 'Notification securely sent to student dashboard!',
                error: 'Failed to send'
            }
        ).then(() => {
            setDraftedMessage('');
            setContextTopic('');
            setTargetStudent('');
        });
    };

    const ToggleSwitch = ({ active, onClick }) => (
        <button onClick={onClick} className={cn("w-10 h-5 rounded-full transition-colors relative shrink-0", active ? "bg-[var(--theme-primary)]" : "bg-slate-200")}>
            <div className={cn("w-4 h-4 rounded-full bg-white shadow-sm absolute top-0.5 transition-transform", active ? "translate-x-5" : "translate-x-0.5")} />
        </button>
    );

    return (
        <div style={pageStyle} className="min-h-screen p-4 lg:p-6 pb-20 overflow-hidden relative selection:bg-purple-200">
            {/* Ambient Background */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[var(--theme-primary)]/10 rounded-full blur-[100px] -z-10 animate-pulse-slow" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-fuchsia-400/5 rounded-full blur-[100px] -z-10" />

            <div className="max-w-[1400px] mx-auto space-y-6">
                
                {/* ── Header Title & Stats ─────────────────────────────────── */}
                <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-6 mb-6">
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                            <BellRing className="w-8 h-8 text-[var(--theme-primary)] drop-shadow-sm" />
                            AI Smart Notifications
                        </h1>
                        <p className="text-slate-500 font-medium mt-1 text-sm ml-1">Automate empathetic alerts and let AI draft your student communications.</p>
                    </div>

                    <div className="flex gap-4">
                        <div className="bg-white/80 backdrop-blur border border-white p-3 rounded-2xl shadow-sm flex items-center gap-4 px-5">
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Sent</span>
                                <span className="text-2xl font-black text-slate-800">1,240</span>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center shrink-0 border border-purple-100">
                                <Send className="w-5 h-5 text-[var(--theme-primary)]" />
                            </div>
                        </div>
                        <div className="bg-white/80 backdrop-blur border border-white p-3 rounded-2xl shadow-sm flex items-center gap-4 px-5">
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Open Rate</span>
                                <span className="text-2xl font-black text-slate-800">84<span className="text-base text-slate-400">%</span></span>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100">
                                <BarChart2 className="w-5 h-5 text-emerald-500" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-[1.1fr_1.5fr_1.1fr] gap-6 items-start">
                    
                    {/* ── LEFT COLUMN: SMART TRIGGERS ──────────────────────── */}
                    <div className="space-y-6">
                        <div className={cn(C.box, "p-5")}>
                            <h2 className="text-[13px] font-black tracking-widest text-[var(--theme-primary)] uppercase flex items-center gap-2 mb-6">
                                <Zap className="w-4 h-4" /> Active Smart Triggers
                            </h2>
                            
                            <div className="space-y-4">
                                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl hover:bg-white transition-colors group">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center border border-orange-100"><AlertTriangle className="w-4 h-4 text-orange-500" /></div>
                                            <h3 className="font-bold text-slate-800">Dropout Risk Alert</h3>
                                        </div>
                                        <ToggleSwitch active={triggers.dropout} onClick={() => setTriggers(p=>({...p, dropout: !p.dropout}))} />
                                    </div>
                                    <p className="text-xs text-slate-500 leading-relaxed font-medium">Automatically pings students with high calculated dropout probabilities to schedule a 1:1 check-in.</p>
                                </div>

                                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl hover:bg-white transition-colors group">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center border border-red-100"><BarChart2 className="w-4 h-4 text-red-500" /></div>
                                            <h3 className="font-bold text-slate-800">Performance Drop</h3>
                                        </div>
                                        <ToggleSwitch active={triggers.performance} onClick={() => setTriggers(p=>({...p, performance: !p.performance}))} />
                                    </div>
                                    <p className="text-xs text-slate-500 leading-relaxed font-medium">Triggers when a student scores exactly 15% lower than their historical moving average across 2 tests.</p>
                                </div>

                                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl hover:bg-white transition-colors group">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100"><Clock className="w-4 h-4 text-blue-500" /></div>
                                            <h3 className="font-bold text-slate-800">Deadline Prompt</h3>
                                        </div>
                                        <ToggleSwitch active={triggers.deadline} onClick={() => setTriggers(p=>({...p, deadline: !p.deadline}))} />
                                    </div>
                                    <p className="text-xs text-slate-500 leading-relaxed font-medium">Sends an encouraging reminder 24 hours prior to a massive assignment if not submitted yet.</p>
                                </div>
                            </div>
                        </div>

                        <div className={cn(C.box, "p-5")}>
                            <h2 className="text-[13px] font-black tracking-widest text-slate-500 uppercase flex items-center gap-2 mb-4">
                                <Settings className="w-4 h-4" /> Global AI Tone
                            </h2>
                            <div className="space-y-2">
                                {['Encouraging', 'Professional', 'Strict'].map(t => (
                                    <label key={t} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors">
                                        <span className="text-sm font-bold text-slate-700">{t}</span>
                                        <input type="radio" name="tonePref" checked={tone === t} onChange={() => setTone(t)} className="w-4 h-4 accent-[var(--theme-primary)]" />
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>


                    {/* ── MIDDLE COLUMN: AI DRAFT STUDIO ──────────────────── */}
                    <div className={cn(C.box, "p-6 flex flex-col h-[750px] relative group overflow-hidden border-[var(--theme-primary)]/20 shadow-lg shadow-[var(--theme-primary)]/5")}>
                        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[var(--theme-primary)] to-purple-400 opacity-80" />
                        
                        <h2 className="text-[15px] font-black tracking-widest text-[var(--theme-primary)] uppercase flex items-center gap-2 mb-6">
                            <PenTool className="w-5 h-5" /> AI Draft Studio
                        </h2>

                        <div className="space-y-5 flex-1 flex flex-col">
                            {/* Target Student */}
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Target Recipient</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                    <input 
                                        type="text" 
                                        placeholder="e.g., Avinash Kumar, MCC 203..." 
                                        value={targetStudent}
                                        onChange={e => setTargetStudent(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-slate-800 font-bold focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent outline-none transition-all placeholder:text-slate-300 placeholder:font-medium"
                                    />
                                </div>
                            </div>

                            {/* Context Topic */}
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center justify-between">
                                    Notification Context
                                    <span className="text-[10px] text-[var(--theme-primary)] bg-purple-50 px-1.5 py-0.5 rounded uppercase font-bold">Be descriptive</span>
                                </label>
                                <textarea 
                                    placeholder="Explain why you are sending this message. E.g., 'Student failed the last two mock checks. Please encourage them to use the doubt solver.'."
                                    value={contextTopic}
                                    onChange={e => setContextTopic(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 font-medium focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent outline-none transition-all placeholder:text-slate-300 resize-none h-24"
                                />
                            </div>

                            <motion.button 
                                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                                onClick={handleDraft} disabled={drafting}
                                className="w-full bg-[var(--theme-primary)] hover:bg-purple-600 text-white rounded-xl py-3.5 font-bold shadow-md shadow-purple-500/25 flex items-center justify-center gap-2 disabled:opacity-50 transition-all font-semibold"
                            >
                                {drafting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                {drafting ? 'Generating Draft...' : 'Draft with AI'}
                            </motion.button>

                            {/* Render AI Output Area */}
                            <div className="flex-1 flex flex-col mt-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Generated Message</label>
                                <div className="flex-1 bg-purple-50/50 border border-purple-100 rounded-xl p-4 focus-within:bg-white focus-within:border-purple-300 focus-within:shadow-[0_4px_20px_-10px_rgba(124,58,237,0.3)] transition-all flex flex-col relative overflow-hidden">
                                    <div className="absolute -bottom-4 -right-4 bg-[var(--theme-primary)]/5 w-32 h-32 rounded-full blur-[20px] pointer-events-none" />
                                    <MessageSquare className="w-5 h-5 text-purple-200 absolute top-4 right-4 pointer-events-none" />
                                    
                                    <textarea 
                                        value={draftedMessage}
                                        onChange={e => setDraftedMessage(e.target.value)}
                                        placeholder="Your AI-crafted message will appear here. You can manually tweak it before sending."
                                        className="flex-1 w-full bg-transparent border-none text-slate-700 font-medium leading-[1.8] resize-none focus:ring-0 p-0 placeholder:text-slate-300"
                                    />
                                    
                                </div>
                            </div>

                            {/* Final Send */}
                            <motion.button 
                                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                                onClick={handleSend} disabled={!draftedMessage.trim()}
                                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl py-4 font-black text-lg shadow-md shadow-emerald-500/25 flex items-center justify-center gap-2 disabled:opacity-50 transition-all mt-auto"
                            >
                                <Send className="w-5 h-5" /> Send to Student
                            </motion.button>
                        </div>
                    </div>


                    {/* ── RIGHT COLUMN: HISTORY & LOGS ─────────────────────── */}
                    <div className="space-y-6">
                        <div className={cn(C.box, "p-0 overflow-hidden h-full flex flex-col")}>
                            <div className="p-5 border-b border-slate-100 bg-[var(--theme-primary)]/5 flex items-center justify-between">
                                <h2 className="text-[13px] font-black tracking-widest text-[var(--theme-primary)] uppercase flex items-center gap-2">
                                    <Clock className="w-4 h-4" /> AI Action Log
                                </h2>
                            </div>
                            
                            <div className="p-5 flex-1 overflow-y-auto space-y-5">
                                {MOCK_HISTORY.map((log) => (
                                    <div key={log.id} className="relative pl-6 pb-2 border-l-2 border-slate-100 last:border-transparent last:pb-0">
                                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-4 border-purple-200 flex items-center justify-center">
                                            <div className="w-1.5 h-1.5 rounded-full bg-[var(--theme-primary)]" />
                                        </div>
                                        
                                        <div className="mb-1 flex justify-between items-start">
                                            <p className="text-xs font-bold text-slate-800">To: {log.student}</p>
                                            <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">{log.time}</span>
                                        </div>
                                        
                                        <p className="text-[10px] font-bold text-[var(--theme-primary)] uppercase tracking-wider mb-2">{log.type}</p>
                                        
                                        <div className="p-3 bg-slate-50 rounded-xl rounded-tl-none border border-slate-100 text-[11px] text-slate-600 font-medium leading-relaxed relative group">
                                            &quot;{log.message}&quot;
                                            <div className="absolute right-2 bottom-2 bg-white/80 p-1 rounded backdrop-blur opacity-0 group-hover:opacity-100 transition-opacity">
                                                {log.isOpened ? (
                                                    <div className="flex items-center gap-1 text-emerald-500 text-[9px] font-black uppercase"><CheckCircle2 className="w-3 h-3"/> Read</div>
                                                ) : (
                                                    <div className="flex items-center gap-1 text-slate-400 text-[9px] font-black uppercase">Unread</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="p-4 bg-slate-50/50 border-t border-slate-100 text-center">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-[var(--theme-primary)] transition-colors">Load Older Logs</span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
