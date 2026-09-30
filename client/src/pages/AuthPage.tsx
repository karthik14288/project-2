import React, { useState } from 'react';
import { supabase, setDemoUser } from '../lib/supabase.js';
import { Sparkles, ArrowRight, ShieldCheck, Mail, Lock, AlertCircle, Cpu, FileCheck } from 'lucide-react';

interface AuthPageProps {
  onAuthSuccess: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);
    setLoading(true);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password
        });

        if (error) throw error;

        if (data.session) {
          onAuthSuccess();
        } else {
          setInfoMsg('Account created! Please check your email to confirm your registration or sign in directly.');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;
        onAuthSuccess();
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setErrorMsg(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    setDemoUser('lead.architect@unify.ai');
    onAuthSuccess();
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center px-4">
        {/* Brand Icon */}
        <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-500 to-purple-500 p-0.5 shadow-xl shadow-brand-500/25 flex items-center justify-center mb-4">
          <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
            <Sparkles className="w-7 h-7 text-brand-400" />
          </div>
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-white font-['Outfit'] sm:text-4xl">
          UNIFY
        </h1>
        <p className="mt-2 text-sm text-slate-400 max-w-sm mx-auto">
          A single unified pipeline ingesting audio, video, scanned PDFs, images, and text into a shared vector reasoning space.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="glass-panel py-8 px-6 sm:px-10 rounded-2xl shadow-2xl border border-slate-800">
          <div className="flex border-b border-slate-800 mb-6">
            <button
              type="button"
              onClick={() => { setIsSignUp(false); setErrorMsg(null); setInfoMsg(null); }}
              className={`flex-1 pb-3 text-sm font-semibold text-center border-b-2 transition-colors ${
                !isSignUp
                  ? 'border-brand-500 text-brand-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsSignUp(true); setErrorMsg(null); setInfoMsg(null); }}
              className={`flex-1 pb-3 text-sm font-semibold text-center border-b-2 transition-colors ${
                isSignUp
                  ? 'border-brand-500 text-brand-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              Create Account
            </button>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-950/70 border border-rose-800 text-xs text-rose-300 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {infoMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-sky-950/70 border border-sky-800 text-xs text-sky-300 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-sky-400" />
              <span>{infoMsg}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Work Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="auth-email-input"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="architect@domain.com"
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="auth-password-input"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all"
                />
              </div>
            </div>

            <button
              id="auth-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-600/25 transition-all cursor-pointer"
            >
              <span>{loading ? 'Authenticating...' : isSignUp ? 'Create Workspace Account' : 'Sign In with Supabase'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Access Divider */}
          <div className="mt-6 pt-6 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-500 mb-3">Want instant testing without registering?</p>
            <button
              id="auth-demo-mode-btn"
              type="button"
              onClick={handleDemoLogin}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-brand-500/50 text-slate-200 text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-brand-400" />
              <span>Launch Instant Demo Workspace</span>
            </button>
          </div>
        </div>

        {/* Technical Highlights Footer */}
        <div className="mt-8 flex items-center justify-center gap-6 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Supabase RLS
          </span>
          <span className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" /> Gemini pgvector
          </span>
          <span className="flex items-center gap-1.5">
            <FileCheck className="w-3.5 h-3.5 text-amber-400" /> Exact Citations
          </span>
        </div>
      </div>
    </div>
  );
};
