'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, BookOpen, Brain, Zap } from 'lucide-react';
import AITutorRAG from '@/components/ai/AITutorRAG.jsx';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';

export default function AITutorPage() {
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [courses, setCourses] = useState([]);

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const response = await api.get('/api/enrollments/my-enrollments');
                const enrolledCourses = response.data.enrollments?.map(enrollment => ({
                    _id: enrollment.courseId._id,
                    title: enrollment.courseId.title,
                    description: enrollment.courseId.description,
                    thumbnail: enrollment.courseId.thumbnail
                })) || [];
                setCourses(enrolledCourses);
                
                if (enrolledCourses.length > 0) {
                    setSelectedCourse(enrolledCourses[0]._id);
                }
            } catch (error) {
                console.error('Error fetching courses:', error);
            }
        };
        
        fetchCourses();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.history.back()}
                                className="flex items-center gap-2"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back
                            </Button>
                            
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-linear-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                                    <Brain className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-lg font-semibold text-gray-900">AI Tutor</h1>
                                    <p className="text-sm text-gray-500">RAG-powered learning assistant</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <label className="text-sm font-medium text-gray-700">
                                Course:
                            </label>
                            <select
                                value={selectedCourse || ''}
                                onChange={(e) => setSelectedCourse(e.target.value)}
                                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">Select a course</option>
                                {courses.map((course) => (
                                    <option key={course._id} value={course._id}>
                                        {course.title}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {selectedCourse ? (
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        <div className="lg:col-span-3">
                            <AITutorRAG courseId={selectedCourse} />
                        </div>

                        <div className="space-y-6">
                            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <BookOpen className="w-4 h-4" />
                                    Current Course
                                </h3>
                                {courses.find(c => c._id === selectedCourse) && (
                                    <div className="space-y-3">
                                        <div>
                                            <h4 className="font-medium text-gray-900">
                                                {courses.find(c => c._id === selectedCourse).title}
                                            </h4>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {courses.find(c => c._id === selectedCourse).description}
                                            </p>
                                        </div>
                                        {courses.find(c => c._id === selectedCourse).thumbnail && (
                                            <img
                                                src={courses.find(c => c._id === selectedCourse).thumbnail}
                                                alt="Course thumbnail"
                                                className="w-full h-32 object-cover rounded-lg"
                                            />
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="bg-linear-to-br from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
                                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-blue-600" />
                                    RAG Features
                                </h3>
                                <ul className="space-y-2 text-sm text-gray-700">
                                    <li className="flex items-start gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 shrink-0"></span>
                                        <span>Context-aware answers from your course materials</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 shrink-0"></span>
                                        <span>Accurate citations to source materials</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 shrink-0"></span>
                                        <span>Search through PDFs, documents, and notes</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 shrink-0"></span>
                                        <span>Similarity scoring for relevance</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="bg-amber-50 rounded-xl p-6 border border-amber-200">
                                <h3 className="font-semibold text-gray-900 mb-3">How to Use</h3>
                                <ol className="space-y-2 text-sm text-gray-700">
                                    <li className="flex gap-2">
                                        <span className="font-semibold text-amber-600">1.</span>
                                        <span>Select your course from dropdown</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="font-semibold text-amber-600">2.</span>
                                        <span>Ask questions about course content</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="font-semibold text-amber-600">3.</span>
                                        <span>View citations to see source materials</span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="font-semibold text-amber-600">4.</span>
                                        <span>Click citations to see detailed context</span>
                                    </li>
                                </ol>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            Select a Course to Start
                        </h2>
                        <p className="text-gray-600 max-w-md mx-auto">
                            Choose one of your enrolled courses to begin interacting with RAG-powered AI Tutor.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
