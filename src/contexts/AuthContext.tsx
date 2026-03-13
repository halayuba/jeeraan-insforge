import React, { createContext, useContext, useEffect, useState } from 'react';
import { insforge } from '../lib/insforge';

type UserContextType = {
  user: any;
  session: any;
  loading: boolean;
  userRole: string | null;
  neighborhoodId: string | null;
  refreshAuth: () => Promise<void>;
};

const AuthContext = createContext<UserContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [neighborhoodId, setNeighborhoodId] = useState<string | null>(null);

  const fetchNeighborhoodInfo = async (userId: string) => {
    try {
      const { data } = await insforge.database
        .from('user_neighborhoods')
        .select('role, neighborhood_id')
        .eq('user_id', userId)
        .single();
      if (data) {
        setUserRole(data.role);
        setNeighborhoodId(data.neighborhood_id);
      }
    } catch (err) {
      console.error('Error fetching neighborhood context', err);
    }
  };

  const refreshAuth = async () => {
    setLoading(true);
    const { data } = await insforge.auth.getCurrentSession();
    setSession(data.session);
    setUser(data.session?.user ?? null);
    if (data.session?.user?.id) {
      await fetchNeighborhoodInfo(data.session.user.id);
    }
    setLoading(false);
  };

  useEffect(() => {
    const initAuth = async () => {
      const { data } = await insforge.auth.getCurrentSession();
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user?.id) {
        await fetchNeighborhoodInfo(data.session.user.id);
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading, userRole, neighborhoodId, refreshAuth }}>
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
