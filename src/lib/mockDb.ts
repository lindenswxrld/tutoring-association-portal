/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StudyMaterial, SessionVideo, Appointment, ProgressMetric, ChatMessage } from '../types';

// Initial Seed Data for the Demo Environment
const INITIAL_MATERIALS: StudyMaterial[] = [
  {
    materialId: 'mat_demo_1',
    title: 'Term 2 Physics Final Revision Handbook',
    description: 'Electromagnetism, wave mechanics, and thermal thermodynamics papers with interactive formulas and mock flashcard quiz challenges.',
    subject: 'Physics',
    fileUrl: 'https://example.com/assets/physics-t2-handbook.pdf',
    fileType: 'pdf',
    uploadedBy: 'demo_tutor_uid',
    uploadedByName: 'Dr. Sarah Peterson',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    materialId: 'mat_demo_2',
    title: 'Calculus Limits & Derivatives Cheat Sheet',
    description: 'A comprehensive two-page reference highlighting limits laws, differentiation laws, product/quotient formulas, and trigonometric limits.',
    subject: 'Mathematics',
    fileUrl: 'https://example.com/assets/calculus-cheat-sheet.pdf',
    fileType: 'pdf',
    uploadedBy: 'demo_tutor_uid',
    uploadedByName: 'Dr. Sarah Peterson',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    materialId: 'mat_demo_3',
    title: 'Nomenclature of Organic Chemistry Essentials',
    description: 'Reference handbook on naming IUPAC carbon chains, alkenes, alcohols, esters, carboxylic acids, and identification formulas.',
    subject: 'Chemistry',
    fileUrl: 'https://iupac.qmul.ac.uk/BlueBook/',
    fileType: 'link',
    uploadedBy: 'demo_tutor_uid',
    uploadedByName: 'Dr. Sarah Peterson',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const INITIAL_VIDEOS: SessionVideo[] = [
  {
    videoId: 'video_demo_1',
    title: 'Midterm Trigonometry Final Prep Masterclass',
    description: 'Full exam-ready walkthrough of trigonometry proofs, Unit Circle calculations, and key trigonometric identities with sample correction guides.',
    subject: 'Mathematics',
    videoUrl: 'https://www.youtube.com/embed/PUB0TaZ7bhA',
    duration: '22:50',
    dateRecorded: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    studentId: 'all',
    tutorName: 'Dr. Sarah Peterson',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    videoId: 'video_demo_2',
    title: 'Personalized Quantum Mechanics Corrections',
    description: 'Walkthrough correcting homework worksheet submissions regarding the photo-electric effect, quantum numbers, and energy state equations.',
    subject: 'Physics',
    videoUrl: 'https://www.youtube.com/embed/m6gqC64N7Yg',
    duration: '18:40',
    dateRecorded: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    studentId: 'demo_student_uid',
    tutorName: 'Dr. Sarah Peterson',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    appointmentId: 'appt_demo_1',
    studentId: 'demo_student_uid',
    studentName: 'Alex Sandbox Student',
    tutorId: 'demo_tutor_uid',
    tutorName: 'Dr. Sarah Peterson',
    date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    time: '15:30',
    subject: 'Physics',
    status: 'scheduled',
    createdAt: new Date().toISOString()
  },
  {
    appointmentId: 'appt_demo_2',
    studentId: 'demo_student_uid',
    studentName: 'Alex Sandbox Student',
    tutorId: 'demo_tutor_uid',
    tutorName: 'Dr. Sarah Peterson',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    time: '14:00',
    subject: 'Mathematics',
    status: 'cancelled',
    cancelledAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString()
  }
];

const INITIAL_METRICS: ProgressMetric[] = [
  {
    metricId: 'demo_student_uid',
    studentId: 'demo_student_uid',
    hoursCompleted: 24,
    syllabusCoverage: 78,
    assignmentsCompleted: 9,
    totalAssignments: 12,
    updatedAt: new Date().toISOString()
  }
];

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    messageId: 'msg_demo_1',
    text: 'Hello Dr. Peterson, I uploaded my chemistry quiz formulas. Could we use our next session to cover nomenclature rules?',
    senderId: 'demo_student_uid',
    senderName: 'Alex Sandbox Student',
    senderRole: 'student',
    receiverId: 'demo_tutor_uid',
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
  },
  {
    messageId: 'msg_demo_2',
    text: 'Hi Alex! Outstanding initiative on getting the formulas written out. Absolutely, let\'s dedicate the first fifteen minutes of our slot tomorrow to organic chemistry naming conventions.',
    senderId: 'demo_tutor_uid',
    senderName: 'Dr. Sarah Peterson',
    senderRole: 'tutor',
    receiverId: 'demo_student_uid',
    createdAt: new Date(Date.now() - 11 * 60 * 60 * 1000).toISOString()
  }
];

