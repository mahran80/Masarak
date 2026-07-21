using Masarak.Application.Interfaces;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Configuration;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace Masarak.Infrastructure.Services.AI.Hybrid
{
    public class HybridQuotaService : IHybridQuotaService
    {
        private readonly IDistributedCache _cache;
        private readonly int _dailyLimit;

        public HybridQuotaService(IDistributedCache cache, IConfiguration config)
        {
            _cache = cache;
            _dailyLimit = config.GetValue<int>("AI:DailyQuotaPerStudent", 3);
        }

        public async Task<bool> IsWithinQuotaAsync(int studentUserId, CancellationToken ct)
        {
            var key = GetQuotaKey(studentUserId);
            var currentStr = await _cache.GetStringAsync(key, ct);
            
            if (string.IsNullOrEmpty(currentStr)) return true;
            
            if (int.TryParse(currentStr, out int current))
            {
                return current < _dailyLimit;
            }
            return true;
        }

        public async Task IncrementAsync(int studentUserId, CancellationToken ct)
        {
            var key = GetQuotaKey(studentUserId);
            var currentStr = await _cache.GetStringAsync(key, ct);
            
            int current = 0;
            if (!string.IsNullOrEmpty(currentStr))
            {
                int.TryParse(currentStr, out current);
            }

            current++;
            
            var options = new DistributedCacheEntryOptions
            {
                AbsoluteExpiration = DateTime.UtcNow.Date.AddDays(1) // Midnight UTC
            };
            
            await _cache.SetStringAsync(key, current.ToString(), options, ct);
        }

        private string GetQuotaKey(int studentUserId)
        {
            return $"ai_quota:{studentUserId}:{DateTime.UtcNow:yyyy-MM-dd}";
        }
    }
}
