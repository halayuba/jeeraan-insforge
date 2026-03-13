import { useRouter } from 'expo-router';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const GRID_ITEMS = [
  { id: 'announcements', title: 'Announcements', icon: 'campaign' },
  { id: 'members', title: 'Members', icon: 'groups' },
  { id: 'invites', title: 'Invites', icon: 'person-add' },
  { id: 'events', title: 'Events', icon: 'event' },
  { id: 'voting', title: 'Voting', icon: 'how-to-vote' },
  { id: 'service-orders', title: 'Service Orders', icon: 'construction' },
  { id: 'forum', title: 'Forum', icon: 'forum' },
  { id: 'classifieds', title: 'Classified Ads', icon: 'sell' },
  { id: 'grievances', title: 'Grievances', icon: 'feedback' },
  { id: 'recent', title: 'Recent Activities', icon: 'history' },
];

export default function HomeIndex() {
  const router = useRouter();

  const handlePress = (id: string) => {
    if (id === 'voting') {
      router.push('/(app)/voting' as any);
    } else if (id === 'grievances') {
      router.push('/(app)/grievances' as any);
    } else if (id === 'announcements') {
      router.push('/(app)/announcements' as any);
    } else if (id === 'service-orders') {
      router.push('/(app)/service-orders' as any);
    } else if (id === 'forum') {
      router.push('/(app)/forum' as any);
    } else if (id === 'events') {
      router.push('/(app)/events' as any);
    } else if (id === 'classifieds') {
      router.push('/(app)/classifieds' as any);
    } else {
      console.log(`Navigate to ${id}`);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.grid}>
        {GRID_ITEMS.map((item) => (
          <TouchableOpacity 
            key={item.id} 
            style={styles.gridItem}
            onPress={() => handlePress(item.id)}
          >
            <View style={styles.iconContainer}>
              <MaterialIcons name={item.icon as any} size={32} color="#1193d4" />
            </View>
            <Text style={styles.itemTitle}>{item.title}</Text>
          </TouchableOpacity>
        ))}
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
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
