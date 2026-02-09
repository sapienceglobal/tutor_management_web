'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/axios';
import {
    Search,
    Star,
    MapPin,
    Award,
    ArrowRight,
    Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function FindTutorsPage() {
    const [tutors, setTutors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchTutors();
    }, []);

    const fetchTutors = async (search = '') => {
        setLoading(true);
        try {
            const query = search ? `?search=${search}` : '';
            const response = await api.get(`/tutors${query}`);
            if (response.data.success) {
                setTutors(response.data.tutors);
            }
        } catch (error) {
            console.error('Error fetching tutors:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchTutors(searchTerm);
    };

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Find a Tutor</h1>
                    <p className="text-gray-500 mt-2">Connect with expert tutors for 1-on-1 learning.</p>
                </div>

                <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-auto">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search by name or subject..."
                            className="pl-10 pr-4 py-2 border rounded-lg w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-primary/20"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button type="submit">Search</Button>
                </form>
            </div>

            {loading ? (
                <div className="text-center py-12">Loading tutors...</div>
            ) : tutors.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tutors.map(tutor => (
                        <div key={tutor._id} className="bg-white rounded-2xl border hover:shadow-lg transition-all overflow-hidden group">
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-full bg-gray-100 overflow-hidden">
                                            {tutor.userId?.profileImage ? (
                                                <img src={tutor.userId.profileImage} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-xl font-bold text-gray-400">
                                                    {tutor.userId?.name?.[0] || 'T'}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-gray-900 line-clamp-1">{tutor.userId?.name}</h3>
                                            <p className="text-sm text-indigo-600 font-medium">{tutor.categoryId?.name || 'General Tutor'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg">
                                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                        <span className="font-bold text-yellow-700">{tutor.rating || 'New'}</span>
                                    </div>
                                </div>

                                <p className="text-gray-600 text-sm line-clamp-2 mb-4 min-h-[40px]">
                                    {tutor.bio || 'No bio available.'}
                                </p>

                                <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
                                    <div className="flex items-center gap-1">
                                        <Award className="w-4 h-4" />
                                        <span>{tutor.experience} years exp</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <MapPin className="w-4 h-4" />
                                        <span>Online</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t">
                                    <div>
                                        <span className="text-xs text-gray-500 uppercase font-semibold">Hourly Rate</span>
                                        <p className="text-xl font-bold text-gray-900">₹{tutor.hourlyRate}</p>
                                    </div>
                                    <Link href={`/student/tutors/${tutor._id}`}>
                                        <Button className="group-hover:translate-x-1 transition-transform">
                                            Book Now <ArrowRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 border-2 border-dashed rounded-xl">
                    <p className="text-gray-500">No tutors found matching your search.</p>
                </div>
            )}
        </div>
    );
}
