import Link from 'next/link';
import { PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function EnrolledCourseCard({ course, className }) {
    const { title, thumbnail, tutorId, _id } = course.courseId;
    const { progress } = course;

    const percentage = progress?.percentage || 0;

    return (
        <div className={`group flex flex-col overflow-hidden rounded-xl border bg-white shadow-sm transition-all hover:shadow-md ${className}`}>
            <div className="relative aspect-video w-full overflow-hidden bg-gray-100">
                <img
                    src={thumbnail}
                    alt={title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/20 opacity-0 transition-opacity group-hover:opacity-100 flex items-center justify-center">
                    <Link href={`/student/courses/${_id}`}>
                        <Button size="icon" variant="secondary" className="rounded-full h-12 w-12 bg-white/90 hover:bg-white text-primary shadow-xl">
                            <PlayCircle className="h-6 w-6 ml-1" />
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="flex flex-1 flex-col p-4">
                <div className="mb-2 flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">{percentage}% Complete</Badge>
                </div>

                <h3 className="line-clamp-2 text-md font-bold text-gray-900 mb-1">
                    {title}
                </h3>
                <p className="text-xs text-gray-500 mb-4 line-clamp-1">
                    Last accessed {new Date(course.lastAccessed || Date.now()).toLocaleDateString()}
                </p>

                {/* Progress Bar */}
                <div className="mt-auto space-y-2">
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary transition-all duration-500 ease-out"
                            style={{ width: `${percentage}%` }}
                        />
                    </div>
                    <Link href={`/student/courses/${_id}`} className="block">
                        <Button className="w-full h-8 text-xs bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary border-0 font-semibold shadow-none">
                            {percentage > 0 ? 'Resume Learning' : 'Start Learning'}
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
