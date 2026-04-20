# Initial Concept
Jeeraan (Neighbors) – A SaaS web and mobile application designed to enable residents of a neighborhood to communicate, collaborate, and engage in community life.

# Jeeraan (Neighbors)

## Product Vision
Jeeraan is a SaaS web and mobile application designed to empower communities by providing a secure, digital space where neighbors can stay informed, share concerns, organize events, resolve issues, and exchange goods or services. It aims to improve transparency and efficiency in community life through a centralized communication hub.

## Target Users
1. **Neighborhood Admins:** Board members, HOA leaders, or property managers who manage neighborhood profiles, invitations, and moderation. They create neighborhoods through a dedicated onboarding flow.
2. **Residents (Members):** Verified residents who participate in discussions, voting, classifieds, and issue reporting.
3. **Super Admin:** Platform owner with global access across all neighborhoods.
4. **Moderators:** Delegated members who assist in managing activity and content.

## Core Features
### 1. Neighborhood Management
- **Neighborhood Admin Onboarding:** Dedicated wizard for creating a new neighborhood account and community profile.
- Secure neighborhood creation and address verification.
- **Private & Verified Access:** Invitation-only access system using 6-digit codes sent via SMS. Residents must be explicitly approved or proactively invited by an admin.
- **Waitlist Management:** Allow potential residents to request joining a waitlist for specific neighborhoods with floorplan interests.
- **Restricted Onboarding:** Multi-neighborhood restriction (one neighborhood per user) and phone-based identity verification.
- Role-based access control (Global: Super Admin; Local: Admin, Moderator, Member).

### 2. Community Communication
- **Announcements:** Neighborhood-wide updates for security, events, and maintenance.
- **Forum:** Topic-based discussion boards (Security, Social, Gardening, etc.).
- **Direct Messaging:** Private, asynchronous 1:1 messaging with attachment support for secure member communication.
- **Q & A:** A dedicated section for members to ask questions to neighborhood admins and view community-wide responses.
- **Events:** Calendar for community activities and gatherings.

### 3. Engagement and Governance
- **Voting/Polls:** Digital ballots for community decisions and elections.
- **Classified Ads:** Marketplace for residents to buy, sell, or giveaway items. Features a tiered monetization model with native Stripe integration, automated expiration, and reporting tools.
- **Gamified Engagement Engine:** 
  - **Points & Levels:** Members earn points for meaningful actions (announcements, invites, feedback, etc.).
  - **Leaderboard:** "Top Neighbors" ranking to encourage participation.
  - **Role Promotion:** Path for active members to become eligible for Moderator roles.
  - **Admin Configurable:** Neighborhood admins can dynamically define point values and level thresholds.
- **Advertisements:** A neighborhood-specific carousel of advertisements from local business partners.

### 4. Service and Operations
- **Service Orders (Grievances):** Submit and track maintenance or repair issues with photo/video attachments.
- **Work Order Management:** Status tracking from submission to resolution.

## Technical Goals
- **Platform:** Cross-platform (iOS, Android, and Web) using React Native and Expo.
- **Infrastructure:** Scalable backend using InsForge for database, auth, and notifications.
- **Security:** Private, verified neighborhood access with robust data privacy.
