using Masarak.Application.Interfaces;
using Masarak.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Masarak.Infrastructure.Persistence.Repositories
{
    /// <summary>
    /// Phase 4: Repository implementation for ChatMessage entity.
    /// </summary>
    public class ChatMessageRepository : IChatMessageRepository
    {
        private readonly Context _context;

        public ChatMessageRepository(Context context)
        {
            _context = context;
        }

        public async Task<ChatMessage?> GetByIdAsync(int messageId, CancellationToken ct = default)
        {
            // IgnoreQueryFilters to allow admin/sender to delete even soft-deleted messages
            return await _context.ChatMessages
                .IgnoreQueryFilters()
                .Include(m => m.Sender)
                .FirstOrDefaultAsync(m => m.ChatMessageId == messageId, ct);
        }

        public async Task<IEnumerable<ChatMessage>> GetRecentAsync(int chatRoomId, int count, int skip, CancellationToken ct = default)
        {
            return await _context.ChatMessages
                .Include(m => m.Sender)
                .Where(m => m.ChatRoomId == chatRoomId)
                .OrderByDescending(m => m.SentAt)
                .Skip(skip)
                .Take(count)
                .OrderBy(m => m.SentAt) // return in chronological order
                .ToListAsync(ct);
        }

        public async Task<int> GetCountAsync(int chatRoomId, CancellationToken ct = default)
        {
            return await _context.ChatMessages
                .Where(m => m.ChatRoomId == chatRoomId)
                .CountAsync(ct);
        }

        public async Task AddAsync(ChatMessage message, CancellationToken ct = default)
        {
            await _context.ChatMessages.AddAsync(message, ct);
            await _context.SaveChangesAsync(ct);
        }

        public async Task UpdateAsync(ChatMessage message, CancellationToken ct = default)
        {
            _context.ChatMessages.Update(message);
            await _context.SaveChangesAsync(ct);
        }
    }
}
