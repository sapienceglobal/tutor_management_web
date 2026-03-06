'use client';

import { useState } from 'react';
import { Link, Copy, Check, Users, UserPlus, Mail } from 'lucide-react';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'react-hot-toast';

export default function InstituteInviteGenerator({ instituteId, onInviteGenerated }) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [inviteLinks, setInviteLinks] = useState([]);
    const [formData, setFormData] = useState({
        roleInInstitute: 'student',
        email: '',
        permissions: {
            canCreateCourses: false,
            canCreateExams: false,
            canViewAnalytics: false
        }
    });

    const roles = [
        { value: 'student', label: 'Student', icon: Users, color: 'blue' },
        { value: 'tutor', label: 'Tutor', icon: UserPlus, color: 'purple' },
        { value: 'admin', label: 'Admin', icon: Mail, color: 'green' }
    ];

    const handleGenerateInvite = async (e) => {
        e.preventDefault();
        setIsGenerating(true);

        try {
            const response = await api.post('/membership/generate-invite', {
                instituteId,
                roleInInstitute: formData.roleInInstitute,
                email: formData.email || undefined,
                permissions: formData.permissions
            });

            if (response.data.success) {
                const newInvite = response.data.invite;
                const inviteUrl = `${window.location.origin}/join/invite?token=${newInvite.inviteToken}`;
                
                setInviteLinks(prev => [...prev, {
                    ...newInvite,
                    url: inviteUrl,
                    copied: false
                }]);

                // Reset form
                setFormData({
                    roleInInstitute: 'student',
                    email: '',
                    permissions: {
                        canCreateCourses: false,
                        canCreateExams: false,
                        canViewAnalytics: false
                    }
                });

                toast.success('Invite generated successfully!');
                onInviteGenerated?.(newInvite);
            }
        } catch (error) {
            console.error('Generate invite error:', error);
            toast.error(error.response?.data?.message || 'Failed to generate invite');
        } finally {
            setIsGenerating(false);
        }
    };

    const copyToClipboard = async (url, index) => {
        try {
            await navigator.clipboard.writeText(url);
            setInviteLinks(prev => prev.map((link, i) => 
                i === index ? { ...link, copied: true } : link
            ));
            
            setTimeout(() => {
                setInviteLinks(prev => prev.map((link, i) => 
                    i === index ? { ...link, copied: false } : link
                ));
            }, 2000);
            
            toast.success('Invite link copied!');
        } catch (error) {
            toast.error('Failed to copy link');
        }
    };

    const handlePermissionChange = (permission, value) => {
        setFormData(prev => ({
            ...prev,
            permissions: {
                ...prev.permissions,
                [permission]: value
            }
        }));
    };

    return (
        <div className="space-y-6">
            {/* Invite Generation Form */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <UserPlus className="w-5 h-5" />
                        Generate Institute Invite
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleGenerateInvite} className="space-y-4">
                        {/* Role Selection */}
                        <div className="space-y-2">
                            <Label>Invite Role</Label>
                            <div className="grid grid-cols-3 gap-2">
                                {roles.map((role) => {
                                    const Icon = role.icon;
                                    return (
                                        <button
                                            key={role.value}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, roleInInstitute: role.value }))}
                                            className={`p-3 rounded-lg border-2 transition-all ${
                                                formData.roleInInstitute === role.value
                                                    ? `border-${role.color}-500 bg-${role.color}-50`
                                                    : 'border-slate-200 hover:border-slate-300'
                                            }`}
                                        >
                                            <Icon className={`w-4 h-4 mx-auto mb-1 text-${role.color}-600`} />
                                            <span className="text-xs font-medium">{role.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Email (Optional) */}
                        <div className="space-y-2">
                            <Label htmlFor="email">Email (Optional)</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="user@example.com"
                                value={formData.email}
                                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                            />
                            <p className="text-xs text-slate-500">
                                Leave empty to generate a public invite link
                            </p>
                        </div>

                        {/* Permissions (for tutors/admins) */}
                        {(formData.roleInInstitute === 'tutor' || formData.roleInInstitute === 'admin') && (
                            <div className="space-y-3">
                                <Label>Permissions</Label>
                                <div className="space-y-2">
                                    {formData.roleInInstitute === 'tutor' && (
                                        <>
                                            <label className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.permissions.canCreateCourses}
                                                    onChange={(e) => handlePermissionChange('canCreateCourses', e.target.checked)}
                                                    className="rounded"
                                                />
                                                <span className="text-sm">Can Create Courses</span>
                                            </label>
                                            <label className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.permissions.canCreateExams}
                                                    onChange={(e) => handlePermissionChange('canCreateExams', e.target.checked)}
                                                    className="rounded"
                                                />
                                                <span className="text-sm">Can Create Exams</span>
                                            </label>
                                        </>
                                    )}
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={formData.permissions.canViewAnalytics}
                                            onChange={(e) => handlePermissionChange('canViewAnalytics', e.target.checked)}
                                            className="rounded"
                                        />
                                        <span className="text-sm">Can View Analytics</span>
                                    </label>
                                </div>
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isGenerating}
                        >
                            {isGenerating ? 'Generating...' : 'Generate Invite Link'}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Generated Invites */}
            {inviteLinks.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Generated Invites</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {inviteLinks.map((invite, index) => (
                                <div key={invite._id} className="p-3 border rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium capitalize">
                                                {invite.roleInInstitute}
                                            </span>
                                            {invite.email && (
                                                <span className="text-xs text-slate-500">
                                                    ({invite.email})
                                                </span>
                                            )}
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded-full ${
                                            invite.status === 'pending' 
                                                ? 'bg-yellow-100 text-yellow-700'
                                                : 'bg-green-100 text-green-700'
                                        }`}>
                                            {invite.status}
                                        </span>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                        <Input
                                            value={invite.url}
                                            readOnly
                                            className="text-xs"
                                        />
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => copyToClipboard(invite.url, index)}
                                        >
                                            {invite.copied ? (
                                                <Check className="w-4 h-4" />
                                            ) : (
                                                <Copy className="w-4 h-4" />
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
