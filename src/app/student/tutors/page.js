'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    Search,
    Star,
    Award,
    MapPin,
    ArrowRight,
    ChevronDown,
    CheckCircle,
    BookOpen,
    Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import useInstitute from '@/hooks/useInstitute';
import api from '@/lib/axios';

const RATE_OPTIONS = [
    { label: 'Any rate', value: '' },
    { label: 'Under ₹500/hr', value: '500' },
    { label: 'Under ₹1000/hr', value: '1000' },
    { label: 'Under ₹2000/hr', value: '2000' },
];

export default function FindTutorsPage() {
    const [tutors, setTutors] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [maxRate, setMaxRate] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    // Industry-level multi-tenancy state
    const [myInstitutes, setMyInstitutes] = useState([]);
    const [currentInstitute, setCurrentInstitute] = useState(null);
    const [activeTab, setActiveTab] = useState('institute'); // 'institute' | 'global'

    useEffect(() => {
        fetchMembership();
        fetchCategories();
    }, []);

    const fetchMembership = async () => {
        try {
            const institutesRes = await api.get('/membership/my-institutes');
            if (institutesRes.data?.success) {
                setMyInstitutes(institutesRes.data.institutes || []);
                setCurrentInstitute(institutesRes.data.currentInstitute);
                if (!institutesRes.data.currentInstitute) {
                    setActiveTab('global');
                }
            }
        } catch (err) {
            console.warn('No institutes found, showing global view');
            setActiveTab('global');
        }
    };

    useEffect(() => {
        fetchTutors();
    }, [categoryId, maxRate, activeTab]);

    const fetchCategories = async () => {
        try {
            const res = await api.get('/categories');
            if (res.data.success) setCategories(res.data.categories || []);
        } catch (e) {
            console.error(e);
        }
    };

    const fetchTutors = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (searchTerm) params.set('search', searchTerm);
            if (categoryId) params.set('categoryId', categoryId);
            if (maxRate) params.set('maxRate', maxRate);
            if (activeTab) params.set('scope', activeTab);
            const res = await api.get(`/tutors?${params.toString()}`);
            if (res.data.success) setTutors(res.data.tutors || []);
        } catch (error) {
            console.error('Error fetching tutors:', error);
            setTutors([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchTutors();
    };

    const hasActiveFilters = categoryId || maxRate;

    return (
        <div className="min-h-screen bg-[#f0f2f8]">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-2xl font-bold text-slate-900">Find a Tutor</h1>
                        <p className="text-slate-600">Connect with verified tutors for 1-on-1 learning. Book a session that fits your schedule.</p>
                    </div>

                    {/* Institute Switcher */}
                    {myInstitutes.length > 0 && (
                        <div className="flex items-center gap-2 bg-white rounded-lg border border-slate-200 p-1 shrink-0">
                            <button
                                onClick={() => setActiveTab('institute')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'institute'
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                    }`}
                            >
                                My Institute
                            </button>
                            <button
                                onClick={() => setActiveTab('global')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'global'
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                    }`}
                            >
                                Global
                            </button>
                        </div>
                    )}
                </div>

                {/* Search + Filters */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by name or subject..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg bg-slate-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white text-slate-800 placeholder:text-slate-400"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                Search
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowFilters(!showFilters)}
                                className={`border-slate-200 ${showFilters ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : ''}`}
                            >
                                <Filter className="w-4 h-4 mr-2" />
                                Filters
                                {hasActiveFilters && (
                                    <span className="ml-1.5 w-5 h-5 bg-indigo-600 text-white text-xs font-bold rounded-full inline-flex items-center justify-center">
                                        {[categoryId, maxRate].filter(Boolean).length}
                                    </span>
                                )}
                            </Button>
                        </div>
                    </form>

                    {showFilters && (
                        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                                <select
                                    value={categoryId}
                                    onChange={(e) => setCategoryId(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">All categories</option>
                                    {categories.map((c) => (
                                        <option key={c._id} value={c._id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Max hourly rate</label>
                                <select
                                    value={maxRate}
                                    onChange={(e) => setMaxRate(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500"
                                >
                                    {RATE_OPTIONS.map((o) => (
                                        <option key={o.value || 'any'} value={o.value}>{o.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-end">
                                <Button variant="outline" onClick={() => { setCategoryId(''); setMaxRate(''); }} className="border-slate-200">
                                    Clear filters
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Results */}
                {loading ? (
                    <div className="flex justify-center py-16">
                        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : tutors.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {tutors.map((tutor) => (
                            <div
                                key={tutor._id}
                                className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md hover:border-indigo-100 transition-all flex flex-col"
                            >
                                <div className="p-6 flex-1 flex flex-col">
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-slate-100 shrink-0 bg-slate-100">
                                            {tutor.userId?.profileImage ? (
                                                <img src={tutor.userId.profileImage} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-slate-400">
                                                    {tutor.userId?.name?.[0] || 'T'}
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between gap-2 flex-wrap">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-bold text-slate-900 truncate">{tutor.userId?.name || 'Tutor'}</h3>
                                                    {tutor.isVerified && (
                                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-xs font-medium">
                                                            <CheckCircle className="w-3.5 h-3.5" /> Verified
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center flex-wrap gap-2 mt-0.5">
                                                <p className="text-sm font-medium text-indigo-600">{tutor.categoryId?.name || 'Expert'}</p>
                                                {tutor.instituteId && (
                                                    <span className="inline-block px-2 py-0.5 bg-purple-50 text-purple-700 text-[10px] font-bold uppercase tracking-wider rounded-full border border-purple-100">
                                                        {tutor.instituteId.name || 'Institute Tutor'}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1.5 mt-2">
                                                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                                <span className="font-semibold text-slate-800">{tutor.rating?.toFixed(1) || 'New'}</span>
                                                <span className="text-slate-500 text-sm">({tutor.reviewCount || 0})</span>
                                            </div>
                                        </div>
                                    </div>

                                    <p className="text-slate-600 text-sm line-clamp-2 mb-4 min-h-[40px]">
                                        {tutor.bio || 'Expert tutor ready to help you achieve your goals.'}
                                    </p>

                                    <div className="flex flex-wrap gap-3 text-sm text-slate-500 mb-4">
                                        <span className="flex items-center gap-1.5">
                                            <Award className="w-4 h-4 text-indigo-500" />
                                            {tutor.experience || 0} yrs exp
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <BookOpen className="w-4 h-4 text-indigo-500" />
                                            {tutor.studentsCount || 0} students
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <MapPin className="w-4 h-4 text-slate-400" />
                                            {tutor.location || 'Online'}
                                        </span>
                                    </div>

                                    <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                                        <div>
                                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Hourly rate</p>
                                            <p className="text-xl font-bold text-slate-900">₹{tutor.hourlyRate ?? 0}</p>
                                        </div>
                                        <Link href={`/student/tutors/${tutor._id}`} className="shrink-0">
                                            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5">
                                                Book session
                                                <ArrowRight className="w-4 h-4" />
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                        <Search className="w-14 h-14 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-slate-800 mb-2">No tutors found</h3>
                        <p className="text-slate-500 mb-4">Try adjusting your search or filters.</p>
                        <Button variant="outline" onClick={() => { setSearchTerm(''); setCategoryId(''); setMaxRate(''); fetchTutors(); }}>
                            Clear all
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
