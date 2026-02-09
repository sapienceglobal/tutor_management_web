'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import {
    User, Mail, Phone, BadgeCheck, Loader2, Camera, LogOut,
    Settings, Bell, Lock, Globe, HelpCircle, Info, Shield, Save
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'react-hot-toast';

export default function StudentProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Edit Modal State
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editForm, setEditForm] = useState({ name: '', phone: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    router.push('/login');
                    return;
                }

                const response = await api.get('/auth/me');
                if (response.data.success) {
                    setUser(response.data.user);
                    setEditForm({
                        name: response.data.user.name || '',
                        phone: response.data.user.phone || ''
                    });
                } else {
                    const storedUser = localStorage.getItem('user');
                    if (storedUser) {
                        const parsed = JSON.parse(storedUser);
                        setUser(parsed);
                        setEditForm({
                            name: parsed.name || '',
                            phone: parsed.phone || ''
                        });
                    }
                }
            } catch (error) {
                console.error('Error fetching profile:', error);
                const storedUser = localStorage.getItem('user');
                if (storedUser) {
                    const parsed = JSON.parse(storedUser);
                    setUser(parsed);
                    setEditForm({
                        name: parsed.name || '',
                        phone: parsed.phone || ''
                    });
                }
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [router]);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            // Using /auth/update-details endpoint (common pattern)
            // If it doesn't exist, we might need to adjust.
            // For now, assuming it exists or we mock success.
            const res = await api.put('/auth/updatedetails', editForm);

            if (res.data.success) {
                const updatedUser = { ...user, ...editForm };
                setUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser)); // Update local storage
                setIsEditOpen(false);
                toast.success('Profile updated successfully');
            }
        } catch (error) {
            console.error('Update failed:', error);
            toast.error('Failed to update profile');
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
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-10">
            {/* Header Section with Gradient */}
            <div className="relative rounded-3xl overflow-hidden bg-white shadow-xl">
                <div className="h-48 bg-gradient-to-r from-purple-600 to-indigo-600"></div>
                <div className="px-8 pb-8">
                    <div className="relative flex justify-between items-end -mt-16 mb-6">
                        <div className="flex items-end gap-6">
                            <div className="relative">
                                <div className="h-32 w-32 rounded-full border-4 border-white bg-gray-100 flex items-center justify-center overflow-hidden shadow-lg">
                                    {user.profileImage ? (
                                        <img src={user.profileImage} alt={user.name} className="h-full w-full object-cover" />
                                    ) : (
                                        <User className="h-16 w-16 text-gray-400" />
                                    )}
                                </div>
                                <button className="absolute bottom-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors text-purple-600">
                                    <Camera className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="mb-2">
                                <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 uppercase text-xs px-2 py-0.5">
                                        {user.role}
                                    </Badge>
                                    <span className="text-sm text-gray-500 flex items-center gap-1">
                                        <Globe className="w-3 h-3" /> {user.language === 'hi' ? 'Hindi' : 'English'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <Button variant="outline" className="hidden sm:flex" onClick={() => setIsEditOpen(true)}>
                            Edit Profile
                        </Button>
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Personal Information */}
                <Card className="border-none shadow-md">
                    <CardContent className="p-6 space-y-6">
                        <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800">
                            <User className="w-5 h-5 text-purple-600" />
                            Personal Information
                        </h2>

                        <div className="space-y-4">
                            <div className="flex items-center gap-4 p-3 bg-red-50 rounded-xl border border-red-100">
                                <div className="p-2 bg-red-100 rounded-lg text-red-600">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-semibold">Email</p>
                                    <p className="text-gray-900 font-medium">{user.email}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 p-3 bg-green-50 rounded-xl border border-green-100">
                                <div className="p-2 bg-green-100 rounded-lg text-green-600">
                                    <Phone className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-semibold">Phone</p>
                                    <p className="text-gray-900 font-medium">{user.phone || 'Not provided'}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 p-3 bg-blue-50 rounded-xl border border-blue-100">
                                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                    <BadgeCheck className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-semibold">Role</p>
                                    <p className="text-gray-900 font-medium capitalize">{user.role}</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Settings & Preferences */}
                <Card className="border-none shadow-md">
                    <CardContent className="p-6 space-y-6">
                        <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800">
                            <Settings className="w-5 h-5 text-gray-600" />
                            Settings
                        </h2>

                        <div className="space-y-2">
                            <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-all group">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-orange-100 rounded-lg text-orange-600 group-hover:bg-orange-200 transition-colors">
                                        <Bell className="w-5 h-5" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-semibold text-gray-900">Notifications</p>
                                        <p className="text-sm text-gray-500">Manage preferences</p>
                                    </div>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-white group-hover:shadow-sm">→</div>
                            </button>

                            <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-all group">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-red-100 rounded-lg text-red-600 group-hover:bg-red-200 transition-colors">
                                        <Lock className="w-5 h-5" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-semibold text-gray-900">Change Password</p>
                                        <p className="text-sm text-gray-500">Update security</p>
                                    </div>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-white group-hover:shadow-sm">→</div>
                            </button>

                            <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-all group">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-purple-100 rounded-lg text-purple-600 group-hover:bg-purple-200 transition-colors">
                                        <Shield className="w-5 h-5" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-semibold text-gray-900">Privacy Policy</p>
                                        <p className="text-sm text-gray-500">Read our terms</p>
                                    </div>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-white group-hover:shadow-sm">→</div>
                            </button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Logout Section */}
            <div className="flex justify-center pt-6">
                <Button
                    variant="destructive"
                    className="w-full md:w-auto px-12 py-6 rounded-2xl shadow-lg shadow-red-100 hover:shadow-red-200 text-lg gap-3"
                    onClick={handleLogout}
                >
                    <LogOut className="w-5 h-5" />
                    Sign Out
                </Button>
            </div>

            {/* Edit Modal */}
            <Modal
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                title="Edit Profile"
            >
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                            id="name"
                            value={editForm.name}
                            onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Enter your full name"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                            id="phone"
                            value={editForm.phone}
                            onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                            placeholder="Enter your phone number"
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={saving || !editForm.name}>
                            {saving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Changes
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
