import React, { useState } from 'react';
import { CheckCircle, AlertTriangle, FileText, Fingerprint, Award, Download, ArrowLeft, MessageSquare } from 'lucide-react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { SessionReport as SessionReportType } from '../types';

interface SessionReportProps {
  report: SessionReportType;
  onBack: () => void;
  onCertify: () => void;
}

export const SessionReport: React.FC<SessionReportProps> = ({ report, onBack, onCertify }) => {
  const [isCertifying, setIsCertifying] = useState(false);
  const [certifiedLocal, setCertifiedLocal] = useState(report.certified);

  const handleCertify = () => {
    setIsCertifying(true);
    // Simulate API call
    setTimeout(() => {
      setCertifiedLocal(true);
      setIsCertifying(false);
      onCertify();
    }, 2000);
  };

  const getRiskColor = (score: number) => {
    if (score < 20) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (score < 50) return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
    return 'text-red-400 bg-red-500/10 border-red-500/20';
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" onClick={onBack} size="sm" className="pl-0 hover:bg-transparent">
          <ArrowLeft size={16} className="mr-2" /> Back to Dashboard
        </Button>
      </div>
      
      <div className="flex justify-between items-end mb-6">
         <h2 className="text-3xl font-bold text-white tracking-tight">Post-Session Analysis</h2>
         <span className="font-mono text-zinc-500">{report.sessionId}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Analysis & Fraud Check */}
        <div className="space-y-6">
          <Card title="AI Integrity Check" className="border-t-4 border-t-violet-500">
             <div className="space-y-6">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2 text-zinc-300 font-medium">
                     <Fingerprint size={20} className="text-violet-500"/>
                     <span>Identity Confidence</span>
                   </div>
                   <span className="font-mono font-bold text-lg text-white">{report.fraudAnalysis.voiceMatchConfidence}%</span>
                </div>
                
                <div>
                   <div className="flex items-center gap-2 text-zinc-300 font-medium mb-3">
                     <AlertTriangle size={20} className={report.fraudAnalysis.riskScore > 20 ? "text-yellow-500" : "text-emerald-500"}/>
                     <span>Risk Assessment</span>
                   </div>
                   <div className={`p-4 rounded-lg border ${getRiskColor(report.fraudAnalysis.riskScore)}`}>
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider opacity-80">Risk Score</span>
                        <span className="text-2xl font-bold">{report.fraudAnalysis.riskScore}/100</span>
                      </div>
                      <div className="w-full bg-black/20 h-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${report.fraudAnalysis.riskScore < 20 ? 'bg-emerald-500' : 'bg-red-500'}`} 
                          style={{ width: `${report.fraudAnalysis.riskScore}%`}} 
                        />
                      </div>
                   </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">System Notes</h4>
                  <ul className="space-y-3">
                    {report.fraudAnalysis.notes.map((note, idx) => (
                      <li key={idx} className="text-sm text-zinc-400 flex items-start gap-3">
                        <span className="mt-1.5 w-1 h-1 rounded-full bg-violet-500 flex-shrink-0" />
                        {note}
                      </li>
                    ))}
                  </ul>
                </div>
             </div>
          </Card>

          <Card className={`${certifiedLocal ? 'bg-emerald-900/10 border-emerald-500/30' : 'bg-zinc-900/40'}`}>
             <div className="text-center py-4">
                {certifiedLocal ? (
                  <>
                    <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 ring-1 ring-emerald-500/30">
                      <Award size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-emerald-100">Session Certified</h3>
                    <p className="text-sm text-emerald-400/70 mb-6">Digital certificate generated on {new Date().toLocaleDateString()}</p>
                    <Button variant="secondary" className="w-full bg-zinc-900 border-zinc-700 hover:bg-zinc-800">
                      <Download size={16} className="mr-2" /> Download PDF
                    </Button>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-bold text-white mb-2">Pending Certification</h3>
                    <p className="text-sm text-zinc-500 mb-6 leading-relaxed">Review the transcript and risk score before issuing the immutable blockchain certificate.</p>
                    <Button 
                      onClick={handleCertify} 
                      isLoading={isCertifying} 
                      className="w-full bg-violet-600 hover:bg-violet-700 text-white border-none"
                    >
                      <Award size={16} className="mr-2" /> Issue Certificate
                    </Button>
                  </>
                )}
             </div>
          </Card>
        </div>

        {/* Right Col: Transcript */}
        <div className="lg:col-span-2">
          <Card title="Official Transcript Log" className="h-full flex flex-col" noPadding>
             <div className="flex-none p-4 bg-yellow-900/10 border-b border-yellow-500/10">
                <div className="flex items-start gap-3">
                   <AlertTriangle size={16} className="text-yellow-500 mt-0.5" />
                   <span className="text-sm text-yellow-500/80">Please review flagged entries marked in red. The AI has detected potential ambiguity in consent.</span>
                </div>
             </div>
             
             <div className="flex-1 overflow-y-auto max-h-[600px] p-0">
               {report.transcript.map((entry, idx) => (
                 <div key={entry.id} className={`flex gap-4 p-4 border-b border-zinc-800/50 transition hover:bg-zinc-800/20 ${entry.flagged ? 'bg-red-500/5' : ''} ${idx % 2 === 0 ? 'bg-zinc-900/20' : ''}`}>
                    <div className="w-16 flex-shrink-0 text-xs text-zinc-600 font-mono pt-1">
                      {entry.timestamp}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`text-sm font-bold ${
                          entry.role === 'BOT' ? 'text-violet-400' : 
                          entry.role === 'GROOM' ? 'text-blue-400' : 'text-pink-400'
                        }`}>
                          {entry.speaker}
                        </span>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-600 border border-zinc-800 px-1.5 py-0.5 rounded">
                          {entry.role}
                        </span>
                        {entry.flagged && (
                          <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 border border-red-500/20">
                             Ambiguous
                          </span>
                        )}
                      </div>
                      <p className="text-zinc-300 text-sm leading-relaxed font-light">
                        {entry.text}
                      </p>
                    </div>
                 </div>
               ))}
             </div>
             <div className="p-4 border-t border-zinc-800 bg-zinc-900/30 flex justify-end">
               <Button variant="ghost" size="sm" className="text-zinc-500 hover:text-white">
                 <Download size={14} className="mr-2" /> Export Log
               </Button>
             </div>
          </Card>
        </div>

      </div>
    </div>
  );
};