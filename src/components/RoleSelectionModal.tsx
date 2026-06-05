/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, Briefcase, BookOpen, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

export const RoleSelectionModal: React.FC = () => {
  const { registerProfile, firebaseUser } = useAuth();
  const [selectedRole, setSelectedRole] = useState<'student' | 'tutor' | null>(null);
  const [grade, setGrade] = useState<string>('Grade 11');
  const [submitting, setSubmitting] = useState(false);

  const grades = [
    'Grade 9',
    'Grade 10',
    'Grade 11',
    'Grade 12',
    'College Prep',
    'Undergraduate Core'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;
    setSubmitting(true);
    try {
      await registerProfile(selectedRole, selectedRole === 'student' ? grade : undefined);
    } catch (error) {
      console.error("Failed to complete onboarding:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center p-4 z-50">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.15 }}
        className="bg-white border-4 border-slate-900 shadow-[8px_8px_0px_0px_#facc15] max-w-lg w-full overflow-hidden rounded-none"
      >
        <div className="p-8 border-b-4 border-slate-900 bg-yellow-400">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-slate-900 text-white border-2 border-slate-900">
              <BookOpen size={24} className="stroke-[2px]" />
            </div>
            <span className="text-xs font-black tracking-widest text-slate-905 uppercase">Onboarding</span>
          </div>
          <h2 className="text-3xl font-black tracking-tighter text-slate-950 uppercase italic leading-none">Register Academic Account</h2>
          <p className="text-slate-900 text-xs font-bold mt-2 uppercase">
            Welcome, {firebaseUser?.displayName || 'Scholar'}! Select your profile type to configure materials, revision schedules, and messaging lines.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div>
            <label className="block text-xs font-black text-slate-900 uppercase tracking-widest mb-3">
              Identify Your Role
            </label>
            <div className="grid grid-cols-2 gap-4">
              {/* Student Option Card */}
              <button
                type="button"
                onClick={() => setSelectedRole('student')}
                className={`flex flex-col items-center text-center p-5 border-4 transition-all cursor-pointer rounded-none ${
                  selectedRole === 'student'
                    ? 'border-slate-900 bg-yellow-400 text-slate-950 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]'
                    : 'border-slate-900 hover:border-slate-800 bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <div className="p-3 bg-slate-900 text-white border-2 border-slate-900 mb-3">
                  <GraduationCap size={24} />
                </div>
                <span className="font-black text-sm uppercase tracking-tight italic">Student Portal</span>
                <span className="text-[10px] text-slate-500 font-bold uppercase mt-2 leading-tight">Access syllabus guides, log study status, and stream revision playbacks</span>
              </button>

              {/* Tutor Option Card */}
              <button
                type="button"
                onClick={() => setSelectedRole('tutor')}
                className={`flex flex-col items-center text-center p-5 border-4 transition-all cursor-pointer rounded-none ${
                  selectedRole === 'tutor'
                    ? 'border-slate-900 bg-yellow-400 text-slate-950 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]'
                    : 'border-slate-900 hover:border-slate-800 bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <div className="p-3 bg-slate-900 text-white border-2 border-slate-900 mb-3">
                  <Briefcase size={22} />
                </div>
                <span className="font-black text-sm uppercase tracking-tight italic">Tutor Console</span>
                <span className="text-[10px] text-slate-500 font-bold uppercase mt-2 leading-tight">Distribute revision keys, verify cancellations, and record achievements</span>
              </button>
            </div>
          </div>

          {selectedRole === 'student' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="space-y-2 overflow-hidden"
            >
              <label htmlFor="gradeSelect" className="block text-xs font-black text-slate-900 uppercase tracking-widest">
                Select Academic Level / Grade
              </label>
              <select
                id="gradeSelect"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="brutal-select cursor-pointer"
              >
                {grades.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </motion.div>
          )}

          <div className="pt-4 border-t-2 border-slate-200 flex items-center justify-end">
            <button
              type="submit"
              disabled={!selectedRole || submitting}
              className={`px-5 py-3 border-4 font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer rounded-none ${
                selectedRole && !submitting
                  ? 'brutal-btn-primary'
                  : 'bg-slate-100 text-slate-400 border-slate-300 cursor-not-allowed shadow-none'
              }`}
            >
              {submitting ? 'Setting up...' : 'Enter Applet'}
              <ChevronRight size={16} />
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
