import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Logo } from '../components/Logo';
import { api } from '../services/api';
import { sanitizeInput } from '../utils/sanitize';

export const ClientLogin: React.FC = () => {
  const navigate = useNavigate();
  const [sessionCode, setSessionCode] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'groom' | 'bride'>('groom');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!sessionCode.trim() || !name.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Sanitize inputs
      const sanitizedName = sanitizeInput(name);
      const sanitizedCode = sanitizeInput(sessionCode);

      // Call backend API to join session
      const response = await api.post('/client/join', {
        session_code: sanitizedCode.toUpperCase(),
        participant_name: sanitizedName,
        participant_type: role
      });

      const { token } = response.data;

      // Navigate to LiveKit room with token
      navigate(`/room/${token}`);
    } catch (err: any) {
      console.error('Failed to join session:', err);
      setError(
        err.response?.data?.detail ||
        'Failed to join session. Please check your session code and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Format session code as user types (ABC123 -> ABC-123)
  const handleCodeChange = (value: string) => {
    const cleaned = value.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    setSessionCode(cleaned.slice(0, 6));
  };

  const formattedCode = sessionCode.length > 3
    ? `${sessionCode.slice(0, 3)}-${sessionCode.slice(3)}`
    : sessionCode;

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        <div className="text-center flex flex-col items-center">
          {/* Logo Component */}
          <div className="mb-8">
            <Logo iconClassName="h-16 w-16" textClassName="text-4xl" />
          </div>

          <h2 className="text-2xl font-bold text-white">Join Session</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Enter the session code provided by your lawyer
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-xl p-6 shadow-xl space-y-4">

            {/* Session Code Input */}
            <div>
              <label htmlFor="session-code" className="block text-xs font-medium text-zinc-500 uppercase mb-1">
                Session Code*
              </label>
              <input
                id="session-code"
                type="text"
                required
                maxLength={7}
                className="block w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all text-center text-lg font-mono tracking-widest"
                placeholder="ABC-123"
                value={formattedCode}
                onChange={e => handleCodeChange(e.target.value)}
                disabled={isLoading}
              />
              <p className="mt-1 text-xs text-zinc-600">
                6-character code from your lawyer
              </p>
            </div>

            {/* Full Name Input */}
            <div>
              <label htmlFor="full-name" className="block text-xs font-medium text-zinc-500 uppercase mb-1">
                Full Legal Name*
              </label>
              <input
                id="full-name"
                type="text"
                required
                className="block w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                placeholder="As it appears on legal documents"
                value={name}
                onChange={e => setName(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {/* Role Selection */}
            <div>
              <label htmlFor="role" className="block text-xs font-medium text-zinc-500 uppercase mb-1">
                I am the...*
              </label>
              <select
                id="role"
                className="block w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                value={role}
                onChange={e => setRole(e.target.value as 'groom' | 'bride')}
                disabled={isLoading}
              >
                <option value="groom">Groom</option>
                <option value="bride">Bride</option>
              </select>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-red-400">{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <Button
                type="submit"
                className="w-full bg-violet-600 hover:bg-violet-700 text-white border-none py-3 text-base shadow-lg shadow-violet-900/20"
                disabled={isLoading || !sessionCode || !name}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="mr-2 animate-spin" />
                    Joining Session...
                  </>
                ) : (
                  <>
                    Join Secure Session <ArrowRight size={18} className="ml-2 opacity-80" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>

        <p className="text-center text-xs text-zinc-600">
          By joining, you consent to AI-assisted audio recording for legal verification purposes.
        </p>
      </div>
    </div>
  );
};