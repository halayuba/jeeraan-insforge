# Implementation Plan: Jeeraan Direct Messaging (DM)

## Phase 1: Database & Backend Setup
- [x] Task: Define Schema and RLS Policies for Messages
    - [x] Write tests for database schema definitions (Conversations, Messages, UserDailyUsage) and RLS.
    - [x] Create `conversations`, `messages`, and `user_daily_usage` tables in InsForge.
    - [x] Implement Row Level Security (RLS) ensuring members only access their own neighborhood conversations.
- [x] Task: Implement Daily Message Limit Logic
    - [x] Write unit tests for daily message limit logic.
    - [x] Implement backend validation to reject messages if user exceeds 10 per day.
- [x] Task: Configure Cloud Storage for Attachments
    - [x] Create storage bucket for message attachments with proper RLS.
- [x] Task: Conductor - User Manual Verification 'Database & Backend Setup' (Protocol in workflow.md)

## Phase 2: Navigation & Inbox Structure
- [x] Task: Add "Direct Messages" Card to Neighborhood Hub
    - [x] Write unit tests for Home screen DM card rendering and navigation.
    - [x] Implement DM card UI and hook up `router.push('/(app)/messages')`.
- [x] Task: Create Inbox UI Skeleton
    - [x] Write unit tests for Inbox layout (List + Search Bar).
    - [x] Build basic `messages/index.tsx` screen with empty state.
- [x] Task: Conductor - User Manual Verification 'Navigation & Inbox Structure' (Protocol in workflow.md)

## Phase 3: Inbox Functionality & Search
- [x] Task: Fetch and Display Conversations
    - [x] Write unit tests for fetching active conversations grouped by participant.
    - [x] Implement `fetchConversations` logic and display in Inbox with unread indicators.
- [x] Task: Member Search Modal
    - [x] Write unit tests for searching neighborhood members by name.
    - [x] Build the Search Modal UI and connect it to InsForge member search queries.
- [x] Task: Conductor - User Manual Verification 'Inbox Functionality & Search' (Protocol in workflow.md)

## Phase 4: Message Creation & File Upload
- [x] Task: Build Message Creation Screen
    - [x] Write unit tests for form validation (text required, max 1 attachment).
    - [x] Build `messages/[id].tsx` (Thread/Creation View) with Document and Image Picker integration.
- [x] Task: Implement Sending Logic & Storage Upload
    - [x] Write unit tests for sending message logic and file upload handling.
    - [x] Implement the `sendMessage` function, handling file upload to InsForge and inserting the message record.
- [x] Task: Conductor - User Manual Verification 'Message Creation & File Upload' (Protocol in workflow.md)

## Phase 5: Moderation & Admin Settings
- [x] Task: Moderator/Admin Full Access RLS
    - [x] Write unit tests for Moderator/Admin access to any conversation in their neighborhood.
    - [x] Update RLS policies to grant broad access based on user role.
- [x] Task: Admin Messaging Settings Panel
    - [x] Write unit tests for rendering and updating DM settings.
    - [x] Build Admin UI to toggle DM feature and modify daily limits.
- [x] Task: Conductor - User Manual Verification 'Moderation & Admin Settings' (Protocol in workflow.md)

## Phase: Review Fixes
- [x] Task: Apply review suggestions 1931f30