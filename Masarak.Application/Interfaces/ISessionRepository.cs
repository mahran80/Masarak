using Masarak.Domain.Entities;

namespace Masarak.Application.Interfaces
{
    public interface ISessionRepository
    {
        Task<Session?> GetByIdAsync(int sessionId, CancellationToken ct = default);
        Task<Session?> GetByIdWithDetailsAsync(int sessionId, CancellationToken ct = default);
        Task<IEnumerable<Session>> GetByClassIdAsync(int classId, DateTime from, DateTime to, CancellationToken ct = default);
        Task<IEnumerable<Session>> GetByTeachingAssignmentIdAsync(int assignmentId, CancellationToken ct = default);
        Task<IEnumerable<Session>> GetUpcomingByClassIdAsync(int classId, DateTime after, CancellationToken ct = default);
        Task<IEnumerable<Session>> GetByTeacherIdAsync(int teacherId, DateTime from, DateTime to, CancellationToken ct = default);
        Task AddAsync(Session session, CancellationToken ct = default);
        Task UpdateAsync(Session session, CancellationToken ct = default);
    }
}
