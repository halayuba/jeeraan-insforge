import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface LevelBadgeProps {
  level: number;
  size?: 'small' | 'medium';
}

export const LevelBadge: React.FC<LevelBadgeProps> = ({ level, size = 'small' }) => {
  if (!level) return null;

  return (
    <View style={[
      styles.badge, 
      size === 'medium' ? styles.badgeMedium : styles.badgeSmall
    ]}>
      <Text style={[
        styles.text, 
        size === 'medium' ? styles.textMedium : styles.textSmall
      ]}>
        L{level}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    backgroundColor: '#1193d4',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  badgeSmall: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    minWidth: 20,
  },
  badgeMedium: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 32,
  },
  text: {
    color: '#ffffff',
    fontFamily: 'Manrope-Bold',
  },
  textSmall: {
    fontSize: 9,
  },
  textMedium: {
    fontSize: 12,
  },
});
