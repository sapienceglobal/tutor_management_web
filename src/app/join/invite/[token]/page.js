'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { GraduationCap, Mail, User, Phone, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import api from '@/lib/axios';
import Cookies from 'js-cookie';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function InviteJoinPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [inviteData, setInviteData] = useState(null);
    const [isRegistered, setIsRegistered] = useState(false);
    
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });

    // Load invite data on mount
    useEffect(() => {
        if (!token) {
            setError('Invalid invite link');
            return;
        }
        
        loadInviteData();
    }, [token]);

    const loadInviteData = async () => {
        try {
            const response = await api.get(`/membership/invite/${token}`);
            if (response.data.success) {
                setInviteData(response.data.invite);
                setFormData(prev => ({
                    ...prev,
                    email: response.data.invite.email || ''
                }));
                setIsRegistered(!!response.data.invite.email);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid or expired invite');
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            if (!isRegistered) {
                // New user registration + accept invite
                if (formData.password !== formData.confirmPassword) {
                    setError("Passwords do not match");
                    return;
                }

                const { confirmPassword, ...registerData } = formData;
                const registerResponse = await api.post('/auth/register-with-invite', {
                    ...registerData,
                    inviteToken: token
                });

                const { token: authToken, user } = registerResponse.data;
                
                // Set auth tokens
                Cookies.set('token', authToken, { expires: 7 });
                Cookies.set('user_role', user.role, { expires: 7 });
                localStorage.setItem('token', authToken);
                localStorage.setItem('user', JSON.stringify(user));

                // Redirect based on role
                if (user.role === 'tutor') {
                    router.push('/tutor/dashboard');
                } else {
                    router.push('/student/dashboard');
                }
            } else {
                // Existing user accepting invite
                const response = await api.post('/membership/accept-invite', { token });
                
                if (response.data.success) {
                    // Update user's current institute if needed
                    const currentMembership = response.data.membership;
                    localStorage.setItem('currentInstitute', JSON.stringify({
                        id: currentMembership.instituteId._id,
                        name: currentMembership.instituteId.name,
                        role: currentMembership.roleInInstitute
                    }));

                    // Redirect to appropriate dashboard
                    if (currentMembership.roleInInstitute === 'tutor') {
                        router.push('/tutor/dashboard');
                    } else {
                        router.push('/student/dashboard');
                    }
                }
            }
        } catch (err) {
            console.error('Invite accept error:', err);
            setError(err.response?.data?.message || 'Failed to accept invite');
        } finally {
            setIsLoading(false);
        }
    };

    if (error && !inviteData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="max-w-md w-full p-8 bg-white rounded-2xl shadow-lg text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Invalid Invite</h2>
                    <p className="text-slate-600 mb-6">{error}</p>
                    <Button onClick={() => router.push('/')} className="w-full">
                        Go to Homepage
                    </Button>
                </div>
            </div>
        );
    }

    if (!inviteData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 p-4">
            <div className="max-w-md w-full">
                {/* Invite Preview Card */}
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white text-center">
                        <GraduationCap className="w-12 h-12 mx-auto mb-3" />
                        <h1 className="text-2xl font-bold mb-2">
                            You're Invited!
                        </h1>
                        <p className="text-indigo-100">
                            Join {inviteData.instituteId?.name} as {inviteData.roleInInstitute}
                        </p>
                    </div>

                    <div className="p-6">
                        {/* Invite Details */}
                        <div className="mb-6 p-4 bg-indigo-50 rounded-xl">
                            <div className="flex items-center gap-3 mb-2">
                                <CheckCircle className="w-5 h-5 text-indigo-600" />
                                <span className="font-semibold text-indigo-900">Institute Details</span>
                            </div>
                            <div className="text-sm text-slate-600">
                                <p><strong>Name:</strong> {inviteData.instituteId?.name}</p>
                                <p><strong>Role:</strong> {inviteData.roleInInstitute}</p>
                                <p><strong>Invited by:</strong> {inviteData.invitedBy?.name}</p>
                            </div>
                        </div>

                        {/* Registration Form */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {!isRegistered ? (
                                <>
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Full Name</Label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                            <Input
                                                id="name"
                                                name="name"
                                                placeholder="John Doe"
                                                required
                                                className="pl-10"
                                                value={formData.name}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Phone Number</Label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                            <Input
                                                id="phone"
                                                name="phone"
                                                placeholder="+1 234 567 8900"
                                                type="tel"
                                                required
                                                className="pl-10"
                                                value={formData.phone}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="password">Password</Label>
                                        <Input
                                            id="password"
                                            name="password"
                                            type="password"
                                            required
                                            placeholder="Create a password"
                                            value={formData.password}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                                        <Input
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            type="password"
                                            required
                                            placeholder="Confirm your password"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-4">
                                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                                    <h3 className="text-lg font-semibold text-slate-800 mb-2">
                                        Ready to Join!
                                    </h3>
                                    <p className="text-slate-600">
                                        Accept the invite to join {inviteData.instituteId?.name}
                                    </p>
                                </div>
                            )}

                            {error && (
                                <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg text-red-600 text-sm">
                                    <AlertCircle className="w-4 h-4" />
                                    {error}
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Processing...
                                    </>
                                ) : isRegistered ? (
                                    'Accept Invite'
                                ) : (
                                    'Register & Join'
                                )}
                            </Button>
                        </form>

                        <div className="mt-6 text-center">
                            <p className="text-xs text-slate-500">
                                By joining, you agree to the institute's terms and policies
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
