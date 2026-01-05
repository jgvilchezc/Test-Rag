import React, { useState, useEffect } from "react";
import Chat from "./components/Chat";
import Ingest from "./components/Ingest";
import Sidebar from "./components/Sidebar";
import Auth from "./components/Auth";
import { supabase } from "./supabaseClient";
import "./App.css";

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentSessionId, setCurrentSessionId] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
        <div className="flex items-center justify-center h-screen bg-[#0f172a] text-white">
            <span className="animate-pulse">Cargando Nexus RAG...</span>
        </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  return (
    <div className="flex h-screen bg-[#0f172a] text-white overflow-hidden font-sans">
      <Sidebar 
        session={session} 
        currentSessionId={currentSessionId}
        setCurrentSessionId={setCurrentSessionId}
      />
      
      <main className="flex-1 ml-0 md:ml-64 h-full relative flex flex-col transition-all duration-200">
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
            {/* Left Panel: Ingest & Settings */}
            <div className="w-full md:w-1/3 border-r border-white/5 bg-[#0b1120] p-4 flex flex-col overflow-hidden">
                <Ingest session={session} />
            </div>

            {/* Right Panel: Chat Interface */}
            <div className="w-full md:w-2/3 h-full bg-[#0f172a] relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 to-purple-500/5 pointer-events-none"></div>
                <Chat 
                    session={session} 
                    currentSessionId={currentSessionId}
                    setCurrentSessionId={setCurrentSessionId}
                />
            </div>
        </div>
      </main>
    </div>
  );
}

export default App;
