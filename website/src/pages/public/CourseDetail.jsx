import React, { useEffect, useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { coursesApi, courseTeachersApi, getImageUrl } from '../../services/api';
import { BookOpen, Users, Calendar, ArrowRight, Shield, Mail, ArrowUpRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export function CourseDetail() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const courseData = await coursesApi.getById(id);
        setCourse(courseData);

        // Fetch the teacher assigned to this course
        // We'll take the first current teacher found
        const assignments = await courseTeachersApi.getAll({ course: id, is_current: true });
        if (assignments && assignments.length > 0) {
          setFaculties(assignments.map(a => a.teacher_details));
        }
      } catch (err) {
        console.error('Failed to fetch data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);


  if (loading) return <div className="p-12 text-center text-slate-500 font-medium">Loading course details...</div>;

  if (!course) {
    return <Navigate to="/courses" replace />;
  }

  return (
    <div className="bg-slate-50 min-h-screen py-12 pb-24 animate-in fade-in duration-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="flex items-center text-sm font-medium text-slate-500 mb-8">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span className="mx-2">›</span>
          <Link to="/courses" className="hover:text-primary transition-colors">Courses</Link>
          <span className="mx-2">›</span>
          <span className="text-primary-dark">{course.course_name}</span>
        </div>

        {/* Hero Section */}
        <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden mb-12">
          <div className="flex flex-col lg:flex-row">
            <div className="lg:w-3/5 p-8 lg:p-16 flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-6">
                <span className="px-4 py-1.5 bg-primary/10 text-primary text-xs font-bold rounded-full uppercase tracking-widest">
                  {course.department}
                </span>
                <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">{course.course_code}</span>
              </div>
              <h1 className="text-4xl lg:text-6xl font-bold text-primary-dark tracking-tight mb-8 font-serif leading-tight">{course.course_name}</h1>
              <p className="text-slate-500 text-lg lg:text-xl leading-relaxed mb-10 max-w-xl">
                {course.description || "Embark on a transformative educational journey with our comprehensive curriculum designed for modern industry needs."}
              </p>
              
            </div>
            <div className="lg:w-2/5 h-80 lg:h-auto relative">
              <img src={'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&q=80&w=2000'} alt={course.course_name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-white via-transparent to-transparent lg:hidden"></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-12">
            {/* Info Grid */}
            <div className="grid grid-cols-1 gap-6">
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                  <Users className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Students</h3>
                  <p className="font-bold text-slate-800">Max 60 Seats</p>
                </div>
              </div>
            </div>

            {/* About the Course */}
            <section className="bg-white rounded-3xl p-10 border border-slate-100 shadow-sm">
              <h2 className="text-2xl font-bold text-primary-dark mb-6 font-serif">Course Overview</h2>
              <div className="prose prose-slate max-w-none text-slate-600 leading-loose">
                <p>
                  This course offers an in-depth exploration of {course.course_name}, balancing theoretical foundations with practical, hands-on experience. Students will engage with modern tools and methodologies, preparing them for excellence in their professional careers.
                </p>
                <p className="mt-4">
                  Key learning outcomes include mastery of core concepts, critical analysis skills, and the ability to apply learned principles to real-world challenges within the {course.department} field.
                </p>
              </div>
            </section>
          </div>

          {/* Sidebar - Faculty Member */}
          <div className="space-y-8">
            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
              
              <h2 className="text-xl font-bold mb-8 flex items-center gap-2">
                Course Faculty
                <div className="h-px flex-1 bg-slate-800 ml-2"></div>
              </h2>

              {faculties.length > 0 ? (
                <div className="space-y-8">
                  {faculties.map((faculty, index) => (
                    <div key={faculty.id} className={`${index > 0 ? 'pt-8 border-t border-slate-800' : ''}`}>
                      <div className="relative mb-6">
                        <div className="w-32 h-32 rounded-3xl overflow-hidden border-4 border-slate-800 shadow-2xl relative z-10 mx-auto">
                          <img 
                            src={getImageUrl(faculty.profile_image)} 
                            alt={`${faculty.first_name} ${faculty.last_name}`} 
                            className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" 
                          />
                        </div>
                        <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      </div>

                      <div className="text-center space-y-2 mb-4">
                        <h3 className="text-2xl font-bold text-white">{`Dr. ${faculty.first_name} ${faculty.last_name}`}</h3>
                        <p className="text-primary font-bold text-xs uppercase tracking-widest">{faculty.position}</p>
                        <p className="text-slate-400 text-sm italic">{faculty.department}</p>
                      </div>

                      <p className="text-slate-400 text-sm leading-relaxed text-center line-clamp-4 mb-6">
                        {faculty.biography}
                      </p>

                      <div className="space-y-4">
                        <Link 
                          to={`/professors/${faculty.id}`} 
                          className="flex items-center justify-between w-full p-4 bg-slate-800/50 rounded-2xl hover:bg-primary transition-all group/link"
                        >
                          <span className="font-bold text-sm">View Full Profile</span>
                          <ArrowUpRight className="w-4 h-4 group-hover/link:translate-x-1 group-hover/link:-translate-y-1 transition-transform" />
                        </Link>
                      </div>
                    </div>
                  ))}
                  <div className="pt-4">
                    <button className="flex items-center justify-center gap-2 w-full p-4 text-slate-400 hover:text-white transition-colors text-sm font-medium">
                      <Mail className="w-4 h-4" />
                      Contact Faculty Team
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center space-y-4">
                  <div className="w-20 h-20 rounded-3xl bg-slate-800 mx-auto flex items-center justify-center">
                    <Users className="w-8 h-8 text-slate-600" />
                  </div>
                  <p className="text-slate-500 text-sm italic">Faculty information being updated...</p>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-6">
              <h3 className="font-bold text-slate-800">Upcoming Batches</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm p-4 bg-slate-50 rounded-2xl">
                  <div className="font-bold text-slate-700">Spring 2026</div>
                  <div className="text-emerald-600 font-bold">Applications Open</div>
                </div>
                <div className="flex items-center justify-between text-sm p-4 bg-slate-50 rounded-2xl opacity-50">
                  <div className="font-bold text-slate-700">Fall 2025</div>
                  <div className="text-slate-500 font-bold">Closed</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
