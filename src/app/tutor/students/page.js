'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Search, Mail, BookOpen, Calendar, MoreVertical, User } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

export default function TutorStudentsPage() {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [courseFilter, setCourseFilter] = useState('all');
    const [courses, setCourses] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            // In a real scenario, we might need a dedicated endpoint like /api/tutor/students
            // For now, let's try to fetch courses and then potentially aggregate or use a new endpoint.
            // Assuming we have an endpoint or we mock it for now until backend is ready.

            // Strategy: Fetch my courses first to populate filter
            const coursesRes = await api.get('/courses/my-courses');

            if (coursesRes.data.success) {
                setCourses(coursesRes.data.courses);
            }

            // Correct endpoint based on backend route structure: /api/tutor/dashboard/students
            const studentsRes = await api.get('/tutor/dashboard/students');

            if (studentsRes.data.success) {
                // Backend returns: { success: true, totalStudents, students: [...], byCourse: [...] }
                // We use the 'students' array which contains the list of unique students
                setStudents(studentsRes.data.students);
            } else {
                // Fallback or empty if not successful
                setStudents([]);
            }

        } catch (error) {
            console.error('Error fetching students:', error);
            // If API fails (e.g. 404), we keep students empty for now
            // In a real app, we'd show an error or a "feature coming soon" state if backend missing
            setStudents([]);
        } finally {
            setLoading(false);
        }
    };

    // Derived state for filtering
    const filteredStudents = students.filter(student => {
        const matchesSearch =
            student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.email.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCourse = courseFilter === 'all' ||
            student.enrolledCourses.some(c => c.courseId === courseFilter);

        return matchesSearch && matchesCourse;
    });

    // Stats
    const totalStudents = students.length;
    // Mocking active calculation for now
    const activeStudents = students.filter(s => s.lastActive && new Date(s.lastActive) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length;

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading students...</div>;
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">My Students</h1>
                <p className="text-gray-500 mt-2">Manage and monitor student progress across your courses.</p>
            </div>

            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                        <User className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalStudents}</div>
                        <p className="text-xs text-muted-foreground">Across all courses</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Learners</CardTitle>
                        <User className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeStudents}</div>
                        <p className="text-xs text-muted-foreground">Active in last 7 days</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Courses</CardTitle>
                        <BookOpen className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{courses.length}</div>
                        <p className="text-xs text-muted-foreground">Active courses</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters and Search */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                            placeholder="Search by name or email..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Select value={courseFilter} onValueChange={setCourseFilter}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filter by Course" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Courses</SelectItem>
                            {courses.map(course => (
                                <SelectItem key={course._id} value={course._id}>
                                    {course.title}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <Button variant="outline">
                    Export CSV
                </Button>
            </div>

            {/* Students Table */}
            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Student</TableHead>
                            <TableHead>Enrolled Courses</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead>Progress</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredStudents.length > 0 ? (
                            filteredStudents.map((student) => (
                                <TableRow key={student._id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold">
                                                {student.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-900">{student.name}</div>
                                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                                    <Mail className="w-3 h-3" />
                                                    {student.email}
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {student.enrolledCourses?.map((ec, idx) => (
                                                <Badge key={idx} variant="secondary" className="text-xs">
                                                    {ec.title}
                                                </Badge>
                                            )) || <span className="text-gray-400 text-sm">None</span>}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-gray-500 text-sm">
                                            <Calendar className="w-4 h-4" />
                                            {format(new Date(student.joinedAt || Date.now()), 'MMM d, yyyy')}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="w-full max-w-[100px]">
                                            <div className="flex justify-between text-xs mb-1">
                                                <span>{student.averageProgress || 0}%</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-blue-600 rounded-full"
                                                    style={{ width: `${student.averageProgress || 0}%` }}
                                                />
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon">
                                            <MoreVertical className="w-4 h-4 text-gray-500" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-gray-500">
                                    {students.length === 0 ? "No students found." : "No matching students."}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
