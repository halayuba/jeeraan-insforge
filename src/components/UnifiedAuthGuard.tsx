import { useRouter, useSegments } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useAuthStore } from '../store/useAuthStore';

/**
 * UnifiedAuthGuard
 * 
 * This component centralizes ALL navigation-based authentication guards.
 * By having a single source of truth for redirects, we prevent "fighting"
 * between multiple layout files which is the primary cause of the 
 * "Maximum update depth exceeded" error in Expo Router.
 */
export function UnifiedAuthGuard({ children }: { children: React.ReactNode }) {
  const { session, loading, isInitialized, userRole, globalRole, neighborhoodId, isBlocked } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const isRedirecting = useRef(false);

  const currentPath = segments.join('/');
  const rootSegment = segments[0];

  useEffect(() => {
    // 1. Wait until auth is fully initialized and NOT currently transitioning
    if (!isInitialized || loading) return;

    // 2. Determine target path based on state
    let targetPath: string | null = null;

    const inApp = rootSegment === '(app)';
    const inAuth = rootSegment === '(auth)';
    const atRoot = segments.length === 0;

    if (!session) {
      // If not signed in, but trying to access protected app routes
      if (inApp) {
        targetPath = '/';
      }
    } else {
      // Signed in case
      if (atRoot || inAuth) {
        // Standard redirect for signed-in users at root or auth pages
        // EXCEPT for special flows
        const isSpecialAuthPage = segments.includes('create-neighborhood') || segments.includes('admin-sign-in');
        if (!isSpecialAuthPage) {
          targetPath = '/(app)/hub';
        }
      }

      // Check specific state-based restrictions
      if (isBlocked && currentPath !== '(app)/blocked' && !currentPath.endsWith('/blocked')) {
        targetPath = '/blocked';
      } else if (globalRole === 'super_admin' && !neighborhoodId && !currentPath.includes('create-neighborhood')) {
        targetPath = '/(auth)/create-neighborhood';
      }
    }

    // 3. Execute redirect if needed
    if (targetPath && currentPath !== targetPath.replace(/^\//, '')) {
      console.log(`[UnifiedAuthGuard] Redirecting from "${currentPath}" to "${targetPath}"`);
      isRedirecting.current = true;
      router.replace(targetPath as any);
    } else {
      isRedirecting.current = false;
    }
  }, [session, isInitialized, loading, isBlocked, globalRole, neighborhoodId, segments]);

  // IMPORTANT: Always render children. 
  // If we are redirecting, the router will swap the component anyway.
  // Returning null here causes a "blank screen" during the transition.
  return <>{children}</>;
}
