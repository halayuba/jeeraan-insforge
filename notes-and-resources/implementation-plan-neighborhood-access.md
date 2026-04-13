# Implementation Plan: Neighborhood Access & Resident Onboarding

## 1. Overview
The objective is to implement a secure, private access system for Jeeraan where users must be explicitly invited or approved to join. The workflow encompasses resident onboarding, invite code processing, super admin neighborhood management, and restricted sign-ups.

## 2. Resident Onboarding Workflow
When a user taps "Access Jeeraan" on the Splash Screen, they will be directed to a new **Neighborhood Access Screen**.

### Option A: Already a Member (Sign In)
- User enters their **Phone Number** and **Password** to authenticate.
- **Session Management**: To enforce frequent authentication (daily), we will configure the InsForge session JWT to expire every 24 hours. The user's token will naturally expire, requiring them to sign in again after a day.

### Option B: Join via Invite Code
- The user enters a 6-digit invite code they received via **SMS**.
- **Validation constraints**: 
  - Code must not be expired (24h validity).
  - Code must be unused (one-time use).
  - Code must match the specific account identifier (**phone number**).
- **Rule Enforcement**: A user can only belong to **one** neighborhood. The system will block registration if their phone number is already tied to a neighborhood.
- Once validated, the user is directed to the "Create Account" screen to set their password (tied to their phone number) and finalize joining.

### Option C: Request to Join
- The user submits a form: Name, Phone Number, and Selected Neighborhood.
- **MVP Behavior**: The "Select Neighborhood" dropdown will be locked to or dynamically load the *single active neighborhood* managed by the Super Admin.
- Submitting the form writes a "pending" request to the database for admin review.

## 3. Super Admin Workflow & Dashboard
The Super Admin will have a dedicated mobile dashboard based on the provided HTML design to manage the community.

### Receiving Requests to Join
- **Approach**: **Dashboard Notifications ONLY**. The Super Admin will see new pending requests directly within the Admin Dashboard (without any extra SMS/Email clutter). The dashboard will provide a centralized UI to approve or decline these requests.

### Sending Invite Codes
- **Approach**: We will use **SMS**. When a request is approved, or an admin manually invites a resident, an InsForge Edge Function will trigger an SMS provider (like Twilio) to deliver the unique 6-digit code directly to the resident's phone number.

## 🔄 **Sending Invite Codes (Updated Workflow)**

### **Super Admin & Neighborhood Admin – Send Invite Workflow**

Both **Super Admin** and **Neighborhood Admin** can proactively invite residents directly from the dashboard.

#### **Step 1: Access Dashboard**

* Admin navigates to:

  * **Dashboard**, or
  * **Analytics tab** from the bottom navigation bar

---

#### **Step 2: Enter Invite Details**

* In the **“Send Invites”** section:

  * Admin inputs:

    * **Resident Name**
    * **Phone Number**

---

#### **Step 3: Generate Invite Code (Bypass Pending State)**

* Since the user initiating the request has an **Admin role**:

  * The request **does NOT go into “Pending”**
  * System automatically generates a:

    * **Random 6-digit Invite Code**

```ts
generateInviteCode() → e.g., 482913
```

---

#### **Step 4: Persist Invite Code**

* The system stores the invite in the database with:

  * Phone Number
  * Invite Code
  * Associated Neighborhood
  * Expiration timestamp (24 hours)
  * Status: `active`

```ts
Invite {
  phoneNumber
  code
  neighborhoodId
  expiresAt
  status: "active"
}
```

---

#### **Step 5: Send SMS via Edge Function**

* System triggers **InsForge Edge Function**:

```plaintext
send-invite-sms(phoneNumber, code)
```

* The function sends:

  * SMS invite message
  * 6-digit invite code
  * Join link

---

#### **Step 6: Recipient Experience**

* Resident receives SMS:

  * Invite message
  * Code
  * Link to join

* They proceed through:

  * **“Join via Invite Code”** flow (see Section 2)

---

## ✅ **Key Behaviors & Rules**

* Invite codes are:

  * **One-time use**
  * **Bound to phone number**
  * **Expire after 24 hours**

* Admin-generated invites:

  * **Bypass approval workflow entirely**
  * Are **immediately actionable**

* Fully compatible with:

  * Multi-neighborhood (multi-tenant) structure
  * Role-based access control

---

## 💡 **Why This Matters (Product Insight)**

This workflow:

* Reduces friction for admins onboarding neighbors
* Keeps onboarding **fast and controlled**
* Ensures **trust (SMS + code + phone binding)**
* Eliminates unnecessary “pending” delays

---

Here is the **SMS** that I would like to include:

---

> Hi [Name], this is your app Admin Bashir from LVW Neighborhood.
> You’re invited to join our neighborhood on Jeeraan — a private space for updates, discussions, and community decisions.
>
> Code: **[CODE]** (valid for a limited time)
> Join: [Link]


