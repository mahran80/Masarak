using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Masarak
{
    internal class Subscription
    {
        public int SubscriptionId { get; set; }
        public int UserId { get; set; }
        public int PlanId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string BillingCycle { get; set; } = "Monthly";
        public string Status { get; set; } = "Active";
        public bool AutoRenew { get; set; }
        public DateTime CreatedAt { get; set; }

        public virtual User User { get; set; } = null!;
        public virtual Plan Plan { get; set; } = null!;
        public virtual ICollection<Payment> Payments { get; set; } = new List<Payment>();
    }
}
