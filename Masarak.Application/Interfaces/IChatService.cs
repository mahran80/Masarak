using Masarak.Application.DTOs;

namespace Masarak.Application.Interfaces
{
    /// <summary>
    /// Phase 4: Service interface for Chat operations (REST-based).
    /// Real-time messaging is handled via SignalR ChatHub.
    /// </summary>
    public interface IChatService
    {
        /// <summary>Gets accessible chat rooms for the user.</summary>
        Task<IEnumerable<ChatRoomDto>> GetMyRoomsAsync(int userId, string role, CancellationToken ct = default);

        /// <summary>Gets paginated message history for a room.</summary>
        Task<(IEnumerable<ChatMessageDto> Messages, int TotalCount)> GetRoomMessagesAsync(
            int userId, string role, int chatRoomId, int page, int pageSize, CancellationToken ct = default);

        /// <summary>Sends a message (called from ChatHub or REST).</summary>
        Task<ChatMessageDto> SendMessageAsync(int senderUserId, string senderRole, int chatRoomId, string content, CancellationToken ct = default);

        /// <summary>Deletes (soft-deletes) a message. Sender or Admin only.</summary>
        Task DeleteMessageAsync(int actorUserId, string actorRole, int messageId, CancellationToken ct = default);
    }
}
