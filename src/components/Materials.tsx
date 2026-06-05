/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, doc, deleteDoc, setDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { StudyMaterial } from '../types';
import { 
  FileText, 
  Link as LinkIcon, 
  Trash2, 
  Plus, 
  Search, 
  FileDown, 
  BookOpen, 
  Clock, 
  Tag,
  Sparkles,
  X,
  Check,
  Award,
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { mockDb } from '../lib/mockDb';

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface StudyGuideData {
  title: string;
  subject: string;
  formulas: { label: string; equation: string; desc: string }[];
  concepts: { topic: string; details: string }[];
  quiz: QuizQuestion[];
}

const PREVIEW_GUIDES: Record<string, StudyGuideData> = {
  'mat_demo_1': {
    title: 'Term 2 Physics Final Revision Handbook',
    subject: 'Physics',
    formulas: [
      { label: 'Faraday’s Law of Induction', equation: 'EMF = -N * (ΔΦ / Δt)', desc: 'Measures induced electromotive force as the rate of magnetic flux change.' },
      { label: 'Coulomb’s Electrostatic Law', equation: 'F = k * (|q1 * q2| / r²)', desc: 'Calculates the electrostatic force between two point charges in vacuum.' },
      { label: 'Ohm’s Electric Conduction', equation: 'V = I * R', desc: 'Voltage drops linearly with current & resistance at fixed temperature conditions.' },
      { label: 'Heat Energy Phase Transitions', equation: 'Q = m * c * ΔT', desc: 'Thermal energy transferred during temperature phases without phase change.' },
      { label: 'Ideal Gas Equation of State', equation: 'P * V = n * R * T', desc: 'Relates macroscopic pressure, volume, temperature, and moles.' }
    ],
    concepts: [
      { topic: 'Electromagnetic Field Theory', details: 'A dynamic coupling of electric and magnetic vectors. Moving charges warp the space-time vector field, inducing electrical potential differences in neighboring conductor loops.' },
      { topic: 'Wave-Particle Duality', details: 'Matter and radiation exhibit behavior similar to both mechanical waves and discrete quantum energy packets, depending on the test equipment.' },
      { topic: 'Thermodynamic Entropy', details: 'The degree of structural and thermal disorder in any isolated kinetic system naturally increases over time, in accordance with the second law.' }
    ],
    quiz: [
      {
        question: 'Lenz’s Law is a primary consequence of which foundational scientific conservation principle?',
        options: [
          'Conservation of Linear Momentum',
          'Conservation of Cumulative Mechanical Force',
          'Conservation of Electric Charge',
          'Conservation of Energy'
        ],
        correctIndex: 3,
        explanation: 'Lenz’s Law requires the induced potential to oppose the magnetic flux change. This prevents a run-away feedback loop which would violate the Conservation of Energy.'
      },
      {
        question: 'What is the net resistance of a uniform wire if you simultaneously triple both its length (L) and cross-sectional area (A)?',
        options: [
          'It increases by a factor of 9',
          'It remains exactly the same',
          'It is divided by three',
          'It triples'
        ],
        correctIndex: 1,
        explanation: 'Because resistance is given by R = ρ * (L/A), tripling both L and A leaves the structural ratio unchanged, keeping the net resistance identical.'
      }
    ]
  },
  'mat_demo_2': {
    title: 'Calculus Limits & Derivatives Cheat Sheet',
    subject: 'Mathematics',
    formulas: [
      { label: 'Product Rule of Differentiation', equation: 'd/dx [u * v] = u\'v + uv\'', desc: 'The instantaneous rate of change for multiplied differentiable functions.' },
      { label: 'Quotient Rule of Calculus', equation: 'd/dx [u / v] = (u\'v - uv\') / v²', desc: 'The derivatives rule for calculating slope of rational ratio forms.' },
      { label: 'Chain Rule for Nesting', equation: 'd/dx [f(g(x))] = f\'(g(x)) * g\'(x)', desc: 'Decomposes rates of change cascading through nested functional shells.' },
      { label: 'Fundamental Squeeze Limit', equation: 'lim[θ→0] (sin θ / θ) = 1', desc: 'Prerequisite trigonometric identity limit derived in geometric sectors.' },
      { label: 'Natural Log Differential', equation: 'd/dx [ln x] = 1/x', desc: 'Calculates the reciprocal change rate of logarithmic inputs.' }
    ],
    concepts: [
      { topic: 'Limit Approximations', details: 'Describes the value that a variable expression asymptotically trends toward as its inputs get infinitely close to a terminal, regardless of state directly at the localized terminal.' },
      { topic: 'Calculus Instantaneous Rates', details: 'The derivative f’(x) provides the exact numerical slope of the tangent line touching the curved coordinates of a graph at any specific input.' }
    ],
    quiz: [
      {
        question: 'What is the derivative of f(x) = sin(x²)?',
        options: [
          '2x * cos(x²)',
          'cos(x²)',
          '2 * x * sin(x)',
          '-2x * cos(x²)'
        ],
        correctIndex: 0,
        explanation: 'Applying the Chain Rule: Let u = x², so dy/dx = cos(u) * du/dx. Since du/dx = 2x, we multiplycos(x²) by 2x to get 2x * cos(x²).'
      },
      {
        question: 'Evaluate the limit of: (x² - 9) / (x - 3) as x approaches 3.',
        options: [
          'Division by zero (undefined)',
          '3',
          '9',
          '6'
        ],
        correctIndex: 3,
        explanation: 'Factor the numerator: (x-3)(x+3). Simplify by factoring out (x-3), which leaves (x+3). As x goes to 3, 3 + 3 = 6.'
      }
    ]
  },
  'mat_demo_3': {
    title: 'Nomenclature of Organic Chemistry Essentials',
    subject: 'Chemistry',
    formulas: [
      { label: 'Alkanes Chain Saturated', equation: 'CnH2n+2', desc: 'Simple hydrocarbons featuring singular carbon-carbon bonds. Ends in -ane.' },
      { label: 'Alkenes Active Double', equation: 'CnH2n', desc: 'Chains integrating a reactive carbon-carbon double-bond. Ends in -ene.' },
      { label: 'Primary Alcohols Polar', equation: 'R - OH', desc: 'Saturated organic chains bonded with a polar oxygen-hydrogen pair. Ends in -ol.' },
      { label: 'Carboxylic Acid Backbone', equation: 'R - COOH', desc: 'Saturated oxygen groups containing both a carbonyl and hydroxyl. Ends in -oic acid.' },
      { label: 'Esters Condensation Forms', equation: 'R - COO - R’', desc: 'Formed from acid-alcohol dehydration reactions. Ends in -oate.' }
    ],
    concepts: [
      { topic: 'IUPAC Sequence rules', details: 'Identify the absolute longest carbon root first, count branching coordinates, catalog reactive groups in order of functional priority, then assign prefixes.' },
      { topic: 'Molecular Isomers', details: 'Organic compounds that share matching atomic formulas but contain completely divergent spatial arrangement shapes, changing properties.' }
    ],
    quiz: [
      {
        question: 'What is the correct IUPAC scientific name for CH₃-CH₂-CH₂-OH?',
        options: [
          'Ethanol',
          'Propan-1-ol',
          'Propan-2-ol',
          'Butan-1-ol'
        ],
        correctIndex: 1,
        explanation: 'Three Carbon atoms count is prefix prop-. No double bonds yields -an-. Oxygen cluster on the carbon terminal edge yields -1-ol.'
      },
      {
        question: 'Which suffix is applied when naming a compound featuring a carbon double-bonded to an oxygen with a hydroxyl group attached to that same carbon node?',
        options: [
          '-oic acid',
          '-one',
          '-ol',
          '-al'
        ],
        correctIndex: 0,
        explanation: 'A (C=O) attached to a hydroxyl group is a carboxyl group (-COOH), which dictates the suffix "-oic acid".'
      }
    ]
  }
};

const DEFAULT_GUIDE = (mat: StudyMaterial): StudyGuideData => ({
  title: mat.title,
  subject: mat.subject,
  formulas: [
    { label: `${mat.subject} Fundamental Rate`, equation: 'S = ΔV / Δt', desc: 'Dynamic change metrics relative to target focus segments.' },
    { label: 'Symmetric Balance Quotient', equation: 'Σ Force = 0', desc: 'Prerequisite equation to satisfy physical equilibrium configurations.' }
  ],
  concepts: [
    { topic: 'Course Syllabus Outline', details: mat.description || 'Detailed coursework and analytical references prepared by instructors to accelerate examination preparations.' },
    { topic: 'Methodical Iteration', details: 'Tutors recommend repeating foundational proofs twice weekly to lock concepts into active neural recall systems.' }
  ],
  quiz: [
    {
      question: `This study resource on "${mat.title}" primarily targets which academic objective?`,
      options: [
        'Routine homework lookup',
        'Direct final syllabus preparation rules and formulas',
        'Casual side-reading',
        'Extra-curricular research'
      ],
      correctIndex: 1,
      explanation: 'Tutoring Association guides are specifically targeted toward preparing students for standardized final term exams.'
    }
  ]
});

export const Materials: React.FC = () => {
  const { currentUser, isDemoMode } = useAuth();
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [loading, setLoading] = useState(true);

  // Active Interactive Preview Modal Drawer
  const [activePreview, setActivePreview] = useState<StudyMaterial | null>(null);
  const [previewTab, setPreviewTab] = useState<'formulas' | 'quiz'>('formulas');
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [shownAnswers, setShownAnswers] = useState<Record<number, boolean>>({});

  // Upload Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('Mathematics');
  const [newDesc, setNewDesc] = useState('');
  const [newFileType, setNewFileType] = useState<'pdf' | 'doc' | 'zip' | 'link'>('pdf');
  const [newFileUrl, setNewFileUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  const subjects = ['All', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Computer Science'];

  const handleOpenPreview = (material: StudyMaterial) => {
    setActivePreview(material);
    setPreviewTab('formulas');
    setSelectedAnswers({});
    setShownAnswers({});
  };

  const handleAnswerClick = (qIdx: number, oIdx: number) => {
    setSelectedAnswers(prev => ({ ...prev, [qIdx]: oIdx }));
    setShownAnswers(prev => ({ ...prev, [qIdx]: true }));
  };

  // Listen to materials collection in real time
  useEffect(() => {
    if (isDemoMode) {
      const loadMats = () => {
        setMaterials(mockDb.getMaterials());
        setLoading(false);
      };
      loadMats();
      window.addEventListener('mock_db_update', loadMats);
      return () => {
        window.removeEventListener('mock_db_update', loadMats);
      };
    }

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
  }, [isDemoMode]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newTitle || !newFileUrl) return;

    setUploading(true);
    const materialId = `mat_${Date.now()}`;
    const path = `study-materials/${materialId}`;

    if (isDemoMode) {
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
      mockDb.saveMaterial(materialPayload);
      setNewTitle('');
      setNewDesc('');
      setNewFileUrl('');
      setShowAddForm(false);
      setUploading(false);
      return;
    }

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

    if (isDemoMode) {
      mockDb.deleteMaterial(matId);
      return;
    }

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

                <div className="pt-4 border-t-2 border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">
                    By <span className="text-slate-700 font-extrabold">{m.uploadedByName}</span>
                  </div>

                  <div className="flex items-center gap-1.5 self-end">
                    {currentUser?.role === 'tutor' && m.uploadedBy === currentUser.userId && (
                      <button
                        onClick={() => handleDelete(m.materialId)}
                        className="p-2 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                        title="Delete material"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}

                    <button
                      onClick={() => handleOpenPreview(m)}
                      className="px-3 py-2 bg-slate-900 border-2 border-slate-900 text-yellow-400 hover:text-yellow-300 font-black uppercase text-xs shadow-[2px_2px_0px_0px_#000] hover:shadow-[3px_3px_0px_0px_#000] select-none cursor-pointer flex items-center gap-1 font-mono transition-all"
                    >
                      <Sparkles size={13} className="fill-yellow-400" />
                      <span>Review</span>
                    </button>

                    <a
                      href={m.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-2 bg-yellow-400 text-slate-950 font-black uppercase text-xs border-2 border-slate-900 shadow-[2px_2px_0px_0px_#000] hover:bg-yellow-300 select-none cursor-pointer flex items-center gap-1.5"
                    >
                      {isFile ? <FileDown size={14} className="stroke-[2.5px]" /> : <LinkIcon size={14} className="stroke-[2.5px]" />}
                      <span>{isFile ? 'Get' : 'Link'}</span>
                    </a>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Interactive Neobrutalist Study Overlay */}
      <AnimatePresence>
        {activePreview && (() => {
          const guide = PREVIEW_GUIDES[activePreview.materialId] || DEFAULT_GUIDE(activePreview);
          return (
            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="bg-white border-4 border-slate-900 shadow-[10px_10px_0px_0px_#000] w-full max-w-3xl overflow-hidden relative my-8"
              >
                {/* Header Banner */}
                <div className="bg-slate-900 p-4 border-b-4 border-slate-900 text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-yellow-400 text-slate-950 text-[10px] font-black uppercase tracking-wider font-mono">
                      {guide.subject} ACTIVE SUITE
                    </span>
                    <span className="hidden sm:inline text-slate-300 text-xs font-mono">| {activePreview.uploadedByName}</span>
                  </div>
                  <button
                    onClick={() => setActivePreview(null)}
                    className="bg-red-500 hover:bg-red-400 text-white border-2 border-white px-2.5 py-1 font-black transition-all cursor-pointer text-[11px] font-mono flex items-center gap-1 shadow-[2px_2px_0px_0px_rgba(255,255,255,0.7)]"
                  >
                    <X size={12} className="stroke-[3px]" />
                    <span>CLOSE</span>
                  </button>
                </div>

                {/* Subheader and Title */}
                <div className="p-6 bg-yellow-50 border-b-4 border-slate-900 space-y-2">
                  <h3 className="font-mono text-2xl font-black text-slate-900 uppercase italic leading-tight">
                    {guide.title}
                  </h3>
                  <p className="text-xs text-slate-600 font-bold max-w-xl">
                    {activePreview.description || 'Welcome to your expert interactive study companion. Use this workspace to master foundational syllabus components.'}
                  </p>
                </div>

                {/* Tab select bar */}
                <div className="flex border-b-4 border-slate-900 bg-slate-100">
                  <button
                    onClick={() => setPreviewTab('formulas')}
                    className={`flex-1 py-3 text-xs font-black uppercase tracking-wider font-mono flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      previewTab === 'formulas'
                        ? 'bg-white text-slate-900 border-r-2 border-slate-900'
                        : 'text-slate-500 hover:text-slate-800 border-r-2 border-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <BookOpen size={14} className={previewTab === 'formulas' ? 'text-yellow-500 fill-yellow-500' : 'text-slate-400'} />
                    <span>Cheat Sheet & Formulas</span>
                  </button>
                  <button
                    onClick={() => setPreviewTab('quiz')}
                    className={`flex-1 py-3 text-xs font-black uppercase tracking-wider font-mono flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      previewTab === 'quiz'
                        ? 'bg-white text-slate-900'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <Sparkles size={14} className={previewTab === 'quiz' ? 'text-yellow-500 fill-yellow-500 animate-spin' : 'text-slate-400'} />
                    <span>Practice Revision Quiz ({guide.quiz.length})</span>
                  </button>
                </div>

                {/* Main Content Area */}
                <div className="p-6 max-h-[400px] overflow-y-auto space-y-6">
                  {previewTab === 'formulas' ? (
                    <div className="space-y-6">
                      {/* Equations Lists */}
                      <div className="space-y-4">
                        <h4 className="font-mono text-xs font-black uppercase text-slate-500 flex items-center gap-1.5 border-b-2 pb-1.5">
                          <HelpCircle size={14} />
                          Essential Formulas & Variables
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {guide.formulas.map((f, idx) => (
                            <div key={idx} className="bg-slate-50 border-2 border-slate-900 p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                              <span className="text-[10px] font-black uppercase font-mono text-yellow-600 block mb-1">{f.label}</span>
                              <div className="font-mono text-sm font-black text-slate-950 bg-white border border-slate-300 p-2 text-center select-all cursor-pointer mb-2 rounded-none hover:bg-yellow-50 transition-colors">
                                {f.equation}
                              </div>
                              <p className="text-[10px] font-bold text-slate-500 leading-normal uppercase">{f.desc}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Concepts Lists */}
                      <div className="space-y-3">
                        <h4 className="font-mono text-xs font-black uppercase text-slate-500 flex items-center gap-1.5 border-b-2 pb-1.5">
                          <Award size={14} />
                          Core Academic Guidelines
                        </h4>
                        <div className="space-y-3">
                          {guide.concepts.map((c, idx) => (
                            <div key={idx} className="border-l-4 border-yellow-400 pl-4 py-1">
                              <span className="font-black text-xs text-slate-900 block uppercase italic mb-1">{c.topic}</span>
                              <p className="text-xs text-slate-600 font-bold leading-normal">{c.details}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="p-3 bg-slate-50 border-2 border-slate-900 text-slate-600 font-bold text-[10px] uppercase flex items-center gap-2">
                        <AlertCircle size={14} className="text-yellow-600 shrink-0" />
                        <span>Interactive Sandbox Environment: Click options to challenge your recall instantly!</span>
                      </div>

                      {guide.quiz.map((q, qIdx) => {
                        const hasSelected = selectedAnswers[qIdx] !== undefined;
                        const selectedIdx = selectedAnswers[qIdx];
                        const showAnswer = shownAnswers[qIdx];

                        return (
                          <div key={qIdx} className="border-4 border-slate-900 p-6 space-y-4 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] bg-white">
                            <h4 className="font-black text-slate-900 text-sm leading-snug">
                              <span className="font-mono text-yellow-600 mr-1.5">#.0{qIdx + 1}</span>
                              {q.question}
                            </h4>

                            <div className="grid grid-cols-1 gap-2.5">
                              {q.options.map((opt, oIdx) => {
                                let btnClasses = "w-full text-left p-3 border-2 border-slate-900 text-xs font-black uppercase cursor-pointer transition-colors ";
                                if (hasSelected) {
                                  if (oIdx === q.correctIndex) {
                                    btnClasses += "bg-emerald-100 text-emerald-900 border-emerald-900 shadow-[2px_2px_0px_0px_#10b981]";
                                  } else if (oIdx === selectedIdx) {
                                    btnClasses += "bg-red-100 text-red-900 border-red-900 shadow-[2px_2px_0px_0px_#ef4444]";
                                  } else {
                                    btnClasses += "bg-slate-50 text-slate-400 border-slate-300 opacity-60";
                                  }
                                } else {
                                  btnClasses += "bg-white text-slate-700 hover:bg-yellow-50 shadow-[2px_2px_0px_0px_#000] hover:shadow-[3px_3px_0px_0px_#000]";
                                }

                                return (
                                  <button
                                    key={oIdx}
                                    disabled={hasSelected}
                                    onClick={() => handleAnswerClick(qIdx, oIdx)}
                                    className={btnClasses}
                                  >
                                    <div className="flex justify-between items-center">
                                      <span>{opt}</span>
                                      {hasSelected && oIdx === q.correctIndex && (
                                        <span className="text-[10px] bg-emerald-700 text-white px-1.5 py-0.5 uppercase font-mono">CORRECT CHOICE</span>
                                      )}
                                      {hasSelected && oIdx === selectedIdx && oIdx !== q.correctIndex && (
                                        <span className="text-[10px] bg-red-700 text-white px-1.5 py-0.5 uppercase font-mono">YOUR CHOICE</span>
                                      )}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>

                            {showAnswer && (
                              <motion.div
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`border-2 p-4 uppercase ${
                                  selectedIdx === q.correctIndex
                                    ? 'border-emerald-990 bg-emerald-50 text-emerald-900'
                                    : 'border-red-900 bg-red-50 text-red-950'
                                }`}
                              >
                                <div className="flex items-center gap-1.5 mb-1">
                                  {selectedIdx === q.correctIndex ? (
                                    <Check size={14} className="text-emerald-700 stroke-[3px]" />
                                  ) : (
                                    <X size={14} className="text-red-700 stroke-[3px]" />
                                  )}
                                  <span className="font-mono text-[10px] font-black tracking-widest">
                                    {selectedIdx === q.correctIndex ? 'ACCURATE DEDUCTION' : 'CORRECTION BREAKDOWN'}
                                  </span>
                                </div>
                                <p className="text-[10px] font-bold font-sans tracking-tight leading-normal">
                                  {q.explanation}
                                </p>
                              </motion.div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Footer Utility */}
                <div className="p-4 bg-slate-50 border-t-4 border-slate-900 flex items-center justify-between">
                  <span className="text-[9px] font-mono font-black uppercase text-slate-400 tracking-wider">
                    COMPELLED LEARNING BY INDENSWXRLD Portal SYSTEMS
                  </span>
                  <a
                    href={activePreview.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-slate-950 border-2 border-slate-900 font-black uppercase text-[10px] shadow-[2px_2px_0px_0px_#000] cursor-pointer"
                  >
                    Open Raw Link file
                  </a>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
};

