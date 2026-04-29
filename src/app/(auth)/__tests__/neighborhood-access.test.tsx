import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import NeighborhoodAccess from '../neighborhood-access';
import { insforge } from '../../../lib/insforge';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';

const mockShowToast = jest.fn();

// Mock useToast
jest.mock('../../../contexts/ToastContext', () => ({
  useToast: jest.fn(() => ({
    showToast: mockShowToast,
    hideToast: jest.fn(),
  })),
}));

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

  test('should render "Request to Join" accordion', () => {
    const { getByText } = render(<NeighborhoodAccess />);
    expect(getByText('Request to Join')).toBeTruthy();
  });

  test('should show Request to Join form when accordion is clicked', () => {
    const { getByText, getByPlaceholderText } = render(<NeighborhoodAccess />);
    
    fireEvent.press(getByText('Request to Join'));
    
    expect(getByText(/Would you like to join your neighborhood but don't have a code yet/)).toBeTruthy();
    expect(getByPlaceholderText('John Doe')).toBeTruthy();
    expect(getByPlaceholderText('john@example.com')).toBeTruthy();
  });

  test('should submit join request successfully', async () => {
    const { getByText, getByPlaceholderText } = render(<NeighborhoodAccess />);
    const mockReplace = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ replace: mockReplace });

    fireEvent.press(getByText('Request to Join'));

    // Ensure form is visible
    await waitFor(() => {
      expect(getByPlaceholderText('John Doe')).toBeTruthy();
    });

    fireEvent.changeText(getByPlaceholderText('John Doe'), 'John Smith');
    fireEvent.changeText(getByPlaceholderText('(555) 000-0000'), '8160001111');
    fireEvent.changeText(getByPlaceholderText('john@example.com'), 'john@test.com');
    fireEvent.changeText(getByPlaceholderText('123 Neighborhood St'), '456 West St');
    
    // Check residency
    fireEvent.press(getByText(/I confirm that I am a resident/));

    // Toggle public profile (default is public, so first press makes it non-public)
    fireEvent.press(getByText('Do not make my profile public'));
    
    const submitBtn = getByText('Submit Request');
    fireEvent.press(submitBtn);

    // Expect Technical Preview modal to appear
    await waitFor(() => {
      expect(getByText('Technical Preview')).toBeTruthy();
    });

    // Accept the disclaimer
    fireEvent.press(getByText('I understand that Jeeraan is not production ready and I would like to proceed'));
    
    // Press Proceed in the modal
    fireEvent.press(getByText('Proceed'));

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        'Thank you! Your request has been submitted successfully. It will be reviewed by an admin within 24 hours.',
        'success'
      );
      expect(mockReplace).toHaveBeenCalledWith('/');
    });
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

  test('should render "Create a new Neighborhood (Admin) - Coming soon" message', () => {
    const { getByText } = render(<NeighborhoodAccess />);
    expect(getByText('Create a new Neighborhood (Admin) - Coming soon')).toBeTruthy();
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
      expect(mockShowToast).toHaveBeenCalledWith(
        'Your request to be added to the waitlist will be reviewed by the Neighborhood admin then will be forwarded to one of the office staff members and someone will get in touch with you soon to explain the procedure for accepting new applicants.',
        'success'
      );
      expect(mockReplace).toHaveBeenCalledWith('/');
    });
  });
});
