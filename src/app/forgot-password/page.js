'use client';

import { useEffect, useState } from 'react';
import { Mail, Loader2, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api from '@/lib/axios';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const prefillEmail = new URLSearchParams(window.location.search).get('email');
            if (prefillEmail) {
                setEmail(decodeURIComponent(prefillEmail));
            }
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccess(false);

        try {
            await api.post('/auth/forgot-password', { email });
            setSuccess(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send reset email. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-white p-4">
            <div className="w-full max-w-sm space-y-6">
                <div className="text-center space-y-2">
                    <div className="mx-auto w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-4">
                        <Mail className="w-6 h-6 text-indigo-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">Forgot password?</h1>
                    <p className="text-slate-600">
                        No worries, we'll send you reset instructions.
                    </p>
                </div>

                {success ? (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center animate-in fade-in slide-in-from-bottom-2">
                        <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                        <h3 className="font-semibold text-emerald-900 mb-1">Email sent</h3>
                        <p className="text-sm text-emerald-700">
                            Check your inbox for instructions to reset your password.
                        </p>
                        <Button
                            variant="outline"
                            className="w-full mt-4 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                            onClick={() => setSuccess(false)}
                        >
                            Back to login
                        </Button>
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
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@example.com"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
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
                                    Sending Link...
                                </>
                            ) : (
                                'Reset Password'
                            )}
                        </Button>
                    </form>
                )}

                <div className="text-center">
                    <Link
                        href="/login"
                        className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to log in
                    </Link>
                </div>
            </div>
        </div>
    );
}
