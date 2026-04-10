# Implementation Plan - Gamified Engagement Engine

## Phase 1: Database and Backend Setup (InsForge)
- [x] Task: Define and create `gamification_settings` table in InsForge.
    - [x] Write SQL migration to create the table with default values.
    - [x] Verify table creation and default values in InsForge.
- [x] Task: Extend `user_profiles` table with gamification fields.
    - [x] Write SQL migration to add `points`, `level`, and `eligible_for_moderator`.
    - [x] Verify fields are correctly added to the existing schema.
- [x] Task: Create `points_log` table to track transactions.
    - [x] Write SQL migration for `points_log` table.
    - [x] Verify table structure and indexes.
- [x] Task: Implement Edge Functions for awarding points.
    - [x] Write Tests: Unit tests for point awarding logic (Validation Layer).
    - [x] Implement: Edge function `award_points(userId, actionType, entityId)`.
    - [x] Implement: Validation logic to prevent duplicate awards (e.g., per work order).
- [x] Task: Implement Level Calculation logic.
    - [x] Write Tests: Unit tests for calculating levels based on configurable thresholds.
    - [x] Implement: Logic to update user level when points change.
- [x] Task: Conductor - User Manual Verification 'Phase 1: Backend' (Protocol in workflow.md)

## Phase 2: Admin Dashboard - Configuration UI
- [x] Task: Create Engagement Settings Panel UI.
    - [x] Write Tests: Component tests for the settings form.
    - [x] Implement: UI for toggling gamification and setting daily caps.
- [x] Task: Implement Points Configuration UI.
    - [x] Write Tests: Verification of points configuration saving.
    - [x] Implement: Form for defining points for each action (Announcements, Invites, etc.).
- [x] Task: Implement Level Thresholds Configuration UI.
    - [x] Write Tests: Verification of level threshold saving.
    - [x] Implement: Form for defining point ranges for each level and max levels.
- [x] Task: Conductor - User Manual Verification 'Phase 2: Admin Config' (Protocol in workflow.md)

## Phase 3: Points Integration and Validation
- [x] Task: Integrate point awarding triggers in Announcements.
    - [x] Write Tests: Verify points are awarded when an announcement is posted.
    - [x] Implement: Call `award_points` after successful announcement creation.
- [x] Task: Integrate point awarding triggers in Invites and Work Orders.
    - [x] Write Tests: Verify points for accepted invites and feedback submissions.
    - [x] Implement: Call `award_points` on invite acceptance and feedback submission.
- [x] Task: Integrate point awarding triggers in Forum and Classifieds.
    - [x] Write Tests: Verify points for new forum topics and classified ads.
    - [x] Implement: Call `award_points` on new topic creation and ad listing.
- [x] Task: Conductor - User Manual Verification 'Phase 3: Integration' (Protocol in workflow.md)

## Phase 4: User Profile and Engagement UI
- [x] Task: Implement Profile Screen Gamification UI.
    - [x] Write Tests: Verify progress ring and level display on Profile.
    - [x] Implement: Progress ring around profile picture and "X points to next level" text.
- [x] Task: Implement Level Badges in Avatars.
    - [x] Write Tests: Verify badges appear next to avatars in posts.
    - [x] Implement: Small level badge component for avatars across the app.
- [x] Task: Implement "Top Neighbors" Leaderboard.
    - [x] Write Tests: Verify leaderboard sorting and display.
    - [x] Implement: Leaderboard screen fetching data from InsForge.
- [x] Task: Implement Gamification Notifications.
    - [x] Write Tests: Verify notifications for earning points and leveling up.
    - [x] Implement: Push/In-app notifications for gamification events.
- [x] Task: Conductor - User Manual Verification 'Phase 4: User UI' (Protocol in workflow.md)

## Phase 5: Admin Moderation and Promotion
- [x] Task: Create Moderation Queue for Moderator Eligibility.
    - [x] Write Tests: Verify users appear in the queue when crossing the threshold.
    - [x] Implement: Dashboard section listing users eligible for promotion.
- [x] Task: Implement Admin Promotion Logic.
    - [x] Write Tests: Verify user role updates upon admin approval.
    - [x] Implement: Manual approval button and role update logic in the dashboard.
- [x] Task: Conductor - User Manual Verification 'Phase 5: Moderation' (Protocol in workflow.md)

## Phase: Review Fixes
- [x] Task: Apply review suggestions 4b07e2b
