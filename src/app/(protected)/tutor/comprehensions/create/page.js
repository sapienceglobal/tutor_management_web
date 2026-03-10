'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Loader2, Save, Plus } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';

export default function CreateComprehensionPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        questions: [] // Currently empty, enhanced version would allow adding questions inline
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title || !formData.content) {
            toast.error('Title and Passage Content are required');
            return;
        }

        setLoading(true);
        try {
            const res = await api.post('/question-bank/comprehensions', formData);
            if (res.data.success) {
                toast.success('Comprehension passage created!');
                router.push('/tutor/dashboard');
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to create comprehension');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/tutor/dashboard">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                    </Link>
                    <h1 className="text-2xl font-bold text-slate-800">Create Comprehension</h1>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Left Column: Passage Editor */}
                    <div className="md:col-span-3 space-y-6">
                        <Card>
                            <CardContent className="p-6 space-y-6">
                                <div className="space-y-2">
                                    <Label>Passage Title <span className="text-red-500">*</span></Label>
                                    <Input
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="e.g. The Solar System"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Passage Content <span className="text-red-500">*</span></Label>
                                    <Textarea
                                        className="min-h-[300px]"
                                        value={formData.content}
                                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                        placeholder="Paste or type the comprehension passage here..."
                                    />
                                </div>

                                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100 text-sm text-yellow-800">
                                    Note: You can add questions to this comprehension after saving it from the Question Bank list.
                                </div>

                                <Button onClick={handleSubmit} disabled={loading} className="w-full bg-[#3b0d46] hover:bg-[#2a0933]">
                                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    <Save className="w-4 h-4 mr-2" />
                                    Save Passage
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
