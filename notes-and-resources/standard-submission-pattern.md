# Standard Pattern for Form Submissions and List Refreshing

## Problem
In React Native with Expo Router, when navigating back to a list screen (e.g., via `router.back()` or `router.push('/list')`) after submitting a new item, the list might not show the new item because it hasn't re-fetched the data.

## Solution Pattern

### 1. The Submission Screen (submit.tsx)
Instead of using `Alert.alert`, use the `useToast` hook for success/error feedback. After a successful submission, redirect to the list screen using `router.push`.

**Example:**
```tsx
const { showToast } = useToast();
const router = useRouter();

const handleSubmit = async () => {
  try {
    // ... submission logic ...
    showToast('Item created successfully!');
    router.push('/(app)/items'); // Redirect to list
  } catch (error) {
    showToast('Failed to create item', 'error');
  }
};
```

### 2. The List Screen (index.tsx)
Use `useFocusEffect` from `expo-router` combined with `useCallback` from `react` to ensure the data is re-fetched every time the screen comes into focus. This ensures that when the user returns from the submission screen, the list is updated.

**Example:**
```tsx
import { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';

export default function ListScreen() {
  const [items, setItems] = useState([]);

  const fetchItems = async () => {
    // ... fetch logic ...
    const { data } = await supabase.from('items').select('*');
    setItems(data);
  };

  useFocusEffect(
    useCallback(() => {
      fetchItems();
    }, [])
  );

  // ... rest of component ...
}
```

## Key Benefits
- **Immediate Feedback**: Toasts provide non-blocking visual confirmation.
- **Data Integrity**: `useFocusEffect` ensures the UI always reflects the latest state of the database.
- **Consistency**: Users expect to see their new entry immediately upon returning to the list.
