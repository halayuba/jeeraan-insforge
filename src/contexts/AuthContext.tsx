import React, { createContext, useContext, useEffect, useState } from 'react';
import { insforge } from '../lib/insforge';

type UserContextType = {
  user: any;
  session: any;
  loading: boolean;
  refreshAuth: () => Promise<void>;
};

const AuthContext = createContext<UserContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const refreshAuth = async () => {
    const { data } = await insforge.auth.getCurrentSession();
    setSession(data.session);
    setUser(data.session?.user ?? null);
  };

  useEffect(() => {
    // Check active sessions and sets the user
    insforge.auth.getCurrentSession().then(({ data }: { data: any }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading, refreshAuth }}>
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
