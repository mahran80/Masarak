namespace Masarak.Application.Interfaces
{
    /// <summary>
    /// Creates Stripe Checkout Sessions and handles webhook validation.
    /// </summary>
    public interface IStripeService
    {
        /// <summary>
        /// Creates a Stripe Checkout Session and returns the checkout URL + session ID.
        /// </summary>
        Task<(string CheckoutUrl, string SessionId)> CreateCheckoutSessionAsync(
            int userId, int planId, string planName, decimal price, string currency,
            string successUrl, string cancelUrl, CancellationToken ct = default);

        /// <summary>
        /// Changes an existing Stripe Subscription (Upgrade or Downgrade).
        /// Returns a new CheckoutUrl if payment is needed immediately, or null if successful instantly.
        /// </summary>
        Task<string?> ChangeSubscriptionAsync(
            string stripeSubscriptionId, int newPlanId, string newPlanName, decimal newPrice, string currency, 
            bool isUpgrade, string successUrl, string cancelUrl, CancellationToken ct = default);

        /// <summary>Validates the webhook signature. Returns false if invalid.</summary>
        bool ValidateWebhookSignature(string payload, string signature);

        /// <summary>Parses a webhook event payload and returns the Stripe Event object.</summary>
        Stripe.Event ParseWebhookEvent(string payload, string signature);
    }
}