export const mockDb = {
  initialize: () => {
    if (!localStorage.getItem('demo_seeded_v3')) {
      localStorage.setItem('demo_materials', JSON.stringify(INITIAL_MATERIALS));
      localStorage.setItem('demo_videos', JSON.stringify(INITIAL_VIDEOS));
      localStorage.setItem('demo_appointments', JSON.stringify(INITIAL_APPOINTMENTS));
      localStorage.setItem('demo_metrics', JSON.stringify(INITIAL_METRICS));
      localStorage.setItem('demo_messages', JSON.stringify(INITIAL_MESSAGES));
      localStorage.setItem('demo_seeded_v3', 'true');
    }
  },

  // 1. Study Materials CRUD
  getMaterials: (): StudyMaterial[] => {
    mockDb.initialize();
    return JSON.parse(localStorage.getItem('demo_materials') || '[]');
  },
  saveMaterial: (mat: StudyMaterial) => {
    const list = mockDb.getMaterials();
    list.unshift(mat);
    localStorage.setItem('demo_materials', JSON.stringify(list));
    mockDb.triggerSync();
  },
  deleteMaterial: (matId: string) => {
    const list = mockDb.getMaterials().filter(m => m.materialId !== matId);
    localStorage.setItem('demo_materials', JSON.stringify(list));
    mockDb.triggerSync();
  },

  // 2. Videos CRUD
  getVideos: (): SessionVideo[] => {
    mockDb.initialize();
    return JSON.parse(localStorage.getItem('demo_videos') || '[]');
  },
  saveVideo: (vid: SessionVideo) => {
    const list = mockDb.getVideos();
    list.unshift(vid);
    localStorage.setItem('demo_videos', JSON.stringify(list));
    mockDb.triggerSync();
  },
  deleteVideo: (vidId: string) => {
    const list = mockDb.getVideos().filter(v => v.videoId !== vidId);
    localStorage.setItem('demo_videos', JSON.stringify(list));
    mockDb.triggerSync();
  },

  // 3. Appointments CRUD
  getAppointments: (): Appointment[] => {
    mockDb.initialize();
    return JSON.parse(localStorage.getItem('demo_appointments') || '[]');
  },
  saveAppointment: (appt: Appointment) => {
    const list = mockDb.getAppointments();
    list.unshift(appt);
    localStorage.setItem('demo_appointments', JSON.stringify(list));
    mockDb.triggerSync();
  },
  updateAppointment: (apptId: string, updates: Partial<Appointment>) => {
    const list = mockDb.getAppointments().map(appt => {
      if (appt.appointmentId === apptId) {
        return { ...appt, ...updates };
      }
      return appt;
    });
    localStorage.setItem('demo_appointments', JSON.stringify(list));
    mockDb.triggerSync();
  },

  // 4. Progress Metrics CRUD
  getMetrics: (): ProgressMetric[] => {
    mockDb.initialize();
    return JSON.parse(localStorage.getItem('demo_metrics') || '[]');
  },
  getMetric: (studentId: string): ProgressMetric | null => {
    const list = mockDb.getMetrics();
    return list.find(m => m.studentId === studentId) || null;
  },
  saveMetric: (metric: ProgressMetric) => {
    const list = mockDb.getMetrics().filter(m => m.studentId !== metric.studentId);
    list.push(metric);
    localStorage.setItem('demo_metrics', JSON.stringify(list));
    mockDb.triggerSync();
  },

  // 5. Messages CRUD
  getMessages: (): ChatMessage[] => {
    mockDb.initialize();
    return JSON.parse(localStorage.getItem('demo_messages') || '[]');
  },
  saveMessage: (msg: ChatMessage) => {
    const list = mockDb.getMessages();
    list.push(msg);
    localStorage.setItem('demo_messages', JSON.stringify(list));
    mockDb.triggerSync();
  },

  // Dispatch sync event
  triggerSync: () => {
    window.dispatchEvent(new Event('mock_db_update'));
  }
};
