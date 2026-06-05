/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'student' | 'tutor';

export interface AppUser {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  grade?: string;
  createdAt: string;
  avatarUrl?: string;
}

export interface StudyMaterial {
  materialId: string;
  title: string;
  description?: string;
  subject: string;
  fileUrl: string;
  fileType: 'pdf' | 'doc' | 'zip' | 'link';
  uploadedBy: string;
  uploadedByName: string;
  createdAt: string;
}

export interface Appointment {
  appointmentId: string;
  studentId: string;
  studentName: string;
  tutorId: string;
  tutorName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  subject: string;
  status: 'scheduled' | 'cancelled';
  createdAt: string;
  cancelledAt?: string;
}

export interface SessionVideo {
  videoId: string;
  title: string;
  description?: string;
  subject: string;
  videoUrl: string;
  duration: string;
  dateRecorded: string;
  studentId: string; // student's UID, or 'all'
  tutorName: string;
  createdAt: string;
}

export interface ProgressMetric {
  metricId: string; // same as studentId
  studentId: string;
  hoursCompleted: number;
  syllabusCoverage: number; // 0-100
  assignmentsCompleted: number;
  totalAssignments: number;
  updatedAt: string;
}

export interface ChatMessage {
  messageId: string;
  text: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  receiverId: string;
  createdAt: string;
}
