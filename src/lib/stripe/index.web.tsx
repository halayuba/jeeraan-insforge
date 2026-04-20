import React from 'react';

export const StripeProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export const useStripe = () => {
  return {
    initPaymentSheet: async () => ({ 
      error: { 
        code: 'Failed',
        message: 'Stripe is not supported on web yet.' 
      } 
    }),
    presentPaymentSheet: async () => ({ 
      error: { 
        code: 'Failed',
        message: 'Stripe is not supported on web yet.' 
      } 
    }),
    confirmPayment: async () => ({ 
      error: { 
        code: 'Failed',
        message: 'Stripe is not supported on web yet.' 
      } 
    }),
  };
};
