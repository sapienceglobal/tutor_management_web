'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GraduationCap, Loader2, Mail, Lock, User, Phone, CheckCircle, AlertCircle } from 'lucide-react';
import api from '@/lib/axios';
import Cookies from 'js-cookie';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function RegisterPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        role: 'student', // Default role
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleRoleSelect = (role) => {
        setFormData({ ...formData, role });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            // Exclude confirmPassword from payload
            const { confirmPassword, ...payload } = formData;

            const response = await api.post('/auth/register', payload);
            const { token, user } = response.data;

            // Store auth data in Cookies for Middleware access
            Cookies.set('token', token, { expires: 7 });
            Cookies.set('user_role', user.role, { expires: 7 });

            // Store in localStorage for client-side access
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            // Redirect based on role
            if (user.role === 'tutor') {
                router.push('/tutor/dashboard');
            } else {
                router.push('/student/dashboard');
            }
        } catch (err) {
            console.error('Registration error:', err);
            setError(
                err.response?.data?.message || 'Registration failed. Please try again.'
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4 py-8">
            <Card className="w-full max-w-lg border-0 shadow-xl ring-1 ring-black/5">
                <CardHeader className="space-y-4 pb-6 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <GraduationCap className="h-8 w-8" />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                            Create Account
                        </h1>
                        <p className="text-sm text-gray-500">
                            Join us to start your learning journey
                        </p>
                    </div>
                </CardHeader>

                <CardContent className="space-y-6">
                    {error && (
                        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm font-medium text-destructive">
                            <AlertCircle className="h-4 w-4" />
                            <p>{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Name Field */}
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    id="name"
                                    name="name"
                                    placeholder="John Doe"
                                    type="text"
                                    required
                                    className="pl-10 h-10"
                                    value={formData.name}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* Email Field */}
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    id="email"
                                    name="email"
                                    placeholder="name@example.com"
                                    type="email"
                                    required
                                    className="pl-10 h-10"
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* Phone Field */}
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    id="phone"
                                    name="phone"
                                    placeholder="+1 234 567 8900"
                                    type="tel"
                                    required
                                    className="pl-10 h-10"
                                    value={formData.phone}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* Password Fields */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="password"
                                        name="password"
                                        placeholder="******"
                                        type="password"
                                        required
                                        className="pl-10 h-10"
                                        value={formData.password}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        placeholder="******"
                                        type="password"
                                        required
                                        className="pl-10 h-10"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Role Selection */}
                        <div className="space-y-3 pt-2">
                            <Label>I am a</Label>
                            <div className="grid grid-cols-2 gap-4">
                                <div
                                    onClick={() => handleRoleSelect('student')}
                                    className={cn(
                                        "cursor-pointer relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 p-4 transition-all hover:bg-gray-50",
                                        formData.role === 'student'
                                            ? "border-primary bg-primary/5 hover:bg-primary/10"
                                            : "border-gray-100 bg-white"
                                    )}
                                >
                                    <GraduationCap className={cn("h-6 w-6", formData.role === 'student' ? "text-primary" : "text-gray-500")} />
                                    <span className={cn("text-sm font-semibold", formData.role === 'student' ? "text-primary" : "text-gray-600")}>Student</span>
                                    {formData.role === 'student' && (
                                        <div className="absolute top-2 right-2 text-primary">
                                            <CheckCircle className="h-4 w-4" />
                                        </div>
                                    )}
                                </div>

                                <div
                                    onClick={() => handleRoleSelect('tutor')}
                                    className={cn(
                                        "cursor-pointer relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 p-4 transition-all hover:bg-gray-50",
                                        formData.role === 'tutor'
                                            ? "border-primary bg-primary/5 hover:bg-primary/10"
                                            : "border-gray-100 bg-white"
                                    )}
                                >
                                    <User className={cn("h-6 w-6", formData.role === 'tutor' ? "text-primary" : "text-gray-500")} />
                                    <span className={cn("text-sm font-semibold", formData.role === 'tutor' ? "text-primary" : "text-gray-600")}>Tutor</span>
                                    {formData.role === 'tutor' && (
                                        <div className="absolute top-2 right-2 text-primary">
                                            <CheckCircle className="h-4 w-4" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-11 text-base font-semibold mt-4"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating Account...
                                </>
                            ) : (
                                'Create Account'
                            )}
                        </Button>
                    </form>
                </CardContent>

                <CardFooter className="flex flex-col space-y-4 border-t bg-gray-50/50 p-6 rounded-b-xl">
                    <div className="text-center text-sm text-gray-500">
                        Already have an account?{' '}
                        <a
                            href="/login"
                            className="font-semibold text-primary hover:underline"
                        >
                            Sign back in
                        </a>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
