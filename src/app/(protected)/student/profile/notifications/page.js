'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';

const Toggle = ({ checked, onToggle }) => (
    <button type="button" onClick={onToggle}
        className="w-11 h-6 rounded-full transition-colors relative shrink-0"
        style={{ backgroundColor: checked ? 'var(--theme-primary)' : 'color-mix(in srgb, var(--theme-foreground) 15%, transparent)' }}>
        <span className={`block w-5 h-5 rounded-full bg-white shadow absolute top-0.5 transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
);

const SETTINGS = [
    {
        key: 'emailNotifications',
        label: 'Email Notifications',
        sub: 'Receive summaries and course updates via email.',
    },
    {
        key: 'pushNotifications',
        label: 'Push Notifications',
        sub: 'Receive real-time alerts on your device.',
    },
    {
        key: 'examAlerts',
        label: 'Exam & Quiz Alerts',
        sub: 'Reminders for upcoming or pending exams.',
    },
    {
        key: 'promotionalOffers',
        label: 'Promotional Offers',
        sub: 'Receive emails about new courses and discounts.',
    },
];

export default function NotificationSettingsPage() {
    const router = useRouter();
    const [settings, setSettings] = useState({
        emailNotifications: true,
        pushNotifications: true,
        examAlerts: true,
        promotionalOffers: false,
    });

    const handleToggle = (key) => setSettings(prev => ({ ...prev, [key]: !prev[key] }));

    const handleSave = () => {
        toast.success('Notification preferences saved!');
        router.back();
    };

    return (
        <div className="max-w-md mx-auto py-10 px-4">
            {/* Back */}
            <button onClick={() => router.back()}
                className="flex items-center gap-2 mb-8 text-sm font-medium transition-all"
                style={{ color: 'var(--theme-foreground)', opacity: 0.55 }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = 'var(--theme-primary)'; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '0.55'; e.currentTarget.style.color = 'var(--theme-foreground)'; }}>
                <ArrowLeft className="w-4 h-4" /> Back to Profile
            </button>

            {/* Icon + Title */}
            <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                    style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 10%, transparent)' }}>
                    <Bell className="w-8 h-8" style={{ color: 'var(--theme-primary)' }} />
                </div>
                <h1 className="text-2xl font-black" style={{ color: 'var(--theme-foreground)' }}>Notification Settings</h1>
                <p className="text-sm mt-2" style={{ color: 'var(--theme-foreground)', opacity: 0.45 }}>
                    Manage how you receive alerts and updates.
                </p>
            </div>

            {/* Settings card */}
            <div className="rounded-2xl border p-6 space-y-5"
                style={{ backgroundColor: 'var(--theme-background)', borderColor: 'var(--theme-border)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                {SETTINGS.map((item, i, arr) => (
                    <div key={item.key}>
                        <div className="flex items-start justify-between gap-4">
                            <div className="space-y-0.5 flex-1">
                                <p className="text-sm font-semibold" style={{ color: 'var(--theme-foreground)' }}>{item.label}</p>
                                <p className="text-xs" style={{ color: 'var(--theme-foreground)', opacity: 0.42 }}>{item.sub}</p>
                            </div>
                            <Toggle checked={settings[item.key]} onToggle={() => handleToggle(item.key)} />
                        </div>
                        {i < arr.length - 1 && (
                            <div className="mt-5 border-t" style={{ borderColor: 'var(--theme-border)' }} />
                        )}
                    </div>
                ))}

                {/* Save */}
                <button onClick={handleSave}
                    className="w-full py-3 mt-2 rounded-xl font-bold text-sm text-white transition-all"
                    style={{ backgroundColor: 'var(--theme-primary)' }}
                    onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'none'; }}>
                    Save Preferences
                </button>
            </div>
        </div>
    );
}