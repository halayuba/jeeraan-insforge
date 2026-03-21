# Track Specification: Q & A and Advertisements

## Overview
This track introduces two new features to the Jeeraan (Neighbors) application: a Q & A system for neighborhood members to interact with their local admins, and a neighborhood-specific advertisement carousel.

## Functional Requirements

### 1. Q & A Section
- **Home Screen Integration:** Add a "Q & A" card to the Home screen's list of service cards.
- **Q & A Screen:**
  - Displays a list of questions in a collapsible/accordion format.
  - Questions are fetched from the database based on their "public" status.
  - Members can see their own questions (and responses) even if not marked as public.
  - A button to open a form for submitting a new question.
- **Member Question Submission Form:**
  - Fields: Question text, sender name (auto-filled if available from profile), date (auto-generated).
  - Validation: Ensure the question text is not empty.
- **Admin Dashboard Integration:**
  - Admins receive and can view new questions submitted by their neighborhood members.
  - Admins can provide responses to questions.
  - Admins can toggle a "public" boolean flag for each question to make it visible to all members.
  - Admins receive a notification when a new question is submitted.

### 2. Advertisements Section
- **Home Screen Integration:** Add an "Advertisements" card to the Home screen's list of service cards.
- **Advertisements Screen:**
  - Display a carousel of advertisements.
  - Only one image at a time (300px width x 600px height).
  - Carousel transitions between available advertisements.
  - Clicking an advertisement redirects the member to a provided website URL.
  - Advertisements are neighborhood-specific.
- **Super Admin Advertisement Management:**
  - Create/Update/Delete advertisements for specific neighborhoods.
  - Capture advertiser details: Business Name, Industry, Address, Contact Info, Website URL.
  - Upload an advertisement image.

## Non-Functional Requirements
- **Performance:** Carousel should be smooth and performant on mobile devices.
- **Accessibility:** Use semantic components (e.g., accordions) to ensure the Q & A section is accessible.
- **Consistency:** Follow the existing project's UI/UX style and components (Stitch designs).

## Acceptance Criteria
- [ ] Members can navigate to the Q & A screen and view public questions.
- [ ] Members can submit a new question and see their own submitted questions.
- [ ] Admins can see a list of questions, respond, and toggle their public visibility.
- [ ] Members can navigate to the Advertisements screen and see a carousel of neighborhood-specific ads.
- [ ] Clicking an advertisement correctly opens the provided website URL.
- [ ] Super Admins can manage (CRUD) advertisements in their dashboard.

## Out of Scope
- Global advertisements (not neighborhood-specific).
- Complex analytics for advertisement clicks (basic redirection only).
