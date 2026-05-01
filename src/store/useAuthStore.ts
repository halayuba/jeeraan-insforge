import { create } from 'zustand';
import { insforge } from '../lib/insforge';

type AuthState = {
  user: any;
  session: any;
  loading: boolean;
  isInitialized: boolean;
  fullName: string | null;
  globalRole: string | null;
  userRole: string | null;
  userLevel: number;
  neighborhoodId: string | null;
  isBlocked: boolean;
};

type AuthActions = {
  refreshAuth: () => Promise<void>;
  signOut: () => Promise<void>;
  handleAuthError: (err: any) => void;
  initialize: () => Promise<void>;
  clearAuthState: () => void;
};

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  // State
  user: null,
  session: null,
  loading: true,
  isInitialized: false,
  fullName: null,
  globalRole: null,
  userRole: null,
  userLevel: 1,
  neighborhoodId: null,
  isBlocked: false,

  // Actions
  clearAuthState: () => {
    set({
      user: null,
      session: null,
      loading: false,
      fullName: null,
      globalRole: null,
      userRole: null,
      userLevel: 1,
      neighborhoodId: null,
      isBlocked: false,
    });
  },

  handleAuthError: (err: any) => {
    if (
      err.message?.includes('JWT expired') || 
      err.code === 'PGRST301' || 
      err.statusCode === 401 ||
      err.error === 'unauthorized'
    ) {
      console.log('Session expired or invalid, clearing auth state');
      get().clearAuthState();
    }
  },

  signOut: async () => {
    set({ loading: true });
    try {
      await insforge.auth.signOut();
    } catch (err) {
      console.error('Error during signOut:', err);
    } finally {
      get().clearAuthState();
    }
  },

  fetchAuthDetails: async (userId: string) => {
    try {
      const [neighborhoodRes, profileRes] = await Promise.all([
        insforge.database
          .from('user_neighborhoods')
          .select('role, neighborhood_id, is_blocked')
          .eq('user_id', userId)
          .maybeSingle(),
        insforge.database
          .from('user_profiles')
          .select('global_role, level, full_name')
          .eq('user_id', userId)
          .maybeSingle(),
      ]);

      const nData = neighborhoodRes.data;
      const pData = profileRes.data;

      if (neighborhoodRes.error) get().handleAuthError(neighborhoodRes.error);
      if (profileRes.error) get().handleAuthError(profileRes.error);

      return {
        userRole: nData?.role || null,
        neighborhoodId: nData?.neighborhood_id || null,
        isBlocked: nData?.is_blocked || false,
        globalRole: pData?.global_role || null,
        userLevel: pData?.level || 1,
        fullName: pData?.full_name || null,
      };
    } catch (err) {
      console.error('Error fetching auth details', err);
      get().handleAuthError(err);
      return {};
    }
  },

  checkSessionExpiry: (sessionData: any) => {
    if (sessionData?.expiresAt) {
      const expiresAt = new Date(sessionData.expiresAt);
      if (expiresAt < new Date()) {
        console.log('Session expired (client-side check), signing out');
        get().signOut();
        return true;
      }
    }
    return false;
  },

  refreshAuth: async () => {
    set({ loading: true });
    try {
      const { data, error } = await insforge.auth.getCurrentSession();
      
      if (error) {
        get().handleAuthError(error);
        set({ loading: false, isInitialized: true });
        return;
      }

      if (data.session && (get() as any).checkSessionExpiry(data.session)) {
        set({ loading: false, isInitialized: true });
        return;
      }

      const session = data.session;
      const user = session?.user ?? null;
      
      let details = {};
      if (user?.id) {
        details = await (get() as any).fetchAuthDetails(user.id);
      }

      set({
        session,
        user,
        loading: false,
        isInitialized: true,
        fullName: null,
        globalRole: null,
        userRole: null,
        userLevel: 1,
        neighborhoodId: null,
        isBlocked: false,
        ...details,
      });
    } catch (err) {
      get().handleAuthError(err);
      set({ loading: false, isInitialized: true });
    }
  },

  initialize: async () => {
    try {
      const { data, error } = await insforge.auth.getCurrentSession();
      
      if (error) {
        get().handleAuthError(error);
        set({ loading: false, isInitialized: true });
        return;
      }

      if (data.session && (get() as any).checkSessionExpiry(data.session)) {
        set({ loading: false, isInitialized: true });
        return;
      }

      const session = data.session;
      const user = session?.user ?? null;
      
      let details = {};
      if (user?.id) {
        details = await (get() as any).fetchAuthDetails(user.id);
      }

      set({
        session,
        user,
        loading: false,
        isInitialized: true,
        fullName: null,
        globalRole: null,
        userRole: null,
        userLevel: 1,
        neighborhoodId: null,
        isBlocked: false,
        ...details,
      });
    } catch (err) {
      get().handleAuthError(err);
      set({ loading: false, isInitialized: true });
    }
  },
}));
