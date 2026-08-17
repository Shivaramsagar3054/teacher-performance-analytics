import React, { useEffect, useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { teachersApi, commentsApi, getWebSocketUrl, getImageUrl } from '../../services/api';
import { Mail, Phone, MapPin, GraduationCap, Clock, ArrowRight, BookCheck, BookOpen, Brain, Database, Code, Network, BarChart, FileCode2, MessageSquare, Send, UserCircle, Users, TrendingUp, Info } from 'lucide-react';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import toast from 'react-hot-toast';

const iconMap = {
  Brain,
  Database,
  Code,
  Network,
  BarChart,
  FileCode2,
  BookOpen
};

export function ProfessorProfile() {
  const { id } = useParams();
  const [professor, setProfessor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [socket, setSocket] = useState(null);
  const [typingUsers, setTypingUsers] = useState({});
  const [replyingTo, setReplyingTo] = useState(null);
  const [selectedCourseIndex, setSelectedCourseIndex] = useState(0);

  useEffect(() => {
    teachersApi.getById(id)
      .then(data => {
        setProfessor(data);
        // Comments will be loaded via WebSocket history for real-time consistency
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch professor', err);
        setLoading(false);
      });

    // Initialize WebSocket
    const wsUrl = getWebSocketUrl(id);
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('Connected to Comments WebSocket');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('WebSocket Message:', data);
      if (data.type === 'comment_history') {
        // Backend sends comments in chronological order, we want newest first
        setComments([...data.comments].reverse());
      } else if (data.type === 'new_comment') {
        setComments(prev => [data.comment, ...prev]);
        // Also clear typing status for this user if they just posted
        setTypingUsers(prev => {
          const next = { ...prev };
          delete next[data.comment.user_email || data.comment.user_name];
          return next;
        });
      } else if (data.type === 'typing_status') {
        setTypingUsers(prev => ({
          ...prev,
          [data.user_name]: data.is_typing
        }));
      } else if (data.type === 'error') {
        console.error('WebSocket Error:', data.message);
        toast.error(`Error: ${data.message}`);
      }
    };

    ws.onclose = () => {
      console.log('Disconnected from Comments WebSocket');
    };

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, [id]);


  const handleInputChange = (e) => {
    setNewComment(e.target.value);

    // Typing Indicator Logic
    if (socket && socket.readyState === WebSocket.OPEN) {
      const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const userName = user.email || 'Someone';

      socket.send(JSON.stringify({
        type: 'typing',
        is_typing: true,
        user_name: userName
      }));

      if (window.typingTimeout) clearTimeout(window.typingTimeout);
      window.typingTimeout = setTimeout(() => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({
            type: 'typing',
            is_typing: false,
            user_name: userName
          }));
        }
      }, 3000);
    }
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!newComment.trim() || !socket) return;
    
    const userId = localStorage.getItem('user_id');
    
    if (!userId) {
      toast.error('Please login to post a comment');
      return;
    }
    
    console.log('Submitting comment for teacher:', professor.id, 'user:', userId);
    
    const commentData = {
      type: 'post_comment',
      teacher_id: professor.id,
      user_id: Number(userId),
      content: newComment,
      is_anonymous: false,
      parent_id: replyingTo?.id || null
    };
    
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(commentData));
      setNewComment('');
      setReplyingTo(null);
      toast.success('Comment posted!');
    } else {
      console.error('WebSocket is not connected');
      toast.error('Connection lost. Please refresh the page.');
    }
  };

  if (loading) {
    return <div className="bg-slate-50 min-h-screen pt-24 text-center font-medium text-slate-500">Loading profile...</div>;
  }

  if (!professor) {
    return <Navigate to="/professors" replace />;
  }

  const profName = `Dr. ${professor.first_name} ${professor.last_name}`;
  const researchInterests = professor.research_interests?.map(r => r.topic) || [];

  return (
    <div className="bg-slate-50 min-h-screen pb-24">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Breadcrumbs */}
        <div className="flex items-center text-sm font-medium text-slate-500 mb-8">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span className="mx-2">›</span>
          <Link to="/professors" className="hover:text-primary transition-colors">Professors</Link>
          <span className="mx-2">›</span>
          <span className="text-primary-dark">{profName}</span>
        </div>

        {/* Main Profile Header */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden mb-12">
          <div className="flex flex-col lg:flex-row">
            {/* Image */}
            <div className="lg:w-[400px] shrink-0">
              <img 
                src={getImageUrl(professor.profile_image)} 
                alt={profName} 
                className="w-full h-full object-cover lg:max-h-[500px]"
              />
            </div>
            
            {/* Details */}
            <div className="p-8 lg:p-12 flex-1 flex flex-col xl:flex-row gap-12">
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-primary-dark font-serif mb-2">
                  {profName}
                </h1>
                <p className="text-lg font-bold text-primary mb-2">
                  {professor.position}
                </p>
                <p className="text-md font-medium text-slate-500 mb-6">
                  Department of {professor.department}
                </p>
                <p className="text-slate-600 leading-relaxed mb-8 max-w-2xl text-lg">
                  {professor.biography}
                </p>

                <div className="space-y-4 text-slate-600 font-medium">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-slate-400" />
                    <a href={`mailto:faculty@brightfuture.edu`} className="hover:text-primary transition-colors">faculty@brightfuture.edu</a>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-slate-400" />
                    <span>{professor.phone_number}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-slate-400" />
                    <span>{professor.location}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <GraduationCap className="w-5 h-5 text-slate-400" />
                    <span>{professor.education_list?.[0]?.degree || 'Ph.D.'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-5 h-5 text-slate-400" />
                    <span>{professor.years_of_experience}+ Years of Experience</span>
                  </div>
                  {professor.avg_pass_percentage > 0 && (
                    <div className="flex items-center gap-3">
                      <BarChart className="w-5 h-5 text-emerald-500" />
                      <span className="font-bold text-emerald-600">{professor.avg_pass_percentage}% Overall Pass Rate</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Research Interests & Office Hours */}
              <div className="xl:w-80 shrink-0 space-y-8">
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                  <h3 className="font-bold text-primary-dark mb-4">Research Interests</h3>
                  <ul className="space-y-2 text-sm text-slate-600 font-medium">
                    {researchInterests.map((interest, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-primary-dark mt-1">•</span>
                        {interest}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                  <h3 className="font-bold text-primary-dark mb-3">Office Hours</h3>
                  <p className="text-sm text-slate-600 whitespace-pre-line leading-relaxed">
                    {professor.officeHours || 'Monday - Friday\n10:00 AM - 12:00 PM'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Metrics Overview Bar */}
        {(() => {
          const completedCourses = professor.completed_courses || [];
          const totalStudents = completedCourses.reduce((acc, c) => {
            const s = c.s_grades || 0;
            const a = c.a_grades || 0;
            const b = c.b_grades || 0;
            const c_gr = c.c_grades || 0;
            const d = c.d_grades || 0;
            const e = c.e_grades || 0;
            const calculatedTotal = s + a + b + c_gr + d + e;
            return acc + (calculatedTotal || c.total_students || c.members || 0);
          }, 0);
          const activeCourses = professor.course_assignments?.length || 0;
          const passRate = professor.avg_pass_percentage > 0 ? `${professor.avg_pass_percentage}%` : 'N/A';
          const experience = professor.years_of_experience ? `${professor.years_of_experience}+ Years` : 'N/A';

          return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 select-none">
              <Card className="hover:shadow-md transition-shadow rounded-2xl bg-white border border-slate-200 shadow-sm">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Students</p>
                    <p className="text-3xl font-extrabold text-slate-800">{totalStudents}</p>
                    <p className="text-[10px] text-slate-500 font-semibold mt-1">Students Taught Overall</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shrink-0">
                    <Users className="w-6 h-6" />
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow rounded-2xl bg-white border border-slate-200 shadow-sm">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Active Courses</p>
                    <p className="text-3xl font-extrabold text-slate-800">{activeCourses}</p>
                    <p className="text-[10px] text-slate-500 font-semibold mt-1">Courses Currently Taught</p>
                  </div>
                  <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 shrink-0">
                    <BookOpen className="w-6 h-6" />
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow rounded-2xl bg-white border border-slate-200 shadow-sm">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Avg Pass Rate</p>
                    <p className="text-3xl font-extrabold text-emerald-600">{passRate}</p>
                    <p className="text-[10px] text-slate-500 font-semibold mt-1">Passing Success Rate</p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shrink-0">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow rounded-2xl bg-white border border-slate-200 shadow-sm">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Experience</p>
                    <p className="text-3xl font-extrabold text-purple-600">{experience}</p>
                    <p className="text-[10px] text-slate-500 font-semibold mt-1">Academic Career Tenure</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 shrink-0">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        })()}

        {/* Education Timeline */}
        {professor.education_list && professor.education_list.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <GraduationCap className="w-8 h-8 text-primary-dark" />
              <h2 className="text-2xl font-bold text-primary-dark font-serif">Education History</h2>
            </div>
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden p-8 lg:p-12">
              <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                {professor.education_list.map((edu, idx) => (
                  <div key={edu.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-[3px] border-white bg-slate-200 group-[.is-active]:bg-primary-dark text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-slate-50 p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                        <h4 className="font-bold text-slate-800 text-lg leading-tight">{edu.degree} in {edu.field_of_study}</h4>
                        <span className="text-xs font-bold text-primary px-3 py-1 bg-primary/10 rounded-full inline-block whitespace-nowrap">{edu.start_year} - {edu.end_year}</span>
                      </div>
                      <p className="text-slate-600 font-medium">{edu.institution_name}</p>
                      {edu.gradeOrCgpa && <p className="text-slate-500 text-sm mt-3 border-t border-slate-200 pt-3">Grade/CGPA: <span className="font-bold text-slate-700">{edu.gradeOrCgpa}</span></p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Completed Courses */}
        {professor.completed_courses && professor.completed_courses.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <BookCheck className="w-8 h-8 text-primary-dark" />
              <h2 className="text-2xl font-bold text-primary-dark font-serif">Completed Courses</h2>
            </div>
            
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              
              {/* Left Column: Completed Courses Table */}
              <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col justify-between">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-sm font-bold text-slate-700">
                        <th className="p-6">Course</th>
                        <th className="p-6 text-center">Total Students</th>
                        <th className="p-6 text-center">Passed / Failed</th>
                        <th className="p-6 text-center">Grade Dist. (S/A/B/C)</th>
                        <th className="p-6 text-center">Pass %</th>
                        <th className="p-6 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {professor.completed_courses.map((course) => {
                        const s = course.s_grades || 0;
                        const a = course.a_grades || 0;
                        const b = course.b_grades || 0;
                        const c = course.c_grades || 0;
                        const d = course.d_grades || 0;
                        const e = course.e_grades || 0;
                        const total = s + a + b + c + d + e;
                        const passed = s + a + b + c + d;
                        const failed = e;
                        const passPct = total > 0 ? Math.round((passed / total) * 100) : 0;

                        return (
                          <tr key={course.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-6">
                              <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0`}>
                                  <BookOpen className={`w-6 h-6 text-blue-600`} />
                                </div>
                                <div>
                                  <p className="font-bold text-slate-800">{course.course_details?.course_name || course.course_full_name}</p>
                                  <p className="text-sm text-slate-500">{course.course_details?.course_code}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-6 text-center font-bold text-slate-700">{total}</td>
                            <td className="p-6">
                              <div className="flex flex-col items-center">
                                <div className="flex gap-2 text-xs font-bold">
                                  <span className="text-emerald-600">P: {passed}</span>
                                  <span className="text-slate-300">|</span>
                                  <span className="text-red-500">F: {failed}</span>
                                </div>
                                <div className="w-24 h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                                  <div className="h-full bg-emerald-500" style={{ width: `${passPct}%` }}></div>
                                </div>
                              </div>
                            </td>
                            <td className="p-6 text-center">
                              <div className="flex items-center justify-center gap-2 text-xs font-bold">
                                <span title="S Grade" className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">{s}</span>
                                <span title="A Grade" className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{a}</span>
                                <span title="B Grade" className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{b}</span>
                                <span title="C Grade" className="text-purple-600 bg-purple-50 px-2 py-0.5 rounded">{c}</span>
                              </div>
                            </td>
                            <td className="p-6 text-center">
                              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border-4 border-emerald-500 text-slate-800 font-bold text-sm bg-white shadow-sm">
                                {passPct}%
                              </div>
                            </td>
                            <td className="p-6 text-center">
                              <Link 
                                to={`/completed-courses/${course.id}/analysis`}
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-50/70 hover:bg-primary text-blue-600 hover:text-white border border-blue-100/50 text-xs font-bold rounded-xl transition-all shadow-sm"
                              >
                                <span>Report</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="p-6 border-t border-slate-100 flex justify-center">
                  <Button variant="outline" className="text-sm font-bold rounded-full px-6">
                    View All Completed Courses <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>

              {/* Right Column: Course Pass Percentages interactive bar chart */}
              <div className="xl:col-span-1">
                {(() => {
                  const chartData = professor.completed_courses.map(course => {
                    const s = course.s_grades || 0;
                    const a = course.a_grades || 0;
                    const b = course.b_grades || 0;
                    const c = course.c_grades || 0;
                    const d = course.d_grades || 0;
                    const e = course.e_grades || 0;
                    const total = s + a + b + c + d + e || course.total_students || course.members || 0;
                    const passed = s + a + b + c + d || course.passed || 0;
                    const pct = total > 0 ? Math.round((passed / total) * 100) : parseFloat(course.pass_percentage || 0);

                    return {
                      name: course.course_details?.course_code || course.code || 'N/A',
                      pass: pct,
                      full_name: course.course_details?.course_name || course.course_full_name || 'N/A',
                      total: total,
                      passed: passed,
                      failed: e || course.failed || 0
                    };
                  });

                  const selectedCourse = chartData[selectedCourseIndex] || chartData[0];

                  return (
                    <Card className="shadow-sm rounded-2xl border border-slate-200 bg-white h-full flex flex-col justify-between overflow-hidden">
                      <div className="p-6 border-b border-slate-50">
                        <h2 className="font-extrabold text-slate-800 text-base font-sans">Course Pass Percentages</h2>
                      </div>
                      <CardContent className="p-6 flex flex-col justify-between flex-1">
                        <div className="h-64 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <RechartsBarChart data={chartData}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} domain={[0, 100]} />
                              <Tooltip 
                                cursor={{fill: '#f8fafc'}}
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} 
                              />
                              <Bar 
                                dataKey="pass" 
                                radius={[4, 4, 0, 0]} 
                                barSize={28}
                                onClick={(data, index) => setSelectedCourseIndex(index)}
                                cursor="pointer"
                              >
                                {chartData.map((entry, idx) => (
                                  <Cell 
                                    key={`cell-${idx}`} 
                                    fill={idx === selectedCourseIndex ? '#3b82f6' : '#0f172a'} 
                                  />
                                ))}
                              </Bar>
                            </RechartsBarChart>
                          </ResponsiveContainer>
                        </div>

                        {selectedCourse && (
                          <div className="mt-6 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                            <div className="flex justify-between items-center mb-2">
                              <div className="flex items-center gap-2">
                                <Info className="w-4 h-4 text-blue-500" />
                                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg uppercase">
                                  {selectedCourse.name}
                                </span>
                              </div>
                              <span className="text-xs font-semibold text-slate-500">
                                Pass Rate: <span className="text-emerald-600 font-bold">{selectedCourse.pass}%</span>
                              </span>
                            </div>
                            <p className="font-extrabold text-slate-800 text-xs leading-snug mt-1">
                              {selectedCourse.full_name}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })()}
              </div>

            </div>
          </div>
        )}

        {/* Currently Teaching */}
        {professor.course_assignments && professor.course_assignments.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <BookOpen className="w-8 h-8 text-primary-dark" />
              <h2 className="text-2xl font-bold text-primary-dark font-serif">Currently Teaching</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {professor.course_assignments.map((assignment) => {
                const course = assignment.course_details || {};
                return (
                  <Card key={assignment.id} className="border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full rounded-2xl overflow-hidden bg-slate-50/50">
                    <CardContent className="p-8 flex flex-col flex-1">
                      <div className="flex items-start gap-4 mb-6">
                        <div className={`w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 shadow-sm`}>
                          <BookOpen className={`w-7 h-7 text-blue-600`} />
                        </div>
                        <div>
                          <h3 className="font-bold text-primary-dark leading-tight mb-1">{course.course_name}</h3>
                          <p className="text-primary font-bold text-sm">{course.course_code}</p>
                        </div>
                      </div>
                      
                      <p className="text-sm text-slate-600 leading-relaxed mb-8 flex-1">
                        {course.description || "Currently conducting lectures and seminars for this academic program."}
                      </p>
                      
                      <div className="grid grid-cols-2 gap-4 border-t border-slate-200 pt-6">
                        <div>
                          <p className="text-[11px] font-bold text-slate-500 mb-1">Session</p>
                          <p className="font-bold text-slate-800 text-sm">{assignment.semester} {assignment.year}</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-slate-500 mb-1">Slot</p>
                          <p className="font-bold text-slate-800 text-sm">{assignment.slot}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Quote Section */}
        <div className="bg-blue-50 rounded-2xl p-8 md:p-12 border border-blue-100 flex items-center justify-center text-center">
          <div className="max-w-3xl flex flex-col items-center">
            <span className="text-5xl font-serif text-blue-300 leading-none h-8 block mb-2">"</span>
            <p className="text-xl md:text-2xl font-bold text-primary-dark leading-relaxed font-serif">
              {professor.quote?.replace(/"/g, '') || "Education is the most powerful weapon which you can use to change the world."}
            </p>
            <p className="mt-6 font-bold text-primary">– {profName}</p>
          </div>
        </div>

        {/* Comments Section */}
        <div className="mt-16 bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden mb-8">
          <div className="p-8 lg:p-12">
            <div className="flex items-center gap-3 mb-8">
              <MessageSquare className="w-8 h-8 text-primary-dark" />
              <h2 className="text-2xl font-bold text-primary-dark font-serif">Student Comments</h2>
            </div>

            {/* Comment Form */}
            {localStorage.getItem('user_id') ? (
              <form onSubmit={handleCommentSubmit} className="mb-10">
                {replyingTo && (
                  <div className="flex items-center justify-between bg-slate-100 p-3 rounded-t-xl border-x border-t border-slate-200">
                    <p className="text-sm text-slate-600">Replying to <span className="font-bold text-primary">{replyingTo.user_email || replyingTo.user_name}</span></p>
                    <button 
                      type="button" 
                      onClick={() => setReplyingTo(null)}
                      className="text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <span className="text-xs font-bold px-2 py-1 bg-white rounded-lg shadow-sm">Cancel Reply</span>
                    </button>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <textarea
                      value={newComment}
                      onChange={handleInputChange}
                      placeholder={replyingTo ? "Write your reply..." : "Share your experience with this professor..."}
                      className={`w-full min-h-[60px] p-3 text-sm border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none resize-none text-slate-700 ${replyingTo ? 'rounded-b-xl' : 'rounded-xl'}`}
                      required
                    />
                    {/* Typing Indicator Display */}
                    <div className="h-6 mt-1 px-1">
                      {Object.entries(typingUsers)
                        .filter(([_, isTyping]) => isTyping)
                        .map(([user]) => (
                          <div key={user} className="flex items-center gap-2 text-xs font-medium text-slate-400 italic animate-pulse">
                            <div className="flex gap-1">
                              <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                              <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                              <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce"></span>
                            </div>
                            {user} is typing...
                          </div>
                        ))}
                    </div>
                  </div>
                  <div className="sm:self-end">
                    <Button type="submit" className="w-full sm:w-auto px-6 py-3 h-auto rounded-xl flex items-center justify-center gap-2 font-bold text-sm">
                      <span>Post Comment</span>
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="mb-10 p-6 bg-slate-50 rounded-2xl border border-slate-100 border-dashed text-center">
                <p className="text-slate-600 font-medium mb-4">Please login to share your experience with this professor.</p>
                <Link to="/login">
                  <Button variant="outline" className="rounded-full px-8 font-bold border-primary text-primary hover:bg-primary/5">
                    Login to Comment
                  </Button>
                </Link>
              </div>
            )}

            {/* Comments List */}
            <div className="space-y-6">
              {comments.length === 0 ? (
                <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                  No comments yet. Be the first to share your experience!
                </div>
              ) : (
                comments
                  .filter(c => !c.parent) // Only root comments first
                  .map((comment) => {
                    const replies = comments.filter(r => r.parent === comment.id);
                    return (
                      <div key={comment.id} className="space-y-4">
                        {/* Parent Comment */}
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex gap-4">
                          <UserCircle className="w-8 h-8 text-slate-400 shrink-0" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <span className="font-bold text-slate-800 text-sm">{comment.is_anonymous ? 'Anonymous' : (comment.user_email || 'Current Student')}</span>
                                <span className="text-[10px] font-medium text-slate-500">{new Date(comment.created_at || Date.now()).toLocaleDateString()}</span>
                              </div>
                              {localStorage.getItem('user_id') && (
                                <button 
                                  onClick={() => {
                                    setReplyingTo(comment);
                                    window.scrollTo({ top: document.querySelector('form')?.offsetTop - 100, behavior: 'smooth' });
                                  }}
                                  className="text-[10px] font-bold text-primary hover:text-primary-dark flex items-center gap-1 bg-white px-2 py-1 rounded-full shadow-sm hover:shadow-md transition-all"
                                >
                                  <MessageSquare className="w-3 h-3" /> Reply
                                </button>
                              )}
                            </div>
                            <p className="text-slate-600 text-sm leading-relaxed">
                              {comment.content}
                            </p>
                          </div>
                        </div>

                        {/* Replies */}
                        {replies.length > 0 && (
                          <div className="ml-10 space-y-3 border-l-2 border-slate-100 pl-4">
                            {replies.map(reply => (
                              <div key={reply.id} className="bg-white rounded-xl p-3 border border-slate-100 flex gap-3 shadow-sm">
                                <UserCircle className="w-6 h-6 text-slate-300 shrink-0" />
                                <div>
                                  <div className="flex items-center gap-3 mb-0.5">
                                    <span className="font-bold text-slate-700 text-[13px]">{reply.is_anonymous ? 'Anonymous' : (reply.user_email || 'Current Student')}</span>
                                    <span className="text-[9px] font-medium text-slate-400">{new Date(reply.created_at || Date.now()).toLocaleDateString()}</span>
                                  </div>
                                  <p className="text-slate-600 text-[13px] leading-relaxed">
                                    {reply.content}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
