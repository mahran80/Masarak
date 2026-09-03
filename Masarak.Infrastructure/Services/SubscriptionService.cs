using Masarak.Application.DTOs;
using Masarak.Application.Interfaces;
using Masarak.Domain.Entities;
using Masarak.Domain.Enums;

namespace Masarak.Infrastructure.Services
{
    public class SubscriptionService : ISubscriptionService
    {
        private readonly ISubscriptionRepository _subscriptionRepository;
        private readonly IPlanRepository _planRepository;
        private readonly IPaymentRepository _paymentRepository;
        private readonly IParentStudentLinkRepository _linkRepository;
        private readonly IUserRepository _userRepository;
        private readonly IStripeService _stripeService;
        private readonly ISubscriptionAccessService _accessService;

        public SubscriptionService(
            ISubscriptionRepository subscriptionRepository,
            IPlanRepository planRepository,
            IPaymentRepository paymentRepository,
            IParentStudentLinkRepository linkRepository,
            IUserRepository userRepository,
            IStripeService stripeService,
            ISubscriptionAccessService accessService)
        {
            _subscriptionRepository = subscriptionRepository;
            _planRepository = planRepository;
            _paymentRepository = paymentRepository;
            _linkRepository = linkRepository;
            _userRepository = userRepository;
            _stripeService = stripeService;
            _accessService = accessService;
        }

        public async Task<CheckoutResult> InitiateCheckoutAsync(int userId, InitiateCheckoutRequest request, CancellationToken ct = default)
        {
            var plan = await _planRepository.GetByIdAsync(request.PlanId, ct);
            if (plan == null) throw new InvalidOperationException("Plan not found.");

            var activeSub = await _subscriptionRepository.GetActiveByUserIdAsync(userId, ct);
            if (activeSub != null) throw new InvalidOperationException("User already has an active subscription.");

            var (url, sessionId) = await _stripeService.CreateCheckoutSessionAsync(
                userId, plan.PlanId, plan.Name, plan.PriceMonthly, plan.Currency,
                request.SuccessUrl, request.CancelUrl, ct);

            var subscription = new Subscription
            {
                UserId = userId,
                PlanId = plan.PlanId,
                Status = SubscriptionStatus.Pending,
                ActivationMethod = ActivationMethod.Stripe,
                StripeSessionId = sessionId,
                CreatedAt = DateTime.UtcNow,
                StartDate = DateTime.UtcNow,
                EndDate = DateTime.UtcNow.AddDays(plan.DurationDays) // Will be updated on activation
            };

            if (request.SubjectIds != null && request.SubjectIds.Any())
            {
                foreach (var sId in request.SubjectIds)
                {
                    subscription.SubscriptionSubjects.Add(new SubscriptionSubject { SubjectId = sId });
                }
            }

            await _subscriptionRepository.AddAsync(subscription, ct);
            return new CheckoutResult(url, sessionId);
        }

        public async Task HandleStripeWebhookAsync(string payload, string signature, CancellationToken ct = default)
        {
            if (!_stripeService.ValidateWebhookSignature(payload, signature))
                throw new UnauthorizedAccessException("Invalid webhook signature.");

            var stripeEvent = _stripeService.ParseWebhookEvent(payload, signature);

            if (stripeEvent.Type == "checkout.session.completed")
            {
                var session = stripeEvent.Data.Object as Stripe.Checkout.Session;
                if (session == null) return;

                var subscription = await _subscriptionRepository.GetByStripeSessionIdAsync(session.Id, ct);
                if (subscription != null && subscription.Status == SubscriptionStatus.Pending)
                {
                    subscription.Status = SubscriptionStatus.Active;
                    subscription.StartDate = DateTime.UtcNow;
                    subscription.EndDate = DateTime.UtcNow.AddDays(subscription.Plan.DurationDays);
                    subscription.StripeSubscriptionId = session.SubscriptionId;
                    
                    await _subscriptionRepository.UpdateAsync(subscription, ct);

                    var payment = new Payment
                    {
                        SubscriptionId = subscription.SubscriptionId,
                        Amount = subscription.Plan.PriceMonthly,
                        Currency = subscription.Plan.Currency,
                        Status = PaymentStatus.Completed,
                        Provider = PaymentProvider.Stripe,
                        Gateway = "Stripe",
                        StripePaymentIntentId = session.PaymentIntentId,
                        CreatedAt = DateTime.UtcNow,
                        PaidAt = DateTime.UtcNow
                    };
                    await _paymentRepository.AddAsync(payment, ct);

                    await _accessService.InvalidateCacheAsync(subscription.UserId);
                }
            }
            else if (stripeEvent.Type == "customer.subscription.updated")
            {
                var stripeSub = stripeEvent.Data.Object as Stripe.Subscription;
                if (stripeSub != null && stripeSub.Metadata.TryGetValue("PlanId", out var planIdStr) && int.TryParse(planIdStr, out var newPlanId))
                {
                    var subscription = await _subscriptionRepository.GetByStripeSubscriptionIdAsync(stripeSub.Id, ct);
                    if (subscription != null && subscription.PlanId != newPlanId)
                    {
                        var newPlan = await _planRepository.GetByIdAsync(newPlanId, ct);
                        if (newPlan != null)
                        {
                            subscription.PlanId = newPlanId;
                            // Optionally update EndDate based on new plan duration or keep it synced with Stripe's current_period_end
                            // In a full Stripe Billing setup, we'd sync StartDate and EndDate directly from stripeSub.CurrentPeriodStart/End
                            
                            await _subscriptionRepository.UpdateAsync(subscription, ct);
                            await _accessService.InvalidateCacheAsync(subscription.UserId);
                        }
                    }
                }
            }
        }

