# Implementation Plan: Member Profiles, Admin Controls, and Voting Enhancements

## Phase 1: Database Refinement (Profiles and Admin Control)
- [x] Task: Update `user_profiles` schema.
    - [x] Add `is_visible` (BOOLEAN, DEFAULT TRUE).
    - [x] Add `anonymous_id` (TEXT, e.g., 'ywtk45').
    - [x] Add `social_links` (JSONB, DEFAULT '{}').
    - [x] Create a DB trigger to auto-generate `anonymous_id` for new profiles (4 chars + 2 digits).
    - [x] Backfill `anonymous_id` for existing profiles.
- [x] Task: Update `user_neighborhoods` schema.
    - [x] Add `is_blocked` (BOOLEAN, DEFAULT FALSE).
- [x] Task: Update `invites` and `join_requests` logic/indices.
    - [x] Check for existing phone number constraints.
- [x] Task: Conductor - User Manual Verification 'Phase 1: Database Schema' (Protocol in workflow.md)

## Phase 2: Enhanced Profile Screen
- [x] Task: Update `src/app/(app)/profile.tsx` with visibility toggle.
    - [x] Implement toggle for `is_visible`.
    - [x] Display notification message when toggled.
    - [x] Add random ID generation logic (or display the one from DB).
- [x] Task: Implement Social Links management.
    - [x] Create UI for adding/editing LinkedIn, Twitter, Instagram links.
    - [x] Save to `social_links` JSONB.
- [x] Task: Implement Account Management tools.
    - [x] Add forms for updating phone and email.
    - [x] Add password reset flow link (using InsForge SDK).
    - [x] Add "Delete Account" functionality (permanent removal from neighborhood and auth).
- [x] Task: Conductor - User Manual Verification 'Phase 2: Enhanced Profile Screen' (Protocol in workflow.md)

## Phase 3: Advanced Admin Dashboard
- [x] Task: Implement Block Member feature.
    - [x] Add a "Block" button to Member Management in `src/app/(app)/admin/index.tsx`.
    - [x] Update RLS/guards to restrict blocked members.
- [x] Task: Implement Unique Phone Number validation for Membership Requests.
    - [x] Update the Admin view for `invites` and `join_requests` to flag duplicate phone numbers.
- [x] Task: Conductor - User Manual Verification 'Phase 3: Admin Dashboard' (Protocol in workflow.md)

## Phase 4: Voting & Global Anonymity
- [x] Task: Update Candidate Submission logic.
    - [x] Update candidacy submission flow to auto-detect and use existing profile photo.
    - [x] Restrict anonymous members from board candidacy.
- [x] Task: Global Name Utility.
    - [x] Create a utility/helper to handle "DisplayName" (Name vs. Anonymous ID + Tooltip) across all screens (Announcements, Posts, Ads).
- [x] Task: Conductor - User Manual Verification 'Phase 4: Voting & Global Anonymity' (Protocol in workflow.md)

## Phase 5: Final Verification & Cleanup
- [x] Task: Final E2E manual verification of all features.
- [x] Task: Code cleanup and documentation updates.

## Phase: Review Fixes
- [x] Task: Apply review suggestions e33b613
