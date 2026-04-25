'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import {
    Settings as SettingsIcon, Bell, Lock, Shield, Loader2,
    ChevronRight, CheckCircle, Smartphone, Globe, LogOut, Laptop
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { C, T, R } from '@/constants/studentTokens';

// ── Reusable themed Toggle ───────────────────────────────────────────────────
const Toggle = ({ checked, onToggle }) => (
    <button type="button" onClick={onToggle}
        className="w-11 h-6 rounded-full transition-colors relative shrink-0"
        style={{ backgroundColor: checked ? 'var(--theme-primary)' : 'color-mix(in srgb, var(--theme-foreground) 15%, transparent)' }}>
        <span className={`block w-5 h-5 rounded-full bg-white shadow absolute top-0.5 transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
);

const TABS = [
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security',      label: 'Security & Sessions', icon: Shield },
];

export default function StudentSettingsPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('notifications');
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Notifications State
    const [notifSettings, setNotifSettings] = useState({ email: true, push: true, sms: false });
    
    // Security State
    const [sessions, setSessions] = useState([]);
    const [revoking, setRevoking] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [meRes, sessionsRes] = await Promise.all([
                api.get('/auth/me'),
                api.get('/auth/sessions').catch(() => ({ data: { sessions: [] } }))
            ]);

            if (meRes.data?.success) {
                const u = meRes.data.user;
                setUser(u);
                setNotifSettings({
                    email: u.notificationSettings?.email !== false,
                    push: u.notificationSettings?.push !== false,
                    sms: u.notificationSettings?.sms === true,
                });
            }
            if (sessionsRes.data?.sessions) {
                setSessions(sessionsRes.data.sessions);
            }
        } catch (err) {
            toast.error('Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const handleNotificationToggle = async (key, value) => {
        const next = { ...notifSettings, [key]: value };
        setNotifSettings(next); // optimistic update
        try {
            await api.patch('/auth/notification-settings', next);
            toast.success('Preferences updated');
        } catch {
            setNotifSettings(notifSettings); // revert
            toast.error('Failed to update preferences');
        }
    };

    const handleRevokeSession = async (sessionId) => {
        setRevoking(sessionId);
        try {
            await api.delete(`/auth/sessions/${sessionId}`);
            setSessions(prev => prev.filter(s => s._id !== sessionId));
            toast.success('Session revoked successfully');
        } catch {
            toast.error('Failed to revoke session');
        } finally {
            setRevoking(null);
        }
    };

    const cardStyle = { backgroundColor: 'var(--theme-background)', borderColor: 'var(--theme-border)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-10 h-10 rounded-full border-[3px] animate-spin"
                style={{ borderColor: 'color-mix(in srgb, var(--theme-primary) 20%, transparent)', borderTopColor: 'var(--theme-primary)' }} />
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-black tracking-tight flex items-center gap-2" style={{ color: 'var(--theme-foreground)' }}>
                    <SettingsIcon className="w-6 h-6" style={{ color: 'var(--theme-primary)' }} /> Settings
                </h1>
                <p className="text-sm mt-0.5" style={{ color: 'var(--theme-foreground)', opacity: 0.45 }}>
                    Manage your preferences and security
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                
                {/* ── Left Sidebar Tabs ──────────────────────────────────── */}
                <div className="lg:col-span-1 space-y-2">
                    {TABS.map(tab => {
                        const active = activeTab === tab.id;
                        return (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all border-none text-left cursor-pointer"
                                style={{
                                    backgroundColor: active ? 'color-mix(in srgb, var(--theme-primary) 10%, transparent)' : 'transparent',
                                    color: active ? 'var(--theme-primary)' : 'var(--theme-foreground)',
                                    fontWeight: active ? T.weight.bold : T.weight.medium,
                                }}>
                                <tab.icon className="w-5 h-5 shrink-0" style={{ opacity: active ? 1 : 0.6 }} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* ── Right Content ────────────────────────────────────── */}
                <div className="lg:col-span-3 space-y-6">
                    
                    {/* Notifications Tab */}
                    {activeTab === 'notifications' && (
                        <div className="rounded-2xl border overflow-hidden" style={cardStyle}>
                            <div className="px-6 py-5 border-b" style={{ borderColor: 'var(--theme-border)' }}>
                                <h2 className="font-black text-lg" style={{ color: 'var(--theme-foreground)' }}>Notification Preferences</h2>
                                <p className="text-xs mt-1" style={{ color: 'var(--theme-foreground)', opacity: 0.5 }}>Choose how you receive alerts and updates.</p>
                            </div>
                            <div className="p-6 space-y-6">
                                {[
                                    { key: 'email', label: 'Email Notifications', desc: 'Receive important updates and receipts via email' },
                                    { key: 'push',  label: 'Exam & Live Class Reminders', desc: 'Browser push notifications for upcoming schedules' },
                                    { key: 'sms',   label: 'SMS Alerts', desc: 'Get critical alerts directly on your phone' },
                                ].map(item => (
                                    <div key={item.key} className="flex items-center justify-between">
                                        <div className="pr-4">
                                            <span className="text-sm font-bold block" style={{ color: 'var(--theme-foreground)' }}>{item.label}</span>
                                            <span className="text-xs block mt-0.5" style={{ color: 'var(--theme-foreground)', opacity: 0.5 }}>{item.desc}</span>
                                        </div>
                                        <Toggle checked={notifSettings[item.key]} onToggle={() => handleNotificationToggle(item.key, !notifSettings[item.key])} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Security Tab */}
                    {activeTab === 'security' && (
                        <div className="space-y-6">
                            
                            {/* Password Section */}
                            <div className="rounded-2xl border overflow-hidden" style={cardStyle}>
                                <div className="px-6 py-5 border-b" style={{ borderColor: 'var(--theme-border)' }}>
                                    <h2 className="font-black text-lg" style={{ color: 'var(--theme-foreground)' }}>Account Security</h2>
                                    <p className="text-xs mt-1" style={{ color: 'var(--theme-foreground)', opacity: 0.5 }}>Update your password and secure your account.</p>
                                </div>
                                <div className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className="text-sm font-bold block" style={{ color: 'var(--theme-foreground)' }}>Password</span>
                                            <span className="text-xs block mt-0.5" style={{ color: 'var(--theme-foreground)', opacity: 0.5 }}>Set a unique password to protect your account.</span>
                                        </div>
                                        <Link href="/student/profile/change-password"
                                            className="px-4 py-2 rounded-xl text-xs font-bold transition-all border"
                                            style={{ backgroundColor: 'transparent', borderColor: 'var(--theme-border)', color: 'var(--theme-foreground)' }}
                                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--theme-primary)'; e.currentTarget.style.color = 'var(--theme-primary)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--theme-border)'; e.currentTarget.style.color = 'var(--theme-foreground)'; }}>
                                            Change Password
                                        </Link>
                                    </div>
                                </div>
                            </div>

                            {/* Active Sessions Section */}
                            <div className="rounded-2xl border overflow-hidden" style={cardStyle}>
                                <div className="px-6 py-5 border-b" style={{ borderColor: 'var(--theme-border)' }}>
                                    <h2 className="font-black text-lg" style={{ color: 'var(--theme-foreground)' }}>Active Sessions</h2>
                                    <p className="text-xs mt-1" style={{ color: 'var(--theme-foreground)', opacity: 0.5 }}>Devices currently logged into your account. Revoke any you don't recognize.</p>
                                </div>
                                <div className="divide-y" style={{ borderColor: 'var(--theme-border)' }}>
                                    {sessions.length === 0 ? (
                                        <div className="p-6 text-center text-sm" style={{ color: 'var(--theme-foreground)', opacity: 0.5 }}>
                                            No active sessions found.
                                        </div>
                                    ) : (
                                        sessions.map((session, i) => {
                                            const isDesktop = session.device?.toLowerCase().includes('windows') || session.device?.toLowerCase().includes('mac');
                                            return (
                                                <div key={session._id || i} className="p-6 flex items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                                                            style={{ backgroundColor: 'color-mix(in srgb, var(--theme-foreground) 5%, transparent)' }}>
                                                            {isDesktop ? <Laptop className="w-5 h-5" style={{ color: 'var(--theme-foreground)', opacity: 0.7 }} /> 
                                                                     : <Smartphone className="w-5 h-5" style={{ color: 'var(--theme-foreground)', opacity: 0.7 }} />}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold" style={{ color: 'var(--theme-foreground)' }}>
                                                                {session.browser || 'Browser'} on {session.device || 'Device'}
                                                            </p>
                                                            <div className="flex flex-wrap items-center gap-x-2 mt-1 text-xs" style={{ color: 'var(--theme-foreground)', opacity: 0.5 }}>
                                                                <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> {session.ipAddress || 'Unknown IP'}</span>
                                                                <span>•</span>
                                                                <span>{session.lastActive ? new Date(session.lastActive).toLocaleString() : 'Recently'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => handleRevokeSession(session._id)} disabled={revoking === session._id}
                                                        className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all border disabled:opacity-50 cursor-pointer"
                                                        style={{ backgroundColor: 'transparent', borderColor: 'var(--theme-border)', color: '#ef4444' }}
                                                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#fef2f2'; e.currentTarget.style.borderColor = '#fca5a5'; }}
                                                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = 'var(--theme-border)'; }}>
                                                        {revoking === session._id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Revoke'}
                                                    </button>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                            
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
