'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation'; // Correct import for App Router
import { ArrowLeft, Upload, Loader2, Save, Plus, X } from 'lucide-react';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import AudienceSelector from '@/components/shared/AudienceSelector';
import useInstitute from '@/hooks/useInstitute';

export default function CreateCoursePage() {
    const router = useRouter();
    const { institute } = useInstitute();
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([]);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        level: 'beginner',
        category: '', // This will map to categoryId
        thumbnail: '',
        language: 'English',
        duration: 0,
        visibility: 'institute', // 'institute' or 'public'
        audience: {
            scope: 'institute',
            instituteId: null,
            batchIds: [],
            studentIds: [],
        },
        whatYouWillLearn: [''],
        requirements: ['']
    });

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        setFormData((prev) => {
            const nextAudience = {
                ...prev.audience,
                instituteId: prev.audience?.instituteId || institute?._id || null,
            };
            return {
                ...prev,
                audience: nextAudience,
                visibility: nextAudience.scope === 'global' ? 'public' : 'institute',
            };
        });
    }, [institute?._id]);

    const fetchCategories = async () => {
        try {
            const response = await api.get('/categories');
            if (response.data.success) {
                // Ensure we always have an array
                setCategories(response.data.categories || response.data.data || []);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.title || !formData.description || !formData.category || !formData.price) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            setLoading(true);
            // Map formData to API expected format
            const payload = {
                title: formData.title,
                description: formData.description,
                price: Number(formData.price),
                level: formData.level,
                categoryId: formData.category,
                thumbnail: formData.thumbnail,
                language: formData.language,
                duration: Number(formData.duration),
                visibility: formData.audience?.scope === 'global' ? 'public' : 'institute',
                audience: {
                    ...formData.audience,
                    instituteId: formData.audience?.instituteId || institute?._id || null,
                },
                scope: formData.audience?.scope,
                whatYouWillLearn: formData.whatYouWillLearn.filter(item => item.trim() !== ''),
                requirements: formData.requirements.filter(item => item.trim() !== '')
            };

            const response = await api.post('/courses', payload);

            if (response.data.success) {
                // Redirect to My Courses page on success
                router.push('/tutor/courses');
                router.refresh();
            }
        } catch (error) {
            console.error('Error creating course:', error);
            toast.error(error.response?.data?.message || 'Failed to create course');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/tutor/courses">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Create New Course</h1>
                    <p className="text-gray-500">Fill in the details to publish your course.</p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl border shadow-sm">
                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Basic Info */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold border-b pb-2">Basic Information</h3>

                        <div className="grid gap-2">
                            <Label htmlFor="title">Course Title *</Label>
                            <Input
                                id="title"
                                name="title"
                                placeholder="e.g. Complete Web Development Bootcamp"
                                value={formData.title}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="description">Description *</Label>
                            <Textarea
                                id="description"
                                name="description"
                                placeholder="Tell students what they will learn..."
                                className="h-32"
                                value={formData.description}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="category">Category *</Label>
                                <select
                                    id="category"
                                    name="category"
                                    className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={formData.category}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Select a category</option>
                                    {Array.isArray(categories) && categories.map(cat => (
                                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="level">Difficulty Level</Label>
                                <select
                                    id="level"
                                    name="level"
                                    className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={formData.level}
                                    onChange={handleChange}
                                >
                                    <option value="beginner">Beginner</option>
                                    <option value="intermediate">Intermediate</option>
                                    <option value="advanced">Advanced</option>
                                </select>
                            </div>

                            <div className="grid gap-2 md:col-span-2">
                                <AudienceSelector
                                    value={formData.audience}
                                    onChange={(audience) => setFormData((prev) => ({ ...prev, audience }))}
                                    availableBatches={[]}
                                    availableStudents={[]}
                                    allowGlobal={Boolean(!institute?._id || institute?.features?.allowGlobalPublishingByInstituteTutors)}
                                    instituteId={institute?._id || null}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Media & Pricing */}
                    <div className="space-y-4 pt-4">
                        <h3 className="text-lg font-semibold border-b pb-2">Pricing & Media</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="price">Price (₹) *</Label>
                                <Input
                                    id="price"
                                    name="price"
                                    type="number"
                                    placeholder="999"
                                    min="0"
                                    value={formData.price}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="thumbnail">Thumbnail URL</Label>
                                <Input
                                    id="thumbnail"
                                    name="thumbnail"
                                    placeholder="https://example.com/image.jpg"
                                    value={formData.thumbnail}
                                    onChange={handleChange}
                                />
                                <p className="text-xs text-muted-foreground">Paste an image URL for now.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="duration">Duration (minutes)</Label>
                                <Input
                                    id="duration"
                                    name="duration"
                                    type="number"
                                    placeholder="120"
                                    value={formData.duration}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="language">Language</Label>
                                <Input
                                    id="language"
                                    name="language"
                                    placeholder="English"
                                    value={formData.language}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    </div>

                    {/* What You'll Learn */}
                    <div className="space-y-4 pt-4">
                        <h3 className="text-lg font-semibold border-b pb-2">What Students Will Learn</h3>
                        <p className="text-xs text-muted-foreground">Add key learning outcomes. These appear on the course landing page.</p>
                        {formData.whatYouWillLearn.map((item, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <Input
                                    value={item}
                                    onChange={(e) => {
                                        const updated = [...formData.whatYouWillLearn];
                                        updated[index] = e.target.value;
                                        setFormData(prev => ({ ...prev, whatYouWillLearn: updated }));
                                    }}
                                    placeholder={`Learning outcome ${index + 1}`}
                                />
                                {formData.whatYouWillLearn.length > 1 && (
                                    <Button type="button" variant="ghost" size="icon" onClick={() => {
                                        const updated = formData.whatYouWillLearn.filter((_, i) => i !== index);
                                        setFormData(prev => ({ ...prev, whatYouWillLearn: updated }));
                                    }}>
                                        <X className="w-4 h-4 text-red-500" />
                                    </Button>
                                )}
                            </div>
                        ))}
                        <Button type="button" variant="outline" size="sm" onClick={() => {
                            setFormData(prev => ({ ...prev, whatYouWillLearn: [...prev.whatYouWillLearn, ''] }));
                        }}>
                            <Plus className="w-4 h-4 mr-2" /> Add Learning Outcome
                        </Button>
                    </div>

                    {/* Requirements */}
                    <div className="space-y-4 pt-4">
                        <h3 className="text-lg font-semibold border-b pb-2">Prerequisites & Requirements</h3>
                        <p className="text-xs text-muted-foreground">What should students know before enrolling?</p>
                        {formData.requirements.map((item, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <Input
                                    value={item}
                                    onChange={(e) => {
                                        const updated = [...formData.requirements];
                                        updated[index] = e.target.value;
                                        setFormData(prev => ({ ...prev, requirements: updated }));
                                    }}
                                    placeholder={`Requirement ${index + 1}`}
                                />
                                {formData.requirements.length > 1 && (
                                    <Button type="button" variant="ghost" size="icon" onClick={() => {
                                        const updated = formData.requirements.filter((_, i) => i !== index);
                                        setFormData(prev => ({ ...prev, requirements: updated }));
                                    }}>
                                        <X className="w-4 h-4 text-red-500" />
                                    </Button>
                                )}
                            </div>
                        ))}
                        <Button type="button" variant="outline" size="sm" onClick={() => {
                            setFormData(prev => ({ ...prev, requirements: [...prev.requirements, ''] }));
                        }}>
                            <Plus className="w-4 h-4 mr-2" /> Add Requirement
                        </Button>
                    </div>

                    <div className="pt-6 flex justify-end gap-3">
                        <Link href="/tutor/courses">
                            <Button type="button" variant="outline">Cancel</Button>
                        </Link>
                        <Button type="submit" disabled={loading} className="min-w-[150px]">
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Create Course
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
