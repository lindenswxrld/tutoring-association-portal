/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, doc, setDoc, updateDoc, onSnapshot, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Appointment, AppUser } from '../types';
import { Calendar as CalendarIcon, Clock, XCircle, Plus, AlertCircle, BookOpen, Check, HelpCircle, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { mockDb } from '../lib/mockDb';

export const Appointments: React.FC = () => {
  const { currentUser, isDemoMode } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [tutorsList, setTutorsList] = useState<AppUser[]>([]);
  
  // Tabs: 'active' | 'history'
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

  // Create booking state
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [formData, setFormData] = useState({
    tutorId: '',
    date: '',
    time: '',
    subject: 'Mathematics'
  });
  const [submitting, setSubmitting] = useState(false);

  // Reschedule state (For tutors only)
  const [reschedulingId, setReschedulingId] = useState<string | null>(null);
  const [rescheduleData, setRescheduleData] = useState({
    date: '',
    time: ''
  });

  const subjects = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Computer Science'];

  // Load appointments
  useEffect(() => {
    if (!currentUser) return;

    if (isDemoMode) {
      const loadAppts = () => {
        const all = mockDb.getAppointments();
        const filtered = all.filter(a => {
          if (currentUser.role === 'student') {
            return a.studentId === currentUser.userId;
          } else {
            return a.tutorId === currentUser.userId;
          }
        });
        setAppointments(filtered);
        setLoading(false);
      };
      loadAppts();
      window.addEventListener('mock_db_update', loadAppts);
      return () => {
        window.removeEventListener('mock_db_update', loadAppts);
      };
    }

    let q = query(
      collection(db, 'appointments'),
      orderBy('createdAt', 'desc')
    );

    if (currentUser.role === 'student') {
      q = query(
        collection(db, 'appointments'),
        where('studentId', '==', currentUser.userId),
        orderBy('createdAt', 'desc')
      );
    } else {
      q = query(
        collection(db, 'appointments'),
        where('tutorId', '==', currentUser.userId),
        orderBy('createdAt', 'desc')
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: Appointment[] = [];
      snapshot.forEach((doc) => {
        items.push(doc.data() as Appointment);
      });
      setAppointments(items);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'appointments');
    });

    return () => unsubscribe();
  }, [currentUser, isDemoMode]);

  // Load tutors for student booking dropdown
  useEffect(() => {
    if (currentUser?.role !== 'student') return;

    if (isDemoMode) {
      const list = [
        {
          userId: 'demo_tutor_uid',
          name: 'Dr. Sarah Peterson (Mathematics & Physics Lead)',
          email: 'sarah.peterson@demo-association.org',
          role: 'tutor',
          createdAt: new Date().toISOString()
        }
      ];
      setTutorsList(list as any);
      setFormData(prev => ({ ...prev, tutorId: 'demo_tutor_uid' }));
      return;
    }

    const fetchTutors = async () => {
      try {
        const q = query(collection(db, 'users'), where('role', '==', 'tutor'));
        const querySnap = await getDocs(q);
        const list: AppUser[] = [];
        querySnap.forEach((doc) => {
          list.push(doc.data() as AppUser);
        });
        
        if (list.length === 0) {
          list.push({
            userId: 'fallback_tutor_1',
            name: 'Dr. Sarah Peterson (Mathematics & Physics Lead)',
            email: 'sarah.p@association.org',
            role: 'tutor',
            createdAt: new Date().toISOString()
          });
        }
        setTutorsList(list);
        if (list.length > 0) {
          setFormData(prev => ({ ...prev, tutorId: list[0].userId }));
        }
      } catch (error) {
        console.error('Failed to grab tutors for list dropdown:', error);
      }
    };

    fetchTutors();
  }, [currentUser, isDemoMode]);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !formData.date || !formData.time) return;

    setSubmitting(true);
    const appointmentId = `appt_${Date.now()}`;
    const selectedTutorObj = tutorsList.find(t => t.userId === formData.tutorId);
    const tutorName = selectedTutorObj ? selectedTutorObj.name : 'Dr. Sarah Peterson';

    const tutorId = formData.tutorId || 'demo_tutor_uid';

    if (isDemoMode) {
      const payload: Appointment = {
        appointmentId,
        studentId: currentUser.userId,
        studentName: currentUser.name,
        tutorId,
        tutorName,
        date: formData.date,
        time: formData.time,
        subject: formData.subject,
        status: 'scheduled',
        createdAt: new Date().toISOString()
      };
      mockDb.saveAppointment(payload);
      setShowBookingForm(false);
      setFormData({
        tutorId: 'demo_tutor_uid',
        date: '',
        time: '',
        subject: 'Mathematics'
      });
      setSubmitting(false);
      return;
    }

    try {
      const payload: Appointment = {
        appointmentId,
        studentId: currentUser.userId,
        studentName: currentUser.name,
        tutorId,
        tutorName,
        date: formData.date,
        time: formData.time,
        subject: formData.subject,
        status: 'scheduled',
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'appointments', appointmentId), payload);
      setShowBookingForm(false);
      setFormData({
        tutorId: tutorsList[0]?.userId || '',
        date: '',
        time: '',
        subject: 'Mathematics'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `appointments/${appointmentId}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (apptId: string) => {
    if (!window.confirm("Are you sure you want to cancel this tutoring appointment?")) return;
    
    if (isDemoMode) {
      mockDb.updateAppointment(apptId, {
        status: 'cancelled',
        cancelledAt: new Date().toISOString()
      });
      return;
    }

    const path = `appointments/${apptId}`;
    try {
      await updateDoc(doc(db, 'appointments', apptId), {
        status: 'cancelled',
        cancelledAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const handleReschedule = async (apptId: string) => {
    if (!rescheduleData.date || !rescheduleData.time) return;

    if (isDemoMode) {
      mockDb.updateAppointment(apptId, {
        date: rescheduleData.date,
        time: rescheduleData.time
      });
      setReschedulingId(null);
      return;
    }

    const path = `appointments/${apptId}`;
    try {
      await updateDoc(doc(db, 'appointments', apptId), {
        date: rescheduleData.date,
        time: rescheduleData.time
      });
      setReschedulingId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const handleQuickSlot = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateString = tomorrow.toISOString().split('T')[0];
    setFormData(prev => ({
      ...prev,
      date: dateString,
      time: '15:30',
      subject: 'Physics'
    }));
  };

  const activeAppointments = appointments.filter(a => a.status === 'scheduled');
  const historyAppointments = appointments.filter(a => a.status === 'cancelled');

  const currentList = activeTab === 'active' ? activeAppointments : historyAppointments;

  return (
    <div className="space-y-6">
      
      {/* Tab Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b-4 border-slate-900 pb-4">
        <div>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tighter text-slate-900 uppercase italic flex items-center gap-3">
            <CalendarIcon size={36} className="text-yellow-500 stroke-[3px]" />
            SCHEDULES.
          </h2>
          <p className="text-xs font-mono uppercase font-bold text-slate-500 mt-1">
            Book private learning sessions with Lead Tutors and keep track of upcoming schedules.
          </p>
        </div>

        {currentUser?.role === 'student' && (
          <button
            onClick={() => setShowBookingForm(!showBookingForm)}
            className="px-5 py-3 brutal-btn-black text-xs font-black"
          >
            {showBookingForm ? 'CLOSE APPOINTMENT OPTIONS' : 'BOOK TUTORING SLOT'}
          </button>
        )}
      </div>

      {/* Booking Form drawer overlay panel */}
      {showBookingForm && currentUser?.role === 'student' && (
        <motion.form
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleBooking}
          className="bg-yellow-50 p-6 border-4 border-slate-900 shadow-[6px_6px_0px_0px_#0f172a] grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <div className="space-y-4">
            <h3 className="font-black text-slate-900 text-xs uppercase tracking-widest border-b-2 border-slate-900 pb-1.5">Step 1: Choose Instructor</h3>
            <div>
              <label htmlFor="tutorSelect" className="block text-[10px] uppercase font-black text-slate-600 mb-1">Available Association Tutors</label>
              <select
                id="tutorSelect"
                value={formData.tutorId}
                onChange={(e) => setFormData({ ...formData, tutorId: e.target.value })}
                className="w-full text-xs p-2.5 border-2 border-slate-900 font-bold bg-white"
              >
                {tutorsList.map((t) => (
                  <option key={t.userId} value={t.userId}>{t.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="subjectSelect" className="block text-[10px] uppercase font-black text-slate-600 mb-1">Academic Focus</label>
              <select
                id="subjectSelect"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full text-xs p-2.5 border-2 border-slate-900 font-bold bg-white"
              >
                {subjects.map((sub) => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-black text-slate-900 text-xs uppercase tracking-widest border-b-2 border-slate-900 pb-1.5">Step 2: Time Assignment</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="bookingDate" className="block text-[10px] uppercase font-black text-slate-600 mb-1">Date</label>
                <input
                  id="bookingDate"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                  className="w-full text-xs p-2 border-2 border-slate-900 font-bold bg-white"
                />
              </div>

              <div>
                <label htmlFor="bookingTime" className="block text-[10px] uppercase font-black text-slate-600 mb-1">Time (UTC)</label>
                <input
                  id="bookingTime"
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  required
                  className="w-full text-xs p-2 border-2 border-slate-900 font-bold bg-white"
                />
              </div>
            </div>

            <div className="pt-2 text-[10px] font-bold uppercase text-slate-500 flex items-start gap-1">
              <AlertCircle size={14} className="text-red-500 shrink-0" />
              <span>Cancellations permitted up to 2 hours beforehand.</span>
            </div>
          </div>

          <div className="bg-white border-2 border-slate-900 p-5 flex flex-col justify-between">
            <div className="space-y-2 text-xs">
              <span className="text-[10px] font-black uppercase text-slate-400">Quick Configuration</span>
              <p className="text-slate-500 text-xs font-bold uppercase leading-normal">
                Test timings instantly? Auto-fill with a mock tomorrow afternoon afternoon schedule slot.
              </p>
              <button
                type="button"
                onClick={handleQuickSlot}
                className="text-xs text-slate-900 font-black uppercase tracking-tight block hover:underline text-left mt-1 cursor-pointer"
              >
                ⚡ Populate Quick Slot
              </button>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-4 py-2.5 brutal-btn-indigo text-xs font-black uppercase"
            >
              {submitting ? 'Booking Slot...' : 'Confirm with Tutor'}
            </button>
          </div>
        </motion.form>
      )}

      {/* Tabs Menu */}
      <div className="border-b-4 border-slate-900 pb-px flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('active')}
            className={`pb-3 text-xs font-black border-b-4 transition-all uppercase px-1 cursor-pointer ${
              activeTab === 'active'
                ? 'border-slate-900 text-slate-950 translate-y-1'
                : 'border-transparent text-slate-400 hover:text-slate-650'
            }`}
          >
            Upcoming Calendar ({activeAppointments.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 text-xs font-black border-b-4 transition-all uppercase px-1 cursor-pointer ${
              activeTab === 'history'
                ? 'border-slate-900 text-slate-950 translate-y-1'
                : 'border-transparent text-slate-400 hover:text-slate-650'
            }`}
          >
            Cancellations ({historyAppointments.length})
          </button>
        </div>
        <span className="text-[10px] font-mono font-black text-white uppercase bg-slate-900 px-3 py-1 border-2 border-slate-900 rounded-none self-start sm:self-auto">
          {currentUser?.role === 'student' ? 'Student Workspace' : 'Tutor Registry'}
        </span>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900" />
          <p className="text-xs font-mono font-bold uppercase text-slate-400">Loading appointments schedule...</p>
        </div>
      ) : currentList.length === 0 ? (
        <div className="bg-slate-50 border-4 border-dashed border-slate-300 p-12 text-center">
          <CalendarIcon size={40} className="mx-auto text-slate-400" />
          <h3 className="font-black text-slate-905 mt-2 text-sm uppercase tracking-tight">No appointments found</h3>
          <p className="text-slate-500 text-xs max-w-sm mx-auto mt-1 uppercase font-bold">
            {activeTab === 'active'
              ? 'No scheduled classes on your horizon. Book a session to test study progress trackers.'
              : 'Zero cancellations logged. Keep schedules healthy and on progress.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentList.map((a) => {
            const isTutorUser = currentUser?.role === 'tutor';
            const isCancelled = a.status === 'cancelled';
            const showRescheduleBox = reschedulingId === a.appointmentId;

            return (
              <motion.div
                layout
                key={a.appointmentId}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`p-6 flex flex-col justify-between border-4 ${
                  isCancelled 
                    ? 'border-slate-300 bg-slate-100/50 opacity-70' 
                    : 'border-slate-900 bg-white shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4 border-b-2 border-slate-900 pb-2">
                    <span className={`px-2 py-0.5 text-[9px] uppercase font-black border-2 ${
                      isCancelled
                        ? 'bg-slate-200 text-slate-600 border-slate-400'
                        : 'bg-yellow-400 text-slate-900 border-slate-900'
                    }`}>
                      {a.status}
                    </span>
                    <span className="text-[10px] font-black uppercase text-slate-900 bg-slate-100 border-2 border-slate-900 px-2.5 py-0.5">
                      {a.subject}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4 font-bold text-slate-700 text-xs uppercase leading-relaxed">
                    <div className="flex items-center gap-2">
                      <CalendarIcon size={14} className="text-slate-900 stroke-[2.5px]" />
                      <span className="text-slate-900 font-extrabold">{a.date}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-slate-900 stroke-[2.5px]" />
                      <span className="text-slate-900 font-extrabold">{a.time} (UTC)</span>
                    </div>

                    <div className="flex items-center gap-2 border-t pt-2 border-slate-100 mt-2 text-[11px]">
                      <span className="text-slate-400">
                        {isTutorUser ? 'Student Node:' : 'Instructor Node:'}
                      </span>
                      <span className="font-black text-slate-900">
                        {isTutorUser ? a.studentName : a.tutorName}
                      </span>
                    </div>
                  </div>

                  {isCancelled && a.cancelledAt && (
                    <div className="text-[10px] font-bold uppercase text-red-600 bg-red-50 border-2 border-red-200 p-2.5 flex items-start gap-1">
                      <AlertCircle size={12} className="shrink-0 mt-0.5 text-red-650" />
                      <span>
                        Cancelled: {new Date(a.cancelledAt).toLocaleTimeString()}
                      </span>
                    </div>
                  )}

                  {/* Rescheduling Panel inside Tutor views */}
                  {showRescheduleBox && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="bg-slate-100 p-3 border-2 border-slate-900 mt-2 space-y-2"
                    >
                      <h5 className="font-black text-[10px] uppercase text-slate-900">Reschedule Details</h5>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label htmlFor={`reschedDate-${a.appointmentId}`} className="block text-[9px] font-black uppercase text-slate-500">Date</label>
                          <input
                            id={`reschedDate-${a.appointmentId}`}
                            type="date"
                            value={rescheduleData.date}
                            onChange={(e) => setRescheduleData({ ...rescheduleData, date: e.target.value })}
                            className="w-full text-xs p-1 bg-white border border-slate-400 font-bold"
                          />
                        </div>
                        <div>
                          <label htmlFor={`reschedTime-${a.appointmentId}`} className="block text-[9px] font-black uppercase text-slate-500">Time</label>
                          <input
                            id={`reschedTime-${a.appointmentId}`}
                            type="time"
                            value={rescheduleData.time}
                            onChange={(e) => setRescheduleData({ ...rescheduleData, time: e.target.value })}
                            className="w-full text-xs p-1 bg-white border border-slate-400 font-bold"
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-1.5 pt-2">
                        <button
                          type="button"
                          onClick={() => setReschedulingId(null)}
                          className="px-2 py-1 border-2 border-slate-950 text-slate-900 font-black text-[9px] uppercase bg-white cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReschedule(a.appointmentId)}
                          className="px-2.5 py-1.5 bg-slate-900 border-2 border-slate-900 text-white font-black text-[9px] uppercase cursor-pointer"
                        >
                          Confirm
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>

                {!isCancelled && (
                  <div className="pt-4 border-t-2 border-slate-200 flex items-center justify-end gap-2 mt-4">
                    {/* Reschedule Button for Tutors */}
                    {isTutorUser && !showRescheduleBox && (
                      <button
                        onClick={() => {
                          setReschedulingId(a.appointmentId);
                          setRescheduleData({ date: a.date, time: a.time });
                        }}
                        className="px-2.5 py-1.5 border-2 border-slate-900 text-slate-900 bg-white hover:bg-slate-50 text-[11px] font-black uppercase cursor-pointer"
                      >
                        Reschedule
                      </button>
                    )}

                    {/* Cancel Action Button */}
                    <button
                      onClick={() => handleCancel(a.appointmentId)}
                      className="px-2.5 py-1.5 border-2 border-red-600 bg-red-50 text-red-600 hover:bg-red-100 text-[11px] font-black uppercase flex items-center gap-1 cursor-pointer"
                    >
                      <XCircle size={12} className="stroke-[2.5px]" />
                      <span>{isTutorUser ? 'Decline' : 'Cancel'}</span>
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
