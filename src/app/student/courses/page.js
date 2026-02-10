'use client';

import { useEffect, useState } from 'react';
import { Search, Filter, Star, TrendingUp, BookOpen, Users, Clock, Grid, List, SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import api from '@/lib/axios';
import { Input } from '@/components/ui/input';
import { CourseCard } from '@/components/courses/CourseCard';
import { Button } from '@/components/ui/button';

export default function CoursesPage() {
    const [courses, setCourses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedLevel, setSelectedLevel] = useState('all');
    const [sortBy, setSortBy] = useState('popular');
    const [viewMode, setViewMode] = useState('grid');
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [coursesRes, categoriesRes] = await Promise.all([
                api.get('/courses'),
                api.get('/categories')
            ]);

            if (coursesRes.data.success) {
                setCourses(coursesRes.data.courses);
            }
            if (categoriesRes.data.success) {
                setCategories(categoriesRes.data.categories || []);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredCourses = courses
        .filter(course => {
            const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                course.description?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = selectedCategory === 'all' || course.categoryId?._id === selectedCategory;
            const matchesLevel = selectedLevel === 'all' || course.level === selectedLevel;
            return matchesSearch && matchesCategory && matchesLevel;
        })
        .sort((a, b) => {
            switch (sortBy) {
                case 'popular':
                    return (b.enrolledCount || 0) - (a.enrolledCount || 0);
                case 'rating':
                    return (b.rating || 0) - (a.rating || 0);
                case 'newest':
                    return new Date(b.createdAt) - new Date(a.createdAt);
                case 'price-low':
                    return (a.price || 0) - (b.price || 0);
                case 'price-high':
                    return (b.price || 0) - (a.price || 0);
                default:
                    return 0;
            }
        });

    const activeFiltersCount = [selectedCategory !== 'all', selectedLevel !== 'all'].filter(Boolean).length;

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600 font-medium">Loading courses...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
            <div className="max-w-7xl mx-auto p-6 lg:p-8 space-y-8">
                {/* Header */}
                <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl shadow-2xl p-8 lg:p-12">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30"></div>
                    <div className="relative">
                        <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
                            Discover Your Next Skill
                        </h1>
                        <p className="text-indigo-100 text-lg lg:text-xl max-w-2xl">
                            Explore expert-led courses and unlock your potential with hands-on learning experiences
                        </p>
                    </div>
                </div>

                {/* Search & Filters Bar */}
                <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
                    <div className="flex flex-col lg:flex-row gap-4">
                        {/* Search */}
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <Input
                                placeholder="Search for courses, topics, or skills..."
                                className="pl-12 h-12 bg-slate-50 border-slate-200 focus:bg-white text-base"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* Filter Toggle Button */}
                        <Button
                            onClick={() => setShowFilters(!showFilters)}
                            variant="outline"
                            className="h-12 px-6 border-slate-200 hover:bg-slate-50 relative"
                        >
                            <SlidersHorizontal className="w-5 h-5 mr-2" />
                            Filters
                            {activeFiltersCount > 0 && (
                                <span className="absolute -top-2 -right-2 w-6 h-6 bg-indigo-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                    {activeFiltersCount}
                                </span>
                            )}
                        </Button>

                        {/* View Toggle */}
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

                    {/* Expandable Filters */}
                    {showFilters && (
                        <div className="mt-6 pt-6 border-t border-slate-200 space-y-4 animate-in slide-in-from-top duration-200">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Category Filter */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Category
                                    </label>
                                    <select
                                        value={selectedCategory}
                                        onChange={(e) => setSelectedCategory(e.target.value)}
                                        className="w-full h-11 px-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                                    >
                                        <option value="all">All Categories</option>
                                        {categories.map(cat => (
                                            <option key={cat._id} value={cat._id}>
                                                {cat.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Level Filter */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Level
                                    </label>
                                    <select
                                        value={selectedLevel}
                                        onChange={(e) => setSelectedLevel(e.target.value)}
                                        className="w-full h-11 px-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                                    >
                                        <option value="all">All Levels</option>
                                        <option value="beginner">Beginner</option>
                                        <option value="intermediate">Intermediate</option>
                                        <option value="advanced">Advanced</option>
                                    </select>
                                </div>

                                {/* Sort By */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Sort By
                                    </label>
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="w-full h-11 px-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                                    >
                                        <option value="popular">Most Popular</option>
                                        <option value="rating">Highest Rated</option>
                                        <option value="newest">Newest First</option>
                                        <option value="price-low">Price: Low to High</option>
                                        <option value="price-high">Price: High to Low</option>
                                    </select>
                                </div>
                            </div>

                            {/* Clear Filters */}
                            {activeFiltersCount > 0 && (
                                <div className="flex justify-end">
                                    <button
                                        onClick={() => {
                                            setSelectedCategory('all');
                                            setSelectedLevel('all');
                                        }}
                                        className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-2"
                                    >
                                        <X className="w-4 h-4" />
                                        Clear all filters
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Results Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">
                            {filteredCourses.length} {filteredCourses.length === 1 ? 'Course' : 'Courses'}
                        </h2>
                        <p className="text-slate-600 mt-1">
                            {searchQuery && `Results for "${searchQuery}"`}
                            {selectedCategory !== 'all' && ` in ${categories.find(c => c._id === selectedCategory)?.name}`}
                        </p>
                    </div>
                </div>

                {/* Courses Grid/List */}
                {filteredCourses.length > 0 ? (
                    <div className={viewMode === 'grid'
                        ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                        : 'space-y-4'
                    }>
                        {filteredCourses.map((course) => (
                            <CourseCard
                                key={course._id}
                                course={course}
                                viewMode={viewMode}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-300">
                        <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full mx-auto mb-6 flex items-center justify-center">
                            <Search className="h-10 w-10 text-slate-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">No courses found</h3>
                        <p className="text-slate-600 mb-6">
                            Try adjusting your search or filters to find what you're looking for
                        </p>
                        <Button
                            onClick={() => {
                                setSearchQuery('');
                                setSelectedCategory('all');
                                setSelectedLevel('all');
                            }}
                            className="bg-indigo-600 hover:bg-indigo-700"
                        >
                            Clear all filters
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}