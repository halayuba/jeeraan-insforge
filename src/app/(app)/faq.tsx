import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const FAQ_DATA = [
  {
    category: 'General',
    items: [
      {
        q: 'What is Jeeraan?',
        a: 'Jeeraan is a private, neighborhood-based platform that enables residents to communicate, stay informed, report issues, participate in decisions, and engage with their community in a secure digital environment.'
      },
      {
        q: 'Who can use Jeeraan?',
        a: 'Jeeraan is designed for verified residents of a specific neighborhood or apartment community. Access is granted through invitation by an admin or authorized member.'
      },
      {
        q: 'Is Jeeraan public or private?',
        a: 'Jeeraan neighborhoods are private and access-controlled. Only verified residents can join and view content within their community.'
      }
    ]
  },
  {
    category: 'Account & Access',
    items: [
      {
        q: 'How do I join my neighborhood on Jeeraan?',
        a: 'You must receive a unique invitation link or code from your neighborhood admin or inviter. After verification, you can create an account and join.'
      },
      {
        q: 'What if I didn’t receive an invitation?',
        a: 'You can request access from your neighborhood admin or contact support to verify your eligibility.'
      },
      {
        q: 'Can I belong to multiple neighborhoods?',
        a: 'Currently, users join a single neighborhood. Multi-neighborhood support may be introduced in future updates.'
      }
    ]
  },
  {
    category: 'Features & Usage',
    items: [
      {
        q: 'What can I do on Jeeraan?',
        a: 'Residents can:\n• View and comment on announcements\n• Participate in polls and voting\n• Report issues and track progress\n• Submit and engage with grievances\n• Join discussions in forums\n• Post or browse classified ads'
      }
    ]
  },
  {
    category: 'Grievances & Issue Reporting',
    items: [
      {
        q: 'What is the difference between a work order and a grievance?',
        a: '• Work Orders are typically individual maintenance requests.\n• Grievances are community-visible issues that may affect multiple residents and allow discussion, tracking, and transparency.'
      },
      {
        q: 'Can other residents see my grievance?',
        a: 'Yes. Grievances are visible to members of your neighborhood to promote awareness and collaboration.'
      },
      {
        q: 'How do I track the status of my grievance?',
        a: 'Each grievance includes a status: Pending, In Progress, or Resolved. You will also receive updates through notifications.'
      },
      {
        q: 'Can I add photos to a grievance?',
        a: 'Yes. Adding images is encouraged to help admins better understand and resolve issues.'
      }
    ]
  },
  {
    category: 'Communication & Engagement',
    items: [
      {
        q: 'Will I receive notifications?',
        a: 'Yes. You may receive push, email, or SMS notifications depending on your settings and the urgency of updates.'
      },
      {
        q: 'Can I control what notifications I receive?',
        a: 'Yes. Notification preferences can be customized within your account settings.'
      },
      {
        q: 'Can I comment on posts and grievances?',
        a: 'Yes, unless commenting is disabled by the admin for specific content.'
      }
    ]
  },
  {
    category: 'Privacy & Security',
    items: [
      {
        q: 'Is my personal information safe?',
        a: 'Yes. Jeeraan uses secure authentication and encrypted communication to protect user data and complies with privacy regulations such as GDPR and CCPA.'
      },
      {
        q: 'Who can see my information?',
        a: 'Only verified members of your neighborhood and authorized admins can access your profile information, based on privacy settings.'
      }
    ]
  },
  {
    category: 'Administration',
    items: [
      {
        q: 'What can admins do?',
        a: 'Admins can:\n• Manage users and invitations\n• Post announcements\n• Moderate discussions\n• Manage grievances and work orders\n• Configure neighborhood settings'
      },
      {
        q: 'Can admins remove content or users?',
        a: 'Yes. Admins have moderation rights to maintain a safe and respectful environment.'
      }
    ]
  },
  {
    category: 'Classifieds & Community Features',
    items: [
      {
        q: 'How do I post an item for sale or giveaway?',
        a: 'You can create a classified listing with a title, description, optional price, and photos.'
      },
      {
        q: 'Do listings expire?',
        a: 'Yes. Listings may have an expiration date to keep the marketplace relevant and uncluttered.'
      }
    ]
  },
  {
    category: 'Support & Troubleshooting',
    items: [
      {
        q: 'What should I do if I encounter a technical issue?',
        a: 'You can contact support through the app or website. Future updates may include in-app help and ticketing.'
      },
      {
        q: 'What if incorrect or inappropriate content is posted?',
        a: 'You can report the content, and admins/moderators will review and take appropriate action.'
      }
    ]
  },
  {
    category: 'Future Enhancements',
    items: [
      {
        q: 'Will new features be added to Jeeraan?',
        a: 'Yes. Planned enhancements include:\n• Multi-neighborhood support\n• Advanced analytics for admins\n• SMS notifications\n• Integration with third-party services'
      }
    ]
  }
];

export default function FAQScreen() {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>FAQ</Text>
          <Text style={styles.headerSubtitle}>Everything you need to know about Jeeraan</Text>
        </View>

        {FAQ_DATA.map((section, idx) => (
          <View key={idx} style={styles.section}>
            <Text style={styles.categoryTitle}>{section.category}</Text>
            {section.items.map((item, itemIdx) => (
              <View key={itemIdx} style={styles.faqCard}>
                <Text style={styles.question}>{item.q}</Text>
                <Text style={styles.answer}>{item.a}</Text>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f7f8',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontFamily: 'Manrope-Bold',
    fontSize: 24,
    color: '#0f172a',
  },
  headerSubtitle: {
    fontFamily: 'Manrope-Regular',
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontFamily: 'Manrope-Bold',
    fontSize: 16,
    color: '#1193d4',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  faqCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  question: {
    fontFamily: 'Manrope-Bold',
    fontSize: 15,
    color: '#0f172a',
    marginBottom: 8,
  },
  answer: {
    fontFamily: 'Manrope-Regular',
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
});
