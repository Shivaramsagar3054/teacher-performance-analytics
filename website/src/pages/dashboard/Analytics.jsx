import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/Card';
import { Users, BookOpen, Percent, TrendingUp, AlertCircle } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { courseTeachersApi, teachersApi } from '../../services/api';

export function Analytics() {
  const COLORS = ['#1E3A8A', '#FACC15', '#10B981', '#F43F5E'];
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeCourses: 0,
    averagePassPercentage: '0.0',
    performanceChange: '+0%'
  });
  const [performanceData, setPerformanceData] = useState([]);
  const [completedCourses, setCompletedCourses] = useState([]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const teacherId = localStorage.getItem('teacher_id');
      if (!teacherId) return;

      const [teacher, coursesData] = await Promise.all([
        teachersApi.getById(teacherId),
        courseTeachersApi.getAll({ teacher_id: teacherId })
      ]);

      const courses = coursesData.results || (Array.isArray(coursesData) ? coursesData : []);
      const completedList = teacher.completed_courses || [];

      // Calculate stats
      const activeCount = courses.filter(c => c.is_current).length;

      // Calculate average pass percentage
      const avgPassPercentage = completedList.length > 0
        ? (completedList.reduce((acc, c) => acc + parseFloat(c.pass_percentage || 0), 0) / completedList.length).toFixed(1)
        : '0.0';

      // Extract performance data from completed courses if available
      const perfData = completedList.map(c => ({
        name: (c.course_full_name || c.name || '').substring(0, 10) + '...',
        pass: parseFloat(c.pass_percentage || 0)
      })) || [];

      setStats({
        totalStudents: completedList.reduce((acc, c) => {
          const s = c.s_grades || 0;
          const a = c.a_grades || 0;
          const b = c.b_grades || 0;
          const c_gr = c.c_grades || 0;
          const d = c.d_grades || 0;
          const e = c.e_grades || 0;
          const calculatedTotal = s + a + b + c_gr + d + e;
          return acc + (calculatedTotal || c.total_students || c.members || 0);
        }, 0),
        activeCourses: activeCount,
        averagePassPercentage: avgPassPercentage,
        performanceChange: '+5.4%' // Mocked for now
      });

      setPerformanceData(perfData);
      setCompletedCourses(completedList);
      
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch analytics', err);
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 font-serif">Performance Analytics</h1>
          <p className="text-slate-500 text-sm">Real-time overview of your teaching metrics</p>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Students</p>
              <p className="text-3xl font-bold text-slate-800">{stats.totalStudents}</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Active Courses</p>
              <p className="text-3xl font-bold text-slate-800">{stats.activeCourses}</p>
            </div>
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-amber-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Avg Pass Percentage</p>
              <p className="text-3xl font-bold text-slate-800">{stats.averagePassPercentage}%</p>
            </div>
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
              <Percent className="w-6 h-6 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Semester Growth</p>
              <p className="text-3xl font-bold text-slate-800">{stats.performanceChange}</p>
            </div>
            <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-rose-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Chart */}
        <Card className="shadow-sm">
          <div className="p-6 border-b border-slate-50">
            <h2 className="font-bold text-slate-800 font-serif">Course Pass Percentages</h2>
          </div>
          <CardContent className="p-6">
            <div className="h-80 w-full">
              {performanceData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                    <Tooltip 
                      cursor={{fill: '#f8fafc'}}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} 
                    />
                    <Bar dataKey="pass" fill="#1E3A8A" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <AlertCircle className="w-8 h-8 mb-2" />
                  <p>No performance data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pass Rate Distribution Pie Chart */}
        {(() => {
          const coursesWithPassPct = completedCourses.map(c => {
            const s = c.s_grades || 0;
            const a = c.a_grades || 0;
            const b = c.b_grades || 0;
            const c_gr = c.c_grades || 0;
            const d = c.d_grades || 0;
            const e = c.e_grades || 0;
            const f = c.fail_grades || 0;
            const total = s + a + b + c_gr + d + e + f || c.total_students || c.members || 0;
            const passed = s + a + b + c_gr + d + e;
            const pct = total > 0 ? (passed / total) * 100 : parseFloat(c.pass_percentage || 0);
            return pct;
          });

          const totalCoursesCount = coursesWithPassPct.length;
          let excellentCount = 0;
          let goodCount = 0;
          let below75Count = 0;

          coursesWithPassPct.forEach(pct => {
            if (pct >= 90) excellentCount++;
            else if (pct >= 75) goodCount++;
            else below75Count++;
          });

          const excellentPct = totalCoursesCount > 0 ? Math.round((excellentCount / totalCoursesCount) * 100) : 0;
          const goodPct = totalCoursesCount > 0 ? Math.round((goodCount / totalCoursesCount) * 100) : 0;
          const below75Pct = totalCoursesCount > 0 ? Math.round((below75Count / totalCoursesCount) * 100) : 0;

          const distributionData = [
            { name: 'Excellent (90% - 100%)', value: excellentCount || (totalCoursesCount === 0 ? 1 : 0), displayPct: excellentPct, fill: '#0f172a' },
            { name: 'Good (75% - 90%)', value: goodCount || (totalCoursesCount === 0 ? 1 : 0), displayPct: goodPct, fill: '#3b82f6' },
            { name: 'Below 75%', value: below75Count || (totalCoursesCount === 0 ? 1 : 0), displayPct: below75Pct, fill: '#94a3b8' }
          ];

          return (
            <Card className="shadow-sm rounded-3xl border border-slate-200 bg-white">
              <div className="p-6 border-b border-slate-50">
                <h2 className="font-extrabold text-slate-800 text-lg tracking-tight">Pass Rate Distribution</h2>
              </div>
              <CardContent className="p-6 flex flex-col justify-between">
                <div className="relative h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={distributionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={95}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {distributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
                    <span className="text-4xl font-black text-slate-800">{stats.averagePassPercentage}%</span>
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Average Pass</span>
                  </div>
                </div>

                <div className="space-y-4 mt-6">
                  {distributionData.map((item) => (
                    <div key={item.name} className="flex justify-between items-center text-sm font-semibold text-slate-600">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: item.fill }}></div>
                        <span>{item.name}</span>
                      </div>
                      <span className="text-slate-800 font-bold">{totalCoursesCount > 0 ? `${item.displayPct}%` : '0%'}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })()}
      </div>
    </div>
  );
}
