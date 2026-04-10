import React, { createContext, useContext, useEffect, useState } from 'react';
import { insforge } from '../lib/insforge';

type UserContextType = {
  user: any;
  session: any;
  loading: boolean;
  globalRole: string | null;
  userRole: string | null;
  userLevel: number;
  neighborhoodId: string | null;
  refreshAuth: () => Promise<void>;
  signOut: () => Promise<void>;
  handleAuthError: (err: any) => void;
};

const AuthContext = createContext<UserContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [globalRole, setGlobalRole] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userLevel, setUserLevel] = useState<number>(1);
  const [neighborhoodId, setNeighborhoodId] = useState<string | null>(null);

  const handleAuthError = (err: any) => {
    // Specifically handle session/auth errors by clearing state
    if (
      err.message?.includes('JWT expired') || 
      err.code === 'PGRST301' || 
      err.statusCode === 401 ||
      err.error === 'unauthorized'
    ) {
      console.log('Session expired or invalid, clearing auth state');
      setSession(null);
      setUser(null);
      setUserRole(null);
      setUserLevel(1);
      setNeighborhoodId(null);
      setGlobalRole(null);
    }
  };

  const fetchNeighborhoodInfo = async (userId: string) => {
    try {
      const { data, error } = await insforge.database
        .from('user_neighborhoods')
        .select('role, neighborhood_id')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        handleAuthError(error);
        return;
      }

      if (data) {
        setUserRole(data.role);
        setNeighborhoodId(data.neighborhood_id);
      }
    } catch (err) {
      console.error('Error fetching neighborhood context', err);
      handleAuthError(err);
    }
  };

  const fetchGlobalProfile = async (userId: string) => {
    try {
      const { data, error } = await insforge.database
        .from('user_profiles')
        .select('global_role, level')
        .eq('user_id', userId)
        .single();

      if (error) {
        handleAuthError(error);
        return;
      }

      if (data) {
        setGlobalRole(data.global_role);
        setUserLevel(data.level || 1);
      }
    } catch (err) {
      console.error('Error fetching global profile', err);
      handleAuthError(err);
    }
  };

  const refreshAuth = async () => {
    setLoading(true);
    try {
      const { data, error } = await insforge.auth.getCurrentSession();
      
      if (error) {
        handleAuthError(error);
        setLoading(false);
        return;
      }

      setSession(data.session);
      setUser(data.session?.user ?? null);
      
      if (data.session?.user?.id) {
        await Promise.all([
          fetchNeighborhoodInfo(data.session.user.id),
          fetchGlobalProfile(data.session.user.id),
        ]);
      }
    } catch (err) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await insforge.auth.signOut();
    } finally {
      setSession(null);
      setUser(null);
      setUserRole(null);
      setNeighborhoodId(null);
      setGlobalRole(null);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data, error } = await insforge.auth.getCurrentSession();
        
        if (error) {
          handleAuthError(error);
          setLoading(false);
          return;
        }

        setSession(data.session);
        setUser(data.session?.user ?? null);
        
        if (data.session?.user?.id) {
          await Promise.all([
            fetchNeighborhoodInfo(data.session.user.id),
            fetchGlobalProfile(data.session.user.id),
          ]);
        }
      } catch (err) {
        handleAuthError(err);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      globalRole, 
      userRole, 
      neighborhoodId, 
      refreshAuth,
      signOut,
      handleAuthError
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
