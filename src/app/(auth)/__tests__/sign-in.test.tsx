import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import SignIn from '../sign-in';
import { insforge } from '../../../lib/insforge';
import { useAuthStore } from '../../../store/useAuthStore';

// Mock useAuthStore
jest.mock('../../../store/useAuthStore', () => ({
  useAuthStore: jest.fn(() => ({
    refreshAuth: jest.fn(),
  })),
}));

// Mock insforge
jest.mock('../../../lib/insforge', () => ({
  insforge: {
    auth: {
      signInWithPassword: jest.fn(),
      signInWithOAuth: jest.fn(),
    },
  },
}));

// Mock expo-router
jest.mock('expo-router', () => ({
  Link: ({ children }: any) => children,
}));

describe('SignIn Component', () => {
  it('should render phone number and password inputs', () => {
    const { getByPlaceholderText, getByText } = render(<SignIn />);
    
    expect(getByText('Phone Number')).toBeTruthy();
    expect(getByPlaceholderText('(555) 000-0000')).toBeTruthy();
    expect(getByText('Password')).toBeTruthy();
    expect(getByPlaceholderText('********')).toBeTruthy();
  });

  it('should call signInWithPassword with phone number', async () => {
    (insforge.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      data: { user: { id: '123' } },
      error: null,
    });

    const { getByPlaceholderText, getByText } = render(<SignIn />);
    
    fireEvent.changeText(getByPlaceholderText('(555) 000-0000'), '5550000000');
    fireEvent.changeText(getByPlaceholderText('********'), 'password123');
    fireEvent.press(getByText('Sign In'));

    await waitFor(() => {
      expect(insforge.auth.signInWithPassword).toHaveBeenCalledWith({
        email: '5550000000', // Assuming we pass phone to email field for now if SDK doesn't have a separate field
        password: 'password123',
      });
    });
  });
});
