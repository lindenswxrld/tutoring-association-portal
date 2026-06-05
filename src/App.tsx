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
    demoteToStudent,
    isDemoMode,
    authError,
    clearAuthError,
    loginAsDemoStudent,
    loginAsDemoTutor,
    loginAsCustomUser
  } = useAuth();
  
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginName, setLoginName] = useState('');
  const [loginRole, setLoginRole] = useState<'student' | 'tutor'>('student');
  const [loginGrade, setLoginGrade] = useState('Grade 11');

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
        
        {authError && (
          <div className="bg-red-400 border-b-4 border-slate-900 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-900 text-white font-black border-2 border-slate-900 leading-none">!</div>
                <div>
                  <p className="font-black text-slate-900 text-sm uppercase italic">Authenticating Halted (Popup Restricted)</p>
                  <p className="text-slate-900 text-xs font-bold uppercase tracking-tight">The OAuth sign-in pop-up was blockaded or closed by the user agent. Use Instant Sandbox below to test instantly.</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button 
                  onClick={loginAsDemoStudent}
                  className="px-3 py-1.5 bg-yellow-400 hover:bg-yellow-305 text-slate-900 text-xs font-black uppercase border-2 border-slate-900 shadow-[2px_2px_0px_0px_#000]"
                >
                  Student Guest Bypass
                </button>
                <button 
                  onClick={loginAsDemoTutor}
                  className="px-3 py-1.5 bg-teal-400 hover:bg-teal-305 text-slate-900 text-xs font-black uppercase border-2 border-slate-900 shadow-[2px_2px_0px_0px_#000]"
                >
                  Tutor Guest Bypass
                </button>
                <button 
                  onClick={clearAuthError}
                  className="text-slate-900 hover:text-slate-950 text-xs uppercase font-black underline px-2 cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

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
              onClick={() => setShowLoginModal(true)}
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
                onClick={() => setShowLoginModal(true)}
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

            <div className="pt-4 border-t-4 border-dashed border-slate-300 max-w-xl">
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block mb-2">Sandbox Immediate Bypass (No Google Popups and No IFrame blockers)</span>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={loginAsDemoStudent}
                  className="px-5 py-3 bg-slate-900 text-white hover:bg-slate-800 font-black text-xs uppercase tracking-wider border-2 border-slate-900 shadow-[2px_2px_0px_0px_#facc15] hover:shadow-[4px_4px_0px_0px_#facc15] active:translate-x-0 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <GraduationCap size={14} className="text-yellow-400" />
                  Launch Student Demo
                </button>
                <button
                  onClick={loginAsDemoTutor}
                  className="px-5 py-3 bg-slate-900 text-white hover:bg-slate-800 font-black text-xs uppercase tracking-wider border-2 border-slate-900 shadow-[2px_2px_0px_0px_#2dd4bf] hover:shadow-[4px_4px_0px_0px_#2dd4bf] active:translate-x-0 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Briefcase size={14} className="text-teal-400" />
                  Launch Tutor Demo
                </button>
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

        {/* Modern Interactive Neobrutalist Login Dialog Overlay */}
        <AnimatePresence>
          {showLoginModal && (
            <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center p-4 z-50 overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ duration: 0.15 }}
                className="bg-white border-4 border-slate-900 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] max-w-2xl w-full overflow-hidden"
              >
                {/* Modal Header */}
                <div className="p-6 bg-yellow-400 border-b-4 border-slate-900 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-widest font-black text-slate-900">Academic Portal Access Gate</span>
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">🔐 Sign In to the Association Portal</h2>
                  </div>
                  <button
                    onClick={() => setShowLoginModal(false)}
                    className="h-10 w-10 bg-slate-900 hover:bg-slate-800 text-white font-black border-2 border-slate-900 flex items-center justify-center text-lg shadow-[2px_2px_0px_0px_rgba(250,204,21,1)] cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 md:p-8 space-y-6 max-h-[80vh] overflow-y-auto bg-slate-50">
                  
                  {/* Warning inside IFrames */}
                  <div className="p-3.5 bg-blue-50 border-2 border-blue-400 text-slate-800 text-xs font-bold uppercase leading-relaxed">
                    💡 <span className="text-blue-900 font-extrabold">Notice:</span> If the Google Sign-in button fails due to browser pop-up restrictions inside the AI Studio frame, please use the <span className="text-yellow-600 bg-yellow-105 px-1 border border-yellow-300">Instant Access Portal</span> below. It works completely in all frame contexts!
                  </div>

                  {/* Split Layout: Custom login & Sandbox */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                    
                    {/* Column 1: Custom Credentials Login */}
                    <div className="bg-white border-2 border-slate-900 p-5 flex flex-col justify-between space-y-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider">Method A</span>
                        <h3 className="font-extrabold text-slate-900 text-sm uppercase italic">Custom Credentials Access</h3>
                        <p className="text-slate-500 text-[10px] uppercase font-bold max-w-xs leading-normal">
                          Type any custom name & email to log in and immediately test the app with your own profile!
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-[9px] font-black uppercase text-slate-600 mb-1">Your Full Name</label>
                          <input
                            type="text"
                            placeholder="e.g. Scholar Klinden"
                            value={loginName}
                            onChange={(e) => setLoginName(e.target.value)}
                            className="w-full text-xs p-2 border-2 border-slate-900 font-bold bg-slate-50 focus:bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[9px] font-black uppercase text-slate-600 mb-1">Your Email Address</label>
                          <input
                            type="email"
                            placeholder="e.g. dlaminiklinden@gmail.com"
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                            className="w-full text-xs p-2 border-2 border-slate-900 font-bold bg-slate-50 focus:bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[9px] font-black uppercase text-slate-600 mb-1">Your Selected Role</label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setLoginRole('student')}
                              className={`p-2 border-2 text-[10px] font-black uppercase text-center transition-all ${
                                loginRole === 'student'
                                  ? 'bg-yellow-400 text-slate-900 border-slate-900 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                                  : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              🎓 Student
                            </button>
                            <button
                              type="button"
                              onClick={() => setLoginRole('tutor')}
                              className={`p-2 border-2 text-[10px] font-black uppercase text-center transition-all ${
                                loginRole === 'tutor'
                                  ? 'bg-teal-400 text-slate-900 border-slate-900 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                                  : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              💼 Tutor
                            </button>
                          </div>
                        </div>

                        {loginRole === 'student' && (
                          <div className="animate-fade-in">
                            <label className="block text-[9px] font-black uppercase text-slate-600 mb-1">Your Academic Level</label>
                            <select
                              value={loginGrade}
                              onChange={(e) => setLoginGrade(e.target.value)}
                              className="w-full text-xs p-2 border-2 border-slate-900 font-bold bg-slate-50"
                            >
                              <option value="Grade 9">Grade 9 (Junior High)</option>
                              <option value="Grade 10">Grade 10 (Intermediate)</option>
                              <option value="Grade 11">Grade 11 (Senior Core)</option>
                              <option value="Grade 12">Grade 12 (Prep Course)</option>
                              <option value="College Prep">College Placement Prep</option>
                              <option value="Undergraduate Core">Undergraduate Core</option>
                            </select>
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (!loginName.trim()) {
                            alert("Please supply a name for your custom profile academic record.");
                            return;
                          }
                          if (!loginEmail.trim() || !loginEmail.includes('@')) {
                            alert("Please supply a valid email address.");
                            return;
                          }
                          loginAsCustomUser(loginEmail, loginName, loginRole, loginGrade);
                          setShowLoginModal(false);
                        }}
                        className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white hover:text-yellow-400 font-black text-xs uppercase border-2 border-slate-900 shadow-[2px_2px_0px_0px_#facc15] active:translate-x-0 transition-all cursor-pointer"
                      >
                        ⚡ LAUNCH CUSTOM SESSION
                      </button>
                    </div>

                    {/* Column 2: Sandbox Quick Demos (One-Click Bypasses) */}
                    <div className="bg-white border-2 border-slate-900 p-5 flex flex-col justify-between space-y-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase text-teal-600 tracking-wider">Method B</span>
                        <h3 className="font-extrabold text-slate-900 text-sm uppercase italic">Instant Quick Sandboxes</h3>
                        <p className="text-slate-500 text-[10px] uppercase font-bold max-w-xs leading-normal">
                          Instantly login with preconfigured real mock data. No configuration needed!
                        </p>
                      </div>

                      <div className="space-y-3">
                        {/* Student Sandbox */}
                        <button
                          type="button"
                          onClick={() => {
                            loginAsDemoStudent();
                            setShowLoginModal(false);
                          }}
                          className="w-full p-4 border-2 border-slate-900 hover:bg-slate-50 hover:border-slate-800 text-left transition-all shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] flex items-center justify-between cursor-pointer"
                        >
                          <div>
                            <span className="font-black text-xs text-slate-900 uppercase italic">Alex Sandbox Student</span>
                            <span className="block text-[9px] text-slate-500 font-bold uppercase mt-0.5">Grade 11 • Test Metrics • Booking Slots</span>
                          </div>
                          <div className="bg-yellow-400 border border-slate-900 p-1 text-[10px] font-black text-slate-900">
                            GO
                          </div>
                        </button>

                        {/* Tutor Sandbox */}
                        <button
                          type="button"
                          onClick={() => {
                            loginAsDemoTutor();
                            setShowLoginModal(false);
                          }}
                          className="w-full p-4 border-2 border-slate-900 hover:bg-slate-50 hover:border-slate-800 text-left transition-all shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] flex items-center justify-between cursor-pointer"
                        >
                          <div>
                            <span className="font-black text-xs text-slate-900 uppercase italic">Dr. Sarah Peterson</span>
                            <span className="block text-[9px] text-slate-500 font-bold uppercase mt-0.5">Lead Instructor • Verification • Chat Host</span>
                          </div>
                          <div className="bg-teal-400 border border-slate-900 p-1 text-[10px] font-black text-slate-900">
                            GO
                          </div>
                        </button>
                      </div>

                      {/* Method C: Google Official Redirect / Popup */}
                      <div className="pt-4 border-t-2 border-dashed border-slate-200">
                        <span className="text-[10px] font-black uppercase text-slate-400 block mb-1.5">Official Single Sign-On (Cloud)</span>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await login();
                              setShowLoginModal(false);
                            } catch (e) {
                              // error is already rendered on the main screen
                            }
                          }}
                          className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 font-black text-[10px] uppercase border-2 border-slate-900 flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24">
                            <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114A5.99 5.99 0 0112 18a6 6 0 116-6c0 .341-.035.67-.09 1h4.155A10.2 10.2 0 0022 12c0-5.523-4.477-10-10-10S2 6.477 2 12s4.477 10 10 10c3.2 0 6.07-1.51 7.93-3.872l-3.326-2.515c-1.127.876-2.541 1.387-4.104 1.387-3.313 0-6-2.687-6-6s2.687-6 6-6c1.621 0 3.09.643 4.172 1.684l2.92-2.92A9.95 9.95 0 0012 2.2c-5.41 0-9.8 4.28-9.993 9.61h6.233z"/>
                          </svg>
                          Google Account Login
                        </button>
                      </div>

                    </div>

                  </div>

                </div>

                {/* Modal Footer */}
                <div className="p-4 bg-slate-200 border-t-4 border-slate-900 text-center text-[10px] font-bold text-slate-500 uppercase">
                  ⚡ SECURE PRIVATE REVISION ENVIRONMENT • ENCRYPTED SESSION TERMINAL
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

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
