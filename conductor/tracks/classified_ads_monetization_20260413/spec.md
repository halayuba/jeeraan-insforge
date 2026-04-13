# Specification: Classified Ads Monetization

## 1. Overview
Implement a tiered monetization model for classified ads within Jeeraan. This feature allows neighborhoods to charge listing fees while maintaining a trusted marketplace for residents. The integration will use the native Stripe SDK for a seamless in-app payment experience.

## 2. Functional Requirements

### 2.1 Pricing Model
Listing fees are calculated based on the item's listed price:
- **$0 – $100:** Free
- **$101 – $200:** $5
- **$201 – $300:** $10
- **$301 – $400:** $15
- **$401 – $500:** $20
- **$501+:** 5% of the listed price

### 2.2 Payment Flow
- **Native Stripe Integration:** For ads with a fee > $0, users must complete payment via an in-app native Stripe UI (e.g., Payment Sheet) before the ad is published.

### 2.3 User Listing Limits
Enforce limits on the number of active ads per user based on their role:
- **Resident Member:** Max 5 active ads
- **Moderator:** Max 10 active ads
- **Neighborhood Admin:** Max 20 active ads

### 2.4 Monetization Controls
- **Admin Dashboard Toggle:** Neighborhood Admins can enable or disable monetization for their neighborhood. If disabled, all listings are free.

### 2.5 Ad Lifecycle & Management
- **Expiration & Renewal:** Ads automatically expire after 30 days to ensure listings stay fresh. Renewing an expired ad is free of charge.
- **Mark as Sold:** Sellers can mark their ads as "Sold" to close the listing and keep the feed accurate.
- **Moderation:** 
  - Moderators can flag or temporarily inactivate ads.
  - Neighborhood Admins can delete any ad, override flags, or block users.
  - **Reporting System:** Any member can flag/report an inappropriate or scam listing.

### 2.6 Social Integration
- **In-App Messaging Tie-In:** Ad details will feature a "Contact Seller" button that opens a direct message with the seller.

### 2.7 Terms & Conditions
- Before posting, users must accept a non-refundable listing fee policy and terms stating Jeeraan does not facilitate the final transaction.

## 3. Data Model Updates
- `neighborhood_settings`: Add `classifieds_monetization_enabled` (boolean).
- `classified_ads`: 
  - `price_numeric` (decimal)
  - `fee_paid` (decimal)
  - `status` (active, inactive, sold, pending_payment, expired)
  - `expires_at` (timestamp)
- `classified_ads_payments`: New table for tracking Stripe transaction logs and statuses.

## 4. Success Criteria
- [ ] Tiered fee calculation logic is correct.
- [ ] Native Stripe payment flow successfully processes transactions and activates ads.
- [ ] Role-based listing limits are strictly enforced.
- [ ] "Mark as Sold", Reporting, and "Contact Seller" flows operate smoothly.
- [ ] Neighborhood Admins can toggle the feature.