        public async Task<bool> VerifyCheckoutSessionAsync(string sessionId, CancellationToken ct = default)
        {
            var subscription = await _subscriptionRepository.GetByStripeSessionIdAsync(sessionId, ct);
            if (subscription == null) return false;
            
            if (subscription.Status == SubscriptionStatus.Active) 
                return true;

            var service = new Stripe.Checkout.SessionService();
            var session = await service.GetAsync(sessionId, cancellationToken: ct);

            if (session.PaymentStatus == "paid")
            {
                subscription.Status = SubscriptionStatus.Active;
                subscription.StartDate = DateTime.UtcNow;
                subscription.EndDate = DateTime.UtcNow.AddDays(subscription.Plan.DurationDays);
                subscription.StripeSubscriptionId = session.SubscriptionId;
                
                await _subscriptionRepository.UpdateAsync(subscription, ct);
                
                // Add payment if not exists
                var payment = new Payment
                {
                    SubscriptionId = subscription.SubscriptionId,
                    Amount = subscription.Plan.PriceMonthly,
                    Currency = subscription.Plan.Currency,
                    Status = PaymentStatus.Completed,
                    Provider = PaymentProvider.Stripe,
                    Gateway = "Stripe",
                    StripePaymentIntentId = session.PaymentIntentId,
                    CreatedAt = DateTime.UtcNow,
                    PaidAt = DateTime.UtcNow
                };
                await _paymentRepository.AddAsync(payment, ct);

                await _accessService.InvalidateCacheAsync(subscription.UserId);
                return true;
            }
            return false;
        }

        public async Task<string?> ChangeSubscriptionAsync(int parentId, int childId, int newPlanId, CancellationToken ct = default)
        {
            if (!await _linkRepository.LinkExistsAsync(parentId, childId, ct))
                throw new UnauthorizedAccessException("You do not have permission to manage this student's subscription.");

            var activeSub = await _subscriptionRepository.GetActiveByUserIdAsync(childId, ct);
            if (activeSub == null)
                throw new InvalidOperationException("Student does not have an active subscription to change.");

            if (string.IsNullOrEmpty(activeSub.StripeSubscriptionId))
                throw new InvalidOperationException("Only subscriptions managed by Stripe can be upgraded or downgraded online.");

            var newPlan = await _planRepository.GetByIdAsync(newPlanId, ct);
            if (newPlan == null) throw new InvalidOperationException("Selected plan not found.");

            if (activeSub.PlanId == newPlanId)
                throw new InvalidOperationException("Student is already on this plan.");

            bool isUpgrade = newPlan.PriceMonthly > activeSub.Plan.PriceMonthly;

            var checkoutUrl = await _stripeService.ChangeSubscriptionAsync(
                activeSub.StripeSubscriptionId, 
                newPlanId, 
                newPlan.Name, 
                newPlan.PriceMonthly, 
                newPlan.Currency, 
                isUpgrade,
                successUrl: "", // Handled by API call directly
                cancelUrl: "", 
                ct);

            if (isUpgrade)
            {
                // Immediate update in domain for upgrades
                activeSub.PlanId = newPlanId;
                await _subscriptionRepository.UpdateAsync(activeSub, ct);
                await _accessService.InvalidateCacheAsync(childId);
            }
            // For downgrades, we do not update local PlanId yet. We wait for customer.subscription.updated webhook
            // at the end of the billing cycle.

            return checkoutUrl;
        }

