using Masarak.Application.Interfaces;
using Masarak.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Masarak.Infrastructure.Persistence.Repositories
{
    public class PlanRepository : IPlanRepository
    {
        private readonly Context _context;

        public PlanRepository(Context context)
        {
            _context = context;
        }

        public async Task<Plan?> GetByIdAsync(int planId, CancellationToken ct = default)
        {
            return await _context.Plans.FindAsync(new object[] { planId }, ct);
        }

        public async Task<IEnumerable<Plan>> GetAllActiveAsync(CancellationToken ct = default)
        {
            return await _context.Plans
                .Where(p => p.IsActive)
                .OrderBy(p => p.PriceMonthly)
                .ToListAsync(ct);
        }

        public async Task AddAsync(Plan plan, CancellationToken ct = default)
        {
            await _context.Plans.AddAsync(plan, ct);
            await _context.SaveChangesAsync(ct);
        }

        public async Task UpdateAsync(Plan plan, CancellationToken ct = default)
        {
            _context.Plans.Update(plan);
            await _context.SaveChangesAsync(ct);
        }

        public async Task DeleteAsync(Plan plan, CancellationToken ct = default)
        {
            plan.IsActive = false; // Soft delete
            _context.Plans.Update(plan);
            await _context.SaveChangesAsync(ct);
        }
    }
}
