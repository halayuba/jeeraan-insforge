import React, { useState } from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity, ScrollView, Modal, useWindowDimensions, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, Redirect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';

const SLIDES = [
  {
    title: "The Vision",
    content: "To bring neighborhoods back to life — digitally and socially.\n\nJeeraan empowers communities to:\n• Share announcements instantly\n• Vote on neighborhood decisions\n• Report maintenance and work orders\n• Participate in forums\n• Post classified ads\n\nEach neighborhood becomes its own small, secure online village."
  },
  {
    title: "How It Works",
    content: "1. A neighborhood admin subscribes and sets up the community.\n2. Residents receive links and verify their addresses.\n3. Once inside, neighbors participate in announcements, polls, and forums.\n4. Admins and moderators keep things organized."
  },
  {
    title: "Why It Matters",
    content: "• Clarity and connection: No more missed updates.\n• Empowered participation: Everyone can contribute.\n• Safer communities: Real-time alerts strengthen safety.\n• Local trust and commerce: Promote neighbor-to-neighbor help.\n\nJeeraan isn't just software — it's a digital heartbeat for local communities."
  },
  {
    title: "The Ask",
    content: "We're inviting a few trusted neighbors to join early as advocates and co-creators.\n\nYour feedback helps shape Jeeraan into something truly meaningful. Together, we can make a platform built by neighbors, for neighbors."
  },
  {
    title: "Next Steps",
    content: "If you're interested in being part of this journey:\n\n• Join a short brainstorming session\n• Share insights on your ideal neighborhood app\n• Explore opportunities to partner and test\n\nJeeraan – Because good neighborhoods start with good neighbors."
  }
];

