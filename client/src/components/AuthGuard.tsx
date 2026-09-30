import React, { useEffect, useState } from 'react';
import { getCurrentUser } from '../lib/supabase.js';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onUnauthenticated?: () => void;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  fallback,
  onUnauthenticated
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkAuth() {
      const user = await getCurrentUser();
      if (user) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        if (onUnauthenticated) {
          onUnauthenticated();
        }
      }
    }
    checkAuth();
  }, [onUnauthenticated]);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-500/30 border-t-brand-500 rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-400 text-sm font-medium tracking-wide">Verifying secure session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
};
