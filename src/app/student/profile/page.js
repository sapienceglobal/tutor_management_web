'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import {
    User, Mail, Phone, BadgeCheck, Loader2, Camera, LogOut,
    Settings, Bell, Lock, Globe, HelpCircle, Info, Shield, Save, MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'react-hot-toast';
import Cookies from 'js-cookie';

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
                        phone: response.data.user.phone || '',
                        bio: response.data.user.bio || '',
                        address: response.data.user.address || {}
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
            let imageUrl = user.profileImage;

            // 1. Upload Image if selected
            const fileInput = document.getElementById('profile-image-input');
            if (fileInput && fileInput.files[0]) {
                const formData = new FormData();
                formData.append('image', fileInput.files[0]);

                try {
                    const uploadRes = await api.post('/upload/image', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                    if (uploadRes.data.success) {
                        imageUrl = uploadRes.data.imageUrl;
                    }
                } catch (err) {
                    console.error("Image upload failed", err);
                    toast.error("Failed to upload image");
                    setSaving(false);
                    return;
                }
            }

            // 2. Update Profile Data
            const payload = {
                ...editForm,
                profileImage: imageUrl
            };

            const res = await api.patch('/auth/profile', payload);

            if (res.data.success) {
                const updatedUser = res.data.user;
                setUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));
                setIsEditOpen(false);
                toast.success('Profile updated successfully');
            }
        } catch (error) {
            console.error('Update failed:', error);
            toast.error(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        Cookies.remove('token'); // Add cookie removal
        Cookies.remove('user_role');
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
        <div className="max-w-[1600px] mx-auto pb-10">
            {/* Header / Hero Section (Bizdire Style) */}
            <div className="relative bg-[#0F172A] py-16 px-8 mb-8 rounded-3xl overflow-hidden mx-4 md:mx-0">
                <div className="absolute inset-0 opacity-10 bg-[url('/grid-pattern.svg')]"></div>
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>

                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                    <div className="relative group">
                        <div className="w-32 h-32 rounded-full border-4 border-white/10 bg-white/5 backdrop-blur-sm flex items-center justify-center overflow-hidden shadow-2xl">
                            {user?.profileImage ? (
                                <img src={user.profileImage} alt={user.name} className="h-full w-full object-cover" />
                            ) : (
                                <User className="h-16 w-16 text-slate-400" />
                            )}
                        </div>
                        <button 
                            type="button"
                            onClick={() => document.getElementById('profile-image-input')?.click()}
                            className="absolute bottom-1 right-1 p-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-lg transition-transform hover:scale-110"
                        >
                            <Camera className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="text-center md:text-left">
                        <h1 className="text-4xl font-black text-white mb-2">{user?.name || 'Student Name'}</h1>
                        <p className="text-slate-400 text-lg mb-4 flex items-center justify-center md:justify-start gap-2">
                            <Mail className="w-4 h-4" /> {user?.email}
                        </p>
                        <div className="flex items-center gap-3 justify-center md:justify-start">
                            <Badge className="bg-orange-500/20 text-orange-500 hover:bg-orange-500/30 border-orange-500/20 px-3 py-1 text-sm uppercase tracking-wide">
                                {user?.role || 'Student'}
                            </Badge>
                            <span className="text-slate-500 text-sm flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> New York, USA
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 px-4 md:px-0">
                {/* Sidebar Navigation */}
                <div className="lg:col-span-3">
                    <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden sticky top-24">
                        <div className="p-6 border-b border-slate-100">
                            <h2 className="text-lg font-bold text-slate-800">My Dashboard</h2>
                        </div>
                        <nav className="p-3 space-y-1">
                            {[
                                { label: 'Edit Profile', icon: User, id: 'edit-profile', active: true },
                                { label: 'My Courses', icon: BadgeCheck, id: 'courses' },
                                { label: 'My Favorites', icon: Settings, id: 'favorites' },
                                { label: 'Change Password', icon: Lock, id: 'password' },
                                { label: 'Settings', icon: Settings, id: 'settings' },
                                { label: 'Logout', icon: LogOut, id: 'logout', danger: true },
                            ].map((item) => (
                                <button
                                    key={item.id}
                                    onClick={item.id === 'logout' ? handleLogout : () => { }}
                                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all duration-200 ${item.active
                                        ? 'bg-orange-50 text-orange-600 shadow-sm'
                                        : item.danger
                                            ? 'text-red-500 hover:bg-red-50'
                                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                        }`}
                                >
                                    <item.icon className="w-5 h-5" />
                                    {item.label}
                                    {item.active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-500"></div>}
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-9 space-y-6">
                    <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8">
                        <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900">Edit Profile</h2>
                                <p className="text-slate-500 mt-1">Update your personal information and address.</p>
                            </div>
                        </div>

                        <form onSubmit={handleUpdateProfile} className="space-y-8">
                            {/* Hidden File Input */}
                            <input 
                                type="file" 
                                id="profile-image-input" 
                                className="hidden" 
                                accept="image/*"
                                onChange={(e) => {
                                    if (e.target.files?.[0]) {
                                        // Optional: Preview local image immediately
                                        const file = e.target.files[0];
                                        const reader = new FileReader();
                                        reader.onloadend = () => {
                                            setUser(prev => ({ ...prev, profileImage: reader.result }));
                                        };
                                        reader.readAsDataURL(file);
                                    }
                                }}
                            />

                            {/* Personal Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-slate-700 font-semibold">Full Name</Label>
                                    <Input
                                        className="h-12 bg-slate-50 border-slate-200 focus:border-orange-500 focus:ring-orange-500/20"
                                        placeholder="Full Name"
                                        value={editForm.name || ''}
                                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-700 font-semibold">Email Address</Label>
                                    <Input
                                        className="h-12 bg-slate-50 border-slate-200 focus:border-orange-500 focus:ring-orange-500/20"
                                        placeholder="Email"
                                        value={user?.email || ''}
                                        disabled
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-slate-700 font-semibold">Phone Number</Label>
                                    <Input
                                        className="h-12 bg-slate-50 border-slate-200 focus:border-orange-500 focus:ring-orange-500/20"
                                        placeholder="Phone Number"
                                        value={editForm.phone}
                                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Address Section */}
                            <div className="pt-4 border-t border-slate-100">
                                <h3 className="text-lg font-bold text-slate-900 mb-6">Address</h3>
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <Label className="text-slate-700 font-semibold">Street Address</Label>
                                        <Input
                                            className="h-12 bg-slate-50 border-slate-200 focus:border-orange-500 focus:ring-orange-500/20"
                                            placeholder="Street Address"
                                            value={editForm.address?.street || ''}
                                            onChange={(e) => setEditForm({ 
                                                ...editForm, 
                                                address: { ...editForm.address, street: e.target.value } 
                                            })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-slate-700 font-semibold">City</Label>
                                            <Input 
                                                className="h-12 bg-slate-50 border-slate-200" 
                                                placeholder="City"
                                                value={editForm.address?.city || ''}
                                                onChange={(e) => setEditForm({ 
                                                    ...editForm, 
                                                    address: { ...editForm.address, city: e.target.value } 
                                                })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-slate-700 font-semibold">Postal Code</Label>
                                            <Input 
                                                className="h-12 bg-slate-50 border-slate-200" 
                                                placeholder="ZIP Code" 
                                                value={editForm.address?.zipCode || ''}
                                                onChange={(e) => setEditForm({ 
                                                    ...editForm, 
                                                    address: { ...editForm.address, zipCode: e.target.value } 
                                                })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-slate-700 font-semibold">Country</Label>
                                            <Input 
                                                className="h-12 bg-slate-50 border-slate-200" 
                                                placeholder="Country" 
                                                value={editForm.address?.country || ''}
                                                onChange={(e) => setEditForm({ 
                                                    ...editForm, 
                                                    address: { ...editForm.address, country: e.target.value } 
                                                })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* About Me */}
                            <div className="pt-4 border-t border-slate-100">
                                <h3 className="text-lg font-bold text-slate-900 mb-6">About Me</h3>
                                <div className="space-y-2">
                                    <Label className="text-slate-700 font-semibold">Biography</Label>
                                    <textarea
                                        className="min-h-[150px] w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 disabled:cursor-not-allowed disabled:opacity-50"
                                        placeholder="Tell us about yourself..."
                                        value={editForm.bio || ''}
                                        onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-100 flex justify-end">
                                <Button
                                    type="submit"
                                    size="lg"
                                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 h-12 rounded-xl shadow-lg shadow-orange-500/20"
                                    disabled={saving}
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Updating Profile...
                                        </>
                                    ) : (
                                        'Update Profile'
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

        </div>
    );
}
