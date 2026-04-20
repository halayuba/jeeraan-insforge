# Jeeraan (Neighbors) – Tech Stack

## Frontend Development
- **Framework:** React Native with [Expo](https://expo.dev)
- **Routing:** [Expo Router](https://docs.expo.dev/router/introduction) (file-based)
- **Language:** [TypeScript](https://www.typescriptlang.org)
- **Icons:** [Lucide React Native](https://lucide.dev) & [Tabler Icons](https://tabler-icons.io)
- **Payments:** [Stripe React Native SDK](https://github.com/stripe/stripe-react-native) for in-app monetization.
- **Glass Effects:** `expo-glass-effect` for modern UI aesthetics.
- **Animations:** `react-native-reanimated` for performant, interactive visuals.
- **Typography:** [Manrope](https://fonts.google.com/specimen/Manrope) via `@expo-google-fonts/manrope`.

## Backend & Infrastructure
- **Database & Auth:** [InsForge](https://insforge.com) (PostgreSQL with RLS, Edge Functions, CRON, and S3 Storage).
- **Core Schema Entities:** `neighborhoods`, `user_profiles`, `neighborhood_settings`, `announcements`, `forum_posts`, `classified_ads`, `classified_ads_payments`, `content_reports`, `grievances`, `events`, `waitlist_requests`.
- **Authentication:** Phone-based OTP with `expo-local-authentication`, featuring a secure bypass for the Web platform.
- **Session Management:** Proactive 24-hour session expiry enforcement in `AuthContext`.
- **Utilities:** Centralized lib (src/lib) and contexts (src/contexts).
