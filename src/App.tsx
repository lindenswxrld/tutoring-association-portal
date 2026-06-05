/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RoleSelectionModal } from './components/RoleSelectionModal';
import { ProgressDashboard } from './components/ProgressDashboard';
import { Materials } from './components/Materials';
import { Appointments } from './components/Appointments';
import { VideoArchive } from './components/VideoArchive';
import { ChatMessenger } from './components/ChatMessenger';
import { 
  BookOpen, 
  GraduationCap, 
  Briefcase, 
  LogOut, 
  Calendar, 
  Video, 
  MessageSquare, 
  Award, 
  Sparkles, 
  UserCheck, 
  RefreshCw, 
  Globe, 
  TrendingUp, 
  HeartHandshake, 
  Users 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type TabId = 'dashboard' | 'materials' | 'appointments' | 'videos' | 'chat';

const AppContent: React.FC = () => {
  const { 
    currentUser, 
    firebaseUser, 
    loading, 
    login, 
    logout, 
    promoteToTutor, 
    demoteToStudent 
  } = useAuth();
  
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center gap-4">
        <div className="relative flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600" />
          <BookOpen className="text-indigo-600 absolute" size={18} />
        </div>
        <div className="text-center">
          <span className="text-xs font-mono uppercase tracking-widest text-neutral-400">Association Gate</span>
          <h2 className="text-sm font-bold text-neutral-800 tracking-wider uppercase mt-1">Tutoring Hub</h2>
        </div>
      </div>
    );
  }

  // Not logged in: Show elegant neobrutalist Bold Typography Landing card with Google Login
  if (!firebaseUser) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-950 flex flex-col justify-between selection:bg-yellow-200 selection:text-slate-900 border-8 border-slate-900">
        
        {/* Bold crisp header */}
        <header className="max-w-7xl w-full mx-auto px-6 py-8 flex items-center justify-between border-b-4 border-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-slate-900 text-white flex items-center justify-center font-black text-2xl border-2 border-slate-900">
              N
            </div>
            <div>
              <span className="text-xl font-black text-slate-900 tracking-tighter uppercase italic block leading-none">Tutoring Association</span>
              <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-400 mt-1 block">Private Revision Node</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-900 font-black hidden sm:inline-flex items-center gap-1.5 uppercase bg-yellow-400 border-2 border-slate-900 px-2 py-0.5">
              <Globe size={13} className="text-slate-900" />
              Portal Online
            </span>
            <button
              onClick={login}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase border-2 border-slate-900 shadow-[2px_2px_0px_0px_#facc15] transition cursor-pointer"
            >
              Sign In
            </button>
          </div>
        </header>

        {/* Hero Banner Grid with Massive Bold Text */}
        <main className="max-w-7xl w-full mx-auto px-6 py-12 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 border-2 border-slate-900">
              <Sparkles size={13} className="text-slate-900" />
              <span className="text-xs font-black text-slate-900 tracking-wider uppercase">Elite Virtual Mentorship Hub</span>
            </div>

            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black text-slate-900 tracking-tighter leading-none uppercase italic">
              ACCELERATE<br />LEARNING.
            </h1>

            <p className="text-slate-600 text-base sm:text-lg font-bold leading-relaxed max-w-xl">
              Log in to access high-credential exam preparation repositories, schedule personalized tutor slots, stream class playbacks, and chat directly with lead instructors.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <button
                onClick={login}
                className="px-6 py-4 bg-yellow-400 text-slate-950 hover:bg-yellow-300 font-black text-sm uppercase border-4 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] active:translate-x-0 active:translate-y-0 active:shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <GraduationCap size={18} />
                Student & Tutor Portal Login
              </button>

              <div className="flex items-center gap-3 px-4 py-3 bg-slate-100 border-2 border-slate-900 text-xs text-slate-500 justify-center">
                <Users size={16} className="text-slate-900" />
                <span className="font-bold text-slate-800 uppercase tracking-tight">1,200 Active Class Enrollments</span>
              </div>
            </div>
          </div>

          {/* Graphic Side Bento illustration matching Bold Typography theme layout */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-4">
            
            <div className="brutal-card p-6 space-y-3">
              <div className="p-3 bg-yellow-400 text-slate-900 border-2 border-slate-900 w-fit">
                <Award size={22} className="stroke-[2.5px]" />
              </div>
              <h3 className="font-black text-slate-900 text-sm uppercase tracking-tight italic">Syllabus Tracking</h3>
              <p className="text-slate-500 text-xs font-bold leading-normal uppercase">
                 Visualize metrics, test marks growth, and course logs in custom student coreboards.
              </p>
            </div>

            <div className="brutal-card-yellow p-6 space-y-3">
              <div className="p-3 bg-slate-900 text-white border-2 border-white w-fit">
                <TrendingUp size={22} className="stroke-[2.5px]" />
              </div>
              <h3 className="font-black text-slate-900 text-sm uppercase tracking-tight italic">Cancel Flexibly</h3>
              <p className="text-slate-900 text-xs font-bold leading-normal uppercase">
                 Reschedule or cancel lesson appointments cleanly with quick cancellation histories.
              </p>
            </div>

            <div className="brutal-card p-6 space-y-3">
              <div className="p-3 bg-teal-400 text-slate-950 border-2 border-slate-900 w-fit">
                <Video size={22} className="stroke-[2.5px]" />
              </div>
              <h3 className="font-black text-slate-900 text-sm uppercase tracking-tight italic">Review Vault</h3>
              <p className="text-slate-500 text-xs font-bold leading-normal uppercase">
                 Stream recordings of previous classes to study and prepare for final exams.
              </p>
            </div>

            <div className="brutal-card-slate p-6 space-y-3">
              <div className="p-3 bg-slate-900 text-white border-2 border-slate-900 w-fit">
                <MessageSquare size={20} className="stroke-[2.5px]" />
              </div>
              <h3 className="font-black text-slate-900 text-sm uppercase tracking-tight italic">Real-Time Sync</h3>
              <p className="text-slate-500 text-xs font-bold leading-normal uppercase">
                Chat securely with specialized mentors via instant messaging backplanes.
              </p>
            </div>

          </div>
        </main>

        <footer className="border-t-4 border-slate-900 py-8 bg-slate-100">
          <div className="max-w-7xl w-full mx-auto px-6 text-center sm:text-left flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-bold uppercase text-slate-500">
            <p>© 2026 Tutoring Association Hub. All study archives are strictly copywritten.</p>
            <div className="flex gap-4 font-black text-slate-900 italic">
              <span className="hover:underline transition-colors cursor-pointer">Course Register</span>
              <span>•</span>
              <span className="hover:underline transition-colors cursor-pointer">Help & FAQ</span>
            </div>
          </div>
        </footer>

      </div>
    );
  }

  // Logged in but missing profile: show onboarding
  if (!currentUser) {
    return <RoleSelectionModal />;
  }

  // Fully signed in & registered: Show core portal dashboard layout
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-yellow-200 selection:text-slate-900 p-4 sm:p-6 font-sans">
      
      {/* 🛠️ DEVELOPER TESTING TOGGLE MODULE BAR at top */}
      <div className="max-w-7xl mx-auto bg-slate-900 text-white p-4 mb-6 border-4 border-slate-900 flex flex-col md:flex-row items-center justify-between gap-4 shadow-[4px_4px_0px_0px_rgba(250,204,21,1)]">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 bg-yellow-400 text-slate-950 text-[10px] font-black uppercase tracking-widest">
            DEV TOOL
          </span>
          <p className="text-xs font-bold text-slate-200 uppercase tracking-tight">
            Switch views to test Student cancellations / Tutor uploads & live chat feeds:
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={demoteToStudent}
            className={`px-3 py-1.5 font-black text-[10px] uppercase transition-all tracking-tight border-2 ${
              currentUser.role === 'student'
                ? 'bg-yellow-400 text-slate-950 border-slate-950 shadow-[2px_2px_0px_0px_#ffffff]'
                : 'bg-white text-slate-950 border-slate-950 hover:bg-slate-100'
            }`}
          >
            STUDENT PREVIEW
          </button>
          <button
            onClick={promoteToTutor}
            className={`px-3 py-1.5 font-black text-[10px] uppercase transition-all tracking-tight border-2 ${
              currentUser.role === 'tutor'
                ? 'bg-yellow-400 text-slate-950 border-slate-950 shadow-[2px_2px_0px_0px_#ffffff]'
                : 'bg-white text-slate-950 border-slate-950 hover:bg-slate-100'
            }`}
          >
            TUTOR PREVIEW
          </button>
        </div>
      </div>

      {/* Main dashboard navigation layout container */}
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Brutalist header / account status banner */}
        <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-white border-4 border-slate-900 p-6 shadow-[5px_5px_0px_0px_rgba(15,23,42,1)]">
          <div className="flex items-center gap-4">
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.name}
              referrerPolicy="no-referrer"
              className="h-16 w-16 border-4 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] bg-slate-100"
            />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-black text-slate-900 text-2xl sm:text-3xl tracking-tighter uppercase italic leading-none">
                  {currentUser.name}
                </h1>
                <span className="px-2.5 py-0.5 bg-slate-900 text-white font-black text-[10px] uppercase border-2 border-slate-900">
                  {currentUser.role}
                </span>
                {currentUser.role === 'student' && currentUser.grade && (
                  <span className="text-[10px] font-black uppercase bg-yellow-400 text-slate-900 px-2 py-0.5 border-2 border-slate-900">
                    {currentUser.grade}
                  </span>
                )}
              </div>
              <span className="text-xs font-mono font-bold tracking-tight text-slate-500 mt-1.5 block">{currentUser.email}</span>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1 max-w-full">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2.5 font-black text-xs uppercase border-2 border-slate-900 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-slate-900 text-white shadow-[2px_2px_0px_0px_#facc15]'
                  : 'bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Award size={14} className="stroke-[2.5px]" />
              Progress
            </button>
            <button
              onClick={() => setActiveTab('materials')}
              className={`px-4 py-2.5 font-black text-xs uppercase border-2 border-slate-900 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'materials'
                  ? 'bg-slate-900 text-white shadow-[2px_2px_0px_0px_#facc15]'
                  : 'bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              <BookOpen size={14} className="stroke-[2.5px]" />
              Syllabus Guides
            </button>
            <button
              onClick={() => setActiveTab('appointments')}
              className={`px-4 py-2.5 font-black text-xs uppercase border-2 border-slate-900 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'appointments'
                  ? 'bg-slate-900 text-white shadow-[2px_2px_0px_0px_#facc15]'
                  : 'bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Calendar size={14} className="stroke-[2.5px]" />
              Schedules
            </button>
            <button
              onClick={() => setActiveTab('videos')}
              className={`px-4 py-2.5 font-black text-xs uppercase border-2 border-slate-900 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'videos'
                  ? 'bg-slate-900 text-white shadow-[2px_2px_0px_0px_#facc15]'
                  : 'bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Video size={14} className="stroke-[2.5px]" />
              Revisions
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-4 py-2.5 font-black text-xs uppercase border-2 border-slate-900 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'chat'
                  ? 'bg-slate-900 text-white shadow-[2px_2px_0px_0px_#facc15]'
                  : 'bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              <MessageSquare size={14} className="stroke-[2.5px]" />
              Live Chat
            </button>

            <div className="h-6 w-px bg-slate-900 mx-1 hidden xl:block" />

            <button
              onClick={logout}
              className="px-3 py-2.5 border-2 border-red-600 bg-red-50 text-red-600 hover:bg-red-100 font-bold text-xs uppercase transition cursor-pointer flex items-center gap-1"
              title="Logout Profile"
            >
              <LogOut size={14} className="stroke-[2.5px]" />
              EXIT
            </button>
          </div>
        </header>

        {/* Content body with responsive transition animation block */}
        <main className="bg-white border-4 border-slate-900 p-6 sm:p-8 min-h-[450px] shadow-[6px_6px_0px_0px_rgba(15,23,42,1)]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.12 }}
            >
              {activeTab === 'dashboard' && <ProgressDashboard />}
              {activeTab === 'materials' && <Materials />}
              {activeTab === 'appointments' && <Appointments />}
              {activeTab === 'videos' && <VideoArchive />}
              {activeTab === 'chat' && <ChatMessenger />}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Footer info line */}
        <footer className="text-center text-[10px] font-bold uppercase tracking-wide text-slate-400 py-4">
          <span>Logged in as <strong className="text-slate-700">{currentUser.email}</strong> • Authenticated secure association workspace</span>
        </footer>

      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
