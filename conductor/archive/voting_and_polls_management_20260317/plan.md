# Implementation Plan: Voting and Polls Management

## Objective
Complete the voting system by seeding initial data, fixing the schema for multi-tenancy, and adding admin tools to manage polls.

## Key Files & Context
- `src/app/(app)/voting/index.tsx`: Main voting dashboard.
- `src/app/(app)/voting/[poll_id]/ballot.tsx`: Ballot screen for a specific poll.
- `src/app/(app)/admin/index.tsx`: Admin dashboard for community management.
- `src/contexts/AuthContext.tsx`: Provides user context (role, neighborhood_id).
- `insforge/schema_voting_info.sql`: Database schema for voting (already applied).

## Implementation Steps

### Phase 1: Database Refinement & Seeding
- [x] Task: Add `neighborhood_id` and `type` to `polls` table.
    - [x] Add `neighborhood_id` UUID column with FK to `neighborhoods(id)`.
    - [x] Add `type` TEXT column (values: 'election', 'general').
- [x] Task: Update RLS policies for `polls`.
    - [x] Restrict `SELECT` on `polls` to members of the same neighborhood.
- [x] Task: Seed initial voting data via CLI.
    - [x] Seed Board Positions (President, VP, Treasurer, Secretary) for Loma Vista West.
    - [x] Seed Election Info (Voting Date: 2026-11-15).
    - [x] Seed one `Board Member Election 2026` poll (type: 'election').
    - [x] Seed one `Candidate` for the board election (using current user).
    - [x] Seed one `Yard of the Season - Spring 2026` poll (type: 'general').

### Phase 2: Admin Dashboard Enhancements
- [x] Task: Implement Poll Creation form.
    - [x] Add a section in `src/app/(app)/admin/index.tsx` for "General Polls".
    - [x] Implement form to create a new poll (Title, Description, End Time).
    - [x] Ensure `neighborhood_id` is automatically set from `AuthContext`.
- [x] Task: Verify Election Management.
    - [x] Ensure Board Positions and Voting Date management works as expected.

### Phase 3: Frontend Voting Dashboard Updates
- [x] Task: Implement neighborhood filtering.
    - [x] Update `fetchPolls` in `src/app/(app)/voting/index.tsx` to filter by `neighborhoodId`.
- [x] Task: Dynamic "Run for Board" link.
    - [x] Update `VotingIndex` to find the latest 'election' type poll and use its ID for the "Run for Board" CTA instead of hardcoded `election-2024`.
- [x] Task: UI Improvements for Poll List.
    - [x] Distinguish between 'election' and 'general' polls in the list (e.g., badges).

## Verification & Testing
- [x] Backend: Use `insforge db query` to verify data presence and RLS enforcement.
- [x] UI: Verify Voting Dashboard correctly displays election info, board positions, and active polls.
- [x] UI: Verify Ballot screen correctly displays candidates for the seeded election.
- [x] UI: Verify Admin Dashboard correctly creates new polls that appear for the neighborhood.
- [x] UI: Verify the "Run for Board" flow works end-to-end with the dynamic poll ID.
