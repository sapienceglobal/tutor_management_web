'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, Save, Palette, Globe, Mail, MapPin, Phone } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';

export default function GlobalSettingsPage() {
    const [settings, setSettings] = useState({
        siteName: '',
        supportEmail: '',
        supportPhone: '',
        facebookLink: '',
        twitterLink: '',
        primaryColor: '#4f46e5',
        footerText: '',
        contactEmail: '',
        contactAddress: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await api.get('/admin/settings');
            if (res.data.success && res.data.settings) {
                setSettings(prev => ({ ...prev, ...res.data.settings }));
            }
        } catch (error) {
            toast.error('Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await api.put('/admin/settings', settings);
            if (res.data.success) {
                toast.success('Settings updated successfully!');
            }
        } catch (error) {
            toast.error('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (e) => {
        setSettings(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    if (loading) {
        return <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
    }

    return (
        <div className="p-8 max-w-5xl mx-auto min-h-screen">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">Global Settings</h1>
                <p className="text-slate-500 mt-1">Manage global platform configurations, CMS defaults, and branding.</p>
            </div>

            <form onSubmit={handleSave} className="space-y-6">

                {/* Branding & Visuals */}
                <Card className="border-0 shadow-lg">
                    <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                        <CardTitle className="flex items-center gap-2"><Palette className="w-5 h-5 text-indigo-600" /> Branding & Visuals</CardTitle>
                        <CardDescription>Customize the look and feel of the platform</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label>Site Name</Label>
                            <Input name="siteName" value={settings.siteName || ''} onChange={handleChange} placeholder="Sapience LMS" />
                        </div>
                        <div className="space-y-2">
                            <Label>Primary Theme Color</Label>
                            <div className="flex gap-3">
                                <Input type="color" name="primaryColor" value={settings.primaryColor || '#4f46e5'} onChange={handleChange} className="w-16 h-10 p-1 cursor-pointer" />
                                <Input name="primaryColor" value={settings.primaryColor || '#4f46e5'} onChange={handleChange} className="flex-1 font-mono" placeholder="#hexcode" />
                            </div>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label>Global Footer Text</Label>
                            <Input name="footerText" value={settings.footerText || ''} onChange={handleChange} placeholder="© 2024 My Company. All rights reserved." />
                        </div>
                    </CardContent>
                </Card>

                {/* Contact Information */}
                <Card className="border-0 shadow-lg">
                    <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                        <CardTitle className="flex items-center gap-2"><Globe className="w-5 h-5 text-indigo-600" /> Public Contact Information</CardTitle>
                        <CardDescription>Displayed on public pages and email footers</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2"><Mail className="w-4 h-4 text-slate-400" /> Public Contact Email</Label>
                            <Input name="contactEmail" value={settings.contactEmail || ''} onChange={handleChange} placeholder="hello@example.com" />
                        </div>
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2"><Phone className="w-4 h-4 text-slate-400" /> Public Contact Phone</Label>
                            <Input name="supportPhone" value={settings.supportPhone || ''} onChange={handleChange} placeholder="+1 234 567 890" />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label className="flex items-center gap-2"><MapPin className="w-4 h-4 text-slate-400" /> Office Address</Label>
                            <Input name="contactAddress" value={settings.contactAddress || ''} onChange={handleChange} placeholder="123 Education St, Knowledge City" />
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end pt-4">
                    <Button type="submit" size="lg" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 min-w-[200px]">
                        {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                        Save Settings
                    </Button>
                </div>
            </form>
        </div>
    );
}
