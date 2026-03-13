# User Stories for Jeeraan

| Requirement ID | Description | User Story | Expected Behavior/Outcome |
|----------------|-------------|------------|----------------------------|
| **Authentication & Onboarding** | | | 
| AUTH-01 | Phone Number Sign-In | As a new resident, I want to sign in using my phone number, so I can quickly join my neighborhood without needing an email. | System sends SMS OTP via Firebase Auth; user verifies and creates account. |
| AUTH-02 | Social Login (Google/Apple) | As a user, I want to sign in using Google or Apple, so I can avoid typing credentials manually. | OAuth flow completes successfully; user profile is created with verified identity. |
| AUTH-03 | Verified Account Creation | As a user, I want my account linked to my phone/social identity, so it’s secure and traceable. | Each account has a unique UID tied to authentication method and stored securely. |
| AUTH-04 | First-Time Onboarding Flow | As a new user joining via invite link, I want to complete onboarding in one flow, so I can become active quickly. | After auth, user is guided through zip code entry and neighborhood join process. |
| **HN-01** | **Neighborhood Setup** | | |
| HN-01 | Create Neighborhood Profile | As an admin, I want to create a neighborhood profile with name, address, and zip code, so residents can verify they belong. | Admin inputs details; data is saved in database and used for verification. |
| HN-02 | Verify Zip Code Match | As a resident, I want to enter my zip code during onboarding, so the system confirms I’m part of this community. | System compares entered zip with neighborhood’s zip; mismatch blocks access. |
| HN-03 | Send Invite Links | As an admin, I want to generate and share unique invitation links, so I can control who joins. | Admin dashboard provides copyable invite URL with expiration and usage limits. |
| HN-04 | Redeem Invite Link | As a resident, I want to click an invite link and join directly, so the process is frictionless. | Link opens app or prompts install; auto-fills neighborhood context. |
| HN-05 | Assign Inviter Role | As an admin, I want to promote trusted members to “Inviters,” so they can help grow the community. | Admin selects member → assigns "inviter" role; user gains invite privileges but not full admin rights. |
| **ROLE-01** | **Roles & Permissions** | | |
| ROLE-01 | Define User Roles | As the platform, I need to support distinct roles: Admin, Inviter, Member, Board Member, so permissions are enforced. | Database stores `role` field per user; UI and API respect role-based access. |
| ROLE-02 | Restrict Admin Actions | As a non-admin user, I should not be able to create polls or manage members, so only authorized users control critical functions. | Features like poll creation, approvals, and invites are hidden/disabled for non-admins. |
| ROLE-03 | Display Board Member Status | As a resident, I want to see which members are Board Members, so I know who represents the community. | Board Members have badge/icon in member list and profiles. |
| **POLL-01** | **Voting & Polls** | | |
| POLL-01 | Create a New Poll | As an admin, I want to create a poll for decisions or elections, so I can gather resident input. | Form allows title, description, options, duration, and choice type (single/multiple). |
| POLL-02 | Configure Poll Settings | As an admin, I want to set whether a poll allows multiple choices and has a time limit, so I can tailor it to the use case. | Settings saved with poll; enforced during voting. |
| POLL-03 | View Active Polls | As a member, I want to see all open polls, so I can participate in community decisions. | Dashboard shows list of active polls with progress indicators. |
| POLL-04 | Submit a Vote | As an approved member, I want to vote once per poll, so my voice counts fairly. | System accepts vote only if user is approved and hasn’t voted; records selection and logs device/IP. |
| POLL-05 | Prevent Duplicate Votes | As the system, I must ensure each eligible user votes only once per poll, so results are accurate. | Unique constraint on `(user_id, poll_id)` prevents duplicates. |
| POLL-06 | View Poll Results | As a user, I want to see real-time results after voting, so I understand community sentiment. | Results page shows option counts; accessible post-vote (non-anonymous mode). |
| POLL-07 | Close Poll Automatically | As the system, I want polls to close at the scheduled end time, so deadlines are respected. | Background job or listener closes poll status when `endsAt` timestamp is reached. |
| POLL-08 | Approve Voter Eligibility | As an admin, I want to approve members before they can vote, so I maintain control over participation. | Member profile shows “Pending Approval”; admin toggles approval status. |
| **MEM-01** | **Member Management** | | |
| MEM-01 | View All Members | As an admin or inviter, I want to see all residents in the neighborhood, so I can manage the community. | List displays names, roles, join date, and approval status. |
| MEM-02 | Search and Filter Members | As an admin, I want to search by name or filter by role, so I can find specific users quickly. | Search bar and dropdown filters update member list dynamically. |
| MEM-03 | Edit Member Role | As an admin, I want to change a member’s role (e.g., promote to Inviter), so responsibilities can evolve. | Role update reflects immediately in database and UI. |
| **SEC-01** | **Security & Integrity** | | |
| SEC-01 | Log Voting Device/IP | As the system, I want to record device fingerprint and IP address when a vote is cast, so I can audit suspicious activity. | Metadata stored with each vote entry for forensic review. |
| SEC-02 | Enforce Approved Voters Only | As the system, I must block unapproved members from voting, so only legitimate residents influence outcomes. | Vote submission fails if `approvedByAdmin === false`. |
| SEC-03 | Protect Invite Links | As an admin, I want invite links to expire or limit uses, so they don’t stay open forever. | Link deactivates after expiry date or max uses reached. |
| **ADM-01** | **Admin Controls** | | |
| ADM-01 | Access Admin Dashboard | As an admin, I want a centralized panel to manage the neighborhood, so I can perform tasks efficiently. | Dashboard includes sections for members, polls, invites, and settings. |
| ADM-02 | Monitor Poll Activity | As an admin, I want to see who has voted and when, so I can encourage participation. | Poll detail view includes voter list and timestamps. |
| ADM-03 | Archive Past Polls | As an admin, I want old polls moved to archive, so the active list stays clean. | Closed polls appear under “Past Polls” tab; not editable. |
| ADM-04 | Resend Invitations | As an admin, I want to regenerate or resend invite links, so I can re-engage inactive neighbors. | Option to copy existing link or create new one with updated settings. |
| **FTR-01** | **Future Enhancements (Phase 2+)** | | |
| FTR-01 | Anonymous Poll Results | As an admin, I want to hide voter identities in results, so sensitive topics remain private. | Toggle enables anonymous display (though system still logs internally). |
| FTR-02 | Event Calendar | As a resident, I want to view and RSVP to community events, so I can stay involved. | Calendar view shows upcoming events; users can mark attendance. |
| FTR-03 | Classifieds & Services | As a neighbor, I want to post items for sale or services offered, so I can engage locally. | Form supports title, description, image, price, category. |
| FTR-04 | Discussion Forums | As a resident, I want to post questions or announcements, so I can communicate with others. | Threaded feed allows replies and likes. |
| FTR-05 | Push Notifications | As a user, I want to receive alerts about new polls or event reminders, so I don’t miss important updates. | Firebase Cloud Messaging delivers timely notifications. |