# Implementation Plan: Classified Ads Monetization

## Phase 1: Database & Backend Infrastructure Setup
- [ ] Task: Migrate Database Schema
    - [ ] Write Tests: Ensure RLS policies correctly restrict access to settings and payment tables.
    - [ ] Implement: Add `classifieds_monetization_enabled` to `neighborhood_settings`, update `classified_ads` fields, and create `classified_ads_payments` table.
- [ ] Task: Edge Function `create-ad-checkout-session`
    - [ ] Write Tests: Verify fee calculation logic for all pricing tiers ($0, $100, $101, $500, $501).
    - [ ] Write Tests: Verify role-based listing limits are strictly enforced.
    - [ ] Implement: Securely generate Native Stripe Checkout (Payment Sheet) intent using `@stripe/stripe-react-native` compatible session configurations.
- [ ] Task: Edge Function `handle-ad-payment-webhook`
    - [ ] Write Tests: Mock Stripe responses to test successful transaction handling.
    - [ ] Implement: Listen for Stripe webhooks and update ad status to 'active', recording the `fee_paid`.
- [ ] Task: Edge Function `expire-old-ads` (Cron)
    - [ ] Write Tests: Verify ads older than 30 days are selected and marked 'expired'.
    - [ ] Implement: Function to run daily to clean up stale active ads.
- [ ] Task: Conductor - User Manual Verification 'Database & Backend Infrastructure Setup' (Protocol in workflow.md)

## Phase 2: Frontend Implementation - Create Ad Flow
- [ ] Task: Upgrade "Create Ad" Form
    - [ ] Write Tests: Render new fields (price, contact info) and ensure form validation.
    - [ ] Implement: Add input for Price and integrate dynamic fee preview logic based on the item price.
    - [ ] Implement: Add "Terms & Conditions" checkbox required before submission.
- [ ] Task: Integrate Native Stripe Payment Flow
    - [ ] Write Tests: Ensure the app correctly handles redirection/invoking of the Stripe SDK Payment Sheet.
    - [ ] Implement: Setup `@stripe/stripe-react-native`, present the Payment Sheet, and handle success/failure callbacks to navigate to the ad details or error states.
- [ ] Task: Conductor - User Manual Verification 'Frontend Implementation - Create Ad Flow' (Protocol in workflow.md)

## Phase 3: Ad Details, Engagement, and Moderation
- [ ] Task: Ad Details Upgrade
    - [ ] Write Tests: Verify rendering of price, status labels, and the "Contact Seller" button.
    - [ ] Implement: Update the `[id].tsx` screen to display the new fields.
- [ ] Task: "Contact Seller" Integration
    - [ ] Write Tests: Ensure clicking "Contact Seller" initiates a DM with the correct `user_id`.
    - [ ] Implement: Tie-in to the existing Direct Messaging system.
- [ ] Task: User Actions (Mark as Sold, Renew)
    - [ ] Write Tests: Verify the owner can change the ad status.
    - [ ] Implement: "Mark as Sold" toggle, and a "Renew Ad" function (which resets expiration free of charge).
- [ ] Task: Moderation & Reporting
    - [ ] Write Tests: Verify members can report ads and moderators can inactivate them.
    - [ ] Implement: "Report Ad" button for users, and moderation controls for Moderators/Admins.
- [ ] Task: Admin Monetization Toggle
    - [ ] Write Tests: Verify neighborhood admins can flip the `classifieds_monetization_enabled` setting.
    - [ ] Implement: Add a toggle to the Admin Dashboard.
- [ ] Task: Conductor - User Manual Verification 'Ad Details, Engagement, and Moderation' (Protocol in workflow.md)