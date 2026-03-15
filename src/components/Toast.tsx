import React, { useEffect } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  View,
  Dimensions,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  onHide: () => void;
  duration?: number;
}

const { width } = Dimensions.get('window');

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'success',
  onHide,
  duration = 3000,
}) => {
  const insets = useSafeAreaInsets();
  const opacity = React.useRef(new Animated.Value(0)).current;
  const translateY = React.useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();

    const hideTimeout = setTimeout(() => {
      hide();
    }, duration);

    return () => clearTimeout(hideTimeout);
  }, []);

  const hide = () => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(translateY, {
        toValue: -20,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start(() => {
      onHide();
    });
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return '#10b981'; // emerald-500
      case 'error':
        return '#ef4444'; // red-500
      case 'info':
        return '#3b82f6'; // blue-500
      default:
        return '#1f2937'; // gray-800
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return 'check-circle';
      case 'error':
        return 'error';
      case 'info':
        return 'info';
      default:
        return 'notifications';
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: insets.top + 10,
          opacity,
          transform: [{ translateY }],
          backgroundColor: getBackgroundColor(),
        },
      ]}
    >
      <View style={styles.content}>
        <MaterialIcons name={getIcon() as any} size={20} color="#ffffff" />
        <Text style={styles.text}>{message}</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 20,
    right: 20,
    borderRadius: 8,
    padding: 16,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  text: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
    flex: 1,
  },
});
