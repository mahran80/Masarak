namespace Masarak.Domain.Entities
{
    public class SubscriptionSubject
    {
        public int SubscriptionId { get; set; }
        public int SubjectId { get; set; }

        public virtual Subscription Subscription { get; set; } = null!;
        public virtual Subject Subject { get; set; } = null!;
    }
}
