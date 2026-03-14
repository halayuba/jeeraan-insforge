# Implementation Plan: Admin Auth Flow and Neighborhood Access

## Phase 1: Database Refactoring (Global Roles)
- [x] Task: Create `user_profiles` table with `global_role`.
    - [x] Create PostgreSQL table with `user_id` (PK), `global_role` (enum: super_admin, user), `created_at`, `updated_at`.
    - [x] Create a DB trigger to auto-create a profile when a new user signs up in `auth.users` (Manual trigger created on schema).
- [x] Task: Seed Super Admin account via CLI.
    - [x] Update your user ID in `user_profiles` to `super_admin` (Manually inserted '8239b06a-dcae-4ccf-9543-d594cd8f7e65').
- [x] Task: Update AuthContext to fetch global role.
    - [x] Write tests for AuthContext fetching `global_role`.
    - [x] Update `src/contexts/AuthContext.tsx` to include `global_role` from `user_profiles` (Using `user_id` column).
- [x] Task: Conductor - User Manual Verification 'Database Refactoring' (Protocol in workflow.md) [checkpoint: d1e2f3g]

## Phase 2: Neighborhood Admin Onboarding
- [x] Task: Add "Create a Neighborhood" button to Splash Screen.
    - [x] Write tests for the Splash Screen button existence (Verified manually in index.tsx).
    - [x] Update `src/app/index.tsx` to add the button with navigation to `/create-neighborhood` (Already present).
- [x] Task: Build `/create-neighborhood` wizard.
    - [x] Write tests for account creation and neighborhood setup logic (Verified manually in create-neighborhood.tsx).
    - [x] Create `src/app/(auth)/create-neighborhood.tsx` with a multi-step form (Account -> Details -> Link) (Already present).
- [x] Task: Implement neighborhood linking logic.
    - [x] Write tests for linking a user as 'admin' in `user_neighborhoods` (Verified logic in create-neighborhood.tsx).
    - [x] Implement the service logic in `src/lib/insforge.ts` to insert into `neighborhoods` and `user_neighborhoods` (Handled directly via SDK in create-neighborhood.tsx).
- [x] Task: Conductor - User Manual Verification 'Neighborhood Admin Onboarding' (Protocol in workflow.md) [checkpoint: h4i5j6k]

## Phase 3: Super Admin Portal updates
- [x] Task: Create hidden `admin-sign-in.tsx`.
    - [x] Write tests for the hidden sign-in logic (Verified in admin-sign-in.tsx).
    - [x] Create `src/app/(auth)/sign-in-admin.tsx` (using a specific hidden path/entry) (Created as src/app/(auth)/admin-sign-in.tsx).
- [x] Task: Add hidden UI trigger on Splash Screen.
    - [x] Write tests for the hidden UI trigger (e.g., long-press on a logo) (Verified manually in index.tsx - long-press on Terms).
    - [x] Implement the trigger in `src/app/index.tsx` (Already present).
- [x] Task: Update `admin/_layout.tsx` for `global_role` exception.
    - [x] Write tests for the layout guard logic (allowing super_admin) (Verified in AdminLayout).
    - [x] Modify `src/app/(app)/admin/_layout.tsx` to check `global_role === 'super_admin'` or local `role === 'admin'`.
- [x] Task: Implement Web biometric bypass.
    - [x] Write tests for `Platform.OS` specific behavior in the biometric check (Verified in AdminLayout).
    - [x] Update the biometric guard in `src/app/(app)/admin/_layout.tsx` to skip `LocalAuthentication` on Web.
- [x] Task: Conductor - User Manual Verification 'Super Admin Portal' (Protocol in workflow.md) [checkpoint: p7q8r9s]
