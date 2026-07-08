using Masarak.API.Policies;
using Masarak.Application.DTOs;
using Masarak.Domain.Enums;
using Masarak.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Masarak.API.Controllers
{
    /// <summary>
    /// Phase 6: Admin system health endpoint.
    /// Provides platform-wide metrics for the admin dashboard.
    /// </summary>
    [ApiController]
    [Route("api/admin/system")]
    [Authorize(Policy = AppPolicies.AdminOnly)]
    public class AdminSystemController : ControllerBase
    {
        private readonly Context _context;

        public AdminSystemController(Context context)
        {
            _context = context;
        }

        /// <summary>
        /// GET /api/admin/system/health — Get system health metrics.
        /// </summary>
        [HttpGet("health")]
        public async Task<IActionResult> GetSystemHealth(CancellationToken ct = default)
        {
            var totalUsers = await _context.Users.CountAsync(ct);
            var activeUsers = await _context.Users.CountAsync(u => u.IsActive, ct);
            var totalNotifications = await _context.Notifications.CountAsync(ct);
            var activeSubscriptions = await _context.Subscriptions
                .CountAsync(s => s.Status == SubscriptionStatus.Active, ct);
            var totalContentItems = await _context.ContentItems.CountAsync(ct);
            var totalSessions = await _context.Sessions.CountAsync(ct);

            var dto = new SystemHealthDto(
                totalUsers,
                activeUsers,
                totalNotifications,
                activeSubscriptions,
                totalContentItems,
                totalSessions,
                Enumerable.Empty<string>()); // RecentErrors — would come from structured logging in production

            return Ok(dto);
        }

        /// <summary>
        /// GET /api/admin/system/subscriptions-dashboard — Get subscription metrics and recent records.
        /// </summary>
        [HttpGet("subscriptions-dashboard")]
        public async Task<IActionResult> GetSubscriptionsDashboard(CancellationToken ct = default)
        {
            var activeCount = await _context.Subscriptions.CountAsync(s => s.Status == SubscriptionStatus.Active, ct);
            
            var monthlyRevenue = await _context.Subscriptions
                .Where(s => s.Status == SubscriptionStatus.Active)
                .SumAsync(s => s.Plan.PriceMonthly, ct);

            var records = await _context.Subscriptions
                .Include(s => s.User)
                .Include(s => s.Plan)
                .OrderByDescending(s => s.CreatedAt)
                .Take(50)
                .Select(s => new AdminSubscriptionRecordDto
                {
                    Id = s.SubscriptionId.ToString(),
                    StudentName = s.User.FullName,
                    Plan = s.Plan.Name,
                    Amount = s.Plan.PriceMonthly,
                    Status = s.Status == SubscriptionStatus.Active ? "مدفوع" : (s.Status == SubscriptionStatus.Cancelled ? "ملغى" : "معلق"),
                    CreatedAt = s.CreatedAt
                })
                .ToListAsync(ct);

            return Ok(new AdminSubscriptionsDashboardDto
            {
                ActiveSubscriptionsCount = activeCount,
                MonthlyRevenue = monthlyRevenue,
                RecentRecords = records
            });
        }
    }

    public class AdminSubscriptionsDashboardDto
    {
        public int ActiveSubscriptionsCount { get; set; }
        public decimal MonthlyRevenue { get; set; }
        public IEnumerable<AdminSubscriptionRecordDto> RecentRecords { get; set; } = new List<AdminSubscriptionRecordDto>();
    }

    public class AdminSubscriptionRecordDto
    {
        public string Id { get; set; } = string.Empty;
        public string StudentName { get; set; } = string.Empty;
        public string Plan { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }
}
