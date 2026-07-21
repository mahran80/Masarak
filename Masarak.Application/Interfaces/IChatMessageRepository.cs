using Masarak.Domain.Entities;

namespace Masarak.Application.Interfaces
{
    /// <summary>
    /// Phase 4: Repository interface for ChatMessage entity.
    /// </summary>
    public interface IChatMessageRepository
    {
        Task<ChatMessage?> GetByIdAsync(int messageId, CancellationToken ct = default);
        Task<IEnumerable<ChatMessage>> GetRecentAsync(int chatRoomId, int count, int skip, CancellationToken ct = default);
        Task<int> GetCountAsync(int chatRoomId, CancellationToken ct = default);
        Task AddAsync(ChatMessage message, CancellationToken ct = default);
        Task UpdateAsync(ChatMessage message, CancellationToken ct = default);
    }
}
