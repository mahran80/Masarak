using Masarak.Application.Interfaces;
using Masarak.Domain.Entities;
using Masarak.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Masarak.Infrastructure.Persistence.Repositories
{
    public class SessionRepository : ISessionRepository
    {
        private readonly Context _context;

        public SessionRepository(Context context)
        {
            _context = context;
        }

        public async Task<Session?> GetByIdAsync(int sessionId, CancellationToken ct = default)
        {
            return await _context.Sessions.FindAsync(new object[] { sessionId }, ct);
        }

        public async Task<Session?> GetByIdWithDetailsAsync(int sessionId, CancellationToken ct = default)
        {
            return await _context.Sessions
                .Include(s => s.TeachingAssignment).ThenInclude(ta => ta.Teacher).ThenInclude(t => t.User)
                .Include(s => s.TeachingAssignment).ThenInclude(ta => ta.Subject)
                .Include(s => s.Class)
                .FirstOrDefaultAsync(s => s.SessionId == sessionId, ct);
        }

        public async Task<IEnumerable<Session>> GetByClassIdAsync(int classId, DateTime from, DateTime to, CancellationToken ct = default)
        {
            return await _context.Sessions
                .Include(s => s.TeachingAssignment).ThenInclude(ta => ta.Teacher).ThenInclude(t => t.User)
                .Include(s => s.TeachingAssignment).ThenInclude(ta => ta.Subject)
                .Include(s => s.Class)
                .Where(s => s.ClassId == classId && s.ScheduledAt >= from && s.ScheduledAt <= to)
                .OrderBy(s => s.ScheduledAt)
                .ToListAsync(ct);
        }

        public async Task<IEnumerable<Session>> GetByTeachingAssignmentIdAsync(int assignmentId, CancellationToken ct = default)
        {
            return await _context.Sessions
                .Where(s => s.AssignmentId == assignmentId)
                .OrderBy(s => s.ScheduledAt)
                .ToListAsync(ct);
        }

        public async Task<IEnumerable<Session>> GetUpcomingByClassIdAsync(int classId, DateTime after, CancellationToken ct = default)
        {
            return await _context.Sessions
                .Include(s => s.TeachingAssignment).ThenInclude(ta => ta.Teacher).ThenInclude(t => t.User)
                .Include(s => s.TeachingAssignment).ThenInclude(ta => ta.Subject)
                .Include(s => s.Class)
                .Where(s => s.ClassId == classId
                    && s.ScheduledAt >= after
                    && s.Status != SessionStatus.Cancelled)
                .OrderBy(s => s.ScheduledAt)
                .ToListAsync(ct);
        }

        public async Task<IEnumerable<Session>> GetByTeacherIdAsync(int teacherId, DateTime from, DateTime to, CancellationToken ct = default)
        {
            return await _context.Sessions
                .Include(s => s.TeachingAssignment).ThenInclude(ta => ta.Teacher).ThenInclude(t => t.User)
                .Include(s => s.TeachingAssignment).ThenInclude(ta => ta.Subject)
                .Include(s => s.Class)
                .Where(s => s.TeachingAssignment.TeacherId == teacherId
                    && s.ScheduledAt >= from && s.ScheduledAt <= to)
                .OrderBy(s => s.ScheduledAt)
                .ToListAsync(ct);
        }

        public async Task AddAsync(Session session, CancellationToken ct = default)
        {
            await _context.Sessions.AddAsync(session, ct);
            await _context.SaveChangesAsync(ct);
        }

        public async Task AddRangeAsync(IEnumerable<Session> sessions, CancellationToken ct = default)
        {
            await _context.Sessions.AddRangeAsync(sessions, ct);
            await _context.SaveChangesAsync(ct);
        }

        public async Task UpdateAsync(Session session, CancellationToken ct = default)
        {
            _context.Sessions.Update(session);
            await _context.SaveChangesAsync(ct);
        }

        public async Task UpdateRangeAsync(IEnumerable<Session> sessions, CancellationToken ct = default)
        {
            _context.Sessions.UpdateRange(sessions);
            await _context.SaveChangesAsync(ct);
        }

        public async Task<IEnumerable<Session>> GetBySeriesIdAsync(Guid seriesId, CancellationToken ct = default)
        {
            return await _context.Sessions
                .Where(s => s.SeriesId == seriesId)
                .OrderBy(s => s.ScheduledAt)
                .ToListAsync(ct);
        }

        public async Task<bool> HasConflictAsync(int classId, int teacherId, DateTime start, DateTime end, Guid? excludeSeriesId = null, CancellationToken ct = default)
        {
            var query = _context.Sessions.AsQueryable();

            if (excludeSeriesId.HasValue)
            {
                query = query.Where(s => s.SeriesId != excludeSeriesId.Value);
            }

            // Exclude cancelled sessions from conflict checks
            query = query.Where(s => s.Status != SessionStatus.Cancelled);

            // Fetch raw times into memory is bad, better to use EF functions or just write the raw logic:
            // Since EF Core can't easily translate AddMinutes inside a Where clause for some SQL dialects,
            // but SQL Server translates it. However, it's safer to just check EndTime if we can.
            // Wait, we don't store EndTime, we store DurationMinutes.
            // We can check: s.ScheduledAt < end AND DATEADD(minute, s.DurationMinutes, s.ScheduledAt) > start
            // EF Core translates `AddMinutes` nicely in SQL Server.
            
            return await query.AnyAsync(s =>
                (s.ClassId == classId || s.TeachingAssignment.TeacherId == teacherId) &&
                s.ScheduledAt < end &&
                s.ScheduledAt.AddMinutes(s.DurationMinutes) > start, ct);
        }
    }
}
