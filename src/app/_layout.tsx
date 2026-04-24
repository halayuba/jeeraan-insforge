import { Slot } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useAuthStore } from "../store/useAuthStore";
import { ToastProvider } from "../contexts/ToastContext";
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { 
  Manrope_400Regular, 
  Manrope_500Medium, 
  Manrope_600SemiBold, 
  Manrope_700Bold 
} from '@expo-google-fonts/manrope';
import { useMemo, useEffect } from 'react';
import { StripeProvider } from '../lib/stripe';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const initializeAuth = useAuthStore(state => state.initialize);

  const fontsConfig = useMemo(() => ({
    'Manrope-Regular': Manrope_400Regular,
    'Manrope-Medium': Manrope_500Medium,
    'Manrope-SemiBold': Manrope_600SemiBold,
    'Manrope-Bold': Manrope_700Bold,
  }), []);

  const [loaded, error] = useFonts(fontsConfig);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ToastProvider>
        <StripeProvider
          publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""}
        >
          <Slot />
        </StripeProvider>
      </ToastProvider>
    </SafeAreaProvider>
  );
}
