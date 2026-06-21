using Masarak.Application.Interfaces;
using Masarak.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Masarak.Infrastructure.Persistence.Repositories
{
    public class TeachingAssignmentRepository : ITeachingAssignmentRepository
    {
        private readonly Context _context;

        public TeachingAssignmentRepository(Context context)
        {
            _context = context;
        }

        public async Task<TeachingAssignment?> GetByIdAsync(int id, CancellationToken ct = default)
        {
            return await _context.TeachingAssignments.FindAsync(new object[] { id }, ct);
        }

        public async Task<TeachingAssignment?> GetByIdWithDetailsAsync(int id, CancellationToken ct = default)
        {
            return await _context.TeachingAssignments
                .Include(ta => ta.Teacher).ThenInclude(t => t.User)
                .Include(ta => ta.Subject)
                .Include(ta => ta.Class).ThenInclude(c => c.Grade)
                .FirstOrDefaultAsync(ta => ta.AssignmentId == id, ct);
        }

        public async Task<bool> AssignmentExistsAsync(int teacherId, int classId, int subjectId, int academicYear, CancellationToken ct = default)
        {
            return await _context.TeachingAssignments
                .AnyAsync(ta => ta.TeacherId == teacherId
                    && ta.ClassId == classId
                    && ta.SubjectId == subjectId
                    && ta.AcademicYear == academicYear
                    && ta.IsActive, ct);
        }

        public async Task<IEnumerable<TeachingAssignment>> GetByTeacherIdAsync(int teacherId, int academicYear, CancellationToken ct = default)
        {
            return await _context.TeachingAssignments
                .Include(ta => ta.Teacher).ThenInclude(t => t.User)
                .Include(ta => ta.Subject)
                .Include(ta => ta.Class).ThenInclude(c => c.Grade)
                .Where(ta => ta.TeacherId == teacherId && ta.AcademicYear == academicYear && ta.IsActive)
                .OrderBy(ta => ta.Class.Name)
                .ThenBy(ta => ta.Subject.Name)
                .ToListAsync(ct);
        }

        public async Task<IEnumerable<TeachingAssignment>> GetByClassIdAsync(int classId, int academicYear, CancellationToken ct = default)
        {
            return await _context.TeachingAssignments
                .Include(ta => ta.Teacher).ThenInclude(t => t.User)
                .Include(ta => ta.Subject)
                .Include(ta => ta.Class)
                .Where(ta => ta.ClassId == classId && ta.AcademicYear == academicYear && ta.IsActive)
                .OrderBy(ta => ta.Subject.Name)
                .ToListAsync(ct);
        }

        public async Task AddAsync(TeachingAssignment assignment, CancellationToken ct = default)
        {
            await _context.TeachingAssignments.AddAsync(assignment, ct);
            await _context.SaveChangesAsync(ct);
        }

        public async Task UpdateAsync(TeachingAssignment assignment, CancellationToken ct = default)
        {
            _context.TeachingAssignments.Update(assignment);
            await _context.SaveChangesAsync(ct);
        }
    }
}
