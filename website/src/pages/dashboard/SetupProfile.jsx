import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { teachersApi } from '../../services/api';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { UserCircle, Upload, ChevronRight, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export function SetupProfile() {
  const navigate = useNavigate();
  const userId = localStorage.getItem('user_id');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    user: userId,
    first_name: '',
    last_name: '',
    department: '',
    position: '',
    years_of_experience: 0,
    phone_number: '',
    biography: '',
    location: '',
    profile_image: null
  });

  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    // If they already have a teacher_id, they shouldn't be here
    if (localStorage.getItem('teacher_id')) {
      navigate('/dashboard/profile');
    }
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, profile_image: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.first_name || !formData.last_name || !formData.department || !formData.position || !formData.phone_number || !formData.location || !formData.biography) {
      toast.error('Please fill in all required fields.');
      return;
    }

    if (!formData.profile_image) {
      toast.error('Please upload a profile photo.');
      return;
    }

    const phoneRegex = /^\+?[0-9\s\-\(\)]+$/;
    if (!phoneRegex.test(formData.phone_number)) {
      toast.error('Please enter a valid phone number.');
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'profile_image') {
          if (formData[key]) {
            data.append('profile_image', formData[key]);
          }
        } else {
          data.append(key, formData[key]);
        }
      });

      const response = await teachersApi.create(data);
      localStorage.setItem('teacher_id', response.id);
      localStorage.setItem('teacherProfile', JSON.stringify(response));
      
      toast.success('Profile created successfully!');
      navigate('/dashboard/profile');
    } catch (err) {
      console.error('Failed to create profile', err);
      toast.error('Failed to create profile. Please check if your department or phone number is valid.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pt-10 pb-20 px-4 animate-in fade-in duration-700">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-bold text-slate-900 font-serif">Welcome to the Team</h1>
        <p className="text-slate-500 max-w-lg mx-auto">Let's set up your professional profile to help students and colleagues get to know you better.</p>
        
        {/* Progress Stepper */}
        <div className="flex items-center justify-center gap-4 mt-8">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${step >= 1 ? 'bg-primary text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>1</div>
          <div className={`h-1 w-12 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-slate-100'}`}></div>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${step >= 2 ? 'bg-primary text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>2</div>
        </div>
      </div>

      <Card className="border-none shadow-2xl shadow-slate-200/60 overflow-hidden rounded-3xl">
        <CardContent className="p-0">
          <form onSubmit={handleSubmit} className="flex flex-col md:flex-row">
            {/* Left Sidebar - Visual Feedback */}
            <div className="md:w-1/3 bg-slate-900 p-10 text-white flex flex-col justify-between">
              <div className="space-y-6">
                <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center">
                  <UserCircle className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Profile Preview</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">Your professional identity on campus. This will be visible on the Professors page.</p>
                </div>
                
                <div className="pt-8 space-y-4">
                  <div className="flex items-center gap-3 text-sm">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${formData.first_name ? 'bg-emerald-500' : 'bg-slate-800'}`}>
                      {formData.first_name && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className={formData.first_name ? 'text-white' : 'text-slate-500'}>Basic Identity</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${formData.biography ? 'bg-emerald-500' : 'bg-slate-800'}`}>
                      {formData.biography && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className={formData.biography ? 'text-white' : 'text-slate-500'}>Professional Bio</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${formData.profile_image ? 'bg-emerald-500' : 'bg-slate-800'}`}>
                      {formData.profile_image && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className={formData.profile_image ? 'text-white' : 'text-slate-500'}>Photo Verification</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
                <p className="text-xs text-slate-400 italic">"Teaching is the highest form of understanding." – Aristotle</p>
              </div>
            </div>

            {/* Right Side - Form Content */}
            <div className="flex-1 p-10 md:p-12 bg-white">
              {step === 1 ? (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">First Name</label>
                      <input required type="text" name="first_name" value={formData.first_name} onChange={handleInputChange} className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none" placeholder="John" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Last Name</label>
                      <input required type="text" name="last_name" value={formData.last_name} onChange={handleInputChange} className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none" placeholder="Doe" />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Department</label>
                      <input required type="text" name="department" value={formData.department} onChange={handleInputChange} className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none" placeholder="Computer Science" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Position</label>
                      <input required type="text" name="position" value={formData.position} onChange={handleInputChange} className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none" placeholder="Associate Professor" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Experience (Years)</label>
                      <input required type="number" name="years_of_experience" value={formData.years_of_experience} onChange={handleInputChange} className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Contact Phone</label>
                      <input required type="text" name="phone_number" value={formData.phone_number} onChange={handleInputChange} className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none" placeholder="+1 (555) 000-0000" />
                    </div>
                  </div>
                  
                  <div className="flex justify-end pt-4">
                    <Button type="button" onClick={() => setStep(2)} className="group gap-2 px-10 bg-primary hover:bg-primary-dark text-white rounded-2xl py-6">
                      Next Step <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Profile Photo</label>
                      <div className="flex items-center gap-6 p-6 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 hover:border-primary/40 transition-colors">
                        <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-white shadow-sm shrink-0 border border-slate-100">
                          {imagePreview ? (
                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                              <Upload className="w-8 h-8" />
                            </div>
                          )}
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-slate-700">Upload high-res photo</p>
                          <p className="text-xs text-slate-400">JPG, PNG or WEBP. Max 2MB.</p>
                          <label className="mt-2 inline-block px-4 py-2 bg-white text-primary text-xs font-bold rounded-lg border border-slate-200 cursor-pointer hover:bg-primary hover:text-white hover:border-primary transition-all">
                            Choose File
                            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Office Location</label>
                      <input required type="text" name="location" value={formData.location} onChange={handleInputChange} className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none" placeholder="e.g. Science Block A, Room 305" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Biography</label>
                      <textarea required name="biography" value={formData.biography} onChange={handleInputChange} rows="5" className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none resize-none" placeholder="Describe your teaching philosophy and research interests..." />
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4">
                    <button type="button" onClick={() => setStep(1)} className="text-slate-400 font-bold text-sm hover:text-slate-600">Go Back</button>
                    <Button type="submit" disabled={loading} className="px-12 bg-primary hover:bg-primary-dark text-white rounded-2xl py-6 shadow-xl shadow-primary/20">
                      {loading ? 'Finalizing...' : 'Create My Profile'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
