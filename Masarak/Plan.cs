using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Masarak
{
    internal class Plan
    {
        public int PlanId { get; set; }
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        public decimal PriceMonthly { get; set; }
        public decimal? PriceYearly { get; set; }
        public string Currency { get; set; } = "USD";
        public int MaxSubjects { get; set; }
        public bool HasAi { get; set; }
        public bool HasLiveClass { get; set; }
        public bool HasRecordings { get; set; }
        public bool IsActive { get; set; }

        public virtual ICollection<Subscription> Subscriptions { get; set; } = new List<Subscription>();
    }
}
