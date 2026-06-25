using Masarak.Domain.Entities;

namespace Masarak.Application.Interfaces
{
    /// <summary>
    /// Phase 4: Repository interface for ChatRoom entity.
    /// </summary>
    public interface IChatRoomRepository
    {
        Task<ChatRoom?> GetByIdAsync(int roomId, CancellationToken ct = default);
        Task<ChatRoom?> GetGradeRoomAsync(int gradeId, CancellationToken ct = default);
        Task<ChatRoom?> GetTeachersRoomAsync(CancellationToken ct = default);
        Task<IEnumerable<ChatRoom>> GetRoomsForUserAsync(int userId, string role, IEnumerable<int> userGradeIds, CancellationToken ct = default);
        Task AddAsync(ChatRoom room, CancellationToken ct = default);
    }
}
