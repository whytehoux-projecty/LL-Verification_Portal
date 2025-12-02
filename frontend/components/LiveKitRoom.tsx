import React, { useState, useEffect, useRef } from 'react';
import {
   LiveKitRoom as LKRoom,
   useTracks,
   useParticipants,
   useRoomContext,
   VideoTrack,
   useLocalParticipant,
   TrackReference,
} from '@livekit/components-react';
import { Track, RoomEvent, DataPacket_Kind, RemoteParticipant, LocalParticipant } from 'livekit-client';
import { Mic, MicOff, Video, VideoOff, PhoneOff, MessageSquare, Bot, ShieldAlert, FileText, ChevronRight, Activity, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/Button';
import { ScriptStep } from '../types';
import { INITIAL_SCRIPT_STEPS } from '../constants';

// --- AI Participant Visualizer Component ---
const AIParticipantTile = ({ participant }: { participant: RemoteParticipant }) => {
   const [bars, setBars] = useState<number[]>(new Array(12).fill(10));
   const [isSpeaking, setIsSpeaking] = useState(false);

   // We can use the isSpeaking property from the participant
   useEffect(() => {
      const interval = setInterval(() => {
         setIsSpeaking(participant.isSpeaking);
      }, 100);
      return () => clearInterval(interval);
   }, [participant]);

   useEffect(() => {
      if (!isSpeaking) {
         setBars(new Array(12).fill(10));
         return;
      }
      // Simple visualizer simulation based on speaking state
      // For real audio analysis, we'd need to attach an AudioContext to the track
      const interval = setInterval(() => {
         setBars(prev => prev.map(() => Math.floor(Math.random() * 80) + 10));
      }, 100);
      return () => clearInterval(interval);
   }, [isSpeaking]);

   return (
      <div className="relative w-full h-full bg-zinc-950 flex flex-col items-center justify-center overflow-hidden border border-zinc-800 rounded-xl group">
         {/* Background Glow */}
         <div className={`absolute w-64 h-64 bg-violet-600/20 rounded-full blur-[100px] transition-all duration-500 ${isSpeaking ? 'opacity-100 scale-110' : 'opacity-30 scale-100'}`} />

         {/* The "Orb" / Equalizer */}
         <div className="relative z-10 flex items-center gap-1.5 h-32">
            {bars.map((height, i) => (
               <div
                  key={i}
                  className="w-2.5 bg-gradient-to-t from-violet-600 to-indigo-400 rounded-full transition-all duration-100 ease-out shadow-[0_0_15px_rgba(124,58,237,0.5)]"
                  style={{ height: `${height}%` }}
               />
            ))}
         </div>

         {/* Status Label */}
         <div className="absolute bottom-6 flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isSpeaking ? 'bg-violet-500 animate-pulse' : 'bg-zinc-600'}`} />
            <span className="text-xs font-mono tracking-widest text-zinc-400 uppercase">
               {isSpeaking ? 'LexNova AI Speaking' : 'Listening...'}
            </span>
         </div>

         <div className="absolute top-4 right-4 text-zinc-600">
            <Bot size={20} />
         </div>
      </div>
   );
};

const ActiveRoom = ({ onLeave }: { onLeave: () => void }) => {
   const room = useRoomContext();
   const participants = useParticipants();
   const { cameraTrack } = useLocalParticipant();

   // Timer state
   const [elapsedTime, setElapsedTime] = useState(0);

   // Filter tracks
   const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare]);

   // Identify AI Agent (assuming identity starts with 'agent' or similar, or we check metadata)
   // For now, let's assume any participant that is NOT local and has no camera is the agent, 
   // or we look for a specific name/identity pattern.
   // Let's assume the agent's identity is 'agent_bot' or similar.
   const aiParticipant = participants.find(p => p.identity.startsWith('agent') || p.name?.includes('AI'));

   // Human participants (excluding local and AI)
   const humanTracks = tracks.filter(t => t.participant.identity !== room.localParticipant.identity && t.participant.identity !== aiParticipant?.identity);

   const [micEnabled, setMicEnabled] = useState(true);
   const [videoEnabled, setVideoEnabled] = useState(true);
   const [transcript, setTranscript] = useState<{ sender: string, text: string }[]>([]);
   const [scriptSteps, setScriptSteps] = useState<ScriptStep[]>(INITIAL_SCRIPT_STEPS);

   // Toggle Media
   const toggleMic = async () => {
      if (micEnabled) {
         await room.localParticipant.setMicrophoneEnabled(false);
         setMicEnabled(false);
      } else {
         await room.localParticipant.setMicrophoneEnabled(true);
         setMicEnabled(true);
      }
   };

   const toggleVideo = async () => {
      if (videoEnabled) {
         await room.localParticipant.setCameraEnabled(false);
         setVideoEnabled(false);
      } else {
         await room.localParticipant.setCameraEnabled(true);
         setVideoEnabled(true);
      }
   };

   // Timer effect
   useEffect(() => {
      const interval = setInterval(() => {
         setElapsedTime(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
   }, []);

   // Format time as HH:MM:SS
   const formatTime = (seconds: number) => {
      const hrs = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
   };

   // Listen for Data Packets (Script Updates & Transcripts)
   useEffect(() => {
      const handleData = (payload: Uint8Array, participant?: RemoteParticipant) => {
         try {
            const str = new TextDecoder().decode(payload);
            const data = JSON.parse(str);

            if (data.type === 'transcript') {
               setTranscript(prev => [...prev, { sender: data.sender || 'Unknown', text: data.text || '' }]);
            } else if (data.type === 'script_update') {
               // Update script steps based on data.stepId
               if (data.stepId) {
                  setScriptSteps(prev => prev.map(step => {
                     if (step.id === data.stepId) return { ...step, status: 'current', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
                     if (parseInt(step.id) < parseInt(data.stepId)) return { ...step, status: 'completed' };
                     return step;
                  }));
               }
            }
         } catch (e) {
            console.error('Failed to parse data packet', e);
         }
      };

      room.on(RoomEvent.DataReceived, handleData);
      return () => {
         room.off(RoomEvent.DataReceived, handleData);
      };
   }, [room]);

   return (
      <div className="flex flex-col h-screen bg-zinc-950 text-zinc-100 overflow-hidden font-sans">

         {/* Top Bar */}
         <header className="flex-none h-16 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md flex justify-between items-center px-6">
            <div className="flex items-center gap-4">
               <div className="flex flex-col">
                  <span className="text-sm font-bold text-zinc-100 tracking-tight flex items-center gap-2">
                     <ShieldAlert size={16} className="text-violet-500" />
                     SECURE SESSION: {room.name}
                  </span>
                  <span className="text-xs text-zinc-500 font-mono">ENCRYPTED • 256-BIT • VERIFIED</span>
               </div>
               <div className="h-6 w-px bg-zinc-800 mx-2"></div>
               <div className="flex items-center gap-2 px-3 py-1 bg-violet-500/10 border border-violet-500/20 rounded-full">
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse"></div>
                  <span className="text-xs font-medium text-violet-300">Live Connection</span>
               </div>
            </div>
            <div>
               {/* Live Timer */}
               <span className="font-mono text-zinc-500 text-sm">{formatTime(elapsedTime)}</span>
            </div>
         </header>

         {/* Main Split Layout */}
         <div className="flex-1 flex overflow-hidden">

            {/* Left: Video Grid */}
            <div className="flex-1 p-4 flex flex-col gap-4">
               {/* AI Tile (Featured) */}
               <div className="flex-[2] min-h-0">
                  {aiParticipant ? (
                     <AIParticipantTile participant={aiParticipant as RemoteParticipant} />
                  ) : (
                     <div className="w-full h-full flex items-center justify-center bg-zinc-900 rounded-xl border border-zinc-800">
                        <div className="text-zinc-500 flex flex-col items-center">
                           <Bot size={48} className="mb-2 opacity-50" />
                           <span>Waiting for AI Agent...</span>
                        </div>
                     </div>
                  )}
               </div>

               {/* Human Participants Row */}
               <div className="flex-1 min-h-0 grid grid-cols-3 gap-4">
                  {humanTracks.map(track => (
                     <div key={track.participant.identity} className="relative bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800">
                        <VideoTrack trackRef={track} className="w-full h-full object-cover" />
                        <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-xs font-medium text-white border border-white/10">
                           {track.participant.name || track.participant.identity}
                        </div>
                     </div>
                  ))}

                  {/* Self View - Local Video */}
                  <div className="relative bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800">
                     {videoEnabled && cameraTrack ? (
                        <VideoTrack
                           trackRef={{
                              participant: room.localParticipant,
                              source: Track.Source.Camera,
                              publication: cameraTrack
                           }}
                           className="w-full h-full object-cover"
                        />
                     ) : (
                        <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                           <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500">You</div>
                        </div>
                     )}
                     <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-xs font-medium text-white border border-white/10">
                        You (Lawyer)
                     </div>
                  </div>
               </div>
            </div>

            {/* Right: God Mode / Supervisor Panel */}
            <div className="w-[400px] border-l border-zinc-800 bg-zinc-900/30 backdrop-blur-sm flex flex-col">

               {/* Script Tracker */}
               <div className="flex-1 flex flex-col min-h-0 border-b border-zinc-800">
                  <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
                     <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                        <FileText size={14} /> Script Progress
                     </h3>
                     <span className="text-xs text-violet-400 font-mono">AUTO-PILOT ACTIVE</span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-2">
                     {scriptSteps.map((step) => (
                        <div
                           key={step.id}
                           className={`relative p-3 rounded-lg border transition-all duration-300 ${step.status === 'current' ? 'bg-violet-900/20 border-violet-500/50 shadow-[0_0_15px_rgba(139,92,246,0.1)] translate-x-1' :
                              step.status === 'completed' ? 'bg-zinc-900/50 border-zinc-800/50 text-zinc-500' :
                                 'bg-transparent border-transparent text-zinc-600'
                              }`}
                        >
                           <div className="flex justify-between items-start">
                              <span className={`text-sm font-medium leading-snug ${step.status === 'current' ? 'text-violet-100' : ''}`}>
                                 {step.label}
                              </span>
                              {step.status === 'current' && (
                                 <Activity size={14} className="text-violet-500 animate-pulse mt-1" />
                              )}
                              {step.status === 'completed' && <CheckCircle2 size={14} className="text-emerald-500/50 mt-1" />}
                           </div>
                        </div>
                     ))}
                  </div>
               </div>

               {/* Live Transcript (Terminal Style) */}
               <div className="h-1/3 bg-black flex flex-col">
                  <div className="p-3 border-b border-zinc-800 flex items-center gap-2 bg-zinc-900/80">
                     <MessageSquare size={12} className="text-zinc-500" />
                     <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Real-time Transcript</span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 space-y-2 font-mono text-xs">
                     {transcript.map((t, i) => (
                        <div key={i} className="flex gap-2 animate-in fade-in slide-in-from-bottom-1 duration-300">
                           <span className={`font-bold shrink-0 ${t.sender === 'AI Officiant' ? 'text-violet-400' : 'text-zinc-400'}`}>
                              {t.sender === 'AI Officiant' ? 'BOT' : t.sender.split(' ')[0].toUpperCase()}:
                           </span>
                           <span className="text-zinc-300">{t.text}</span>
                        </div>
                     ))}
                     {transcript.length === 0 && (
                        <div className="text-zinc-700 italic">Waiting for audio stream...</div>
                     )}
                  </div>
               </div>

            </div>
         </div>

         {/* Bottom Control Bar */}
         <footer className="flex-none h-20 bg-zinc-900/80 backdrop-blur-md border-t border-zinc-800 flex items-center justify-center gap-4 relative z-20">
            <div className="flex items-center gap-4 bg-zinc-950/50 p-2 rounded-2xl border border-zinc-800/50">
               <button
                  onClick={toggleMic}
                  className={`p-3 rounded-xl transition-all ${micEnabled ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white' : 'bg-red-500/20 text-red-500 border border-red-500/50'}`}
               >
                  {micEnabled ? <Mic size={20} /> : <MicOff size={20} />}
               </button>
               <button
                  onClick={toggleVideo}
                  className={`p-3 rounded-xl transition-all ${videoEnabled ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white' : 'bg-red-500/20 text-red-500 border border-red-500/50'}`}
               >
                  {videoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
               </button>
            </div>

            <div className="h-8 w-px bg-zinc-800 mx-4"></div>

            <Button
               onClick={onLeave}
               variant="danger"
               className="px-6 bg-red-600 text-white hover:bg-red-700 border-none shadow-[0_0_20px_rgba(220,38,38,0.3)]"
            >
               <PhoneOff size={18} className="mr-2" /> End Session
            </Button>
         </footer>
      </div>
   );
};

interface LiveKitRoomProps {
   token: string;
   onLeave?: () => void;
}

export const LiveKitRoom: React.FC<LiveKitRoomProps> = ({ token, onLeave }) => {
   const serverUrl = import.meta.env.VITE_LIVEKIT_URL || 'ws://localhost:7880';

   if (!token) {
      return <div className="flex items-center justify-center h-screen text-red-500">Error: Missing Token</div>;
   }

   return (
      <LKRoom
         token={token}
         serverUrl={serverUrl}
         connect={true}
         video={true}
         audio={true}
         onDisconnected={onLeave}
         data-lk-theme="default"
      >
         <ActiveRoom onLeave={onLeave || (() => { })} />
      </LKRoom>
   );
};