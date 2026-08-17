import React, { useState, useEffect } from 'react';
import { MapPin, Mail, Phone, BookOpen, Edit, Save, X, Briefcase, Trash2, Plus, TrendingUp } from 'lucide-react';
import { teachersApi, educationApi, researchInterestsApi, getBaseUrl } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import toast from 'react-hot-toast';
export function Profile() {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [formData, setFormData] = useState(null);

  // Education Form State
  const [isAddingEdu, setIsAddingEdu] = useState(false);
  const [editingEdu, setEditingEdu] = useState(null);
  const [eduFormData, setEduFormData] = useState({
    degree: '',
    field_of_study: '',
    institution_name: '',
    university_name: '',
    start_year: '',
    end_year: '',
    gradeOrCgpa: ''
  });

  // Research Topic State
  const [newResearchTopic, setNewResearchTopic] = useState('');
  const [isAddingResearch, setIsAddingResearch] = useState(false);
  const [editingResearch, setEditingResearch] = useState(null);
  const [editResearchTopic, setEditResearchTopic] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const teacherId = localStorage.getItem('teacher_id');
      if (!teacherId) {
        navigate('/dashboard/setup-profile');
        return;
      }
      const data = await teachersApi.getById(teacherId);
      setProfileData(data);
      setFormData(data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch profile', err);
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getImageUrl = (path) => {
    if (!path) return 'https://via.placeholder.com/150';
    if (path instanceof File) return URL.createObjectURL(path);
    if (path.startsWith('http')) return path;
    let cleanPath = path.startsWith('/') ? path : `/${path}`;
    if (!cleanPath.startsWith('/media/')) {
      cleanPath = `/media${cleanPath}`;
    }
    return `${getBaseUrl()}${cleanPath}`;
  };

  const handleSave = async () => {
    if (!formData.first_name || !formData.last_name || !formData.department || !formData.position || !formData.phone_number || !formData.location || !formData.years_of_experience || !formData.biography) {
      toast.error('Please fill in all required fields.');
      return;
    }

    const phoneRegex = /^\+?[0-9\s\-\(\)]+$/;
    if (!phoneRegex.test(formData.phone_number)) {
      toast.error('Please enter a valid phone number.');
      return;
    }

    try {
      setLoading(true);
      const teacherId = localStorage.getItem('teacher_id');
      
      const uploadData = new FormData();
      Object.keys(formData).forEach(key => {
        // Skip relational fields for simple patch, or handle them separately
        if (['education_list', 'completed_courses', 'research_interests', 'user'].includes(key)) return;
        
        if (key === 'profile_image' && typeof formData[key] === 'string') return;
        
        if (formData[key] !== null && formData[key] !== undefined) {
           uploadData.append(key, formData[key]);
        }
      });

      const updated = await teachersApi.patch(teacherId, uploadData);
      setProfileData(updated);
      setFormData(updated);
      setIsEditing(false);
      setLoading(false);
      // Update localStorage too
      localStorage.setItem('teacherProfile', JSON.stringify(updated));
      toast.success('Profile updated successfully!');
    } catch (err) {
      console.error('Failed to update profile', err);
      toast.error('Failed to update profile.');
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete your profile? This cannot be undone.')) {
      try {
        setLoading(true);
        const teacherId = localStorage.getItem('teacher_id');
        await teachersApi.delete(teacherId);
        localStorage.removeItem('teacher_id');
        localStorage.removeItem('teacherProfile');
        navigate('/dashboard/setup-profile');
      } catch (err) {
        console.error('Failed to delete profile', err);
        alert('Failed to delete profile.');
        setLoading(false);
      }
    }
  };

  const handleCancel = () => {
    setFormData(profileData);
    setIsEditing(false);
  };

  const handleEduInputChange = (e) => {
    const { name, value } = e.target;
    setEduFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOpenAddEdu = () => {
    setEditingEdu(null);
    setEduFormData({
      degree: '',
      field_of_study: '',
      institution_name: '',
      university_name: '',
      start_year: '',
      end_year: '',
      gradeOrCgpa: ''
    });
    setIsAddingEdu(prev => !prev);
  };

  const handleOpenEditEdu = (edu) => {
    setEditingEdu(edu);
    setEduFormData({
      degree: edu.degree || '',
      field_of_study: edu.field_of_study || '',
      institution_name: edu.institution_name || '',
      university_name: edu.university_name || edu.institution_name || '',
      start_year: edu.start_year || '',
      end_year: edu.end_year || '',
      gradeOrCgpa: edu.gradeOrCgpa || edu.grade || ''
    });
    setIsAddingEdu(true);
  };

  const handleSaveEdu = async (e) => {
    e.preventDefault();
    const teacherId = localStorage.getItem('teacher_id');
    if (!teacherId) return;

    if (!eduFormData.degree || !eduFormData.field_of_study || !eduFormData.institution_name) {
      toast.error('Degree, field of study and institution are required.');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        teacher: teacherId,
        degree: eduFormData.degree,
        field_of_study: eduFormData.field_of_study,
        institution_name: eduFormData.institution_name,
        university_name: eduFormData.university_name || eduFormData.institution_name,
        start_year: eduFormData.start_year,
        end_year: eduFormData.end_year,
        gradeOrCgpa: parseFloat(eduFormData.gradeOrCgpa) || 0.00
      };

      if (editingEdu) {
        await educationApi.patch(editingEdu.id, payload);
        toast.success('Education record updated!');
      } else {
        await educationApi.create(payload);
        toast.success('Education record added!');
      }

      setIsAddingEdu(false);
      await fetchProfile();
    } catch (err) {
      console.error('Failed to save education', err);
      toast.error('Failed to save education record.');
      setLoading(false);
    }
  };

  const handleDeleteEdu = async (eduId) => {
    if (window.confirm('Delete this education record?')) {
      try {
        setLoading(true);
        await educationApi.delete(eduId);
        toast.success('Education record deleted!');
        await fetchProfile();
      } catch (err) {
        console.error('Failed to delete education', err);
        toast.error('Failed to delete education record.');
        setLoading(false);
      }
    }
  };

  const handleAddResearch = async (e) => {
    e.preventDefault();
    const teacherId = localStorage.getItem('teacher_id');
    if (!teacherId || !newResearchTopic.trim()) return;

    try {
      setLoading(true);
      await researchInterestsApi.create({
        teacher: teacherId,
        topic: newResearchTopic.trim()
      });
      setNewResearchTopic('');
      toast.success('Research interest added!');
      await fetchProfile();
    } catch (err) {
      console.error('Failed to add research interest', err);
      toast.error('Failed to add research interest.');
      setLoading(false);
    }
  };

  const handleDeleteResearch = async (researchId) => {
    try {
      setLoading(true);
      await researchInterestsApi.delete(researchId);
      toast.success('Research interest removed!');
      await fetchProfile();
    } catch (err) {
      console.error('Failed to delete research interest', err);
      toast.error('Failed to remove research interest.');
      setLoading(false);
    }
  };

  const handleSaveEditResearch = async (e) => {
    e.preventDefault();
    if (!editingResearch || !editResearchTopic.trim()) return;

    try {
      setLoading(true);
      await researchInterestsApi.patch(editingResearch.id, {
        topic: editResearchTopic.trim()
      });
      setEditingResearch(null);
      setEditResearchTopic('');
      toast.success('Research interest updated!');
      await fetchProfile();
    } catch (err) {
      console.error('Failed to update research interest', err);
      toast.error('Failed to update research interest.');
      setLoading(false);
    }
  };

  const handleOpenEditResearch = (ri) => {
    setEditingResearch(ri);
    setEditResearchTopic(ri.topic || '');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, profile_image: file }));
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  if (!profileData) return (
    <div className="text-center py-20">
      <h2 className="text-xl font-bold text-slate-700">Profile Not Found</h2>
      <Button onClick={() => navigate('/dashboard/setup-profile')} className="mt-4">Setup Profile</Button>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800 font-serif">My Profile</h1>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)} className="gap-2">
            <Edit className="w-4 h-4" /> Edit Profile
          </Button>
        )}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 border-t-4 border-t-primary shadow-sm overflow-hidden">
          <CardContent className="p-8 flex flex-col items-center text-center">
            <div className="relative group mb-6">
              <div className="w-32 h-32 rounded-full ring-4 ring-slate-100 p-1 overflow-hidden">
                <img 
                  src={getImageUrl(formData?.profile_image)} 
                  alt="Profile" 
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
              {isEditing && (
                <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                  <span className="text-white text-xs font-medium">Change Photo</span>
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                </label>
              )}
            </div>

            {isEditing ? (
              <div className="w-full space-y-3 mb-6">
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    placeholder="First Name"
                    className="w-1/2 p-2 border border-slate-200 rounded text-center font-bold text-slate-800 focus:ring-1 focus:ring-primary outline-none"
                  />
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    placeholder="Last Name"
                    className="w-1/2 p-2 border border-slate-200 rounded text-center font-bold text-slate-800 focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
                <input
                  type="text"
                  name="position"
                  value={formData.position}
                  onChange={handleInputChange}
                  placeholder="Position"
                  className="w-full p-2 border border-slate-200 rounded text-center text-slate-700 focus:ring-1 focus:ring-primary outline-none"
                />
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  placeholder="Department"
                  className="w-full p-2 border border-slate-200 rounded text-center text-primary font-medium focus:ring-1 focus:ring-primary outline-none"
                />
              </div>
            ) : (
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-800 font-serif">{profileData.first_name} {profileData.last_name}</h2>
                <p className="text-slate-600 font-medium">{profileData.position}</p>
                <p className="text-primary font-semibold">Dept. of {profileData.department}</p>
              </div>
            )}
            
            <div className="w-full space-y-4 text-sm text-left border-t border-slate-50 pt-6">
              <div className="flex items-center gap-3 text-slate-600">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                  <Mail className="w-4 h-4 text-slate-400" />
                </div>
                <span className="truncate">{profileData.user?.email || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                  <Phone className="w-4 h-4 text-slate-400" />
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleInputChange}
                    className="flex-1 p-2 border border-slate-200 rounded text-xs outline-none focus:ring-1 focus:ring-primary"
                  />
                ) : (
                  <span>{profileData.phone_number}</span>
                )}
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-slate-400" />
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="flex-1 p-2 border border-slate-200 rounded text-xs outline-none focus:ring-1 focus:ring-primary"
                  />
                ) : (
                  <span>{profileData.location}</span>
                )}
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                  <Briefcase className="w-4 h-4 text-slate-400" />
                </div>
                {isEditing ? (
                  <input
                    type="number"
                    name="years_of_experience"
                    value={formData.years_of_experience}
                    onChange={handleInputChange}
                    className="flex-1 p-2 border border-slate-200 rounded text-xs outline-none focus:ring-1 focus:ring-primary"
                  />
                ) : (
                  <span>{profileData.years_of_experience} Years Experience</span>
                )}
              </div>
            </div>
            
            {isEditing && (
              <div className="w-full mt-8 space-y-3 pt-6 border-t border-slate-50">
                <div className="flex gap-3">
                  <Button onClick={handleSave} className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700">
                    <Save className="w-4 h-4" /> Save
                  </Button>
                  <Button onClick={handleCancel} variant="outline" className="flex-1 gap-2">
                    <X className="w-4 h-4" /> Cancel
                  </Button>
                </div>
                <Button onClick={handleDelete} variant="outline" className="w-full gap-2 text-red-500 hover:text-red-600 hover:bg-red-50 border-red-100">
                  <Trash2 className="w-4 h-4" /> Delete Profile
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-sm">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-bold text-slate-800 text-lg font-serif">Biography</h3>
              </div>
              
              {isEditing ? (
                <textarea
                  name="biography"
                  value={formData.biography}
                  onChange={handleInputChange}
                  className="w-full p-4 border border-slate-200 rounded-lg text-slate-600 leading-relaxed min-h-[150px] resize-y focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              ) : (
                <p className="text-slate-600 leading-relaxed">
                  {profileData.biography}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-8">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-amber-600" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-lg font-serif">Education</h3>
                </div>
                <Button 
                  onClick={handleOpenAddEdu} 
                  className="bg-primary hover:bg-primary-dark text-white gap-2 font-bold text-xs shrink-0 rounded-xl px-4 py-2 flex items-center border-none shadow-sm cursor-pointer"
                >
                  {isAddingEdu ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  {isAddingEdu ? 'Close' : 'Add Education'}
                </Button>
              </div>

              {/* Education Inline Input Form */}
              {isAddingEdu && (
                <form onSubmit={handleSaveEdu} className="p-5 bg-slate-50/50 border border-slate-200 rounded-2xl space-y-4 mb-6 animate-in slide-in-from-top-2 duration-200">
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">{editingEdu ? 'Edit Degree' : 'Add New Degree'}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Degree</label>
                      <input 
                        required type="text" name="degree" value={eduFormData.degree} onChange={handleEduInputChange}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        placeholder="e.g. Ph.D. / M.Tech / B.E."
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Field of Study</label>
                      <input 
                        required type="text" name="field_of_study" value={eduFormData.field_of_study} onChange={handleEduInputChange}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        placeholder="e.g. Computer Science"
                      />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Institution Name</label>
                      <input 
                        required type="text" name="institution_name" value={eduFormData.institution_name} onChange={handleEduInputChange}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        placeholder="e.g. IIT Delhi"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Start Year</label>
                      <input 
                        type="text" name="start_year" value={eduFormData.start_year} onChange={handleEduInputChange}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        placeholder="e.g. 2015"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">End Year</label>
                      <input 
                        type="text" name="end_year" value={eduFormData.end_year} onChange={handleEduInputChange}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        placeholder="e.g. 2019"
                      />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Grade / CGPA (Numeric)</label>
                      <input 
                        required
                        type="number" 
                        step="0.01" 
                        name="gradeOrCgpa" 
                        value={eduFormData.gradeOrCgpa} 
                        onChange={handleEduInputChange}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        placeholder="e.g. 7.41 or 9.50"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                    <Button type="button" variant="outline" onClick={() => setIsAddingEdu(false)} className="px-4 py-2 text-xs rounded-xl">Cancel</Button>
                    <Button type="submit" disabled={loading} className="px-6 py-2 bg-primary-dark hover:bg-slate-800 text-white font-bold text-xs rounded-xl">
                      {loading ? 'Saving...' : editingEdu ? 'Update' : 'Add'}
                    </Button>
                  </div>
                </form>
              )}
              
              <div className="space-y-4">
                {profileData.education_list?.map((edu) => (
                  <div key={edu.id} className="flex justify-between items-start p-4 bg-slate-50/50 border border-slate-100 rounded-xl hover:border-primary/20 transition-colors">
                    <div className="flex gap-4">
                      <div className="w-10 h-10 bg-white rounded-lg border border-slate-100 flex items-center justify-center shrink-0">
                        <BookOpen className="w-5 h-5 text-slate-400" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800">{edu.degree} in {edu.field_of_study}</h4>
                        <p className="text-slate-600 text-sm">{edu.institution_name}</p>
                        <p className="text-slate-500 text-xs mt-1">{edu.start_year} - {edu.end_year} • Grade: {edu.gradeOrCgpa || edu.grade}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleOpenEditEdu(edu)}
                        className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-primary rounded-lg transition-colors cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteEdu(edu.id)}
                        className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
                {(!profileData.education_list || profileData.education_list.length === 0) && (
                  <p className="text-center py-4 text-slate-400 text-sm border border-dashed border-slate-200 rounded-xl">No education history added.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Research Interests Card */}
          <Card className="shadow-sm">
            <CardContent className="p-8">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-lg font-serif">Research Interests</h3>
                </div>
                <Button 
                  onClick={() => setIsAddingResearch(prev => !prev)} 
                  className="bg-primary hover:bg-primary-dark text-white gap-2 font-bold text-xs shrink-0 rounded-xl px-4 py-2 flex items-center border-none shadow-sm cursor-pointer"
                >
                  {isAddingResearch ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  {isAddingResearch ? 'Close' : 'Add Research'}
                </Button>
              </div>

              {/* Research Interest Input Form */}
              {isAddingResearch && (
                <form onSubmit={handleAddResearch} className="flex gap-2 mb-6 animate-in slide-in-from-top-2 duration-200">
                  <input
                    type="text"
                    placeholder="Search or enter a research topic (e.g. Quantum Computing)"
                    value={newResearchTopic}
                    onChange={(e) => setNewResearchTopic(e.target.value)}
                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    required
                  />
                  <Button type="submit" className="bg-primary hover:bg-primary-dark rounded-xl px-6 font-bold">
                    Add
                  </Button>
                </form>
              )}

              {/* Research Interest Badges */}
              <div className="flex flex-wrap gap-2.5">
                {profileData.research_interests && profileData.research_interests.length > 0 ? (
                  profileData.research_interests.map((ri) => (
                    <div 
                      key={ri.id} 
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200/50 rounded-xl text-slate-700 font-bold text-xs group hover:bg-white hover:border-slate-300 transition-all pr-14 relative"
                    >
                      <span className="truncate max-w-[150px]">{ri.topic}</span>
                      <div className="absolute right-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-inherit pl-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditResearch(ri)}
                          className="p-1 text-slate-400 hover:text-primary transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteResearch(ri.id)}
                          className="p-1 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 text-sm italic">No research interests listed.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Edit Research Modal */}
          {editingResearch && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col border border-slate-100 animate-in zoom-in-95 duration-200 p-6">
                <h3 className="font-bold text-slate-800 text-base mb-4 font-serif">Edit Research Interest</h3>
                <input
                  type="text"
                  value={editResearchTopic}
                  onChange={(e) => setEditResearchTopic(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all mb-4"
                  placeholder="e.g. Machine Learning"
                  required
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setEditingResearch(null)} className="px-4 py-2 font-bold text-xs rounded-xl">Cancel</Button>
                  <Button onClick={handleSaveEditResearch} className="px-6 py-2 bg-primary-dark hover:bg-slate-800 text-white font-bold text-xs rounded-xl">Save</Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>


    </div>
  );
}
