import React from 'react';

export function About() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <h1 className="text-4xl font-bold text-primary-dark mb-6">About Us</h1>
      <p className="text-lg text-slate-600 mb-8 max-w-3xl leading-relaxed">
        Founded with a vision to redefine education, Bright Future College has been at the forefront of academic excellence for over 25 years. We believe in holistic development, fostering innovation, and empowering students to become global leaders.
      </p>
      <img src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=1200" alt="Campus" className="w-full h-96 object-cover rounded-2xl shadow-xl" />
    </div>
  );
}
