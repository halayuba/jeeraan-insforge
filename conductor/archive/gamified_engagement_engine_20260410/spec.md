# Gamified Engagement Engine

## 1. Overview
The Gamified Engagement Engine aims to encourage meaningful participation in the Jeeraan platform by rewarding members with points, levels, and elevated roles (e.g., Moderator). This system is designed to significantly increase retention and participation while preventing spam or low-quality engagement. **Crucially, all point values and level thresholds are configurable by neighborhood admins.**

## 2. Functional Requirements
### 2.1 Points System (Admin-Configurable)
Admins can define the points awarded for specific actions via the dashboard. The following actions are supported:
- **Announcement Post:** (Default: +3 points)
- **Invite Accepted:** (Default: +5 points)
- **Work Order Feedback:** (Default: +2 points)
- **Forum Post (New Topic):** (Default: +2 points)
- **Classified Ad:** (Default: +2 points)
- **Grievance Submission:** (Default: +3 points)
- **Events / Q&A / Forum Replies:** (Default: 0 points, but configurable)

### 2.2 Leveling System (Admin-Configurable)
Admins can configure the point thresholds for each level.
- **Level 1:** (Default: 0–24 points)
- **Level 2:** (Default: 25–49 points)
- **Level 3:** (Default: 50–99 points)
- **Max Levels:** Admins can define the maximum number of levels.

### 2.3 Role Promotion
- When a user reaches a configurable threshold (default: 25 points), they are flagged as "Eligible for Moderator".
- **Admin Approval:** Promotion is not automatic. The system will notify the Admin dashboard that the user is eligible, and the Admin must manually approve the promotion to Moderator.

### 2.4 Abuse Prevention (Validation Layer)
- **Action-Specific Rules:** The system will rely on action-specific rules (e.g., "one per work order", "first post only") to prevent spam.
- **Configurable Daily Caps:** Admins can set a maximum number of points a user can earn per day (Default: No cap).

### 2.5 User Interface
- **Profile Screen:** Display a progress ring around the user's profile picture, their current level badge, and text indicating "X points to next level".
- **Avatars in Posts:** Show a small level badge next to the user's avatar on their posts and comments.
- **Admin Dashboard Settings:**
    - **Engagement Settings Panel:** Toggle gamification ON/OFF and configure points per action, level thresholds, moderator thresholds, and daily caps.
    - **Moderation Queue:** View user points, levels, and a queue of users eligible for promotion.
- **Leaderboard:** Include a "Top Neighbors" leaderboard displaying the most engaged users.
- **Notifications:** Inform users when they earn points, level up, or become eligible for a role.

### 2.6 Data Model Updates (InsForge)
- **`gamification_settings` Table:** Store neighborhood-specific configurations (points per action, level thresholds, etc.).
- **User Profile Extension:** Add `points`, `level`, and `eligible_for_moderator` fields to the user profiles.
- **Points Log Table:** Track all point transactions (`user_id`, `action_type`, `points_awarded`, `created_at`).

## 3. Acceptance Criteria
- [ ] Admins can change point values for actions in the dashboard, and these changes take effect immediately.
- [ ] Admins can define level thresholds and maximum levels.
- [ ] Users receive points according to the current admin-defined configuration.
- [ ] The system correctly identifies users eligible for the Moderator role based on the admin-defined threshold.
- [ ] The Leaderboard and Profile UI correctly reflect the dynamic point and level values.
- [ ] Notifications are sent to users for relevant gamification events.
