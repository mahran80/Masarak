export const environment = {
  production: false,
  apiUrl: '/api', // Proxy will route this securely to the backend
  stripeSuccessUrl: 'http://localhost:4200/checkout-success',
  stripeCancelUrl: 'http://localhost:4200/checkout-cancel',
};
