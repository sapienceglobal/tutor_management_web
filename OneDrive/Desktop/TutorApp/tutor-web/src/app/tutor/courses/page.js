'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, MoreVertical, Edit, Trash2, Eye } from 'lucide-react';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export default function MyCoursesPage() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchMyCourses();
    }, []);

    const fetchMyCourses = async () => {
        try {
            const response = await api.get('/courses/my-courses');
            if (response.data.success) {
                setCourses(response.data.courses);
            }
        } catch (error) {
            console.error('Error fetching courses:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredCourses = courses.filter(course =>
        course.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">My Courses</h1>
                    <p className="text-gray-500 mt-1">Manage your courses and content.</p>
                </div>
                <Link href="/tutor/courses/create">
                    <Button className="shadow-lg shadow-primary/20">
                        <Plus className="w-4 h-4 mr-2" />
                        Create New Course
                    </Button>
                </Link>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 bg-white p-4 rounded-lg border shadow-sm">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search your courses..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Courses List */}
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <div className="grid grid-cols-12 gap-4 p-4 border-b bg-gray-50/50 text-sm font-medium text-gray-500">
                    <div className="col-span-6">Course</div>
                    <div className="col-span-2 text-center">Price</div>
                    <div className="col-span-2 text-center">Status</div>
                    <div className="col-span-2 text-right">Actions</div>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-gray-500">Loading courses...</div>
                ) : filteredCourses.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="mx-auto h-12 w-12 text-gray-300 mb-3">
                            <Plus className="h-full w-full" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">No courses created yet</h3>
                        <p className="text-gray-500 mt-1 mb-4">Start by creating your first course.</p>
                        <Link href="/tutor/courses/create">
                            <Button variant="outline">Create Course</Button>
                        </Link>
                    </div>
                ) : (
                    <div className="divide-y">
                        {filteredCourses.map((course) => (
                            <div key={course._id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-gray-50 transition-colors">
                                <div className="col-span-6 flex gap-4">
                                    <img
                                        src={course.thumbnail || 'https://via.placeholder.com/150'}
                                        alt=""
                                        className="w-16 h-10 object-cover rounded shadow-sm bg-gray-100"
                                    />
                                    <div>
                                        <h3 className="font-semibold text-gray-900 line-clamp-1">{course.title}</h3>
                                        <p className="text-xs text-gray-500">
                                            {course.lessons?.length || 0} lessons • {course.enrolledCount} students
                                        </p>
                                    </div>
                                </div>

                                <div className="col-span-2 text-center font-medium text-gray-700">
                                    {course.isFree ? <span className="text-green-600">Free</span> : `₹${course.price}`}
                                </div>

                                <div className="col-span-2 text-center">
                                    <Badge variant={course.isPublished ? 'success' : 'secondary'} className={course.isPublished ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-700"}>
                                        {course.isPublished ? 'Published' : 'Draft'}
                                    </Badge>
                                </div>

                                <div className="col-span-2 flex justify-end">
                                    {/* Replaced DropdownMenu with direct buttons for simplicity first, or ensure DropdownMenu is imported */}
                                    <div className="flex gap-2">
                                        <Link href={`/tutor/courses/${course._id}`}>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-500 hover:text-primary">
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                        <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-500 hover:text-red-600">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
