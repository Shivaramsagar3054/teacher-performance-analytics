import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { PublicLayout } from '../components/layout/PublicLayout';
import { DashboardLayout } from '../components/layout/DashboardLayout';

// Public Pages
import { Home, About, Professors, ProfessorProfile, CampusLife, Events, Courses, CourseDetail, Login, Signup, ForgotPassword, PublicCourseAnalysis } from '../pages/public';

// Dashboard Pages
import { Analytics, Profile, CoursesList, SetupProfile, ManageEvents, CourseAnalysis, Messages, Settings } from '../pages/dashboard';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/courses/:id" element={<CourseDetail />} />
        <Route path="/professors" element={<Professors />} />
        <Route path="/professors/:id" element={<ProfessorProfile />} />
        <Route path="/completed-courses/:id/analysis" element={<PublicCourseAnalysis />} />
        <Route path="/academics" element={<div className="p-20 text-center text-2xl font-bold">Academics Page</div>} />
        <Route path="/campus-life" element={<CampusLife />} />
        <Route path="/events" element={<Events />} />
        <Route path="/contact" element={<div className="p-20 text-center text-2xl font-bold">Contact Page</div>} />
      </Route>

      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<Analytics />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="profile" element={<Profile />} />
        <Route path="setup-profile" element={<SetupProfile />} />
        <Route path="courses" element={<CoursesList />} />
        <Route path="courses/:id/analysis" element={<CourseAnalysis />} />
        <Route path="events" element={<ManageEvents />} />
        <Route path="messages" element={<Messages />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}
