using Masarak.Application.Interfaces;
using Masarak.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Masarak.Infrastructure.Persistence.Repositories
{
    public class StudentClassRepository : IStudentClassRepository
    {
        private readonly Context _context;

        public StudentClassRepository(Context context)
        {
            _context = context;
        }

        public async Task<StudentClass?> GetByIdAsync(int studentClassId, CancellationToken ct = default)
        {
            return await _context.StudentClasses
                .Include(sc => sc.Student).ThenInclude(s => s.User)
                .Include(sc => sc.Class).ThenInclude(c => c.Grade)
                .FirstOrDefaultAsync(sc => sc.StudentClassId == studentClassId, ct);
        }

        public async Task<bool> IsEnrolledAsync(int studentId, int classId, CancellationToken ct = default)
        {
            return await _context.StudentClasses
                .AnyAsync(sc => sc.StudentId == studentId && sc.ClassId == classId && sc.IsActive, ct);
        }

        public async Task<StudentClass?> GetByStudentAndYearAsync(int studentId, int academicYear, CancellationToken ct = default)
        {
            return await _context.StudentClasses
                .Include(sc => sc.Class).ThenInclude(c => c.Grade)
                .FirstOrDefaultAsync(sc => sc.StudentId == studentId
                    && sc.AcademicYear == academicYear
                    && sc.IsActive, ct);
        }

        public async Task<IEnumerable<StudentClass>> GetByStudentIdAsync(int studentId, int academicYear, CancellationToken ct = default)
        {
            return await _context.StudentClasses
                .Include(sc => sc.Class).ThenInclude(c => c.Grade)
                .Where(sc => sc.StudentId == studentId && sc.AcademicYear == academicYear && sc.IsActive)
                .ToListAsync(ct);
        }

        public async Task<IEnumerable<StudentClass>> GetByClassIdAsync(int classId, CancellationToken ct = default)
        {
            return await _context.StudentClasses
                .Include(sc => sc.Student).ThenInclude(s => s.User)
                .Where(sc => sc.ClassId == classId && sc.IsActive)
                .OrderBy(sc => sc.Student.User.FullName)
                .ToListAsync(ct);
        }

        public async Task AddAsync(StudentClass studentClass, CancellationToken ct = default)
        {
            await _context.StudentClasses.AddAsync(studentClass, ct);
            await _context.SaveChangesAsync(ct);
        }

        public async Task UpdateAsync(StudentClass studentClass, CancellationToken ct = default)
        {
            _context.StudentClasses.Update(studentClass);
            await _context.SaveChangesAsync(ct);
        }
    }
}
