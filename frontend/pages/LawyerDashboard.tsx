import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, Play, Plus, Calendar, Search, X, CheckCircle2, BrainCircuit, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { SessionReport } from '../components/SessionReport';
import { MOCK_SCRIPT_CONTENT, MOCK_SESSION_REPORT } from '../constants';
import { SessionStatus, ScriptAnalysis, AIConfig } from '../types';
import { analyzeScript } from '../services/geminiService';
import { useSessionStore } from '../store/useSessionStore';

export const LawyerDashboard: React.FC = () => {
   const navigate = useNavigate();
   const { sessions, fetchSessions, createSession, uploadScript, startSession, isLoading: storeLoading } = useSessionStore();

   const [isCreating, setIsCreating] = useState(false);
   const [newSessionData, setNewSessionData] = useState({ groom: '', bride: '', date: '' });
   const [uploadedFile, setUploadedFile] = useState<File | null>(null);
   const [isAnalyzing, setIsAnalyzing] = useState(false);
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [analysis, setAnalysis] = useState<ScriptAnalysis | null>(null);
   const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
   const [error, setError] = useState<string | null>(null);
   const [searchQuery, setSearchQuery] = useState('');
   const [isRetrying, setIsRetrying] = useState(false);

   const [aiConfig, setAiConfig] = useState<AIConfig>({
      voiceStyle: 'warm',
      strictness: 'high'
   });

   useEffect(() => {
      fetchSessions().catch(err => {
         console.error('Failed to fetch sessions:', err);
         setError('Failed to load sessions. Please refresh the page.');
      });
   }, []); // Empty dependency array - only fetch on mount

   // Keyboard shortcuts
   useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
         if (e.key === 'Escape' && isCreating) {
            handleCloseModal();
         }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
   }, [isCreating, newSessionData, uploadedFile]);

   const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
         const file = e.target.files[0];
         // Validate file type and size (max 10MB)
         if (file.size > 10 * 1024 * 1024) {
            setError('File too large. Maximum size is 10MB.');
            return;
         }
         setUploadedFile(file);
         setAnalysis(null);
      }
   };

   const runAnalysis = async () => {
      if (!uploadedFile) return;
      setIsAnalyzing(true);
      try {
         const textToAnalyze = MOCK_SCRIPT_CONTENT;
         const result = await analyzeScript(textToAnalyze);
         setAnalysis(result);
      } catch (err) {
         console.error(err);
         setError("AI Analysis failed. Please try again.");
      } finally {
         setIsAnalyzing(false);
      }
   };

   const validateInputs = (): boolean => {
      if (!newSessionData.groom.trim()) {
         setError("Groom's name is required");
         return false;
      }
      if (!newSessionData.bride.trim()) {
         setError("Bride's name is required");
         return false;
      }
      if (newSessionData.groom.length < 2 || newSessionData.bride.length < 2) {
         setError("Names must be at least 2 characters long");
         return false;
      }
      return true;
   };

   const handleCreateSession = async () => {
      if (!validateInputs()) return;

      setIsSubmitting(true);
      setError(null);
      try {
         // 1. Create Session
         const newSession = await createSession({
            groomName: newSessionData.groom.trim(),
            brideName: newSessionData.bride.trim(),
            date: newSessionData.date || new Date().toISOString(),
            aiConfig: aiConfig
         });

         // 2. Upload Script if file exists
         if (newSession && newSession.id && uploadedFile) {
            try {
               await uploadScript(newSession.id, uploadedFile);
            } catch (uploadError) {
               console.error("Failed to upload script", uploadError);
               setError("Session created but script upload failed. You can upload it later.");
               // Don't return - still close the modal after a delay
               setTimeout(() => {
                  resetFormAndClose();
               }, 3000);
               return;
            }
         }

         // Success - reset and close
         resetFormAndClose();
      } catch (error) {
         console.error("Failed to create session", error);
         setError("Failed to create session. Please try again.");
      } finally {
         setIsSubmitting(false);
      }
   };

   const resetFormAndClose = () => {
      setIsCreating(false);
      setNewSessionData({ groom: '', bride: '', date: '' });
      setUploadedFile(null);
      setAnalysis(null);
      setError(null);
   };

   const handleCloseModal = () => {
      const hasUnsavedData = newSessionData.groom || newSessionData.bride || uploadedFile;
      if (hasUnsavedData) {
         if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
            resetFormAndClose();
         }
      } else {
         resetFormAndClose();
      }
   };

   const handleStartClick = async (sessionId: string) => {
      try {
         const { lawyer_token } = await startSession(sessionId);
         // Navigate to room with token
         navigate(`/room/${lawyer_token}`);
      } catch (error) {
         console.error("Failed to start session", error);
         setError("Could not start session. Please try again.");
      }
   };

   const handleRetry = async () => {
      setIsRetrying(true);
      setError(null);
      try {
         await fetchSessions();
      } catch (err) {
         console.error(err);
         setError('Failed to load sessions. Please try again.');
      } finally {
         setIsRetrying(false);
      }
   };

   // Filter sessions by search query
   const filteredSessions = sessions.filter(session => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
         session.groomName.toLowerCase().includes(query) ||
         session.brideName.toLowerCase().includes(query) ||
         session.id.toLowerCase().includes(query)
      );
   });

   // Format date for display
   const formatDate = (dateStr: string) => {
      try {
         const date = new Date(dateStr);
         return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
         });
      } catch {
         return dateStr;
      }
   };

   if (selectedReportId) {
      const reportData = { ...MOCK_SESSION_REPORT, sessionId: selectedReportId };
      return (
         <div className="max-w-7xl mx-auto px-6 py-8">
            <SessionReport
               report={reportData}
               onBack={() => setSelectedReportId(null)}
               onCertify={() => {
                  setSelectedReportId(null);
               }}
            />
         </div>
      );
   }

   return (
      <div className="max-w-[1400px] mx-auto px-6 py-12">

         {/* Header */}
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div>
               <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard</h1>
               <p className="mt-2 text-zinc-400">Manage your AI verification sessions and legal scripts.</p>
            </div>
            <div className="flex items-center gap-3">
               <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                  <input
                     type="text"
                     placeholder="Search clients..."
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     className="bg-zinc-900 border border-zinc-800 text-sm rounded-lg pl-10 pr-4 py-2 text-zinc-200 placeholder-zinc-600 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none w-64 transition-all"
                     aria-label="Search sessions"
                  />
               </div>
               <Button onClick={() => setIsCreating(true)} className="bg-violet-600 hover:bg-violet-700 text-white border-none shadow-[0_0_15px_rgba(139,92,246,0.3)]">
                  <Plus size={18} className="mr-2" /> New Session
               </Button>
            </div>
         </div>

         {/* Creation Drawer / Modal */}
         {isCreating && (
            <div className="fixed inset-0 z-50 flex justify-end">
               <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleCloseModal} />
               <div className="relative w-full max-w-lg bg-zinc-950 h-full border-l border-zinc-800 shadow-2xl p-6 overflow-y-auto animate-in slide-in-from-right duration-300">
                  <div className="flex justify-between items-center mb-8">
                     <h2 className="text-xl font-bold text-white">New Verification Session</h2>
                     <button
                        onClick={handleCloseModal}
                        className="text-zinc-500 hover:text-white transition-colors"
                        aria-label="Close modal"
                     >
                        <X size={24} />
                     </button>
                  </div>

                  <div className="space-y-8">
                     <div className="space-y-4">
                        <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Client Information</h3>
                        <div className="space-y-3">
                           <div>
                              <label htmlFor="groom-name" className="block text-xs font-medium text-zinc-500 mb-1">Groom's Full Name*</label>
                              <input
                                 id="groom-name"
                                 type="text"
                                 className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-zinc-100 focus:border-violet-500 outline-none transition-colors"
                                 placeholder="e.g. John Doe"
                                 value={newSessionData.groom}
                                 onChange={e => setNewSessionData({ ...newSessionData, groom: e.target.value })}
                                 required
                              />
                           </div>
                           <div>
                              <label htmlFor="bride-name" className="block text-xs font-medium text-zinc-500 mb-1">Bride's Full Name*</label>
                              <input
                                 id="bride-name"
                                 type="text"
                                 className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-zinc-100 focus:border-violet-500 outline-none transition-colors"
                                 placeholder="e.g. Jane Smith"
                                 value={newSessionData.bride}
                                 onChange={e => setNewSessionData({ ...newSessionData, bride: e.target.value })}
                                 required
                              />
                           </div>
                           <div>
                              <label htmlFor="schedule-date" className="block text-xs font-medium text-zinc-500 mb-1">Schedule Date</label>
                              <input
                                 id="schedule-date"
                                 type="datetime-local"
                                 className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-zinc-100 focus:border-violet-500 outline-none transition-colors"
                                 value={newSessionData.date}
                                 onChange={e => setNewSessionData({ ...newSessionData, date: e.target.value })}
                              />
                           </div>
                        </div>
                     </div>

                     <div className="space-y-4">
                        <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">AI Configuration</h3>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800">
                              <label htmlFor="voice-style" className="block text-xs text-zinc-500 mb-2">Voice Style</label>
                              <select
                                 id="voice-style"
                                 className="w-full bg-transparent text-sm text-zinc-200 outline-none"
                                 value={aiConfig.voiceStyle}
                                 onChange={(e) => setAiConfig({ ...aiConfig, voiceStyle: e.target.value as 'warm' | 'authoritative' })}
                                 aria-label="Voice Style"
                              >
                                 <option value="warm">Warm & Professional</option>
                                 <option value="authoritative">Legal & Strict</option>
                              </select>
                           </div>
                           <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800">
                              <label htmlFor="strictness" className="block text-xs text-zinc-500 mb-2">Strictness</label>
                              <select
                                 id="strictness"
                                 className="w-full bg-transparent text-sm text-zinc-200 outline-none"
                                 value={aiConfig.strictness}
                                 onChange={(e) => setAiConfig({ ...aiConfig, strictness: e.target.value as 'high' | 'low' })}
                                 aria-label="Strictness Level"
                              >
                                 <option value="high">High (Exact Match)</option>
                                 <option value="low">Low (Conversational)</option>
                              </select>
                           </div>
                        </div>
                     </div>

                     <div className="space-y-4">
                        <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Script Upload</h3>
                        <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${uploadedFile ? 'border-violet-500 bg-violet-500/5' : 'border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900'}`}>
                           <input
                              type="file"
                              id="script-upload"
                              className="hidden"
                              accept=".pdf,.json,.txt"
                              onChange={handleFileUpload}
                           />
                           {!uploadedFile ? (
                              <label htmlFor="script-upload" className="cursor-pointer flex flex-col items-center">
                                 <Upload className="text-zinc-500 mb-3" size={32} />
                                 <span className="text-sm font-medium text-zinc-300">Drag & drop or click to upload PDF</span>
                                 <span className="text-xs text-zinc-500 mt-1">Supports PDF, JSON (Max 10MB)</span>
                              </label>
                           ) : (
                              <div className="flex flex-col items-center">
                                 <FileText className="text-violet-500 mb-2" size={32} />
                                 <span className="text-sm font-medium text-zinc-200">{uploadedFile.name}</span>
                                 <div className="flex gap-2 mt-3">
                                    <Button
                                       size="sm"
                                       variant="ghost"
                                       onClick={runAnalysis}
                                       isLoading={isAnalyzing}
                                       className="text-violet-400 hover:text-violet-300"
                                    >
                                       <BrainCircuit size={14} className="mr-1" /> Analyze
                                    </Button>
                                    <Button
                                       size="sm"
                                       variant="ghost"
                                       onClick={() => setUploadedFile(null)}
                                       className="text-red-400 hover:text-red-300"
                                    >
                                       <X size={14} className="mr-1" /> Remove
                                    </Button>
                                 </div>
                              </div>
                           )}
                        </div>
                        {analysis && (
                           <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-800 text-sm">
                              <div className="flex items-center gap-2 mb-2 text-violet-400 font-medium">
                                 <CheckCircle2 size={16} /> Analysis Complete
                              </div>
                              <div className="grid grid-cols-2 gap-y-2 text-zinc-400">
                                 <span>Tone: <span className="text-zinc-200">{analysis.tone}</span></span>
                                 <span>Complexity: <span className="text-zinc-200">{analysis.complexity}</span></span>
                                 <span className="col-span-2">Summary: <span className="text-zinc-200">{analysis.summary}</span></span>
                              </div>
                           </div>
                        )}
                     </div>
                  </div>

                  {error && (
                     <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400 mt-8 flex items-start gap-2">
                        <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                        <span>{error}</span>
                     </div>
                  )}

                  <div className="mt-8 pt-6 border-t border-zinc-800">
                     <Button
                        onClick={handleCreateSession}
                        className="w-full bg-violet-600 hover:bg-violet-700 text-white"
                        disabled={!newSessionData.groom || !newSessionData.bride || isSubmitting}
                        isLoading={isSubmitting}
                     >
                        Create Session
                     </Button>
                  </div>
               </div>
            </div>
         )}

         {/* Session Table */}
         <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl overflow-hidden backdrop-blur-sm">
            <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-zinc-800 text-xs font-medium text-zinc-500 uppercase tracking-wider">
               <div className="col-span-4">Clients</div>
               <div className="col-span-3">Status</div>
               <div className="col-span-3">Scheduled</div>
               <div className="col-span-2 text-right">Actions</div>
            </div>

            {error && !isCreating && (
               <div className="p-8 text-center">
                  <div className="text-red-400 mb-2">{error}</div>
                  <button
                     onClick={handleRetry}
                     disabled={isRetrying}
                     className="text-sm text-violet-400 hover:text-violet-300 underline disabled:opacity-50"
                     aria-label="Retry loading sessions"
                  >
                     {isRetrying ? 'Retrying...' : 'Retry'}
                  </button>
               </div>
            )}
            {!error && storeLoading && sessions.length === 0 ? (
               <div className="p-8 text-center text-zinc-500">Loading sessions...</div>
            ) : !error && filteredSessions.length === 0 && searchQuery ? (
               <div className="p-8 text-center text-zinc-500">No sessions found matching "{searchQuery}"</div>
            ) : !error && sessions.length === 0 ? (
               <div className="p-8 text-center text-zinc-500">No sessions found. Create one to get started.</div>
            ) : !error ? (
               <div className="divide-y divide-zinc-800/50">
                  {filteredSessions.map((session) => (
                     <div key={session.id} className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-zinc-800/30 transition-colors group">
                        <div className="col-span-4">
                           <div className="font-medium text-zinc-200">{session.groomName} & {session.brideName}</div>
                           <div className="text-xs text-zinc-500 mt-0.5">ID: {session.id}</div>
                        </div>
                        <div className="col-span-3">
                           <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${session.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                              session.status === 'completed' ? 'bg-zinc-800 text-zinc-400 border-zinc-700' :
                                 session.status === 'ready' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                    'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                              }`}>
                              {session.status === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                              {session.status}
                           </span>
                        </div>
                        <div className="col-span-3 text-sm text-zinc-400 flex items-center gap-2">
                           <Calendar size={14} className="text-zinc-600" />
                           {formatDate(session.date)}
                        </div>
                        <div className="col-span-2 flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                           {session.status === 'ready' && (
                              <Button size="sm" onClick={() => handleStartClick(session.id)} className="h-8 text-xs bg-violet-600 text-white hover:bg-violet-700 border-none">
                                 <Play size={12} className="mr-1.5" /> Start
                              </Button>
                           )}
                           {session.status === 'active' && (
                              <Button size="sm" onClick={() => handleStartClick(session.id)} variant="glass" className="h-8 text-xs text-emerald-400 border-emerald-500/30">
                                 Join
                              </Button>
                           )}
                           {session.status === 'completed' && (
                              <Button size="sm" onClick={() => setSelectedReportId(session.id)} variant="secondary" className="h-8 text-xs">
                                 Report
                              </Button>
                           )}
                           {session.status === 'pending' && (
                              <span className="text-xs text-zinc-500 italic py-1.5">Missing Script</span>
                           )}
                        </div>
                     </div>
                  ))}
               </div>
            ) : null}
         </div>
      </div>
   );
};
