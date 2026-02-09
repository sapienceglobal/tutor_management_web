'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch'; // You might need to check if this component exists or create a simple one
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

export default function NotificationSettingsPage() {
    const router = useRouter();
    const [settings, setSettings] = useState({
        emailNotifications: true,
        pushNotifications: true,
        examAlerts: true,
        promotionalOffers: false
    });

    const handleToggle = (key) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSave = () => {
        // Save to backend or local storage
        alert('Notification preferences saved!');
        router.back();
    };

    return (
        <div className="max-w-md mx-auto py-10">
            <Button variant="ghost" className="mb-6 pl-0 hover:bg-transparent hover:text-purple-600" onClick={() => router.back()}>
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Profile
            </Button>

            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bell className="w-8 h-8 text-orange-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Notification Settings</h1>
                <p className="text-gray-500 mt-2">Manage how you receive alerts and updates.</p>
            </div>

            <Card>
                <CardContent className="p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base">Email Notifications</Label>
                            <p className="text-sm text-gray-500">Receive summaries and course updates via email.</p>
                        </div>
                        <Switch
                            checked={settings.emailNotifications}
                            onCheckedChange={() => handleToggle('emailNotifications')}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base">Push Notifications</Label>
                            <p className="text-sm text-gray-500">Receive real-time alerts on your device.</p>
                        </div>
                        <Switch
                            checked={settings.pushNotifications}
                            onCheckedChange={() => handleToggle('pushNotifications')}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base">Exam & Quiz Alerts</Label>
                            <p className="text-sm text-gray-500">Reminders for upcoming or pending exams.</p>
                        </div>
                        <Switch
                            checked={settings.examAlerts}
                            onCheckedChange={() => handleToggle('examAlerts')}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base">Promotional Offers</Label>
                            <p className="text-sm text-gray-500">Receive emails about new courses and discounts.</p>
                        </div>
                        <Switch
                            checked={settings.promotionalOffers}
                            onCheckedChange={() => handleToggle('promotionalOffers')}
                        />
                    </div>

                    <Button className="w-full bg-orange-600 hover:bg-orange-700 mt-6" onClick={handleSave}>
                        Save Preferences
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
