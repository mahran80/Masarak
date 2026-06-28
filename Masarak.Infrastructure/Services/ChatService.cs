using Masarak.Application.DTOs;
using Masarak.Application.Interfaces;
using Masarak.Domain.Constants;
using Masarak.Domain.Entities;
using Masarak.Domain.Enums;
using Masarak.Domain.Services;
using Masarak.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Masarak.Infrastructure.Services
{
    /// <summary>
    /// Phase 4: Service implementation for Chat operations (REST-based).
    /// </summary>
    public class ChatService : IChatService
    {
        private readonly IChatRoomRepository _roomRepo;
        private readonly IChatMessageRepository _messageRepo;
        private readonly ChatRoomAccessPolicy _accessPolicy;
        private readonly Context _context;

        public ChatService(
            IChatRoomRepository roomRepo,
            IChatMessageRepository messageRepo,
            ChatRoomAccessPolicy accessPolicy,
            Context context)
        {
            _roomRepo     = roomRepo;
            _messageRepo  = messageRepo;
            _accessPolicy = accessPolicy;
            _context      = context;
        }

        public async Task<IEnumerable<ChatRoomDto>> GetMyRoomsAsync(int userId, string role, CancellationToken ct = default)
        {
            var gradeIds = await GetUserGradeIdsAsync(userId, role, ct);
            var rooms = await _roomRepo.GetRoomsForUserAsync(userId, role, gradeIds, ct);

            var result = new List<ChatRoomDto>();
            foreach (var room in rooms)
            {
                var messageCount = await _messageRepo.GetCountAsync(room.ChatRoomId, ct);
                result.Add(new ChatRoomDto(
                    ChatRoomId:   room.ChatRoomId,
                    Name:         room.Name,
                    RoomType:     room.RoomType,
                    GradeId:      room.GradeId,
                    MessageCount: messageCount));
            }

            return result;
        }

        public async Task<(IEnumerable<ChatMessageDto> Messages, int TotalCount)> GetRoomMessagesAsync(
            int userId, string role, int chatRoomId, int page, int pageSize, CancellationToken ct = default)
        {
            var room = await _roomRepo.GetByIdAsync(chatRoomId, ct)
                ?? throw new KeyNotFoundException($"Chat room {chatRoomId} not found.");

            var gradeIds = await GetUserGradeIdsAsync(userId, role, ct);
            if (!_accessPolicy.CanJoin(role, gradeIds, room))
                throw new UnauthorizedAccessException("You do not have access to this chat room.");

            var skip = (page - 1) * pageSize;
            var messages = await _messageRepo.GetRecentAsync(chatRoomId, pageSize, skip, ct);
            var totalCount = await _messageRepo.GetCountAsync(chatRoomId, ct);

            var dtos = messages.Select(m => new ChatMessageDto(
                MessageId:    m.ChatMessageId,
                ChatRoomId:   m.ChatRoomId,
                SenderUserId: m.SenderUserId,
                SenderName:   m.Sender?.FullName ?? "",
                Content:      m.Content,
                SentAt:       m.SentAt,
                IsDeleted:    m.IsDeleted));

            return (dtos, totalCount);
        }

        public async Task<ChatMessageDto> SendMessageAsync(int senderUserId, string senderRole, int chatRoomId, string content, CancellationToken ct = default)
        {
            var room = await _roomRepo.GetByIdAsync(chatRoomId, ct)
                ?? throw new KeyNotFoundException($"Chat room {chatRoomId} not found.");

            var gradeIds = await GetUserGradeIdsAsync(senderUserId, senderRole, ct);
            if (!_accessPolicy.CanJoin(senderRole, gradeIds, room))
                throw new UnauthorizedAccessException("You do not have access to this chat room.");

            if (string.IsNullOrWhiteSpace(content) || content.Length > 1000)
                throw new InvalidOperationException("Message content must be between 1 and 1000 characters.");

            var message = ChatMessage.Create(chatRoomId, senderUserId, content);
            await _messageRepo.AddAsync(message, ct);

            var sender = await _context.Users.FindAsync(new object[] { senderUserId }, ct);

            return new ChatMessageDto(
                MessageId:    message.ChatMessageId,
                ChatRoomId:   message.ChatRoomId,
                SenderUserId: message.SenderUserId,
                SenderName:   sender?.FullName ?? "",
                Content:      message.Content,
                SentAt:       message.SentAt,
                IsDeleted:    message.IsDeleted);
        }

        public async Task DeleteMessageAsync(int actorUserId, string actorRole, int messageId, CancellationToken ct = default)
        {
            var message = await _messageRepo.GetByIdAsync(messageId, ct)
                ?? throw new KeyNotFoundException($"Message {messageId} not found.");

            if (actorRole != AppRoles.Admin && message.SenderUserId != actorUserId)
                throw new UnauthorizedAccessException("You can only delete your own messages.");

            message.SoftDelete();
            await _messageRepo.UpdateAsync(message, ct);
        }

        // ── Private Helpers ─────────────────────────────────────────────────

        private async Task<IEnumerable<int>> GetUserGradeIdsAsync(int userId, string role, CancellationToken ct)
        {
            switch (role)
            {
                case AppRoles.Student:
                {
                    var student = await _context.Students
                        .FirstOrDefaultAsync(s => s.UserId == userId, ct);
                    return student != null ? new[] { student.GradeId } : Enumerable.Empty<int>();
                }
                case AppRoles.Teacher:
                {
                    var teacher = await _context.Teachers
                        .FirstOrDefaultAsync(t => t.UserId == userId, ct);
                    if (teacher == null) return Enumerable.Empty<int>();

                    return await _context.TeachingAssignments
                        .Where(ta => ta.TeacherId == teacher.TeacherId && ta.IsActive)
                        .Select(ta => ta.Class.GradeId)
                        .Distinct()
                        .ToListAsync(ct);
                }
                case AppRoles.Parent:
                {
                    // Get grades of all linked students
                    var linkedStudentUserIds = await _context.ParentStudentLinks
                        .Where(l => l.ParentUserId == userId)
                        .Select(l => l.StudentUserId)
                        .ToListAsync(ct);

                    return await _context.Students
                        .Where(s => linkedStudentUserIds.Contains(s.UserId))
                        .Select(s => s.GradeId)
                        .Distinct()
                        .ToListAsync(ct);
                }
                case AppRoles.Admin:
                    return await _context.Grades.Select(g => g.GradeId).ToListAsync(ct);
                default:
                    return Enumerable.Empty<int>();
            }
        }
    }
}
