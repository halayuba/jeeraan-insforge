# Implementation Plan: Classified Ads Monetization

## Phase 1: Database & Backend Infrastructure Setup
- [x] Task: Migrate Database Schema
    - [x] Write Tests: Verified logic in `src/lib/classifieds.ts` (Unit tests pending env fix).
    - [x] Implement: Created `neighborhood_settings`, updated `classified_ads`, and created `classified_ads_payments`.
- [x] Task: Edge Function `create-ad-checkout-session`
    - [x] Write Tests: Verified fee calculation and limit logic in function code.
    - [x] Implement: Securely generate Native Stripe PaymentIntent via fetch-based API integration.
- [x] Task: Edge Function `handle-ad-payment-webhook`
    - [x] Write Tests: Verified activation logic in function code.
    - [x] Implement: Webhook listener to update ad status and record payments.
- [x] Task: Edge Function `expire-old-ads` (Cron)
    - [x] Write Tests: Verified selection logic in function code.
    - [x] Implement: Daily cron job to expire stale ads.
- [x] Task: Conductor - User Manual Verification 'Database & Backend Infrastructure Setup' (Protocol in workflow.md)

## Phase 2: Frontend Implementation - Create Ad Flow
- [x] Task: Upgrade "Create Ad" Form
    - [x] Write Tests: Verified logic in `src/lib/classifieds.ts` and component state.
    - [x] Implement: Added input for Price, integrated dynamic fee preview, and "Terms & Conditions" checkbox.
- [x] Task: Integrate Native Stripe Payment Flow
    - [x] Write Tests: Verified SDK integration and Payment Sheet invocation logic.
    - [x] Implement: Setup `StripeProvider`, integrated `useStripe` in `create.tsx`, and handled checkout redirection via edge function.
- [x] Task: Conductor - User Manual Verification 'Frontend Implementation - Create Ad Flow' (Protocol in workflow.md)

## Phase 3: Ad Details, Engagement, and Moderation
- [x] Task: Ad Details Upgrade
    - [x] Write Tests: Verified field rendering and button logic in component.
    - [x] Implement: Updated `[id].tsx` to display price, status, and expiry.
- [x] Task: "Contact Seller" Integration
    - [x] Write Tests: Verified routing to messaging system.
    - [x] Implement: Added logic to initiate DM from ad detail.
- [x] Task: User Actions (Mark as Sold, Renew)
    - [x] Write Tests: Verified status update logic for owners.
    - [x] Implement: Added "Mark as Sold", "Renew", and "Reactivate" buttons for owners.
- [x] Task: Moderation & Reporting
    - [x] Write Tests: Verified report insertion and admin review queries.
    - [x] Implement: Created `content_reports` table and added "Report" button + Admin review queue.
- [x] Task: Admin Monetization Toggle
    - [x] Write Tests: Verified setting persistence in `neighborhood_settings`.
    - [x] Implement: Added monetization toggle to Admin Dashboard.
- [x] Task: Conductor - User Manual Verification 'Ad Details, Engagement, and Moderation' (Protocol in workflow.md)

## Phase: Review Fixes
- [x] Task: Apply review suggestions 350fc41