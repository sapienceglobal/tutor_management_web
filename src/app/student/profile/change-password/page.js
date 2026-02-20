'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Save, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import api from '@/lib/axios';

export default function ChangePasswordPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [hasPassword, setHasPassword] = useState(true);
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        const loadUser = async () => {
            try {
                const response = await api.get('/auth/me');
                setHasPassword(Boolean(response.data?.user?.hasPassword));
            } catch (error) {
                console.error('Error fetching user profile:', error);
            } finally {
                setLoadingProfile(false);
            }
        };

        loadUser();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (formData.newPassword !== formData.confirmPassword) {
            alert("New passwords don't match!");
            setLoading(false);
            return;
        }

        if (formData.newPassword.length < 6) {
            alert('Password must be at least 6 characters!');
            setLoading(false);
            return;
        }

        try {
            const payload = hasPassword
                ? { currentPassword: formData.currentPassword, newPassword: formData.newPassword }
                : { newPassword: formData.newPassword };
            const endpoint = hasPassword ? '/auth/change-password' : '/auth/set-password';
            const response = await api.post(endpoint, payload);

            if (response.data.success) {
                alert(hasPassword ? 'Password updated successfully!' : 'Password set successfully!');
                router.back();
            }
        } catch (error) {
            console.error('Error changing password:', error);
            alert(error.response?.data?.message || 'Failed to update password');
        } finally {
            setLoading(false);
        }
    };

    if (loadingProfile) {
        return (
            <div className="max-w-md mx-auto py-10">
                <p className="text-gray-500">Loading...</p>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto py-10">
            <Button variant="ghost" className="mb-6 pl-0 hover:bg-transparent hover:text-purple-600" onClick={() => router.back()}>
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Profile
            </Button>

            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-8 h-8 text-red-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">{hasPassword ? 'Change Password' : 'Create Password'}</h1>
                <p className="text-gray-500 mt-2">
                    {hasPassword
                        ? 'Create a new, strong password for your account.'
                        : 'Your account uses social login. Set a password for email login.'}
                </p>
            </div>

            <Card>
                <CardContent className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {hasPassword && (
                            <div className="space-y-2">
                                <Label htmlFor="currentPassword">Current Password</Label>
                                <Input
                                    id="currentPassword"
                                    name="currentPassword"
                                    type="password"
                                    placeholder="Enter current password"
                                    value={formData.currentPassword}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="newPassword">{hasPassword ? 'New Password' : 'Create Password'}</Label>
                            <Input
                                id="newPassword"
                                name="newPassword"
                                type="password"
                                placeholder="Enter new password"
                                value={formData.newPassword}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                            <Input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                placeholder="Confirm new password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-red-600 hover:bg-red-700 mt-4"
                            disabled={loading}
                        >
                            {loading ? 'Saving...' : hasPassword ? 'Update Password' : 'Set Password'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
