# Implementation Plan: Jeeraan Direct Messaging (DM)

## Phase 1: Database & Backend Setup
- [ ] Task: Define Schema and RLS Policies for Messages
    - [ ] Write tests for database schema definitions (Conversations, Messages, UserDailyUsage) and RLS.
    - [ ] Create `conversations`, `messages`, and `user_daily_usage` tables in InsForge.
    - [ ] Implement Row Level Security (RLS) ensuring members only access their own neighborhood conversations.
- [ ] Task: Implement Daily Message Limit Logic
    - [ ] Write unit tests for daily message limit logic.
    - [ ] Implement backend validation to reject messages if user exceeds 10 per day.
- [ ] Task: Configure Cloud Storage for Attachments
    - [ ] Create storage bucket for message attachments with proper RLS.
- [ ] Task: Conductor - User Manual Verification 'Database & Backend Setup' (Protocol in workflow.md)

## Phase 2: Navigation & Inbox Structure
- [ ] Task: Add "Direct Messages" Card to Neighborhood Hub
    - [ ] Write unit tests for Home screen DM card rendering and navigation.
    - [ ] Implement DM card UI and hook up `router.push('/(app)/messages')`.
- [ ] Task: Create Inbox UI Skeleton
    - [ ] Write unit tests for Inbox layout (List + Search Bar).
    - [ ] Build basic `messages/index.tsx` screen with empty state.
- [ ] Task: Conductor - User Manual Verification 'Navigation & Inbox Structure' (Protocol in workflow.md)

## Phase 3: Inbox Functionality & Search
- [ ] Task: Fetch and Display Conversations
    - [ ] Write unit tests for fetching active conversations grouped by participant.
    - [ ] Implement `fetchConversations` logic and display in Inbox with unread indicators.
- [ ] Task: Member Search Modal
    - [ ] Write unit tests for searching neighborhood members by name.
    - [ ] Build the Search Modal UI and connect it to InsForge member search queries.
- [ ] Task: Conductor - User Manual Verification 'Inbox Functionality & Search' (Protocol in workflow.md)

## Phase 4: Message Creation & File Upload
- [ ] Task: Build Message Creation Screen
    - [ ] Write unit tests for form validation (text required, max 1 attachment).
    - [ ] Build `messages/[id].tsx` (Thread/Creation View) with Document and Image Picker integration.
- [ ] Task: Implement Sending Logic & Storage Upload
    - [ ] Write unit tests for sending message logic and file upload handling.
    - [ ] Implement the `sendMessage` function, handling file upload to InsForge and inserting the message record.
- [ ] Task: Conductor - User Manual Verification 'Message Creation & File Upload' (Protocol in workflow.md)

## Phase 5: Moderation & Admin Settings
- [ ] Task: Moderator/Admin Full Access RLS
    - [ ] Write unit tests for Moderator/Admin access to any conversation in their neighborhood.
    - [ ] Update RLS policies to grant broad access based on user role.
- [ ] Task: Admin Messaging Settings Panel
    - [ ] Write unit tests for rendering and updating DM settings.
    - [ ] Build Admin UI to toggle DM feature and modify daily limits.
- [ ] Task: Conductor - User Manual Verification 'Moderation & Admin Settings' (Protocol in workflow.md)