        public async Task<SubscriptionDto> AdminActivateAsync(int adminId, AdminActivateRequest request, CancellationToken ct = default)
        {
            var plan = await _planRepository.GetByIdAsync(request.PlanId, ct);
            if (plan == null) throw new InvalidOperationException("Plan not found.");

            var studentUser = await _userRepository.GetByIdAsync(request.StudentUserId, ct);
            if (studentUser == null) throw new InvalidOperationException("User not found.");
            if (studentUser.Role.Name != "Student") throw new InvalidOperationException("Subscription can only be activated for Student users.");

            var activeSub = await _subscriptionRepository.GetActiveByUserIdAsync(request.StudentUserId, ct);
            if (activeSub != null) throw new InvalidOperationException("Student already has an active subscription.");

            var subscription = new Subscription
            {
                UserId = request.StudentUserId,
                PlanId = plan.PlanId,
                Status = SubscriptionStatus.Active,
                ActivationMethod = ActivationMethod.AdminManual,
                ActivatedByAdminId = adminId,
                AdminNote = request.Note,
                CreatedAt = DateTime.UtcNow,
                StartDate = DateTime.UtcNow,
                EndDate = DateTime.UtcNow.AddDays(plan.DurationDays)
            };

            if (request.SubjectIds != null && request.SubjectIds.Any())
            {
                foreach (var sId in request.SubjectIds)
                {
                    subscription.SubscriptionSubjects.Add(new SubscriptionSubject { SubjectId = sId });
                }
            }

            await _subscriptionRepository.AddAsync(subscription, ct);

            var paymentAmount = plan.Type == PlanType.PerSubject && request.SubjectIds != null && request.SubjectIds.Any()
                ? plan.PriceMonthly * request.SubjectIds.Count
                : plan.PriceMonthly;

            var payment = new Payment
            {
                SubscriptionId = subscription.SubscriptionId,
                Amount = paymentAmount,
                Currency = plan.Currency,
                Status = PaymentStatus.Completed,
                Provider = PaymentProvider.Manual,
                Gateway = "Manual",
                CreatedAt = DateTime.UtcNow,
                PaidAt = DateTime.UtcNow
            };
            await _paymentRepository.AddAsync(payment, ct);

            await _accessService.InvalidateCacheAsync(request.StudentUserId);
            
            // Reload with user to map DTO
            var loadedSub = await _subscriptionRepository.GetByIdAsync(subscription.SubscriptionId, ct);
            return MapToDto(loadedSub!);
        }

        public async Task AdminCancelAsync(int adminId, int subscriptionId, string reason, CancellationToken ct = default)
        {
            var subscription = await _subscriptionRepository.GetByIdAsync(subscriptionId, ct);
            if (subscription == null) throw new InvalidOperationException("Subscription not found.");

            subscription.Status = SubscriptionStatus.Cancelled;
            subscription.AdminNote = $"Cancelled by Admin {adminId}. Reason: {reason}. Previous Note: {subscription.AdminNote}";
            
            await _subscriptionRepository.UpdateAsync(subscription, ct);
            await _accessService.InvalidateCacheAsync(subscription.UserId);
        }

        public async Task<PagedResult<SubscriptionDto>> GetAllSubscriptionsAsync(int pageNumber, int pageSize, SubscriptionStatus? status, CancellationToken ct = default)
        {
            var (items, total) = await _subscriptionRepository.GetAllPagedAsync(pageNumber, pageSize, status, ct);
            return new PagedResult<SubscriptionDto>(
                items.Select(MapToDto), total, pageNumber, pageSize);
        }

        public async Task<SubscriptionDto?> GetActiveSubscriptionAsync(int userId, CancellationToken ct = default)
        {
            var sub = await _subscriptionRepository.GetActiveByUserIdAsync(userId, ct);
            return sub != null ? MapToDto(sub) : null;
        }

        public async Task<IEnumerable<SubscriptionDto>> GetSubscriptionHistoryAsync(int userId, CancellationToken ct = default)
        {
            var subs = await _subscriptionRepository.GetByUserIdAsync(userId, ct);
            return subs.Select(MapToDto);
        }

        public async Task<IEnumerable<PlanDto>> GetAllPlansAsync(CancellationToken ct = default)
        {
            var plans = await _planRepository.GetAllActiveAsync(ct);
            return plans.Select(p => new PlanDto(
                p.PlanId, p.Name, p.Description, p.Type, p.PriceMonthly, p.Currency, 
                p.DurationDays, p.MaxSubjects, p.HasAi, p.HasLiveClass));
        }

