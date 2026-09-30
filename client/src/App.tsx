import React, { useState, useEffect } from 'react';
import { DomainLens } from './types/index.js';
import { getCurrentUser } from './lib/supabase.js';
import { AuthPage } from './pages/AuthPage.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { IngestPage } from './pages/IngestPage.js';
import { LensPage } from './pages/LensPage.js';

export function App() {
  const [currentRoute, setCurrentRoute] = useState<string>(window.location.pathname || '/');
  const [activeLens, setActiveLens] = useState<DomainLens>('Education');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Sync route on popstate (browser back/forward)
  useEffect(() => {
    const handlePopState = () => {
      setCurrentRoute(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Check Supabase session on startup
  useEffect(() => {
    async function verifySession() {
      const user = await getCurrentUser();
      setIsAuthenticated(!!user);
      if (user && (window.location.pathname === '/' || window.location.pathname === '')) {
        navigate('/dashboard');
      }
    }
    verifySession();
  }, []);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentRoute(path);

    // Parse lens type from path if navigating to /lens/:lens_type
    if (path.startsWith('/lens/')) {
      const lensParam = path.replace('/lens/', '') as DomainLens;
      if (['Education', 'Healthcare', 'Agriculture'].includes(lensParam)) {
        setActiveLens(lensParam);
      }
    }
  };

  const handleSelectLens = (lens: DomainLens) => {
    setActiveLens(lens);
    navigate(`/lens/${lens}`);
  };

  // Loading state
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-500/30 border-t-brand-500 rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-medium text-slate-400">Initializing Unify AI Platform...</p>
      </div>
    );
  }

  // Not authenticated -> Show AuthPage
  if (!isAuthenticated) {
    return (
      <AuthPage
        onAuthSuccess={() => {
          setIsAuthenticated(true);
          navigate('/dashboard');
        }}
      />
    );
  }

  // Route Dispatcher
  if (currentRoute === '/ingest') {
    return <IngestPage navigate={navigate} activeLens={activeLens} />;
  }

  if (currentRoute.startsWith('/lens')) {
    // Determine lens from route or activeLens
    const pathLens = currentRoute.replace('/lens/', '') as DomainLens;
    const currentLens = ['Education', 'Healthcare', 'Agriculture'].includes(pathLens)
      ? pathLens
      : activeLens;

    return (
      <LensPage
        lensType={currentLens}
        onSelectLens={handleSelectLens}
        navigate={navigate}
      />
    );
  }

  // Default to Dashboard
  return (
    <DashboardPage
      navigate={navigate}
      activeLens={activeLens}
      setActiveLens={setActiveLens}
    />
  );
}

export default App;
