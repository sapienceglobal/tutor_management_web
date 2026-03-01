'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Video, Save, Loader2, Eye, EyeOff, Shield, Clock, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';

export default function ZoomConfigPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showSecret, setShowSecret] = useState(false);
    const [config, setConfig] = useState({
        clientId: '',
        clientSecret: '',
        accountId: '',
        isEnabled: false,
    });
    const [usageLogs, setUsageLogs] = useState([]);

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const res = await api.get('/admin/zoom-config');
            if (res.data.success && res.data.config) {
                const c = res.data.config;
                setConfig({
                    clientId: c.clientId || '',
                    clientSecret: c.hasSecret ? '••••••••••••••••' : '',
                    accountId: c.accountId || '',
                    isEnabled: c.isEnabled || false,
                });
                setUsageLogs(c.usageLogs || []);
            }
        } catch (error) {
            console.error('Failed to load Zoom config', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!config.clientId.trim()) return toast.error('Client ID is required');
        setSaving(true);
        try {
            const res = await api.put('/admin/zoom-config', config);
            if (res.data.success) {
                toast.success('Zoom configuration saved!');
                // If secret was saved, reset to masked
                if (config.clientSecret && config.clientSecret !== '••••••••••••••••') {
                    setConfig(prev => ({ ...prev, clientSecret: '••••••••••••••••' }));
                    setShowSecret(false);
                }
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save configuration');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="max-w-3xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href="/admin/dashboard">
                        <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            <Video className="w-6 h-6 text-blue-600" />
                            Zoom Integration Config
                        </h1>
                        <p className="text-slate-500">Configure your Zoom OAuth credentials for live classes</p>
                    </div>
                </div>

                {/* Config Form */}
                <Card className="border-blue-100 shadow-md">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-blue-800 flex items-center gap-2">
                                    <Shield className="w-4 h-4" /> API Credentials
                                </CardTitle>
                                <CardDescription>Your Zoom Server-to-Server OAuth App keys</CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <Label htmlFor="zoom-toggle" className="text-sm font-medium text-slate-600">
                                    {config.isEnabled ? 'Enabled' : 'Disabled'}
                                </Label>
                                <Switch
                                    id="zoom-toggle"
                                    checked={config.isEnabled}
                                    onCheckedChange={(val) => setConfig(prev => ({ ...prev, isEnabled: val }))}
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-5">
                        <div className="space-y-2">
                            <Label>Account ID</Label>
                            <Input
                                value={config.accountId}
                                onChange={(e) => setConfig(prev => ({ ...prev, accountId: e.target.value }))}
                                placeholder="Your Zoom Account ID"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Client ID</Label>
                            <Input
                                value={config.clientId}
                                onChange={(e) => setConfig(prev => ({ ...prev, clientId: e.target.value }))}
                                placeholder="Your Zoom Client ID"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Client Secret</Label>
                            <div className="relative">
                                <Input
                                    type={showSecret ? 'text' : 'password'}
                                    value={config.clientSecret}
                                    onChange={(e) => setConfig(prev => ({ ...prev, clientSecret: e.target.value }))}
                                    placeholder="Your Zoom Client Secret"
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowSecret(!showSecret)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            <p className="text-xs text-slate-400 flex items-center gap-1">
                                <Shield className="w-3 h-3" />
                                Your secret is encrypted with AES-256 before storing in the database
                            </p>
                        </div>

                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-2"
                        >
                            {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                            Save Configuration
                        </Button>
                    </CardContent>
                </Card>

                {/* Status Card */}
                <Card className="border-slate-200">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            {config.isEnabled ? (
                                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                                    <CheckCircle className="w-6 h-6 text-emerald-600" />
                                </div>
                            ) : (
                                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                                    <AlertCircle className="w-6 h-6 text-amber-600" />
                                </div>
                            )}
                            <div>
                                <h3 className="font-bold text-slate-800">
                                    {config.isEnabled ? 'Zoom Integration Active' : 'Zoom Integration Inactive'}
                                </h3>
                                <p className="text-sm text-slate-500">
                                    {config.isEnabled
                                        ? 'Your institute can create and join Zoom meetings for live classes.'
                                        : 'Enable Zoom integration and provide your credentials to start.'}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Usage Logs */}
                {usageLogs.length > 0 && (
                    <Card className="border-slate-200">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-slate-800 text-base flex items-center gap-2">
                                <Clock className="w-4 h-4" /> Usage Logs
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 border-y">
                                    <tr>
                                        <th className="text-left px-6 py-3 text-slate-600 font-semibold">Date</th>
                                        <th className="text-right px-6 py-3 text-slate-600 font-semibold">Meetings</th>
                                        <th className="text-right px-6 py-3 text-slate-600 font-semibold">Minutes</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {usageLogs.slice(0, 10).map((log, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50">
                                            <td className="px-6 py-3 text-slate-700">{new Date(log.date).toLocaleDateString()}</td>
                                            <td className="px-6 py-3 text-right text-slate-700 font-medium">{log.meetingCount}</td>
                                            <td className="px-6 py-3 text-right text-slate-700">{log.totalMinutes} min</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
