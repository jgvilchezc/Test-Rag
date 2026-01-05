import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Upload, Check, AlertCircle, Loader2, FileText, Library, X, Trash2 } from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function Ingest({ session }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('idle'); // idle, success, error
  const [formData, setFormData] = useState({ filename: '', content: '' });
  const [message, setMessage] = useState('');
  
  // Library Modal State
  const [showModal, setShowModal] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (showModal) {
      // Small timeout to ensure Portal is rendered
      setTimeout(() => {
        const modalElement = document.getElementById('library-modal-content');
        if (modalElement) {
            modalElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }, [showModal]);

  const fetchDocuments = async () => {
    setLoadingDocs(true);
    try {
      const res = await fetch(`${API_BASE_URL}/documents`, {
        headers: {
            'Authorization': `Bearer ${session?.access_token}`
        }
      });
      if (!res.ok) throw new Error('Failed to fetch documents');
      const data = await res.json();
      setDocuments(data);
    } catch (e) {
      console.error(e);
      // Optional: show error toast
    } finally {
      setLoadingDocs(false);
    }
  };

  const openLibrary = () => {
    setShowModal(true);
    fetchDocuments();
  };

  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        setSelectedFile(file);
        // Auto-fill filename if empty
        if (!formData.filename) {
            setFormData(prev => ({ ...prev, filename: file.name }));
        }
    }
  };

  const handleIngest = async () => {
    if ((!formData.content.trim() && !selectedFile) || !formData.filename.trim()) return;
    
    setLoading(true);
    setStatus('idle');
    setMessage('');
    
    try {
      let res;
      
      const headers = {
         'Authorization': `Bearer ${session?.access_token}`
      };

      if (selectedFile) {
          // File Ingestion logic
          const uploadData = new FormData();
          uploadData.append('file', selectedFile);
          
          res = await fetch(`${API_BASE_URL}/ingest-file`, {
              method: 'POST',
              headers: headers, // FormData automatically sets Content-Type to multipart
              body: uploadData
          });

      } else {
          // Text Ingestion logic
          res = await fetch(`${API_BASE_URL}/ingest-text`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                ...headers 
            },
            body: JSON.stringify(formData)
          });
      }
      
      const data = await res.json();
      
      if (!res.ok || data.status === 'error') {
          throw new Error(data.message || 'Failed to ingest');
      }
      
      setStatus('success');
      setMessage(`Knowledge ingested successfully! ID: ${data.id}`);
      setFormData({ filename: '', content: '' });
      setSelectedFile(null);
      if(fileInputRef.current) fileInputRef.current.value = '';
      
      // Reset success status after 3 seconds
      setTimeout(() => setStatus('idle'), 3000);
      
    } catch (e) {
      setStatus('error');
      setMessage(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel p-6 flex flex-col gap-4 h-full relative">
      <div className="flex items-center justify-between">
        <h2 className="text-xl flex items-center gap-2 text-primary">
          <Upload size={20} /> Knowledge Ingestion
        </h2>
        <div className="flex items-center gap-2">
           <button 
             onClick={openLibrary}
             className="btn px-3 py-1.5 bg-primary/10 border border-primary/30 text-primary text-sm hover:bg-primary/20 transition-all font-medium"
             title="View Library"
           >
             <Library size={16} /> Library
           </button>
           {status === 'success' && <Check className="text-green-400" size={20} />}
        </div>
      </div>

      <div className="flex flex-col gap-4 flex-1">
        <div>
          <label className="text-sm text-muted mb-2 block">Document Title</label>
          <div className="relative">
            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
            <input 
              type="text" 
              className="input-field pl-10" 
              placeholder="e.g. Supabase Documentation"
              value={formData.filename}
              onChange={e => setFormData({...formData, filename: e.target.value})}
            />
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-4">
           {/* File Drop Zone */}
           <div 
             className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-all cursor-pointer relative
                ${selectedFile ? 'border-primary bg-primary/5 flex-1' : 'border-glass hover:border-primary/50 hover:bg-white/5'}
             `}
             onClick={() => fileInputRef.current?.click()}
             onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-primary'); }}
             onDragLeave={(e) => { e.preventDefault(); e.currentTarget.classList.remove('border-primary'); }}
             onDrop={(e) => {
                 e.preventDefault();
                 e.currentTarget.classList.remove('border-primary');
                 const file = e.dataTransfer.files[0];
                 if(file) handleFileChange({ target: { files: [file] } });
             }}
           >
              <input 
                 type="file" 
                 className="hidden" 
                 ref={fileInputRef}
                 onChange={handleFileChange}
                 accept=".pdf,.txt,.md,.jpg,.jpeg,.png,.webp,.csv"
              />
              
              {selectedFile ? (
                  <div className="flex flex-col items-center gap-3 animate-fade-in w-full text-center">
                      <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary border border-primary/30 shadow-[0_0_15px_rgba(124,58,237,0.2)]">
                          <Check size={32} />
                      </div>
                      <div>
                        <p className="font-semibold text-white text-lg truncate max-w-[300px] mx-auto">{selectedFile.name}</p>
                        <p className="text-sm text-muted mt-1">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                      </div>
                      <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                          Ready to ingest
                      </span>
                  </div>
              ) : (
                  <>
                    <Upload size={32} className="text-muted mb-2" />
                    <p className="font-medium text-white mb-1">Click to upload or drag & drop</p>
                    <p className="text-xs text-muted">Supports PDF, Images, TXT, MD</p>
                  </>
              )}
           </div>

           {/* OR Separator & Text Input - Only show if no file selected */ }
           {!selectedFile && (
               <>
                <div className="relative flex items-center gap-4">
                    <div className="h-px bg-glass flex-1"></div>
                    <span className="text-xs text-muted font-medium uppercase">OR PASTE TEXT</span>
                    <div className="h-px bg-glass flex-1"></div>
                </div>

                <div className="flex-1 flex flex-col min-h-[150px]">
                    <textarea 
                        className="input-field flex-1 p-4" 
                        placeholder="Directly paste text content here..."
                        value={formData.content}
                        onChange={e => {
                            setFormData({...formData, content: e.target.value});
                        }}
                    />
                </div>
               </>
           )}
        </div>

        {status === 'error' && (
          <div className="alert-error">
            <AlertCircle size={16} /> {message}
          </div>
        )}

        {status === 'success' && (
           <div className="alert-success">
             <Check size={16} /> {message}
           </div>
        )}

        <div className="flex gap-2 mt-2">
           <button 
             className="btn btn-primary flex-1 justify-center"
             onClick={handleIngest}
             disabled={loading || (!formData.content && !selectedFile)}
           >
             {loading ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
             {loading ? 'Ingesting...' : 'Ingest Knowledge'}
           </button>
           
           {(formData.content || selectedFile) && (
               <button 
                   className="btn bg-red-500/20 text-red-100 border border-red-500/50 hover:bg-red-500/30 px-3 transition-colors shadow-sm"
                   onClick={() => {
                       setFormData({ filename: '', content: '' });
                       setSelectedFile(null);
                       if(fileInputRef.current) fileInputRef.current.value = '';
                   }}
                   title="Clear form"
               >
                   <Trash2 size={20} />
               </button>
           )}
        </div>
      </div>

      {/* Library Modal */}
      {showModal && createPortal(
        <div 
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={(e) => { if(e.target === e.currentTarget) setShowModal(false); }}
            style={{ animation: 'fadeIn 0.2s ease-out' }}
        >
            <div 
                id="library-modal-content"
                className="glass-panel w-full max-w-2xl max-h-[75vh] flex flex-col shadow-2xl animate-fade-in border-primary/20 overflow-hidden"
            >
                <div className="p-4 border-b border-glass flex justify-between items-center bg-white/5 shrink-0">
                    <h3 className="text-xl font-semibold flex items-center gap-2 text-white">
                        <Library size={22} className="text-primary"/> Document Library
                    </h3>
                    <button 
                        onClick={() => setShowModal(false)} 
                        className="p-2 hover:bg-white/10 rounded-full text-muted hover:text-white transition-all"
                    >
                        <X size={22} />
                    </button>
                </div>
                
                <div 
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-black/20"
                >
                    {loadingDocs ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted gap-3">
                            <Loader2 size={32} className="animate-spin text-primary" />
                            <p className="text-sm font-medium">Loading documents...</p>
                        </div>
                    ) : documents.length === 0 ? (
                        <div className="text-center py-12 text-muted border-2 border-dashed border-glass rounded-xl bg-white/5">
                            <FileText size={48} className="mx-auto mb-3 opacity-30" />
                            <p className="font-medium">No documents found.</p>
                            <p className="text-xs mt-1">Upload some content to populate your library.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {documents.map((doc) => (
                                <div key={doc.id} className="p-4 bg-white/5 hover:bg-white/10 border border-glass rounded-xl flex justify-between items-center group transition-all cursor-pointer">
                                    <div className="flex items-center gap-4 overflow-hidden">
                                        <div className="w-10 h-10 flex items-center justify-center bg-primary/20 rounded-lg text-primary shrink-0 shadow-inner">
                                            <FileText size={20} />
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="font-semibold text-white truncate pr-2 text-sm">{doc.filename}</h4>
                                            <p className="text-[10px] uppercase tracking-wider text-muted/60 mt-1">
                                                ID: {doc.id.substring(0, 8)}... • {new Date(doc.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                        <div className="px-2 py-1 bg-primary/10 rounded text-[10px] text-primary border border-primary/20">READY</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                
                <div className="p-4 border-t border-glass bg-black/40 flex justify-between items-center rounded-b-[var(--radius-lg)]">
                    <span className="text-xs text-muted">Total: {documents.length} documents</span>
                    <button 
                        onClick={() => setShowModal(false)}
                        className="text-xs font-semibold text-primary hover:text-white transition-colors"
                    >
                        Close Library
                    </button>
                </div>
            </div>
        </div>,
        document.body
      )}
    </div>
  );
}
