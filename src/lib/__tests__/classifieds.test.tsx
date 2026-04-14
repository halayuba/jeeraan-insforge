import 'react-native';
import { calculateListingFee, getListingLimit } from '../classifieds';

describe('Classified Ads Logic', () => {
  describe('calculateListingFee', () => {
    test('should return 0 for price <= 100', () => {
      expect(calculateListingFee(0)).toBe(0);
      expect(calculateListingFee(50)).toBe(0);
      expect(calculateListingFee(100)).toBe(0);
    });

    test('should return 5 for price between 101 and 200', () => {
      expect(calculateListingFee(101)).toBe(5);
      expect(calculateListingFee(150)).toBe(5);
      expect(calculateListingFee(200)).toBe(5);
    });

    test('should return 10 for price between 201 and 300', () => {
      expect(calculateListingFee(201)).toBe(10);
      expect(calculateListingFee(250)).toBe(10);
      expect(calculateListingFee(300)).toBe(10);
    });

    test('should return 15 for price between 301 and 400', () => {
      expect(calculateListingFee(301)).toBe(15);
      expect(calculateListingFee(350)).toBe(15);
      expect(calculateListingFee(400)).toBe(15);
    });

    test('should return 20 for price between 401 and 500', () => {
      expect(calculateListingFee(401)).toBe(20);
      expect(calculateListingFee(450)).toBe(20);
      expect(calculateListingFee(500)).toBe(20);
    });

    test('should return 5% for price > 500', () => {
      expect(calculateListingFee(501)).toBe(25.05);
      expect(calculateListingFee(1000)).toBe(50);
      expect(calculateListingFee(5000)).toBe(250);
    });
  });

  describe('getListingLimit', () => {
    test('should return 5 for resident', () => {
      expect(getListingLimit('resident')).toBe(5);
    });

    test('should return 10 for moderator', () => {
      expect(getListingLimit('moderator')).toBe(10);
    });

    test('should return 20 for admin', () => {
      expect(getListingLimit('admin')).toBe(20);
    });

    test('should return 5 for unknown role (default)', () => {
      expect(getListingLimit('guest' as any)).toBe(5);
    });
  });
});
