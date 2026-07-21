using Masarak.Application.Interfaces;
using Masarak.Domain.Constants;
using Masarak.Domain.Entities;
using Masarak.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Masarak.Infrastructure.Persistence.Repositories
{
    /// <summary>
    /// Phase 4: Repository implementation for ChatRoom entity.
    /// </summary>
    public class ChatRoomRepository : IChatRoomRepository
    {
        private readonly Context _context;

        public ChatRoomRepository(Context context)
        {
            _context = context;
        }

        public async Task<ChatRoom?> GetByIdAsync(int roomId, CancellationToken ct = default)
        {
            return await _context.ChatRooms
                .FirstOrDefaultAsync(r => r.ChatRoomId == roomId, ct);
        }

        public async Task<ChatRoom?> GetGradeRoomAsync(int gradeId, CancellationToken ct = default)
        {
            return await _context.ChatRooms
                .FirstOrDefaultAsync(r => r.RoomType == ChatRoomType.GradeCommunity
                    && r.GradeId == gradeId && r.IsActive, ct);
        }

        public async Task<ChatRoom?> GetTeachersRoomAsync(CancellationToken ct = default)
        {
            return await _context.ChatRooms
                .FirstOrDefaultAsync(r => r.RoomType == ChatRoomType.TeachersCommunity
                    && r.IsActive, ct);
        }

        public async Task<IEnumerable<ChatRoom>> GetRoomsForUserAsync(
            int userId, string role, IEnumerable<int> userGradeIds, CancellationToken ct = default)
        {
            var gradeIdList = userGradeIds.ToList();

            if (role == AppRoles.Admin)
            {
                return await _context.ChatRooms
                    .Where(r => r.IsActive)
                    .OrderBy(r => r.Name)
                    .ToListAsync(ct);
            }

            if (role == AppRoles.Teacher)
            {
                return await _context.ChatRooms
                    .Where(r => r.IsActive &&
                        (r.RoomType == ChatRoomType.TeachersCommunity ||
                         (r.RoomType == ChatRoomType.GradeCommunity && r.GradeId.HasValue && gradeIdList.Contains(r.GradeId.Value))))
                    .OrderBy(r => r.Name)
                    .ToListAsync(ct);
            }

            // Student or Parent — only GradeCommunity rooms for their grades
            return await _context.ChatRooms
                .Where(r => r.IsActive
                    && r.RoomType == ChatRoomType.GradeCommunity
                    && r.GradeId.HasValue
                    && gradeIdList.Contains(r.GradeId.Value))
                .OrderBy(r => r.Name)
                .ToListAsync(ct);
        }

        public async Task AddAsync(ChatRoom room, CancellationToken ct = default)
        {
            await _context.ChatRooms.AddAsync(room, ct);
            await _context.SaveChangesAsync(ct);
        }
    }
}
