import React, { useState, useEffect } from 'react';
import { X, Key, Trash2, Copy, Check, Eye, AlertTriangle } from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function ApiKeyModal({ isOpen, onClose, session }) {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [createdKey, setCreatedKey] = useState(null); // { api_key, ... }
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && session?.access_token) {
      fetchKeys();
      setCreatedKey(null);
      setError(null);
      setNewKeyName('');
    }
  }, [isOpen, session]);

  const fetchKeys = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/api-keys`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setKeys(data);
      } else {
        setError("Error al cargar las claves.");
      }
    } catch (err) {
      setError("Error de conexión.");
    } finally {
      setLoading(false);
    }
  };

  const createKey = async (e) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/api-keys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ name: newKeyName })
      });

      if (res.ok) {
        const data = await res.json();
        setCreatedKey(data);
        fetchKeys(); // Refresh list
        setNewKeyName('');
      } else {
        setError("Error al crear la clave.");
      }
    } catch (err) {
      setError("Error de conexión.");
    } finally {
      setLoading(false);
    }
  };

  const deleteKey = async (id) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta clave? Dejará de funcionar inmediatamente.")) return;

    try {
      const res = await fetch(`${API_BASE_URL}/auth/api-keys/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      if (res.ok) {
        setKeys(keys.filter(k => k.id !== id));
      }
    } catch (err) {
      alert("Error al eliminar la clave");
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-[#1e293b] w-full max-w-2xl rounded-2xl shadow-2xl border border-white/10 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Key className="text-blue-400" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">API Keys para Desarrolladores</h2>
              <p className="text-sm text-slate-400">Gestiona el acceso programático al RAG</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Create New Key Section */}
          {!createdKey ? (
            <form onSubmit={createKey} className="flex gap-4 items-end bg-slate-900/50 p-4 rounded-xl border border-white/5">
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium text-slate-300">Nombre de la Clave</label>
                <input 
                  type="text" 
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="Ej: Integración Vercel" 
                  className="w-full bg-[#0f172a] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600"
                  disabled={loading}
                />
              </div>
              <button 
                type="submit" 
                disabled={loading || !newKeyName.trim()}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                {loading ? 'Creando...' : (
                  <>
                    <PlusIcon /> Crear Clave
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="bg-green-500/10 border border-green-500/20 p-6 rounded-xl animate-in fade-in slide-in-from-top-4">
              <div className="flex items-center gap-2 mb-4">
                <Check className="text-green-400" size={20} />
                <h3 className="text-lg font-semibold text-green-400">¡Clave Creada Exitosamente!</h3>
              </div>
              <p className="text-sm text-slate-300 mb-4">
                Copia esta clave ahora. <strong className="text-white">No podrás volver a verla.</strong>
              </p>
              
              <div className="flex items-center gap-2 bg-[#0f172a] p-3 rounded-lg border border-green-500/20">
                <code className="flex-1 font-mono text-green-400 break-all">{createdKey.api_key}</code>
                <button 
                  onClick={() => copyToClipboard(createdKey.api_key)}
                  className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                  title="Copiar"
                >
                  {copied ? <Check size={20} className="text-green-400" /> : <Copy size={20} />}
                </button>
              </div>
              
              <button 
                onClick={() => setCreatedKey(null)}
                className="mt-4 text-sm text-slate-400 hover:text-white underline"
              >
                Generar otra clave
              </button>
            </div>
          )}

          {/* List Keys */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Claves Activas</h3>
            
            {loading && !keys.length ? (
              <div className="text-center py-8 text-slate-500">Cargando...</div>
            ) : keys.length === 0 ? (
              <div className="text-center py-8 bg-slate-900/50 rounded-xl border border-dashed border-white/10 text-slate-500">
                No tienes claves API activas.
              </div>
            ) : (
              <div className="space-y-3">
                {keys.map((key) => (
                  <div key={key.id} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl border border-white/5 hover:border-white/10 transition-colors group">
                    <div>
                      <h4 className="font-medium text-white">{key.name}</h4>
                      <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                        <span>Creada: {new Date(key.created_at).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>Último uso: {key.last_used_at ? new Date(key.last_used_at).toLocaleDateString() : 'Nunca'}</span>
                        <code className="bg-white/5 px-1.5 py-0.5 rounded text-slate-400">sk_rag_...</code>
                      </div>
                    </div>
                    <button 
                      onClick={() => deleteKey(key.id)}
                      className="p-2 hover:bg-red-500/10 text-slate-500 hover:text-red-400 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      title="Revocar clave"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-6 border-t border-white/5 bg-[#1e293b] flex justify-between items-center text-xs text-slate-500">
           <div className="flex items-center gap-2">
             <AlertTriangle size={14} className="text-amber-500" />
             <span>No compartas tus claves con nadie.</span>
           </div>
           <button onClick={onClose} className="text-white bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg transition-colors">
             Cerrar
           </button>
        </div>
      </div>
    </div>
  );
}

function PlusIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
