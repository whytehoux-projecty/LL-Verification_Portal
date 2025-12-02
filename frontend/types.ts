export enum UserRole {
  LAWYER = 'LAWYER',
  GROOM = 'GROOM',
  BRIDE = 'BRIDE',
  OBSERVER = 'OBSERVER'
}

export enum SessionStatus {
  PENDING = 'pending',
  READY = 'ready',
  ACTIVE = 'active',
  COMPLETED = 'completed'
}

export interface ScriptAnalysis {
  tone: string;
  questionCount: number;
  complexity: 'Low' | 'Medium' | 'High';
  summary: string;
}

export interface AIConfig {
  voiceStyle: 'warm' | 'authoritative' | 'neutral';
  strictness: 'low' | 'high'; // low = conversational, high = strict legal adherence
}

export interface ScriptStep {
  id: string;
  label: string;
  status: 'pending' | 'current' | 'completed' | 'skipped';
  timestamp?: string;
}

export interface TranscriptEntry {
  id: string;
  timestamp: string;
  speaker: string;
  role: string;
  text: string;
  flagged?: boolean; // If AI flagged this response as ambiguous
}

export interface FraudAnalysis {
  riskScore: number; // 0-100, where 100 is high risk
  voiceMatchConfidence: number; // 0-100
  coercionDetected: boolean;
  notes: string[];
}

export interface SessionReport {
  sessionId: string;
  duration: string;
  transcript: TranscriptEntry[];
  fraudAnalysis: FraudAnalysis;
  certified: boolean;
  certificationDate?: string;
}

export interface Session {
  id: string;
  groomName: string;
  brideName: string;
  date: string;
  status: SessionStatus;
  scriptContent?: string;
  scriptAnalysis?: ScriptAnalysis;
  aiConfig?: AIConfig;
}

export interface Participant {
  id: string;
  name: string;
  role: UserRole;
  isMuted: boolean;
  isVideoEnabled: boolean;
  isSpeaking: boolean;
}