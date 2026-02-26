'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Edit, Trash2, Eye, MoreVertical, TrendingUp, Users, PlayCircle, DollarSign, BookOpen, Settings, Filter, Grid, List, Star } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { useConfirm } from '@/components/providers/ConfirmProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

export default function MyCoursesPage() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [viewMode, setViewMode] = useState('grid');
    const { confirmDialog } = useConfirm();

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
        const isConfirmed = await confirmDialog("Delete Course", "Are you sure you want to delete this course? This action cannot be undone.", { variant: 'destructive' });
        if (!isConfirmed) return;

        try {
            await api.delete(`/courses/${courseId}`);
            setCourses(prev => prev.filter(c => c._id !== courseId));
            toast.success("Course deleted successfully");
        } catch (error) {
            toast.error('Failed to delete course');
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
        <div className="min-h-screen bg-slate-50 font-sans overflow-hidden">
            {/* 1. Hero Section (Bizdire Style) */}
            <div className="relative bg-[#0F172A] pt-12 pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[url('/grid-pattern.svg')]"></div>
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
                
                <div className="relative max-w-7xl mx-auto z-10">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-2">
                                My <span className="text-orange-500">Courses</span>
                            </h1>
                            <p className="text-lg text-slate-300">Manage your courses, lectures, and track performance</p>
                        </div>
                        <Button
                            asChild
                            className="bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/30 hover:shadow-xl transition-all duration-300 h-14 px-8 rounded-xl font-bold text-lg"
                        >
                            <Link href="/tutor/courses/create" className="flex items-center gap-2">
                                <Plus className="w-5 h-5" />
                                Create New Course
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>

            {/* 2. Stats & Overview (Overlapping Cards) */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-20 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Stat Card 1 */}
                    <div className="bg-white p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 text-center flex flex-col items-center group cursor-default">
                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                            <BookOpen className="w-8 h-8 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mb-1">Total Courses</h3>
                        <span className="text-4xl font-black text-slate-800 group-hover:text-blue-600 transition-colors">{stats.total}</span>
                    </div>

                    {/* Stat Card 2 */}
                    <div className="bg-white p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 text-center flex flex-col items-center group cursor-default">
                        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                            <TrendingUp className="w-8 h-8 text-emerald-600" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mb-1">Published</h3>
                        <span className="text-4xl font-black text-slate-800 group-hover:text-emerald-600 transition-colors">{stats.published}</span>
                    </div>

                    {/* Stat Card 3 */}
                    <div className="bg-white p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 text-center flex flex-col items-center group cursor-default">
                        <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                            <Settings className="w-8 h-8 text-amber-600" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mb-1">Drafts</h3>
                        <span className="text-4xl font-black text-slate-800 group-hover:text-amber-600 transition-colors">{stats.draft}</span>
                    </div>

                    {/* Stat Card 4 */}
                    <div className="bg-white p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 text-center flex flex-col items-center group cursor-default">
                        <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                            <Users className="w-8 h-8 text-purple-600" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mb-1">Total Students</h3>
                        <span className="text-4xl font-black text-slate-800 group-hover:text-purple-600 transition-colors">{stats.totalStudents}</span>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-32 space-y-8">

                {/* Filters & Search */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-4">
                    <div className="flex flex-col lg:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <Input
                                placeholder="Search your courses..."
                                className="pl-12 h-14 bg-slate-50 border-slate-200 focus:bg-white rounded-2xl text-base"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="flex gap-2 bg-slate-50 border border-slate-100 p-1.5 rounded-2xl overflow-x-auto custom-scrollbar">
                            {['all', 'published', 'draft'].map(status => (
                                <button
                                    key={status}
                                    onClick={() => setFilterStatus(status)}
                                    className={`px-6 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap ${filterStatus === status
                                        ? 'bg-white text-orange-600 shadow-md border border-slate-100'
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                        }`}
                                >
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-2 bg-slate-50 border border-slate-100 p-1.5 rounded-2xl hidden md:flex">
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
                                <div className="aspect-video relative overflow-hidden bg-slate-100">
                                    <img
                                        src={course.thumbnail || 'https://via.placeholder.com/400x225'}
                                        alt={course.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-60"></div>
                                    <div className="absolute top-4 right-4">
                                        <span className={`px-3 py-1.5 rounded-lg text-xs font-bold backdrop-blur-md border ${
                                            course.status === 'published' ? 'bg-emerald-500/90 text-white border-emerald-400/50' :
                                            course.status === 'pending' ? 'bg-cyan-500/90 text-white border-cyan-400/50' :
                                            course.status === 'rejected' ? 'bg-red-500/90 text-white border-red-400/50' :
                                            course.status === 'suspended' ? 'bg-indigo-500/90 text-white border-indigo-400/50' :
                                            'bg-amber-500/90 text-white border-amber-400/50'
                                            }`}>
                                            {course.status === 'published' ? '● Published' : 
                                             course.status === 'pending' ? '● Pending Approval' :
                                             course.status === 'rejected' ? '● Rejected' :
                                             course.status === 'suspended' ? '● Suspended' :
                                             '● Draft'}
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
                                            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold h-10 shadow-sm transition-colors"
                                        >
                                            <Link href={`/tutor/courses/${course._id}`}>
                                                <Edit className="w-4 h-4 mr-2" />
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
                                                <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
                                                    course.status === 'published' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                                                    course.status === 'pending' ? 'bg-cyan-50 text-cyan-600 border-cyan-200' :
                                                    course.status === 'rejected' ? 'bg-red-50 text-red-600 border-red-200' :
                                                    course.status === 'suspended' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' :
                                                    'bg-amber-50 text-amber-600 border-amber-200'
                                                    }`}>
                                                    {course.status === 'published' ? '● Published' : 
                                                     course.status === 'pending' ? '● Pending' :
                                                     course.status === 'rejected' ? '● Rejected' :
                                                     course.status === 'suspended' ? '● Suspended' :
                                                     '● Draft'}
                                                </span>
                                            </div>

                                            <p className="text-slate-600 text-sm mb-4 line-clamp-2 leading-relaxed">
                                                {course.description}
                                            </p>

                                            <div className="flex items-center justify-between">
                                                <span className="text-2xl font-bold text-slate-900">
                                                    ₹{course.price || 0}
                                                </span>
                                                <div className="flex gap-2">
                                                    <Button
                                                        asChild
                                                        className="bg-orange-500 hover:bg-orange-600 text-white font-bold h-10 shadow-sm transition-colors"
                                                    >
                                                        <Link href={`/tutor/courses/${course._id}`}>
                                                            <Edit className="w-4 h-4 mr-2" />
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