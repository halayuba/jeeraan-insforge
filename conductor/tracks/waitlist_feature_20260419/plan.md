# Waitlist Implementation Plan

## Phase 1: Database Setup & Infrastructure
- [ ] Task: Create `waitlist_requests` database table in InsForge with the specified columns (`full_name`, `phone_number`, `email_address`, `floorplan_interest`, `created_at`).
- [ ] Task: Apply appropriate RLS policies for `waitlist_requests` (e.g., anonymous insert, admin read).
- [ ] Task: Update Supabase/InsForge database types (`types/supabase.ts` or equivalent) to reflect the new table.
- [ ] Task: Write tests for database interaction (e.g., mock testing the waitlist insertion).
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Database Setup & Infrastructure' (Protocol in workflow.md)

## Phase 2: Public Waitlist Form (`neighborhood-access.tsx`)
- [ ] Task: Add a horizontal divider below the "Request to Join" section.
- [ ] Task: Implement the "Add me to the waitlist" accordion UI using `IconCalendarUser` from `@tabler/icons-react-native`.
- [ ] Task: Implement the waitlist form inputs (Name, Phone, Email, Floorplan dropdown).
- [ ] Task: Implement form validation and submission logic to insert into the `waitlist_requests` table.
- [ ] Task: Add alert and redirection to the splash screen on successful submission.
- [ ] Task: Write component unit tests for the waitlist form (Red Phase, Green Phase, Refactor).
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Public Waitlist Form' (Protocol in workflow.md)

## Phase 3: Admin Dashboard Waitlist View
- [ ] Task: Create a new "Waitlist" tab/section within the Admin Dashboard screens.
- [ ] Task: Implement data fetching from the `waitlist_requests` table.
- [ ] Task: Implement UI to display the waitlist requests in a list or table format.
- [ ] Task: Add sorting logic for "Name" and "Date" (ascending/descending).
- [ ] Task: Add filtering logic for "Floorplan".
- [ ] Task: Write component unit tests for the Admin Waitlist view (sorting, filtering, rendering).
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Admin Dashboard Waitlist View' (Protocol in workflow.md)