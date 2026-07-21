using Masarak.Application.Interfaces;
using Masarak.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Masarak.Infrastructure.Persistence.Repositories
{
    /// <summary>
    /// Phase 4: Repository implementation for Attendance entity.
    /// </summary>
    public class AttendanceRepository : IAttendanceRepository
    {
        private readonly Context _context;

        public AttendanceRepository(Context context)
        {
            _context = context;
        }

        public async Task<Attendance?> GetBySessionAndStudentAsync(int sessionId, int studentUserId, CancellationToken ct = default)
        {
            return await _context.Attendances
                .FirstOrDefaultAsync(a => a.SessionId == sessionId && a.StudentUserId == studentUserId, ct);
        }

        public async Task<IEnumerable<Attendance>> GetBySessionIdAsync(int sessionId, CancellationToken ct = default)
        {
            return await _context.Attendances
                .Include(a => a.Student)
                .Where(a => a.SessionId == sessionId)
                .OrderBy(a => a.Student.FullName)
                .ToListAsync(ct);
        }

        public async Task<IEnumerable<Attendance>> GetByStudentAndSubjectAsync(int studentUserId, int subjectId, int academicYear, CancellationToken ct = default)
        {
            return await _context.Attendances
                .Include(a => a.Session)
                    .ThenInclude(s => s.TeachingAssignment)
                .Where(a => a.StudentUserId == studentUserId
                    && a.Session.TeachingAssignment.SubjectId == subjectId
                    && a.Session.TeachingAssignment.AcademicYear == academicYear)
                .ToListAsync(ct);
        }

        public async Task<IEnumerable<int>> GetStudentsWithoutAttendanceAsync(int sessionId, IEnumerable<int> enrolledStudentUserIds, CancellationToken ct = default)
        {
            var attendedStudentIds = await _context.Attendances
                .Where(a => a.SessionId == sessionId)
                .Select(a => a.StudentUserId)
                .ToListAsync(ct);

            return enrolledStudentUserIds.Except(attendedStudentIds);
        }

        public async Task AddAsync(Attendance attendance, CancellationToken ct = default)
        {
            await _context.Attendances.AddAsync(attendance, ct);
            await _context.SaveChangesAsync(ct);
        }

        public async Task UpdateAsync(Attendance attendance, CancellationToken ct = default)
        {
            _context.Attendances.Update(attendance);
            await _context.SaveChangesAsync(ct);
        }

        public async Task BulkAddAbsentAsync(IEnumerable<Attendance> absences, CancellationToken ct = default)
        {
            await _context.Attendances.AddRangeAsync(absences, ct);
            await _context.SaveChangesAsync(ct);
        }
    }
}