        public async Task<PlanDto> CreatePlanAsync(CreatePlanRequest request, CancellationToken ct = default)
        {
            var plan = new Plan
            {
                Name = request.Name,
                Description = request.Description,
                Type = request.Type,
                PriceMonthly = request.Price,
                Currency = request.Currency,
                DurationDays = request.DurationDays,
                MaxSubjects = request.MaxSubjects,
                HasAi = request.HasAi,
                HasLiveClass = request.HasLiveClass,
                IsActive = true
            };

            await _planRepository.AddAsync(plan, ct);

            return new PlanDto(
                plan.PlanId, plan.Name, plan.Description, plan.Type, plan.PriceMonthly, plan.Currency,
                plan.DurationDays, plan.MaxSubjects, plan.HasAi, plan.HasLiveClass);
        }

        public async Task<PlanDto> UpdatePlanAsync(int planId, UpdatePlanRequest request, CancellationToken ct = default)
        {
            var plan = await _planRepository.GetByIdAsync(planId, ct);
            if (plan == null) throw new KeyNotFoundException("Plan not found");

            plan.Name = request.Name;
            plan.Description = request.Description;
            plan.PriceMonthly = request.Price;
            plan.DurationDays = request.DurationDays;
            plan.MaxSubjects = request.MaxSubjects;
            plan.HasAi = request.HasAi;
            plan.HasLiveClass = request.HasLiveClass;

            await _planRepository.UpdateAsync(plan, ct);

            return new PlanDto(
                plan.PlanId, plan.Name, plan.Description, plan.Type, plan.PriceMonthly, plan.Currency,
                plan.DurationDays, plan.MaxSubjects, plan.HasAi, plan.HasLiveClass);
        }

        public async Task DeletePlanAsync(int planId, CancellationToken ct = default)
        {
            var plan = await _planRepository.GetByIdAsync(planId, ct);
            if (plan == null) throw new KeyNotFoundException("Plan not found");

            await _planRepository.DeleteAsync(plan, ct);
        }

        public async Task<ParentStudentLinkDto> LinkParentToStudentAsync(int parentUserId, string studentLinkageCode, CancellationToken ct = default)
        {
            var studentUser = await _userRepository.GetByStudentLinkageCodeAsync(studentLinkageCode, ct);
            if (studentUser == null || studentUser.Role.Name != "Student")
                throw new InvalidOperationException("Invalid student linkage code.");

            if (await _linkRepository.LinkExistsAsync(parentUserId, studentUser.UserId, ct))
                throw new InvalidOperationException("Student is already linked to this parent.");

            var link = new ParentStudentLink
            {
                ParentUserId = parentUserId,
                StudentUserId = studentUser.UserId,
                LinkedAt = DateTime.UtcNow
            };

            await _linkRepository.AddAsync(link, ct);

            return new ParentStudentLinkDto(
                link.ParentStudentLinkId, parentUserId, studentUser.UserId, studentUser.FullName, link.LinkedAt);
        }

        public async Task<IEnumerable<LinkedStudentDto>> GetLinkedStudentsAsync(int parentUserId, CancellationToken ct = default)
        {
            var links = await _linkRepository.GetByParentUserIdAsync(parentUserId, ct);
            return links.Select(l => new LinkedStudentDto(
                l.StudentUserId, 
                l.Student.FullName, 
                l.Student.Email, 
                l.Student.Subscriptions.Any(s => s.Status == SubscriptionStatus.Active)));
        }

        public async Task<string?> GetStudentLinkageCodeAsync(int userId, CancellationToken ct = default)
        {
            var user = await _userRepository.GetByIdAsync(userId, ct);
            if (user == null || user.Role.Name != "Student") return null;

            if (string.IsNullOrEmpty(user.StudentLinkageCode))
            {
                user.StudentLinkageCode = Masarak.Domain.ValueObjects.StudentLinkageCode.Generate().Value;
                await _userRepository.UpdateAsync(user, ct);
            }
            return user.StudentLinkageCode;
        }

        private static SubscriptionDto MapToDto(Subscription s) => new(
            s.SubscriptionId,
            s.UserId,
            s.User?.FullName ?? "",
            s.Plan?.Name ?? "",
            s.Plan?.Type ?? PlanType.Monthly,
            s.Status,
            s.StartDate,
            s.EndDate,
            s.ActivationMethod,
            s.AdminNote,
            !string.IsNullOrEmpty(s.StripeSubscriptionId)
        );
    }
}
