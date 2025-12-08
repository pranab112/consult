
import React, { useState } from 'react';
import { Mail, Lock, Building, ArrowRight, Loader2, Globe } from 'lucide-react';
import { login, registerAgency } from '../../services/authService';

interface LoginPageProps {
    onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [agencyName, setAgencyName] = useState('');
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (mode === 'login') {
                const user = await login(email, password);
                if (user) {
                    onLoginSuccess();
                } else {
                    setError('Invalid credentials. For demo, use "admin@demo.com"');
                }
            } else {
                await registerAgency(fullName, email, agencyName);
                onLoginSuccess();
            }
        } catch (err: any) {
            setError(err.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="mb-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl shadow-lg mb-4">
                    <Globe className="text-white w-8 h-8" />
                </div>
                <h1 className="text-3xl font-bold text-slate-900">StudyAbroad Genius</h1>
                <p className="text-slate-500 mt-2">Agency CRM & Intelligence Platform</p>
            </div>

            <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                <div className="flex border-b border-slate-100">
                    <button 
                        onClick={() => setMode('login')}
                        className={`flex-1 py-4 text-sm font-bold transition-colors ${mode === 'login' ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'bg-slate-50 text-slate-500 hover:text-slate-700'}`}
                    >
                        Sign In
                    </button>
                    <button 
                        onClick={() => setMode('register')}
                        className={`flex-1 py-4 text-sm font-bold transition-colors ${mode === 'register' ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'bg-slate-50 text-slate-500 hover:text-slate-700'}`}
                    >
                        New Agency
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-5">
                    {mode === 'register' && (
                        <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                             <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label>
                                <input 
                                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                                    placeholder="John Doe"
                                    value={fullName}
                                    onChange={e => setFullName(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Agency Name</label>
                                <div className="relative">
                                    <Building className="absolute left-3 top-3 text-slate-400" size={18}/>
                                    <input 
                                        className="w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                                        placeholder="Global Education..."
                                        value={agencyName}
                                        onChange={e => setAgencyName(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 text-slate-400" size={18}/>
                            <input 
                                type="email"
                                className="w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                                placeholder="name@company.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 text-slate-400" size={18}/>
                            <input 
                                type="password"
                                className="w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                                placeholder="••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-start">
                             <div className="w-1 h-4 bg-red-500 rounded-full mr-2 mt-0.5"></div>
                             {error}
                        </div>
                    )}

                    <button 
                        type="submit"
                        disabled={loading}
                        className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold hover:bg-indigo-600 transition-all shadow-lg shadow-slate-200 flex items-center justify-center"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : (
                            <>
                                <span>{mode === 'login' ? 'Access Portal' : 'Create Agency Account'}</span>
                                <ArrowRight size={18} className="ml-2" />
                            </>
                        )}
                    </button>
                    
                    {mode === 'login' && (
                        <div className="text-center text-xs text-slate-400 mt-4">
                            <p>Demo Admin: admin@demo.com</p>
                            <p>Demo Staff: staff@demo.com</p>
                        </div>
                    )}
                </form>
            </div>
            
            <div className="mt-8 text-center text-xs text-slate-400">
                <p>© 2024 StudyAbroad Genius. Secure Cloud Platform.</p>
            </div>
        </div>
    );
};
