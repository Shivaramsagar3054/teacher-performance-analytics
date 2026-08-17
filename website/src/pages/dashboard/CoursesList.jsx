import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/Card';
import { courseTeachersApi, completedCoursesApi, coursesApi } from '../../services/api';
import { MoreVertical, Users, Clock, X, CheckCircle, BarChart3, GraduationCap, Edit2, Trash2, Plus, BookOpen, Search, Check } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import toast from 'react-hot-toast';

export function CoursesList() {
  const [activeTab, setActiveTab] = useState('active');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  
  const [activeCoursesList, setActiveCoursesList] = useState([]);
  const [completedCoursesList, setCompletedCoursesList] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Suggestion state
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);

  useEffect(() => {
    fetchCourses();
    fetchAllCourses();
  }, []);

  const fetchCourses = () => {
    const teacherId = localStorage.getItem('teacher_id');
    if (!teacherId) return;

    setLoading(true);
    Promise.all([
      courseTeachersApi.getAll({ teacher_id: teacherId }),
      completedCoursesApi.getAll({ teacher_id: teacherId })
    ]).then(([activeData, completedData]) => {
      setActiveCoursesList(activeData.results || (Array.isArray(activeData) ? activeData : []));
      setCompletedCoursesList(completedData.results || (Array.isArray(completedData) ? completedData : []));
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  };

  const fetchAllCourses = async () => {
    try {
      const data = await coursesApi.getAll();
      setAllCourses(data.results || (Array.isArray(data) ? data : []));
    } catch (err) {
      console.error('Failed to fetch master courses list', err);
    }
  };

  const [formData, setFormData] = useState({
    status: 'active',
    courseName: '',
    courseCode: '',
    department: 'Academic',
    description: '',
    slot: '',
    exam_type: 'Final Exam',
    completion_date: new Date().toISOString().split('T')[0],
    s_grades: 0,
    a_grades: 0,
    b_grades: 0,
    c_grades: 0,
    d_grades: 0,
    e_grades: 0,
    f_grades: 0
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'courseCode') {
      const filtered = allCourses.filter(c => 
        c.course_code.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(true);
    }
  };

  const selectCourse = (course) => {
    setFormData(prev => ({
      ...prev,
      courseName: course.course_name,
      courseCode: course.course_code,
      department: course.department,
      description: course.description,
      slot: course.slot
    }));
    setShowSuggestions(false);
  };

  const resetForm = () => {
    setFormData({
      status: activeTab,
      courseName: '', courseCode: '',
      department: 'Academic', description: '',
      slot: '',
      exam_type: 'Final Exam', completion_date: new Date().toISOString().split('T')[0],
      s_grades: 0, a_grades: 0, b_grades: 0, c_grades: 0, d_grades: 0, e_grades: 0, f_grades: 0
    });
    setEditingRecord(null);
    setIsModalOpen(false);
    setShowSuggestions(false);
  };

  const handleEdit = (record, type) => {
    setEditingRecord(record);
    if (type === 'active') {
      const course = record.course_details || {};
      setFormData({
        status: 'active',
        courseName: course.course_name || '',
        courseCode: course.course_code || '',
        department: course.department || 'Academic',
        description: course.description || '',
        slot: record.slot || course.slot || '',
        exam_type: 'Final Exam',
        completion_date: new Date().toISOString().split('T')[0],
        s_grades: 0, a_grades: 0, b_grades: 0, c_grades: 0, d_grades: 0, e_grades: 0, f_grades: 0
      });
    } else {
      setFormData({
        status: 'completed',
        courseName: record.course_full_name || '',
        courseCode: record.course_details?.course_code || record.code || '',
        department: record.course_details?.department || 'Academic',
        description: record.course_details?.description || '',
        slot: record.slot || '',
        exam_type: record.exam_type || 'Final Exam',
        completion_date: record.completion_date || new Date().toISOString().split('T')[0],
        s_grades: record.s_grades || 0,
        a_grades: record.a_grades || 0,
        b_grades: record.b_grades || 0,
        c_grades: record.c_grades || 0,
        d_grades: record.d_grades || 0,
        e_grades: record.e_grades || 0,
        f_grades: record.fail_grades || 0
      });
    }
    setIsModalOpen(true);
  };

  const handleDelete = (id, type) => {
    if(window.confirm('Are you sure you want to delete this record?')) {
      const api = type === 'active' ? courseTeachersApi : completedCoursesApi;
      api.delete(id).then(() => {
        toast.success('Record deleted successfully!');
        fetchCourses();
      }).catch((err) => {
        console.error(err);
        toast.error('Failed to delete record.');
      });
    }
  };

  const handleSaveCourse = async (e) => {
    e.preventDefault();
    const teacherId = localStorage.getItem('teacher_id');
    if (!teacherId) return;

    if (!formData.courseCode || !formData.courseName || !formData.department || !formData.slot) {
      toast.error('Please fill in all required fields.');
      return;
    }

    if (formData.status === 'completed' && !formData.completion_date) {
      toast.error('Please select a completion date for past courses.');
      return;
    }

    try {
      setLoading(true);
      
      if (editingRecord) {
        // Edit Mode
        const courseId = editingRecord.course_details?.id || editingRecord.course;
        if (courseId) {
          // Update master course fields
          await coursesApi.patch(courseId, {
            course_name: formData.courseName,
            course_code: formData.courseCode,
            department: formData.department,
            description: formData.description || `Automatically updated for ${formData.courseName}`,
            slot: formData.slot.substring(0, 3)
          });
        }

        if (formData.status === 'active') {
          const payload = {
            slot: formData.slot
          };
          await courseTeachersApi.patch(editingRecord.id, payload);
        } else {
          const payload = {
            course_full_name: formData.courseName,
            exam_type: formData.exam_type,
            completion_date: formData.completion_date,
            slot: formData.slot,
            s_grades: formData.s_grades,
            a_grades: formData.a_grades,
            b_grades: formData.b_grades,
            c_grades: formData.c_grades,
            d_grades: formData.d_grades,
            e_grades: formData.e_grades,
            fail_grades: formData.f_grades
          };
          await completedCoursesApi.patch(editingRecord.id, payload);
        }
      } else {
        // Create Mode
        let courseId = null;
        const existing = allCourses.find(c => 
          c.course_code.toLowerCase() === formData.courseCode.toLowerCase()
        );
        
        if (existing) {
          courseId = existing.id;
        } else {
          const newCourse = await coursesApi.create({
            course_name: formData.courseName,
            course_code: formData.courseCode,
            department: formData.department,
            description: formData.description || `Automatically created for ${formData.courseName}`,
            slot: formData.slot.substring(0, 3)
          });
          courseId = newCourse.id;
          setAllCourses([...allCourses, newCourse]);
        }

        if (formData.status === 'active') {
          const payload = {
            teacher: teacherId,
            course: courseId,
            is_current: true,
            slot: formData.slot
          };
          await courseTeachersApi.create(payload);
        } else {
          const payload = {
            teacher: teacherId,
            course: courseId,
            course_full_name: formData.courseName,
            exam_type: formData.exam_type,
            completion_date: formData.completion_date,
            slot: formData.slot,
            s_grades: formData.s_grades,
            a_grades: formData.a_grades,
            b_grades: formData.b_grades,
            c_grades: formData.c_grades,
            d_grades: formData.d_grades,
            e_grades: formData.e_grades,
            fail_grades: formData.f_grades
          };
          await completedCoursesApi.create(payload);
        }
      }
      
      toast.success('Course record saved successfully!');
      fetchCourses();
      resetForm();
    } catch (err) {
      console.error('Failed to save course', err);
      toast.error('Error saving course details. Please check your inputs and try again.');
      setLoading(false);
    }
  };

  if (loading && activeCoursesList.length === 0) return <div className="p-12 text-center text-slate-500 font-medium">Loading courses...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800 font-serif">Course Management</h1>
        <Button onClick={() => { setFormData(p => ({...p, status: activeTab})); setIsModalOpen(true); }} className="gap-2 shadow-xl bg-primary hover:bg-primary-dark">
          <Plus className="w-4 h-4" /> Add Record
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 border-b border-slate-200">
        <button onClick={() => setActiveTab('active')} className={`py-3 px-6 font-bold text-sm border-b-2 transition-all ${activeTab === 'active' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Active Courses</button>
        <button onClick={() => setActiveTab('completed')} className={`py-3 px-6 font-bold text-sm border-b-2 transition-all ${activeTab === 'completed' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>History</button>
      </div>
      
      {/* Tables (Same as before, showing Active tab as example) */}
      {activeTab === 'active' && (
        <Card className="shadow-sm overflow-hidden rounded-2xl">
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] text-slate-400 uppercase font-bold tracking-widest">
                  <th className="p-4 whitespace-nowrap">Course</th>
                  <th className="p-4">Department</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Slot</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeCoursesList.map((assignment) => {
                  const course = assignment.course_details || {};
                  return (
                    <tr key={assignment.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                            <BookOpen className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 leading-tight">{course.course_name}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{course.course_code}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-slate-600 font-medium">{course.department}</td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                          {assignment.is_current ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-4"><span className="font-bold text-primary">{course.slot || assignment.slot || 'N/A'}</span></td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button 
                            onClick={() => handleEdit(assignment, 'active')} 
                            className="text-slate-300 hover:text-primary p-2 cursor-pointer transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(assignment.id, 'active')} 
                            className="text-slate-300 hover:text-red-500 p-2 cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Completed Courses Table (Same as before) */}
      {activeTab === 'completed' && (
        <Card className="shadow-sm overflow-hidden rounded-2xl">
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] text-slate-400 uppercase font-bold tracking-widest">
                  <th className="p-4 whitespace-nowrap">Course History</th>
                  <th className="p-4 text-center">Total Students</th>
                  <th className="p-4 text-center">Passed / Failed</th>
                  <th className="p-4 text-center">Pass %</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {completedCoursesList.map((course) => {
                  const s = course.s_grades || 0;
                  const a = course.a_grades || 0;
                  const b = course.b_grades || 0;
                  const c = course.c_grades || 0;
                  const d = course.d_grades || 0;
                  const e = course.e_grades || 0;
                  const total = s + a + b + c + d + e + (course.fail_grades || 0);
                  const passed = s + a + b + c + d + e;
                  const failed = course.fail_grades || 0;
                  const passPct = total > 0 ? Math.round((passed / total) * 100) : 0;
                  return (
                    <tr key={course.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                            <CheckCircle className="w-5 h-5 text-emerald-500" />
                          </div>
                          <div>
                            {course.id ? (
                              <Link 
                                to={`/dashboard/courses/${course.id}/analysis`}
                                className="font-bold text-slate-800 leading-tight hover:text-primary transition-colors cursor-pointer block"
                              >
                                {course.course_full_name}
                              </Link>
                            ) : (
                              <p className="font-bold text-slate-800 leading-tight">{course.course_full_name}</p>
                            )}
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{course.course_details?.course_code || 'N/A'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-center font-bold text-slate-700">{total}</td>
                      <td className="p-4">
                        <div className="flex flex-col items-center">
                          <div className="flex gap-2 text-xs font-bold"><span className="text-emerald-600">P: {passed}</span><span className="text-red-500">F: {failed}</span></div>
                          <div className="w-24 h-1 bg-slate-100 rounded-full mt-2 overflow-hidden"><div className="h-full bg-emerald-500" style={{ width: `${passPct}%` }}></div></div>
                        </div>
                      </td>
                      <td className="p-4 text-center"><div className="w-10 h-10 rounded-full border-2 border-emerald-500 flex items-center justify-center text-xs font-bold text-emerald-700">{passPct}%</div></td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button 
                            onClick={() => handleEdit(course, 'completed')} 
                            className="text-slate-300 hover:text-primary p-2 cursor-pointer transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(course.id, 'completed')} 
                            className="text-slate-300 hover:text-red-500 p-2 cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Improved Create Course Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-100 animate-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between p-10 border-b border-slate-50">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 font-serif">{editingRecord ? 'Edit Course Record' : 'Add New Entry'}</h2>
                <p className="text-sm text-slate-500 mt-1">{editingRecord ? 'Modify the course record details below.' : 'Start by typing a course code to see suggestions.'}</p>
              </div>
              <button onClick={resetForm} className="bg-slate-100 p-2 rounded-full text-slate-400 hover:text-slate-600 transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-10 overflow-y-auto flex-grow">
              <form id="course-form" onSubmit={handleSaveCourse} className="space-y-8">
                
                {/* Status Toggle */}
                <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                  {['active', 'completed'].map(s => (
                    <button key={s} type="button" onClick={() => setFormData(p => ({...p, status: s}))} className={`flex-1 py-3 px-6 rounded-xl text-sm font-bold transition-all ${formData.status === s ? 'bg-white text-primary shadow-sm' : 'text-slate-500'}`}>{s === 'active' ? 'Active Courses' : 'Past History'}</button>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Course Code with Autocomplete */}
                  <div className="col-span-1 space-y-1.5 relative">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Course Code</label>
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                      <input 
                        required type="text" name="courseCode" value={formData.courseCode} onChange={handleInputChange} autoComplete="off"
                        className="w-full pl-11 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-sm font-bold"
                        placeholder="e.g. CS101"
                      />
                    </div>
                    
                    {showSuggestions && filteredSuggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 z-[60] py-2 max-h-48 overflow-y-auto">
                        {filteredSuggestions.map(c => (
                          <button key={c.id} type="button" onClick={() => selectCourse(c)} className="w-full flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors text-left border-b border-slate-50 last:border-0">
                            <div>
                              <p className="text-sm font-bold text-slate-800">{c.course_code}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase">{c.course_name}</p>
                            </div>
                            <div className="w-6 h-6 bg-emerald-50 rounded-full flex items-center justify-center">
                              <Plus className="w-3 h-3 text-emerald-600" />
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="col-span-1 space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Course Name</label>
                    <input 
                      required type="text" name="courseName" value={formData.courseName} onChange={handleInputChange}
                      className="w-full px-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-sm font-bold"
                      placeholder="e.g. Intro to Programming"
                    />
                  </div>

                  <div className="col-span-2 space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Description</label>
                    <textarea 
                      name="description" value={formData.description} onChange={handleInputChange}
                      className="w-full px-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-sm font-bold h-24"
                      placeholder="Enter course description..."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Department</label>
                    <input 
                      required type="text" name="department" value={formData.department} onChange={handleInputChange}
                      className="w-full px-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-sm font-bold"
                      placeholder="e.g. Computer Science"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Slot</label>
                    <input 
                      required type="text" name="slot" value={formData.slot} onChange={handleInputChange}
                      className="w-full px-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-sm font-bold"
                      placeholder="e.g. A1"
                    />
                  </div>

                  {formData.status === 'completed' && (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Completion Date</label>
                        <input type="date" name="completion_date" value={formData.completion_date} onChange={handleInputChange} className="w-full px-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none text-sm font-bold" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Exam Type</label>
                        <input type="text" name="exam_type" value={formData.exam_type} onChange={handleInputChange} className="w-full px-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none text-sm font-bold" placeholder="e.g. Semester End" />
                      </div>
                      <div className="col-span-2 bg-slate-50 p-8 rounded-3xl border border-slate-100">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 text-center">Grade Distribution</label>
                        <div className="grid grid-cols-6 gap-3">
                          {['s', 'a', 'b', 'c', 'd', 'e', 'f'].map(g => (
                            <div key={g} className="flex flex-col items-center gap-2">
                              <span className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-[10px] font-bold text-slate-400 shadow-sm ring-1 ring-slate-100 uppercase">{g}</span>
                              <input type="number" name={`${g}_grades`} value={formData[`${g}_grades`]} onChange={handleInputChange} className="w-full text-center py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-sm font-bold" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </form>
            </div>

            <div className="p-10 border-t border-slate-50 bg-slate-50/30 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={resetForm} className="px-8 rounded-xl py-6 border-slate-200">Cancel</Button>
              <Button type="submit" disabled={loading} form="course-form" className="px-12 bg-primary-dark text-white hover:bg-slate-800 rounded-xl py-6 shadow-xl shadow-primary/30">
                {loading ? 'Processing...' : editingRecord ? 'Update Record' : 'Confirm Record'}
              </Button>
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
}
