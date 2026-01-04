import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles, Cpu, ChevronDown } from 'lucide-react';
import ChatViewFormatter from './ChatViewFormatter';

export default function Chat({ session, currentSessionId, setCurrentSessionId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState('gemini'); // 'gemini' | 'openai'
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const messagesEndRef = useRef(null);

  // Load History when currentSessionId changes
  useEffect(() => {
    if (currentSessionId && session?.access_token) {
        fetchHistory(currentSessionId);
    } else {
        // Reset to initial state for new chat
        setMessages([{ 
            role: 'ai', 
            content: "Hello! I'm your Neural RAG Assistant.\n\nI can answer questions based on the documents you ingest. Try uploading a text file and asking me about it!" 
        }]);
    }
  }, [currentSessionId, session]);

  const fetchHistory = async (sessionId) => {
    if (!sessionId) return;
    setLoading(true);
    try {
        const res = await fetch(`http://127.0.0.1:8001/chat/sessions/${sessionId}/messages`, {
            headers: { 'Authorization': `Bearer ${session.access_token}` }
        });
        if (res.ok) {
            const history = await res.json();
            if (Array.isArray(history)) {
                // Map backend format to frontend format
                const formattedMessages = history.map(msg => ({
                    role: msg.role === 'user' ? 'user' : 'ai',
                    content: msg.content,
                    provider: msg.provider
                }));
                setMessages(formattedMessages);
            }
        }
    } catch (e) {
        console.error("Error loading history:", e);
    } finally {
        setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Close dropdown on click outside
  useEffect(() => {
      const closeDropdown = (e) => {
          if (!e.target.closest('#model-selector')) {
              setIsModelDropdownOpen(false);
          }
      };
      
      if (isModelDropdownOpen) {
          document.addEventListener('click', closeDropdown);
      }
      return () => document.removeEventListener('click', closeDropdown);
  }, [isModelDropdownOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('http://127.0.0.1:8001/chat', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}` 
        },
        body: JSON.stringify({ 
            question: userMsg.content,
            provider: provider,
            session_id: currentSessionId // Send current ID if exists
        })
      });
      
      const data = await res.json();
      
      if (data.status === 'error') throw new Error(data.message);
      
      // If a new session was created efficiently, update parent state
      if (data.session_id && data.session_id !== currentSessionId) {
          setCurrentSessionId(data.session_id);
      }

      const aiMsg = { 
        role: 'ai', 
        content: data.respuesta_ia || "I couldn't find an answer in your documents.", 
        sources: data.fuentes,
        provider: data.provider 
      };
      
      setMessages(prev => [...prev, aiMsg]);
      
    } catch (e) {
      setMessages(prev => [...prev, { 
        role: 'ai', 
        content: e.message,
        isError: true 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="glass-panel h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-glass flex items-center justify-between bg-black/20">
        <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center border border-glass ${provider === 'gemini' ? 'bg-primary/20 text-primary' : 'bg-green-500/10 text-green-400'}`}>
                {provider === 'gemini' ? <Sparkles size={18} /> : <Cpu size={18} />}
            </div>
            <div>
                <h2 className="text-sm font-semibold text-white">AI Assistant</h2>
                <p className="text-[10px] text-muted font-medium uppercase tracking-wider">{provider === 'gemini' ? 'Gemini 2.0 Flash' : 'GPT-4o'}</p>
            </div>
        </div>
        
        {/* Model Selector */}
        <div className="relative" id="model-selector">
            <button 
                onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                className={`flex items-center gap-2 border px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isModelDropdownOpen 
                        ? 'bg-primary/20 border-primary/50 text-white shadow-[0_0_10px_rgba(124,58,237,0.2)]' 
                        : 'bg-black/40 border-glass text-muted hover:text-white hover:border-primary/30'
                }`}
            >
                <span className="flex items-center gap-2">
                    {provider === 'gemini' ? '✨ Gemini 2.0' : '🧠 GPT-4o'}
                </span>
                <ChevronDown size={14} className={`transition-transform duration-200 ${isModelDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isModelDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 glass-panel border border-glass bg-[#0f172a]/95 backdrop-blur-xl p-1.5 shadow-2xl z-50 animate-fade-in flex flex-col gap-1 ring-1 ring-black/50">
                    <div className="px-2 py-1.5 text-[10px] font-semibold text-muted uppercase tracking-wider border-b border-white/5 mb-1">Select Model</div>
                    
                    <button 
                        onClick={() => { setProvider('gemini'); setIsModelDropdownOpen(false); }}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all group ${
                            provider === 'gemini' 
                                ? 'bg-primary/20 text-white shadow-inner' 
                                : 'hover:bg-white/5 text-muted hover:text-white'
                        }`}
                    >
                        <Sparkles size={16} className={provider === 'gemini' ? "text-primary drop-shadow-[0_0_8px_rgba(124,58,237,0.5)]" : "group-hover:text-primary transition-colors"}/> 
                        <div className="flex flex-col items-start">
                            <span className="font-medium">Gemini 2.0</span>
                            <span className="text-[10px] opacity-60 font-normal">Fast & Vision Capable</span>
                        </div>
                        {provider === 'gemini' && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_5px_var(--primary)]"></div>}
                    </button>
                    
                    <button 
                        onClick={() => { setProvider('openai'); setIsModelDropdownOpen(false); }}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all group ${
                            provider === 'openai' 
                                ? 'bg-green-500/10 text-white shadow-inner' 
                                : 'hover:bg-white/5 text-muted hover:text-white'
                        }`}
                    >
                        <Cpu size={16} className={provider === 'openai' ? "text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]" : "group-hover:text-green-400 transition-colors"}/> 
                        <div className="flex flex-col items-start">
                            <span className="font-medium">GPT-4o</span>
                            <span className="text-[10px] opacity-60 font-normal">Complex Reasoning</span>
                        </div>
                         {provider === 'openai' && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_5px_#4ade80]"></div>}
                    </button>
                </div>
            )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-primary' : 'bg-surface border border-glass'}`}>
              {msg.role === 'user' ? <User size={16} className="text-white" /> : <Bot size={16} className="text-primary" />}
            </div>
            
            <div className={`flex flex-col gap-2 max-w-[85%] ${msg.role === 'ai' ? 'w-full' : ''}`}>
                <div className={`chat-bubble ${
                    msg.role === 'user' 
                        ? 'bg-primary text-white rounded-tr-none' 
                        : msg.isError
                            ? 'alert-error rounded-tl-none border-red-500/50 bg-red-500/10'
                            : 'bg-surface border border-glass rounded-tl-none !p-0 overflow-hidden'
                }`}>
                {msg.role === 'user' ? (
                    <div className="p-3">
                        {msg.content.split('\n').map((line, i) => (
                            <p key={i} className="mb-1 last:mb-0 min-h-[1.2em]">{line}</p>
                        ))}
                    </div>
                ) : (
                    <div className="p-3">
                        <ChatViewFormatter content={msg.content} />
                    </div>
                )}
                </div>
                
                {/* Provider Badge */}
                {msg.provider && (
                    <div className="flex justify-end mt-1">
                        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${
                            msg.provider === 'openai' 
                                ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                                : 'bg-primary/10 text-primary border-primary/20'
                        }`}>
                            {msg.provider}
                        </span>
                    </div>
                )}
                
                {/* Sources */}
                {msg.sources && msg.sources.length > 0 && (
                    <div className="text-xs text-muted ml-2 animate-fade-in">
                        <p className="font-semibold mb-1 flex items-center gap-1">
                          <Sparkles size={10} /> Sources:
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {msg.sources.map((src, i) => (
                                <div 
                                  key={i} 
                                  className="bg-black/20 px-2 py-1 rounded border border-glass flex items-center gap-1 hover:bg-primary/20 transition-colors cursor-help"
                                  title={src.content.slice(0, 200) + "..."}
                                >
                                    <span className="opacity-70">📄</span>
                                    <span>{src.filename || "Unknown Doc"}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
             <div className="w-8 h-8 rounded-full bg-surface border border-glass flex items-center justify-center shrink-0">
                <Bot size={16} className="text-primary" />
             </div>
             <div className="bg-surface border border-glass chat-bubble rounded-tl-none flex items-center gap-2 text-muted">
                <Loader2 className="animate-spin" size={16} /> Thinking...
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-glass bg-black/10">
        <div className="flex gap-3 items-center bg-black/20 p-2 rounded-lg border border-glass focus-within:border-primary/50 transition-colors">
          <textarea 
            className="w-full bg-transparent border-none text-white px-4 py-3 focus:outline-none resize-none font-sans" 
            placeholder="Ask a question..."
            rows={1}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{ minHeight: '52px', maxHeight: '150px' }}
          />
          <button 
            className="p-3 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 shrink-0"
            onClick={handleSend}
            disabled={loading || !input.trim()}
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
