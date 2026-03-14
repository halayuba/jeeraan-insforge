# Jeeraan (Neighbors) – Tech Stack

## Frontend Development
- **Framework:** React Native with [Expo](https://expo.dev)
- **Routing:** [Expo Router](https://docs.expo.dev/router/introduction) (file-based)
- **Language:** [TypeScript](https://www.typescriptlang.org)
- **Styling:** [Vanilla CSS](https://reactnative.dev/docs/style) (built-in React Native StyleSheet)
- **Components:** Modular Vite and React components (Stitch designs)

## Backend and Infrastructure
- **SDK:** [@insforge/sdk](https://www.npmjs.com/package/@insforge/sdk)
- **Database/Auth/Functions:** [InsForge](https://insforge.com)
- **Native Modules:** [Expo SDK](https://docs.expo.dev/versions/latest/) (Camera, ImagePicker, LocalAuth)

## Architecture
- **Structure:** Feature-based organization (src/app/(app)/feature_name).
- **Global Roles:** `user_profiles` table in InsForge for platform-wide roles (e.g., `super_admin`).
- **State Management:** [React Context API](https://react.dev/reference/react/useContext) for global state (e.g., AuthContext).
- **Security:** Biometric authentication with `expo-local-authentication`, featuring a secure bypass for the Web platform.
- **Utilities:** Centralized lib (src/lib) and contexts (src/contexts).
