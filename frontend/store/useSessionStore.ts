import { create } from 'zustand';
import { api } from '../services/api';

export interface TranscriptEntry {
    id: string;
    speaker: string;
    text: string;
    timestamp: string;
}

export interface SessionReport {
    id: string;
    groomName: string;
    brideName: string;
    date: string;
    status: 'pending' | 'ready' | 'active' | 'completed';
    scriptContent?: string;
    aiConfig?: {
        voiceStyle: string;
        strictness: string;
    };
    transcripts: TranscriptEntry[];
}

export interface Session {
    id: string;
    groomName: string;
    brideName: string;
    date: string;
    status: 'pending' | 'ready' | 'active' | 'completed';
    scriptContent?: string;
    sessionCode?: string;  // 6-character code for client join
    aiConfig?: {
        voiceStyle: string;
        strictness: string;
    };
}

interface SessionState {
    sessions: Session[];
    currentSession: Session | null;
    isLoading: boolean;
    error: string | null;

    fetchSessions: () => Promise<void>;
    createSession: (data: Partial<Session>) => Promise<Session>;
    uploadScript: (sessionId: string, file: File) => Promise<void>;
    startSession: (sessionId: string) => Promise<{ groom_token: string; bride_token: string; lawyer_token: string }>;
    fetchReport: (sessionId: string) => Promise<SessionReport>; // New
    setCurrentSession: (session: Session | null) => void;
}

export const useSessionStore = create<SessionState>((set, get) => ({
    sessions: [],
    currentSession: null,
    isLoading: false,
    error: null,

    fetchSessions: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.get('/sessions');
            set({ sessions: response.data, isLoading: false });
        } catch (error) {
            set({ error: 'Failed to fetch sessions', isLoading: false });
            console.error(error);
            throw error;
        }
    },

    createSession: async (data) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.post('/sessions', data);
            const newSession = response.data;
            await get().fetchSessions(); // Refresh list
            set({ isLoading: false });
            return newSession; // Return the created session
        } catch (error) {
            set({ error: 'Failed to create session', isLoading: false });
            throw error;
        }
    },

    uploadScript: async (sessionId, file) => {
        set({ isLoading: true, error: null });
        try {
            const formData = new FormData();
            formData.append('file', file);
            await api.post(`/sessions/${sessionId}/script`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            await get().fetchSessions();
            set({ isLoading: false });
        } catch (error) {
            set({ error: 'Failed to upload script', isLoading: false });
            throw error;
        }
    },

    startSession: async (sessionId) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.post(`/sessions/${sessionId}/start`);
            set({ isLoading: false });
            return response.data;
        } catch (error) {
            set({ error: 'Failed to start session', isLoading: false });
            throw error;
        }
    },

    fetchReport: async (sessionId) => {
        set({ isLoading: true, error: null });
        try {
            const response = await api.get(`/sessions/${sessionId}/report`);
            set({ isLoading: false });
            return response.data;
        } catch (error) {
            set({ error: 'Failed to fetch session report', isLoading: false });
            console.error(error);
            throw error;
        }
    },

    setCurrentSession: (session) => set({ currentSession: session }),
}));