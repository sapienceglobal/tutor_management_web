'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Edit, Trash2, Eye, MoreVertical, TrendingUp, Users, PlayCircle, DollarSign, BookOpen, Settings, Filter, Grid, List, Star } from 'lucide-react';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

export default function MyCoursesPage() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [viewMode, setViewMode] = useState('grid');

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

    const handleDeleteCourse = async (courseId) => {
        if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) return;

        try {
            await api.delete(`/courses/${courseId}`);
            setCourses(prev => prev.filter(c => c._id !== courseId));
        } catch (error) {
            alert('Failed to delete course');
        }
    };

    const filteredCourses = courses.filter(course => {
        const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = filterStatus === 'all' ||
            (filterStatus === 'published' && course.status === 'published') ||
            (filterStatus === 'draft' && course.status !== 'published');
        return matchesSearch && matchesStatus;
    });

    const stats = {
        total: courses.length,
        published: courses.filter(c => c.status === 'published').length,
        draft: courses.filter(c => c.status !== 'published').length,
        totalStudents: courses.reduce((acc, c) => acc + (c.enrolledCount || 0), 0)
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600 font-medium">Loading your courses...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
            <div className="max-w-7xl mx-auto p-6 lg:p-8 space-y-8">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent mb-2">
                            My Courses
                        </h1>
                        <p className="text-slate-600 text-lg">Manage your courses and track their performance</p>
                    </div>
                    <Button
                        asChild
                        className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all duration-200 h-12 px-6"
                    >
                        <Link href="/tutor/courses/create" className="flex items-center gap-2">
                            <Plus className="w-5 h-5" />
                            Create New Course
                        </Link>
                    </Button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-500 to-blue-600">
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                                    <BookOpen className="w-6 h-6 text-white" />
                                </div>
                            </div>
                            <h3 className="text-4xl font-bold text-white mb-2">{stats.total}</h3>
                            <p className="text-blue-100 font-medium">Total Courses</p>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-emerald-500 to-emerald-600">
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                                    <TrendingUp className="w-6 h-6 text-white" />
                                </div>
                            </div>
                            <h3 className="text-4xl font-bold text-white mb-2">{stats.published}</h3>
                            <p className="text-emerald-100 font-medium">Published</p>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-amber-500 to-amber-600">
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                                    <Settings className="w-6 h-6 text-white" />
                                </div>
                            </div>
                            <h3 className="text-4xl font-bold text-white mb-2">{stats.draft}</h3>
                            <p className="text-amber-100 font-medium">Drafts</p>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-purple-500 to-purple-600">
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                                    <Users className="w-6 h-6 text-white" />
                                </div>
                            </div>
                            <h3 className="text-4xl font-bold text-white mb-2">{stats.totalStudents}</h3>
                            <p className="text-purple-100 font-medium">Total Students</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters & Search */}
                <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
                    <div className="flex flex-col lg:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <Input
                                placeholder="Search your courses..."
                                className="pl-12 h-12 bg-slate-50 border-slate-200 focus:bg-white"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
                            {['all', 'published', 'draft'].map(status => (
                                <button
                                    key={status}
                                    onClick={() => setFilterStatus(status)}
                                    className={`px-4 py-2 rounded-lg font-medium transition-all ${filterStatus === status
                                        ? 'bg-white text-indigo-600 shadow-sm'
                                        : 'text-slate-600 hover:text-slate-900'
                                        }`}
                                >
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'grid'
                                    ? 'bg-white text-indigo-600 shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900'
                                    }`}
                            >
                                <Grid className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'list'
                                    ? 'bg-white text-indigo-600 shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900'
                                    }`}
                            >
                                <List className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Courses Display */}
                {filteredCourses.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-300">
                        <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-full mx-auto mb-6 flex items-center justify-center">
                            <BookOpen className="h-10 w-10 text-indigo-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">
                            {searchQuery ? 'No courses found' : 'No courses created yet'}
                        </h3>
                        <p className="text-slate-600 mb-6 max-w-md mx-auto">
                            {searchQuery
                                ? 'Try adjusting your search terms'
                                : 'Start by creating your first course and share your knowledge with students worldwide'
                            }
                        </p>
                        <Button
                            asChild
                            className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 shadow-lg"
                        >
                            <Link href="/tutor/courses/create">
                                <Plus className="w-5 h-5 mr-2" />
                                Create Your First Course
                            </Link>
                        </Button>
                    </div>
                ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredCourses.map((course) => (
                            <Card key={course._id} className="group border-0 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden">
                                <div className="aspect-video relative overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900">
                                    <img
                                        src={course.thumbnail || 'https://via.placeholder.com/400x225'}
                                        alt={course.title}
                                        className="w-full h-full object-cover opacity-90 group-hover:scale-110 transition-transform duration-500"
                                    />
                                    <div className="absolute top-3 right-3">
                                        <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${course.status === 'published'
                                            ? 'bg-emerald-500 text-white'
                                            : 'bg-amber-500 text-white'
                                            }`}>
                                            {course.status === 'published' ? '● Published' : '● Draft'}
                                        </span>
                                    </div>
                                </div>

                                <CardContent className="p-6">
                                    <h3 className="font-bold text-lg text-slate-900 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                                        {course.title}
                                    </h3>

                                    <div className="flex items-center gap-4 mb-4 text-sm text-slate-600">
                                        <div className="flex items-center gap-1">
                                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                            <span className="font-medium">{course.rating?.toFixed(1) || '0.0'}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Users className="w-4 h-4" />
                                            <span>{course.enrolledCount || 0}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <PlayCircle className="w-4 h-4" />
                                            <span>{course.lessons?.length || 0}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-2xl font-bold text-slate-900">
                                            ₹{course.price || 0}
                                        </span>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button
                                            asChild
                                            size="sm"
                                            className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                                        >
                                            <Link href={`/tutor/courses/${course._id}`}>
                                                <Edit className="w-4 h-4 mr-1" />
                                                Manage
                                            </Link>
                                        </Button>
                                        <Button
                                            asChild
                                            size="sm"
                                            variant="outline"
                                            className="border-slate-200 hover:bg-slate-50"
                                        >
                                            <Link href={`/student/courses/${course._id}`}>
                                                <Eye className="w-4 h-4 mr-1" />
                                                Preview
                                            </Link>
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleDeleteCourse(course._id)}
                                            className="border-red-200 text-red-600 hover:bg-red-50"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredCourses.map((course) => (
                            <Card key={course._id} className="border-0 shadow-md hover:shadow-xl transition-all duration-300">
                                <CardContent className="p-6">
                                    <div className="flex gap-6">
                                        <img
                                            src={course.thumbnail || 'https://via.placeholder.com/200x112'}
                                            alt={course.title}
                                            className="w-48 h-28 object-cover rounded-lg shadow-md"
                                        />
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between mb-2">
                                                <div>
                                                    <h3 className="font-bold text-xl text-slate-900 mb-1">{course.title}</h3>
                                                    <div className="flex items-center gap-4 text-sm text-slate-600">
                                                        <span className="flex items-center gap-1">
                                                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                                            {course.rating?.toFixed(1) || '0.0'}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Users className="w-4 h-4" />
                                                            {course.enrolledCount || 0} students
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <PlayCircle className="w-4 h-4" />
                                                            {course.lessons?.length || 0} lessons
                                                        </span>
                                                    </div>
                                                </div>
                                                <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${course.status === 'published'
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : 'bg-amber-100 text-amber-700'
                                                    }`}>
                                                    {course.status === 'published' ? '● Published' : '● Draft'}
                                                </span>
                                            </div>

                                            <p className="text-slate-600 text-sm mb-4 line-clamp-2">
                                                {course.description}
                                            </p>

                                            <div className="flex items-center justify-between">
                                                <span className="text-2xl font-bold text-slate-900">
                                                    ₹{course.price || 0}
                                                </span>
                                                <div className="flex gap-2">
                                                    <Button
                                                        asChild
                                                        size="sm"
                                                        className="bg-indigo-600 hover:bg-indigo-700"
                                                    >
                                                        <Link href={`/tutor/courses/${course._id}`}>
                                                            <Edit className="w-4 h-4 mr-1" />
                                                            Manage
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        asChild
                                                        size="sm"
                                                        variant="outline"
                                                    >
                                                        <Link href={`/student/courses/${course._id}`}>
                                                            <Eye className="w-4 h-4 mr-1" />
                                                            Preview
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleDeleteCourse(course._id)}
                                                        className="border-red-200 text-red-600 hover:bg-red-50"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}