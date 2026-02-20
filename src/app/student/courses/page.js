'use client';

import { useEffect, useState } from 'react';
import { Search, Filter, Star, TrendingUp, BookOpen, Users, Clock, Grid, List, SlidersHorizontal, X, ChevronDown, Sparkles } from 'lucide-react';
import api from '@/lib/axios';
import { Input } from '@/components/ui/input';
import { CourseCard } from '@/components/courses/CourseCard';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

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
            <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-medium animate-pulse">Loading amazing courses...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <div className="max-w-7xl mx-auto p-6 lg:p-8 space-y-8">
                {/* Premium Header */}
                <div className="relative overflow-hidden bg-white/60 backdrop-blur-3xl rounded-[2.5rem] p-8 lg:p-12 border border-white/50 shadow-xl shadow-indigo-100/50">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-indigo-500/10 via-purple-500/10 to-pink-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-4 border border-indigo-100">
                            <Sparkles className="w-3 h-3" />
                            Explore Library
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight leading-tight">
                            Unlock Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Potential</span>
                        </h1>
                        <p className="text-slate-600 text-lg lg:text-xl max-w-2xl leading-relaxed">
                            Dive into expert-led courses designed to elevate your skills. From coding to creative arts, find your passion today.
                        </p>
                    </div>
                </div>

                {/* Search & Filters Bar */}{/* Reusing existing logic but with better styling */} 
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200/60 p-2 pl-6 flex flex-col lg:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <input
                            placeholder="Search for courses..."
                            className="w-full h-12 bg-transparent border-none focus:ring-0 text-base placeholder:text-slate-400 text-slate-700 pl-8"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-2 w-full lg:w-auto p-1">
                        <Button
                            onClick={() => setShowFilters(!showFilters)}
                            variant="ghost"
                            className={`h-10 px-4 rounded-xl transition-all ${showFilters ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            <SlidersHorizontal className="w-4 h-4 mr-2" />
                            Filters
                            {activeFiltersCount > 0 && (
                                <span className="ml-2 w-5 h-5 bg-indigo-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                    {activeFiltersCount}
                                </span>
                            )}
                        </Button>

                        <div className="h-8 w-px bg-slate-200 mx-2 hidden lg:block"></div>

                        <div className="flex bg-slate-100/80 p-1 rounded-xl">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <Grid className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <List className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Expandable Filters */}
                <AnimatePresence>
                    {showFilters && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="bg-white rounded-[2rem] border border-slate-200/60 p-6 grid grid-cols-1 md:grid-cols-3 gap-6 shadow-sm">
                                {/* Category Filter */}
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Category</label>
                                    <select
                                        value={selectedCategory}
                                        onChange={(e) => setSelectedCategory(e.target.value)}
                                        className="w-full h-11 px-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50 hover:bg-white transition-colors cursor-pointer"
                                    >
                                        <option value="all">All Categories</option>
                                        {categories.map(cat => (
                                            <option key={cat._id} value={cat._id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Level</label>
                                    <select
                                        value={selectedLevel}
                                        onChange={(e) => setSelectedLevel(e.target.value)}
                                        className="w-full h-11 px-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50 hover:bg-white transition-colors cursor-pointer"
                                    >
                                        <option value="all">All Levels</option>
                                        <option value="beginner">Beginner</option>
                                        <option value="intermediate">Intermediate</option>
                                        <option value="advanced">Advanced</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Sort By</label>
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="w-full h-11 px-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50 hover:bg-white transition-colors cursor-pointer"
                                    >
                                        <option value="popular">Most Popular</option>
                                        <option value="rating">Highest Rated</option>
                                        <option value="newest">Newest First</option>
                                    </select>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Content Grid */}
                {filteredCourses.length > 0 ? (
                    <motion.div
                        layout
                        className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : 'space-y-4'}
                    >
                        <AnimatePresence>
                            {filteredCourses.map((course) => (
                                <motion.div
                                    key={course._id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <CourseCard course={course} viewMode={viewMode} />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                ) : (
                    <div className="text-center py-24">
                        <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Search className="h-10 w-10 text-indigo-300" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900">No courses found</h3>
                        <p className="text-slate-500 mt-2">Try adjusting your filters or search terms.</p>
                        <Button
                            onClick={() => {
                                setSearchQuery('');
                                setSelectedCategory('all');
                                setSelectedLevel('all');
                            }}
                            variant="link"
                            className="mt-4 text-indigo-600 font-semibold"
                        >
                            Clear all filters
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}