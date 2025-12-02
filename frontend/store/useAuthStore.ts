import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { jwtDecode } from 'jwt-decode';
import { api } from '../services/api';

interface User {
    id: string;
    email: string;
    name: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    register: (email: string, password: string, name: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            isAuthenticated: false,

            login: async (email, password) => {
                try {
                    const response = await api.post('/auth/login', { email, password });
                    const { access_token } = response.data;

                    // Decode token to get user info (or fetch from /me)
                    // For now, we'll fetch from /me to be sure
                    localStorage.setItem('auth_token', access_token); // Set for immediate use by api interceptor

                    const userResponse = await api.get('/auth/me');

                    set({
                        token: access_token,
                        user: userResponse.data,
                        isAuthenticated: true,
                    });
                } catch (error) {
                    console.error('Login failed:', error);
                    throw error;
                }
            },

            register: async (email, password, name) => {
                try {
                    await api.post('/auth/register', { email, password, name });
                    // Auto login after register? Or redirect to login.
                    // For now just success.
                } catch (error) {
                    console.error('Registration failed:', error);
                    throw error;
                }
            },

            logout: () => {
                localStorage.removeItem('auth_token');
                set({ user: null, token: null, isAuthenticated: false });
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({ token: state.token, user: state.user, isAuthenticated: state.isAuthenticated }),
        }
    )
);
