# **Jeeraan – Product Requirements Document (PRD)**

## **1\. Overview**

**Product Name:** Jeeraan (translates to “Neighbors”)  
 **Type:** SaaS web & mobile application  
 **Purpose:** To enable tenants of an apartment complex or residents of a neighborhood to communicate, collaborate, and engage in community life.

Jeeraan empowers communities by providing a secure, digital space where neighbors can stay informed, share concerns, organize events, resolve issues, and exchange goods or services.

---

## **2\. Objectives**

* Create a private, neighborhood-based communication hub.

* Improve transparency and efficiency in community announcements, voting, and work order management.

* Foster a sense of belonging through forums, events, and classifieds.

* Provide admins with tools to manage, moderate, and scale neighborhood participation.

---

## **3\. Target Users**

1. **Neighborhood Admins**

   * Typically board members, HOA leaders, or property managers.

   * Responsibilities: Create neighborhoods, send invitations, moderate activity, assign privileges, and oversee subscriptions.

2. **Residents (Members)**

   * Verified residents of the neighborhood.

   * Participate in discussions, announcements, voting, classifieds, and issue reporting.

3. **Moderators (Optional)**

   * Delegated members with limited admin rights to help manage invitations, discussions, and content.

---

## **4\. Core Features**

### **4.1 Neighborhood Setup**

* Admin purchases a Jeeraan subscription.

* Admin creates a **Neighborhood Profile** with:

  * Name

  * Address

  * City, State, Zip Code

  * Admin contact info

* Verification system to ensure residents share the same zip code/address.

* Invite system: admin sends **unique invitation links** to neighbors.

* Role upgrade: Admin can promote members to “Inviters” who can also invite new residents.

---

### **4.2 Announcements**

* Create neighborhood-wide announcements (e.g., crime alerts, events, safety concerns).

* Announcement categories: Security, Events, Maintenance, General Info.

* Notifications: push/email for urgent updates.

* Comments enabled/disabled at admin’s discretion.

---

### **4.3 Voting / Polls**

* Create polls for:

  * Community decisions (e.g., upgrades, budgets).

  * Elections (board members).

  * Fun/social votes (e.g., “Yard of the Season”).

* Voting settings:

  * Anonymous or public results.

  * Single-choice or multiple-choice options.

  * Time-bound voting windows.

---

### **4.4 Work Orders & Issue Reporting**

* Residents can:

  * Submit issues about maintenance or repairs.

  * Attach photos/videos for clarity.

  * Track status (Submitted → In Progress → Resolved).

* Admins/maintenance teams can update progress and add notes.

* Residents can comment or confirm resolution.

---

### **4.5 Forum**

* Discussion boards categorized by topics (e.g., Security, Social, Gardening, Kids’ Activities).

* Thread-based conversation model with replies, reactions, and moderation.

* Search & filter by topic/date.

---

### **4.6 Classified Ads**

* Residents can post **items for sale, rent, or giveaway**.

* Simple listing: Title, Description, Photos, Price (optional), Contact method.

* Categorization: Furniture, Electronics, Vehicles, Services, Free items.

* Expiry date for listings to avoid clutter.

---

## **5\. User Experience Flow**

1. **Admin Onboarding:**

   * Purchase subscription → Create neighborhood profile → Send invites.

2. **Resident Onboarding:**

   * Click invite link → Verify address/zip code → Create account → Join neighborhood.

3. **Participation:**

   * View announcements, vote on polls, post in forums, report work orders, browse/post classifieds.

4. **Admin Management:**

   * Moderate discussions, manage users, approve work orders, monitor subscription.

---

## **6\. Technical Requirements**

* **Platform:** Web (desktop/mobile) \+ Mobile App (iOS/Android).

* **Authentication:** Email/phone verification, optional 2FA.

* **Data Access Control:**

  * Private neighborhoods (members only).

  * Role-based permissions (Admin, Moderator, Member).

* **Notifications:** Push, email, SMS (optional for urgent alerts).

* **Scalability:** Support multiple neighborhoods per subscription (future roadmap).

* **Security:** Encrypted communication, data privacy compliance (GDPR/CCPA).

---

## **7\. Monetization & Pricing**

* Subscription-based model paid by the neighborhood admin/HOA.

* Tiers:

  * **Basic:** Core features (announcements, voting, forums).

  * **Standard:** \+ Work orders, classifieds.

  * **Premium:** \+ Multiple admins, analytics, extended storage, multi-neighborhood support.

---

## **8\. Roadmap (Phases)**

**Phase 1 (MVP):**

* Admin setup & invitations

* Announcements

* Voting/Polls

* Forum

**Phase 2:**

* Work orders with photo uploads

* Classified ads

**Phase 3:**

* Multi-neighborhood support

* Analytics dashboard for admins

* SMS notifications

* API integrations (maintenance vendor systems, payment systems)

---

## **9\. Success Metrics**

* **Adoption:** % of invited residents who register.

* **Engagement:** Monthly active users (posts, votes, announcements read).

* **Resolution:** Avg. time to resolve work orders.

* **Retention:** Neighborhoods renewing subscriptions.

