# Implementation Plan: Admin Auth Flow and Neighborhood Access

## Phase 1: Database Refactoring (Global Roles)
- [ ] Task: Create `user_profiles` table with `global_role`.
    - [ ] Create PostgreSQL table with `user_id` (PK), `global_role` (enum: super_admin, user), `created_at`, `updated_at`.
    - [ ] Create a DB trigger to auto-create a profile when a new user signs up in `auth.users`.
- [ ] Task: Seed Super Admin account via CLI.
    - [ ] Update your user ID in `user_profiles` to `super_admin`.
- [ ] Task: Update AuthContext to fetch global role.
    - [ ] Write tests for AuthContext fetching `global_role`.
    - [ ] Update `src/contexts/AuthContext.tsx` to include `global_role` from `user_profiles`.
- [ ] Task: Conductor - User Manual Verification 'Database Refactoring' (Protocol in workflow.md)

## Phase 2: Neighborhood Admin Onboarding
- [ ] Task: Add "Create a Neighborhood" button to Splash Screen.
    - [ ] Write tests for the Splash Screen button existence.
    - [ ] Update `src/app/index.tsx` to add the button with navigation to `/create-neighborhood`.
- [ ] Task: Build `/create-neighborhood` wizard.
    - [ ] Write tests for account creation and neighborhood setup logic.
    - [ ] Create `src/app/(auth)/create-neighborhood.tsx` with a multi-step form (Account -> Details -> Link).
- [ ] Task: Implement neighborhood linking logic.
    - [ ] Write tests for linking a user as 'admin' in `user_neighborhoods`.
    - [ ] Implement the service logic in `src/lib/insforge.ts` to insert into `neighborhoods` and `user_neighborhoods`.
- [ ] Task: Conductor - User Manual Verification 'Neighborhood Admin Onboarding' (Protocol in workflow.md)

## Phase 3: Super Admin Portal updates
- [ ] Task: Create hidden `admin-sign-in.tsx`.
    - [ ] Write tests for the hidden sign-in logic.
    - [ ] Create `src/app/(auth)/sign-in-admin.tsx` (using a specific hidden path/entry).
- [ ] Task: Add hidden UI trigger on Splash Screen.
    - [ ] Write tests for the hidden UI trigger (e.g., long-press on a logo).
    - [ ] Implement the trigger in `src/app/index.tsx`.
- [ ] Task: Update `admin/_layout.tsx` for `global_role` exception.
    - [ ] Write tests for the layout guard logic (allowing super_admin).
    - [ ] Modify `src/app/(app)/admin/_layout.tsx` to check `global_role === 'super_admin'` or local `role === 'admin'`.
- [ ] Task: Implement Web biometric bypass.
    - [ ] Write tests for `Platform.OS` specific behavior in the biometric check.
    - [ ] Update the biometric guard in `src/app/(app)/admin/_layout.tsx` to skip `LocalAuthentication` on Web.
- [ ] Task: Conductor - User Manual Verification 'Super Admin Portal' (Protocol in workflow.md)
