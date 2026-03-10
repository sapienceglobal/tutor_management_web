'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Users, Calendar, Settings, Plus, Eye, Edit, Trash2, Crown, UserCheck } from 'lucide-react';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function TutorInstitutesPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [institutes, setInstitutes] = useState([]);
    const [currentInstitute, setCurrentInstitute] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchInstitutes();
    }, []);

    const fetchInstitutes = async () => {
        try {
            setLoading(true);
            const res = await api.get('/membership/my-institutes');
            if (res.data?.success) {
                setInstitutes(res.data.institutes || []);
                setCurrentInstitute(res.data.currentInstitute);
            }
        } catch (err) {
            setError('Failed to load institutes');
            console.error('Error fetching institutes:', err);
        } finally {
            setLoading(false);
        }
    };

    const switchInstitute = async (instituteId) => {
        try {
            const res = await api.post('/membership/switch-institute', { instituteId });
            if (res.data?.success) {
                setCurrentInstitute(res.data.currentInstitute);
                // Update local storage
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                user.currentInstitute = res.data.currentInstitute;
                localStorage.setItem('user', JSON.stringify(user));
                router.refresh();
            }
        } catch (err) {
            setError('Failed to switch institute');
            console.error('Error switching institute:', err);
        }
    };

    const generateInvite = async (instituteId, role) => {
        try {
            const res = await api.post('/membership/generate-invite', {
                instituteId,
                roleInInstitute: role,
                permissions: role === 'tutor' ? {
                    canCreateCourses: true,
                    canCreateExams: true,
                    canViewAnalytics: true,
                    canManageStudents: false
                } : {
                    canCreateCourses: false,
                    canCreateExams: false,
                    canViewAnalytics: false,
                    canManageStudents: false
                }
            });
            
            if (res.data?.success) {
                // Copy invite link to clipboard
                const inviteLink = `${window.location.origin}/join/invite/${res.data.inviteToken}`;
                await navigator.clipboard.writeText(inviteLink);
                alert('Invite link copied to clipboard!');
            }
        } catch (err) {
            setError('Failed to generate invite');
            console.error('Error generating invite:', err);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">My Institutes</h1>
                    <p className="text-gray-600">Manage your institute memberships and generate invites</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                        {error}
                    </div>
                )}

                {/* Current Institute */}
                {currentInstitute && (
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Current Institute</h2>
                        <Card className="p-6 border-indigo-200 bg-indigo-50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className="p-3 bg-indigo-100 rounded-lg">
                                        <Building2 className="h-6 w-6 text-indigo-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{currentInstitute.instituteId?.name}</h3>
                                        <p className="text-sm text-gray-600">Role: {currentInstitute.roleInInstitute}</p>
                                        <p className="text-sm text-gray-600">Status: {currentInstitute.status}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Crown className="h-5 w-5 text-indigo-600" />
                                    <span className="text-sm font-medium text-indigo-600">Active</span>
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                {/* All Institutes */}
                <div className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">All Institute Memberships</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {institutes.map((membership) => (
                            <Card  key={membership._id} className={`p-6 ${
                                currentInstitute?._id === membership._id 
                                    ? 'border-indigo-200 bg-indigo-50' 
                                    : 'border-gray-200 bg-white'
                            }`}>
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-2 bg-gray-100 rounded-lg">
                                        <Building2 className="h-5 w-5 text-gray-600" />
                                    </div>
                                    {currentInstitute?._id === membership._id && (
                                        <div className="flex items-center space-x-1">
                                            <Crown className="h-4 w-4 text-indigo-600" />
                                            <span className="text-xs font-medium text-indigo-600">Current</span>
                                        </div>
                                    )}
                                </div>
                                
                                <h3 className="font-semibold text-gray-900 mb-2">{membership.instituteId?.name}</h3>
                                <div className="space-y-1 text-sm text-gray-600 mb-4">
                                    <p>Role: <span className="font-medium">{membership.roleInInstitute}</span></p>
                                    <p>Status: <span className="font-medium">{membership.status}</span></p>
                                    <p>Joined: {new Date(membership.joinedAt).toLocaleDateString()}</p>
                                </div>

                                <div className="flex space-x-2">
                                    {currentInstitute?._id !== membership._id && (
                                        <Button
                                            onClick={() => switchInstitute(membership._id)}
                                            className="flex-1"
                                            variant="outline"
                                            size="sm"
                                        >
                                            Switch
                                        </Button>
                                    )}
                                    
                                    {membership.roleInInstitute === 'admin' && (
                                        <Button
                                            onClick={() => generateInvite(membership.instituteId._id, 'student')}
                                            className="flex-1"
                                            size="sm"
                                        >
                                            <Plus className="h-4 w-4 mr-1" />
                                            Invite Student
                                        </Button>
                                    )}
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Quick Actions */}
                <div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="p-4 border-gray-200">
                            <div className="flex items-center space-x-3">
                                <Users className="h-8 w-8 text-blue-600" />
                                <div>
                                    <h3 className="font-medium text-gray-900">View Members</h3>
                                    <p className="text-sm text-gray-600">See all institute members</p>
                                </div>
                            </div>
                        </Card>
                        
                        <Card className="p-4 border-gray-200">
                            <div className="flex items-center space-x-3">
                                <Calendar className="h-8 w-8 text-green-600" />
                                <div>
                                    <h3 className="font-medium text-gray-900">Schedule Classes</h3>
                                    <p className="text-sm text-gray-600">Manage live classes</p>
                                </div>
                            </div>
                        </Card>
                        
                        <Card className="p-4 border-gray-200">
                            <div className="flex items-center space-x-3">
                                <Settings className="h-8 w-8 text-purple-600" />
                                <div>
                                    <h3 className="font-medium text-gray-900">Institute Settings</h3>
                                    <p className="text-sm text-gray-600">Configure institute</p>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
