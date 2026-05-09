# Plan: Fix Profile Field Height and Global Focus Borders

## Objective
Fix the height rendering issue in the Profile screen's Personal Information fields and apply a consistent light gray color to input borders (focus outlines) globally across the app.

## Proposed Solution

### 1. Fix Profile Field Height & Width
The height issue occurred because `flex: 1` was applied to the global `textInput` style to fix the width of Social Links. However, in the Personal Information section (which uses a column layout), `flex: 1` caused the input to collapse to its minimum height, ignoring the `height: 48` setting.
- **Action:** Remove `flex: 1` from the `textInput` style in `src/app/(app)/profile.tsx`.
- **Action:** Create a new `socialTextInput: { flex: 1 }` style.
- **Action:** Apply `style={[styles.textInput, styles.socialTextInput]}` to the Social Links inputs so they remain full width in their row layout, while allowing the Personal Information fields to properly respect their `height: 48` setting.

### 2. Global Input Focus Border (Web)
The yellow "border" seen around active inputs is the browser's default focus outline (which varies by browser but is often yellow or blue). Since this affects all inputs on the web platform, modifying every single `TextInput` component is error-prone.
- **Action:** Inject a global CSS style block in `src/app/_layout.tsx` (only active when `Platform.OS === 'web'`).
- **Action:** This style will target `input:focus, textarea:focus` and set `outline-color: #cbd5e1 !important;` (a consistent light gray), solving the issue globally with zero impact on native iOS/Android builds.

## Expected Outcome
- The Personal Information fields will visibly expand to 48px in height.
- The Social Links will remain full-width.
- All inputs across the entire web application will have a refined, light gray focus outline instead of the default browser colors.