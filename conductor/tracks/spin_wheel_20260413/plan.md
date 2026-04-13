# Implementation Plan: Spin Wheel & Leaderboard Upgrade

## Phase 1: Database and Backend Setup
1. **Schema Update:**
   - Create `daily_spins` table to track user spins (id, user_id, neighborhood_id, last_spin_at).
   - Ensure the gamification schema handles points logging correctly.
2. **Edge Function:**
   - Create a `spin-wheel` edge function that:
     - Checks user eligibility (hasn't spun today).
     - Checks user role (resident only).
     - Randomly determines point reward based on probability weights.
     - Updates user's total points and level in `profiles`.
     - Logs the activity in `gamification_logs` or equivalent.
     - Records the spin in `daily_spins`.

## Phase 2: Leaderboard Screen Restructuring
1. **Refactor `src/app/(app)/leaderboard.tsx`:**
   - Implement tabbed navigation (My Activities vs. Top Neighbors).
   - Move current leaderboard logic into the "Top Neighbors" tab.
   - Design the "My Activities" tab structure.
2. **"My Activities" Data Fetching:**
   - Fetch the current user's points logs and status.
   - Display stats cards (Monthly, Total, Next Level).

## Phase 3: Spin Wheel UI Implementation
1. **Component Design:**
   - Create a reusable `SpinWheel` component with an interactive spinning animation using `react-native-reanimated`.
   - Implement the "Spin" trigger and success/fail states.
2. **Integration:**
   - Embed the `SpinWheel` component in the "My Activities" tab.
   - Show/hide based on eligibility (checked via API).
   - Implement the countdown timer for the "next spin".

## Phase 4: Refinement and Testing
1. **UI Polishing:**
   - Add animations for point wins.
   - Improve list styling for activity logs.
2. **Verification:**
   - Test spin once per day constraint.
   - Test points calculation and level progression.
   - Test role restrictions (Admins/Moderators cannot spin).
   - Test "Top Neighbors" ranking logic.

## Task Checklist
- [ ] Database: Create `daily_spins` table.
- [ ] Edge Function: `spin-wheel` logic with probabilities.
- [ ] UI: Leaderboard tabbed navigation structure.
- [ ] UI: "Top Neighbors" list with highlighted top 3.
- [ ] UI: "My Activities" tab with points history.
- [ ] UI: Spin Wheel component and animation.
- [ ] UI: Spin Wheel integration and countdown timer.
- [ ] Final Testing: Role eligibility and once-per-day constraint.
