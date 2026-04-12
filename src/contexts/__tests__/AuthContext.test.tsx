import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import { AuthProvider, useAuth } from '../AuthContext';
import { insforge } from '../../lib/insforge';

// Mock insforge SDK
jest.mock('../../lib/insforge', () => ({
  insforge: {
    auth: {
      getCurrentSession: jest.fn(),
      signOut: jest.fn(),
    },
    database: {
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: null, error: null })),
          })),
        })),
      })),
    },
  },
}));

describe('AuthContext 24h Session', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  it('should clear auth state if session is expired', async () => {
    const past = new Date(Date.now() - 1000); // 1 second ago

    (insforge.auth.getCurrentSession as jest.Mock).mockResolvedValue({
      data: {
        session: {
          user: { id: 'user_123' },
          expiresAt: past.toISOString(),
        },
      },
      error: null,
    });

    const { result, waitForNextUpdate } = renderHook(() => useAuth(), { wrapper });

    await waitForNextUpdate();

    expect(result.current.session).toBeNull();
    expect(result.current.user).toBeNull();
    expect(insforge.auth.signOut).toHaveBeenCalled();
  });
});
