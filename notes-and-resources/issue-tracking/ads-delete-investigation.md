# Advertisement Deletion Bug — Root Cause Analysis

## Issue History

This bug has had **5 previous fix attempts**, all of which claimed success but the problem persisted. The fixes focused on:
1. Adding success alerts and query invalidation (UI layer)
2. RLS policy adjustments for neighborhood admins
3. Applying policies via InsForge CLI
4. Debug logging to confirm IDs were correct
5. Major RLS policy overhaul + `SECURITY DEFINER` function fixes

**None of these addressed the actual root cause.**

---

## True Root Cause: **Silent Authentication Loss**

### The Bug Chain

1. **User signs in** → JWT is stored in the SDK's in-memory `TokenManager` (no `localStorage` in React Native, and no custom `storage` adapter is passed to `createClient()`)

2. **Admin dashboard loads** → `useAdminAds` fires a SELECT query to fetch advertisements. The `Anyone can read advertisements` RLS policy (`FOR SELECT USING (true)`) allows this to succeed **even without authentication**.

3. **JWT silently lost** → At some point the JWT becomes invalid or cleared:
   - JWT expires (natural timeout)
   - Any query's error handler calls `handleAuthError()` → which calls `insforge.auth.signOut()` → which calls `tokenManager.clearSession()` → **JWT is wiped from memory**
   - The React Query `refetchInterval` or `refetchOnWindowFocus` triggers a background refetch; if that hits an auth error, the cascade clears the token

4. **Ads still visible** → The SELECT query continues to succeed because of the public read policy. The UI shows ads normally. **The user has no indication their session is gone.**

5. **User clicks delete** → The SDK's `createInsForgePostgrestFetch` checks `tokenManager.getAccessToken()` → returns `null`. It then falls back to `httpClient.getHeaders()` which returns the `anonKey` fallback. The DELETE request goes to PostgREST with the anon JWT (`sub: 12345678-1234-5678-90ab-cdef12345678`, `role: anon`).

6. **RLS blocks silently** → The `Admins can manage advertisements` policy evaluates `is_admin_of(neighborhood_id) OR is_super_admin()`. Since the anon user is neither, the USING clause returns false. PostgreSQL silently skips the row (this is standard RLS behavior for DELETE — it doesn't error, just affects 0 rows).

7. **API returns HTTP 200 + `[]`** → The frontend sees `data.length === 0` and throws "Permission denied: You do not have authority to delete this advertisement." But in some code paths this error may be swallowed or the user may see a confusing message.

### Evidence

| Test | Result |
|------|--------|
| DELETE via admin API key (`ik_...`) | ✅ **Success** — HTTP 200, returns deleted row |
| DELETE via curl with NO auth token | ❌ **Silent fail** — HTTP 200, returns `[]`, row still exists |
| RLS policy `is_admin_of()` check for user `8239b06a...` | ✅ Returns `true` |
| `insforge.ts` client config | ⚠️ `anonKey: 'your-anon-key-here'` (placeholder, but `.env` has the real key) |
| `createClient()` storage option | ⚠️ **No custom storage adapter** — in RN, falls back to in-memory `Map()` |
| `handleAuthError()` behavior | ⚠️ Calls `insforge.auth.signOut()` which **clears the JWT from memory** |

### The Key Insight

The database policies, helper functions, and frontend mutation logic are all **correct**. The problem is that by the time the user clicks "Delete", their JWT has already been silently cleared from memory, so the request goes out with the anon key instead.

---

## Fix Required

The `deleteAdMutation` in [useAdminAds.ts](file:///home/simon/sites/mobile/ai/jeeraan-insforge/src/hooks/useAdminAds.ts) must **refresh the session** before attempting the delete to ensure a valid JWT is present. If no valid session exists, it should abort with a clear error rather than sending a request destined to fail silently.

```diff
 const deleteAdMutation = useMutation({
     mutationFn: async (id: string) => {
+      // Ensure we have a valid auth session before attempting delete
+      const { data: sessionData } = await insforge.auth.getCurrentSession();
+      if (!sessionData?.session?.accessToken) {
+        throw new Error('Your session has expired. Please sign in again to delete advertisements.');
+      }
+
       console.log('[Admin] Requesting deletion of advertisement ID:', id);
       const { data, error, status } = await insforge.database
```

> [!IMPORTANT]
> This is a **symptom fix**. The deeper issue is that the SDK's `TokenManager` uses in-memory storage on React Native. Ideally, a persistent storage adapter (e.g., `expo-secure-store` or `@react-native-async-storage/async-storage`) should be passed to `createClient({ storage: ... })` to prevent session loss across app restarts and background refreshes.
