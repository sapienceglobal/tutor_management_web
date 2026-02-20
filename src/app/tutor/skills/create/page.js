'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';

export default function CreateSkillPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name) {
            toast.error('Skill Name is required');
            return;
        }

        setLoading(true);
        try {
            const res = await api.post('/taxonomy/skills', formData);
            if (res.data.success) {
                toast.success('Skill created successfully!');
                router.push('/tutor/dashboard');
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to create skill');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/tutor/dashboard">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                    </Link>
                    <h1 className="text-2xl font-bold text-slate-800">Create New Skill</h1>
                </div>

                <Card>
                    <CardContent className="p-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label>Skill Name <span className="text-red-500">*</span></Label>
                                <Input
                                    placeholder="e.g. Critical Thinking, Algebraic Expressions"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Description (Optional)</Label>
                                <Textarea
                                    placeholder="Briefly describe this skill..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <Button type="submit" disabled={loading} className="w-full bg-[#3b0d46] hover:bg-[#2a0933]">
                                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                <Save className="w-4 h-4 mr-2" />
                                Create Skill
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
