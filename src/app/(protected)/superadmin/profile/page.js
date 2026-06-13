'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    MdPerson, MdEmail, MdPhone, MdLock,
    MdHourglassEmpty, MdSave, MdPhotoCamera,
    MdSecurity, MdCheckCircle, MdCancel
} from 'react-icons/md';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { C, T, S, R } from '@/constants/studentTokens';

// Focus Handlers for clean input borders
const onFocusHandler = e => {
    e.target.style.borderColor = C.btnPrimary;
    e.target.style.boxShadow = `0 0 0 3px ${C.btnPrimary}30`;
};
const onBlurHandler = e => {
    e.target.style.borderColor = C.cardBorder;
    e.target.style.boxShadow = 'none';
};

const baseInputStyle = {
    backgroundColor: C.surfaceWhite,
    border: `1.5px solid ${C.cardBorder}`,
    borderRadius: '10px',
    color: C.heading,
    fontFamily: T.fontFamily,
    fontSize: T.size.sm,
    fontWeight: T.weight.semibold,
    outline: 'none',
    width: '100%',
    padding: '12px 16px',
    transition: 'all 0.2s ease',
};

const cardStyle = {
    backgroundColor: C.cardBg,
    border: `1px solid ${C.cardBorder}`,
    borderRadius: R['2xl'],
    boxShadow: S.card,
    padding: '24px',
};

