
'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Video,
    Calendar,
    Clock,
    Plus,
    Trash2,
    ExternalLink,
    Edit,
    PlayCircle,
    BookOpen
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

export default function TutorLiveClassesPage() {
    const [classes, setClasses] = useState([]);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const initialFormState = {
        title: '',
        description: '',
        courseId: 'none',
        dateTime: '',
        duration: 60,
        meetingLink: '',
        recordingLink: '',
        platform: 'zoom'
    };

    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        fetchClasses();
        fetchCourses();
    }, []);

    const fetchClasses = async () => {
        try {
            const response = await api.get('/live-classes');
            if (response.data.success) {
                setClasses(response.data.liveClasses);
            }
        } catch (error) {
            console.error('Error fetching classes:', error);
            toast.error('Failed to load live classes');
        } finally {
            setLoading(false);
        }
    };

    const fetchCourses = async () => {
        try {
            const response = await api.get('/courses/my-courses');
            if (response.data.success) {
                setCourses(response.data.courses);
            }
        } catch (error) {
            console.error('Error fetching courses:', error);
        }
    };

    const handleEditClick = (cls) => {
        setEditingId(cls._id);
        const dateStr = new Date(cls.dateTime).toISOString().slice(0, 16); // Format for datetime-local
        setFormData({
            title: cls.title,
            description: cls.description || '',
            courseId: cls.courseId?._id || 'none',
            dateTime: dateStr,
            duration: cls.duration,
            meetingLink: cls.meetingLink,
            recordingLink: cls.recordingLink || '',
            platform: cls.platform
        });
        setIsCreating(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setIsCreating(false);
        setEditingId(null);
        setFormData(initialFormState);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...formData };
            if (payload.courseId === 'none') delete payload.courseId;

            if (editingId) {
                const response = await api.patch(`/live-classes/${editingId}`, payload);
                if (response.data.success) {
                    toast.success('Live class updated!');
                }
            } else {
                const response = await api.post('/live-classes', payload);
                if (response.data.success) {
                    toast.success('Live class scheduled!');
                }
            }
            handleCancelEdit();
            fetchClasses();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save class');
        }
    };

    const handleDeleteClass = async (id) => {
        if (!confirm('Are you sure you want to cancel this class?')) return;

        try {
            const response = await api.delete(`/live-classes/${id}`);
            if (response.data.success) {
                toast.success('Class cancelled');
                fetchClasses();
            }
        } catch (error) {
            toast.error('Failed to cancel class');
        }
    };

    if (loading) return <div className="p-8 text-center">Loading classes...</div>;

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Video className="w-8 h-8 text-primary" />
                        Live Classes
                    </h1>
                    <p className="text-gray-500">Schedule and manage your Zoom sessions</p>
                </div>
                <Button onClick={() => setIsCreating(true)} disabled={isCreating && !editingId}>
                    <Plus className="w-4 h-4 mr-2" /> Schedule Class
                </Button>
            </div>

            {isCreating && (
                <Card className="animate-in slide-in-from-top-4 duration-300 border-primary/20 bg-blue-50/30">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">{editingId ? 'Edit Class Details' : 'Schedule New Class'}</h3>
                            <Button variant="ghost" size="sm" onClick={handleCancelEdit}>Cancel</Button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Topic</Label>
                                    <Input
                                        required
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="e.g. Advanced Calculus Review"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Link to Course (Optional)</Label>
                                    <Select
                                        value={formData.courseId}
                                        onValueChange={val => setFormData({ ...formData, courseId: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a course" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">No Course Linked</SelectItem>
                                            {courses.map(course => (
                                                <SelectItem key={course._id} value={course._id}>{course.title}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Date & Time</Label>
                                    <Input
                                        type="datetime-local"
                                        required
                                        value={formData.dateTime}
                                        onChange={e => setFormData({ ...formData, dateTime: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Duration (minutes)</Label>
                                    <Input
                                        type="number"
                                        required
                                        min="15"
                                        value={formData.duration}
                                        onChange={e => setFormData({ ...formData, duration: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Meeting Link (Zoom/Meet)</Label>
                                    <Input
                                        type="url"
                                        required
                                        placeholder="https://zoom.us/j/..."
                                        value={formData.meetingLink}
                                        onChange={e => setFormData({ ...formData, meetingLink: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Recording Link (Optional - After Class)</Label>
                                    <Input
                                        type="url"
                                        placeholder="https://drive.google.com/..."
                                        value={formData.recordingLink}
                                        onChange={e => setFormData({ ...formData, recordingLink: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Description (Optional)</Label>
                                <Textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="What will be covered?"
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <Button type="button" variant="outline" onClick={handleCancelEdit}>Cancel</Button>
                                <Button type="submit">{editingId ? 'Update Class' : 'Schedule Class'}</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {classes.length === 0 && !isCreating ? (
                    <div className="col-span-full text-center py-12 bg-gray-50 rounded-xl border border-dashed text-gray-400">
                        <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No live classes scheduled yet.</p>
                    </div>
                ) : (
                    classes.map(cls => (
                        <Card key={cls._id} className="hover:shadow-md transition-shadow group relative">
                            <CardContent className="p-6 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-blue-50 rounded-lg">
                                            <Video className="w-5 h-5 text-blue-500" />
                                        </div>
                                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${new Date(cls.dateTime) < new Date() ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700'
                                            }`}>
                                            {new Date(cls.dateTime) < new Date() ? 'Completed' : 'Upcoming'}
                                        </span>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleEditClick(cls)}
                                            className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-md transition-colors"
                                            title="Edit Class"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteClass(cls._id)}
                                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                            title="Cancel Class"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-bold text-lg text-gray-900 line-clamp-1" title={cls.title}>{cls.title}</h3>
                                    {cls.courseId?.title && (
                                        <div className="flex items-center gap-1.5 text-xs text-blue-600 mt-1 font-medium bg-blue-50 w-fit px-2 py-0.5 rounded-full">
                                            <BookOpen className="w-3 h-3" />
                                            <span className="truncate max-w-[200px]">{cls.courseId.title}</span>
                                        </div>
                                    )}
                                    {cls.description && <p className="text-sm text-gray-500 line-clamp-2 mt-2">{cls.description}</p>}
                                </div>

                                <div className="space-y-2 text-sm text-gray-600">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-gray-400" />
                                        <span>{format(new Date(cls.dateTime), 'PPP')}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-gray-400" />
                                        <span>{format(new Date(cls.dateTime), 'h:mm a')} • {cls.duration} mins</span>
                                    </div>
                                </div>

                                <div className="pt-4 border-t flex flex-col gap-2">
                                    <a
                                        href={cls.meetingLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        Start Class
                                    </a>
                                    {cls.recordingLink && (
                                        <a
                                            href={cls.recordingLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-center w-full gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors"
                                        >
                                            <PlayCircle className="w-4 h-4" />
                                            View Recording
                                        </a>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
