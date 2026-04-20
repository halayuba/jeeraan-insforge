import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import NeighborhoodAccess from '../neighborhood-access';
import { insforge } from '../../../lib/insforge';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';

// Mock Alert.alert to immediately call the button action
jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons) => {
  if (buttons && buttons[0] && buttons[0].onPress) {
    buttons[0].onPress();
  }
});

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({
    replace: jest.fn(),
    back: jest.fn(),
    push: jest.fn(),
  })),
  Link: ({ children }: any) => children,
}));

// Mock insforge SDK
jest.mock('../../../lib/insforge', () => {
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
          insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      },
    },
  };
});

// Mock waitlist lib
jest.mock('../../../lib/waitlist', () => ({
  FLOORPLAN_OPTIONS: [
    "Bolero: 2 Bedroom, 1 1/2 Townhouse",
    "Alamo: 2 Bedroom, 1 bath Ranch",
    "Catalina: 3 Bedroom, 1 3/4 Bath Townhouse",
    "Durango: 3 Bedroom, 1 3/4 Bath Duplex with Garage",
    "Any of the above",
  ],
  submitWaitlistRequest: jest.fn(() => Promise.resolve({ data: { id: 'wl-123' }, error: null })),
}));

describe('NeighborhoodAccess - Waitlist Form', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render "Add me to the waitlist" accordion', () => {
    const { getByText } = render(<NeighborhoodAccess />);
    expect(getByText('Add me to the waitlist')).toBeTruthy();
  });

  test('should show waitlist form when accordion is clicked', () => {
    const { getByText, getByPlaceholderText } = render(<NeighborhoodAccess />);
    
    fireEvent.press(getByText('Add me to the waitlist'));
    
    expect(getByText(/If you are not a resident of Loma Vista West/)).toBeTruthy();
    expect(getByPlaceholderText('Your Name')).toBeTruthy();
    expect(getByPlaceholderText('you@example.com')).toBeTruthy();
  });

  test('should submit waitlist request successfully', async () => {
    const { getByText, getByPlaceholderText } = render(<NeighborhoodAccess />);
    const mockReplace = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ replace: mockReplace });

    fireEvent.press(getByText('Add me to the waitlist'));

    // Ensure form is visible
    await waitFor(() => {
      expect(getByPlaceholderText('Your Name')).toBeTruthy();
    });

    fireEvent.changeText(getByPlaceholderText('Your Name'), 'Jane Doe');
    fireEvent.changeText(getByPlaceholderText('+1 (555) 000-0000'), '1234567890');
    fireEvent.changeText(getByPlaceholderText('you@example.com'), 'jane@example.com');
    
    // Select a floorplan (it's already defaulted to "Any of the above")
    
    const submitBtn = getByText('Submit Request');
    fireEvent.press(submitBtn);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/');
    });
  });
});
