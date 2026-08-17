import React, { useState, useEffect } from 'react';
import { ChevronRight, Calendar, Users, MonitorPlay, User, ArrowRight, Monitor, Briefcase, Star, Headphones, BookOpen } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Link } from 'react-router-dom';
import { courseTeachersApi, completedCoursesApi, getImageUrl } from '../../services/api';

export function Courses() {
  const [activeTab, setActiveTab] = useState('ongoing');
  const [ongoingCourses, setOngoingCourses] = useState([]);
  const [completedCourses, setCompletedCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ongoingData, completedData] = await Promise.all([
        courseTeachersApi.getAll({ is_current: true }),
        completedCoursesApi.getAll()
      ]);
      
      const rawOngoing = Array.isArray(ongoingData) ? ongoingData : (ongoingData.results || []);
      
      // Group teachers by course
      const groupedOngoing = rawOngoing.reduce((acc, assignment) => {
        const courseId = assignment.course;
        if (!acc[courseId]) {
          acc[courseId] = {
            ...assignment.course_details,
            teachers: [assignment.teacher_details],
            assignment_id: assignment.id,
            slot: assignment.slot || assignment.course_details?.slot
          };
        } else {
          // Avoid duplicate teachers for the same course if any
          if (!acc[courseId].teachers.find(t => t.id === assignment.teacher_details.id)) {
            acc[courseId].teachers.push(assignment.teacher_details);
          }
        }
        return acc;
      }, {});

      setOngoingCourses(Object.values(groupedOngoing));
      setCompletedCourses(Array.isArray(completedData) ? completedData : (completedData.results || []));
    } catch (err) {
      console.error('Failed to fetch courses', err);
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="bg-slate-50 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb */}
        <div className="flex items-center text-sm text-slate-500 mb-8">
          <span>Home</span>
          <ChevronRight className="w-4 h-4 mx-2" />
          <span>Courses</span>
        </div>

        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-bold text-primary-dark mb-4 tracking-tight">Courses</h1>
          <p className="text-slate-600 max-w-2xl text-lg leading-relaxed mb-8">
            Explore our wide range of undergraduate, postgraduate, and certification programs 
            designed to help you learn, grow, and achieve your goals.
          </p>

          {/* Filter Tabs */}
          <div className="flex gap-4 border-b border-slate-200">
            <button 
              onClick={() => setActiveTab('ongoing')}
              className={`pb-4 px-2 font-bold transition-colors border-b-2 ${activeTab === 'ongoing' ? 'text-primary border-primary' : 'text-slate-500 border-transparent hover:text-primary-dark'}`}
            >
              Ongoing Courses
            </button>
            <button 
              onClick={() => setActiveTab('completed')}
              className={`pb-4 px-2 font-bold transition-colors border-b-2 ${activeTab === 'completed' ? 'text-primary border-primary' : 'text-slate-500 border-transparent hover:text-primary-dark'}`}
            >
              Completed
            </button>
          </div>
        </div>

        {/* Dynamic Section Based on Tab */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {activeTab === 'ongoing' && (
              <section className="mb-16 animate-fade-in">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 border-b border-slate-200 pb-4">
                <div>
                  <h2 className="text-3xl font-bold text-primary-dark mb-2">Current Courses Running</h2>
                  <p className="text-slate-600">Join live classes and continue your learning journey with expert faculty.</p>
                </div>
                <Button variant="outline" className="mt-4 sm:mt-0 flex items-center gap-2 border-primary text-primary hover:bg-primary hover:text-white">
                  View All Courses <ArrowRight className="w-4 h-4" />
                </Button>
              </div>

              {ongoingCourses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {ongoingCourses.map((course) => {
                    return (
                      <div key={course.assignment_id} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
                        <div className="flex justify-between items-start mb-6">
                          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                            <Monitor className="w-6 h-6 text-primary" />
                          </div>
                          <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-semibold rounded-full">
                            {course.department}
                          </span>
                        </div>
                        
                        <h3 className="text-xl font-bold text-primary-dark mb-6 line-clamp-2 h-14">{course.course_name}</h3>
                        
                        <div className="space-y-4 mb-6 flex-grow">
                          <div className="flex items-center gap-3 text-slate-600 text-sm">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <span>Code: {course.course_code}</span>
                          </div>
                          <div className="flex items-center gap-3 text-slate-600 text-sm">
                            <Users className="w-4 h-4 text-slate-400" />
                            <span>Slot: {course.slot}</span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-3 text-slate-600 text-sm">
                              <User className="w-4 h-4 text-slate-400" />
                              <span className="font-semibold">Faculty:</span>
                            </div>
                            <div className="flex -space-x-3 overflow-hidden p-1">
                              {course.teachers.map((teacher, index) => (
                                <Link 
                                  key={teacher.id} 
                                  to={`/professors/${teacher.id}`}
                                  title={`Dr. ${teacher.first_name} ${teacher.last_name}`}
                                  className="relative inline-block"
                                >
                                  <img
                                    className="inline-block h-10 w-10 rounded-full ring-2 ring-white object-cover hover:z-10 hover:scale-110 transition-all"
                                    src={getImageUrl(teacher.profile_image)}
                                    alt={`${teacher.first_name} ${teacher.last_name}`}
                                  />
                                </Link>
                              ))}
                              {course.teachers.length > 0 && (
                                <span className="ml-4 text-xs text-slate-500 self-center font-medium">
                                  {course.teachers.length === 1 
                                    ? `Dr. ${course.teachers[0].first_name} ${course.teachers[0].last_name}`
                                    : `${course.teachers.length} Professors`
                                  }
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="mt-auto">
                          <div className="bg-slate-50 rounded-xl p-4 flex items-center justify-between mb-4">
                            <div>
                              <div className="text-xs text-slate-500 font-medium mb-1">Status</div>
                              <div className="text-sm font-bold text-slate-800">Ongoing</div>
                            </div>
                            <div className="flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
                              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                              Live Now
                            </div>
                          </div>
                          <Link to={`/courses/${course.id || course.assignment_id}`} className="block w-full">
                            <Button className="w-full bg-primary-dark text-white hover:bg-slate-800 flex items-center justify-center gap-2">
                              View Course Details <ArrowRight className="w-4 h-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
                  <p className="text-slate-500">No ongoing courses available at the moment.</p>
                </div>
              )}
            </section>
            )}


            {/* Completed Courses Section */}
            {activeTab === 'completed' && (
              <section className="mb-16 animate-fade-in">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 border-b border-slate-200 pb-4">
                  <div>
                    <h2 className="text-3xl font-bold text-primary-dark mb-2">Past Courses Archive</h2>
                    <p className="text-slate-600">Successfully completed batches and their performance summary.</p>
                  </div>
                </div>
                
                {completedCourses.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {completedCourses.map((course) => (
                      <div key={course.id} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full grayscale hover:grayscale-0">
                        <div className="flex justify-between items-start mb-6">
                          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                            <BookOpen className="w-6 h-6" />
                          </div>
                          <span className="px-3 py-1 bg-slate-100 text-slate-500 text-sm font-semibold rounded-full">
                            Completed
                          </span>
                        </div>
                        
                        <h3 className="text-xl font-bold text-slate-700 mb-6 line-clamp-2 h-14">{course.course_full_name}</h3>
                        
                        <div className="space-y-4 mb-6 flex-grow">
                          <div className="flex items-center gap-3 text-slate-600 text-sm">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <span>Finished: {new Date(course.completion_date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-3 text-slate-600 text-sm">
                            <User className="w-4 h-4 text-slate-400" />
                            <span>Faculty: Dr. {course.teacher_details?.first_name} {course.teacher_details?.last_name}</span>
                          </div>
                          <div className="flex items-center gap-3 text-slate-600 text-sm">
                            <Users className="w-4 h-4 text-slate-400" />
                            <span>Students: {course.total_students}</span>
                          </div>
                          <div className="flex items-center gap-3 text-slate-600 text-sm">
                            <Star className="w-4 h-4 text-emerald-500" />
                            <span className="font-bold text-emerald-600">{course.pass_percentage}% Pass Rate</span>
                          </div>
                        </div>

                        <Link to={`/courses/${course.course}`} className="mt-auto block w-full">
                          <Button variant="outline" className="w-full border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-2">
                            View Archive <ArrowRight className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 bg-slate-100 rounded-2xl border border-dashed border-slate-300">
                    <p className="text-slate-500">No completed courses in the archive yet.</p>
                  </div>
                )}
              </section>
            )}
          </>
        )}

        {/* CTA Section */}
        <section className="bg-primary/5 rounded-3xl p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-8 mb-12 border border-primary/10">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm flex-shrink-0">
              <Headphones className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-primary-dark mb-2">Not sure which course is right for you?</h3>
              <p className="text-slate-600 text-lg">Our academic counselors are here to help you choose the best path for your future.</p>
            </div>
          </div>
          <Button className="bg-primary-dark text-white hover:bg-slate-800 whitespace-nowrap flex items-center gap-2 px-8 py-3 h-auto text-base">
            Talk to Counselor <ArrowRight className="w-4 h-4" />
          </Button>
        </section>

      </div>
    </div>
  );
}
