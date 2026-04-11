# Specification: Member Profiles, Admin Controls, and Voting Enhancements

## Overview
This track focuses on empowering neighborhood members with robust profile management tools, including anonymity features, social link integration, and account controls. It also strengthens neighborhood security by providing admins with blocking capabilities and automated duplicate detection for membership requests. Finally, it streamlines the candidate experience by leveraging existing profile data.

## Objectives
- **Enhanced Member Profiles:**
    - Optional profile photo upload.
    - Anonymity toggle: Replace real names with a random 6-character ID (e.g., `ywtk45 (?)`) and restrict anonymous members from board candidacy.
    - Social link integration (Platform support: LinkedIn, Twitter/X, Instagram, etc.).
    - Account management: Update phone, email, password, and request account deletion.
- **Advanced Admin Controls:**
    - Block/unblock members.
    - Unique phone number validation for `invites` and `join_requests`.
    - Dashboard flagging for duplicate membership requests.
- **Voting Optimization:**
    - Automatic use of existing profile photo for candidate submissions.

## Technical Requirements
- **Database Schema Updates:**
    - `user_profiles`: Add `is_visible` (boolean, default true) and `social_links` (jsonb).
    - `user_neighborhoods`: Add `is_blocked` (boolean, default false).
    - `invites` & `join_requests`: Ensure phone number uniqueness logic/flagging.
- **Frontend Enhancements:**
    - Profile screen overhaul in `src/app/(app)/profile.tsx`.
    - Admin dashboard updates in `src/app/(app)/admin/index.tsx`.
    - Voting logic update in `src/app/(app)/voting/submit-profile.tsx` (or equivalent).
- **Anonymity Logic:**
    - Implement a utility to generate random 6-character IDs (4 letters + 2 numbers).
    - Global "display name" logic that respects the `is_visible` flag across the app (announcements, forum, etc.).
