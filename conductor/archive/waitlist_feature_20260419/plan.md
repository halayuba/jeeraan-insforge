# Waitlist Implementation Plan

## Phase 1: Database Setup & Infrastructure
- [x] Task: Create `waitlist_requests` database table in InsForge with the specified columns (`full_name`, `phone_number`, `email_address`, `floorplan_interest`, `created_at`).
- [x] Task: Apply appropriate RLS policies for `waitlist_requests` (e.g., anonymous insert, admin read).
- [-] Task: Update Supabase/InsForge database types (`types/supabase.ts` or equivalent) to reflect the new table. (Skipped: No central types file found)
- [x] Task: Write tests for database interaction (e.g., mock testing the waitlist insertion).
- [x] Task: Conductor - User Manual Verification 'Phase 1: Database Setup & Infrastructure' (Protocol in workflow.md)

## Phase 2: Public Waitlist Form (`neighborhood-access.tsx`)
- [x] Task: Add a horizontal divider below the "Request to Join" section.
- [x] Task: Implement the "Add me to the waitlist" accordion UI using `IconCalendarUser` from `@tabler/icons-react-native`.
- [x] Task: Implement the waitlist form inputs (Name, Phone, Email, Floorplan dropdown).
- [x] Task: Implement form validation and submission logic to insert into the `waitlist_requests` table.
- [x] Task: Add alert and redirection to the splash screen on successful submission.
- [x] Task: Write component unit tests for the waitlist form (Red Phase, Green Phase, Refactor).
- [x] Task: Conductor - User Manual Verification 'Phase 2: Public Waitlist Form' (Protocol in workflow.md)

## Phase 3: Admin Dashboard Waitlist View
- [x] Task: Create a new "Waitlist" tab/section within the Admin Dashboard screens.
- [x] Task: Implement data fetching from the `waitlist_requests` table.
- [x] Task: Implement UI to display the waitlist requests in a list or table format.
- [x] Task: Add sorting logic for "Name" and "Date" (ascending/descending).
- [x] Task: Add filtering logic for "Floorplan".
- [x] Task: Write component unit tests for the Admin Waitlist view (sorting, filtering, rendering).
- [x] Task: Conductor - User Manual Verification 'Phase 3: Admin Dashboard Waitlist View' (Protocol in workflow.md)