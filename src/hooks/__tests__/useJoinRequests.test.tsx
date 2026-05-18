import { renderHook, waitFor } from '@testing-library/react-native';
import { useJoinRequests } from '../useJoinRequests';
import { insforge } from '../../lib/insforge';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock insforge SDK
jest.mock('../../lib/insforge', () => ({
  insforge: {
    database: {
      from: jest.fn(),
    },
    functions: {
      invoke: jest.fn(),
    },
  },
}));

// Mock Alert
jest.mock('react-native', () => ({
  Alert: {
    alert: jest.fn(),
  },
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('useJoinRequests', () => {
  const neighborhoodId = 'nh-123';

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient.clear();
  });

  test('approve should update request, generate invite, and call Edge Function', async () => {
    const mockRequest = { id: 'req-1', phone: '1234567890', neighborhood_id: neighborhoodId, name: 'John Doe' };
    
    // Mock DB update for join_requests
    const mockUpdate = jest.fn().mockReturnValue({ error: null });
    const mockFromJoinRequests = jest.fn().mockReturnValue({ update: mockUpdate });
    
    // Mock DB insert for invites
    const mockInsert = jest.fn().mockReturnValue({ error: null });
    const mockFromInvites = jest.fn().mockReturnValue({ insert: mockInsert });

    (insforge.database.from as jest.Mock).mockImplementation((table) => {
      if (table === 'join_requests') return { update: () => ({ eq: mockUpdate }) };
      if (table === 'invites') return { 
        insert: mockInsert,
        select: () => ({ eq: () => ({ eq: () => ({ gt: () => ({ is: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }) }) }) }) })
      };
      return { select: () => ({ eq: () => ({ order: () => Promise.resolve({ data: [], error: null }) }) }) };
    });

    // Mock Edge Function success
    (insforge.functions.invoke as jest.Mock).mockResolvedValue({ data: { success: true }, error: null });

    const { result } = renderHook(() => useJoinRequests(neighborhoodId), { wrapper });

    await result.current.approve({ 
      request: mockRequest, 
      adminName: 'Admin', 
      neighborhoodName: 'My NH' 
    });

    // Verify DB calls
    expect(mockUpdate).toHaveBeenCalled();
    expect(mockInsert).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({
        phone: '1234567890',
        neighborhood_id: neighborhoodId,
      })
    ]));

    // Verify Edge Function call
    expect(insforge.functions.invoke).toHaveBeenCalledWith('send-invite-sms', expect.objectContaining({
      body: expect.objectContaining({
        phone: '1234567890',
        inviteCode: expect.any(String),
        adminName: 'Admin',
      })
    }));
  });

  test('approve should handle SMS failure gracefully', async () => {
    const mockRequest = { id: 'req-1', phone: '1234567890', neighborhood_id: neighborhoodId, name: 'John Doe' };
    
    (insforge.database.from as jest.Mock).mockImplementation((table) => {
      if (table === 'join_requests') return { update: () => ({ eq: () => ({ error: null }) }) };
      if (table === 'invites') return { 
        insert: () => ({ error: null }),
        select: () => ({ eq: () => ({ eq: () => ({ gt: () => ({ is: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }) }) }) }) })
      };
      return { select: () => ({ eq: () => ({ order: () => Promise.resolve({ data: [], error: null }) }) }) };
    });

    // Mock Edge Function failure
    (insforge.functions.invoke as jest.Mock).mockResolvedValue({ data: null, error: { message: 'Twilio error' } });

    const { result } = renderHook(() => useJoinRequests(neighborhoodId), { wrapper });

    const response = await result.current.approve({ 
      request: mockRequest, 
      adminName: 'Admin', 
      neighborhoodName: 'My NH' 
    });

    expect(response.smsSuccess).toBe(false);
  });
});
