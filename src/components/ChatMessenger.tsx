/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, doc, setDoc, onSnapshot, query, orderBy, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { ChatMessage, AppUser } from '../types';
import { Send, User, MessageSquare, ShieldCheck, Sparkles, PlusCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const ChatMessenger: React.FC = () => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [partners, setPartners] = useState<AppUser[]>([]);
  const [activePartnerId, setActivePartnerId] = useState<string | null>(null);

  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  const endRef = useRef<HTMLDivElement>(null);

  // 1. Fetch available chat partners
  useEffect(() => {
    if (!currentUser) return;

    const fetchPartners = async () => {
      try {
        const querySnap = await getDocs(query(collection(db, 'users')));
        const list: AppUser[] = [];
        querySnap.forEach((docSnap) => {
          const userObj = docSnap.data() as AppUser;
          if (userObj.userId !== currentUser.userId) {
            if (currentUser.role === 'student' && userObj.role === 'tutor') {
              list.push(userObj);
            } else if (currentUser.role === 'tutor' && userObj.role === 'student') {
              list.push(userObj);
            }
          }
        });
        
        if (currentUser.role === 'student' && list.length === 0) {
          list.push({
            userId: 'helpdesk_tutor_peters',
            name: 'Mentor Peterson (Math & Science Lead)',
            email: 'peterson.prep@association.org',
            role: 'tutor',
            createdAt: new Date().toISOString(),
          });
        }
        setPartners(list);
        if (list.length > 0) {
          setActivePartnerId(list[0].userId);
        }
      } catch (error) {
        console.error("Error setting up chat partner references:", error);
      }
    };

    fetchPartners();
  }, [currentUser]);

  // 2. Subscribe to real-time chat messages
  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'chat-messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: ChatMessage[] = [];
      snapshot.forEach((doc) => {
        items.push(doc.data() as ChatMessage);
      });
      setMessages(items);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'chat-messages');
    });

    return () => unsubscribe();
  }, [currentUser]);

  // 3. Scroll to the bottom
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activePartnerId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !activePartnerId || !inputText.trim()) return;

    setSending(true);
    const messageId = `msg_${Date.now()}`;
    const path = `chat-messages/${messageId}`;

    try {
      const payload: ChatMessage = {
        messageId,
        text: inputText.trim(),
        senderId: currentUser.userId,
        senderName: currentUser.name,
        senderRole: currentUser.role,
        receiverId: activePartnerId,
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'chat-messages', messageId), payload);
      setInputText('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    } finally {
      setSending(false);
    }
  };

  const handleQuickQuestion = (text: string) => {
    setInputText(text);
  };

  const activePartnerObj = partners.find(p => p.userId === activePartnerId);

  // Filter messages between currentUser and activePartnerId
  const conversationMessages = messages.filter((msg) => {
    return (
      (msg.senderId === currentUser?.userId && msg.receiverId === activePartnerId) ||
      (msg.senderId === activePartnerId && msg.receiverId === currentUser?.userId)
    );
  });

  const studentShortcuts = [
    "Mentor, could we review trigonometry problem #4 in tomorrow's session?",
    "Can you double check my math worksheet markups?",
    "When will the science final exams review video be uploaded?"
  ];

  const tutorShortcuts = [
    "Excellent effort on your recent physics exam review!",
    "Let's reschedule our core chemistry slot to Friday 14:00 UTC.",
    "Make sure to download the Calculus cheat sheet in the materials page."
  ];

  const shortcuts = currentUser?.role === 'student' ? studentShortcuts : tutorShortcuts;

  return (
    <div className="bg-white border-4 border-slate-900 rounded-none overflow-hidden shadow-[8px_8px_0px_0px_#facc15] grid grid-cols-1 md:grid-cols-4 min-h-[550px] max-h-[650px]">
      
      {/* Partners List panel on Left */}
      <div className="md:col-span-1 border-r-4 border-slate-900 p-4 space-y-4 flex flex-col justify-between bg-yellow-50/25">
        <div className="space-y-4">
          <div className="space-y-1 pb-2 border-b-2 border-slate-900">
            <h3 className="font-black text-slate-900 text-xs uppercase tracking-widest flex items-center gap-1.5">
              <MessageSquare size={13} className="text-yellow-600 stroke-[3px]" />
              CONTACTS.
            </h3>
            <p className="text-[10px] uppercase font-bold text-slate-400">Select peer nodes.</p>
          </div>

          <div className="space-y-2 overflow-y-auto max-h-[440px]">
            {partners.map((p) => {
              const isActive = p.userId === activePartnerId;
              const lastMessage = messages
                .filter(m => (m.senderId === p.userId || m.receiverId === p.userId))
                .pop();

              return (
                <button
                  key={p.userId}
                  onClick={() => setActivePartnerId(p.userId)}
                  className={`w-full text-left p-3 border-2 transition-all flex items-center gap-2.5 cursor-pointer rounded-none ${
                    isActive
                      ? 'bg-slate-900 text-white border-slate-905 shadow-[2px_2px_0px_0px_#facc15]'
                      : 'bg-white text-slate-700 border-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <div className="h-7 w-7 rounded-none border border-slate-900 bg-yellow-400 text-slate-950 font-black flex items-center justify-center text-xs select-none shrink-0">
                    {p.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-black text-xs truncate uppercase tracking-tight">{p.name}</div>
                    <div className={`text-[10px] truncate uppercase font-semibold ${isActive ? 'text-yellow-400' : 'text-slate-400'}`}>
                      {lastMessage ? lastMessage.text : `Connect as ${p.role}`}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-4 border-t-2 border-slate-900 flex items-center gap-2">
          <div className="h-2 w-2 bg-slate-900 rounded-none animate-ping" />
          <span className="text-[9px] uppercase font-mono font-black text-slate-400">SOCKET READY</span>
        </div>
      </div>

      {/* Main chat log channel */}
      <div className="md:col-span-3 flex flex-col justify-between bg-white h-full overflow-hidden">
        
        {/* Active partner topbar header */}
        <div className="p-4 border-b-4 border-slate-900 bg-yellow-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-none bg-slate-900 text-white border-2 border-slate-900 flex items-center justify-center font-black text-xs">
              {activePartnerObj?.name ? activePartnerObj.name.charAt(0) : 'T'}
            </div>
            <div>
              <h4 className="font-extrabold text-slate-950 uppercase text-xs leading-none">
                {activePartnerObj?.name || 'Loading active mentor...'}
              </h4>
              <p className="text-[9px] text-slate-900 font-bold uppercase tracking-widest mt-1">
                {activePartnerObj?.role === 'tutor' ? 'Lead Association Mentor' : 'Verified Student'}
              </p>
            </div>
          </div>
          <span className="text-[9px] uppercase text-white font-mono flex items-center gap-1.5 bg-slate-900 border border-slate-900 px-2 py-0.5 rounded-none font-black shadow-[1px_1px_0px_0px_#facc15]">
            <ShieldCheck size={11} className="text-yellow-400 stroke-[3.5px]" />
            SECURED.
          </span>
        </div>

        {/* Message logs */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 min-h-[300px] bg-slate-50">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-900" />
            </div>
          ) : conversationMessages.length === 0 ? (
            <div className="text-center py-20">
              <MessageSquare size={38} className="mx-auto text-slate-350 stroke-[2px]" />
              <h4 className="font-black text-slate-805 text-xs uppercase tracking-tight mt-3">Start a conversation</h4>
              <p className="text-slate-400 text-[10px] uppercase font-bold max-w-xs mx-auto mt-1 leading-relaxed">
                Both students and mentors have instant message socket synchronization. Selected peer targets propagate now.
              </p>
            </div>
          ) : (
            conversationMessages.map((msg) => {
              const matchesMe = msg.senderId === currentUser?.userId;
              return (
                <div
                  key={msg.messageId}
                  className={`flex ${matchesMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[70%] border-4 border-slate-900 p-3.5 text-xs leading-normal rounded-none shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] ${
                    matchesMe
                      ? 'bg-yellow-400 text-slate-950'
                      : 'bg-white text-slate-900'
                  }`}>
                    {!matchesMe && (
                      <span className="block text-[8px] font-black uppercase text-slate-400 tracking-wider mb-1">
                        {msg.senderName}
                      </span>
                    )}
                    <p className="whitespace-pre-line font-black font-sans leading-tight">{msg.text}</p>
                    <span className={`block text-[9px] font-mono mt-2 text-right  ${matchesMe ? 'text-slate-800' : 'text-slate-400'}`}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={endRef} />
        </div>

        {/* Shortcuts and text input fields */}
        <div className="p-4 border-t-4 border-slate-900 space-y-3 bg-white">
          
          {/* Assistive shortcuts */}
          <div className="flex flex-wrap items-center gap-1.5 pb-1 border-b border-slate-100">
            <span className="text-[9px] uppercase tracking-widest font-black text-slate-400 flex items-center gap-1">
              <Sparkles size={11} className="text-yellow-500" />
              Quick:
            </span>
            {shortcuts.map((sh, index) => (
              <button
                key={index}
                onClick={() => handleQuickQuestion(sh)}
                className="text-[9px] uppercase font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 border border-slate-955 transition-all cursor-pointer rounded-none"
              >
                {sh.length > 25 ? sh.slice(0, 25) + "..." : sh}
              </button>
            ))}
          </div>

          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              id="chatInputField"
              type="text"
              placeholder={`Write a direct message to ${activePartnerObj?.name || 'your mentor'}...`}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={sending || !activePartnerId}
              required
              className="flex-1 text-xs px-4 py-3 bg-white border-4 border-slate-900 font-bold focus:outline-none placeholder-slate-400"
            />
            <button
              type="submit"
              disabled={sending || !inputText.trim() || !activePartnerId}
              className="px-6 bg-slate-900 hover:bg-slate-800 text-white font-black uppercase text-xs border-4 border-slate-900"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
