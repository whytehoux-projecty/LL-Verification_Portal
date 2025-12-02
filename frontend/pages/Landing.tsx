import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Logo } from '../components/Logo';

export const Landing = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-zinc-950 flex flex-col relative overflow-hidden">
            {/* Geometric Background */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-zinc-700 to-transparent opacity-50"></div>
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>

            {/* Gradient Blobs */}
            <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-violet-600/20 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[20%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px]" />

            {/* Landing Header */}
            <header className="absolute top-0 left-0 w-full p-6 z-20">
                <div className="max-w-[1400px] mx-auto flex items-center gap-3">
                    <Logo iconClassName="h-10 w-10" textClassName="text-2xl" />
                </div>
            </header>

            <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 pt-20">
                <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">

                    {/* Left: Text */}
                    <div className="space-y-8">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-medium text-zinc-400">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            System Operational
                        </div>
                        <div>
                            <h1 className="text-5xl md:text-6xl font-bold text-white tracking-tight leading-[1.1]">
                                The Future of <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-blue-400">Digital Notary</span>
                            </h1>
                            <p className="mt-6 text-lg text-zinc-400 leading-relaxed max-w-md">
                                LexNova Legal combines biometrics, real-time voice analysis, and automated legal scripting to verify marriages securely remotely.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <Button
                                onClick={() => navigate('/login')}
                                className="bg-white text-zinc-950 hover:bg-zinc-200 py-4 px-8 text-lg font-semibold"
                            >
                                Legal Professional Login
                            </Button>
                            <Button
                                onClick={() => navigate('/client-login')}
                                variant="secondary"
                                className="py-4 px-8 text-lg bg-zinc-900 border-zinc-700"
                            >
                                Client Portal <ArrowRight className="ml-2" size={18} />
                            </Button>
                        </div>
                    </div>

                    {/* Right: Visual */}
                    <div className="relative">
                        <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6 shadow-2xl relative z-10 rotate-3 transition-transform hover:rotate-0 duration-500">
                            <div className="flex items-center gap-4 mb-6 border-b border-zinc-800 pb-4">
                                <div className="w-12 h-12 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-400">
                                    <ShieldCheck size={24} />
                                </div>
                                <div>
                                    <div className="text-lg font-bold text-white">Verification Active</div>
                                    <div className="text-xs text-zinc-500">Session ID: 884-921-XJ</div>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="h-2 bg-zinc-800 rounded-full w-3/4"></div>
                                <div className="h-2 bg-zinc-800 rounded-full w-1/2"></div>
                                <div className="h-2 bg-zinc-800 rounded-full w-full"></div>
                            </div>
                            <div className="mt-6 flex gap-2">
                                <div className="flex-1 h-24 bg-zinc-950 rounded-lg border border-zinc-800 flex items-center justify-center">
                                    <div className="flex gap-1 items-center h-8">
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <div key={i} className="w-1 bg-violet-500 rounded-full animate-[pulse_1s_ease-in-out_infinite]" style={{ height: `${Math.random() * 100}%`, animationDelay: `${i * 0.1}s` }}></div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Decorative element behind */}
                        <div className="absolute top-4 right-4 w-full h-full border border-zinc-800 rounded-2xl -z-10 bg-zinc-900/30"></div>
                    </div>

                </div>
            </div>

            <footer className="p-6 text-center text-xs text-zinc-600">
                &copy; 2024 LexNova Legal Systems Inc. • 256-bit Encryption Active
            </footer>
        </div>
    );
};
