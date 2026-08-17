import React from 'react';
import { ArrowRight, Users, Trophy, Calendar, Building2, HeartHandshake, Dumbbell, Music, Palette, BookOpen, Building, Heart } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export function CampusLife() {
  const stats = [
    { number: '50+', label: 'Student Clubs', desc: 'Join and explore diverse interests', icon: Users },
    { number: '20+', label: 'Sports', desc: 'Indoor and outdoor sports facilities', icon: Trophy },
    { number: '100+', label: 'Events Every Year', desc: 'Cultural, technical and social events', icon: Calendar },
    { number: '5', label: 'Hostels', desc: 'Safe, comfortable and well-equipped', icon: Building2 },
    { number: '1000+', label: 'Happy Students', desc: 'A thriving and supportive community', icon: HeartHandshake },
  ];

  const lifeCards = [
    { title: 'Sports & Fitness', desc: 'Stay active with our state-of-the-art sports facilities and fitness centers.', icon: Dumbbell, image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=600' },
    { title: 'Clubs & Activities', desc: 'Join a variety of clubs and explore your passions beyond academics.', icon: Music, image: 'https://images.unsplash.com/photo-1525926477800-7a3b10316ac6?auto=format&fit=crop&q=80&w=600' },
    { title: 'Events & Festivals', desc: 'Celebrate culture, creativity, and diversity through exciting events and fests.', icon: Palette, image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=600' },
    { title: 'Learning Beyond Classrooms', desc: 'Workshops, seminars, and hands-on experiences that enrich your learning.', icon: BookOpen, image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=600' },
    { title: 'Hostel Life', desc: 'Comfortable, secure, and vibrant hostel communities that feel like home.', icon: Building, image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&q=80&w=600' },
    { title: 'Community Service', desc: 'Make a difference by contributing to society and building a better tomorrow.', icon: Heart, image: 'https://images.unsplash.com/photo-1593113589914-075568e26182?auto=format&fit=crop&q=80&w=600' },
  ];

  const galleryImages = [
    'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&q=80&w=600',
    'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=600',
    'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&q=80&w=600',
    'https://images.unsplash.com/photo-1511629091441-ee46146481b6?auto=format&fit=crop&q=80&w=600',
    'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=600',
  ];

  return (
    <div className="flex flex-col bg-white">
      {/* Hero Section */}
      <section className="relative min-h-[500px] flex items-center pt-8 pb-32">
        <div 
          className="absolute inset-0 z-0 bg-cover bg-right"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&q=80&w=2000')" }}
        >
          {/* Gradient overlay to make text readable on the left */}
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-transparent w-full lg:w-2/3"></div>
        </div>
        
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <div className="max-w-xl">
            <div className="flex items-center text-sm font-medium text-slate-500 mb-6">
              <span className="hover:text-primary cursor-pointer transition-colors">Home</span>
              <span className="mx-2">›</span>
              <span className="text-slate-800">Campus Life</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-primary-dark mb-2 font-serif">Campus Life</h1>
            <div className="w-24 h-1 bg-secondary mb-6"></div>
            
            <p className="text-lg text-slate-700 leading-relaxed mb-8">
              At Bright Future College, life goes beyond classrooms. We offer a vibrant, inclusive, and enriching campus experience that helps students grow, explore, and succeed.
            </p>
            
            <Button className="bg-primary-dark text-white hover:bg-slate-800 rounded-full px-8 flex items-center">
              Explore Life at BFC <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Banner */}
      <section className="relative -mt-20 z-20 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 w-full mb-24">
        <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col lg:flex-row justify-between gap-8 border border-slate-100 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} className="flex flex-col items-center lg:items-start flex-1 pt-6 lg:pt-0 first:pt-0 lg:pl-6 first:pl-0">
                <div className="flex items-center gap-4 mb-2 w-full justify-center lg:justify-start">
                  <div className="p-3 bg-slate-50 rounded-full border border-slate-100 shrink-0">
                    <Icon className="w-6 h-6 text-primary-dark" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-primary-dark">{stat.number}</p>
                    <p className="font-semibold text-slate-800 text-sm whitespace-nowrap">{stat.label}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 text-center lg:text-left w-full lg:pl-16">{stat.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Life at BFC Section */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 w-full mb-24">
        <div className="text-center mb-12 flex flex-col items-center">
          <h2 className="text-3xl font-bold text-primary-dark mb-2 font-serif">Life at BFC</h2>
          <div className="w-16 h-1 bg-secondary"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          {lifeCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div key={idx} className="flex flex-col group cursor-pointer">
                <div className="relative mb-6">
                  <img 
                    src={card.image} 
                    alt={card.title} 
                    className="w-full h-48 object-cover rounded-2xl group-hover:shadow-lg transition-all duration-300"
                  />
                  <div className="absolute -bottom-5 left-4 bg-white p-3 rounded-full shadow-md border border-slate-100">
                    <Icon className="w-5 h-5 text-primary-dark" strokeWidth={2} />
                  </div>
                </div>
                <h3 className="font-bold text-primary-dark mb-2 text-lg px-2">{card.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed px-2">{card.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Campus Gallery Section */}
      <section className="bg-slate-50 py-24 w-full">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 flex flex-col items-center">
            <h2 className="text-3xl font-bold text-primary-dark mb-2 font-serif">Campus Gallery</h2>
            <div className="w-16 h-1 bg-secondary"></div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-16">
            {galleryImages.map((img, idx) => (
              <div key={idx} className="overflow-hidden rounded-xl h-40">
                <img 
                  src={img} 
                  alt={`Gallery image ${idx + 1}`} 
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500 cursor-pointer"
                />
              </div>
            ))}
          </div>

          <div className="bg-primary-dark rounded-2xl p-8 md:p-10 flex flex-col md:flex-row justify-between items-center gap-6 shadow-xl">
            <div className="text-white">
              <h3 className="text-2xl font-bold mb-2 font-serif">Your Journey. Your Campus. Your Life.</h3>
              <p className="text-slate-300 text-sm">Create memories, build friendships, and shape your future at Bright Future College.</p>
            </div>
            <Button variant="secondary" className="rounded-full px-8 shrink-0 flex items-center font-bold">
              Join Our Campus Community <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
