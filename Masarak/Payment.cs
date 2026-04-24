using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Masarak
{
    internal class Payment
    {
        public int PaymentId { get; set; }
        public int SubscriptionId { get; set; }
        public decimal Amount { get; set; }
        public string Currency { get; set; } = "USD";
        public string Gateway { get; set; } = null!;
        public string? GatewayTxnId { get; set; }
        public string Status { get; set; } = null!;
        public DateTime? PaidAt { get; set; }
        public DateTime CreatedAt { get; set; }

        public virtual Subscription Subscription { get; set; } = null!;
    }
}
