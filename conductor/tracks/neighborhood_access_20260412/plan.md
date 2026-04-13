# Implementation Plan: Neighborhood Access & Resident Onboarding

## Phase 1: Resident Onboarding (Sign In & Session)
- [x] Task: TDD - Sign In Flow & 24h Session (f3da16a)
    - [ ] Write Tests: Unit tests for existing user sign-in with phone/password and strict 24-hour session JWT expiration.
    - [ ] Implement: Update InsForge auth configuration for 24h session expiry and build Sign In screen logic.
- [x] Task: Conductor - User Manual Verification 'Phase 1: Resident Onboarding (Sign In & Session)' (Protocol in workflow.md) (120ea08)

## Phase 2: Join via Invite Code
- [x] Task: TDD - Invite Code Validation (1f4c391)
    - [ ] Write Tests: Unit tests for validating 6-digit code (validity, unused, matching phone number).
    - [ ] Implement: Edge function or backend logic to validate the code and check if user already belongs to a neighborhood.
- [x] Task: TDD - Join via Code UI (063d9c7)
    - [ ] Write Tests: Component tests for the "Join via Invite Code" screen and error states.
    - [ ] Implement: Build the UI to enter the code, handle validation responses, and redirect to "Create Account".
- [x] Task: Conductor - User Manual Verification 'Phase 2: Join via Invite Code' (Protocol in workflow.md) (063d9c7)

## Phase 3: Request to Join (MVP)
- [x] Task: TDD - Request to Join Form (bec45ed)
    - [ ] Write Tests: Tests for form submission (Name, Phone Number) and single neighborhood selection.
    - [ ] Implement: Build the form UI with a locked/dynamically loaded single active neighborhood.
- [x] Task: TDD - Pending Request Creation (bec45ed)
    - [ ] Write Tests: Backend tests for creating a "pending" join request in the database.
    - [ ] Implement: Connect the form submission to the database to store the pending request.
- [x] Task: Conductor - User Manual Verification 'Phase 3: Request to Join (MVP)' (Protocol in workflow.md) (bec45ed)

## Phase 4: Admin Dashboard & Invite Generation
- [x] Task: TDD - Pending Requests Dashboard (6911e12)
    - [ ] Write Tests: UI tests for displaying pending requests in the Admin Dashboard.
    - [ ] Implement: Fetch and display pending requests.
- [x] Task: TDD - Invite Generation & Persistence (6911e12)
    - [ ] Write Tests: Backend tests for generating a random 6-digit code and persisting it with 24h expiry.
    - [ ] Implement: Logic to handle Admin input (Name, Phone), bypass "pending", generate code, and save to DB.
- [x] Task: Conductor - User Manual Verification 'Phase 4: Admin Dashboard & Invite Generation' (Protocol in workflow.md) (6911e12)

## Phase 5: SMS Delivery via Edge Function
- [x] Task: TDD - `send-invite-sms` Edge Function (1c2bf7c)
    - [ ] Write Tests: Unit tests for the Edge Function triggering SMS delivery and handling failures.
    - [ ] Implement: Create the InsForge Edge Function to send the customized SMS template via provider (e.g., Twilio).
- [x] Task: TDD - Admin SMS Failure Handling (1c2bf7c)
    - [ ] Write Tests: UI tests for displaying a toast/alert when SMS fails.
    - [ ] Implement: Handle the Edge Function response in the Admin UI and display the error toast if necessary.
- [x] Task: Conductor - User Manual Verification 'Phase 5: SMS Delivery via Edge Function' (Protocol in workflow.md) (1c2bf7c)

## Phase: Review Fixes
- [x] Task: Apply review suggestions (445f196)