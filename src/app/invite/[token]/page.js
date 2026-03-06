'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { Mail, User, Lock, Eye, EyeOff, Building2, CheckCircle, AlertCircle, Loader2, Shield, ArrowRight } from 'lucide-react';

export default function InvitePage() {
    const router = useRouter();
    const params = useParams();
    const token = params.token || '';

    const [inviteData, setInviteData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [user, setUser] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [userExists, setUserExists] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    useEffect(() => {
        if (token) {
            fetchInviteData().then((inviteData) => {
                // Only check auth after invite data is loaded and passed directly
                if (inviteData) {
                    checkAuthStatus(inviteData);
                }
            });
        } else {
            setError('Invalid invite link');
            setLoading(false);
        }
    }, [token]);

    // Auto-accept invite if user is logged in and email matches
    useEffect(() => {
        if (user && inviteData && user.email.toLowerCase() === inviteData.email.toLowerCase()) {
            // Auto-accept after 1 second to show the welcome message
            const timer = setTimeout(() => {
                acceptInvite();
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [user, inviteData]);

    // Separate useEffect for user existence check when inviteData is loaded
    useEffect(() => {
        if (inviteData?.email) {
            checkIfUserExists(inviteData.email).then(exists => {
                setUserExists(exists);
            });
        }
    }, [inviteData?.email]);

    const fetchInviteData = async () => {
        try {
            const res = await api.get(`/invite/${token}`);

            if (res.data?.success) {
                const inviteData = res.data.data;
                setInviteData(inviteData);
                setFormData(prev => ({
                    ...prev,
                    name: inviteData.name,
                    email: inviteData.email
                }));
                return inviteData; // Return the data for immediate use
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid or expired invite link');
        } finally {
            setLoading(false);
        }
    };

    const checkAuthStatus = async (passedInviteData = null) => {
        try {
            const token = localStorage.getItem('token');

            if (token) {
                const res = await api.get('/auth/me');

                if (res.data?.success) {
                    const loggedInUser = res.data.user || res.data.data; // Handle both response formats

                    if (!loggedInUser) {
                        setUser(null);
                        return;
                    }

                    // Use passed invite data or fall back to state
                    const currentInviteData = passedInviteData || inviteData;

                    // Check if logged-in user email matches invite email
                    if (currentInviteData && currentInviteData.email && loggedInUser.email.toLowerCase() === currentInviteData.email.toLowerCase()) {
                        setUser(loggedInUser);
                        return; // Correct user, proceed
                    } else {
                        // Wrong user logged in or invite not loaded yet, don't clear session
                        // Just set user to null for now, inviteData might load later
                        setUser(null);
                        return;
                    }
                }
            }
        } catch (err) {
            // User not logged in or token invalid
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
        }
    };

    const checkIfUserExists = async (email) => {
        try {
            const res = await api.post('/auth/check-user-exists', { email });
            return res.data?.exists || false;
        } catch (err) {
            console.error('Error checking user existence:', err);
            return false;
        }
    };

    const handleAcceptInvite = async () => {
        if (user) {
            // User is logged in, verify email matches
            if (user.email.toLowerCase() !== inviteData.email.toLowerCase()) {
                toast.error('This invite link is not for your account');
                return;
            }
            await acceptInvite();
        } else {
            // User not logged in, check if account exists
            if (userExists) {
                // User exists but not logged in, redirect to login with proper parameters
                router.push(`/login?redirect=/invite/${token}&email=${encodeURIComponent(inviteData.email)}`);
            } else {
                // User doesn't exist, redirect to register
                router.push(`/register?invite=${token}&email=${encodeURIComponent(inviteData.email)}&name=${encodeURIComponent(inviteData.name)}&role=${inviteData.role}`);
            }
        }
    };

    const handleRegister = async () => {
        // Redirect to register page with auto-fill data
        router.push(`/register?email=${encodeURIComponent(inviteData.email)}&name=${encodeURIComponent(inviteData.name)}&role=${inviteData.role}&invite=${token}&otpRequired=true`);
    };

    const handleLoginWithInvite = () => {
        // Redirect to login with pre-filled email (locked) and return path
        router.push(`/login?email=${encodeURIComponent(inviteData.email)}&locked=true&invite=${token}&redirect=/invite/${token}`);
    };

    const acceptInvite = async () => {
        setIsSubmitting(true);
        try {
            const res = await api.post('/invite/accept', { token });

            if (res.data?.success) {
                toast.success('Invite accepted successfully!');

                // Wait a bit longer to ensure database operations complete
                setTimeout(() => {
                    const redirectPath = inviteData.role === 'tutor' ? '/tutor/dashboard' : '/student/dashboard';
                    router.push(redirectPath);
                }, 2000);
            } else {
                toast.error(res.data?.message || 'Failed to accept invite');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to accept invite');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLogin = () => {
        // Redirect to login with invite token
        router.push(`/login?invite=${token}&redirect=/invite/${token}&email=${encodeURIComponent(inviteData.email)}`);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading invite...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
                <div className="max-w-md w-full mx-4">
                    <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Invite</h2>
                        <p className="text-gray-600 mb-6">{error}</p>
                        <button
                            onClick={() => router.push('/login')}
                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            Go to Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (user) {
        // User is logged in
        if (user.email.toLowerCase() === inviteData.email.toLowerCase()) {
            return (
                <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
                    <div className="max-w-md w-full mx-4">
                        <div className="bg-white rounded-xl shadow-lg p-8">
                            <div className="text-center mb-6">
                                {inviteData.institute.logo && (
                                    <img
                                        src={inviteData.institute.logo}
                                        alt={inviteData.institute.name}
                                        className="w-20 h-20 mx-auto mb-4 rounded-lg"
                                    />
                                )}
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                    Welcome to {inviteData.institute.name}
                                </h2>
                                <p className="text-gray-600">
                                    You've been invited to join as a <span className="font-semibold capitalize">{inviteData.role}</span>
                                </p>
                            </div>

                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                    <div>
                                        <p className="font-medium text-green-900">Email Verified</p>
                                        <p className="text-sm text-green-700">This invite is for your account</p>
                                    </div>
                                </div>
                            </div>

                            {isSubmitting ? (
                                <div className="w-full py-3 px-4 bg-green-600 text-white rounded-lg font-medium flex items-center justify-center">
                                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                    Accepting Invitation...
                                </div>
                            ) : (
                                <div className="w-full py-3 px-4 bg-green-100 text-green-800 rounded-lg font-medium text-center">
                                    ✓ Accepting your invitation automatically...
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            );
        } else {
            return (
                <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
                    <div className="max-w-md w-full mx-4">
                        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Mismatch</h2>
                            <p className="text-gray-600 mb-4">
                                This invite is for <strong>{inviteData.email}</strong> but you're logged in as <strong>{user.email}</strong>
                            </p>
                            <div className="space-y-3">
                                <button
                                    onClick={() => {
                                        localStorage.removeItem('token');
                                        localStorage.removeItem('user');
                                        window.location.reload();
                                    }}
                                    className="w-full py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                >
                                    Logout and Continue
                                </button>
                                <button
                                    onClick={() => router.push('/dashboard')}
                                    className="w-full py-2 px-4 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                                >
                                    Go to Dashboard
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }
    }

    // User needs to register - Check if user exists and show appropriate options
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
            <div className="max-w-md w-full mx-4">
                <div className="bg-white rounded-xl shadow-lg p-8">
                    <div className="text-center mb-6">
                        {inviteData.institute.logo && (
                            <img
                                src={inviteData.institute.logo}
                                alt={inviteData.institute.name}
                                className="w-20 h-20 mx-auto mb-4 rounded-lg"
                            />
                        )}
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            Join {inviteData.institute.name}
                        </h2>
                        <p className="text-gray-600">
                            You've been invited to join as a <span className="font-semibold capitalize">{inviteData.role}</span>
                        </p>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <div className="flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-blue-600" />
                            <div>
                                <p className="font-medium text-blue-900">Invite Ready</p>
                                <p className="text-sm text-blue-700">
                                    {userExists
                                        ? `Account found for ${inviteData.email}. Please login to accept the invite.`
                                        : `No account found for ${inviteData.email}. Create a new account to join.`
                                    }
                                </p>
                            </div>
                        </div>
                    </div>

                    {userExists ? (
                        // Scenario 2: User exists but not logged in - Show login button
                        <div className="space-y-4">
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                <div className="flex items-center gap-3">
                                    <Shield className="w-5 h-5 text-amber-600" />
                                    <div>
                                        <p className="font-medium text-amber-900">Security Notice</p>
                                        <p className="text-sm text-amber-700">
                                            You'll need to login with your account to verify this invite.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleLoginWithInvite}
                                className="w-full py-3 px-4 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                            >
                                <Lock className="w-5 h-5" />
                                Login to Accept Invite
                            </button>
                        </div>
                    ) : (
                        // Scenario 3: User doesn't exist - Show create account button
                        <div className="space-y-4">
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <div className="flex items-center gap-3">
                                    <User className="w-5 h-5 text-green-600" />
                                    <div>
                                        <p className="font-medium text-green-900">Create Your Account</p>
                                        <p className="text-sm text-green-700">
                                            Click below to create your account and join the institute.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleRegister}
                                className="w-full py-3 px-4 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                            >
                                <User className="w-5 h-5" />
                                Create Account
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
