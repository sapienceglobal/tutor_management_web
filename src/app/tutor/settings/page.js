'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    User, Mail, Phone, Lock, Bell, Shield, LogOut,
    Save, Loader2, Camera, MapPin, Globe, Briefcase,
    Award, Calendar, TrendingUp, Star, CheckCircle,
    Sparkles, Settings as SettingsIcon, Trash2
} from 'lucide-react';
import Cookies from 'js-cookie';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';

export default function TutorSettingsPage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        bio: '',
        title: '',
        location: '',
        website: ''
    });

    const [notifications, setNotifications] = useState({
        enrollment: true,
        reviews: true,
        summary: false,
        promotions: false
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const userRes = await api.get('/auth/me');
            let userData = {};
            if (userRes.data.success) {
                userData = userRes.data.user;
                localStorage.setItem('user', JSON.stringify(userData));
                setUser(userData);
            }

            let tutorData = {};
            if (userData.role === 'tutor') {
                try {
                    const tutorRes = await api.get('/tutors/profile');
                    if (tutorRes.data.success) {
                        tutorData = tutorRes.data.tutor;
                        userData.tutorId = tutorData._id;
                        // Store full tutor object for stats access
                        userData.tutor = tutorData;
                        setUser(prev => ({ ...prev, tutorId: tutorData._id, tutor: tutorData }));
                    }
                } catch (err) {
                    console.log("Tutor profile not found", err);
                }
            }

            setFormData({
                name: userData.name || '',
                phone: userData.phone || '',
                bio: tutorData.bio || '',
                title: tutorData.title || '',
                location: tutorData.location || '',
                website: tutorData.website || ''
            });

        } catch (error) {
            console.error('Error loading profile:', error);
            toast.error('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleNotificationToggle = (key) => {
        setNotifications({ ...notifications, [key]: !notifications[key] });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const userUpdatePromise = api.patch('/auth/profile', {
                name: formData.name,
                phone: formData.phone
            });

            let tutorUpdatePromise = Promise.resolve();
            if (user?.role === 'tutor' && user?.tutorId) {
                tutorUpdatePromise = api.patch(`/tutors/${user.tutorId}`, {
                    bio: formData.bio,
                    title: formData.title,
                    location: formData.location,
                    website: formData.website
                });
            }

            await Promise.all([userUpdatePromise, tutorUpdatePromise]);

            const updatedUser = { ...user, name: formData.name, phone: formData.phone };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));

            toast.success('Profile updated successfully!');
        } catch (error) {
            console.error('Failed to update profile:', error);
            toast.error('Failed to update profile.');
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        Cookies.remove('token');
        Cookies.remove('user_role');
        router.push('/login');
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600 font-medium">Loading settings...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
            <div className="max-w-7xl mx-auto p-6 lg:p-8 space-y-8">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent mb-2">
                            Account Settings
                        </h1>
                        <p className="text-slate-600 text-lg">Manage your profile and preferences</p>
                    </div>
                    <Button
                        variant="outline"
                        onClick={handleLogout}
                        className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 shadow-sm h-12 px-6"
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Profile Card Sidebar */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* Main Profile Card */}
                        <Card className="border-0 shadow-xl overflow-hidden">
                            <div className="h-24 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600"></div>
                            <CardContent className="pt-0 text-center space-y-4 -mt-12">
                                <div className="relative inline-block">
                                    <div className="h-24 w-24 rounded-full bg-white mx-auto flex items-center justify-center overflow-hidden border-4 border-white shadow-2xl">
                                        {user?.profileImage ? (
                                            <img src={user.profileImage} alt={user.name} className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="h-full w-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                                                <User className="h-12 w-12 text-white" />
                                            </div>
                                        )}
                                    </div>
                                    <button className="absolute bottom-0 right-0 p-2 bg-indigo-600 rounded-full text-white shadow-lg hover:bg-indigo-700 transition-all hover:scale-110">
                                        <Camera className="w-4 h-4" />
                                    </button>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900">{user?.name}</h2>
                                    <p className="text-sm text-slate-600 mt-1">{user?.email}</p>
                                    <Badge className="mt-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-lg">
                                        Professional Tutor
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Stats Card */}
                        <Card className="border-0 shadow-lg">
                            <CardHeader>
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-indigo-600" />
                                    Quick Stats
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-600 rounded-lg">
                                            <Award className="w-4 h-4 text-white" />
                                        </div>
                                        <span className="text-sm font-medium text-slate-700">Courses Created</span>
                                    </div>
                                    <span className="font-bold text-blue-600">{user?.tutor?.courseCount || 0}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-emerald-600 rounded-lg">
                                            <User className="w-4 h-4 text-white" />
                                        </div>
                                        <span className="text-sm font-medium text-slate-700">Total Students</span>
                                    </div>
                                    <span className="font-bold text-emerald-600">{user?.tutor?.studentsCount || 0}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-amber-600 rounded-lg">
                                            <Star className="w-4 h-4 text-white" />
                                        </div>
                                        <span className="text-sm font-medium text-slate-700">Avg Rating</span>
                                    </div>
                                    <span className="font-bold text-amber-600">{user?.tutor?.rating?.toFixed(1) || '0.0'}</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Account Status */}
                        <Card className="border-0 shadow-lg">
                            <CardHeader>
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-emerald-600" />
                                    Account Status
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-600">Plan</span>
                                    <span className="font-bold text-indigo-600">Pro Tutor</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-600">Member Since</span>
                                    <span className="font-semibold text-slate-900">Jan 2024</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-600">Verification</span>
                                    <span className="text-emerald-600 font-semibold flex items-center gap-1">
                                        <CheckCircle className="w-4 h-4" /> Verified
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main Settings */}
                    <div className="lg:col-span-8">
                        <Tabs defaultValue="profile" className="w-full">
                            <TabsList className="mb-6 w-full justify-start bg-white border-b rounded-none h-auto p-0 gap-8 shadow-sm">
                                <TabsTrigger
                                    value="profile"
                                    className="rounded-none border-b-3 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:shadow-none px-0 py-4 font-semibold data-[state=active]:text-indigo-600"
                                >
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    Public Profile
                                </TabsTrigger>
                                <TabsTrigger
                                    value="account"
                                    className="rounded-none border-b-3 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:shadow-none px-0 py-4 font-semibold data-[state=active]:text-indigo-600"
                                >
                                    <SettingsIcon className="w-4 h-4 mr-2" />
                                    Account
                                </TabsTrigger>
                                <TabsTrigger
                                    value="notifications"
                                    className="rounded-none border-b-3 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:shadow-none px-0 py-4 font-semibold data-[state=active]:text-indigo-600"
                                >
                                    <Bell className="w-4 h-4 mr-2" />
                                    Notifications
                                </TabsTrigger>
                                <TabsTrigger
                                    value="security"
                                    className="rounded-none border-b-3 border-transparent data-[state=active]:border-indigo-600 data-[state=active]:shadow-none px-0 py-4 font-semibold data-[state=active]:text-indigo-600"
                                >
                                    <Lock className="w-4 h-4 mr-2" />
                                    Security
                                </TabsTrigger>
                            </TabsList>

                            {/* PROFILE TAB */}
                            <TabsContent value="profile" className="space-y-6">
                                <Card className="border-0 shadow-lg">
                                    <CardHeader className="bg-gradient-to-r from-slate-50 to-indigo-50 border-b">
                                        <CardTitle className="text-xl">Basic Information</CardTitle>
                                        <CardDescription className="text-slate-600">This information will be displayed publicly on your profile.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-6 lg:p-8 space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label htmlFor="name" className="font-semibold text-slate-700">Full Name</Label>
                                                <div className="relative">
                                                    <User className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                                                    <Input
                                                        id="name"
                                                        name="name"
                                                        className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white"
                                                        value={formData.name}
                                                        onChange={handleChange}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="title" className="font-semibold text-slate-700">Professional Title</Label>
                                                <div className="relative">
                                                    <Briefcase className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                                                    <Input
                                                        id="title"
                                                        name="title"
                                                        className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white"
                                                        placeholder="e.g. Senior Math Instructor"
                                                        value={formData.title}
                                                        onChange={handleChange}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="bio" className="font-semibold text-slate-700">Bio</Label>
                                            <Textarea
                                                id="bio"
                                                name="bio"
                                                placeholder="Write a short bio about yourself and your teaching experience..."
                                                className="min-h-[120px] bg-slate-50 border-slate-200 focus:bg-white resize-none"
                                                value={formData.bio}
                                                onChange={handleChange}
                                            />
                                            <p className="text-xs text-slate-500">Brief description for your profile (max 500 characters)</p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label htmlFor="location" className="font-semibold text-slate-700">Location</Label>
                                                <div className="relative">
                                                    <MapPin className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                                                    <Input
                                                        id="location"
                                                        name="location"
                                                        className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white"
                                                        placeholder="City, Country"
                                                        value={formData.location}
                                                        onChange={handleChange}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="website" className="font-semibold text-slate-700">Website</Label>
                                                <div className="relative">
                                                    <Globe className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                                                    <Input
                                                        id="website"
                                                        name="website"
                                                        className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white"
                                                        placeholder="https://..."
                                                        value={formData.website}
                                                        onChange={handleChange}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex justify-end pt-4 border-t">
                                            <Button
                                                onClick={handleSave}
                                                disabled={saving}
                                                className="h-11 px-8 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg"
                                            >
                                                {saving ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                                        Saving...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Save className="w-4 h-4 mr-2" />
                                                        Save Changes
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* ACCOUNT TAB */}
                            <TabsContent value="account" className="space-y-6">
                                <Card className="border-0 shadow-lg">
                                    <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b">
                                        <CardTitle className="text-xl">Contact Information</CardTitle>
                                        <CardDescription className="text-slate-600">Manage how we contact you</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-6 lg:p-8 space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label htmlFor="email" className="font-semibold text-slate-700">Email Address</Label>
                                                <div className="relative">
                                                    <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                                                    <Input
                                                        id="email"
                                                        value={user?.email || ''}
                                                        disabled
                                                        className="pl-10 h-11 bg-slate-100 border-slate-200 cursor-not-allowed"
                                                    />
                                                </div>
                                                <p className="text-xs text-slate-500">Email cannot be changed</p>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="phone" className="font-semibold text-slate-700">Phone Number</Label>
                                                <div className="relative">
                                                    <Phone className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                                                    <Input
                                                        id="phone"
                                                        name="phone"
                                                        className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white"
                                                        value={formData.phone}
                                                        onChange={handleChange}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex justify-end pt-4 border-t">
                                            <Button
                                                onClick={handleSave}
                                                disabled={saving}
                                                className="h-11 px-8 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg"
                                            >
                                                Update Contact Info
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-2 border-red-200 shadow-lg">
                                    <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50 border-b border-red-100">
                                        <CardTitle className="text-xl text-red-700 flex items-center gap-2">
                                            <Trash2 className="w-5 h-5" />
                                            Danger Zone
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="font-semibold text-slate-900">Delete Account</h4>
                                                <p className="text-sm text-slate-600 mt-1">Permanently remove your account and all data. This action cannot be undone.</p>
                                            </div>
                                            <Button variant="destructive" className="shadow-lg">
                                                Delete Account
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* NOTIFICATIONS TAB */}
                            <TabsContent value="notifications" className="space-y-6">
                                <Card className="border-0 shadow-lg">
                                    <CardHeader className="bg-gradient-to-r from-slate-50 to-purple-50 border-b">
                                        <CardTitle className="text-xl">Email Notifications</CardTitle>
                                        <CardDescription className="text-slate-600">Choose what updates you want to receive</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-6 lg:p-8 space-y-1">
                                        {[
                                            { key: 'enrollment', label: 'New student enrollment', icon: User },
                                            { key: 'reviews', label: 'Course review received', icon: Star },
                                            { key: 'summary', label: 'Daily summary', icon: Calendar },
                                            { key: 'promotions', label: 'Promotional offers', icon: Sparkles }
                                        ].map((item) => (
                                            <div
                                                key={item.key}
                                                className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 transition-colors"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="p-2 bg-indigo-100 rounded-lg">
                                                        <item.icon className="w-5 h-5 text-indigo-600" />
                                                    </div>
                                                    <span className="font-medium text-slate-700">{item.label}</span>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={notifications[item.key]}
                                                        onChange={() => handleNotificationToggle(item.key)}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                                </label>
                                            </div>
                                        ))}
                                        <div className="pt-6 border-t">
                                            <Button className="w-full h-11 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg">
                                                Save Preferences
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* SECURITY TAB */}
                            <TabsContent value="security" className="space-y-6">
                                <Card className="border-0 shadow-lg">
                                    <CardHeader className="bg-gradient-to-r from-slate-50 to-orange-50 border-b">
                                        <CardTitle className="text-xl">Security Settings</CardTitle>
                                        <CardDescription className="text-slate-600">Manage your password and security preferences</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-6 lg:p-8 space-y-6">
                                        <SecuritySettings hasPassword={user?.hasPassword} />
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SecuritySettings({ hasPassword }) {
    const [loading, setLoading] = useState(false);
    const [passwords, setPasswords] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const handleChange = (e) => {
        setPasswords({ ...passwords, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (passwords.newPassword !== passwords.confirmPassword) {
            toast.error("New passwords don't match");
            setLoading(false);
            return;
        }

        if (passwords.newPassword.length < 6) {
             toast.error("Password must be at least 6 characters");
             setLoading(false);
             return;
        }

        try {
            if (hasPassword) {
                // Change Password
                await api.post('/auth/change-password', {
                    currentPassword: passwords.currentPassword,
                    newPassword: passwords.newPassword
                });
                toast.success('Password changed successfully');
            } else {
                // Set Password
                await api.post('/auth/set-password', {
                    newPassword: passwords.newPassword
                });
                toast.success('Password set successfully');
                // Refresh to update local state (ideally via callback or context)
                window.location.reload(); 
            }
            setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to update password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
            {hasPassword && (
                <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                        <Input
                            id="currentPassword"
                            name="currentPassword"
                            type="password"
                            required
                            className="pl-10"
                            value={passwords.currentPassword}
                            onChange={handleChange}
                        />
                    </div>
                </div>
            )}
            <div className="space-y-2">
                <Label htmlFor="newPassword">{hasPassword ? 'New Password' : 'Create Password'}</Label>
                <div className="relative">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <Input
                        id="newPassword"
                        name="newPassword"
                        type="password"
                        required
                        className="pl-10"
                        placeholder="Min 6 characters"
                        value={passwords.newPassword}
                        onChange={handleChange}
                    />
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        required
                        className="pl-10"
                        value={passwords.confirmPassword}
                        onChange={handleChange}
                    />
                </div>
            </div>
            
            <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                {hasPassword ? 'Update Password' : 'Set Password'}
            </Button>
        </form>
    );
}