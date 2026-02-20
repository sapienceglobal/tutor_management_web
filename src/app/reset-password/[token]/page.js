'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Loader2, ArrowLeft, CheckCircle, AlertCircle, Lock } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api from '@/lib/axios';

export default function ResetPasswordPage({ params }) {
    const router = useRouter();
    const { token } = use(params);


    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            await api.post(`/auth/reset-password/${token}`, { password });
            setSuccess(true);
            setTimeout(() => {
                router.push('/login');
            }, 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reset password. Link may be expired.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-white p-4">
            <div className="w-full max-w-sm space-y-6">
                <div className="text-center space-y-2">
                    <div className="mx-auto w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-4">
                        <Lock className="w-6 h-6 text-indigo-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">Reset Password</h1>
                    <p className="text-slate-600">
                        Enter your new password below.
                    </p>
                </div>

                {success ? (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center animate-in fade-in slide-in-from-bottom-2">
                        <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                        <h3 className="font-semibold text-emerald-900 mb-1">Password Reset!</h3>
                        <p className="text-sm text-emerald-700">
                            Your password has been successfully updated. Redirecting to login...
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-600 border border-red-100">
                                <AlertCircle className="h-4 w-4" />
                                <p>{error}</p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="password">New Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="h-11"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="••••••••"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="h-11"
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                'Set New Password'
                            )}
                        </Button>
                    </form>
                )}

                {!success && (
                    <div className="text-center">
                        <Link
                            href="/login"
                            className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to log in
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
