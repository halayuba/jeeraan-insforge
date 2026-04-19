# Waitlist Feature Specification

## 1. Overview
Allow non-residents to request joining a waitlist for "Loma Vista West" via a new section on the Neighborhood Access screen. Ensure admins can view, sort, and filter these waitlist requests from the Admin Dashboard.

## 2. Functional Requirements
### 2.1 Public Waitlist Form (`src/app/(auth)/neighborhood-access.tsx`)
- Add a horizontal divider below the "Request to Join" accordion.
- Add a new dropdown accordion titled "Add me to the waitlist" using the `IconCalendarUser` icon from Tabler Icons.
- When expanded, display the informative text: "If you are not a resident of Loma Vista West but would like to be added to the waitlist, please fill out the form below."
- Form fields:
  - Full Name (Text input)
  - Phone Number (Text input)
  - Email Address (Text/Email input)
  - Interested in - Floorplans (Select dropdown) with the 5 predefined options: "Bolero: 2 Bedroom, 1 1/2 Townhouse", "Alamo: 2 Bedroom, 1 bath Ranch", "Catalina: 3 Bedroom, 1 3/4 Bath Townhouse", "Durango: 3 Bedroom, 1 3/4 Bath Duplex with Garage", "Any of the above".
- Include a "Submit Request" button matching the style of existing submit buttons.
- On successful submission: Display a success alert and redirect the user back to the splash screen.

### 2.2 Database Changes (InsForge)
- Create a new table `waitlist_requests`.
- Columns: `id` (UUID, Primary Key), `full_name` (Text), `phone_number` (Text), `email_address` (Text), `floorplan_interest` (Text), `created_at` (Timestamp with time zone).

### 2.3 Admin Dashboard Waitlist Section
- Add a new "Waitlist" view/tab in the Admin Dashboard.
- Display a list of waitlist requests.
- Functionality:
  - Sort ascending/descending by "Name".
  - Sort ascending/descending by "Date".
  - Filter by "Floorplan".
- This is a view-only list (no status management at this time).

## 3. Acceptance Criteria
- [ ] Users can expand the "Add me to the waitlist" accordion and fill out the new fields.
- [ ] Submitted waitlist requests are correctly inserted into the `waitlist_requests` table.
- [ ] Users are redirected to the splash screen upon successful submission.
- [ ] Admins can view, sort (by Name/Date), and filter (by Floorplan) the waitlist requests on their dashboard.