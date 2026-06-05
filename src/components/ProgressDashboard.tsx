/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, doc, setDoc, updateDoc, onSnapshot, query, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { ProgressMetric, AppUser } from '../types';
import { Award, BookOpen, Clock, FileText, CheckCircle2, ChevronRight, RefreshCw, PenTool, TrendingUp, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { mockDb } from '../lib/mockDb';

interface MockScore {
  subject: string;
  score: number;
  maxScore: number;
  date: string;
}

export const ProgressDashboard: React.FC = () => {
  const { currentUser, isDemoMode } = useAuth();
  const [metric, setMetric] = useState<ProgressMetric | null>(null);
  const [allMetrics, setAllMetrics] = useState<ProgressMetric[]>([]);
  const [students, setStudents] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);

  // If tutor: active student selected to manage
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // Editing state for Tutor
  const [editHours, setEditHours] = useState<number>(12);
  const [editSyllabus, setEditSyllabus] = useState<number>(65);
  const [editCompleted, setEditCompleted] = useState<number>(4);
  const [editTotal, setEditTotal] = useState<number>(6);
  const [saving, setSaving] = useState(false);

  // Mock test scores
  const [mockScores, setMockScores] = useState<MockScore[]>([
    { subject: 'Mathematics', score: 82, maxScore: 100, date: '2026-05-15' },
    { subject: 'Physics', score: 75, maxScore: 100, date: '2026-05-20' },
    { subject: 'Chemistry', score: 91, maxScore: 100, date: '2026-06-01' }
  ]);
  const [newScoreSubject, setNewScoreSubject] = useState('Mathematics');
  const [newScoreVal, setNewScoreVal] = useState(85);

  // Load list of students if Tutor
  useEffect(() => {
    if (currentUser?.role !== 'tutor') return;

    if (isDemoMode) {
      const list = [
        {
          userId: 'demo_student_uid',
          name: 'Alex Sandbox Student',
          email: 'alex.scholar@demo-association.org',
          role: 'student',
          grade: 'Grade 11',
          createdAt: new Date().toISOString()
        }
      ];
      setStudents(list as any);
      setSelectedStudentId('demo_student_uid');
      return;
    }

    const fetchStudents = async () => {
      try {
        const snap = await getDocs(query(collection(db, 'users')));
        const list: AppUser[] = [];
        snap.forEach((doc) => {
          const u = doc.data() as AppUser;
          if (u.role === 'student') list.push(u);
        });
        setStudents(list);
        if (list.length > 0) {
          setSelectedStudentId(list[0].userId);
        }
      } catch (error) {
        console.error("Error gathering students for dashboard:", error);
      }
    };
    fetchStudents();
  }, [currentUser, isDemoMode]);

  // Load all progress metrics for real-time overview
  useEffect(() => {
    if (isDemoMode) {
      const loadAllMetrics = () => {
        setAllMetrics(mockDb.getMetrics());
      };
      loadAllMetrics();
      window.addEventListener('mock_db_update', loadAllMetrics);
      return () => {
        window.removeEventListener('mock_db_update', loadAllMetrics);
      };
    }

    const q = query(collection(db, 'progress-metrics'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: ProgressMetric[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as ProgressMetric);
      });
      setAllMetrics(list);
    });
    return () => unsubscribe();
  }, [isDemoMode]);

  // Listen to active student or current student metric
  useEffect(() => {
    if (!currentUser) return;
    const targetId = currentUser.role === 'student' ? currentUser.userId : selectedStudentId;
    if (!targetId) {
      setLoading(false);
      return;
    }

    if (isDemoMode) {
      const loadActiveMetric = () => {
        const data = mockDb.getMetric(targetId);
        if (data) {
          setMetric(data);
          setEditHours(data.hoursCompleted);
          setEditSyllabus(data.syllabusCoverage);
          setEditCompleted(data.assignmentsCompleted);
          setEditTotal(data.totalAssignments);
        } else {
          setMetric(null);
          setEditHours(0);
          setEditSyllabus(0);
          setEditCompleted(0);
          setEditTotal(0);
        }
        setLoading(false);
      };
      loadActiveMetric();
      window.addEventListener('mock_db_update', loadActiveMetric);
      return () => {
        window.removeEventListener('mock_db_update', loadActiveMetric);
      };
    }

    setLoading(true);
    const unsubscribe = onSnapshot(doc(db, 'progress-metrics', targetId), async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as ProgressMetric;
        setMetric(data);
        setEditHours(data.hoursCompleted);
        setEditSyllabus(data.syllabusCoverage);
        setEditCompleted(data.assignmentsCompleted);
        setEditTotal(data.totalAssignments);
      } else {
        setMetric(null);
        setEditHours(0);
        setEditSyllabus(0);
        setEditCompleted(0);
        setEditTotal(0);
      }
      setLoading(false);
    }, (error) => {
      console.warn("Permission constraints or no record yet", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser, selectedStudentId, isDemoMode]);

  const handleUpdateMetrics = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetId = currentUser?.role === 'student' ? currentUser.userId : selectedStudentId;
    if (!targetId) return;

    setSaving(true);
    const path = `progress-metrics/${targetId}`;

    if (isDemoMode) {
      const payload: ProgressMetric = {
        metricId: targetId,
        studentId: targetId,
        hoursCompleted: Number(editHours),
        syllabusCoverage: Number(editSyllabus),
        assignmentsCompleted: Number(editCompleted),
        totalAssignments: Number(editTotal),
        updatedAt: new Date().toISOString()
      };
      mockDb.saveMetric(payload);
      setSaving(false);
      return;
    }

    try {
      const payload: ProgressMetric = {
        metricId: targetId,
        studentId: targetId,
        hoursCompleted: Number(editHours),
        syllabusCoverage: Number(editSyllabus),
        assignmentsCompleted: Number(editCompleted),
        totalAssignments: Number(editTotal),
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'progress-metrics', targetId), payload);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    } finally {
      setSaving(false);
    }
  };

  const handleAddMockScore = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanScore: MockScore = {
      subject: newScoreSubject,
      score: Number(newScoreVal),
      maxScore: 100,
      date: new Date().toISOString().split('T')[0]
    };
    setMockScores(prev => [cleanScore, ...prev]);
    setNewScoreVal(85);
  };

  const handleQuickSeedMetrics = () => {
    setEditHours(24);
    setEditSyllabus(80);
    setEditCompleted(8);
    setEditTotal(10);
  };

  const selectedStudentObj = students.find(s => s.userId === selectedStudentId);

  // Circle Calculations
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - ((metric?.syllabusCoverage || 0) / 100) * circumference;

  return (
    <div className="space-y-8">
      
      {/* Title Display Section */}
      <div className="border-b-4 border-slate-900 pb-4">
        <h2 className="text-4xl sm:text-5xl font-black tracking-tighter text-slate-900 uppercase italic flex items-center gap-3">
          <Award size={36} className="text-yellow-500 stroke-[3px]" />
          OVERVIEW.
        </h2>
        <p className="text-xs font-mono uppercase font-bold text-slate-500 mt-1">
          Real-time tracking of private syllabi, mock scores, assessment counts, and study hours.
        </p>
      </div>

      {/* Tutor Update Controls Panel */}
      {currentUser?.role === 'tutor' && (
        <div className="bg-white border-4 border-slate-900 p-6 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-4 space-y-3">
            <h3 className="font-black text-slate-900 text-xs uppercase tracking-widest flex items-center gap-1.5 border-b-2 border-slate-900 pb-2">
              <CheckCircle2 size={14} className="text-yellow-500" />
              1. Choose Student Account
            </h3>
            
            <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
              {students.map((s) => {
                const isActive = s.userId === selectedStudentId;
                const mRecord = allMetrics.find(m => m.studentId === s.userId);
                return (
                  <button
                    key={s.userId}
                    onClick={() => setSelectedStudentId(s.userId)}
                    className={`w-full p-3 text-left transition-all cursor-pointer flex items-center justify-between border-2 ${
                      isActive
                        ? 'bg-slate-900 text-white border-slate-900 shadow-[2px_2px_0px_0px_#facc15]'
                        : 'bg-white text-slate-700 border-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="font-black text-xs uppercase tracking-tight">{s.name}</div>
                      <div className={`text-[10px] font-bold uppercase tracking-tight ${isActive ? 'text-yellow-400' : 'text-slate-400'}`}>
                        {s.grade || 'Undef Level'}
                      </div>
                    </div>
                    {mRecord && (
                      <span className={`px-2 py-0.5 text-[10px] font-bold border ${
                        isActive ? 'bg-yellow-400 text-slate-950 border-slate-950' : 'bg-slate-100 text-slate-800 border-slate-300'
                      }`}>
                        {mRecord.syllabusCoverage}%
                      </span>
                    )}
                  </button>
                );
              })}
              {students.length === 0 && (
                <div className="text-xs text-slate-400 py-3 text-center bg-slate-50 border-2 border-slate-900 font-bold uppercase">
                  No registered students found yet.
                </div>
              )}
            </div>
          </div>

          {/* Metrics update form */}
          <form onSubmit={handleUpdateMetrics} className="lg:col-span-8 space-y-4">
            <h3 className="font-black text-slate-900 text-xs uppercase tracking-widest flex items-center gap-1.5 border-b-2 border-slate-900 pb-2">
              <PenTool size={14} className="text-yellow-500" />
              2. Adjust Telemetry: {selectedStudentObj?.name || 'Academic Record'}
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label htmlFor="completedHours" className="block text-[10px] uppercase font-black text-slate-500 mb-1">Study Hours</label>
                <input
                  id="completedHours"
                  type="number"
                  value={editHours}
                  onChange={(e) => setEditHours(Number(e.target.value))}
                  className="w-full text-xs p-2.5 border-2 border-slate-900 font-bold focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="syllabusCoverage" className="block text-[10px] uppercase font-black text-slate-500 mb-1">Syllabus %</label>
                <input
                  id="syllabusCoverage"
                  type="number"
                  min="0"
                  max="100"
                  value={editSyllabus}
                  onChange={(e) => setEditSyllabus(Number(e.target.value))}
                  className="w-full text-xs p-2.5 border-2 border-slate-900 font-bold focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="assignmentsCompleted" className="block text-[10px] uppercase font-black text-slate-500 mb-1">Done Tasks</label>
                <input
                  id="assignmentsCompleted"
                  type="number"
                  value={editCompleted}
                  onChange={(e) => setEditCompleted(Number(e.target.value))}
                  className="w-full text-xs p-2.5 border-2 border-slate-900 font-bold focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="totalAssignments" className="block text-[10px] uppercase font-black text-slate-500 mb-1">Total Tasks</label>
                <input
                  id="totalAssignments"
                  type="number"
                  value={editTotal}
                  onChange={(e) => setEditTotal(Number(e.target.value))}
                  className="w-full text-xs p-2.5 border-2 border-slate-900 font-bold focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center pt-2 gap-3">
              <button
                type="button"
                onClick={handleQuickSeedMetrics}
                className="text-[10px] font-black text-slate-900 uppercase tracking-wider hover:underline"
              >
                ⚡ Fill Sample Track
              </button>

              <button
                type="submit"
                disabled={saving || !selectedStudentId}
                className="px-6 py-2.5 brutal-btn-black text-xs font-black"
              >
                {saving ? 'SYNCING...' : 'SYNC PROGRESS'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main progress graphs & stats display */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* SVG Metrics Ring and key counters */}
        <div className="bg-white border-4 border-slate-900 p-6 flex flex-col justify-between shadow-[4px_4px_0px_0px_#0f172a]">
          <div>
            <span className="text-[10px] uppercase tracking-widest font-black text-slate-400">Current Standing</span>
            <h3 className="font-black text-slate-950 text-sm uppercase italic mt-0.5">Syllabus Completion</h3>
          </div>

          {loading ? (
            <div className="py-12 flex justify-center">
              <RefreshCw className="animate-spin text-slate-900" size={24} />
            </div>
          ) : !metric ? (
            <div className="py-12 text-center space-y-3">
              <BookOpen size={30} className="mx-auto text-slate-300" />
              <p className="text-xs uppercase font-bold text-slate-400">No telemetry logged yet.</p>
              {currentUser?.role === 'student' ? (
                <p className="text-[10px] text-slate-500 uppercase tracking-tight max-w-[200px] mx-auto">
                   Ask your mentor to initiate your performance scoring tracker!
                </p>
              ) : (
                <p className="text-[10px] text-red-600 font-bold uppercase">Press Sync Progress above to create the initial record!</p>
              )}
            </div>
          ) : (
            <div className="py-6 flex flex-col items-center">
              
              {/* Radial Tracker */}
              <div className="relative">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r={radius}
                    className="stroke-slate-100 fill-transparent"
                    strokeWidth="10"
                  />
                  <motion.circle
                    cx="64"
                    cy="64"
                    r={radius}
                    className="stroke-slate-900 fill-transparent"
                    strokeWidth="10"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 0.8 }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-3xl font-black text-slate-950 tracking-tight">{metric.syllabusCoverage}%</span>
                  <span className="text-[9px] uppercase font-black tracking-wider text-slate-400 leading-none">Completed</span>
                </div>
              </div>

              {/* Assignments Complete progress bar */}
              <div className="w-full mt-6 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase">
                  <span>Assignments Done</span>
                  <span className="font-extrabold text-slate-900">
                    {metric.assignmentsCompleted} / {metric.totalAssignments} TASKS
                  </span>
                </div>
                <div className="h-4 w-full bg-slate-100 border-2 border-slate-900 overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 transition-all duration-500 border-r-2 border-slate-900"
                    style={{ width: `${metric.totalAssignments > 0 ? (metric.assignmentsCompleted / metric.totalAssignments) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="pt-4 border-t-2 border-slate-900 flex items-center justify-between text-slate-900 text-xs font-black uppercase">
            <span className="flex items-center gap-1">
              <Clock size={13} className="text-slate-900 stroke-[2.5px]" />
              Study Hours:
            </span>
            <span className="bg-yellow-400 px-2 py-0.5 border-2 border-slate-900">{metric?.hoursCompleted || 0} HRS</span>
          </div>
        </div>

        {/* Mock Exam results list and form */}
        <div className="bg-white border-4 border-slate-900 p-6 lg:col-span-2 flex flex-col justify-between space-y-6 shadow-[4px_4px_0px_0px_#0f172a]">
          <div>
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
              <div>
                <span className="text-[10px] uppercase tracking-widest font-black text-slate-400">Mock Assessments</span>
                <h3 className="font-black text-slate-950 text-sm uppercase italic mt-0.5">Test Examination Progression</h3>
              </div>
              <span className="text-xs bg-yellow-400 text-slate-905 border-2 border-slate-900 px-3 py-1 font-black uppercase tracking-tight flex items-center gap-1.5">
                <TrendingUp size={12} className="stroke-[3px]" />
                Avg: {mockScores.length > 0 ? Math.round(mockScores.reduce((sum, item) => sum + item.score, 0) / mockScores.length) : 0}%
              </span>
            </div>

            {/* List of scores */}
            <div className="mt-4 space-y-2 max-h-[170px] overflow-y-auto pr-1">
              {mockScores.map((score, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-slate-50 border-2 border-slate-900 transition-colors gap-2">
                  <div className="space-y-0.5">
                    <div className="font-black text-slate-900 text-xs uppercase tracking-tight italic">{score.subject} REVIEW</div>
                    <div className="text-[9px] text-slate-400 font-mono font-bold uppercase">Date recorded: {score.date}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-20 bg-slate-200 h-3 border border-slate-900 overflow-hidden">
                      <div className="bg-slate-900 h-full" style={{ width: `${score.score}%` }} />
                    </div>
                    <span className="font-black text-xs text-slate-900 bg-white border border-slate-900 px-2 py-0.5 min-w-[55px] text-center">{score.score} / {score.maxScore}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add test score widget */}
          {currentUser && (
            <form onSubmit={handleAddMockScore} className="p-4 bg-yellow-100 border-2 border-slate-900 flex flex-col md:flex-row items-end gap-3 justify-between">
              <div className="w-full space-y-2">
                <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest block">Log New Performance Test Score</span>
                
                <div className="grid grid-cols-2 gap-3">
                  <select
                    id="scoreSubject"
                    value={newScoreSubject}
                    onChange={(e) => setNewScoreSubject(e.target.value)}
                    className="w-full text-xs p-2 border-2 border-slate-900 font-bold bg-white"
                  >
                    {['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Computer Science'].map(s => (
                       <option key={s} value={s}>{s}</option>
                    ))}
                  </select>

                  <div className="flex items-center gap-1.5">
                    <input
                      id="scoreValue"
                      type="number"
                      min="0"
                      max="100"
                      value={newScoreVal}
                      onChange={(e) => setNewScoreVal(Number(e.target.value))}
                      className="w-full text-xs p-1.5 border-2 border-slate-900 font-bold bg-white"
                    />
                    <span className="text-xs font-black text-slate-900">%</span>
                  </div>
                </div>
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-tight border-2 border-slate-900 shadow-[2px_2px_0px_0px_#facc15] shrink-0 whitespace-nowrap cursor-pointer"
              >
                Log Mock Score
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
