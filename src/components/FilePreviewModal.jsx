import React, { useState, useEffect } from 'react';
import { X, FileText, Loader2, Calendar } from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function FilePreviewModal({ isOpen, onClose, documentId, session }) {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [docInfo, setDocInfo] = useState(null);

  useEffect(() => {
    if (isOpen && documentId && session?.access_token) {
      fetchDocument();
    }
  }, [isOpen, documentId, session]);

  const fetchDocument = async () => {
    setLoading(true);
    setError(null);
    setContent(null);
    try {
      const res = await fetch(`${API_BASE_URL}/documents/${documentId}`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      
      if (!res.ok) throw new Error("No se pudo cargar el documento");
      
      const data = await res.json();
      setDocInfo(data);
      setContent(data.content);
    } catch (err) {
      console.error(err);
      setError("Error al cargar el contenido.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-[#1e293b] w-full max-w-4xl h-[85vh] rounded-2xl shadow-2xl border border-white/10 flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-[#0f172a]">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-2 bg-purple-500/10 rounded-lg shrink-0">
              <FileText className="text-purple-400" size={20} />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-white truncate">
                {docInfo?.filename || "Cargando..."}
              </h2>
              {docInfo && (
                 <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Calendar size={12} />
                    <span>{new Date(docInfo.created_at).toLocaleDateString()}</span>
                 </div>
              )}
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-0 bg-[#0b1120] relative">
            {loading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                    <Loader2 size={32} className="animate-spin text-purple-500" />
                    <span className="text-slate-400 text-sm">Obteniendo contenido...</span>
                </div>
            ) : error ? (
                <div className="absolute inset-0 flex items-center justify-center text-red-400">
                    {error}
                </div>
            ) : (
                <div className="p-6">
                    <pre className="text-sm font-mono text-slate-300 whitespace-pre-wrap break-words leading-relaxed">
                        {content}
                    </pre>
                </div>
            )}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-white/5 bg-[#1e293b] flex justify-end">
             <button 
                onClick={onClose}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors"
             >
                Cerrar
             </button>
        </div>

      </div>
    </div>
  );
}
