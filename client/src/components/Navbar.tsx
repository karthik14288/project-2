import React, { useEffect, useState } from 'react';
import { supabase, getCurrentUser, clearDemoUser } from '../lib/supabase.js';
import { Layers, UploadCloud, Cpu, LogOut, Sparkles, GraduationCap, Stethoscope, Sprout } from 'lucide-react';
import { DomainLens } from '../types/index.js';

interface NavbarProps {
  currentRoute: string;
  navigate: (route: string) => void;
  activeLens?: DomainLens;
}

export const Navbar: React.FC<NavbarProps> = ({ currentRoute, navigate, activeLens = 'Education' }) => {
  const [userEmail, setUserEmail] = useState<string>('');

  useEffect(() => {
    async function loadUser() {
      const user = await getCurrentUser();
      if (user?.email) {
        setUserEmail(user.email);
      }
    }
    loadUser();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    clearDemoUser();
    navigate('/');
  };

  const getLensIcon = (lens: DomainLens) => {
    switch (lens) {
      case 'Education':
        return <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />;
      case 'Healthcare':
        return <Stethoscope className="w-3.5 h-3.5 text-rose-400" />;
      case 'Agriculture':
        return <Sprout className="w-3.5 h-3.5 text-emerald-400" />;
    }
  };

  const getLensBadgeClasses = (lens: DomainLens) => {
    switch (lens) {
      case 'Education':
        return 'bg-indigo-950/80 text-indigo-300 border-indigo-700/50 hover:border-indigo-500';
      case 'Healthcare':
        return 'bg-rose-950/80 text-rose-300 border-rose-700/50 hover:border-rose-500';
      case 'Agriculture':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-700/50 hover:border-emerald-500';
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div 
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2.5 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-500 to-purple-500 p-0.5 shadow-lg shadow-brand-500/20 group-hover:shadow-brand-500/40 transition-all duration-300">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-brand-400 group-hover:scale-110 transition-transform duration-200" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent font-['Outfit']">
                UNIFY
              </span>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-400 border border-brand-500/20">
                Cross-Modal
              </span>
            </div>
            <p className="text-[11px] text-slate-400 -mt-0.5 hidden sm:block">Unified Multimodal AI Pipeline</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <button
            id="nav-dashboard"
            onClick={() => navigate('/dashboard')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              currentRoute === '/dashboard'
                ? 'bg-slate-800/90 text-white shadow-sm border border-slate-700'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
            }`}
          >
            <Layers className="w-4 h-4 text-slate-400" />
            <span>Dashboard</span>
          </button>

          <button
            id="nav-ingest"
            onClick={() => navigate('/ingest')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              currentRoute === '/ingest'
                ? 'bg-brand-950/80 text-brand-300 border border-brand-800 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
            }`}
          >
            <UploadCloud className="w-4 h-4 text-brand-400" />
            <span>Ingest</span>
          </button>

          <button
            id="nav-reasoning"
            onClick={() => navigate(`/lens/${activeLens}`)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              currentRoute.startsWith('/lens')
                ? 'bg-slate-800/90 text-white border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
            }`}
          >
            <Cpu className="w-4 h-4 text-indigo-400" />
            <span>Reasoning Studio</span>
          </button>
        </nav>

        {/* Active Domain Lens & User Auth */}
        <div className="flex items-center gap-3">
          {/* Active Lens Pill */}
          <div 
            onClick={() => navigate(`/lens/${activeLens}`)}
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border cursor-pointer transition-all ${getLensBadgeClasses(activeLens)}`}
            title="Click to toggle or use domain reasoning lens"
          >
            {getLensIcon(activeLens)}
            <span>Lens: {activeLens}</span>
          </div>

          {/* User Info & Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <div className="hidden lg:block text-right">
              <p className="text-xs font-medium text-slate-200 truncate max-w-[150px]">{userEmail || 'Active User'}</p>
              <p className="text-[10px] text-emerald-400 flex items-center justify-end gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Connected
              </p>
            </div>

            <button
              id="btn-sign-out"
              onClick={handleSignOut}
              title="Sign Out"
              className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors border border-transparent hover:border-rose-900/40"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
