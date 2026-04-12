# Specification: Neighborhood Access & Resident Onboarding

## 1. Overview
Implement a secure, private access system for Jeeraan where users must be explicitly invited or approved to join. The workflow covers resident onboarding, invite code processing, super admin neighborhood management, and restricted sign-ups.

## 2. Functional Requirements

### 2.1. Resident Onboarding (Access Jeeraan)
*   **Sign In:** Existing users authenticate using Phone Number and Password.
    *   **Session Expiry:** Strict 24-hour expiration for the InsForge session JWT. Users must log in daily.
*   **Join via Invite Code:**
    *   Users enter a 6-digit invite code received via SMS.
    *   **Validation:** 
        *   Code must be valid for 24 hours.
        *   Code must be one-time use.
        *   Code must match the user's phone number.
    *   **Rules:** A user can only belong to **one** neighborhood. Block registration if the phone number is already tied to a neighborhood.
    *   **Success:** Direct user to "Create Account" to set their password.
*   **Request to Join:**
    *   Users submit a form with Name, Phone Number, and Neighborhood.
    *   **MVP Behavior:** The "Select Neighborhood" dropdown is locked to a single active neighborhood managed by the Super Admin.
    *   **Submission:** Writes a "pending" request to the database for Admin review.

### 2.2. Admin & Super Admin Dashboard
*   **Receiving Requests:** View new pending requests directly within the Admin Dashboard notifications. Admins can approve or decline requests here.
*   **Sending Invites (Proactive & Approvals):**
    *   Admins input Resident Name and Phone Number in the "Send Invites" section.
    *   System generates a random 6-digit Invite Code (bypassing the "pending" state).
    *   Code is persisted in the database with Phone Number, Neighborhood ID, Expiry (24h), and Status ("active").
    *   Triggers an InsForge Edge Function (`send-invite-sms(phoneNumber, code)`) to send an SMS via a provider (e.g., Twilio).
    *   **SMS Template:**
        > Hi [Name], this is your app Admin Bashir from LVW Neighborhood. You’re invited to join our neighborhood on Jeeraan — a private space for updates, discussions, and community decisions.
        > Code: **[CODE]** (valid for a limited time)
        > Join: [Link]
    *   **Failure Handling:** If the SMS fails to send, a toast/alert is displayed to the Admin.

## 3. Non-Functional Requirements
*   **Security:** Invite codes are one-time use, bound to a specific phone number, and expire after 24 hours.
*   **Role-Based Access:** Admin-generated invites bypass approval workflows and are immediately actionable.

## 4. Out of Scope
*   Multi-neighborhood selection for users requesting to join.
*   "Remember Me" persistent sessions extending beyond 24 hours.
*   Fallback email or manual code copying for failed SMS invites.