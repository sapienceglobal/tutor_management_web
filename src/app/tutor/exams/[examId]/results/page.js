'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import {
    ArrowLeft,
    Trophy,
    Users,
    CheckCircle,
    XCircle,
    Clock,
    Search,
    Download
} from 'lucide-react';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

export default function ExamResultsPage({ params }) {
    // Unwrap params using React.use() (Next.js 15/16+)
    const { examId } = use(params);

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get(`/exams/${examId}/all-attempts`);
                if (res.data.success) {
                    setData(res.data);
                }
            } catch (error) {
                console.error('Error fetching results:', error);
            } finally {
                setLoading(false);
            }
        };

        if (examId) {
            fetchData();
        }
    }, [examId]);

    const filteredStudents = data?.attempts.filter(item =>
        item.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.student.email.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-xl font-bold text-red-500">Error loading results</h2>
                <Button variant="link" asChild className="mt-4">
                    <Link href="/tutor/exams">Go Back</Link>
                </Button>
            </div>
        );
    }

    const { exam, overallStats } = data;

    return (
        <div className="space-y-8 p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                        <Link href="/tutor/exams" className="hover:text-primary transition-colors flex items-center gap-1">
                            <ArrowLeft className="w-4 h-4" />
                            Back to Exams
                        </Link>
                        <span>/</span>
                        <span>Results</span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">{exam.title}</h1>
                    <p className="text-gray-500">Performance Overview & Student Results</p>
                </div>
                <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                        <Trophy className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{overallStats.averageScore}%</div>
                        <p className="text-xs text-muted-foreground">Class average</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{overallStats.passRate}%</div>
                        <p className="text-xs text-muted-foreground">{overallStats.passedCount} students passed</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
                        <Clock className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{overallStats.totalAttempts}</div>
                        <p className="text-xs text-muted-foreground">Across {overallStats.uniqueStudents} students</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Unique Students</CardTitle>
                        <Users className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{overallStats.uniqueStudents}</div>
                        <p className="text-xs text-muted-foreground">Participated</p>
                    </CardContent>
                </Card>
            </div>

            {/* Students List */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Student Performance</h2>
                    <div className="relative w-64">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                            placeholder="Search student..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="rounded-md border bg-white">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Student</TableHead>
                                <TableHead>Attempts</TableHead>
                                <TableHead>Best Score</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredStudents.length > 0 ? (
                                filteredStudents.map((item) => (
                                    <TableRow key={item.student._id}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{item.student.name}</span>
                                                <span className="text-xs text-gray-500">{item.student.email}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{item.totalAttempts}</TableCell>
                                        <TableCell>
                                            <span className="font-bold">{item.bestScore}</span>
                                            <span className="text-gray-500 text-xs"> / {exam.totalMarks || 100}</span>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={item.passed ? "default" : "destructive"}>
                                                {item.passed ? "Passed" : "Failed"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm">
                                                View Details
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        No results found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}
