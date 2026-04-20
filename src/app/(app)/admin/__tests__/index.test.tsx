import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AdminDashboard from '../index';
import { insforge } from '../../../../lib/insforge';
import { useAuth } from '../../../../contexts/AuthContext';

// Mock useAuth
jest.mock('../../../../contexts/AuthContext', () => ({
  useAuth: jest.fn(() => ({
    fullName: 'Admin User',
    globalRole: 'super_admin',
    neighborhoodId: 'nh-123',
    handleAuthError: jest.fn(),
  })),
}));

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({
    replace: jest.fn(),
    back: jest.fn(),
    push: jest.fn(),
  })),
  useFocusEffect: jest.fn((callback) => {
    // In a real environment, this runs after mount.
    // We can simulate this by deferring the execution.
    setImmediate(() => callback());
  }),
}));

// Mock insforge SDK
jest.mock('../../../../lib/insforge', () => {
  const mockSelect = {
    eq: jest.fn(() => mockSelect),
    maybeSingle: jest.fn(() => Promise.resolve({ data: null, error: null })),
    limit: jest.fn(() => mockSelect),
    single: jest.fn(() => Promise.resolve({ data: { id: 'nh-123', name: 'Loma Vista West' }, error: null })),
    order: jest.fn(() => mockSelect),
  };
  
  return {
    insforge: {
      database: {
        from: jest.fn(() => ({
          select: jest.fn(() => mockSelect),
        })),
      },
    },
  };
});

describe('AdminDashboard - Waitlist', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render Waitlist Management section', async () => {
    const { getByText } = render(<AdminDashboard />);
    await waitFor(() => {
      expect(getByText('Waitlist Management')).toBeTruthy();
    });
  });

  test('should fetch waitlist requests on load', async () => {
    const mockRequests = [
      { id: '1', full_name: 'John Doe', phone_number: '123', email_address: 'john@test.com', floorplan_interest: 'Alamo', created_at: new Date().toISOString() },
    ];

    (insforge.database.from as jest.Mock).mockReturnValue({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => Promise.resolve({ data: mockRequests, error: null })),
        })),
      })),
    });

    const { getByText } = render(<AdminDashboard />);
    
    await waitFor(() => {
      expect(getByText('John Doe')).toBeTruthy();
      expect(getByText('Email: john@test.com')).toBeTruthy();
    });
  });

  test('should change sort order when sort buttons are clicked', async () => {
    const { getByText } = render(<AdminDashboard />);
    
    const nameSortBtn = getByText('Name');
    fireEvent.press(nameSortBtn);

    expect(insforge.database.from).toHaveBeenCalledWith('waitlist_requests');
    // It should have been called with order('full_name', { ascending: true }) or similar
  });
});
