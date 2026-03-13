import { createClient } from '@insforge/sdk';

// Replace with your InsForge project configuration
// These values can be found in your .insforge/project.json or InsForge dashboard
// Alternatively, load them from your Expo environment variables.
const insforgeUrl = process.env.EXPO_PUBLIC_INSFORGE_URL || 'https://5gvd6vyw.us-east.insforge.app';
const insforgeAnonKey = process.env.EXPO_PUBLIC_INSFORGE_ANON_KEY || 'your-anon-key-here'; // We must provide a valid anon key

export const insforge = createClient({
  baseUrl: insforgeUrl,
  anonKey: insforgeAnonKey,
});
