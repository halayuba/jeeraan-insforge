# Specification: Admin Auth Flow and Neighborhood Access

## Overview
This track implements the core authentication and onboarding flows for three distinct user roles: Residents, Neighborhood Admins, and Super Admins. It also addresses cross-platform security (Web biometrics) and ensures strict multi-tenant data isolation.

## Objectives
- Implement a multi-tenant data architecture using Row Level Security (RLS).
- Create a `user_profiles` table to manage global roles (e.g., `super_admin`).
- Develop a Neighborhood Admin onboarding flow (Subscription -> Create Neighborhood -> Admin role).
- Build a hidden Super Admin portal with global access.
- Handle biometric authentication gracefully on Web platforms.
- Complete the resident onboarding flow (Invite Code -> Create Account -> Resident role).

## Technical Requirements
- **Database:** PostgreSQL with RLS policies enforced on `neighborhood_id`.
- **Infrastructure:** InsForge for Authentication, Database, and Edge Functions.
- **Frontend:** React Native (Expo) with `expo-router`.
- **Security:** `expo-local-authentication` for biometrics (iOS/Android) and secure bypass for Web.

## User Roles and Flows
1. **Resident:** Invite Code validation -> Account Creation -> Automatic neighborhood linking.
2. **Neighborhood Admin:** "Create a Neighborhood" button -> Account Creation -> Neighborhood Setup -> Admin role.
3. **Super Admin:** Hidden "Admin Access" link -> Dedicated Login -> Global Dashboard (bypass RLS via `global_role`).
