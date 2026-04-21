'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    BrainCircuit, LayoutGrid, ChevronLeft, ChevronRight,
    Bot, HelpCircle, FileStack, NotebookPen,
    CheckSquare, PenLine, ScanSearch,
    Lightbulb, Map, AlertTriangle, UserMinus,
    Eye, Shield, Wand2, Hammer, Bell, Sparkles,
    Crown,Lock
} from 'lucide-react';
import api from '@/lib/axios';
import { C, T } from '@/constants/tutorTokens';
import FeatureGate from '@/components/FeatureGate';
import { useSubscription } from '@/contexts/SubscriptionContext';

const AI_NAV = [
    { title: 'AI Dashboard', href: '/tutor/ai-buddy', icon: LayoutGrid, type: 'link', featureKey: 'aiAssistant' },
    {
        title: 'Smart Teaching', type: 'group', color: '#3B82F6', featureKey: 'aiAssistant', // 🌟 Starter
        children: [
            { title: 'AI Assistant Chat', href: '/tutor/ai-buddy/assistant', icon: Bot },
            { title: 'AI Doubt Solver', href: '/tutor/ai-buddy/doubt-solver', icon: HelpCircle },
            { title: 'Lecture Summary', href: '/tutor/ai-buddy/lecture-summary', icon: FileStack },
            { title: 'Notes Simplifier', href: '/tutor/ai-buddy/notes-simplifier', icon: NotebookPen },
        ],
    },
    {
        title: 'Smart Assessment', type: 'group', color: '#F59E0B', featureKey: 'aiAssessment', // 🌟 Pro
        children: [
            { title: 'Assignment Evaluator', href: '/tutor/ai-buddy/assignment-eval', icon: CheckSquare },
            { title: 'Subjective Checker', href: '/tutor/ai-buddy/subjective-check', icon: PenLine },
            { title: 'Plagiarism Insight', href: '/tutor/ai-buddy/plagiarism', icon: ScanSearch },
        ],
    },
    {
        title: 'Student Intelligence', type: 'group', color: '#10B981', featureKey: 'aiIntelligence', // 🌟 Enterprise
        children: [
            { title: 'Weak Topics', href: '/tutor/ai-buddy/weak-topics', icon: Lightbulb },
            { title: 'Study Plan', href: '/tutor/ai-buddy/study-plan', icon: Map },
            { title: 'Risk Predictor', href: '/tutor/ai-buddy/risk-predictor', icon: AlertTriangle },
            { title: 'Dropout Risk', href: '/tutor/ai-buddy/dropout-risk', icon: UserMinus },
        ],
    },
    {
        title: 'Exam Intelligence', type: 'group', color: '#8B5CF6', featureKey: 'aiAssessment', // 🌟 Pro
        children: [
            { title: 'Proctoring Alerts', href: '/tutor/ai-buddy/proctoring', icon: Eye },
            { title: 'Exam Review', href: '/tutor/ai-buddy/suspicion-review', icon: Shield },
        ],
    },
    {
        title: 'AI Automation', type: 'group', color: '#EC4899', featureKey: 'aiIntelligence', // 🌟 Enterprise
        children: [
            { title: 'AI Report Generator', href: '/tutor/ai-buddy/report-gen', icon: Wand2 },
            { title: 'AI Course Builder', href: '/tutor/ai-buddy/course-builder', icon: Hammer },
            { title: 'AI Notifications', href: '/tutor/ai-buddy/notifications', icon: Bell },
        ],
    },
];

