import React, { useState, useEffect } from 'react';
import { Plus, Search, Calendar, MapPin, Clock, Edit, Trash2, X, Upload, ExternalLink, CheckCircle2, Eye, Copy, QrCode } from 'lucide-react';
import { eventsApi, getImageUrl } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import toast from 'react-hot-toast';

export function ManageEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [selectedDetailEvent, setSelectedDetailEvent] = useState(null);
  const [activeDetailTab, setActiveDetailTab] = useState('preview');
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_type: '',
    start_date: '',
    end_date: '',
    location: '',
    registration_link: '',
    image_path: null
  });

  const teacherId = localStorage.getItem('teacher_id');

  useEffect(() => {
    fetchMyEvents();
  }, [teacherId]);

  const fetchMyEvents = async () => {
    try {
      setLoading(true);
      const params = (teacherId && teacherId !== 'null' && teacherId !== 'undefined') ? { organizer_id: teacherId } : {};
      const data = await eventsApi.getAll(params);
      setEvents(data.results || (Array.isArray(data) ? data : []));
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch events', err);
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, image_path: file }));
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      event_type: '',
      start_date: '',
      end_date: '',
      location: '',
      registration_link: '',
      image_path: null
    });
    setEditingEvent(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.event_type || !formData.location || !formData.start_date || !formData.end_date || !formData.description) {
      toast.error('Please fill in all required fields.');
      return;
    }

    if (new Date(formData.end_date) <= new Date(formData.start_date)) {
      toast.error('End date must be after start date.');
      return;
    }

    try {
      setLoading(true);
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== undefined && formData[key] !== '') {
          data.append(key, formData[key]);
        }
      });
      
      // Ensure organizer is set if the user is a teacher
      if (teacherId && teacherId !== 'null' && teacherId !== 'undefined') {
        data.append('organizer', teacherId);
      }

      if (editingEvent) {
        await eventsApi.patch(editingEvent.id, data);
        toast.success('Event updated successfully!');
      } else {
        await eventsApi.create(data);
        toast.success('Event created successfully!');
      }
      
      setIsModalOpen(false);
      resetForm();
      fetchMyEvents();
    } catch (err) {
      console.error('Failed to save event', err);
      toast.error(`Error saving event: ${err.message || 'Unknown error occurred.'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description,
      event_type: event.event_type,
      start_date: event.start_date ? new Date(event.start_date).toISOString().slice(0, 16) : '',
      end_date: event.end_date ? new Date(event.end_date).toISOString().slice(0, 16) : '',
      location: event.location,
      registration_link: event.registration_link || '',
      image_path: null // Don't reset image unless changed
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await eventsApi.delete(id);
        toast.success('Event deleted successfully!');
        fetchMyEvents();
      } catch (err) {
        console.error('Failed to delete event', err);
        toast.error('Failed to delete event. Please try again.');
      }
    }
  };

  const handleCopyLink = (link) => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success('Registration link copied!');
    setTimeout(() => setCopied(false), 2000);
  };


  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 font-serif">Manage Events</h1>
          <p className="text-slate-500 text-sm">Create and organize campus activities</p>
        </div>
        <Button onClick={() => { resetForm(); setIsModalOpen(true); }} className="gap-2 bg-primary-dark hover:bg-slate-800">
          <Plus className="w-4 h-4" /> Create New Event
        </Button>
      </div>

      <div className="flex items-center bg-white rounded-xl border border-slate-200 px-4 py-2 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all max-w-md">
        <Search className="w-5 h-5 text-slate-400" />
        <input 
          type="text" 
          placeholder="Search your events..." 
          className="flex-1 bg-transparent border-none outline-none ml-3 text-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {loading && !isModalOpen ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : events.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.filter(e => e.title.toLowerCase().includes(searchQuery.toLowerCase())).map((event) => (
            <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-all border border-slate-200 flex flex-col h-full rounded-2xl group">
              <div className="h-40 relative overflow-hidden bg-slate-100">
                <img 
                  src={getImageUrl(event.image_path)} 
                  alt={event.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                <div className="absolute top-3 right-3 flex gap-2">
                  <button 
                    onClick={() => handleEdit(event)}
                    className="p-2 bg-white/90 backdrop-blur rounded-full shadow-sm hover:bg-white text-slate-700 hover:text-primary transition-all"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(event.id)}
                    className="p-2 bg-white/90 backdrop-blur rounded-full shadow-sm hover:bg-white text-slate-700 hover:text-red-500 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="absolute bottom-3 left-3 px-2 py-1 bg-primary-dark/80 backdrop-blur text-white text-[10px] font-bold rounded-md uppercase tracking-wider">
                  {event.event_type}
                </div>
              </div>
              <CardContent className="p-5 flex flex-col flex-1">
                <h3 className="font-bold text-slate-800 mb-3 line-clamp-1">{event.title}</h3>
                <div className="space-y-2 text-xs text-slate-500 mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{new Date(event.start_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{new Date(event.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{event.location}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-600 line-clamp-2 mb-4 flex-1">
                  {event.description}
                </p>
                <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                  <button 
                    onClick={() => { setSelectedDetailEvent(event); setActiveDetailTab('preview'); }}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline uppercase tracking-tight"
                  >
                    View Details <Eye className="w-3.5 h-3.5" />
                  </button>
                  {event.registration_link && (
                    <a 
                      href={event.registration_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-slate-600 hover:underline uppercase tracking-tight"
                    >
                      Reg Link <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
          <Calendar className="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">You haven't created any events yet.</p>
          <Button onClick={() => setIsModalOpen(true)} variant="outline" className="mt-4">Create Your First Event</Button>
        </div>
      )}

      {/* Event Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800">{editingEvent ? 'Edit Event' : 'Create New Event'}</h2>
              <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Event Title</label>
                  <input 
                    required
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                    placeholder="e.g. Annual Tech Symposium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Event Type</label>
                  <select 
                    required
                    name="event_type"
                    value={formData.event_type}
                    onChange={handleInputChange}
                    className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-white"
                  >
                    <option value="">Select Type</option>
                    <option value="Seminar">Seminar</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Cultural">Cultural</option>
                    <option value="Sports">Sports</option>
                    <option value="Social">Social</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Location</label>
                  <input 
                    required
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                    placeholder="e.g. Auditorium A"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Start Date & Time</label>
                  <input 
                    required
                    type="datetime-local"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleInputChange}
                    className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">End Date & Time</label>
                  <input 
                    required
                    type="datetime-local"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleInputChange}
                    className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Description</label>
                  <textarea 
                    required
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm min-h-[100px] resize-none"
                    placeholder="Describe your event..."
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Registration Link (Optional)</label>
                  <input 
                    name="registration_link"
                    value={formData.registration_link}
                    onChange={handleInputChange}
                    className="w-full p-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                    placeholder="https://..."
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Event Banner Image</label>
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-200 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 text-slate-400 mb-2" />
                        <p className="text-xs text-slate-500 font-medium">{formData.image_path ? formData.image_path.name : 'Click to upload image'}</p>
                      </div>
                      <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                    </label>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex gap-3">
                <Button type="submit" className="flex-1 py-3 bg-primary-dark hover:bg-slate-800 text-white font-bold" disabled={loading}>
                  {loading ? 'Processing...' : editingEvent ? 'Update Event' : 'Create Event'}
                </Button>
                <Button type="button" onClick={() => { setIsModalOpen(false); resetForm(); }} variant="outline" className="flex-1 py-3 font-bold">
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Event Details and Registration Hub Modal */}
      {selectedDetailEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedDetailEvent(null)}>
          <div 
            className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header with Tabs */}
            <div className="px-6 pt-5 pb-3 border-b border-slate-100 bg-slate-50/80 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-slate-800 font-serif">Event Detail Hub</h2>
                <button onClick={() => setSelectedDetailEvent(null)} className="text-slate-400 hover:text-slate-600 p-1">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="flex gap-2 p-1 bg-slate-200/60 rounded-xl self-start text-xs font-bold">
                <button
                  onClick={() => setActiveDetailTab('preview')}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    activeDetailTab === 'preview'
                      ? 'bg-white text-primary-dark shadow-sm'
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  Student Preview
                </button>
                <button
                  onClick={() => setActiveDetailTab('registration')}
                  className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
                    activeDetailTab === 'registration'
                      ? 'bg-white text-primary-dark shadow-sm'
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" /> Registration Link & QR
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto">
              {activeDetailTab === 'preview' ? (
                <div>
                  <div className="h-64 relative bg-slate-100">
                    <img 
                      src={getImageUrl(selectedDetailEvent.image_path)} 
                      alt={selectedDetailEvent.title} 
                      className="w-full h-full object-cover" 
                    />
                    <div className="absolute top-4 left-4 bg-white/95 backdrop-blur rounded-lg shadow-sm flex flex-col items-center justify-center p-2 min-w-[3rem]">
                      <span className="text-[10px] font-bold text-slate-500 uppercase leading-none mb-1">
                        {new Date(selectedDetailEvent.start_date).toLocaleString('default', { month: 'short' })}
                      </span>
                      <span className="text-xl font-bold text-primary-dark leading-none">
                        {new Date(selectedDetailEvent.start_date).getDate()}
                      </span>
                    </div>
                  </div>

                  <div className="p-8">
                    <span className="px-2.5 py-1 bg-primary-dark/10 text-primary-dark text-xs font-bold rounded-lg uppercase tracking-wider">
                      {selectedDetailEvent.event_type}
                    </span>
                    <h3 className="text-2xl font-bold text-slate-800 mt-4 mb-6 font-serif">{selectedDetailEvent.title}</h3>
                    
                    <div className="space-y-3.5 text-slate-600 mb-8 font-medium text-sm">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-slate-400" />
                        <span>
                          {new Date(selectedDetailEvent.start_date).toLocaleDateString('default', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-slate-400" />
                        <span>
                          {new Date(selectedDetailEvent.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(selectedDetailEvent.end_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-slate-400" />
                        <span>{selectedDetailEvent.location}</span>
                      </div>
                    </div>
                    
                    <h4 className="font-bold text-slate-800 text-sm mb-2">Event Description</h4>
                    <p className="text-slate-600 leading-relaxed text-sm whitespace-pre-line mb-8">
                      {selectedDetailEvent.description}
                    </p>

                    {selectedDetailEvent.registration_link ? (
                      <a 
                        href={selectedDetailEvent.registration_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-3.5 rounded-xl bg-primary-dark hover:bg-slate-800 text-white font-bold flex items-center justify-center gap-2 shadow-md transition-all text-sm"
                      >
                        Register Now <ExternalLink className="w-4 h-4" />
                      </a>
                    ) : (
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-slate-500 text-xs font-semibold">
                        No registration link required for this event
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-8 space-y-6">
                  {selectedDetailEvent.registration_link ? (
                    <>
                      <div className="space-y-2">
                        <h4 className="font-bold text-slate-800 text-sm">Registration URL</h4>
                        <div className="flex gap-2">
                          <input 
                            readOnly
                            value={selectedDetailEvent.registration_link}
                            className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 text-xs outline-none select-all"
                          />
                          <button
                            onClick={() => handleCopyLink(selectedDetailEvent.registration_link)}
                            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all flex items-center gap-1 text-xs shrink-0"
                          >
                            {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                            {copied ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                      </div>

                      <div className="border-t border-slate-100 pt-6 flex flex-col items-center justify-center">
                        <h4 className="font-bold text-slate-800 text-sm mb-4">Scan QR Code to Register</h4>
                        <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-100">
                          <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(selectedDetailEvent.registration_link)}`} 
                            alt="Registration Link QR Code"
                            className="w-40 h-40 bg-white p-2 rounded-xl shadow-sm border border-slate-100" 
                          />
                          <p className="text-[10px] text-slate-400 mt-3 font-semibold uppercase tracking-wider">Dynamic QR generated from provided link</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12 text-slate-500">
                      <QrCode className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                      <h4 className="font-bold text-slate-700 mb-1">No Registration Link</h4>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">This event was created without a registration link. You can edit the event to add a registration link at any time.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <Button variant="outline" className="px-6 font-bold" onClick={() => setSelectedDetailEvent(null)}>
                Close Hub
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
