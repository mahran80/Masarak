using System.Threading;
using System.Threading.Tasks;

namespace Masarak.Application.Interfaces
{
    public interface IHybridQuotaService
    {
        Task<bool> IsWithinQuotaAsync(int studentUserId, CancellationToken ct);
        Task IncrementAsync(int studentUserId, CancellationToken ct);
    }
}
