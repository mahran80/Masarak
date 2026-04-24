using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Masarak
{
    internal class AiRecommendation
    {
        public int RecommendationId { get; set; }
        public int StudentId { get; set; }
        public DateTime GeneratedAt { get; set; }
        public string RecType { get; set; } = null!;
        public string? ReferenceType { get; set; }
        public int? ReferenceId { get; set; }
        public string Reason { get; set; } = null!;
        public string? ActionUrl { get; set; }
        public bool IsRead { get; set; }
        public bool IsDismissed { get; set; }

        public virtual Student Student { get; set; } = null!;
    }
}
