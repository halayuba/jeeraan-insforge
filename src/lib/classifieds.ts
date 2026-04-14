/**
 * Calculates the listing fee for a classified ad based on the tiered pricing model.
 * 
 * - $0 – $100: Free
 * - $101 – $200: $5
 * - $201 – $300: $10
 * - $301 – $400: $15
 * - $401 – $500: $20
 * - $501+: 5% of listed price
 * 
 * @param price The listed price of the item.
 * @returns The calculated fee.
 */
export function calculateListingFee(price: number): number {
  if (price <= 100) return 0;
  if (price <= 200) return 5;
  if (price <= 300) return 10;
  if (price <= 400) return 15;
  if (price <= 500) return 20;
  
  // 5% of price for $501+
  return Number((price * 0.05).toFixed(2));
}

/**
 * Returns the active listing limit based on the user's role in the neighborhood.
 * 
 * - Resident Member: Max 5
 * - Moderator: Max 10
 * - Neighborhood Admin: Max 20
 * 
 * @param role The role of the user.
 * @returns The max allowed active ads.
 */
export function getListingLimit(role: 'resident' | 'moderator' | 'admin' | string): number {
  switch (role) {
    case 'admin':
      return 20;
    case 'moderator':
      return 10;
    case 'resident':
    default:
      return 5;
  }
}
