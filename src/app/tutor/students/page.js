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
import { Search, Mail, BookOpen, Calendar, User, ShieldBan, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import toast from 'react-hot-toast';
import { useConfirm } from '@/components/providers/ConfirmProvider';

export default function TutorStudentsPage() {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [courseFilter, setCourseFilter] = useState('all');
    const [courses, setCourses] = useState([]);
    const [blockingId, setBlockingId] = useState(null);
    const { confirmDialog } = useConfirm();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const coursesRes = await api.get('/courses/my-courses');
            if (coursesRes.data.success) {
                setCourses(coursesRes.data.courses);
            }

            const studentsRes = await api.get('/tutor/dashboard/students');
            if (studentsRes.data.success) {
                setStudents(studentsRes.data.students);
            } else {
                setStudents([]);
            }
        } catch (error) {
            console.error('Error fetching students:', error);
            setStudents([]);
        } finally {
            setLoading(false);
        }
    };

    const handleBlockStudent = async (studentId, studentName, isBlocked) => {
        const action = isBlocked ? 'unblock' : 'block';
        const confirmed = await confirmDialog(
            `${isBlocked ? 'Unblock' : 'Block'} Student`,
            `Are you sure you want to ${action} ${studentName}? ${!isBlocked ? 'This student will no longer see you as a tutor anywhere.' : 'This student will be able to see you again.'}`,
            { variant: isBlocked ? 'default' : 'destructive' }
        );
        if (!confirmed) return;

        try {
            setBlockingId(studentId);
            await api.post(`/tutor/dashboard/students/${studentId}/${action}`);
            toast.success(`Student ${action}ed successfully`);
            // Update local state
            setStudents(prev => prev.map(s =>
                s._id === studentId ? { ...s, isBlockedByTutor: !isBlocked } : s
            ));
        } catch (error) {
            toast.error(error.response?.data?.message || `Failed to ${action} student`);
        } finally {
            setBlockingId(null);
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
    const activeStudents = students.filter(s => s.lastActive && new Date(s.lastActive) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length;
    const blockedStudents = students.filter(s => s.isBlockedByTutor).length;

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
            <div className="grid gap-4 md:grid-cols-4">
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
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Blocked</CardTitle>
                        <ShieldBan className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{blockedStudents}</div>
                        <p className="text-xs text-muted-foreground">Students blocked by you</p>
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
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredStudents.length > 0 ? (
                            filteredStudents.map((student) => (
                                <TableRow key={student._id} className={student.isBlockedByTutor ? 'bg-red-50/50' : ''}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${student.isBlockedByTutor ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
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
                                    <TableCell>
                                        {student.isBlockedByTutor ? (
                                            <Badge variant="destructive" className="text-xs">Blocked</Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-xs text-green-700 border-green-300 bg-green-50">Active</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant={student.isBlockedByTutor ? "outline" : "destructive"}
                                            size="sm"
                                            disabled={blockingId === student._id}
                                            onClick={() => handleBlockStudent(student._id, student.name, student.isBlockedByTutor)}
                                            className="gap-1.5"
                                        >
                                            {student.isBlockedByTutor ? (
                                                <><ShieldCheck className="w-3.5 h-3.5" /> Unblock</>
                                            ) : (
                                                <><ShieldBan className="w-3.5 h-3.5" /> Block</>
                                            )}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-gray-500">
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
