using Masarak.Domain.Enums;

namespace Masarak.Application.DTOs
{
    // ─── Subscription DTOs ───────────────────────────────────────────────────────

    public record SubscriptionDto(
        int SubscriptionId,
        int UserId,
        string UserFullName,
        string PlanName,
        PlanType PlanType,
        SubscriptionStatus Status,
        DateTime StartDate,
        DateTime EndDate,
        ActivationMethod ActivationMethod,
        string? AdminNote,
        bool IsStripeManaged
    );

    public record PlanDto(
        int PlanId,
        string Name,
        string? Description,
        PlanType Type,
        decimal Price,
        string Currency,
        int DurationDays,
        int MaxSubjects,
        bool HasAi,
        bool HasLiveClass
    );

    public record CreatePlanRequest
    {
        public string Name { get; init; } = null!;
        public string? Description { get; init; }
        public PlanType Type { get; init; }
        public decimal Price { get; init; }
        public string Currency { get; init; } = "EGP";
        public int DurationDays { get; init; } = 30;
        public int MaxSubjects { get; init; }
        public bool HasAi { get; init; }
        public bool HasLiveClass { get; init; }
    }

    public record UpdatePlanRequest
    {
        public string Name { get; init; } = null!;
        public string? Description { get; init; }
        public decimal Price { get; init; }
        public int DurationDays { get; init; }
        public int MaxSubjects { get; init; }
        public bool HasAi { get; init; }
        public bool HasLiveClass { get; init; }
    }

    public record ParentStudentLinkDto(
        int LinkId,
        int ParentUserId,
        int StudentUserId,
        string StudentFullName,
        DateTime LinkedAt
    );

    public record LinkedStudentDto(
        int StudentUserId,
        string FullName,
        string Email,
        bool HasActiveSubscription
    );

    // ─── Paged result ────────────────────────────────────────────────────────────

    public record PagedResult<T>(
        IEnumerable<T> Items,
        int TotalCount,
        int PageNumber,
        int PageSize
    )
    {
        public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
        public bool HasPrevious => PageNumber > 1;
        public bool HasNext => PageNumber < TotalPages;
    }

    // ─── Checkout DTOs ───────────────────────────────────────────────────────────

    public record InitiateCheckoutRequest
    {
        public int PlanId { get; init; }
        public string SuccessUrl { get; init; } = null!;
        public string CancelUrl { get; init; } = null!;
        public List<int>? SubjectIds { get; init; }
    }

    public record CheckoutResult(string CheckoutUrl, string SessionId);

    // ─── Admin Activation DTOs ───────────────────────────────────────────────────

    public record AdminActivateRequest
    {
        public int StudentUserId { get; init; }
        public int PlanId { get; init; }
        public string? Note { get; init; }
        public List<int>? SubjectIds { get; init; }
    }

    public record AdminCancelRequest
    {
        public string Reason { get; init; } = null!;
    }

    // ─── Parent Link DTOs ────────────────────────────────────────────────────────

    public record LinkStudentRequest
    {
        public string StudentLinkageCode { get; init; } = null!;
    }

    // ─── Subscription Status ─────────────────────────────────────────────────────

    public record SubscriptionStatusResponse(
        bool HasActiveSubscription,
        SubscriptionDto? ActiveSubscription
    );
}
