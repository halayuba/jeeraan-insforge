import { useRouter } from 'expo-router';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { 
  IconSpeakerphone,
  IconUsersGroup,
  IconUsersPlus,
  IconHelp,
  IconCalendarEvent,
  IconUserCheck,
  IconTool,
  IconMessages,
  IconTag,
  IconPencilFilled,
  IconUserQuestion,
  IconClipboardSearch,
  IconTrophy,
  IconMessageUser
} from '@tabler/icons-react-native';

const GRID_ITEMS = [
  { id: 'announcements', title: 'Announcements', icon: IconSpeakerphone },
  { id: 'messages', title: 'Direct Messages', icon: IconMessageUser },
  { id: 'members', title: 'Members', icon: IconUsersGroup },
  { id: 'invites', title: 'Invites', icon: IconUsersPlus },
  { id: 'events', title: 'Events', icon: IconCalendarEvent },
  { id: 'voting', title: 'Voting', icon: IconUserCheck },
  { id: 'service-orders', title: 'Service Orders', icon: IconTool },
  { id: 'forum', title: 'Forum', icon: IconMessages },
  { id: 'classifieds', title: 'Classified Ads', icon: IconTag },
  { id: 'notes', title: 'Notes', icon: IconPencilFilled },
  { id: 'grievances', title: 'Grievances', icon: IconUserQuestion },
  { id: 'leaderboard', title: 'Leaderboard', icon: IconTrophy },
  { id: 'q-and-a', title: 'Q & A', icon: IconClipboardSearch },
  { id: 'faq', title: 'FAQ', icon: IconHelp },
];

export default function HomeIndex() {
  const router = useRouter();

  const handlePress = (id: string) => {
    if (id === 'voting') {
      router.push('/(app)/voting' as any);
    } else if (id === 'messages') {
      router.push('/(app)/messages' as any);
    } else if (id === 'grievances') {
      router.push('/(app)/grievances' as any);
    } else if (id === 'faq') {
      router.push('/(app)/faq' as any);
    } else if (id === 'announcements') {
      router.push('/(app)/announcements' as any);
    } else if (id === 'service-orders') {
      router.push('/(app)/service-orders' as any);
    } else if (id === 'forum') {
      router.push('/(app)/forum' as any);
    } else if (id === 'events') {
      router.push('/(app)/events' as any);
    } else if (id === 'members') {
      router.push('/(app)/members' as any);
    } else if (id === 'invites') {
      router.push('/(app)/invites' as any);
    } else if (id === 'classifieds') {
      router.push('/(app)/classifieds' as any);
    } else if (id === 'notes') {
      router.push('/(app)/notes' as any);
    } else if (id === 'q-and-a') {
      router.push('/(app)/q-and-a' as any);
    } else if (id === 'leaderboard') {
      router.push('/(app)/leaderboard' as any);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.grid}>
        {GRID_ITEMS.map((item) => {
          const IconComponent = item.icon;
          return (
            <TouchableOpacity 
              key={item.id} 
              style={styles.gridItem}
              onPress={() => handlePress(item.id)}
            >
              <View style={styles.iconContainer}>
                <IconComponent size={32} color="#1193d4" strokeWidth={2} />
              </View>
              <Text style={styles.itemTitle}>{item.title}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f7f8',
  },
  contentContainer: {
    padding: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.05)',
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(17, 147, 212, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  itemTitle: {
    fontFamily: 'Manrope-SemiBold',
    fontSize: 14,
    color: '#334155',
    textAlign: 'center',
  }
});