export default function SuperAdminProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [savingDetails, setSavingDetails] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);

    // Form Data
    const [formData, setFormData] = useState({ name: '', phone: '' });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await api.get('/auth/me');
            if (res.data?.success) {
                const u = res.data.user;
                setUser(u);
                setFormData({
                    name: u.name || '',
                    phone: u.phone || '',
                });
            }
        } catch (err) {
            toast.error('Failed to load profile details');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveDetails = async (e) => {
        e.preventDefault();
        setSavingDetails(true);
        try {
            const res = await api.patch('/auth/profile', {
                name: formData.name,
                phone: formData.phone,
            });
            if (res.data?.success) {
                toast.success('Profile updated successfully');
                const updated = { ...user, name: formData.name, phone: formData.phone };
                setUser(updated);
                localStorage.setItem('user', JSON.stringify(updated));
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setSavingDetails(false);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingImage(true);
        try {
            const uploadData = new FormData();
            uploadData.append('image', file);
            const uploadRes = await api.post('/upload/image', uploadData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            if (uploadRes.data?.success) {
                const imgUrl = uploadRes.data.imageUrl;
                const cloudinaryId = uploadRes.data.cloudinaryId;
                
                await api.patch('/auth/profile-image', {
                    profileImage: imgUrl,
                    cloudinaryId,
                });
                
                const updated = { ...user, profileImage: imgUrl };
                setUser(updated);
                localStorage.setItem('user', JSON.stringify(updated));
                toast.success('Profile photo updated');
            }
        } catch (err) {
            toast.error('Failed to upload image');
        } finally {
            setUploadingImage(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-10 h-10 rounded-full border-[3px] animate-spin"
                    style={{ borderColor: 'color-mix(in srgb, var(--theme-primary) 20%, transparent)', borderTopColor: 'var(--theme-primary)' }} />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto" style={{ fontFamily: T.fontFamily }}>
            {/* Header section */}
            <div>
                <h1 style={{ color: C.heading, fontSize: T.size['2xl'], fontWeight: T.weight.bold, margin: 0 }}>My Profile</h1>
                <p style={{ color: C.textMuted, fontSize: T.size.sm, margin: '4px 0 0 0', fontWeight: T.weight.medium }}>
                    Manage your personal info, account settings, and security preferences.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left side: Avatar & Basic Details Card */}
                <div className="lg:col-span-1 space-y-6">
                    <div style={cardStyle} className="flex flex-col items-center text-center">
                        <div className="relative group mb-4">
                            <div className="w-32 h-32 rounded-2xl overflow-hidden shadow-md" style={{ border: `3.5px solid ${C.btnPrimary}20`, backgroundColor: C.innerBg }}>
                                <img
                                    src={user?.profileImage || '/default-avatar.svg'}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <label className="absolute -bottom-1 -right-1 w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer transition-transform hover:scale-105 shadow-md"
                                style={{ backgroundColor: C.btnPrimary }}>
                                {uploadingImage ? <MdHourglassEmpty className="animate-spin text-white" size={18} /> : <MdPhotoCamera className="text-white" size={18} />}
                                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
                            </label>
                        </div>

                        <h2 style={{ fontSize: T.size.lg, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 2px 0' }}>
                            {user?.name || 'Super Administrator'}
                        </h2>
                        <span className="px-3 py-1 rounded-full capitalize" style={{ backgroundColor: C.innerBg, color: C.btnPrimary, fontSize: T.size.xs, fontWeight: T.weight.bold }}>
                            {user?.role === 'superadmin' ? 'Super Admin' : user?.role || 'Admin'}
                        </span>
                        
                        <div className="w-full h-px my-6" style={{ backgroundColor: C.cardBorder }} />
                        
                        <div className="w-full space-y-4 text-left">
                            <div>
                                <label style={{ display: 'block', fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', letterSpacing: T.tracking.wider, marginBottom: '4px' }}>Email Address</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: C.heading, fontSize: T.size.sm, fontWeight: T.weight.semibold }}>
                                    <MdEmail style={{ color: C.textMuted }} size={16} />
                                    <span>{user?.email}</span>
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '10px', fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', letterSpacing: T.tracking.wider, marginBottom: '4px' }}>Phone Number</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: C.heading, fontSize: T.size.sm, fontWeight: T.weight.semibold }}>
                                    <MdPhone style={{ color: C.textMuted }} size={16} />
                                    <span>{user?.phone || 'Not configured'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right side: Account details editor + Security Settings */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* General Settings Card */}
                    <div style={cardStyle}>
                        <div className="pb-4 mb-6 border-b" style={{ borderColor: C.cardBorder }}>
                            <h2 style={{ fontSize: T.size.md, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>Account Information</h2>
                            <p style={{ fontSize: T.size.xs, color: C.textMuted, margin: '2px 0 0 0' }}>Update your profile contact details.</p>
                        </div>
                        
                        <form onSubmit={handleSaveDetails} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', letterSpacing: T.tracking.wider }}>Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        style={baseInputStyle}
                                        onFocus={onFocusHandler}
                                        onBlur={onBlurHandler}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', letterSpacing: T.tracking.wider }}>Phone Number</label>
                                    <input
                                        type="text"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        style={baseInputStyle}
                                        onFocus={onFocusHandler}
                                        onBlur={onBlurHandler}
                                    />
                                </div>
                            </div>
                            
                            <div className="flex justify-end pt-2">
                                <button type="submit" disabled={savingDetails} className="h-11 px-6 cursor-pointer border-none transition-opacity hover:opacity-90 shadow-sm text-white font-bold text-sm"
                                    style={{ backgroundColor: C.btnPrimary, borderRadius: '10px', boxShadow: S.btn }}>
                                    {savingDetails ? <MdHourglassEmpty className="animate-spin mr-2" size={16} /> : <MdSave className="mr-2" size={16} />}
                                    Save Profile Details
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Security Settings Card (Password & 2FA side-by-side on desktop) */}
                    <div style={cardStyle}>
                        <div className="pb-4 mb-6 border-b" style={{ borderColor: C.cardBorder }}>
                            <h2 style={{ fontSize: T.size.md, fontWeight: T.weight.bold, color: C.heading, margin: 0 }}>Security Settings</h2>
                            <p style={{ fontSize: T.size.xs, color: C.textMuted, margin: '2px 0 0 0' }}>Manage authorization details and two-factor authentication.</p>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 divide-y lg:divide-y-0 lg:divide-x" style={{ borderColor: C.cardBorder }}>
                            <div className="space-y-4 pr-0 lg:pr-8">
                                <h3 style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 4px 0' }}>Change Password</h3>
                                <SecuritySettings hasPassword={user?.hasPassword} />
                            </div>
                            <div className="space-y-4 pt-6 lg:pt-0 pl-0 lg:pl-8" style={{ borderColor: C.cardBorder }}>
                                <h3 style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, margin: '0 0 4px 0' }}>Two-Factor Authentication (2FA)</h3>
                                <TwoFactorSettings user={user} setUser={setUser} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SecuritySettings({ hasPassword }) {
    const [loading, setLoading] = useState(false);
    const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (passwords.newPassword !== passwords.confirmPassword) {
            toast.error("New passwords do not match");
            return;
        }
        setLoading(true);
        try {
            if (hasPassword) {
                await api.post('/auth/change-password', {
                    currentPassword: passwords.currentPassword,
                    newPassword: passwords.newPassword,
                });
                toast.success('Password updated successfully');
            } else {
                await api.post('/auth/set-password', {
                    newPassword: passwords.newPassword,
                });
                toast.success('Password set successfully');
            }
            setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Password update failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {hasPassword && (
                <div className="space-y-2">
                    <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', letterSpacing: T.tracking.wider }}>Current Password</label>
                    <input type="password" required value={passwords.currentPassword} onChange={e => setPasswords(p => ({ ...p, currentPassword: e.target.value }))} style={baseInputStyle} onFocus={onFocusHandler} onBlur={onBlurHandler} />
                </div>
            )}
            <div className="space-y-2">
                <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', letterSpacing: T.tracking.wider }}>{hasPassword ? 'New Password' : 'Create Password'}</label>
                <input type="password" required minLength={6} value={passwords.newPassword} onChange={e => setPasswords(p => ({ ...p, newPassword: e.target.value }))} style={baseInputStyle} onFocus={onFocusHandler} onBlur={onBlurHandler} />
            </div>
            <div className="space-y-2">
                <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted, textTransform: 'uppercase', letterSpacing: T.tracking.wider }}>Confirm Password</label>
                <input type="password" required value={passwords.confirmPassword} onChange={e => setPasswords(p => ({ ...p, confirmPassword: e.target.value }))} style={baseInputStyle} onFocus={onFocusHandler} onBlur={onBlurHandler} />
            </div>
            <div className="pt-2">
                <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 h-12 cursor-pointer border-none transition-opacity hover:opacity-90 shadow-md text-white font-bold text-sm"
                    style={{ backgroundColor: C.btnPrimary, borderRadius: '10px', boxShadow: S.btn }}>
                    {loading ? <MdHourglassEmpty size={18} className="animate-spin" /> : <MdSave size={18} />}
                    {hasPassword ? 'Update Password' : 'Set Password'}
                </button>
            </div>
        </form>
    );
}

function TwoFactorSettings({ user, setUser }) {
    const [loading, setLoading] = useState(false);
    const [setupData, setSetupData] = useState(null);
    const [otpCode, setOtpCode] = useState('');
    const [showDisableForm, setShowDisableForm] = useState(false);

    const handleInitiate = async () => {
        setLoading(true);
        try {
            const res = await api.post('/auth/enable-2fa');
            if (res.data?.success) {
                setSetupData({
                    secret: res.data.secret,
                    qrCode: res.data.qrCode
                });
                setOtpCode('');
            } else {
                toast.error(res.data?.message || 'Failed to initiate 2FA');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to initiate 2FA');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async () => {
        if (!otpCode || otpCode.length !== 6) {
            toast.error('Please enter a 6-digit code');
            return;
        }
        setLoading(true);
        try {
            const res = await api.post('/auth/verify-2fa', { token: otpCode });
            if (res.data?.success) {
                toast.success('2FA enabled successfully!');
                const updated = { ...user, twoFactorEnabled: true };
                setUser(updated);
                localStorage.setItem('user', JSON.stringify(updated));
                setSetupData(null);
                setOtpCode('');
            } else {
                toast.error(res.data?.message || 'Verification failed');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    const handleDisable = async () => {
        if (!otpCode || otpCode.length !== 6) {
            toast.error('Please enter a 6-digit code');
            return;
        }
        setLoading(true);
        try {
            const res = await api.post('/auth/disable-2fa', { token: otpCode });
            if (res.data?.success) {
                toast.success('2FA disabled successfully');
                const updated = { ...user, twoFactorEnabled: false };
                setUser(updated);
                localStorage.setItem('user', JSON.stringify(updated));
                setShowDisableForm(false);
                setOtpCode('');
            } else {
                toast.error(res.data?.message || 'Deactivation failed');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Deactivation failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ color: C.text }} className="space-y-4">
            {user?.twoFactorEnabled ? (
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4" style={{ backgroundColor: C.innerBg, borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}>
                        <div>
                            <span style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, display: 'block' }}>2FA is Currently Enabled</span>
                            <span style={{ fontSize: T.size.xs, color: C.textMuted, display: 'block', marginTop: '2px' }}>Protected with TOTP authenticator app.</span>
                        </div>
                        {!showDisableForm && (
                            <button onClick={() => { setShowDisableForm(true); setOtpCode(''); }}
                                className="px-4 h-9 cursor-pointer transition-opacity hover:opacity-85 border-none font-bold text-xs shrink-0 text-red-500"
                                style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                Disable
                            </button>
                        )}
                    </div>

                    {showDisableForm && (
                        <div className="p-4 space-y-3" style={{ border: '1.5px dashed rgba(239, 68, 68, 0.3)', borderRadius: '10px', backgroundColor: 'rgba(239, 68, 68, 0.02)' }}>
                            <span style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: '#ef4444', display: 'block' }}>Confirm Disabling 2FA</span>
                            <p style={{ fontSize: T.size.xs, color: C.textMuted, margin: 0 }}>Enter the 6-digit code from your authenticator app to disable 2FA.</p>
                            <div className="flex gap-3 max-w-sm">
                                <input
                                    type="text"
                                    placeholder="000000"
                                    maxLength={6}
                                    style={{
                                        backgroundColor: C.surfaceWhite,
                                        border: `1.5px solid ${C.cardBorder}`,
                                        borderRadius: '8px',
                                        color: C.heading,
                                        fontSize: T.size.sm,
                                        fontWeight: T.weight.semibold,
                                        padding: '8px 12px',
                                        outline: 'none',
                                        flex: 1
                                    }}
                                    value={otpCode}
                                    onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                />
                                <button onClick={handleDisable} disabled={loading || otpCode.length !== 6}
                                    className="px-4 h-9 cursor-pointer transition-opacity hover:opacity-85 border-none font-bold text-xs text-white"
                                    style={{ backgroundColor: '#ef4444', borderRadius: '8px' }}>
                                    {loading ? 'Disabling...' : 'Confirm'}
                                </button>
                                <button onClick={() => setShowDisableForm(false)}
                                    className="px-3 h-9 cursor-pointer transition-opacity hover:opacity-85 font-bold text-xs"
                                    style={{ backgroundColor: 'transparent', border: `1.5px solid ${C.cardBorder}`, color: C.textMuted, borderRadius: '8px' }}>
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {!setupData ? (
                        <div className="flex items-center justify-between p-4" style={{ backgroundColor: C.innerBg, borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}>
                            <div>
                                <span style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, display: 'block' }}>2FA is Disabled</span>
                                <span style={{ fontSize: T.size.xs, color: C.textMuted, display: 'block', marginTop: '2px' }}>Increase security by requiring authentication codes.</span>
                            </div>
                            <button onClick={handleInitiate} disabled={loading}
                                className="px-4 h-9 cursor-pointer transition-opacity hover:opacity-85 border-none font-bold text-xs text-white"
                                style={{ backgroundColor: C.btnPrimary, borderRadius: '8px', boxShadow: S.btn }}>
                                {loading ? 'Initializing...' : 'Enable 2FA'}
                            </button>
                        </div>
                    ) : (
                        <div className="p-4 space-y-4" style={{ backgroundColor: C.innerBg, borderRadius: '10px', border: `1px solid ${C.cardBorder}` }}>
                            <div className="flex flex-col sm:flex-row gap-4 items-center">
                                <div style={{ backgroundColor: '#fff', padding: '8px', borderRadius: '10px', border: `1px solid ${C.cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <img src={setupData.qrCode} alt="2FA QR Code" style={{ width: '120px', height: '120px', objectFit: 'contain' }} />
                                </div>
                                <div className="flex-1 space-y-2 text-center sm:text-left">
                                    <span style={{ fontSize: T.size.sm, fontWeight: T.weight.bold, color: C.heading, display: 'block' }}>Scan QR Code</span>
                                    <p style={{ fontSize: T.size.xs, color: C.textMuted, margin: 0 }}>
                                        Scan with Google Authenticator or enter secret key manually:
                                    </p>
                                    <div style={{ backgroundColor: '#fff', border: `1px solid ${C.cardBorder}`, borderRadius: '6px', padding: '6px 10px', fontSize: '11px', fontFamily: 'monospace', wordBreak: 'break-all', userSelect: 'all', color: '#334155' }}>
                                        {setupData.secret}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1.5 max-w-sm">
                                <label style={{ fontSize: T.size.xs, fontWeight: T.weight.bold, color: C.textMuted }}>Enter 6-digit Code</label>
                                <div className="flex gap-3">
                                    <input
                                        type="text"
                                        placeholder="000000"
                                        maxLength={6}
                                        style={{
                                            backgroundColor: C.surfaceWhite,
                                            border: `1.5px solid ${C.cardBorder}`,
                                            borderRadius: '8px',
                                            color: C.heading,
                                            fontSize: T.size.sm,
                                            fontWeight: T.weight.semibold,
                                            padding: '8px 12px',
                                            outline: 'none',
                                            flex: 1
                                        }}
                                        value={otpCode}
                                        onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    />
                                    <button onClick={handleVerify} disabled={loading || otpCode.length !== 6}
                                        className="px-4 h-9 cursor-pointer transition-opacity hover:opacity-85 border-none font-bold text-xs text-white"
                                        style={{ backgroundColor: C.btnPrimary, borderRadius: '8px' }}>
                                        {loading ? 'Enabling...' : 'Verify'}
                                    </button>
                                    <button onClick={() => setSetupData(null)}
                                        className="px-3 h-9 cursor-pointer transition-opacity hover:opacity-85 font-bold text-xs"
                                        style={{ backgroundColor: 'transparent', border: `1.5px solid ${C.cardBorder}`, color: C.textMuted, borderRadius: '8px' }}>
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
