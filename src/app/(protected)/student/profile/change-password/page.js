'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';

const PasswordField = ({ label, name, value, onChange, placeholder }) => {
    const [show, setShow] = useState(false);
    return (
        <div>
            <label className="block text-[10px] font-black uppercase tracking-wider mb-1.5"
                style={{ color: 'var(--theme-foreground)', opacity: 0.35 }}>
                {label}
            </label>
            <div className="relative">
                <input
                    id={name} name={name}
                    type={show ? 'text' : 'password'}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    required
                    className="w-full px-3 py-2.5 pr-10 rounded-xl border text-sm"
                    style={{
                        backgroundColor: 'color-mix(in srgb, var(--theme-foreground) 4%, var(--theme-background))',
                        borderColor: 'var(--theme-border)',
                        color: 'var(--theme-foreground)',
                        outline: 'none',
                    }}
                />
                <button type="button" onClick={() => setShow(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity"
                    style={{ color: 'var(--theme-foreground)', opacity: 0.35 }}
                    onMouseEnter={e => { e.currentTarget.style.opacity = '0.7'; }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = '0.35'; }}>
                    {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
            </div>
        </div>
    );
};

export default function ChangePasswordPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [hasPassword, setHasPassword] = useState(true);
    const [formData, setFormData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

    useEffect(() => {
        api.get('/auth/me')
            .then(res => setHasPassword(Boolean(res.data?.user?.hasPassword)))
            .catch(() => {})
            .finally(() => setLoadingProfile(false));
    }, []);

    const handleChange = e => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

    const handleSubmit = async e => {
        e.preventDefault();
        if (formData.newPassword !== formData.confirmPassword) {
            toast.error("Passwords don't match!");
            return;
        }
        if (formData.newPassword.length < 6) {
            toast.error('Minimum 6 characters required');
            return;
        }
        setLoading(true);
        try {
            const payload = hasPassword
                ? { currentPassword: formData.currentPassword, newPassword: formData.newPassword }
                : { newPassword: formData.newPassword };
            const endpoint = hasPassword ? '/auth/change-password' : '/auth/set-password';
            const res = await api.post(endpoint, payload);
            if (res.data.success) {
                toast.success(hasPassword ? 'Password updated!' : 'Password set!');
                router.back();
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update password');
        } finally { setLoading(false); }
    };

    if (loadingProfile) return (
        <div className="flex items-center justify-center min-h-[40vh]">
            <div className="w-8 h-8 rounded-full border-[3px] animate-spin"
                style={{ borderColor: 'color-mix(in srgb, var(--theme-primary) 20%, transparent)', borderTopColor: 'var(--theme-primary)' }} />
        </div>
    );

    return (
        <div className="max-w-md mx-auto py-10 px-4">
            {/* Back */}
            <button onClick={() => router.back()}
                className="flex items-center gap-2 mb-8 text-sm font-medium transition-all"
                style={{ color: 'var(--theme-foreground)', opacity: 0.55 }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = 'var(--theme-primary)'; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '0.55'; e.currentTarget.style.color = 'var(--theme-foreground)'; }}>
                <ArrowLeft className="w-4 h-4" /> Back to Profile
            </button>

            {/* Icon + Title */}
            <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                    style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 10%, transparent)' }}>
                    <Lock className="w-8 h-8" style={{ color: 'var(--theme-primary)' }} />
                </div>
                <h1 className="text-2xl font-black" style={{ color: 'var(--theme-foreground)' }}>
                    {hasPassword ? 'Change Password' : 'Create Password'}
                </h1>
                <p className="text-sm mt-2 max-w-xs mx-auto" style={{ color: 'var(--theme-foreground)', opacity: 0.45 }}>
                    {hasPassword
                        ? 'Create a new, strong password for your account.'
                        : 'Your account uses social login. Set a password for email login.'}
                </p>
            </div>

            {/* Form card */}
            <div className="rounded-2xl border p-6"
                style={{ backgroundColor: 'var(--theme-background)', borderColor: 'var(--theme-border)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {hasPassword && (
                        <PasswordField
                            label="Current Password" name="currentPassword"
                            value={formData.currentPassword} onChange={handleChange}
                            placeholder="Enter current password"
                        />
                    )}
                    <PasswordField
                        label={hasPassword ? 'New Password' : 'Create Password'} name="newPassword"
                        value={formData.newPassword} onChange={handleChange}
                        placeholder="Enter new password"
                    />
                    <PasswordField
                        label="Confirm Password" name="confirmPassword"
                        value={formData.confirmPassword} onChange={handleChange}
                        placeholder="Repeat new password"
                    />

                    {/* Strength indicator */}
                    {formData.newPassword.length > 0 && (
                        <div>
                            <div className="flex gap-1 mt-1">
                                {[1, 2, 3, 4].map(n => (
                                    <div key={n} className="h-1 flex-1 rounded-full transition-all"
                                        style={{
                                            backgroundColor: formData.newPassword.length >= n * 2
                                                ? (formData.newPassword.length >= 8 ? 'var(--theme-primary)' : '#f59e0b')
                                                : 'color-mix(in srgb, var(--theme-foreground) 10%, transparent)',
                                        }} />
                                ))}
                            </div>
                            <p className="text-[11px] mt-1" style={{ color: 'var(--theme-foreground)', opacity: 0.4 }}>
                                {formData.newPassword.length < 4 ? 'Too short' : formData.newPassword.length < 8 ? 'Fair' : 'Strong'}
                            </p>
                        </div>
                    )}

                    <button type="submit" disabled={loading}
                        className="w-full py-3 mt-2 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                        style={{ backgroundColor: 'var(--theme-primary)' }}
                        onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                        onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'none'; }}>
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {hasPassword ? 'Update Password' : 'Set Password'}
                    </button>
                </form>
            </div>
        </div>
    );
}