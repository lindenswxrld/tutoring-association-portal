/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, doc, deleteDoc, setDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { StudyMaterial } from '../types';
import { FileText, Link as LinkIcon, Trash2, Plus, Search, FileDown, BookOpen, Clock, Tag } from 'lucide-react';
import { motion } from 'motion/react';

export const Materials: React.FC = () => {
  const { currentUser } = useAuth();
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [loading, setLoading] = useState(true);

  // Upload Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('Mathematics');
  const [newDesc, setNewDesc] = useState('');
  const [newFileType, setNewFileType] = useState<'pdf' | 'doc' | 'zip' | 'link'>('pdf');
  const [newFileUrl, setNewFileUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  const subjects = ['All', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Computer Science'];

  // Listen to materials collection in real time
  useEffect(() => {
    const q = query(collection(db, 'study-materials'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: StudyMaterial[] = [];
      snapshot.forEach((doc) => {
        items.push(doc.data() as StudyMaterial);
      });
      setMaterials(items);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'study-materials');
    });

    return () => unsubscribe();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newTitle || !newFileUrl) return;

    setUploading(true);
    const materialId = `mat_${Date.now()}`;
    const path = `study-materials/${materialId}`;

    try {
      const materialPayload: StudyMaterial = {
        materialId,
        title: newTitle,
        description: newDesc,
        subject: newSubject,
        fileUrl: newFileUrl,
        fileType: newFileType,
        uploadedBy: currentUser.userId,
        uploadedByName: currentUser.name,
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'study-materials', materialId), materialPayload);
      
      setNewTitle('');
      setNewDesc('');
      setNewFileUrl('');
      setShowAddForm(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (matId: string) => {
    if (!window.confirm("Are you sure you want to delete this study material?")) return;
    const path = `study-materials/${matId}`;
    try {
      await deleteDoc(doc(db, 'study-materials', matId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const handleQuickSeed = () => {
    setNewTitle('Term 2 Physics Final Revision Handbook');
    setNewDesc('This comprehensive handbook covers Electromagnetism, Wave Mechanics, and Thermodynamics questions with answer guides.');
    setNewSubject('Physics');
    setNewFileType('pdf');
    setNewFileUrl('https://example.com/assets/physics-t2-handbook.pdf');
  };

  const filteredMaterials = materials.filter((m) => {
    const matchesSearch =
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.description?.toLowerCase().includes(search.toLowerCase());
    const matchesSubject = selectedSubject === 'All' || m.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  return (
    <div className="space-y-6">
      
      {/* Tab Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b-4 border-slate-900 pb-4">
        <div>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tighter text-slate-900 uppercase italic flex items-center gap-3">
            <BookOpen size={36} className="text-yellow-500 stroke-[3px]" />
            MATERIALS.
          </h2>
          <p className="text-xs font-mono uppercase font-bold text-slate-500 mt-1">
            Access secure worksheets, lecture study notes, and syllabus keys published by the tutor team.
          </p>
        </div>

        {currentUser?.role === 'tutor' && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-5 py-3 brutal-btn-black text-xs font-black"
          >
            {showAddForm ? 'CLOSE RESOURCE FORM' : 'PUBLISH STUDY RESOURCE'}
          </button>
        )}
      </div>

      {/* Upload Worksheet Form Drawer */}
      {showAddForm && currentUser?.role === 'tutor' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-50 p-6 border-4 border-slate-900 shadow-[6px_6px_0px_0px_#0f172a] grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <form onSubmit={handleUpload} className="space-y-4">
            <h3 className="font-black text-slate-900 text-xs uppercase tracking-widest border-b-2 border-slate-900 pb-2">Publish New Resource</h3>
            
            <div>
              <label htmlFor="materialTitle" className="block text-xs uppercase font-black text-slate-600 mb-1">Title</label>
              <input
                id="materialTitle"
                type="text"
                placeholder="e.g. Calculus Derivatives Cheat Sheet"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
                className="w-full text-xs p-2.5 border-2 border-slate-900 font-bold bg-white focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="materialSubject" className="block text-xs uppercase font-black text-slate-600 mb-1">Subject</label>
                <select
                  id="materialSubject"
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
                <label htmlFor="materialFormat" className="block text-xs uppercase font-black text-slate-600 mb-1">Format Type</label>
                <select
                  id="materialFormat"
                  value={newFileType}
                  onChange={(e) => setNewFileType(e.target.value as any)}
                  className="w-full text-xs p-2.5 border-2 border-slate-900 font-bold bg-white focus:outline-none"
                >
                  <option value="pdf">PDF Worksheet</option>
                  <option value="doc">Word Document</option>
                  <option value="zip">ZIP Exercises Bundle</option>
                  <option value="link">Interactive Web Link</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="materialDesc" className="block text-xs uppercase font-black text-slate-600 mb-1">Description (Optional)</label>
              <textarea
                id="materialDesc"
                rows={2}
                placeholder="Brief summary of syllabus objectives or instructions..."
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full text-xs p-2.5 border-2 border-slate-900 font-bold bg-white focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="materialUrl" className="block text-xs uppercase font-black text-slate-600 mb-1">Secure Resource Download Link</label>
              <input
                id="materialUrl"
                type="text"
                placeholder="https://example.com/materials/calculus-guide.pdf"
                value={newFileUrl}
                onChange={(e) => setNewFileUrl(e.target.value)}
                required
                className="w-full text-xs p-2.5 border-2 border-slate-900 font-bold bg-white focus:outline-none"
              />
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={handleQuickSeed}
                className="text-[10px] font-black uppercase text-slate-900 hover:underline cursor-pointer"
              >
                🪄 Fill Sample Worksheet
              </button>
              <button
                type="submit"
                disabled={uploading}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-tight border-2 border-slate-900"
              >
                {uploading ? 'PUBLISHING...' : 'DEPLOY RESOURCE'}
              </button>
            </div>
          </form>

          <div className="bg-white border-2 border-slate-900 p-5 flex flex-col justify-between">
            <div className="space-y-4 text-xs text-slate-600">
              <h4 className="font-black text-slate-900 flex items-center gap-1.5 border-b pb-2 uppercase tracking-tight">
                <Tag size={14} className="text-yellow-500" />
                Guidelines for Uploads
              </h4>
              <p>
                1. <strong>Curation Check</strong>: Only publish materials compliant with standard final term exam guidelines.
              </p>
              <p>
                2. <strong>Secure Channels</strong>: Point to secure download resources (Google Drive/OneDrive shared links).
              </p>
              <p>
                3. <strong>Immediate Release</strong>: Publications propagate immediately to registered student nodes.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-100 flex items-center gap-2">
              <div className="h-2 w-2 bg-slate-900 rounded-full animate-ping" />
              <span className="text-[9px] uppercase font-mono font-black text-slate-400">Database Connection Synced</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Filter Menu & Search Bar */}
      <div className="flex flex-col xl:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 stroke-[2.5px]" />
          <input
            id="searchMaterials"
            type="text"
            placeholder="Search material title or course outline keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-12 pr-4 py-3.5 border-4 border-slate-900 font-bold bg-white focus:outline-none"
          />
        </div>

        {/* Horizontal scroll of subjects */}
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

      {/* Render Materials List Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900" />
          <p className="text-xs font-mono uppercase font-bold text-slate-400">Connecting to study repository...</p>
        </div>
      ) : filteredMaterials.length === 0 ? (
        <div className="bg-slate-50 border-4 border-dashed border-slate-300 p-12 text-center">
          <FileText size={40} className="mx-auto text-slate-400" />
          <h3 className="font-black text-slate-900 mt-3 text-sm uppercase tracking-tight">No private study materials matched</h3>
          <p className="text-slate-500 text-xs max-w-sm mx-auto mt-1 uppercase font-bold">
            Check back soon! Mentees post extra revision modules weekly. Take calendar classes with instructors to populate reports.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMaterials.map((m) => {
            const isFile = m.fileType !== 'link';
            return (
              <motion.div
                layout
                key={m.materialId}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="brutal-card p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="px-2 py-0.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest">
                      {m.subject}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono font-bold uppercase">
                      <Clock size={11} />
                      {new Date(m.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="font-black text-slate-900 text-base tracking-tight mb-2 uppercase italic">{m.title}</h3>
                  
                  {m.description && (
                    <p className="text-slate-500 text-xs font-bold font-sans mb-4 leading-normal">
                      {m.description}
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t-2 border-slate-100 flex items-center justify-between gap-2 mt-4">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">
                    By <span className="text-slate-700 font-extrabold">{m.uploadedByName}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {currentUser?.role === 'tutor' && m.uploadedBy === currentUser.userId && (
                      <button
                        onClick={() => handleDelete(m.materialId)}
                        className="p-2 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                        title="Delete material"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}

                    <a
                      href={m.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 bg-yellow-400 text-slate-950 font-black uppercase text-xs border-2 border-slate-900 shadow-[2px_2px_0px_0px_#000] hover:bg-yellow-300 select-none cursor-pointer flex items-center gap-1.5"
                    >
                      {isFile ? <FileDown size={14} className="stroke-[2.5px]" /> : <LinkIcon size={14} className="stroke-[2.5px]" />}
                      <span>{isFile ? 'Download' : 'Open Link'}</span>
                    </a>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};
