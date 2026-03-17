# Specification: Voting and Polls Management

## Overview
The Voting and Polls system allows community admins to gather resident input on decisions and hold elections for board members. Residents can view active polls, read candidate profiles, and submit their votes.

## Features
1. **Election Management**:
   - Admins define open board positions and voting dates.
   - Residents can submit their candidate profiles to run for a position.
   - Ballot screens allow residents to select a candidate and cast a vote.
2. **General Polls**:
   - Admins can create polls for various community decisions.
   - Polls have a title, description, and end time.
   - Residents can vote on polls and see real-time results (if configured).
3. **Multi-tenancy**:
   - All data (polls, positions, elections) must be scoped to a specific neighborhood via `neighborhood_id`.

## Database Schema

### `polls`
- `id` (UUID, PK)
- `title` (TEXT, NOT NULL)
- `description` (TEXT)
- `end_time` (TIMESTAMPTZ)
- `neighborhood_id` (UUID, FK to neighborhoods)
- `type` (TEXT, default 'general')
- `created_by` (UUID, FK to auth.users)
- `created_at` (TIMESTAMPTZ)

### `candidates`
- `id` (UUID, PK)
- `poll_id` (UUID, FK to polls)
- `user_id` (UUID, FK to auth.users)
- `bio` (TEXT)
- `assets` (TEXT)
- `image_url` (TEXT)
- `created_at` (TIMESTAMPTZ)

### `poll_votes`
- `id` (UUID, PK)
- `poll_id` (UUID, FK to polls)
- `user_id` (UUID, FK to auth.users)
- `candidate_id` (UUID, FK to candidates, NULL for general polls if using a different option table)
- `created_at` (TIMESTAMPTZ)
- *Constraint*: `UNIQUE (user_id, poll_id)` to prevent double voting.

### `neighborhood_election_info`
- `id` (UUID, PK)
- `neighborhood_id` (UUID, FK to neighborhoods, UNIQUE)
- `voting_date` (DATE)
- `created_at` (TIMESTAMPTZ)

### `board_positions`
- `id` (UUID, PK)
- `neighborhood_id` (UUID, FK to neighborhoods)
- `title` (TEXT, NOT NULL)
- `description` (TEXT)
- `is_open` (BOOLEAN, default true)
- `created_at` (TIMESTAMPTZ)

## Security
- Residents can only view polls and elections for their own neighborhood.
- Only admins (identified via `user_profiles.global_role` or `user_neighborhoods.role`) can create/manage polls and election info.
- Voting is restricted to approved members of the neighborhood.
