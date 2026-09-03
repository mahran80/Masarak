using Masarak.Domain.Entities;

namespace Masarak.Application.Interfaces
{
    public interface IPlanRepository
    {
        Task<Plan?> GetByIdAsync(int planId, CancellationToken ct = default);
        Task<IEnumerable<Plan>> GetAllActiveAsync(CancellationToken ct = default);
        Task AddAsync(Plan plan, CancellationToken ct = default);
        Task UpdateAsync(Plan plan, CancellationToken ct = default);
        Task DeleteAsync(Plan plan, CancellationToken ct = default);
    }
}