// ─── Sub-sidebar ──────────────────────────────────────────────────────────────
function AiSubSidebar({ collapsed, setCollapsed }) {
    const pathname = usePathname();
    const [expandedGroups, setExpandedGroups] = useState({ 'Smart Teaching': true });
    // ✅ real stats
    const [sidebarStats, setSidebarStats] = useState({ totalSessions: null, totalTasks: null });

    useEffect(() => {
        api.get('/ai/tutor-dashboard-stats')
            .then(res => {
                if (res.data?.success) {
                    setSidebarStats({
                        totalSessions: res.data.stats?.totalSessions ?? 0,
                        totalTasks: res.data.stats?.totalTasks ?? 0,
                    });
                }
            })
            .catch(() => { /* silent — stats are non-critical */ });
    }, []);

    useEffect(() => {
        AI_NAV.forEach(item => {
            if (item.type === 'group') {
                const hasActive = item.children.some(c => pathname === c.href || pathname.startsWith(c.href + '/'));
                if (hasActive) setExpandedGroups(prev => ({ ...prev, [item.title]: true }));
            }
        });
    }, [pathname]);

    const toggle = (title) => setExpandedGroups(prev => ({ ...prev, [title]: !prev[title] }));

    const SB = {
        bg: 'rgba(255,255,255,0.95)',
        border: 'rgba(117,115,232,0.12)',
        activeBg: 'rgba(117,115,232,0.10)',
        hoverBg: 'rgba(117,115,232,0.06)',
        activeText: '#4F46E5',
        inactiveText: '#64748B',
        headerBg: 'linear-gradient(135deg, #6366F1, #4F46E5)',
    };

    if (collapsed) {
        return (
            <div className="flex flex-col items-center py-4 gap-3"
                style={{ width: 56, borderRight: `1px solid ${SB.border}`, backgroundColor: SB.bg }}>
                <button onClick={() => setCollapsed(false)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:opacity-80"
                    style={{ background: SB.headerBg }}>
                    <ChevronRight className="w-4 h-4 text-white" />
                </button>
                <div className="w-8 h-px" style={{ backgroundColor: SB.border }} />
                {AI_NAV.map(item => {
                    if (item.type === 'link') {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link key={item.href} href={item.href}
                                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                                style={{ backgroundColor: isActive ? SB.activeBg : 'transparent' }}
                                onMouseEnter={e => { e.currentTarget.style.backgroundColor = SB.hoverBg; }}
                                onMouseLeave={e => { e.currentTarget.style.backgroundColor = isActive ? SB.activeBg : 'transparent'; }}>
                                <Icon className="w-4 h-4" style={{ color: isActive ? SB.activeText : SB.inactiveText }} />
                            </Link>
                        );
                    }
                    return (
                        <div key={item.title} className="w-9 h-9 rounded-xl flex items-center justify-center">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        </div>
                    );
                })}
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full overflow-hidden"
            style={{ width: 224, borderRight: `1px solid ${SB.border}`, backgroundColor: SB.bg }}>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3.5 flex-shrink-0"
                style={{ background: SB.headerBg }}>
                <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center">
                        <BrainCircuit className="w-4 h-4 text-white" />
                    </div>
                    <span style={{ fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: T.weight.black, color: '#fff' }}>AI Buddy</span>
                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-white/20 text-white tracking-wide">Premium</span>
                </div>
                <button onClick={() => setCollapsed(true)}
                    className="w-6 h-6 rounded-lg flex items-center justify-center bg-white/15 hover:bg-white/25 transition-all">
                    <ChevronLeft className="w-3.5 h-3.5 text-white" />
                </button>
            </div>

            {/* Nav */}
            <div className="flex-1 overflow-y-auto py-2 px-2 custom-scrollbar">
                {AI_NAV.map(item => {
                    if (item.type === 'link') {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link key={item.href} href={item.href}
                                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl mb-1 transition-all"
                                style={{ backgroundColor: isActive ? SB.activeBg : 'transparent', fontFamily: T.fontFamily, fontSize: T.size.sm, fontWeight: isActive ? T.weight.semibold : T.weight.medium, color: isActive ? SB.activeText : SB.inactiveText }}
                                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.backgroundColor = SB.hoverBg; e.currentTarget.style.color = SB.activeText; } }}
                                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = SB.inactiveText; } }}>
                                <Icon className="w-4 h-4 flex-shrink-0" style={{ color: isActive ? SB.activeText : '#94A3B8' }} />
                                <span>{item.title}</span>
                                {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: SB.activeText }} />}
                            </Link>
                        );
                    }

                    const isOpen = expandedGroups[item.title];
                    return (

                        <FeatureGate key={item.title} featureName={item.featureKey} mode="lock" className="mb-1">
                            <button onClick={() => toggle(item.title)}
                                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all"
                                style={{ fontFamily: T.fontFamily, fontSize: T.size.xs, color: item.color }}
                                onMouseEnter={e => { e.currentTarget.style.backgroundColor = SB.hoverBg; }}
                                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                                <span className="flex-1 text-left font-bold" style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>{item.title}</span>
                                <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-90' : ''}`}
                                    style={{ color: item.color + '80' }} />
                            </button>
                            <div className={`overflow-hidden transition-all duration-200 ${isOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'}`}>
                                <div className="ml-4 pl-3 py-0.5 space-y-0.5" style={{ borderLeft: `2px solid ${item.color}30` }}>
                                    {item.children.map(child => {
                                        const Icon = child.icon;
                                        const isActive = pathname === child.href || pathname.startsWith(child.href + '/');
                                        return (
                                            <Link key={child.href} href={child.href}
                                                className="flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all"
                                                style={{ backgroundColor: isActive ? `${item.color}12` : 'transparent', fontFamily: T.fontFamily, fontSize: T.size.xs, fontWeight: isActive ? T.weight.semibold : T.weight.regular, color: isActive ? item.color : '#64748B' }}
                                                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.backgroundColor = SB.hoverBg; e.currentTarget.style.color = item.color; } }}
                                                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#64748B'; } }}>
                                                <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: isActive ? item.color : '#94A3B8' }} />
                                                <span className="truncate">{child.title}</span>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        </FeatureGate>
                    );
                })}
            </div>

            {/* ✅ Bottom stats — real data */}
            <div className="p-3 flex-shrink-0" style={{ borderTop: `1px solid ${SB.border}` }}>
                <div className="rounded-xl p-3" style={{ backgroundColor: 'rgba(117,115,232,0.06)', border: '1px solid rgba(117,115,232,0.12)' }}>
                    <p style={{ fontFamily: T.fontFamily, fontSize: '10px', fontWeight: T.weight.bold, color: '#7573E8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                        AI Usage
                    </p>
                    {[
                        { label: 'Chats', value: sidebarStats.totalSessions },
                        { label: 'Tasks Done', value: sidebarStats.totalTasks },
                    ].map(({ label, value }) => (
                        <div key={label} className="flex items-center justify-between mb-1">
                            <span style={{ fontFamily: T.fontFamily, fontSize: '11px', color: '#94A3B8' }}>{label}</span>
                            <span style={{ fontFamily: T.fontFamily, fontSize: '11px', fontWeight: T.weight.bold, color: '#334155' }}>
                                {value === null ? '…' : value}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
const getRequiredFeatureForPath = (pathname) => {
    for (const item of AI_NAV) {
        if (item.type === 'link' && pathname === item.href) {
            return item.featureKey;
        }
        if (item.type === 'group') {
            const isMatch = item.children.some(child => pathname === child.href || pathname.startsWith(child.href + '/'));
            if (isMatch) return item.featureKey;
        }
    }
    return 'aiAssistant'; // Default base feature
};
// ─── Layout ───────────────────────────────────────────────────────────────────
export default function AiBuddyLayout({ children }) {
    const [collapsed, setCollapsed] = useState(false);
    const pathname = usePathname();
    
    // 🌟 2. Context se details nikali
    const { hasFeature, loading, openUpsellModal } = useSubscription();

    // 🌟 3. Current page ke liye kaunsi chaabi chahiye?
    const requiredFeature = getRequiredFeatureForPath(pathname);
    
    // 🌟 4. Check karo ki kya user ke paas wo chaabi hai?
    const isAuthorized = hasFeature(requiredFeature);

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden rounded-2xl"
            style={{ border: '1px solid rgba(117,115,232,0.12)', boxShadow: '0 4px 32px rgba(117,115,232,0.08)' }}>
            
            <AiSubSidebar collapsed={collapsed} setCollapsed={setCollapsed} />
            
            <div className="flex-1 overflow-y-auto relative bg-[#F8F6FC]">
                {/* 🌟 5. Route Protection Logic */}
                {loading ? (
                    <div className="flex h-full items-center justify-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-[#6B4DF1]"></div>
                    </div>
                ) : isAuthorized ? (
                    // Agar authorized hai, toh actual page dikhao
                    children
                ) : (
                    // Agar URL bypass karke aaya hai, toh Access Denied dikhao!
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-6 bg-white/80 backdrop-blur-md">
                        <div className="bg-white p-8 rounded-3xl shadow-2xl border border-[#E9DFFC] max-w-md w-full text-center transform transition-all">
                            <div className="w-20 h-20 bg-[#F4F0FD] rounded-full flex items-center justify-center mx-auto mb-6">
                                <Lock size={32} className="text-[#6B4DF1]" />
                            </div>
                            <h2 className="text-2xl font-black text-[#27225B] mb-2">Access Restricted</h2>
                            <p className="text-[#7D8DA6] text-[14px] font-medium mb-8 leading-relaxed">
                                The module you are trying to access requires the <strong className="text-[#6B4DF1]">{requiredFeature}</strong> feature, which is not available in your current plan.
                            </p>
                            
                            <button 
                                onClick={openUpsellModal}
                                className="w-full py-3.5 bg-[#6B4DF1] text-white text-[14px] font-bold rounded-xl hover:bg-[#5839D6] transition-colors shadow-lg shadow-[#6B4DF1]/30 flex items-center justify-center gap-2 border-none cursor-pointer"
                            >
                                <Crown size={18} /> View Upgrade Options
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}