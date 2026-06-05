/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, doc, setDoc, deleteDoc, onSnapshot, query, orderBy, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { SessionVideo, AppUser } from '../types';
import { Play, Video, Plus, Search, Trash2, Clock, Calendar, ShieldCheck, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { mockDb } from '../lib/mockDb';

export const VideoArchive: React.FC = () => {
  const { currentUser, isDemoMode } = useAuth();
  const [videos, setVideos] = useState<SessionVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentsList, setStudentsList] = useState<AppUser[]>([]);
  const [activePlayUrl, setActivePlayUrl] = useState<string | null>(null);
  const [activePlayTitle, setActivePlayTitle] = useState<string>('');

  // Search & Filters
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');

  // Create Video State
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newSubject, setNewSubject] = useState('Mathematics');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newDuration, setNewDuration] = useState('45:00');
  const [newDateRecorded, setNewDateRecorded] = useState('');
  const [newStudentId, setNewStudentId] = useState('all');
  const [submitting, setSubmitting] = useState(false);

  const subjects = ['All', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Computer Science'];

  // Subscribe to videos list
  useEffect(() => {
    if (isDemoMode) {
      const loadVids = () => {
        setVideos(mockDb.getVideos());
        setLoading(false);
      };
      loadVids();
      window.addEventListener('mock_db_update', loadVids);
      return () => {
        window.removeEventListener('mock_db_update', loadVids);
      };
    }

    const q = query(collection(db, 'session-videos'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: SessionVideo[] = [];
      snapshot.forEach((doc) => {
        items.push(doc.data() as SessionVideo);
      });
      setVideos(items);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'session-videos');
    });

    return () => unsubscribe();
  }, [isDemoMode]);

  // Fetch list of students for private assignment selection
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
      setStudentsList(list as any);
      return;
    }

    const fetchStudents = async () => {
      try {
        const querySnap = await getDocs(query(collection(db, 'users')));
        const list: AppUser[] = [];
        querySnap.forEach((doc) => {
          const u = doc.data() as AppUser;
          if (u.role === 'student') {
            list.push(u);
          }
        });
        setStudentsList(list);
      } catch (error) {
        console.error("Error fetching students list", error);
      }
    };
    fetchStudents();
  }, [currentUser, isDemoMode]);

  const handleCreateVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newTitle || !newVideoUrl || !newDateRecorded) return;

    setSubmitting(true);
    const videoId = `video_${Date.now()}`;
    const path = `session-videos/${videoId}`;

    // Format embed URL if they put an ordinary youtube video id or link
    let formattedUrl = newVideoUrl;
    if (newVideoUrl.includes('youtube.com/watch?v=')) {
      const parts = newVideoUrl.split('v=');
      if (parts.length > 1) {
        const id = parts[1].split('&')[0];
        formattedUrl = `https://www.youtube.com/embed/${id}`;
      }
    } else if (newVideoUrl.includes('youtu.be/')) {
      const parts = newVideoUrl.split('youtu.be/');
      if (parts.length > 1) {
        formattedUrl = `https://www.youtube.com/embed/${parts[1].split('?')[0]}`;
      }
    }

    if (isDemoMode) {
      const payload: SessionVideo = {
        videoId,
        title: newTitle,
        description: newDesc,
        subject: newSubject,
        videoUrl: formattedUrl,
        duration: newDuration,
        dateRecorded: newDateRecorded,
        studentId: newStudentId,
        tutorName: currentUser.name,
        createdAt: new Date().toISOString()
      };
      mockDb.saveVideo(payload);
      setNewTitle('');
      setNewDesc('');
      setNewVideoUrl('');
      setShowForm(false);
      setSubmitting(false);
      return;
    }

    try {
      const payload: SessionVideo = {
        videoId,
        title: newTitle,
        description: newDesc,
        subject: newSubject,
        videoUrl: formattedUrl,
        duration: newDuration,
        dateRecorded: newDateRecorded,
        studentId: newStudentId,
        tutorName: currentUser.name,
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'session-videos', videoId), payload);
      setNewTitle('');
      setNewDesc('');
      setNewVideoUrl('');
      setShowForm(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    if (!window.confirm("Delete this recording from the archive?")) return;

    if (isDemoMode) {
      mockDb.deleteVideo(videoId);
      return;
    }

    const path = `session-videos/${videoId}`;
    try {
      await deleteDoc(doc(db, 'session-videos', videoId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const handleQuickSeedVideo = () => {
    setNewTitle("Midterm Trigonometry Final Prep Masterclass");
    setNewDesc("A rigorous review of trigonometry identities, unit circle properties, and past paper proofs. Watch before final Exam next Thursday.");
    setNewSubject("Mathematics");
    setNewVideoUrl("https://www.youtube.com/embed/dQw4w9WgXcQ");
    setNewDuration("1:15:00");
    setNewDateRecorded(new Date().toISOString().split('T')[0]);
    setNewStudentId("all");
  };

  const visibleVideos = videos.filter((v) => {
    if (currentUser?.role === 'student' && v.studentId !== 'all' && v.studentId !== currentUser.userId) {
      return false; 
    }
    
    const matchesSearch =
      v.title.toLowerCase().includes(search.toLowerCase()) ||
      v.description?.toLowerCase().includes(search.toLowerCase());
    const matchesSubject = selectedSubject === 'All' || v.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  return (
    <div className="space-y-6">
      
      {/* Title Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b-4 border-slate-900 pb-4">
        <div>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tighter text-slate-900 uppercase italic flex items-center gap-3">
            <Video size={36} className="text-yellow-500 stroke-[3px]" />
            REVISIONS.
          </h2>
          <p className="text-xs font-mono uppercase font-bold text-slate-500 mt-1">
            Access previous video recordings of custom virtual classes to help revise for final terms.
          </p>
        </div>

        {currentUser?.role === 'tutor' && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-5 py-3 brutal-btn-black text-xs font-black"
          >
            {showForm ? 'CLOSE REVIEW STUDIO' : 'ARCHIVE NEW CLASS VIDEO'}
          </button>
        )}
      </div>

      {showForm && currentUser?.role === 'tutor' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-50 p-6 border-4 border-slate-900 shadow-[6px_6px_0px_0px_#0f172a] grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <form onSubmit={handleCreateVideo} className="space-y-4">
            <h3 className="font-black text-slate-900 text-xs uppercase tracking-widest border-b-2 border-slate-900 pb-2">Deploy Review Lecture</h3>
            
            <div>
              <label htmlFor="videoTitle" className="block text-xs uppercase font-black text-slate-600 mb-1">Session Title</label>
              <input
                id="videoTitle"
                type="text"
                placeholder="e.g. Physics Quantum Mechanics Review"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
                className="w-full text-xs p-2.5 border-2 border-slate-900 font-bold bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="videoSubject" className="block text-xs uppercase font-black text-slate-600 mb-1">Subject</label>
                <select
                  id="videoSubject"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full text-xs p-2.5 border-2 border-slate-900 font-bold bg-white focus:outline-none"
                >
                  {subjects.filter(s => s !== 'All').map((sub) => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="videoScope" className="block text-xs uppercase font-black text-slate-600 mb-1">Privacy Scope Selection</label>
                <select
                  id="videoScope"
                  value={newStudentId}
                  onChange={(e) => setNewStudentId(e.target.value)}
                  className="w-full text-xs p-2.5 border-2 border-slate-900 font-bold bg-white focus:outline-none"
                >
                  <option value="all">Public (All Association Students)</option>
                  {studentsList.map((stu) => (
                    <option key={stu.userId} value={stu.userId}>
                      Private: {stu.name} {stu.grade ? `(${stu.grade})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="videoUrl" className="block text-xs uppercase font-black text-slate-600 mb-1">URL or Embed Link</label>
                <input
                  id="videoUrl"
                  type="text"
                  placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                  value={newVideoUrl}
                  onChange={(e) => setNewVideoUrl(e.target.value)}
                  required
                  className="w-full text-xs p-2.5 border-2 border-slate-900 font-bold bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="videoDuration" className="block text-xs uppercase font-black text-slate-600 mb-1">Duration</label>
                  <input
                    id="videoDuration"
                    type="text"
                    placeholder="e.g. 50:18"
                    value={newDuration}
                    onChange={(e) => setNewDuration(e.target.value)}
                    className="w-full text-xs p-2.5 border-2 border-slate-900 font-bold bg-white"
                  />
                </div>
                <div>
                  <label htmlFor="videoRecordedDate" className="block text-xs uppercase font-black text-slate-600 mb-1">Recorded Date</label>
                  <input
                    id="videoRecordedDate"
                    type="date"
                    value={newDateRecorded}
                    onChange={(e) => setNewDateRecorded(e.target.value)}
                    required
                    className="w-full text-xs p-2 border-2 border-slate-900 font-bold bg-white"
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="videoDesc" className="block text-xs uppercase font-black text-slate-600 mb-1">Video Outline</label>
              <textarea
                id="videoDesc"
                rows={2}
                placeholder="Breakdown list of concepts reviewed..."
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full text-xs p-2.5 border-2 border-slate-900 font-bold bg-white"
              />
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={handleQuickSeedVideo}
                className="text-[10px] font-black uppercase text-slate-900 hover:underline cursor-pointer"
              >
                🪄 Fill Trigonometry Masterclass
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase border-2 border-slate-900"
              >
                {submitting ? 'ARCHIVING...' : 'ADD VIDEO'}
              </button>
            </div>
          </form>

          <div className="bg-white border-2 border-slate-900 p-5 flex flex-col justify-between">
            <div className="space-y-4 text-xs text-slate-600">
              <h4 className="font-black text-slate-900 flex items-center gap-1.5 border-b pb-2 uppercase tracking-tight">
                <ShieldCheck size={14} className="text-yellow-500" />
                Durable Playback Hosting
              </h4>
              <p>
                1. <strong>Direct Embeds</strong>: This video portal seamlessly parses regular YouTube, Vimeo, or standard raw embed links into responsive viewport frames.
              </p>
              <p>
                2. <strong>Student Targeting</strong>: Instructors can assign videos to public view or selectively route they are private to an individual student for corrective feedback.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-100 flex items-center gap-2">
              <div className="h-2.5 w-2.5 bg-yellow-400 border border-slate-900 rounded-none animate-bounce" />
              <span className="text-[9px] uppercase font-mono font-black text-slate-400">Archiver Stream Service Ready</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Filter and Search */}
      <div className="flex flex-col xl:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 stroke-[2.5px]" />
          <input
            id="searchVideos"
            type="text"
            placeholder="Search class topics or review sessions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-12 pr-4 py-3.5 border-4 border-slate-900 font-bold bg-white focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
          {subjects.map((sub) => (
            <button
              key={sub}
              onClick={() => setSelectedSubject(sub)}
              className={`px-3 py-1.5 border-2 border-slate-900 text-xs font-black uppercase transition-all whitespace-nowrap cursor-pointer ${
                selectedSubject === sub
                  ? 'bg-yellow-400 text-slate-950 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]'
                  : 'bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900" />
          <p className="text-xs font-mono font-bold uppercase text-slate-400">Loading videos list...</p>
        </div>
      ) : visibleVideos.length === 0 ? (
        <div className="bg-slate-50 border-4 border-dashed border-slate-300 p-12 text-center">
          <Video size={40} className="mx-auto text-slate-400" />
          <h3 className="font-black text-slate-900 mt-2 text-sm uppercase tracking-tight">No recorded study playbacks</h3>
          <p className="text-slate-500 text-xs max-w-sm mx-auto mt-1 uppercase font-bold">
            Ask your lead tutor to host a lecture and upload the walkthrough embed. Target filters automatically route secure segments here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleVideos.map((v) => {
            const isPrivate = v.studentId !== 'all';
            return (
              <motion.div
                layout
                key={v.videoId}
                className="brutal-card overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {/* Thumbnail Play Mockout */}
                  <div className="relative bg-slate-950 aspect-video flex items-center justify-center overflow-hidden border-b-4 border-slate-900">
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent opacity-60 z-10" />
                    
                    {/* Icon indicator */}
                    <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5">
                      <span className="px-2.5 py-0.5 bg-slate-900 text-white text-[9px] font-black uppercase tracking-wider border border-white">
                        {v.subject}
                      </span>
                      {isPrivate ? (
                        <span className="px-2 py-0.5 bg-yellow-405 bg-yellow-400 text-slate-900 text-[9px] font-black uppercase tracking-wider border border-slate-900">
                          Private View
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-white text-slate-900 text-[9px] font-black uppercase tracking-wider border border-slate-900">
                          Public Archive
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        setActivePlayUrl(v.videoUrl);
                        setActivePlayTitle(v.title);
                      }}
                      className="h-14 w-14 rounded-none bg-yellow-400 text-slate-950 border-2 border-slate-950 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] flex items-center justify-center hover:scale-105 transition-all z-20 cursor-pointer"
                    >
                      <Play size={20} className="fill-slate-950 translate-x-0.5 stroke-[2.5px]" />
                    </button>

                    <div className="absolute bottom-3 right-3 z-20 text-[9px] font-mono font-black uppercase text-white bg-slate-900 border border-white px-2 py-0.5 rounded-none flex items-center gap-1">
                      <Clock size={11} className="stroke-[2.5px]" />
                      {v.duration}
                    </div>
                  </div>

                  <div className="p-5 space-y-2">
                    <h4 className="font-black text-slate-900 text-base tracking-tight leading-snug uppercase italic">
                      {v.title}
                    </h4>
                    {v.description && (
                      <p className="text-slate-500 font-bold text-xs line-clamp-3 leading-normal">
                        {v.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="px-5 pb-5 pt-3 border-t-2 border-slate-100 flex items-center justify-between">
                  <div className="text-[10px] uppercase font-bold text-slate-400 space-y-1">
                    <div>Mentor: <span className="text-slate-800 font-black">{v.tutorName}</span></div>
                    <div className="flex items-center gap-1 italic">
                      <Calendar size={11} className="stroke-[2px]" />
                      Recorded: {v.dateRecorded}
                    </div>
                  </div>

                  {currentUser?.role === 'tutor' && (
                    <button
                      onClick={() => handleDeleteVideo(v.videoId)}
                      className="p-2 text-slate-450 hover:text-red-500 transition-colors cursor-pointer"
                      title="Remove video"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Video Overlay Dialog Player matching brutalist style */}
      <AnimatePresence>
        {activePlayUrl && (
          <div className="fixed inset-0 bg-slate-900/90 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border-4 border-slate-900 shadow-[8px_8px_0px_0px_#facc15] w-full max-w-4xl overflow-hidden relative rounded-none"
            >
              <div className="p-4 bg-slate-900 flex items-center justify-between border-b-2 border-slate-900 text-white">
                <span className="text-white text-[10px] font-black uppercase tracking-widest font-mono text-yellow-400">Revision stream player</span>
                <span className="text-slate-100 text-xs font-black uppercase tracking-tighter line-clamp-1 flex-1 px-4 text-center">{activePlayTitle}</span>
                <button
                  onClick={() => {
                    setActivePlayUrl(null);
                    setActivePlayTitle('');
                  }}
                  className="text-white hover:text-yellow-400 font-black px-2.5 py-1 border-2 border-white hover:border-yellow-400 bg-slate-800 transition-all cursor-pointer text-xs"
                >
                  EXIT
                </button>
              </div>

              <div className="aspect-video relative w-full bg-slate-950">
                {activePlayUrl.includes('embed') ? (
                  <iframe
                    title={activePlayTitle}
                    src={activePlayUrl}
                    className="w-full h-full border-0 absolute inset-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-6 gap-3">
                    <Video size={48} className="text-yellow-450 animate-bounce" />
                    <div>
                      <h4 className="font-black text-white text-base uppercase italic">Now Streaming Class Lecture Session</h4>
                      <p className="text-xs font-mono uppercase text-slate-400 max-w-md mx-auto mt-2">
                        If this were a fully integrated video platform, your lecture stream hosted at:
                        <br /><span className="font-mono text-[9px] text-zinc-300 break-all">{activePlayUrl}</span> would play.
                      </p>
                    </div>
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={() => {
                          setActivePlayUrl(null);
                          setActivePlayTitle('');
                        }}
                        className="px-4 py-2 border-2 border-white text-white font-black uppercase text-xs hover:bg-white hover:text-black transition"
                      >
                        Go Back
                      </button>
                      <a
                        href={activePlayUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2 bg-yellow-400 text-slate-900 border-2 border-slate-900 font-black uppercase text-xs hover:bg-yellow-300 transition"
                      >
                        Open Original stream source
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
