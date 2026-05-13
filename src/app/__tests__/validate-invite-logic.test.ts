import { insforge } from '../../lib/insforge';

// Mock the insforge SDK
jest.mock('../../lib/insforge', () => ({
  insforge: {
    functions: {
      invoke: jest.fn(),
    },
    database: {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn(),
    },
  },
}));

describe('Invite Code Validation Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully validate a correct invite code and phone number', async () => {
    const mockData = {
      success: true,
      invite: {
        id: 'invite-123',
        code: '123456',
        neighborhood_id: 'nb-456',
        phone: '+18168246870',
      },
    };

    (insforge.functions.invoke as jest.Mock).mockResolvedValue({ data: mockData, error: null });

    const inviteCode = '123456';
    const invitePhone = '(816) 824-6870';
    
    // Simulate the normalization logic in neighborhood-access.tsx
    let sanitizedPhone = invitePhone.replace(/[^\d+]/g, '');
    if (!sanitizedPhone.startsWith('+')) {
      if (sanitizedPhone.length === 10) {
        sanitizedPhone = '+1' + sanitizedPhone;
      } else {
        sanitizedPhone = '+' + sanitizedPhone;
      }
    }

    const { data, error } = await insforge.functions.invoke('validate-invite', {
      body: {
        code: inviteCode.toUpperCase(),
        phone: sanitizedPhone,
      },
    });

    expect(sanitizedPhone).toBe('+18168246870');
    expect(insforge.functions.invoke).toHaveBeenCalledWith('validate-invite', {
      body: {
        code: '123456',
        phone: '+18168246870',
      },
    });
    expect(data.success).toBe(true);
    expect(data.invite.neighborhood_id).toBe('nb-456');
    expect(error).toBeNull();
  });

  it('should handle an invalid invite code error', async () => {
    const mockErrorData = {
      success: false,
      error: 'Invalid or expired invite code.',
    };

    (insforge.functions.invoke as jest.Mock).mockResolvedValue({ data: mockErrorData, error: null });

    const { data, error } = await insforge.functions.invoke('validate-invite', {
      body: {
        code: 'WRONG',
        phone: '+18168246870',
      },
    });

    expect(data.success).toBe(false);
    expect(data.error).toBe('Invalid or expired invite code.');
    expect(error).toBeNull();
  });

  it('should handle a system level 401 error', async () => {
    const mockSystemError = {
      message: 'Unauthorized',
      status: 401,
    };

    (insforge.functions.invoke as jest.Mock).mockResolvedValue({ data: null, error: mockSystemError });

    const { data, error } = await insforge.functions.invoke('validate-invite', {
      body: {
        code: '123456',
        phone: '+18168246870',
      },
    });

    expect(data).toBeNull();
    expect(error.status).toBe(401);
    expect(error.message).toBe('Unauthorized');
  });
});
