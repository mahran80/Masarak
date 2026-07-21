using Masarak.Application.DTOs;

namespace Masarak.Application.Interfaces
{
    public interface ISessionAdminService
    {
        Task<IEnumerable<SessionDto>> ScheduleSessionSeriesAsync(AdminScheduleSessionRequest request, CancellationToken ct = default);
        Task CancelSessionSeriesAsync(Guid seriesId, CancellationToken ct = default);
        Task<IEnumerable<SessionDto>> GetClassScheduleAsync(int classId, DateTime from, DateTime to, CancellationToken ct = default);
        Task<IEnumerable<SessionDto>> GetAllScheduleAsync(DateTime from, DateTime to, CancellationToken ct = default);
        Task<IEnumerable<SessionDto>> GetTeacherScheduleAsync(int teacherId, DateTime from, DateTime to, CancellationToken ct = default);
        Task CancelSingleSessionAsync(int sessionId, CancellationToken ct = default);
        Task ReactivateSessionAsync(int sessionId, CancellationToken ct = default);
    }
}
