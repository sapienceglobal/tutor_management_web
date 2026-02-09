'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    User, Mail, Phone, Lock, Bell, Shield, LogOut,
    Save, Loader2, Camera, MapPin, Globe, Briefcase
} from 'lucide-react';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch'; // Ensure Switch is available or mock it
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast'; // Assuming toast is set up, or use alert

export default function TutorSettingsPage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form States
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        bio: '',
        title: '',
        location: '',
        website: ''
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            // Get user from storage first for speed
            const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
            setUser(storedUser);
            setFormData({
                name: storedUser.name || '',
                phone: storedUser.phone || '',
                bio: storedUser.bio || '',
                title: storedUser.title || '',
                location: storedUser.location || '',
                website: storedUser.website || ''
            });

            // Then try to fetch fresh
            const res = await api.get('/auth/me');
            if (res.data.success) {
                const freshUser = res.data.user;
                setUser(freshUser);
                localStorage.setItem('user', JSON.stringify(freshUser));
                setFormData({
                    name: freshUser.name || '',
                    phone: freshUser.phone || '',
                    bio: freshUser.bio || '',
                    title: freshUser.title || '',
                    location: freshUser.location || '',
                    website: freshUser.website || ''
                });
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Ideally use PATCH /tutors/:id but auth/update-details is also common
            // Let's assume we update via the tutor route if id is available
            if (user?.role === 'tutor') {
                // For now, let's just simulate or use a generic update if route exists
                // The route is router.patch('/:id', protect, updateTutor);
                await api.patch(`/tutors/${user._id}`, formData);

                // Update local storage
                const updatedUser = { ...user, ...formData };
                setUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));

                alert('Profile updated successfully!');
            }
        } catch (error) {
            console.error('Failed to update profile:', error);
            alert('Failed to update profile.');
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
    };

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-10">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Settings</h1>
                    <p className="text-gray-500 mt-2">Manage your public profile and account preferences.</p>
                </div>
                <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={handleLogout}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Visual Sidebar / Profile Card */}
                <div className="lg:col-span-4 space-y-6">
                    <Card>
                        <CardContent className="pt-6 text-center space-y-4">
                            <div className="relative inline-block">
                                <div className="h-24 w-24 rounded-full bg-slate-100 mx-auto flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                                    {user?.profileImage ? (
                                        <img src={user.profileImage} alt={user.name} className="h-full w-full object-cover" />
                                    ) : (
                                        <User className="h-12 w-12 text-slate-400" />
                                    )}
                                </div>
                                <button className="absolute bottom-0 right-0 p-1.5 bg-blue-600 rounded-full text-white shadow-md hover:bg-blue-700 transition-colors">
                                    <Camera className="w-3 h-3" />
                                </button>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">{user?.name}</h2>
                                <p className="text-sm text-slate-500">{user?.email}</p>
                                <Badge className="mt-2 bg-blue-100 text-blue-700 hover:bg-blue-200">Tutor</Badge>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Account Status</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-500">Plan</span>
                                <span className="font-semibold text-slate-900">Pro Tutor</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-500">Member Since</span>
                                <span className="font-semibold text-slate-900">Jan 2024</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-500">Verification</span>
                                <span className="text-green-600 font-medium flex items-center gap-1">
                                    <Shield className="w-3 h-3" /> Verified
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Forms */}
                <div className="lg:col-span-8">
                    <Tabs defaultValue="profile" className="w-full">
                        <TabsList className="mb-6 w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-6">
                            <TabsTrigger
                                value="profile"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:shadow-none px-0 py-3"
                            >
                                Public Profile
                            </TabsTrigger>
                            <TabsTrigger
                                value="account"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:shadow-none px-0 py-3"
                            >
                                Account & Security
                            </TabsTrigger>
                            <TabsTrigger
                                value="notifications"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:shadow-none px-0 py-3"
                            >
                                Notifications
                            </TabsTrigger>
                        </TabsList>

                        {/* PROFILE TAB */}
                        <TabsContent value="profile" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Basic Information</CardTitle>
                                    <CardDescription>This information will be displayed publicly.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Full Name</Label>
                                            <div className="relative">
                                                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                                <Input id="name" name="name" className="pl-9" value={formData.name} onChange={handleChange} />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="title">Professional Title</Label>
                                            <div className="relative">
                                                <Briefcase className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                                <Input id="title" name="title" className="pl-9" placeholder="e.g. Senior Math Instructor" value={formData.title} onChange={handleChange} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="bio">Bio</Label>
                                        <Textarea
                                            id="bio"
                                            name="bio"
                                            placeholder="Write a short bio about yourself..."
                                            className="min-h-[100px]"
                                            value={formData.bio}
                                            onChange={handleChange}
                                        />
                                        <p className="text-xs text-slate-500">Brief description for your profile.</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="location">Location</Label>
                                            <div className="relative">
                                                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                                <Input id="location" name="location" className="pl-9" placeholder="City, Country" value={formData.location} onChange={handleChange} />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="website">Website</Label>
                                            <div className="relative">
                                                <Globe className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                                <Input id="website" name="website" className="pl-9" placeholder="https://..." value={formData.website} onChange={handleChange} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-4">
                                        <Button onClick={handleSave} disabled={saving}>
                                            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                            Save Changes
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* ACCOUNT TAB */}
                        <TabsContent value="account" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Contact Info</CardTitle>
                                    <CardDescription>Manage how we contact you.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email Address</Label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                                <Input id="email" value={user?.email || ''} disabled className="pl-9 bg-slate-50" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="phone">Phone Number</Label>
                                            <div className="relative">
                                                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                                <Input id="phone" name="phone" className="pl-9" value={formData.phone} onChange={handleChange} />
                                            </div>
                                        </div>
                                    </div>
                                    <Button onClick={handleSave} variant="outline" disabled={saving}>Update Contact Info</Button>
                                </CardContent>
                            </Card>

                            <Card className="border-red-100">
                                <CardHeader>
                                    <CardTitle className="text-red-700">Danger Zone</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="font-medium">Delete Account</h4>
                                            <p className="text-sm text-slate-500">Permanently remove your account and all data.</p>
                                        </div>
                                        <Button variant="destructive">Delete Account</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* NOTIFICATIONS TAB - Placeholder UI */}
                        <TabsContent value="notifications" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Email Notifications</CardTitle>
                                    <CardDescription>Choose what updates you want to receive.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {['New student enrollment', 'Course review received', 'Daily summary', 'Promotional offers'].map((item, i) => (
                                        <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50">
                                            <div className="flex items-center gap-3">
                                                <Bell className="w-4 h-4 text-slate-400" />
                                                <span className="text-sm font-medium">{item}</span>
                                            </div>
                                            {/* Since Switch might not be imported or installed, using a checkbox for safety or just standard input checkbox */}
                                            <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                        </div>
                                    ))}
                                    <div className="pt-4">
                                        <Button variant="outline" className="w-full">Save Preferences</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
