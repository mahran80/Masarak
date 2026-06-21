using Masarak.Application.Interfaces;
using Masarak.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Masarak.Infrastructure.Persistence.Repositories
{
    public class ClassRepository : IClassRepository
    {
        private readonly Context _context;

        public ClassRepository(Context context)
        {
            _context = context;
        }

        public async Task<Class?> GetByIdAsync(int classId, CancellationToken ct = default)
        {
            return await _context.Classes.FindAsync(new object[] { classId }, ct);
        }

        public async Task<Class?> GetByIdWithGradeAsync(int classId, CancellationToken ct = default)
        {
            return await _context.Classes
                .Include(c => c.Grade)
                .FirstOrDefaultAsync(c => c.ClassId == classId, ct);
        }

        public async Task<IEnumerable<Class>> GetByGradeIdAsync(int gradeId, int academicYear, CancellationToken ct = default)
        {
            return await _context.Classes
                .Include(c => c.Grade)
                .Where(c => c.GradeId == gradeId && c.AcademicYear == academicYear)
                .OrderBy(c => c.Name)
                .ToListAsync(ct);
        }

        public async Task<int> GetEnrollmentCountAsync(int classId, CancellationToken ct = default)
        {
            return await _context.StudentClasses
                .CountAsync(sc => sc.ClassId == classId && sc.IsActive, ct);
        }

        public async Task AddAsync(Class cls, CancellationToken ct = default)
        {
            await _context.Classes.AddAsync(cls, ct);
            await _context.SaveChangesAsync(ct);
        }

        public async Task UpdateAsync(Class cls, CancellationToken ct = default)
        {
            _context.Classes.Update(cls);
            await _context.SaveChangesAsync(ct);
        }
    }
}
