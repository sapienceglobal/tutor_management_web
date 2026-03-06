'use client';

import { useState, useEffect } from 'react';
import { 
  Building2, Globe, BookOpen, Users, Calendar, 
  Award, Video, FileText, TrendingUp, ChevronRight,
  Bell, Settings, Search, Filter
} from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

export default function InstituteSegmentedDashboard() {
  const [activeTab, setActiveTab] = useState('institute');
  const [userInstitutes, setUserInstitutes] = useState([]);
  const [currentInstitute, setCurrentInstitute] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Data states
  const [instituteData, setInstituteData] = useState({
    courses: [],
    exams: [],
    liveClasses: [],
    announcements: [],
    batches: [],
    stats: { enrolledCourses: 0, completedCourses: 0, inProgress: 0 }
  });
  
  const [globalData, setGlobalData] = useState({
    courses: [],
    tutors: [],
    exams: [],
    stats: { availableCourses: 0, enrolledCourses: 0, completedCourses: 0 }
  });

  useEffect(() => {
    loadUserInstitutes();
  }, []);

  useEffect(() => {
    if (activeTab === 'institute' && currentInstitute) {
      loadInstituteData();
    } else if (activeTab === 'global') {
      loadGlobalData();
    }
  }, [activeTab, currentInstitute]);

  const loadUserInstitutes = async () => {
    try {
      const response = await api.get('/membership/my-institutes');
      if (response.data.success) {
        setUserInstitutes(response.data.institutes);
        
        // Set current institute
        const current = response.data.institutes.find(inst => inst.isCurrent);
        if (current) {
          setCurrentInstitute(current);
        } else if (response.data.institutes.length > 0) {
          setCurrentInstitute(response.data.institutes[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load institutes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadInstituteData = async () => {
    if (!currentInstitute) return;
    
    try {
      const response = await api.get(`/student/institute/${currentInstitute.id}/dashboard`);
      if (response.data.success) {
        setInstituteData(response.data);
      }
    } catch (error) {
      console.error('Failed to load institute data:', error);
    }
  };

  const loadGlobalData = async () => {
    try {
      const response = await api.get('/student/global/dashboard');
      if (response.data.success) {
        setGlobalData(response.data);
      }
    } catch (error) {
      console.error('Failed to load global data:', error);
    }
  };

  const switchInstitute = (institute) => {
    setCurrentInstitute(institute);
    // Update current institute in backend
    api.post('/membership/switch-institute', { instituteId: institute.id });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header with Institute Switcher */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-slate-800">Student Dashboard</h1>
              
              {userInstitutes.length > 0 && (
                <div className="flex items-center gap-2">
                  {userInstitutes.map((institute) => (
                    <button
                      key={institute.id}
                      onClick={() => switchInstitute(institute)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        currentInstitute?.id === institute.id
                          ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <Building2 className="w-4 h-4 inline mr-1" />
                      {institute.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Bell className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('institute')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'institute'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Building2 className="w-4 h-4 inline mr-2" />
              My Institute
              {currentInstitute && (
                <span className="ml-2 text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                  {currentInstitute.name}
                </span>
              )}
            </button>
            
            <button
              onClick={() => setActiveTab('global')}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'global'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Globe className="w-4 h-4 inline mr-2" />
              Global Marketplace
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'institute' ? (
          <InstituteView 
            data={instituteData} 
            institute={currentInstitute}
            onSwitchToGlobal={() => setActiveTab('global')}
          />
        ) : (
          <GlobalView 
            data={globalData}
            onSwitchToInstitute={() => setActiveTab('institute')}
          />
        )}
      </div>
    </div>
  );
}

// Institute View Component
function InstituteView({ data, institute, onSwitchToGlobal }) {
  return (
    <div className="space-y-8">
      {/* Institute Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-indigo-100 rounded-xl flex items-center justify-center">
                <Building2 className="w-8 h-8 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800">{institute?.name}</h2>
                <p className="text-slate-600">Your institute dashboard and activities</p>
              </div>
            </div>
            <Button onClick={onSwitchToGlobal} variant="outline">
              <Globe className="w-4 h-4 mr-2" />
              Explore Global
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          icon={BookOpen}
          title="Enrolled Courses"
          value={data.stats.enrolledCourses}
          color="blue"
        />
        <StatCard
          icon={Award}
          title="Completed"
          value={data.stats.completedCourses}
          color="green"
        />
        <StatCard
          icon={TrendingUp}
          title="In Progress"
          value={data.stats.inProgress}
          color="orange"
        />
        <StatCard
          icon={Users}
          title="Batch Members"
          value={data.batches?.length || 0}
          color="purple"
        />
      </div>

      {/* Institute Courses */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Institute Courses
            </CardTitle>
            <Link href="/student/courses?scope=institute">
              <Button variant="outline" size="sm">
                View All
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.courses?.slice(0, 6).map((course) => (
              <CourseCard key={course._id} course={course} scope="institute" />
            ))}
          </div>
          {(!data.courses || data.courses.length === 0) && (
            <div className="text-center py-8">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No courses available in your institute</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Institute Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Live Classes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="w-5 h-5" />
              Upcoming Live Classes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.liveClasses?.slice(0, 3).map((liveClass) => (
                <div key={liveClass._id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <Video className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-slate-800">{liveClass.title}</h4>
                    <p className="text-sm text-slate-500">
                      {new Date(liveClass.startTime).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant="outline">Live</Badge>
                </div>
              ))}
              {(!data.liveClasses || data.liveClasses.length === 0) && (
                <p className="text-slate-500 text-center py-4">No upcoming live classes</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Institute Announcements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Institute Announcements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.announcements?.slice(0, 3).map((announcement) => (
                <div key={announcement._id} className="p-3 border rounded-lg">
                  <h4 className="font-medium text-slate-800">{announcement.title}</h4>
                  <p className="text-sm text-slate-600 mt-1">{announcement.content}</p>
                  <p className="text-xs text-slate-500 mt-2">
                    {new Date(announcement.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
              {(!data.announcements || data.announcements.length === 0) && (
                <p className="text-slate-500 text-center py-4">No announcements</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Global View Component
function GlobalView({ data, onSwitchToInstitute }) {
  return (
    <div className="space-y-8">
      {/* Global Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center">
                <Globe className="w-8 h-8 text-purple-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Global Marketplace</h2>
                <p className="text-slate-600">Discover courses and tutors from all institutes</p>
              </div>
            </div>
            <Button onClick={onSwitchToInstitute} variant="outline">
              <Building2 className="w-4 h-4 mr-2" />
              My Institute
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Global Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          icon={BookOpen}
          title="Available Courses"
          value={data.stats.availableCourses}
          color="blue"
        />
        <StatCard
          icon={Users}
          title="Active Tutors"
          value={data.stats.activeTutors || 0}
          color="purple"
        />
        <StatCard
          icon={Award}
          title="Your Enrollments"
          value={data.stats.enrolledCourses}
          color="green"
        />
      </div>

      {/* Global Courses */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Featured Courses
            </CardTitle>
            <Link href="/student/courses?scope=global">
              <Button variant="outline" size="sm">
                Browse All
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.courses?.slice(0, 6).map((course) => (
              <CourseCard key={course._id} course={course} scope="global" />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Global Tutors */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Top Tutors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {data.tutors?.slice(0, 8).map((tutor) => (
              <TutorCard key={tutor._id} tutor={tutor} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper Components
function StatCard({ icon: Icon, title, value, color }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600'
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-600">{title}</p>
            <p className="text-2xl font-bold text-slate-800">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CourseCard({ course, scope }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="aspect-video bg-slate-200 rounded-lg mb-3"></div>
        <h3 className="font-semibold text-slate-800 mb-1 line-clamp-1">{course.title}</h3>
        <p className="text-sm text-slate-600 mb-3 line-clamp-2">{course.description}</p>
        <div className="flex items-center justify-between">
          <Badge variant={scope === 'institute' ? 'default' : 'secondary'}>
            {scope === 'institute' ? 'Institute' : 'Global'}
          </Badge>
          <Link href={`/student/courses/${course._id}`}>
            <Button size="sm" variant="outline">
              View
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function TutorCard({ tutor }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 text-center">
        <div className="w-16 h-16 bg-slate-200 rounded-full mx-auto mb-3"></div>
        <h3 className="font-semibold text-slate-800 mb-1">{tutor.name}</h3>
        <p className="text-sm text-slate-600 mb-2">{tutor.specialization}</p>
        <div className="flex items-center justify-center gap-1 mb-2">
          <span className="text-yellow-500">★</span>
          <span className="text-sm text-slate-600">{tutor.rating}</span>
        </div>
        <Link href={`/student/tutors/${tutor._id}`}>
          <Button size="sm" variant="outline" className="w-full">
            View Profile
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
