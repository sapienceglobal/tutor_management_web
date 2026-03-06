'use client';

import { useState, useEffect } from 'react';
import { Save, Loader2, Globe, Shield, Bell, Wrench, Palette } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '@/lib/axios';

export default function AdminSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [instituteData, setInstituteData] = useState({
        name: '',
        contactEmail: '',
        logo: '',
        primaryColor: '#4f46e5',
        secondaryColor: '#f8fafc'
    });
    const [settings, setSettings] = useState({
        maintenanceMode: false,
        allowRegistration: true,
        defaultLanguage: 'English',
        autoApproveCourses: false,
        allowGuestBrowsing: true,
        platformCommission: 10,
        supportPhone: '',
        facebookLink: '',
        twitterLink: ''
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const [settingsRes, instituteRes] = await Promise.all([
                api.get('/admin/settings'),
                api.get('/user-institute/me') // Use the universal endpoint
            ]);

            if (settingsRes.data.success) {
                setSettings(settingsRes.data.settings);
            }
            if (instituteRes.data?.success && instituteRes.data.institute) {
                setInstituteData({
                    name: instituteRes.data.institute.name || '',
                    contactEmail: instituteRes.data.institute.contactEmail || '',
                    logo: instituteRes.data.institute.logo || '',
                    primaryColor: instituteRes.data.institute.brandColors?.primary || '#4f46e5',
                    secondaryColor: instituteRes.data.institute.brandColors?.secondary || '#f8fafc'
                });
            }
        } catch (error) {
            console.error('Failed to fetch settings:', error);
            toast.error('Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setSettings({ ...settings, [e.target.name]: value });
    };

    const handleInstituteChange = (e) => {
        setInstituteData({ ...instituteData, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const [settingsRes, instRes] = await Promise.all([
                api.put('/admin/settings', settings),
                api.put('/user-institute/me', {
                    name: instituteData.name,
                    contactEmail: instituteData.contactEmail,
                    logo: instituteData.logo,
                    brandColors: {
                        primary: instituteData.primaryColor,
                        secondary: instituteData.secondaryColor
                    }
                })
            ]);

            if (settingsRes.data.success && instRes.data.success) {
                toast.success('Settings and Branding updated successfully');
            }
        } catch (error) {
            console.error('Failed to update settings:', error);
            toast.error('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Platform Settings</h1>
                <p className="text-slate-500">Configure global application settings</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* General Settings */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                            <Globe className="w-5 h-5" />
                        </div>
                        <h2 className="text-lg font-semibold text-slate-800">General Information</h2>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Site Name</label>
                            <input
                                type="text"
                                name="name"
                                value={instituteData.name}
                                onChange={handleInstituteChange}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Support Email</label>
                            <input
                                type="email"
                                name="contactEmail"
                                value={instituteData.contactEmail}
                                onChange={handleInstituteChange}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Default Language</label>
                            <select
                                name="defaultLanguage"
                                value={settings.defaultLanguage}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                            >
                                <option>English</option>
                                <option>Spanish</option>
                                <option>French</option>
                                <option>Hindi</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* System Controls */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                            <Wrench className="w-5 h-5" />
                        </div>
                        <h2 className="text-lg font-semibold text-slate-800">System Controls</h2>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="font-medium text-slate-900">Maintenance Mode</div>
                                <div className="text-sm text-slate-500">Disable access for all non-admin users</div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="maintenanceMode"
                                    checked={settings.maintenanceMode}
                                    onChange={handleChange}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <div className="font-medium text-slate-900">Allow Registration</div>
                                <div className="text-sm text-slate-500">Enable new user signups</div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="allowRegistration"
                                    checked={settings.allowRegistration}
                                    onChange={handleChange}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="font-medium text-slate-900">Auto-Approve Courses</div>
                                <div className="text-sm text-slate-500">Publish tutor courses automatically without review</div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="autoApproveCourses"
                                    checked={settings.autoApproveCourses}
                                    onChange={handleChange}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="font-medium text-slate-900">Auto-Approve Tutors</div>
                                <div className="text-sm text-slate-500">Publish tutor profiles automatically without review</div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="autoApproveTutors"
                                    checked={settings.autoApproveTutors}
                                    onChange={handleChange}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <div className="font-medium text-slate-900">Allow Guest Browsing</div>
                                <div className="text-sm text-slate-500">Let public users browse published courses</div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="allowGuestBrowsing"
                                    checked={settings.allowGuestBrowsing}
                                    onChange={handleChange}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Financial Settings */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:col-span-2">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                            <Shield className="w-5 h-5" />
                        </div>
                        <h2 className="text-lg font-semibold text-slate-800">Financial & Security</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Platform Commission (%)</label>
                            <p className="text-sm text-slate-500 mb-3">Percentage cut taken from tutor sales.</p>
                            <input
                                type="number"
                                name="platformCommission"
                                value={settings.platformCommission}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                min="0"
                                max="100"
                            />
                        </div>
                    </div>
                </div>

                {/* Theme & Branding */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:col-span-2">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-pink-100 rounded-lg text-pink-600">
                            <Palette className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-slate-800">Tenant Branding</h2>
                            <p className="text-sm text-slate-500">Customize the appearance of your institute</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-3">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Logo URL</label>
                            <input
                                type="url"
                                name="logo"
                                value={instituteData.logo}
                                onChange={handleInstituteChange}
                                placeholder="https://example.com/logo.png"
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            {instituteData.logo && (
                                <div className="mt-3 p-4 border border-slate-100 rounded-lg flex justify-center bg-slate-50">
                                    <img src={instituteData.logo} alt="Institute Logo Preview" className="h-12 object-contain" />
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Primary Color</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="color"
                                    name="primaryColor"
                                    value={instituteData.primaryColor}
                                    onChange={handleInstituteChange}
                                    className="w-12 h-10 p-1 border border-slate-200 rounded cursor-pointer"
                                />
                                <input
                                    type="text"
                                    name="primaryColor"
                                    value={instituteData.primaryColor}
                                    onChange={handleInstituteChange}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm uppercase"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Secondary Color</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="color"
                                    name="secondaryColor"
                                    value={instituteData.secondaryColor}
                                    onChange={handleInstituteChange}
                                    className="w-12 h-10 p-1 border border-slate-200 rounded cursor-pointer"
                                />
                                <input
                                    type="text"
                                    name="secondaryColor"
                                    value={instituteData.secondaryColor}
                                    onChange={handleInstituteChange}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm uppercase"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-indigo-200 disabled:opacity-50"
                >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    Save Changes
                </button>
            </div>
        </div>
    );
}
