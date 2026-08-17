import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { completedCoursesApi } from '../../services/api';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { 
  ArrowLeft, 
  Users, 
  TrendingUp, 
  Calendar, 
  Clock, 
  Award,
  BookOpen,
  AlertTriangle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

export function PublicCourseAnalysis() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCourseAnalysis();
  }, [id]);

  const fetchCourseAnalysis = async () => {
    try {
      setLoading(true);
      const data = await completedCoursesApi.getById(id);
      setCourse(data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch course analysis', err);
      setError('Could not load course analysis data. Please try again later.');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[500px] gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-slate-500 font-medium text-sm">Generating course analysis report...</p>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="max-w-md mx-auto p-8 text-center bg-white rounded-3xl border border-slate-100 shadow-xl mt-24 mb-24 space-y-4">
        <AlertTriangle className="w-16 h-16 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">Analysis Load Failed</h2>
        <p className="text-slate-500 text-sm leading-relaxed">{error || "The requested completed course record could not be found."}</p>
        <Button onClick={() => navigate(-1)} className="w-full bg-primary-dark text-white font-bold py-3 mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  // Calculate stats
  const s = course.s_grades || 0;
  const a = course.a_grades || 0;
  const b = course.b_grades || 0;
  const c = course.c_grades || 0;
  const d = course.d_grades || 0;
  const e = course.e_grades || 0;
  const f = course.fail_grades || 0;
  
  const totalStudents = s + a + b + c + d + e + f || course.total_students || course.members || 0;
  const passed = s + a + b + c + d + e;
  const failed = f;
  const passPct = totalStudents > 0 ? Math.round((passed / totalStudents) * 100) : parseFloat(course.pass_percentage || 0);

  // Grade chart data
  const gradeData = [
    { name: 'S Grade', count: s, fill: '#10B981' },
    { name: 'A Grade', count: a, fill: '#3B82F6' },
    { name: 'B Grade', count: b, fill: '#6366F1' },
    { name: 'C Grade', count: c, fill: '#8B5CF6' },
    { name: 'D Grade', count: d, fill: '#EC4899' },
    { name: 'E Grade', count: e, fill: '#F59E0B' },
    { name: 'F Grade', count: f, fill: '#EF4444' }
  ];

  // Filters out grades with 0 count for pie chart to keep it clean
  const pieData = gradeData.filter(g => g.count > 0);

  // Get performance tier & recommendation
  let performanceTier = 'Good';
  let tierColor = 'text-amber-500 bg-amber-50';
  let recommendation = 'The course shows sound performance. Keep monitoring student participation to bridge minor learning gaps.';
  
  if (passPct >= 90) {
    performanceTier = 'Excellent';
    tierColor = 'text-emerald-600 bg-emerald-50';
    recommendation = 'Exceptional performance rate! The curriculum structure and teaching methodologies have yielded top tier results. Consider documenting these strategies for faculty sharing.';
  } else if (passPct < 70) {
    performanceTier = 'Needs Improvement';
    tierColor = 'text-rose-500 bg-rose-50';
    recommendation = 'The passing rate is below target. It is recommended to organize remedial sessions earlier, conduct weekly concept checkpoints, and review the mid-term assessment difficulty.';
  }

  const teacherName = course.teacher_details 
    ? `Dr. ${course.teacher_details.first_name} ${course.teacher_details.last_name}` 
    : 'Faculty Member';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-800 rounded-2xl shadow-sm transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full uppercase tracking-wider">Course Performance Report</span>
              <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{course.course_details?.course_code || course.code}</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-800 font-serif mt-1">
              {course.course_details?.course_name || course.course_full_name}
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Taught by <span className="text-primary font-bold">{teacherName}</span></p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <div className="bg-white border border-slate-200 px-4 py-2.5 rounded-2xl flex items-center gap-2.5 shadow-sm text-xs font-semibold text-slate-600">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>Slot: <span className="text-primary font-bold">{course.slot || 'N/A'}</span></span>
          </div>
          <div className="bg-white border border-slate-200 px-4 py-2.5 rounded-2xl flex items-center gap-2.5 shadow-sm text-xs font-semibold text-slate-600">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>Completed: <span className="font-bold">{course.completion_date ? new Date(course.completion_date).toLocaleDateString() : 'N/A'}</span></span>
          </div>
        </div>
      </div>

      {/* Main Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Metric Cards */}
        <Card className="hover:shadow-md transition-shadow lg:col-span-1 rounded-2xl">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Class Size</p>
              <p className="text-3xl font-bold text-slate-800">{totalStudents}</p>
              <p className="text-[10px] text-slate-500 font-semibold mt-1">Total Registered Students</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow lg:col-span-1 rounded-2xl">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Pass Rate</p>
              <p className="text-3xl font-bold text-emerald-600">{passPct}%</p>
              <p className="text-[10px] text-slate-500 font-semibold mt-1">Students Passed Exam</p>
            </div>
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow lg:col-span-1 rounded-2xl">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Passed / Failed</p>
              <p className="text-2xl font-bold text-slate-800">
                <span className="text-emerald-600">{passed}</span>
                <span className="text-slate-300 mx-1.5">/</span>
                <span className="text-rose-500">{failed}</span>
              </p>
              <p className="text-[10px] text-slate-500 font-semibold mt-1">Student Outcomes Breakdown</p>
            </div>
            <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center">
              <Award className="w-6 h-6 text-rose-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow lg:col-span-1 rounded-2xl">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Exam Format</p>
              <p className="text-xl font-bold text-slate-800 truncate max-w-[130px]">{course.exam_type || 'Final Exam'}</p>
              <p className="text-[10px] text-slate-500 font-semibold mt-1">Method of Assessment</p>
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visual Charts and Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Grade Distribution Bar Chart */}
        <Card className="shadow-sm lg:col-span-2 rounded-2xl">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between">
            <h2 className="font-bold text-slate-800 font-serif text-base">Grade Distribution Breakdown</h2>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bar Chart</span>
          </div>
          <CardContent className="p-6">
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gradeData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} 
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={40}>
                    {gradeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Grade Share (Pie) */}
        <Card className="shadow-sm lg:col-span-1 rounded-2xl">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between">
            <h2 className="font-bold text-slate-800 font-serif text-base">Grade Contribution Share</h2>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pie Chart</span>
          </div>
          <CardContent className="p-6 flex flex-col justify-between h-[340px]">
            {pieData.length > 0 ? (
              <>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="count"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-2">
                  {pieData.map((entry) => (
                    <div key={entry.name} className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.fill }}></div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase">{entry.name.charAt(0)}: {entry.count}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <AlertTriangle className="w-8 h-8 mb-2" />
                <p className="text-sm">No grades recorded to analyze share</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Grade Table & Strategic Insights Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Detailed Grade Table */}
        <Card className="shadow-sm lg:col-span-1 rounded-2xl">
          <div className="p-6 border-b border-slate-50">
            <h2 className="font-bold text-slate-800 font-serif text-base">Outcome Table</h2>
          </div>
          <CardContent className="p-0">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-55/55 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="p-4 pl-6">Grade</th>
                  <th className="p-4 text-center">Students</th>
                  <th className="p-4 text-right pr-6">Percentage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {gradeData.map((g) => {
                  const percent = totalStudents > 0 ? Math.round((g.count / totalStudents) * 100) : 0;
                  return (
                    <tr key={g.name} className="hover:bg-slate-50/20 text-xs font-semibold text-slate-600">
                      <td className="p-3 pl-6 flex items-center gap-2.5">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: g.fill }}></div>
                        <span className="font-bold text-slate-700">{g.name}</span>
                      </td>
                      <td className="p-3 text-center font-bold text-slate-800">{g.count}</td>
                      <td className="p-3 text-right pr-6 font-bold text-slate-500">{percent}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Teaching Recommendations & Analysis */}
        <Card className="shadow-sm lg:col-span-2 rounded-2xl">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between">
            <h2 className="font-bold text-slate-800 font-serif text-base">Academic Review & Recommendations</h2>
            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${tierColor}`}>
              {performanceTier}
            </span>
          </div>
          <CardContent className="p-6 space-y-6">
            <div>
              <h4 className="font-bold text-slate-800 text-sm mb-2">Teaching Methodology Evaluation</h4>
              <p className="text-slate-600 text-sm leading-relaxed">
                Based on the grade metrics, {passed} students successfully completed the course requirements out of {totalStudents} total enrolled. 
                {failed > 0 
                  ? `There were ${failed} student failures (${Math.round((failed/totalStudents)*100)}% of the class), indicating specific conceptual barriers in the syllabus that should be evaluated.`
                  : "The class achieved a perfect pass-through rate, indicating that students met the course performance benchmarks successfully."
                }
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2 flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-600" />
                Strategic Insights for Future Semesters
              </h4>
              <p className="text-slate-600 text-sm leading-relaxed">
                {recommendation}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
