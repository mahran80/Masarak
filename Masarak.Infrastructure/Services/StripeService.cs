using Masarak.Application.Interfaces;
using Masarak.Infrastructure.Configurations;
using Microsoft.Extensions.Options;
using Stripe;
using Stripe.Checkout;

namespace Masarak.Infrastructure.Services
{
    public class StripeService : IStripeService
    {
        private readonly StripeSettings _settings;

        public StripeService(IOptions<StripeSettings> options)
        {
            _settings = options.Value;
            StripeConfiguration.ApiKey = _settings.SecretKey;
        }

        public async Task<(string CheckoutUrl, string SessionId)> CreateCheckoutSessionAsync(
            int userId, int planId, string planName, decimal price, string currency, 
            string successUrl, string cancelUrl, CancellationToken ct = default)
        {
            var options = new SessionCreateOptions
            {
                PaymentMethodTypes = new List<string> { "card" },
                LineItems = new List<SessionLineItemOptions>
                {
                    new SessionLineItemOptions
                    {
                        PriceData = new SessionLineItemPriceDataOptions
                        {
                            UnitAmountDecimal = price * 100, // Stripe uses smallest currency unit
                            Currency = currency.ToLowerInvariant(),
                            Recurring = new SessionLineItemPriceDataRecurringOptions { Interval = "month" },
                            ProductData = new SessionLineItemPriceDataProductDataOptions
                            {
                                Name = planName,
                            },
                        },
                        Quantity = 1,
                    },
                },
                Mode = "subscription", // Using subscription mode for automatic billing & prorations
                SubscriptionData = new SessionSubscriptionDataOptions
                {
                    Metadata = new Dictionary<string, string>
                    {
                        { "UserId", userId.ToString() },
                        { "PlanId", planId.ToString() }
                    }
                },
                SuccessUrl = successUrl + "?session_id={CHECKOUT_SESSION_ID}",
                CancelUrl = cancelUrl,
                ClientReferenceId = $"{userId}_{planId}",
                Metadata = new Dictionary<string, string>
                {
                    { "UserId", userId.ToString() },
                    { "PlanId", planId.ToString() }
                }
            };

            var service = new Stripe.Checkout.SessionService();
            var session = await service.CreateAsync(options, cancellationToken: ct);

            return (session.Url, session.Id);
        }

        public async Task<string?> ChangeSubscriptionAsync(
            string stripeSubscriptionId, int newPlanId, string newPlanName, decimal newPrice, string currency, 
            bool isUpgrade, string successUrl, string cancelUrl, CancellationToken ct = default)
        {
            var service = new Stripe.SubscriptionService();
            var subscription = await service.GetAsync(stripeSubscriptionId, cancellationToken: ct);
            
            var options = new SubscriptionUpdateOptions
            {
                ProrationBehavior = isUpgrade ? "create_prorations" : "none",
                Items = new List<SubscriptionItemOptions>
                {
                    new SubscriptionItemOptions
                    {
                        Id = subscription.Items.Data[0].Id,
                        PriceData = new SubscriptionItemPriceDataOptions
                        {
                            UnitAmountDecimal = newPrice * 100,
                            Currency = currency.ToLowerInvariant(),
                            Recurring = new SubscriptionItemPriceDataRecurringOptions { Interval = "month" },
                            Product = subscription.Items.Data[0].Price.ProductId
                        }
                    }
                },
                Metadata = new Dictionary<string, string> { { "PlanId", newPlanId.ToString() } }
            };

            await service.UpdateAsync(stripeSubscriptionId, options, cancellationToken: ct);
            
            return null; // Updated successfully via API, no checkout redirect needed.
        }

        public bool ValidateWebhookSignature(string payload, string signature)
        {
            try
            {
                // This throws an exception if invalid
                EventUtility.ConstructEvent(payload, signature, _settings.WebhookSecret);
                return true;
            }
            catch (StripeException)
            {
                return false;
            }
        }

        public Stripe.Event ParseWebhookEvent(string payload, string signature)
        {
            return EventUtility.ConstructEvent(payload, signature, _settings.WebhookSecret);
        }
    }
}
