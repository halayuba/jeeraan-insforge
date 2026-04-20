import { submitWaitlistRequest, WaitlistRequest } from '../waitlist';
import { insforge } from '../insforge';

// Mock insforge SDK
jest.mock('../insforge', () => ({
  insforge: {
    database: {
      from: jest.fn(() => ({
        insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    },
  },
}));

describe('Waitlist Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('submitWaitlistRequest', () => {
    test('should insert a waitlist request successfully', async () => {
      const mockRequest: WaitlistRequest = {
        neighborhood_id: 'neighborhood-123',
        full_name: 'John Doe',
        phone_number: '1234567890',
        email_address: 'john@example.com',
        floorplan_interest: 'Bolero: 2 Bedroom, 1 1/2 Townhouse',
      };

      const result = await submitWaitlistRequest(mockRequest);

      expect(insforge.database.from).toHaveBeenCalledWith('waitlist_requests');
      expect(result.error).toBeNull();
    });

    test('should return error if insertion fails', async () => {
      const mockError = { message: 'Insert failed' };
      (insforge.database.from as jest.Mock).mockReturnValue({
        insert: jest.fn(() => Promise.resolve({ data: null, error: mockError })),
      });

      const mockRequest: WaitlistRequest = {
        neighborhood_id: 'neighborhood-123',
        full_name: 'John Doe',
        phone_number: '1234567890',
        email_address: 'john@example.com',
        floorplan_interest: 'Bolero: 2 Bedroom, 1 1/2 Townhouse',
      };

      const result = await submitWaitlistRequest(mockRequest);

      expect(result.error).toEqual(mockError);
    });
  });
});
