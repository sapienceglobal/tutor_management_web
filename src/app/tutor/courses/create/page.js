'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation'; // Correct import for App Router
import { ArrowLeft, Upload, Loader2, Save } from 'lucide-react';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

export default function CreateCoursePage() {
    const router = useRouter();
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
        duration: 0
    });

    useEffect(() => {
        fetchCategories();
    }, []);

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
                thumbnail: formData.thumbnail, // You can add a placeholder or implement file upload later
                language: formData.language,
                duration: Number(formData.duration)
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
