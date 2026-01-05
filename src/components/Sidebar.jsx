import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { LogOut, User, MessageSquare, PlusCircle, Menu, X, Database } from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function Sidebar({ session, currentSessionId, setCurrentSessionId }) {
  const [isOpen, setIsOpen] = useState(true);
  const [chatSessions, setChatSessions] = useState([]);

  // Fetch sessions on mount
  useEffect(() => {
      if (session?.access_token) {
          fetchSessions();
      }
  }, [session, currentSessionId]); // Reload when ID changes (e.g. new chat created)

  const fetchSessions = async () => {
      try {
          if (!session?.access_token) return;
          
          const res = await fetch(`${API_BASE_URL}/chat/sessions`, {
             headers: {
                 'Authorization': `Bearer ${session.access_token}`
             }
          });
          if (res.ok) {
              const data = await res.json();
              if (Array.isArray(data)) {
                  setChatSessions(data);
              }
          } else {
             console.error("Failed to fetch sessions:", res.status);
          }
      } catch (error) {
          console.error("Error fetching sessions:", error);
      }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };
  
  const handleNewChat = () => {
      setCurrentSessionId(null);
      // Optional: Close mobile sidebar
      if (window.innerWidth < 768) setIsOpen(false);
  };

  const userEmail = session?.user?.email;

  return (
    <>
      {/* Mobile Toggle Button */}
      <button 
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-[#1e293b] rounded-lg text-white"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar Container */}
      <div className={`fixed inset-y-0 left-0 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition duration-200 ease-in-out z-40 w-64 bg-[#0f172a]/95 backdrop-blur-xl border-r border-white/5 flex flex-col h-full`}>
        
        {/* Header */}
        <div className="p-4 border-b border-white/5 flex items-center justify-center">
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">
                Nexus RAG
            </h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            <button 
                onClick={handleNewChat}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-white bg-blue-600/20 border border-blue-500/30 rounded-xl hover:bg-blue-600/30 transition-all group"
            >
                <PlusCircle size={18} className="text-blue-400 group-hover:text-blue-300" />
                Nueva Conversación
            </button>

            <div className="pt-4 pb-2">
                <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Historial
                </p>
            </div>
            
            <div className="space-y-1">
                {chatSessions.map((chat) => (
                    <button 
                        key={chat.id}
                        onClick={() => {
                            setCurrentSessionId(chat.id);
                            if (window.innerWidth < 768) setIsOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-colors text-left ${
                            currentSessionId === chat.id 
                                ? 'bg-white/10 text-white' 
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <MessageSquare size={16} className="shrink-0" />
                        <span className="truncate">{chat.title || "Conversación sin título"}</span>
                    </button>
                ))}
            </div>
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-white/5 bg-[#0f172a]">
            {userEmail && (
                <div className="flex items-center gap-3 px-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white">
                        {userEmail[0].toUpperCase()}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-medium text-white truncate">{userEmail}</p>
                        <p className="text-xs text-slate-500">Plan Gratuito</p>
                    </div>
                </div>
            )}
            
            <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-900/10 rounded-lg transition-colors"
            >
                <LogOut size={18} />
                Cerrar Sesión
            </button>
        </div>
      </div>
    </>
  );
}
