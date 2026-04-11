# Specification: Jeeraan Direct Messaging (DM)

## 1. Overview
The Jeeraan Direct Messaging (DM) feature enables verified members to send private, asynchronous 1:1 messages to other members within their own neighborhood. This provides a safe, moderated channel for communication related to community life, classifieds, or general inquiries without exposing personal contact information.

## 2. Functional Requirements
### 2.1 Entry Point & Inbox
- **Neighborhood Hub Entry:** A "Direct Messages" card on the Home screen (Neighborhood Hub) that links to the user's Inbox.
- **Inbox View:** Displays a list of existing 1:1 conversations, grouped by participant.
  - Shows the other member's name, a preview of the last message, timestamp, and an unread indicator.
- **Search Modal:** A search bar at the top of the Inbox allowing users to search for members *within their neighborhood*. Clicking a search result opens a Message Creation screen.

### 2.2 Messaging & Attachments
- **1:1 Async Messaging:** Users can only send text and an optional attachment (max 1 file per message) to a single recipient. Group chats are not supported.
- **Attachment Sources:** Users can attach files via Document Picker (PDF, DOC) or Image Library (PNG, JPG) up to a size limit (e.g., 5-10MB).
- **Spam Prevention:** Hard limit of 10 messages per user per day.
- **In-App Notifications:** New messages trigger an unread badge/indicator within the app (no Push or Email notifications for MVP).

### 2.3 Access Control & Moderation
- **Neighborhood Isolation:** Members can only search for and message other members within the exact same `neighborhood_id`.
- **Moderator/Admin Access:** Neighborhood Admins and Moderators have full access to view, flag, and delete all DMs within their neighborhood for safety and compliance.
- **Settings:** Admins can enable/disable messaging, configure allowed file types/sizes, and adjust the daily message limit (default 10).

## 3. Non-Functional Requirements
- **Performance:** Inbox and message loading must be fast; attachment uploads must happen efficiently via InsForge cloud storage.
- **Network Dependency:** MVP requires an active network connection (no offline caching).
- **Security:** Attachments must be stored securely with access control; the backend must rigorously validate the sender's and recipient's neighborhood.

## 4. Acceptance Criteria
- [ ] A member can navigate to the DM Inbox from the Home screen.
- [ ] A member can search for a neighbor and initiate a new conversation.
- [ ] A member can send a text message with an optional document or image attachment.
- [ ] A member cannot exceed the daily message limit of 10 messages.
- [ ] A member receives an in-app unread indicator when receiving a new message.
- [ ] A Moderator or Neighborhood Admin can view and delete any message within their neighborhood.
- [ ] A member cannot message a user in a different neighborhood.

## 5. Out of Scope
- Group chats
- Real-time/WebSocket features (typing indicators, online status, instant delivery without polling/refresh)
- Offline caching
- Push notifications or Email alerts
- Message reactions or direct camera capture