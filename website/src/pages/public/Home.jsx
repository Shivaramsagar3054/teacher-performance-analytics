import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, GraduationCap, BookOpen, Users, Globe, Settings, Briefcase, Scale, Microscope, MonitorSmartphone, Mail, Star } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import { teachersApi, getImageUrl } from '../../services/api';

export function Home() {
  const features = [
    { title: 'Quality Education', desc: 'Learn from experienced faculty and industry experts.', icon: GraduationCap },
    { title: 'Modern Facilities', desc: 'State-of-the-art labs, library and classrooms.', icon: BookOpen },
    { title: 'Placement Support', desc: 'Dedicated training & placement cell for careers.', icon: Users },
    { title: 'Global Opportunities', desc: 'Exchange programs and international collaborations.', icon: Globe },
  ];

  const [topTeachers, setTopTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    teachersApi.getAll()
      .then(data => {
        const results = data.results || (Array.isArray(data) ? data : []);
        // Sort teachers by avg_pass_percentage descending
        const sorted = [...results].sort((a, b) => (b.avg_pass_percentage || 0) - (a.avg_pass_percentage || 0));
        setTopTeachers(sorted.slice(0, 5));
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch teachers', err);
        setLoading(false);
      });
  }, []);


  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center">
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&q=80&w=2000')" }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary-dark/90 to-primary-dark/40"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full text-white">
          <div className="max-w-2xl">
            <p className="text-secondary font-semibold tracking-wider text-sm mb-4 uppercase">Welcome to Bright Future College</p>
            <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6 font-sans">
              Inspiring Minds.<br/>Shaping Futures.
            </h1>
            <p className="text-lg md:text-xl text-slate-200 mb-8 leading-relaxed max-w-lg">
              Empowering students with quality education, innovative learning and endless opportunities.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button variant="secondary" size="lg">Explore Courses</Button>
              <Button variant="outline" size="lg">Learn More</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Banner */}
      <section className="relative -mt-16 z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="bg-white rounded-xl shadow-xl shadow-slate-200/50 p-8 flex flex-col md:flex-row justify-between gap-8 border border-slate-100">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div key={idx} className="flex gap-4 flex-1 items-start">
                <div className="bg-slate-50 p-3 rounded-full shrink-0 border border-slate-100">
                  <Icon className="w-8 h-8 text-primary-dark" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 mb-1">{feature.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* About Section */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-secondary font-bold tracking-wider text-sm mb-2 uppercase">About Us</p>
            <h2 className="text-4xl font-bold text-primary-dark mb-6 leading-tight">
              Building a Better<br/>Tomorrow Together
            </h2>
            <p className="text-slate-600 mb-6 leading-relaxed">
              At Bright Future College, we are committed to nurturing talent, fostering innovation, and building responsible citizens. Our holistic approach ensures academic excellence along with personal growth.
            </p>
            <Button className="bg-primary-dark text-white hover:bg-slate-800 px-8 py-3">
              Read More
            </Button>
          </div>
          <div className="relative mt-8 lg:mt-0">
            <img 
              src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=1200" 
              alt="Students learning together" 
              className="rounded-2xl shadow-xl w-full object-cover h-[400px]"
            />
            <div className="absolute -bottom-8 -left-8 bg-white p-6 rounded-xl shadow-xl border border-slate-100 hidden md:block">
              <p className="text-5xl font-bold text-primary-dark mb-1">25+</p>
              <p className="text-sm font-medium text-slate-500">Years of Excellence</p>
            </div>
          </div>
        </div>
      </section>

      {/* Top Teachers Section */}
      <section className="py-24 bg-slate-50/50 w-full border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <p className="text-secondary font-bold tracking-wider text-sm mb-2 uppercase">Our Faculty</p>
              <h2 className="text-4xl font-bold text-primary-dark font-sans">Top Teachers</h2>
            </div>
            <Link to="/professors" className="text-primary-dark font-medium flex items-center hover:text-primary transition-colors">
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            </div>
          ) : topTeachers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {topTeachers.map((prof) => (
                <Card key={prof.id} className="group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-[2rem] border border-slate-100/80 bg-white">
                  <CardContent className="pt-10 pb-8 px-6 flex flex-col items-center text-center">
                    {/* Circle Image Wrapper */}
                    <div className="relative mb-6">
                      <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-slate-50 shadow-inner">
                        <img 
                          src={getImageUrl(prof.profile_image)} 
                          alt={`${prof.first_name} ${prof.last_name}`} 
                          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      {/* Rating / Passrate Badge */}
                      <div className="absolute -bottom-1 right-2 bg-white px-3 py-1 rounded-full shadow-md border border-slate-100 flex items-center gap-1 select-none">
                        <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                        <span className="font-bold text-xs text-slate-800">
                          {prof.avg_pass_percentage > 0 ? `${prof.avg_pass_percentage}%` : 'N/A'}
                        </span>
                      </div>
                    </div>

                    <h3 className="font-extrabold text-slate-900 text-lg mb-1 leading-tight line-clamp-1">
                      {`Dr. ${prof.first_name} ${prof.last_name}`}
                    </h3>
                    <p className="text-sm font-medium text-slate-500 mb-6 h-5 line-clamp-1">
                      {prof.department}
                    </p>

                    {/* Email Circle Button */}
                    <a 
                      href={`mailto:${prof.user?.email || ''}`}
                      className="w-12 h-12 rounded-full bg-blue-50/70 border border-blue-100/50 flex items-center justify-center text-blue-600 hover:bg-primary hover:text-white transition-all duration-300"
                      title={`Email Dr. ${prof.first_name}`}
                    >
                      <Mail className="w-5 h-5" />
                    </a>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300">
              <p className="text-slate-500">No teachers found.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
