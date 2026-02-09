import Link from 'next/link';
import { Star, Clock, BookOpen, Users } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function CourseCard({ course }) {
    const { title, thumbnail, tutorId, rating, price, isFree, level, duration, categoryId, reviewCount } = course;

    // Safe access for nested tutor data
    const tutorName = tutorId?.userId?.name || 'Unknown Tutor';
    const tutorImage = tutorId?.userId?.profileImage || 'https://randomuser.me/api/portraits/lego/1.jpg';
    const categoryName = categoryId?.name || 'General';

    return (
        <Link href={`/student/courses/${course._id}`} className="block h-full cursor-pointer">
            <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50 group flex flex-col h-full">
                {/* Thumbnail Section */}
                <div className="relative aspect-video w-full overflow-hidden bg-gray-100">
                    <img
                        src={thumbnail || 'https://via.placeholder.com/400x250'}
                        alt={title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-3 left-3">
                        <span className="bg-white/90 backdrop-blur-sm text-xs font-semibold px-2 py-1 rounded-md text-gray-800 shadow-sm">
                            {categoryName}
                        </span>
                    </div>
                    <div className="absolute top-3 right-3">
                        <span className="bg-black/90 text-white backdrop-blur-sm text-xs font-semibold px-2 py-1 rounded-md shadow-sm capitalize">
                            {level}
                        </span>
                    </div>
                </div>

                {/* Content Section */}
                <CardContent className="p-4 flex-1 flex flex-col gap-3">
                    <h3 className="font-bold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                        {title}
                    </h3>

                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{Math.round(duration / 60)}h {duration % 60}m</span>
                        </div>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            <span>{course.enrolledCount || 0} enrolled</span>
                        </div>
                    </div>

                    {/* Tutor Section */}
                    <div className="flex items-center gap-2 mt-auto pt-2">
                        <img
                            src={tutorImage}
                            alt={tutorName}
                            className="w-6 h-6 rounded-full object-cover ring-2 ring-white shadow-sm"
                        />
                        <span className="text-sm font-medium text-gray-700 truncate">{tutorName}</span>
                    </div>
                </CardContent>

                <CardFooter className="p-4 pt-0 border-t bg-gray-50/50 flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-1.5">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-bold text-gray-900">{rating || '0.0'}</span>
                        <span className="text-xs text-gray-500">({reviewCount || 0})</span>
                    </div>

                    <div className="flex items-center gap-2">
                        {isFree ? (
                            <span className="text-lg font-bold text-green-600">Free</span>
                        ) : (
                            <span className="text-lg font-bold text-primary">₹{price}</span>
                        )}
                    </div>
                </CardFooter>
            </Card>
        </Link>
    );
}