export default function SplashScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [modalVisible, setModalVisible] = useState(false);
  const { session, loading } = useAuth();

  const SLIDE_WIDTH = width * 0.85 - 40; // 85% modal width minus 20 padding each side

  if (!loading && session) {
    return <Redirect href="/(app)" />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Navigation / Top Bar */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}>
              <MaterialIcons name="share-location" size={20} color="#fff" />
            </View>
            <Text style={styles.logoText}>Jeeraan</Text>
          </View>
          <TouchableOpacity style={styles.helpButton}>
            <MaterialIcons name="help-outline" size={24} color="#64748b" />
          </TouchableOpacity>
        </View>

        {/* Hero Component */}
        <View style={styles.heroContainer}>
          <ImageBackground 
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAEH_zPBvQEKvVVrNLmQXBBoLKQ_wZgaZpCnACiCKZtamsKUN4zqKXy86KFRHtldYHeksGQwIRFIpFVXQHxTe6Iz5P3kEbwwSBB2ZGaYdKyzN7bxs6A-CpgphP1NuR_gy3874vp-f7jNfwkcbM_zC4Pwl5OuAzP4Vl2BzyUV68fmMFf438779Ugj_tL-styUpa0iV13CB1x6pn28zUZqyD1iqAK4VUWX1HzyFVmoAiPfM822QIYBU1mW753-KpjkNQ0L0QFtwR3G8w' }} 
            style={styles.heroImage}
            imageStyle={{ borderRadius: 16 }}
          >
            <View style={styles.heroOverlay}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Community First</Text>
              </View>
              <Text style={styles.heroTitle}>Welcome to Jeeraan</Text>
            </View>
          </ImageBackground>
        </View>

        {/* Content Section */}
        <View style={styles.contentSection}>
          <Text style={styles.mainTitle}>Your neighborhood, connected.</Text>
          <Text style={styles.subtitle}>
            Jeeraan helps you discover local events, share recommendations, and build a stronger community with the people living right next door. Join thousands of neighbors making their streets safer and friendlier.
          </Text>

          {/* Value Props */}
          <View style={styles.grid}>
            <View style={styles.gridItem}>
              <MaterialIcons name="groups" size={32} color="#1193d4" style={styles.gridIcon} />
              <Text style={styles.gridText}>Meet Neighbors</Text>
            </View>
            <View style={styles.gridItem}>
              <MaterialIcons name="campaign" size={32} color="#1193d4" style={styles.gridIcon} />
              <Text style={styles.gridText}>Local News</Text>
            </View>
            <View style={styles.gridItem}>
              <MaterialIcons name="volunteer-activism" size={32} color="#1193d4" style={styles.gridIcon} />
              <Text style={styles.gridText}>Help Others</Text>
            </View>
            <View style={styles.gridItem}>
              <MaterialIcons name="how-to-vote" size={32} color="#1193d4" style={styles.gridIcon} />
              <Text style={styles.gridText}>Elections</Text>
            </View>
            <View style={styles.gridItem}>
              <MaterialIcons name="event" size={32} color="#1193d4" style={styles.gridIcon} />
              <Text style={styles.gridText}>Events</Text>
            </View>
            <View style={styles.gridItem}>
              <MaterialIcons name="forum" size={32} color="#1193d4" style={styles.gridIcon} />
              <Text style={styles.gridText}>Forum</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.button, styles.secondaryButton]} 
              onPress={() => setModalVisible(true)}
            >
              <Text style={styles.secondaryButtonText}>Learn more</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.primaryButton]} 
              onPress={() => router.push('/(auth)/neighborhood-access')}
            >
              <Text style={styles.primaryButtonText}>Access Jeeraan</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer Visual */}
        <View style={styles.footer}>
          <View style={styles.footerLinks}>
            <Text style={styles.footerLink}>Privacy</Text>
            <Text style={styles.footerLink}>Terms</Text>
            <Text style={styles.footerLink}>Safety</Text>
          </View>
          <Text style={styles.footerText}>
            By entering Jeeraan, you agree to foster a positive and inclusive neighborhood environment.
          </Text>
        </View>
      </ScrollView>

      {/* Modal for Learn More contents */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <MaterialIcons name="close" size={24} color="#334155" />
            </TouchableOpacity>
            
            <ScrollView 
              horizontal 
              pagingEnabled 
              showsHorizontalScrollIndicator={false}
              style={{ width: SLIDE_WIDTH }}
            >
              {SLIDES.map((slide, index) => (
                <View key={index} style={[styles.slide, { width: SLIDE_WIDTH }]}>
                  <Text style={styles.slideTitle}>{slide.title}</Text>
                  <Text style={styles.slideContent}>{slide.content}</Text>
                </View>
              ))}
            </ScrollView>
            
            <View style={styles.sliderIndicator}>
              <MaterialIcons name="swipe" size={20} color="#94a3b8" />
              <Text style={styles.sliderHint}>Swipe to read more</Text>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f7f8',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoIcon: {
    width: 32,
    height: 32,
    backgroundColor: '#1193d4',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 20,
    fontFamily: 'Manrope-Bold',
    color: '#0f172a',
  },
  helpButton: {
    padding: 8,
    borderRadius: 20,
  },
  heroContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  heroImage: {
    width: '100%',
    height: 350,
  },
  heroOverlay: {
    flex: 1,
    backgroundColor: 'rgba(16, 28, 34, 0.4)',
    borderRadius: 16,
    padding: 24,
    justifyContent: 'flex-end',
    gap: 8,
  },
  badge: {
    backgroundColor: 'rgba(17, 147, 212, 0.6)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    color: '#fff',
    fontFamily: 'Manrope-SemiBold',
    fontSize: 14,
  },
  heroTitle: {
    fontFamily: 'Manrope-Bold',
    fontSize: 32,
    color: '#fff',
    lineHeight: 40,
  },
  contentSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  mainTitle: {
    fontFamily: 'Manrope-Bold',
    fontSize: 28,
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontFamily: 'Manrope-Regular',
    fontSize: 16,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 40,
    gap: 12,
  },
  gridItem: {
    width: '31%',
    backgroundColor: 'rgba(17, 147, 212, 0.05)',
    borderColor: 'rgba(17, 147, 212, 0.1)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  gridIcon: {
    marginBottom: 8,
  },
  gridText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 12,
    color: '#0f172a',
    textAlign: 'center',
  },
  actionButtons: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 16,
  },
  button: {
    height: 56,
    minWidth: 160,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  secondaryButton: {
    backgroundColor: '#e2e8f0',
  },
  secondaryButtonText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 16,
    color: '#0f172a',
  },
  primaryButton: {
    backgroundColor: '#1193d4',
  },
  primaryButtonText: {
    fontFamily: 'Manrope-Bold',
    fontSize: 16,
    color: '#fff',
  },
  footer: {
    marginTop: 40,
    paddingVertical: 24,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    alignItems: 'center',
  },
  footerLinks: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 16,
  },
  footerLink: {
    fontFamily: 'Manrope-Medium',
    fontSize: 14,
    color: '#64748b',
  },
  footerText: {
    fontFamily: 'Manrope-Regular',
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    height: '70%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    padding: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
  },
  slide: {
    paddingTop: 40,
    paddingHorizontal: 10,
  },
  slideTitle: {
    fontFamily: 'Manrope-Bold',
    fontSize: 24,
    color: '#1193d4',
    marginBottom: 20,
    textAlign: 'center',
  },
  slideContent: {
    fontFamily: 'Manrope-Regular',
    fontSize: 16,
    color: '#334155',
    lineHeight: 26,
  },
  sliderIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
    paddingBottom: 10,
  },
  sliderHint: {
    fontFamily: 'Manrope-Medium',
    fontSize: 14,
    color: '#94a3b8',
  }
});
