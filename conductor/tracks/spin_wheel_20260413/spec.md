# Specification: Spin Wheel & Leaderboard Upgrade

## Objective
Enhance user engagement by adding a daily "Spin Wheel" bonus system and upgrading the Leaderboard screen to include personal activity history and improved ranking views.

## User Stories
- **As a Resident member**, I want to spin a wheel once a day to earn bonus points.
- **As a Resident member**, I want to see my points history ("My Activities") to track my engagement.
- **As a Resident member**, I want to see the top neighbors in my neighborhood to see where I stand.
- **As a Moderator or Admin**, I should be excluded from the Spin Wheel to maintain fairness.

## Functional Requirements

### 1. Spin Wheel System
- **Eligibility:** 1 spin per user per day.
- **Target:** Regular members (residents) only. Exclude Moderators and Neighborhood Admins.
- **Rewards:** Randomly awarded points:
  - Try Again (0 pts): 30% probability
  - Small Win (+1 pt): 40% probability
  - Medium Win (+2 pts): 20% probability
  - Big Win (+3 pts): 10% probability
- **Workflow:**
  1. User navigates to **Leaderboard → My Activities**.
  2. If eligible (hasn't spun today), shows "Spin the Wheel" CTA.
  3. Clicking plays an animation and displays the result.
  4. System records the spin and awards points if applicable.
  5. UI shows a countdown to the next spin: "Next spin in Xh Ym".

### 2. Leaderboard Screen Upgrade
- **Tabs:**
  - **Tab 1: My Activities**
    - Stats: "This Month", "Total Points", "Next Level (remaining points)".
    - Activity Feed: List of recent point-earning actions with timestamps (e.g., "+3 pts — Announcement posted").
    - Spin Wheel UI: Integrated at the top or near the top of this tab.
  - **Tab 2: Top Neighbors**
    - Existing list of members sorted by points.
    - Highlight top 3 (🥇, 🥈, 🥉).
    - Search bar to find specific neighbors.

### 3. Backend Implementation
- **Data Table:** Need a way to track spins per user per day (can be a new `daily_spins` table or an addition to `profiles`).
- **Points Log:** Ensure all point-earning activities (including spins) are logged for the activity feed.
- **Eligibility Logic:** Server-side validation to prevent multiple spins per day.

## UI/UX Requirements
- Modern, "game-like" feel for the Spin Wheel.
- Smooth transitions between tabs.
- Clear empty states for "My Activities" if the user has no points yet.
- Visual feedback (celebratory animation) for point wins.

## Success Criteria
- [ ] Spin Wheel only accessible once per 24h/calendar day.
- [ ] Points correctly awarded and visible in "My Activities".
- [ ] Leaderboard tabs work as expected.
- [ ] Non-eligible roles (Admins/Moderators) cannot access the Spin Wheel.
