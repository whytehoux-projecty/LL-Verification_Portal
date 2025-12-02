import { Session, SessionStatus, ScriptStep, SessionReport } from './types';

// In a real app, this key comes from process.env.API_KEY and is handled securely.
export const GEMINI_API_KEY_PLACEHOLDER = process.env.API_KEY || '';

export const MOCK_SESSIONS: Session[] = [
  {
    id: 'sess_12345',
    groomName: 'Arthur Dent',
    brideName: 'Tricia McMillan',
    date: '2023-10-24 14:00',
    status: SessionStatus.PENDING,
  },
  {
    id: 'sess_67890',
    groomName: 'Harry Potter',
    brideName: 'Ginny Weasley',
    date: '2023-10-25 09:30',
    status: SessionStatus.READY,
    scriptContent: 'Do you take this person...',
    aiConfig: { voiceStyle: 'warm', strictness: 'low' }
  },
  {
    id: 'sess_11223',
    groomName: 'Han Solo',
    brideName: 'Leia Organa',
    date: '2023-10-26 11:00',
    status: SessionStatus.COMPLETED,
  }
];

export const MOCK_SCRIPT_CONTENT = `
1. Introduction
2. Ask Groom: Do you take this woman to be your lawfully wedded wife?
3. Ask Bride: Do you take this man to be your lawfully wedded husband?
4. Confirmation of signatures.
5. Closing statement.
`;

export const INITIAL_SCRIPT_STEPS: ScriptStep[] = [
  { id: '1', label: '1. Introduction & Protocol Check', status: 'pending' },
  { id: '2', label: '2. Verify Groom Identity', status: 'pending' },
  { id: '3', label: '3. Verify Bride Identity', status: 'pending' },
  { id: '4', label: '4. Groom Consent (Vows)', status: 'pending' },
  { id: '5', label: '5. Bride Consent (Vows)', status: 'pending' },
  { id: '6', label: '6. Final Pronouncement', status: 'pending' },
];

export const MOCK_SESSION_REPORT: SessionReport = {
  sessionId: 'sess_11223',
  duration: '14m 32s',
  certified: false,
  fraudAnalysis: {
    riskScore: 12,
    voiceMatchConfidence: 98,
    coercionDetected: false,
    notes: [
      "Voice biometrics matched ID records for both parties.",
      "No hesitation detected during consent phase.",
      "Background noise levels within acceptable limits."
    ]
  },
  transcript: [
    { id: '1', timestamp: '11:00:15', speaker: 'VeriBot', role: 'BOT', text: 'State your name for the record.' },
    { id: '2', timestamp: '11:00:22', speaker: 'Han Solo', role: 'GROOM', text: 'Han Solo.' },
    { id: '3', timestamp: '11:00:25', speaker: 'VeriBot', role: 'BOT', text: 'Identity verified. Leia Organa, state your name.' },
    { id: '4', timestamp: '11:00:32', speaker: 'Leia Organa', role: 'BRIDE', text: 'Leia Organa.' },
    { id: '5', timestamp: '11:05:10', speaker: 'VeriBot', role: 'BOT', text: 'Do you take this man to be your husband?' },
    { id: '6', timestamp: '11:05:15', speaker: 'Leia Organa', role: 'BRIDE', text: 'I do.', flagged: false },
    { id: '7', timestamp: '11:05:20', speaker: 'VeriBot', role: 'BOT', text: 'Do you take this woman to be your wife?' },
    { id: '8', timestamp: '11:05:25', speaker: 'Han Solo', role: 'GROOM', text: 'I know. I mean, I do.', flagged: true }, // Joke reference flagged
  ]
};