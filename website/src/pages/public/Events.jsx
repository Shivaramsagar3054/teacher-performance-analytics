import React, { useState, useEffect } from 'react';
import { Search, Calendar as CalendarIcon, MapPin, Clock, ArrowRight, Grid, Mic, Wrench, Palette, Trophy, Heart, Mail, X, ExternalLink } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { eventsApi, getImageUrl } from '../../services/api';

export function Events() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  
  const heroImages = [
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=2000', // Concert/Fest
    'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&q=80&w=2000', // Tech conference
    'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=2000', // Sports
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
    }, 4000);
    
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    setLoading(true);
    eventsApi.getAll({ page: currentPage, search: searchQuery })
      .then(data => {
        if (data && data.results) {
          setEvents(data.results);
          setTotalCount(data.count);
          setTotalPages(Math.ceil(data.count / 10)); // 10 is default PAGE_SIZE
        } else {
          setEvents(Array.isArray(data) ? data : []);
          setTotalCount(Array.isArray(data) ? data.length : 0);
          setTotalPages(1);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch events', err);
        setLoading(false);
      });
  }, [currentPage, searchQuery]);


  const getEventDate = (dateStr) => {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return { month: '???', day: '??' };
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return {
      month: months[date.getMonth()],
      day: String(date.getDate()).padStart(2, '0')
    };
  };

  const getEventTime = (dateStr) => {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getCategoryColor = (category) => {
    if (!category) return 'text-slate-500';
    const cat = category.toUpperCase();
    if (cat === 'SEMINAR') return 'text-blue-600';
    if (cat === 'CULTURAL') return 'text-purple-600';
    if (cat === 'WORKSHOP') return 'text-emerald-600';
    if (cat === 'SPORTS') return 'text-orange-500';
    if (cat === 'SOCIAL') return 'text-pink-600';
    return 'text-slate-500';
  };

  const categoriesList = [
    { name: 'All Events', count: `${events.length} Events`, icon: Grid, bg: 'bg-blue-100', color: 'text-blue-600' },
    { name: 'Seminars', count: `${events.filter(e => e.event_type?.toLowerCase() === 'seminar').length} Events`, icon: Mic, bg: 'bg-indigo-100', color: 'text-indigo-600' },
    { name: 'Workshops', count: `${events.filter(e => e.event_type?.toLowerCase() === 'workshop').length} Events`, icon: Wrench, bg: 'bg-emerald-100', color: 'text-emerald-600' },
    { name: 'Cultural', count: `${events.filter(e => e.event_type?.toLowerCase() === 'cultural').length} Events`, icon: Palette, bg: 'bg-purple-100', color: 'text-purple-600' },
    { name: 'Sports', count: `${events.filter(e => e.event_type?.toLowerCase() === 'sports').length} Events`, icon: Trophy, bg: 'bg-orange-100', color: 'text-orange-500' },
    { name: 'Social', count: `${events.filter(e => e.event_type?.toLowerCase() === 'social').length} Events`, icon: Heart, bg: 'bg-pink-100', color: 'text-pink-600' },
  ];

  const filteredEvents = events; // Server handles filtering now

  return (
    <div className="flex flex-col bg-white">
      {/* Hero Section with Scrolling Images */}
      <section className="relative min-h-[450px] flex items-center overflow-hidden">
        {heroImages.map((img, index) => (
          <div 
            key={index}
            className={`absolute inset-0 z-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out ${
              index === currentImageIndex ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ backgroundImage: `url('${img}')` }}
          />
        ))}
        
        {/* Gradient overlay to make text readable on the left */}
        <div className="absolute inset-0 z-0 bg-gradient-to-r from-white via-white/95 to-transparent w-full md:w-3/4 lg:w-2/3"></div>
        
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full py-16">
          <div className="max-w-xl">
            <div className="flex items-center text-sm font-medium text-slate-500 mb-6">
              <span className="hover:text-primary cursor-pointer transition-colors">Home</span>
              <span className="mx-2">›</span>
              <span className="hover:text-primary cursor-pointer transition-colors">News & Events</span>
              <span className="mx-2">›</span>
              <span className="text-primary-dark">Events</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-primary-dark mb-4 font-serif">Events</h1>
            <div className="w-16 h-1 bg-secondary mb-8"></div>
            
            <p className="text-lg text-slate-700 leading-relaxed mb-8 max-w-md">
              Discover exciting events, activities, and opportunities that make campus life vibrant and memorable.
            </p>
            
            <div className="flex items-center bg-white rounded-lg border border-slate-200 shadow-lg p-1 max-w-md">
              <input 
                type="text" 
                placeholder="Search events by title, category, or location..." 
                className="flex-1 bg-transparent border-none outline-none px-4 py-3 text-sm text-slate-700"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button className="bg-primary-dark text-white p-3 rounded-md hover:bg-slate-800 transition-colors">
                <Search className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming Events Section */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 w-full py-16">
        <div className="flex justify-between items-center mb-10 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <CalendarIcon className="w-8 h-8 text-primary-dark" />
            <h2 className="text-2xl font-bold text-primary-dark font-serif">Upcoming Events</h2>
          </div>
          <Button variant="outline" className="text-sm font-semibold hidden sm:flex items-center">
            View All Events <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {filteredEvents.length > 0 ? (
            filteredEvents.map((event) => (
              <Card key={event.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 group border border-slate-200 flex flex-col h-full rounded-2xl">
                <div className="h-48 relative overflow-hidden bg-slate-100">
                  <img 
                    src={getImageUrl(event.image_path)} 
                    alt={event.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                  <div className="absolute top-4 left-4 bg-white/95 backdrop-blur rounded-lg shadow-sm flex flex-col items-center justify-center p-2 min-w-[3rem]">
                    <span className="text-[10px] font-bold text-slate-500 uppercase leading-none mb-1">{getEventDate(event.start_date).month}</span>
                    <span className="text-xl font-bold text-primary-dark leading-none">{getEventDate(event.start_date).day}</span>
                  </div>
                </div>
                
                <CardContent className="p-6 flex flex-col flex-1">
                  <p className={`text-[10px] font-bold tracking-wider mb-2 ${getCategoryColor(event.event_type)}`}>{event.event_type?.toUpperCase()}</p>
                  <h3 className="text-lg font-bold text-slate-900 mb-4 line-clamp-2 leading-snug">{event.title}</h3>
                  
                  <div className="space-y-2 mt-auto text-sm text-slate-500 mb-6">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 shrink-0" />
                      <span>{getEventTime(event.start_date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 shrink-0" />
                      <span className="truncate">{event.location}</span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => setSelectedEvent(event)}
                    className="w-full py-2.5 rounded-full border border-slate-200 text-sm font-semibold text-primary-dark hover:border-primary-dark transition-colors flex items-center justify-center"
                  >
                    View Details <ArrowRight className="w-4 h-4 ml-2" />
                  </button>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full py-12 text-center text-slate-500 flex flex-col items-center bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
              <Search className="w-12 h-12 mb-4 text-slate-300" />
              <p className="text-lg font-medium text-slate-600">No events found matching "{searchQuery}"</p>
              <p className="text-sm mt-2">Try adjusting your search terms or browse categories below.</p>
            </div>
          )}
        </div>
      )}
        {!loading && (
          <Button variant="outline" className="w-full mt-6 sm:hidden justify-center">
            </Button>
        )}

        {/* Pagination Controls */}
        {!loading && totalPages > 1 && (
          <div className="mt-16 flex flex-col items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
              >
                <ArrowRight className="w-5 h-5 rotate-180" />
              </button>
              
              <div className="flex items-center gap-1">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-10 h-10 rounded-lg font-bold text-sm transition-all ${
                      currentPage === i + 1
                        ? 'bg-primary-dark text-white shadow-md'
                        : 'bg-white text-slate-600 border border-slate-200 hover:border-primary hover:text-primary'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-500 font-medium">
              Showing <span className="text-slate-900 font-bold">{events.length}</span> of <span className="text-slate-900 font-bold">{totalCount}</span> Events
            </p>
          </div>
        )}
      </section>

      {/* Event Categories */}
      <section className="bg-slate-50/50 py-16 border-y border-slate-100">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex items-center gap-3 mb-10">
            <Grid className="w-8 h-8 text-primary-dark" />
            <h2 className="text-2xl font-bold text-primary-dark font-serif">Event Categories</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categoriesList.map((cat, idx) => {
              const Icon = cat.icon;
              return (
                <div key={idx} className={`flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-white hover:border-primary/30 hover:shadow-md cursor-pointer transition-all ${idx === 0 ? 'ring-1 ring-primary border-primary' : ''}`}>
                  <div className={`p-3 rounded-full ${cat.bg} shrink-0`}>
                    <Icon className={`w-5 h-5 ${cat.color}`} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm leading-tight mb-1">{cat.name}</h3>
                    <p className="text-xs text-slate-500">{cat.count}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Event Banner */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 w-full py-16">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 flex flex-col md:flex-row">
          <div className="md:w-1/3 h-64 md:h-auto relative">
            <div className="absolute top-4 left-4 bg-white/95 backdrop-blur rounded-lg shadow-sm flex flex-col items-center justify-center p-2 min-w-[3.5rem] z-10">
              <span className="text-xs font-bold text-slate-500 uppercase leading-none mb-1">MAY</span>
              <span className="text-2xl font-bold text-primary-dark leading-none">24</span>
            </div>
            <img 
              src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=800" 
              alt="Cultural Fest" 
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="p-8 md:p-10 flex-1 flex flex-col justify-center">
            <p className="text-xs font-bold tracking-wider text-purple-600 mb-2">CULTURAL</p>
            <h3 className="text-2xl md:text-3xl font-bold text-primary-dark mb-4 font-serif">Annual Cultural Fest "Rang 2025"</h3>
            <p className="text-slate-600 mb-8 max-w-2xl leading-relaxed">
              A celebration of art, music, dance, and creativity. Join us for an unforgettable evening of performances, competitions, and fun.
            </p>
            
            <div className="flex flex-wrap gap-y-4 gap-x-8 items-center text-sm font-medium text-slate-700">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-slate-400" />
                May 24, 2025
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-slate-400" />
                04:00 PM - 10:00 PM
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-slate-400" />
                Open Air Theatre
              </div>
              <Button className="ml-auto bg-primary-dark text-white hover:bg-slate-800 px-8 flex items-center">
                Register Now <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 w-full mb-16">
        <div className="bg-primary-dark rounded-2xl p-8 md:p-10 flex flex-col md:flex-row justify-between items-center gap-8 shadow-xl">
          <div className="flex items-center gap-6 text-white w-full md:w-auto">
            <CalendarIcon className="w-12 h-12 text-secondary shrink-0" />
            <div>
              <h3 className="text-2xl font-bold mb-1 font-serif">Don't miss out on any event!</h3>
              <p className="text-slate-300 text-sm">Subscribe to our newsletter and stay updated.</p>
            </div>
          </div>
          
          <div className="flex w-full md:w-auto flex-1 max-w-md bg-white rounded-md p-1 shadow-inner">
            <input 
              type="email" 
              placeholder="Enter your email" 
              className="flex-1 bg-transparent border-none outline-none px-4 text-sm text-slate-800"
            />
            <Button className="bg-secondary text-primary-dark hover:bg-yellow-500 font-bold px-6">
              Subscribe
            </Button>
          </div>
        </div>
      </section>

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedEvent(null)}>
          <div 
            className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-64 relative">
              <img src={getImageUrl(selectedEvent.image_path)} alt={selectedEvent.title} className="w-full h-full object-cover" />
              <button 
                onClick={() => setSelectedEvent(null)}
                className="absolute top-4 right-4 bg-white/90 p-2 rounded-full hover:bg-white text-slate-800 transition-colors shadow-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8 md:p-10">
              <p className={`text-xs font-bold tracking-wider mb-2 ${getCategoryColor(selectedEvent.event_type)}`}>{selectedEvent.event_type?.toUpperCase()}</p>
              <h3 className="text-3xl font-bold text-primary-dark mb-6 font-serif">{selectedEvent.title}</h3>
              
              <div className="space-y-4 text-slate-600 mb-8 font-medium">
                <div className="flex items-center gap-3">
                  <CalendarIcon className="w-5 h-5 text-slate-400" />
                  <span>{getEventDate(selectedEvent.start_date).month} {getEventDate(selectedEvent.start_date).day}, {new Date(selectedEvent.start_date).getFullYear()}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-slate-400" />
                  <span>{getEventTime(selectedEvent.start_date)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-slate-400" />
                  <span>{selectedEvent.location}</span>
                </div>
              </div>
              
              <p className="text-slate-600 leading-relaxed mb-8 text-lg">
                {selectedEvent.description || "Join us for this exciting event! Detailed descriptions, schedule, and speakers will be updated soon. Stay tuned for an unforgettable experience at our campus. Register early to secure your spot."}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                {selectedEvent.registration_link ? (
                  <a 
                    href={selectedEvent.registration_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1"
                  >
                    <Button className="w-full bg-primary-dark text-white hover:bg-slate-800 py-6 text-lg font-bold flex items-center justify-center gap-2">
                      Register Now <ExternalLink className="w-4 h-4" />
                    </Button>
                  </a>
                ) : (
                  <div className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-slate-500 text-sm font-semibold flex items-center justify-center">
                    No registration link required
                  </div>
                )}
                <Button variant="outline" className="px-8 py-6 font-bold" onClick={() => setSelectedEvent(null)}>
                  Close Details
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
