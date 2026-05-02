import { HelpCircle } from 'lucide-react-native';
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable } from 'react-native';

type MemberNameProps = {
  name?: string;
  isVisible?: boolean;
  anonymousId?: string;
  style?: any;
  textStyle?: any;
};

export const MemberName = ({ 
  name, 
  isVisible = true, 
  anonymousId, 
  style, 
  textStyle 
}: MemberNameProps) => {
  const [tooltipVisible, setTooltipVisible] = useState(false);

  if (isVisible !== false) {
    return (
      <View style={[styles.container, style]}>
        <Text style={[styles.name, textStyle]}>{name || 'Unknown Member'}</Text>
      </View>
    );
  }

  const displayName = anonymousId ? `${anonymousId} (?)` : 'Anonymous (?)';

  return (
    <View style={[styles.container, style]}>
      <Text style={[styles.name, styles.anonymousName, textStyle]}>
        {anonymousId || 'Anonymous'}
      </Text>
      <TouchableOpacity 
        onPress={() => setTooltipVisible(true)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text style={[styles.name, styles.questionMark, textStyle]}> (?)</Text>
      </TouchableOpacity>

      <Modal
        animationType="fade"
        transparent={true}
        visible={tooltipVisible}
        onRequestClose={() => setTooltipVisible(false)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setTooltipVisible(false)}
        >
          <View style={styles.tooltipCard}>
            <View style={styles.tooltipHeader}>
              <HelpCircle size={20} color="#1193d4" strokeWidth={2} />
              <Text style={styles.tooltipTitle}>Anonymous Identity</Text>
            </View>
            <Text style={styles.tooltipText}>
              Member has been verified by the Admin but wishes to remain anonymous.
            </Text>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => setTooltipVisible(false)}
            >
              <Text style={styles.closeButtonText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontSize: 14,
    fontFamily: 'Manrope-SemiBold',
    color: '#1e293b',
  },
  anonymousName: {
    color: '#64748b',
    fontStyle: 'italic',
  },
  questionMark: {
    color: '#1193d4',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  tooltipCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 300,
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
    elevation: 5,
  },
  tooltipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  tooltipTitle: {
    fontSize: 16,
    fontFamily: 'Manrope-Bold',
    color: '#0f172a',
  },
  tooltipText: {
    fontSize: 14,
    fontFamily: 'Manrope-Medium',
    color: '#475569',
    lineHeight: 20,
    marginBottom: 20,
  },
  closeButton: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 14,
    fontFamily: 'Manrope-Bold',
    color: '#1193d4',
  },
});
